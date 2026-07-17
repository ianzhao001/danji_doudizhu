/**
 * W-AI 口径修订版（规划者修订种子 · 2026-07-17 · sota2）。
 *
 * 落位：Codex 逐字节复制**覆盖** test/ui/s5b-runtime-animation.test.ts，独立 seed commit。
 *
 * ── 相对 S5b 原契约的修订（用户裁决：滚分连打累计 + 终局标签延迟放行）──
 *   ① 终局标签：flushPendingPatternBurst 的 settled 分支不再早退吞标签——改为
 *      「动效关直接 return（零延迟直显）；动效开则 beginSettlementHold 后照常渲染标签」。
 *   ② 滚分：结算分数滚动改为累计列（起点 total−delta，终点 total），
 *      行数据出自 composeSessionRows(result.scores, ctx.sessionTotals())。
 *   ③ 新增接线钉扎：onSettled 先累计后落档；update(dt) 驱动放行窗倒计时；
 *      「再来一局」重置区**不得**清 sessionTotals（连打语义），但必须重置 settlementHold。
 *   其余 S5b 断言逐字保留。
 *
 * ── 预期红（对 main 现实现）── 修订块红 ≈8 条：
 *   flush 仍是 settled 早退（2 红）、renderer 无 composeSessionRows/累计滚动（3 红）、
 *   skeleton 无 onSettled 累计/tick 接线/settlementHold 重置（3 红）。原样保留块全绿。
 *
 * ── 负向变异自证（执行者实现后自查）──
 *   ① 把 flush 改回 `phase()==='settled') return` 旧行为 → 「不得早退」断言红。
 *   ② 滚分起点改回 0 → 累计滚动锚红。
 *   ③ 在 startGame 重置区加 `this.sessionTotals = emptySessionTotals()` → 「再来一局不清累计」红。
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SKELETON = readFileSync(
  new URL('../../assets/scripts/ui/components/game-scene-skeleton.ts', import.meta.url),
  'utf8',
);
const FX = readFileSync(
  new URL('../../assets/scripts/ui/components/game-scene/fx-program.ts', import.meta.url),
  'utf8',
);
const RESULT = readFileSync(
  new URL('../../assets/scripts/ui/components/game-scene/result-overlay-renderer.ts', import.meta.url),
  'utf8',
);
const CARD_ANIMATOR = readFileSync(
  new URL('../../assets/scripts/ui/components/game-scene/card-animator.ts', import.meta.url),
  'utf8',
);
const TWEEN_HELPERS = readFileSync(
  new URL('../../assets/scripts/ui/components/game-scene/tween-helpers.ts', import.meta.url),
  'utf8',
);

function functionBody(source: string, name: string): string {
  const start = source.indexOf(`export function ${name}`);
  if (start < 0) throw new Error(`missing function ${name}`);
  const signatureEnd = source.indexOf('): void {', start);
  if (signatureEnd < 0) throw new Error(`missing void function body ${name}`);
  const open = source.indexOf('{', signatureEnd);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`unclosed function ${name}`);
}

function expectOrder(source: string, first: string, second: string): void {
  const left = source.indexOf(first);
  const right = source.indexOf(second);
  expect(left, `missing ${first}`).toBeGreaterThanOrEqual(0);
  expect(right, `missing ${second}`).toBeGreaterThan(left);
}

function sliceBetween(source: string, startAnchor: string, endAnchor: string): string {
  const start = source.indexOf(startAnchor);
  const end = source.indexOf(endAnchor, start);
  expect(start, `missing slice start ${startAnchor}`).toBeGreaterThanOrEqual(0);
  expect(end, `missing slice end ${endAnchor}`).toBeGreaterThan(start);
  return source.slice(start, end);
}

describe('W-VISION S5b 运行时动画接线契约（W-AI 口径修订版）', () => {
  it('牌型标签只在卡牌编排 settle 后触发，消费 recognize + patternLabel 并在 fx 层自毁', () => {
    expect(SKELETON).toContain('new CardAnimator(() => {');
    expectOrder(SKELETON, 'new CardAnimator(() => {', 'this.flushPendingPatternBurst();');
    expect(SKELETON).toContain("event.type === 'round' && event.event.type === 'play'");
    expect(SKELETON).toContain('if (prepared) {');
    expect(SKELETON).toContain('renderPatternBurstImpl.call(');

    const body = functionBody(FX, 'renderPatternBurst');
    expect(body).toContain('const recognized = recognize(cards);');
    expect(body).toContain('const text = patternLabel(recognized.category);');
    expect(body).toContain('this.ensureFxLayer()');
    expect(body).toContain('`pattern-burst-${seat}-${Date.now()}`');
    expect(body).toContain('RESOURCE_PATHS.patternLabelV19');
    expect(body).toContain('Category.Bomb');
    expect(body).toContain('Category.Rocket');
    expectOrder(body, '.to(params.fadeMs / 1000, { opacity: 0 })', 'node.destroy();');
  });

  it('W-AI 口径②：终局最后一手也弹标签——settled 分支开放行窗而非早退', () => {
    const flush = sliceBetween(SKELETON, 'private flushPendingPatternBurst', 'private showLandlordCeremony');
    expect(flush).toContain("this.runtime?.phase() === 'settled'");
    expect(flush).toContain('beginSettlementHold(this.settings.animation, settlementReveal())');
    expect(flush, '动效关维持旧口径：无标签无延迟直显').toContain('if (!this.settings.animation) return;');
    expect(flush, '终局不得再吞标签（settled 早退已废止）').not.toContain("phase() === 'settled') return");
    expectOrder(flush, 'beginSettlementHold(', 'renderPatternBurstImpl.call(');
    expect(SKELETON).toContain("from '../settlement-reveal'");
  });

  it('Cocos adapter 在每段开始同步 z 与 sibling order，不让纯编排 z 只停留在纸面', () => {
    const body = CARD_ANIMATOR.slice(
      CARD_ANIMATOR.indexOf('private startTrack'),
      CARD_ANIMATOR.indexOf('function applyCardTransform'),
    );
    expect(body).toContain('node.__cardStageZ = segment.to.z;');
    expect(body).toContain('reorderCardLayer(node.parent);');
    expectOrder(body, 'node.__cardStageZ = segment.to.z;', '.to(seconds, {');
  });

  it('结算滚分消费 scoreRollFrames：累计列滚动（起点 total−delta），重渲染不抢写滚动中的 Label', () => {
    expect(RESULT).toContain("import { scoreRollFrames } from '../../score-roll';");
    expect(RESULT).toContain("from '../../session-score'");
    expect(RESULT).toContain('const rows = composeSessionRows(result.scores, ctx.sessionTotals());');
    expect(RESULT).toContain('rows.map((row) => scoreRollFrames(row.total - row.delta, row.total, roll.steps))');
    expect(RESULT, '动画首帧从上局累计起（不再从 0 起）').toContain('scoreTextFor(rows.map((row) => row.total - row.delta))');
    expect(RESULT, '滚分起点回退到 0 即违约').not.toContain('scoreRollFrames(0,');
    expect(RESULT).toContain('const animateResultEntrance = ctx.settings.animation && firstResultRender;');
    expect(RESULT).toContain('rollingScore');
    expect(RESULT).toContain('? existingScoreLabel.string');
    expect(RESULT).toContain(': scoreText,');
    expect(RESULT).toContain('scoreLabel.__scoreRollDone = true;');
    expectOrder(RESULT, 'scoreLabel.string = scoreText;', 'scoreLabel.__scoreRollDone = true;');
  });

  it('W-AI 口径接线：onSettled 先累计后落档；update 驱动放行窗；再来一局不清累计但重置放行窗', () => {
    expect(SKELETON).toContain("from '../session-score'");
    expect(SKELETON).toContain('this.sessionTotals = addRoundScores(this.sessionTotals, finish.settlement.scores);');
    expectOrder(SKELETON, 'this.sessionTotals = addRoundScores', 'commitFinishedRound(');
    expect(SKELETON).toContain('tickSettlementHold(this.settlementHold, deltaMs)');
    expect(SKELETON).toContain('if (holdTick.justExpired) shouldRender = true;');
    const startGameReset = sliceBetween(SKELETON, 'private startGame', 'const storage = cocosStorage()');
    expect(startGameReset, '「再来一局」不得清连打累计（用户裁决：回大厅才清零）').not.toContain('sessionTotals');
    expect(startGameReset, '跨局必须重置放行窗，防上局残留吞面板').toContain('this.settlementHold = { remainingMs: 0 };');
  });

  it('地主帽在 landlordDecided 渲染后触发，挂 fx 层并完成自毁', () => {
    expect(SKELETON).toContain("if (event.type === 'landlordDecided') this.showLandlordCeremony(event);");
    expectOrder(
      SKELETON,
      'this.render({ event: true, startPrepared });',
      "if (event.type === 'landlordDecided') this.showLandlordCeremony(event);",
    );
    expect(SKELETON).toContain('this.cardAnimator.claimAnimationId(id)');
    expect(SKELETON).toContain('renderLandlordCeremonyImpl.call(');

    const body = functionBody(FX, 'renderLandlordCeremony');
    expect(body).toContain('this.ensureFxLayer()');
    expect(body).toContain('`landlord-ceremony-${seat}-${Date.now()}`');
    expect(body).toContain('RESOURCE_PATHS.landlordHatV19');
    expect(body).toContain('animateTransientDropAndDestroy(node, new Vec3(target.x, target.y, 0), params);');
    const helper = functionBody(TWEEN_HELPERS, 'animateTransientDropAndDestroy');
    expect(helper).toContain("easing: 'backOut'");
    expectOrder(helper, '.to(params.fadeMs / 1000, { opacity: 0 })', 'node.destroy();');
  });

  it('新增瞬时动画无随机源，跨局 clearFxLayer 仍逐节点停 tween 并销毁', () => {
    expect(FX).not.toContain('Math.random');
    const clear = functionBody(FX, 'clearFxLayer');
    expect(clear).toContain('Tween.stopAllByTarget(child)');
    expect(clear).toContain('child.removeFromParent();');
    expect(clear).toContain('child.destroy();');
  });
});
