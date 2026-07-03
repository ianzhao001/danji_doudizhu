/**
 * T-FLOW-BID 失败测试（架构种入·不可改）：先发牌后叫抢的可见性契约 + 亮底牌事件 + 逐手存档 rider。
 * 当前 round-runtime 的 biddingDeal() 为架构桩（返回 null）、无 bottomRevealed、persist 仅 enterPlaying
 * 一次 → 应先红，实现到绿。契约见 coordination/tasks/T-FLOW-BID.md。
 *
 * SEED 选择前提：hero(座位0) call 后两 AI 均不抢 → landlord=0（用例内有前提断言，若实现改动导致
 * 前提失效属回归）。levels 全 Simple、thinkingDelayMs=0，全链确定性。
 */
import { describe, expect, it } from 'vitest';
import { AiLevel } from '../../assets/scripts/ai';
import { startRoundRuntime } from '../../assets/scripts/flow/round-runtime';
import type { FlowEvent } from '../../assets/scripts/flow';
import type { Card } from '../../assets/scripts/rules';

const SEED = 11;
const LEVELS: [AiLevel, AiLevel, AiLevel] = [AiLevel.Simple, AiLevel.Simple, AiLevel.Simple];

function cardKey(card: Card): string {
  return `${card.rank}:${card.suit}`;
}

function boot(persist?: () => void) {
  return startRoundRuntime({ seed: SEED, heroSeat: 0, levels: LEVELS, thinkingDelayMs: 0, persist });
}

/** 驱动 hero 走完叫抢：每逢 hero 轮次都取 positive（call/反抢 grab）→ 地主必为 hero(0)。 */
async function driveHeroBiddingAllIn(runtime: ReturnType<typeof boot>): Promise<void> {
  while (runtime.phase() === 'bidding' && runtime.isPlayerTurn()) {
    const inputs = runtime.legalInputs();
    expect(inputs && inputs.length >= 2).toBe(true);
    const res = await runtime.submitPlayerAction(inputs![0]); // [0]=call/grab, [1]=pass
    expect(res.ok).toBe(true);
  }
}

describe('T-FLOW-BID 叫抢期可见性 + 亮底牌 + 逐手存档', () => {
  it('叫抢期 biddingDeal() 暴露英雄 17 张与 [17,17,17]，且不泄露他人手牌/底牌', () => {
    const runtime = boot();
    expect(runtime.phase()).toBe('bidding');
    const view = runtime.biddingDeal();
    expect(view).not.toBeNull();
    expect(view!.viewerHand).toHaveLength(17);
    expect(view!.handCounts).toEqual([17, 17, 17]);
    // 视图形状封闭：只有这两个字段（不泄他人手牌/底牌）
    expect(Object.keys(view!).sort()).toEqual(['handCounts', 'viewerHand']);
    // 副本语义：外部改动不得污染内部
    view!.viewerHand.pop();
    expect(runtime.biddingDeal()!.viewerHand).toHaveLength(17);
    runtime.dispose();
  });

  it('事件序 deal → bid* → landlordDecided → bottomRevealed(3张) → 首个 round；地主 20 张含底牌；离开叫抢后 biddingDeal()=null', async () => {
    const events: FlowEvent[] = [];
    const runtime = boot();
    runtime.onEvent((e) => events.push(e));
    await driveHeroBiddingAllIn(runtime);
    expect(runtime.phase()).toBe('playing');

    const types = events.map((e) => e.type as string);
    const iDeal = types.indexOf('deal');
    const iLd = types.indexOf('landlordDecided');
    const iBr = types.indexOf('bottomRevealed');
    const iRound = types.indexOf('round');
    expect(iDeal, 'deal 事件存在').toBeGreaterThanOrEqual(0);
    expect(iLd, 'landlordDecided 在 deal 之后').toBeGreaterThan(iDeal);
    expect(iBr, 'bottomRevealed 在 landlordDecided 之后').toBeGreaterThan(iLd);
    if (iRound !== -1) expect(iBr, 'bottomRevealed 在首个 round 之前').toBeLessThan(iRound);

    const ld = events[iLd] as Extract<FlowEvent, { type: 'landlordDecided' }>;
    expect(ld.landlord, '驱动前提：hero 全程 positive（call+反抢）→ 地主=0').toBe(0);

    const br = events[iBr] as Extract<FlowEvent, { type: 'bottomRevealed' }>;
    expect(br.cards).toHaveLength(3);

    const snap = runtime.currentSnapshot();
    expect(snap).not.toBeNull();
    expect(snap!.handCounts).toEqual([20, 17, 17]);
    expect(snap!.viewerHand).toHaveLength(20);
    const handKeys = new Set(snap!.viewerHand!.map(cardKey));
    for (const card of br.cards) {
      expect(handKeys.has(cardKey(card)), `底牌 ${cardKey(card)} 已并入地主手`).toBe(true);
    }

    expect(runtime.biddingDeal(), '离开叫抢相后 biddingDeal 归 null').toBeNull();
    runtime.dispose();
  });

  it('persist rider：landlordDecided 前 0 次、进 playing 1 次、之后每成功一手 +1', async () => {
    let persistCalls = 0;
    const runtime = boot(() => {
      persistCalls += 1;
    });
    expect(persistCalls).toBe(0);

    await driveHeroBiddingAllIn(runtime);
    expect(runtime.phase()).toBe('playing');
    expect(persistCalls, '进 playing 基线一次').toBe(1);

    // 驱动前提：hero=地主 → playing 起手轮到 hero → 出第一手，随后 AI 跟牌（每成功一手都应 persist）
    const inputs = runtime.legalInputs();
    expect(inputs && inputs.length > 0).toBe(true);
    const res = await runtime.submitPlayerAction(inputs![0]);
    expect(res.ok).toBe(true);
    expect(persistCalls, '每成功一手后 persist（rider）').toBeGreaterThanOrEqual(2);
    runtime.dispose();
  });
});
