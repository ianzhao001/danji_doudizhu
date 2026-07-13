/**
 * W3-B 采证种子狩猎(授权采证桥,沿 V9 hint-capture 先例:env 门控,基线恒跳过)。
 * 运行:cd test && W3B_HUNT=1 npx vitest run verify/w3b-fx-seed-hunt.test.ts
 *
 * 目的:为真实输入采证挑种子——浏览器探针的 hero 策略与此处 heroProbePolicy 完全同构
 * (领出:有炸打炸/有王炸打王炸/否则最小单;跟牌:最小能大过的单,否则过),
 * 对手与叫抢均为产品 simple AI。筛出:
 *   - bombSeed:hero=地主 且 hero 打出炸弹(理想:同种子胜局,炸弹+彩带一趟采齐);
 *   - rocketSeed:hero=地主 且 hero 打出王炸;
 *   - winSeed:hero=地主 且 结算 scores[0]>0。
 * 输出仅 console(工具态,不入产品);断言仅保证狩猎有产出,防蜕化。
 */
import { describe, expect, it } from 'vitest';
import { runHeadlessRound } from '../../assets/scripts/flow';
import { levelPolicies } from '../../assets/scripts/flow/policies';
import type { BidPolicy, PlayPolicy } from '../../assets/scripts/flow/types';
import { Suit, type Card } from '../../assets/scripts/rules';
import { AiLevel } from '../../assets/scripts/ai/strategy';

const heroProbePlay = (seat: number, snapshot: { top: { seat: number; pattern: { cards: Card[] } } | null; viewerHand?: Card[] }) => {
  const hand = [...(snapshot.viewerHand ?? [])].sort((a, b) => a.rank - b.rank || String(a.suit).localeCompare(String(b.suit)));
  const top = snapshot.top;
  const leading = !top || top.seat === seat;
  const byRank = new Map<number, Card[]>();
  for (const card of hand) {
    const group = byRank.get(card.rank) ?? [];
    group.push(card);
    byRank.set(card.rank, group);
  }
  const bomb = [...byRank.values()].find((group) => group.length === 4);
  const jokers = hand.filter((card) => card.suit === Suit.Joker);
  if (leading) {
    if (bomb) return { type: 'play' as const, seat: seat as 0, cards: bomb };
    if (jokers.length === 2) return { type: 'play' as const, seat: seat as 0, cards: jokers };
    return { type: 'play' as const, seat: seat as 0, cards: [hand[0]] };
  }
  if (top && top.pattern.cards.length === 1) {
    const beat = hand.find((card) => card.rank > top.pattern.cards[0].rank);
    if (beat) return { type: 'play' as const, seat: seat as 0, cards: [beat] };
  }
  return { type: 'pass' as const, seat: seat as 0 };
};

describe.skipIf(!process.env.W3B_HUNT)('W3-B fx 采证种子狩猎(env 门控)', () => {
  it('筛 bomb/rocket/win 种子', async () => {
    const base = levelPolicies([AiLevel.Simple, AiLevel.Simple, AiLevel.Simple]);
    const bidPolicy: BidPolicy = (args) =>
      args.seat === 0
        ? { type: args.state.phase === 'calling' ? 'call' : 'grab', seat: 0 }
        : base.bidPolicy(args);
    const playPolicy: PlayPolicy = (args) =>
      args.seat === 0 ? heroProbePlay(0, args.snapshot as never) : base.playPolicy(args);

    const bombWin: number[] = [];
    const rocket: number[] = [];
    const win: number[] = [];
    const lose: number[] = [];
    for (let seed = 1; seed <= 1200; seed += 1) {
      try {
        const result = await runHeadlessRound({ seed, bidPolicy, playPolicy, maxTurns: 300 });
        if (result.landlord !== 0) continue;
        const events = result.events.flatMap((e) => (e.type === 'round' ? [e.event] : []));
        const heroBomb = events.some((e) => e.type === 'bomb' && e.seat === 0);
        const heroRocket = events.some((e) => e.type === 'rocket' && e.seat === 0);
        const heroWin = result.settlement.scores[0] > 0;
        if (heroWin) win.push(seed);
        else lose.push(seed); // V10:负局录屏(暗角)需 hero 地主败局种子
        if (heroBomb && heroWin) bombWin.push(seed);
        if (heroRocket) rocket.push(seed);
      } catch {
        // 非法动作/超时种子直接跳过(狩猎语义)
      }
    }
    console.log('bomb+win seeds:', bombWin.slice(0, 12));
    console.log('rocket seeds:', rocket.slice(0, 12));
    console.log('win seeds:', win.slice(0, 16));
    console.log('lose seeds:', lose.slice(0, 12));
    expect(win.length).toBeGreaterThan(0);
  }, 300000);
});
