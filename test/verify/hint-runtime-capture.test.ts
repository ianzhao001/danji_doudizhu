/**
 * 提示链路运行时闭合门(Codex R6 裁决 (b))。
 * 静态门(行为契约 + AST 负向不变式 + 整链锁)原理上无法穷尽一个 import 'cc' 的大组件里
 * 任意一行的运行时颠覆(R6 的 `const actions = { ...vm.actions, hint: false }` 即为反例)。
 * 完备证据只能来自真机:coordination/scripts/w-audit-hint-probe.mjs 在冷构建产物上
 * 走完整链路(大厅→难度切困难→开始新局→真实叫抢→hero 回合)后 **CDP 真点击 action-hint**,
 * 录下 skeleton.selected 与当时的快照+历史;本测试离线复算 adviseBestMove 逐张对照——
 * 「按钮点击 → 选中 == 困难档最优推荐」由此端到端闭合。
 *
 * 重采时机(KNOWN_LIMITATIONS 常驻规矩):凡改提示链路(applyHint / hint-flow / 按钮注册 /
 * ctx 绑定 / hard 决策),冷构建收版时必须重跑探针刷新本证据,否则本门守的是旧引擎。
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { adviseBestMove, nextHint } from '../../assets/scripts/ai';
import { pickHint } from '../../assets/scripts/ui/hint-flow';
import type { GameEvent, GameSnapshot } from '../../assets/scripts/game';
import { validatePlay, type Card } from '../../assets/scripts/rules';

const CAPTURE = new URL('../../coordination/reports/W-AUDIT-AI-evidence/hint-capture.json', import.meta.url);

interface HintCapture {
  capturedAt: string;
  difficulty: string;
  capture: { phase: string; playerTurn: boolean; snapshot: GameSnapshot; history: GameEvent[] };
  sel1Cards: Card[];
  sel2Cards: Card[];
  playedCards: Card[];
  pageErrors: string[];
}

const data = JSON.parse(readFileSync(CAPTURE, 'utf8')) as HintCapture;
const keysOf = (cards: Card[]): string[] => cards.map((c) => `${c.rank}:${c.suit}`).sort();

describe('提示链路运行时闭合(真机 CDP 点击采证)', () => {
  it('采证现场:困难档、hero 出牌回合、零 pageErrors', () => {
    expect(data.difficulty).toBe('hard');
    expect(data.capture.phase).toBe('playing');
    expect(data.capture.playerTurn).toBe(true);
    expect(data.pageErrors).toEqual([]);
  });

  it('真实点击提示后的选中 === adviseBestMove(捕获快照+历史) 逐张(端到端闭合)', () => {
    const advised = adviseBestMove({
      snapshot: data.capture.snapshot,
      history: data.capture.history,
    });
    expect(advised, '推荐不应为空').not.toBeNull();
    expect(keysOf(data.sel1Cards)).toEqual(keysOf(advised!.cards));
  });

  it('真实点击结果 === 纯岛 pickHint(首点)——证明 UI 走的确是被契约把守的那条入口', () => {
    const picked = pickHint({
      snapshot: data.capture.snapshot,
      history: data.capture.history,
      selected: [],
    });
    expect(picked).not.toBeNull();
    expect(keysOf(data.sel1Cards)).toEqual(keysOf(picked!.cards));
  });

  it('再点提示 === nextHint 循环产物,且与首点不同', () => {
    const hand = data.capture.snapshot.viewerHand!;
    const top = data.capture.snapshot.top?.pattern ?? null;
    const cycled = nextHint(hand, top, data.sel1Cards);
    expect(cycled).not.toBeNull();
    expect(keysOf(data.sel2Cards)).toEqual(keysOf(cycled!.cards));
    expect(keysOf(data.sel2Cards)).not.toEqual(keysOf(data.sel1Cards));
  });

  it('出牌 === 点击前所选,且 validatePlay 合法', () => {
    expect(keysOf(data.playedCards)).toEqual(keysOf(data.sel2Cards));
    const top = data.capture.snapshot.top?.pattern ?? null;
    expect(validatePlay(data.playedCards, top).ok).toBe(true);
  });

  it('公开底牌通道在真机生效(RoundState v2:快照带 3 张明牌底牌)', () => {
    expect(data.capture.snapshot.bottom).toHaveLength(3);
  });
});
