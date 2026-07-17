/**
 * W-VISION S3 rendering-skeleton source contract.
 * （W-VISION-COLOR-R2 修订：2026-07-16 用户签收「中央托盘移除」——
 *   S5 的空态托盘契约〔showEmptyHint / play-tray-empty-label / tray opacity〕
 *   随裁决退役，改为**反向门**：play-area-renderer 零托盘残留、skeleton 零
 *   playTray 键消费、fx 命中根 play-area-runtime 保留。其余 S3/S5 断言逐字保留。）
 * （W-AI 口径②修订：2026-07-17 用户裁决「终局最后一手也显示牌型标签」——
 *   结算共享门升级为〔飞行中 ∨ 放行窗持有中〕都不放行：
 *   `const visibleResult = this.cardAnimator.isBusy() || isHoldingSettlement(this.settlementHold) ? null : vm.result;`
 *   自证段同步换正例，并新增变异例：**去掉放行窗检查的旧门必须被判 false**
 *   （否则「末牌飞完立即抢渲面板压住标签」的回退无门可拦）。其余断言逐字保留。）
 *
 * The Cocos adapter cannot be imported in Vitest's Node runtime. This gate
 * therefore locks the thin wiring around the behavior-tested pure islands.
 * Per W-VISION trap ⑨, the first test self-certifies every I/O path and proves
 * the mutation predicate catches a deliberately broken physical-card name.
 *
 * 落位：Codex 逐字节复制**覆盖** test/ui/card-render-contract.test.ts，独立 seed commit。
 * 预期红（对 main 现实现，预跑实测）：「R2 追认」+ T3 共 2 用例红（visibleResult 新锚缺失）；
 * 门自证用例为纯内联夹具、对 main 即绿（其变异判据已含「去掉放行窗的旧门必须为 false」）。
 * 负向变异自证：实现后把 render 的门改回旧行 `isBusy() ? null : vm.result` → 本文件红 ≥2（门谓词+toContain）。
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import ts from 'typescript';

const FILES = {
  skeleton: new URL('../../assets/scripts/ui/components/game-scene-skeleton.ts', import.meta.url),
  choreography: new URL('../../assets/scripts/ui/card-choreography.ts', import.meta.url),
  cardStage: new URL('../../assets/scripts/ui/card-stage.ts', import.meta.url),
  animator: new URL('../../assets/scripts/ui/components/game-scene/card-animator.ts', import.meta.url),
  cardNode: new URL('../../assets/scripts/ui/components/game-scene/card-node.ts', import.meta.url),
  playArea: new URL('../../assets/scripts/ui/components/game-scene/play-area-renderer.ts', import.meta.url),
  helpers: new URL('../../assets/scripts/ui/components/game-scene/ui-runtime-helpers.ts', import.meta.url),
  tweenHelpers: new URL('../../assets/scripts/ui/components/game-scene/tween-helpers.ts', import.meta.url),
  feedback: new URL('../../assets/scripts/ui/components/game-scene/runtime-feedback.ts', import.meta.url),
  result: new URL('../../assets/scripts/ui/components/game-scene/result-overlay-renderer.ts', import.meta.url),
  seats: new URL('../../assets/scripts/ui/components/game-scene/seats-renderer.ts', import.meta.url),
  evidence: new URL('../../coordination/scripts/s4-evidence.mjs', import.meta.url),
} as const;

type Sources = Record<keyof typeof FILES, string>;

function readSources(): Sources {
  return Object.fromEntries(Object.entries(FILES).map(([name, url]) => {
    let source: string;
    try {
      source = readFileSync(url, 'utf8');
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`W-VISION S3 gate I/O path unreachable: ${name} -> ${url.pathname}: ${detail}`);
    }
    if (source.length === 0) throw new Error(`W-VISION S3 gate read an empty source: ${name}`);
    return [name, source];
  })) as Sources;
}

function unstablePhysicalCardNames(source: string): string[] {
  return source.split('\n').filter((line) => (
    /`card-\$\{[^}]*index[^}]*\}-\$\{[^}]*cardKey/.test(line)
  ));
}

function sourceFile(source: string): ts.SourceFile {
  return ts.createSourceFile('contract.ts', source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
}

function methodText(source: string, name: string): string {
  const sf = sourceFile(source);
  let found: ts.MethodDeclaration | null = null;
  const visit = (node: ts.Node): void => {
    if (ts.isMethodDeclaration(node) && node.name.getText(sf) === name) {
      if (found) throw new Error(`duplicate method in contract source: ${name}`);
      found = node;
    }
    node.forEachChild(visit);
  };
  visit(sf);
  if (!found) throw new Error(`method not found in contract source: ${name}`);
  return (found as ts.MethodDeclaration).getText(sf);
}

function functionText(source: string, name: string): string {
  const sf = sourceFile(source);
  let found: ts.FunctionDeclaration | null = null;
  const visit = (node: ts.Node): void => {
    if (ts.isFunctionDeclaration(node) && node.name?.getText(sf) === name) {
      if (found) throw new Error(`duplicate function in contract source: ${name}`);
      found = node;
    }
    node.forEachChild(visit);
  };
  visit(sf);
  if (!found) throw new Error(`function not found in contract source: ${name}`);
  return (found as ts.FunctionDeclaration).getText(sf);
}

function ifBlockText(source: string, condition: string): string {
  const sf = sourceFile(source);
  let found: ts.IfStatement | null = null;
  const visit = (node: ts.Node): void => {
    if (ts.isIfStatement(node) && node.expression.getText(sf) === condition) {
      if (found) throw new Error(`duplicate if block in contract source: ${condition}`);
      found = node;
    }
    node.forEachChild(visit);
  };
  visit(sf);
  if (!found) throw new Error(`if block not found in contract source: ${condition}`);
  return (found as ts.IfStatement).thenStatement.getText(sf);
}

function extractStringArray(source: string, constName: string): string[] {
  const match = source.match(new RegExp(`const ${constName} = \\[([\\s\\S]*?)\\];`));
  if (!match) throw new Error(`${constName} not found in source`);
  return [...match[1].replace(/\/\/.*$/gm, '').matchAll(/'([^']+)'/g)].map((row) => row[1]);
}

// R2 反向门：渲染器不得残留托盘节点名 / 托盘键 / 空态文案键。
// （'tutorial.playArea' 字符串本身仍被 lobby 冻结教程合法持有——本门只扫 play-area-renderer。）
const TRAY_RESIDUE = /play-tray|playTray|tutorial\.playArea/;

function hasTrayResidue(source: string): boolean {
  return TRAY_RESIDUE.test(source);
}

function hasSharedVisibleResultGate(source: string): boolean {
  return source.includes('const visibleResult = this.cardAnimator.isBusy() || isHoldingSettlement(this.settlementHold) ? null : vm.result;')
    && source.includes('if (visibleResult) this.hideSettlementSceneChrome();')
    && source.includes('this.renderResult(visibleResult, handCounts, layout, canvas);');
}

function expectOrder(source: string, first: string, second: string, message: string): void {
  const left = source.indexOf(first);
  const right = source.indexOf(second);
  expect(left, `${message}: missing first anchor ${first}`).toBeGreaterThanOrEqual(0);
  expect(right, `${message}: missing second anchor ${second}`).toBeGreaterThan(left);
}

describe('W-VISION S3 rendering skeleton contract', () => {
  it('门自证：12 条 I/O 路径可达、AST 能定位真方法、坏的 index 身份必被判据抓住', () => {
    const sources = readSources();
    for (const [name, source] of Object.entries(sources)) {
      expect(source.length, `I/O SELF-CHECK OK: ${name} readable and non-empty`).toBeGreaterThan(80);
    }
    expect(methodText('class Probe { render(): void { const ok = true; void ok; } }', 'render'))
      .toContain('const ok = true');
    expect(unstablePhysicalCardNames('const name = `card-${index}-${cardKey}`;'),
      'MUTATION SELF-CHECK OK: index-based physical identity must be rejected').toHaveLength(1);
    expect(unstablePhysicalCardNames('const name = `card:${cardKey}`;')).toEqual([]);
    expect(hasTrayResidue("this.addLabel(t('tutorial.playArea'), 0, 0, 'meta', area, 120, 24, 'play-tray-empty-label', TABLE_TEXT);"),
      'MUTATION SELF-CHECK OK: resurrected empty-state tray label must be caught').toBe(true);
    expect(hasTrayResidue("this.addSkinnedSprite(RESOURCE_PATHS.playTrayC1, tray, w, h, true);"),
      'MUTATION SELF-CHECK OK: resurrected tray skin consumption must be caught').toBe(true);
    expect(hasTrayResidue("const area = this.ensureNode('play-area-runtime', this.uiRoot!);"),
      'MUTATION SELF-CHECK OK: the retained fx root must not trip the residue detector').toBe(false);
    expect(hasSharedVisibleResultGate(
      'const visibleResult = this.cardAnimator.isBusy() || isHoldingSettlement(this.settlementHold) ? null : vm.result; '
      + 'if (visibleResult) this.hideSettlementSceneChrome(); '
      + 'this.renderResult(visibleResult, handCounts, layout, canvas);',
    )).toBe(true);
    expect(hasSharedVisibleResultGate(
      'const visibleResult = this.cardAnimator.isBusy() ? null : vm.result; '
      + 'if (visibleResult) this.hideSettlementSceneChrome(); '
      + 'this.renderResult(visibleResult, handCounts, layout, canvas);',
    ), 'MUTATION SELF-CHECK OK: dropping the settlement hold lets the panel outrun the final pattern burst').toBe(false);
    expect(hasSharedVisibleResultGate(
      'const visibleResult = vm.result; if (visibleResult) this.hideSettlementSceneChrome(); '
      + 'this.renderResult(visibleResult, handCounts, layout, canvas);',
    ), 'MUTATION SELF-CHECK OK: scene chrome may not disappear during the final flight').toBe(false);
  });

  it('R2 追认：中央托盘退役——渲染器零托盘残留（反向门），结算隐藏精确席位根且顺序不被 render 复活', () => {
    const s = readSources();
    const playArea = functionText(s.playArea, 'renderPlayAreaFxTarget');
    const render = methodText(s.skeleton, 'render');
    const visibleChromeBlock = ifBlockText(render, 'visibleResult');
    const hiddenHud = extractStringArray(s.helpers, 'SETTLEMENT_TRANSIENT_HUD_NODE_NAMES');
    const hiddenChrome = extractStringArray(s.helpers, 'SETTLEMENT_SCENE_CHROME_NODE_NAMES');

    expect(s.cardStage).toContain("placement.zone === 'table'");
    // R2 反向门：整份 play-area-renderer 与 skeleton 零托盘残留（节点名/键名/空态文案键）。
    expect(hasTrayResidue(s.playArea),
      'play-area-renderer must carry no tray residue (play-tray / playTray key / tutorial.playArea)').toBe(false);
    expect(hasTrayResidue(s.skeleton),
      'game-scene-skeleton (incl. preload table) must carry no playTray key consumption').toBe(false);
    // fx 命中根保留——去托盘去的是皮和空态文案，不是 FX 锚点。
    expect(playArea).toContain("this.ensureNode('play-area-runtime', this.uiRoot!)");
    expect(render).toContain('this.renderPlayAreaFxTarget(layout, canvas, nextCardStage, phase);');

    const expectedChrome = [
      'seat-hero',
      'seat-hero-nameplate',
      'seat-left-nameplate',
      'seat-right-nameplate',
    ];
    expect(hiddenChrome).toEqual(expectedChrome);
    for (const name of expectedChrome) {
      expect(hiddenChrome, `settled suppression missing exact root ${name}`).toContain(name);
      expect(hiddenHud, `scene chrome leaked into early phase-based HUD suppression: ${name}`).not.toContain(name);
    }
    expect(hasSharedVisibleResultGate(render)).toBe(true);
    expect(render.match(/this\.hideSettlementSceneChrome\(\)/g) ?? []).toHaveLength(1);
    expect(visibleChromeBlock).toContain('this.hideSettlementSceneChrome();');
    expectOrder(render, 'this.renderSeats(', 'this.hideSettlementSceneChrome()',
      'scene chrome suppression must run after ensureNode reactivates seat roots');
    expectOrder(render, 'this.hideSettlementSceneChrome()', 'this.renderResult(',
      'seat chrome must be suppressed before settlement overlay renders');
  });

  it('T0/T1：cardKey 是稳定身份，三种物理牌只经常驻 card-layer-runtime 渲染', () => {
    const s = readSources();
    expect(s.animator).toContain("export const CARD_RUNTIME_NODE_PREFIX = 'card:';");
    expect(s.cardNode).toContain('this.ensureNode(cardRuntimeNodeName(placement.key), parent)');
    expect(unstablePhysicalCardNames(`${s.cardNode}\n${s.playArea}\n${s.skeleton}`)).toEqual([]);
    expect(s.playArea).toContain("this.ensureNode('card-layer-runtime', this.uiRoot!)");
    expect(s.playArea).toContain('this.renderStageCard(placement, layer)');
    expect(s.skeleton).toContain('this.renderBottomCardsDock(');
    expect(s.skeleton).toContain('this.renderCardStage(nextCardStage)');
    expect(s.skeleton).not.toMatch(/\baddCard(?:Node)?\b/);
    expect(s.playArea).not.toContain("this.ensureNode('hand-cards-runtime'");
    expect(s.cardStage).toContain('Array.from(chosen.values())');
    expect(s.cardStage).not.toContain('[...chosen.values()]');
  });

  it('T2 所有权：render 仍写内容/存在性，但 owned 时不写根 transform/opacity；prune 豁免', () => {
    const s = readSources();
    const renderStageCard = s.cardNode.slice(
      s.cardNode.indexOf('export function renderStageCard'),
      s.cardNode.indexOf('export function addDisplayCard'),
    );
    expect(renderStageCard).toContain('const node = this.ensureNode(');
    expect(renderStageCard).toContain('if (!owned) applyPlacementTransform(node, placement);');
    expect(renderStageCard).toContain('renderCardContent.call(this, node, placement.card, placement.faceUp, interactive);');
    expectOrder(renderStageCard, 'if (!owned) applyPlacementTransform', 'renderCardContent.call',
      'content refresh must remain outside the ownership guard');
    expect(s.helpers).toContain("parent.name === 'card-layer-runtime'");
    expect(s.helpers).toContain('this.cardAnimator?.owns(ownedCardKey)');
    expect(s.helpers).toContain('!this.cardAnimator?.isAnimating()');
    expect(s.playArea).toContain('if (!this.cardAnimator?.isAnimating()) node.setSiblingIndex(index);');
    const prune = s.helpers.slice(
      s.helpers.indexOf('export function pruneInactiveChildren'),
      s.helpers.indexOf('export function hideSceneScaffold'),
    );
    expectOrder(prune, 'this.cardAnimator?.owns(ownedCardKey)', 'this.markLiveSubtree(child)',
      'owned card must be retained before prune can destroy it');
    expect(s.animator).toContain('new CardAnimationLifecycle(sink, onSettled)');
    expectOrder(methodText(s.choreography, 'settleAll'), 'this.sink.apply(', 'this.ownedKeys.clear()',
      'settle must snap authoritative terminal before ownership release');
  });

  it('T3/R1–R4：事件回调做 diff/认领，render 不规划；新 id 先 settle；instant 同路；busy 禁按钮', () => {
    const s = readSources();
    const prepare = methodText(s.skeleton, 'prepareCardEvent');
    const render = methodText(s.skeleton, 'render');
    expect(prepare).toContain('planCardChoreography({');
    expect(prepare).toContain('this.settings.animation ? choreography : instant(choreography)');
    expect(render).not.toContain('planCardChoreography');
    expect(s.skeleton).toContain('const startPrepared = this.prepareCardEvent(event);');
    expect(s.skeleton).toContain("if (event.type === 'bottomRevealed') void Promise.resolve().then(renderEvent);");
    expect(s.skeleton).toContain("this.ensureNode('anim-busy-runtime', this.uiRoot)");
    expect(s.helpers).toContain('enabled = enabled && !this.cardAnimator?.isBusy();');
    const lifecyclePrepare = methodText(s.choreography, 'prepare');
    expectOrder(lifecyclePrepare, 'this.settleAll(false)', 'this.ownedKeys = new Set',
      'R2 changed id must settle before new claim');
    expect(s.choreography).toContain('decideCardChoreographyStart(this.lastStartedId, choreography)');
    expect(s.skeleton).toContain('const visibleResult = this.cardAnimator.isBusy() || isHoldingSettlement(this.settlementHold) ? null : vm.result;');
    expect(s.skeleton).toContain('this.renderResult(visibleResult, handCounts, layout, canvas);');
  });

  it('旧去重/计时 hack 清零；game 组件零 @property；64×90 与牌点数/精灵门锚不回退', () => {
    const s = readSources();
    const product = Object.entries(s)
      .filter(([name]) => name !== 'evidence')
      .map(([, source]) => source)
      .join('\n');
    for (const retired of [
      'lastHandSignature', 'lastPlayAreaSignature', 'animatedResultKey', 'animatedToastIds',
      'dealAnimationLockMs', 'pendingPlayFlightSeat', 'lastBottomCardsSignature', 'renderedSelectedCardKeys',
    ]) {
      expect(product.includes(retired), `retired presentation hack still present: ${retired}`).toBe(false);
    }
    expect(s.skeleton.match(/@property\b/g) ?? []).toHaveLength(0);
    expect(s.cardNode).toContain('export const CARD_SIZE = { width: 64, height: 90 };');
    expect(s.cardNode).toContain("'card-rank-label'");
    expect(s.cardNode).toContain('this.fitSpriteInBox(');
  });

  it('采证接线：终态截图等 busy=false，中段观察 true→false，三局后查牌层回稳与 fx 清空', () => {
    const { evidence } = readSources();
    const playLoopStart = evidence.indexOf('const playToSettled = async () =>');
    const playLoop = evidence.slice(playLoopStart, evidence.indexOf('\n  return {', playLoopStart));
    expect(evidence).toContain('await waitForAnimationIdle();');
    expect(evidence).toContain("await has('anim-busy-runtime')");
    expect(evidence).toContain('await s.waitForAnimationBusy();');
    expect(evidence).toContain('await s.waitForCardFlightMid(');
    expect(evidence).toContain('mid.marker === marker');
    expect(evidence).toContain("'card-flight-mid-844x390.png'");
    expect(evidence).toContain("s.evalIn('runtimeHandCards()')");
    expect(evidence).toContain('function enabledButtonPoint(nameOrLabel)');
    for (const action of ['action-must-pass', 'action-hint', 'action-play', 'action-pass']) {
      expect(playLoop).toContain(`enabledButtonPoint('${action}')`);
    }
    expect(playLoop).not.toContain("btnPoint('出牌')");
    expect(evidence).toContain('for (let round = 0; round < 3; round += 1)');
    expect(evidence).toContain("s.evalIn('cardLayerCensus()')");
    expect(evidence).toContain('row.totalChildren === row.count');
    expect(evidence).toContain("s.evalIn('fxCensus()')");
  });
});
