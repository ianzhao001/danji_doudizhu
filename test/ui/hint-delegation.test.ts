/**
 * UI 提示委托链契约(Codex R1 阻断③补门;R2-R5 对抗演进史:
 * 文本正则→被合法改写绕过→行为契约+文本壳→被 barrel 别名/吞历史绕过→标识符封锁+导入锁
 * →被结果覆盖绕过→全文钉死→被注释假方法抢占提取、入口回调空操作绕过→本版)。
 * 现行两层:
 *   ① 行为契约:pickHint(纯岛 ui/hint-flow.ts)在真实牌局上与 adviseBestMove/nextHint
 *      深相等 + 首点判别性 + 历史敏感性——决策语义在 node 直接可证;
 *   ② 源码契约(TypeScript AST,Codex R5 建议):注释/字符串对解析器不可见,按真实节点
 *      打印(removeComments)——applyHint 真身唯一且逐字等于规范体;pickHint 恰两处
 *      (锁源 import+调用);提示原语标识符零出现;入口链整链锁定(按钮 cb→ctx 绑定→方法)。
 * 维护口径:合法修改 applyHint/入口链必须同评审更新本文件规范体(门禁文件同款纪律)。
 * 残余披露:蓄意在纯岛 hint-flow 之外重写整套决策并同步伪造本文件属主动破坏,超出疏漏范畴。
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as ts from 'typescript';
import { AiLevel, adviseBestMove, nextHint, strategyFor } from '../../assets/scripts/ai';
import { pickHint } from '../../assets/scripts/ui/hint-flow';
import { apply, createPlayingRound, snapshot, type GameEvent } from '../../assets/scripts/game';
import { createRng, deal, type Card } from '../../assets/scripts/rules';

const SKELETON_SRC = new URL(
  '../../assets/scripts/ui/components/game-scene-skeleton.ts',
  import.meta.url,
);
const RENDERER_SRC = new URL(
  '../../assets/scripts/ui/components/game-scene/bid-actions-renderer.ts',
  import.meta.url,
);

const SEEDS = Array.from({ length: 40 }, (_, i) => i + 1);
const keysOf = (cards: Card[]): string => cards.map((c) => `${c.rank}:${c.suit}`).sort().join(',');

function leadSnapshot(seed: number) {
  const state = createPlayingRound(deal(createRng(seed)), 0);
  return snapshot(state, 0); // viewer=地主=turn,首出局面
}

describe('pickHint 行为契约(纯岛,真实牌局)', () => {
  it('首点(无选中)逐 seed 深相等 adviseBestMove', () => {
    for (const seed of SEEDS) {
      const snap = leadSnapshot(seed);
      expect(pickHint({ snapshot: snap, history: [], selected: [] }))
        .toEqual(adviseBestMove({ snapshot: snap, history: [] }));
    }
  });

  it('判别性:存在首点推荐 ≠ nextHint 首选的局面,且首点取的是推荐侧(变异绊线)', () => {
    // 若把首点实际改走 nextHint(Codex R1 复审的变异),本断言在行为层直接红。
    let discriminating = 0;
    for (const seed of SEEDS) {
      const snap = leadSnapshot(seed);
      const advised = adviseBestMove({ snapshot: snap, history: [] });
      const cycled = nextHint(snap.viewerHand!, null, undefined);
      expect(advised, `seed ${seed} 首出局面推荐不应为空`).not.toBeNull();
      if (cycled && keysOf(advised!.cards) !== keysOf(cycled.cards)) {
        discriminating += 1;
        expect(keysOf(pickHint({ snapshot: snap, history: [], selected: [] })!.cards))
          .toBe(keysOf(advised!.cards));
      }
    }
    expect(discriminating, '40 个种子局面里应存在推荐≠循环首选的判别用例').toBeGreaterThan(0);
  });

  it('已有选中:逐 seed 深相等 nextHint(hand, top, prev) 循环换手', () => {
    for (const seed of SEEDS.slice(0, 10)) {
      const snap = leadSnapshot(seed);
      const first = nextHint(snap.viewerHand!, null, undefined)!;
      expect(pickHint({ snapshot: snap, history: [], selected: first.cards }))
        .toEqual(nextHint(snap.viewerHand!, null, first.cards));
    }
  });

  it('无 viewerHand → null(壳的空手守卫之外的纯层兜底)', () => {
    const { viewerHand: _dropped, ...rest } = leadSnapshot(1);
    expect(pickHint({ snapshot: rest, history: [], selected: [] })).toBeNull();
  });

  it('历史敏感性:存在富历史推荐 ≠ 空历史推荐的局面,且 pickHint 用的是真历史(Codex R3 漏口②绊线)', () => {
    // 若 pickHint 内部把 history 吞成 [](R3 变异),本断言在行为层直接红——
    // hard 的记牌路径(绝对大接管/必胜看破)只在真历史下触发。
    // 确定性推演:三席全 Simple 走子积累真实事件,在 hero(0 席)回合比对两种历史下的推荐。
    const simple = strategyFor(AiLevel.Simple);
    const stubRng = { next: () => 0 };
    let found = false;
    outer: for (let seed = 1; seed <= 30; seed++) {
      let state = createPlayingRound(deal(createRng(seed)), 0);
      const events: GameEvent[] = [];
      for (let ply = 0; ply < 60 && state.phase !== 'settled'; ply++) {
        const snap = snapshot(state, state.turn);
        if (state.turn === 0 && events.length > 0) {
          const withHistory = adviseBestMove({ snapshot: snap, history: events });
          const withoutHistory = adviseBestMove({ snapshot: snap, history: [] });
          const differs =
            (withHistory === null) !== (withoutHistory === null) ||
            (withHistory !== null && withoutHistory !== null &&
              keysOf(withHistory.cards) !== keysOf(withoutHistory.cards));
          if (differs) {
            const picked = pickHint({ snapshot: snap, history: events, selected: [] });
            expect(picked === null ? null : keysOf(picked.cards))
              .toBe(withHistory === null ? null : keysOf(withHistory.cards));
            found = true;
            break outer;
          }
        }
        const action = simple(snap, stubRng, events);
        const result = apply(state, action);
        state = result.state;
        events.push(...result.events);
      }
    }
    expect(found, '30 个种子推演里应存在「富历史≠空历史」的判别局面').toBe(true);
  });
});

// ── 源码契约(TypeScript AST) ──────────────────────────────────────────────
const printer = ts.createPrinter({ removeComments: true });

function parseSource(url: URL): ts.SourceFile {
  return ts.createSourceFile('src.ts', readFileSync(url, 'utf8'), ts.ScriptTarget.ES2022, true);
}

function printNorm(node: ts.Node, sf: ts.SourceFile): string {
  return printer.printNode(ts.EmitHint.Unspecified, node, sf).replace(/\s+/g, ' ').trim();
}

function collectNodes<T extends ts.Node>(sf: ts.SourceFile, match: (n: ts.Node) => n is T): T[] {
  const out: T[] = [];
  const visit = (n: ts.Node): void => {
    if (match(n)) out.push(n);
    n.forEachChild(visit);
  };
  visit(sf);
  return out;
}

/**
 * 语句所处的「可达性守卫」:向上收集到最近函数体为止的全部 if 条件与循环/分支包裹。
 * Codex R5 曾问、R6 又验证过的下一跳:只看最近祖先 if 会被「if(SHOW_X){ if(false){…} }」
 * 或 `if (false && cond)` 欺骗;故全链收集并逐条比对,循环/switch/三元包裹一律禁止。
 */
function reachGuards(node: ts.Node, sf: ts.SourceFile): { ifs: string[]; wraps: string[] } {
  const ifs: string[] = [];
  const wraps: string[] = [];
  let cur: ts.Node | undefined = node.parent;
  while (cur && !ts.isSourceFile(cur) && !ts.isMethodDeclaration(cur) && !ts.isFunctionDeclaration(cur)) {
    if (ts.isIfStatement(cur)) ifs.push(printNorm(cur.expression, sf));
    if (
      ts.isWhileStatement(cur) || ts.isDoStatement(cur) || ts.isForStatement(cur) ||
      ts.isForOfStatement(cur) || ts.isForInStatement(cur) || ts.isSwitchStatement(cur) ||
      ts.isConditionalExpression(cur) || ts.isBinaryExpression(cur)
    ) {
      wraps.push(ts.SyntaxKind[cur.kind]);
    }
    cur = cur.parent;
  }
  return { ifs, wraps };
}

describe('薄壳与入口链源码契约(TypeScript AST——注释假方法/字符串对解析器不可见)', () => {
  const skeleton = parseSource(SKELETON_SRC);
  const renderer = parseSource(RENDERER_SRC);

  it('applyHint 真身唯一,去注释打印后逐字等于规范体(单写 selected/禁改 move/禁追加语句)', () => {
    const methods = collectNodes(skeleton, (n): n is ts.MethodDeclaration =>
      ts.isMethodDeclaration(n) && n.name.getText(skeleton) === 'applyHint');
    expect(methods, 'applyHint 类方法必须恰一个(注释里的假方法不是节点)').toHaveLength(1);
    expect(printNorm(methods[0], skeleton)).toBe(
      'private applyHint(): void { if (!this.runtime) return; ' +
        'const snapshot = this.runtime.currentSnapshot(); ' +
        'if (!snapshot?.viewerHand || !this.runtime.isPlayerTurn()) return; ' +
        'const move = pickHint({ snapshot, history: this.fullGameEvents, selected: this.selected }); ' +
        'if (!move) return; this.selected = move.cards.slice(); this.render(); }',
    );
  });

  it('applyHint 不可被遮蔽/改写:标识符恰 3 处且位置白名单,零字符串访问,零成员赋值(Codex R6 阻断①)', () => {
    // Codex R6 阻断①:钉死孤立节点管不住「文件里别处随手加一行」——onLoad 里
    // `this.applyHint = (): void => {};` 用实例属性遮蔽原型方法,typecheck 过、旧门全绿、
    // 但按钮点击彻底失效。修法换成负向不变式:任何对成员 applyHint 的写入都不允许存在。
    const ids = collectNodes(skeleton, (n): n is ts.Identifier =>
      ts.isIdentifier(n) && n.text === 'applyHint');
    const positions = ids.map((id) => {
      const p = id.parent;
      if (ts.isMethodDeclaration(p) && p.name === id) return 'method-name';
      if (ts.isPropertyAssignment(p) && p.name === id) return 'ctx-binding-key';
      if (ts.isPropertyAccessExpression(p) && p.name === id) return 'property-access';
      return `ILLEGAL:${ts.SyntaxKind[p.kind]}`;
    });
    // 三处 = 方法声明名 + rendererContext 绑定键名 + 该绑定里的 this.applyHint 访问。
    expect(positions.sort()).toEqual(['ctx-binding-key', 'method-name', 'property-access']);

    // 禁 this['applyHint'] = … / Object.defineProperty(this, 'applyHint', …)
    const literals = collectNodes(skeleton, (n): n is ts.StringLiteral =>
      ts.isStringLiteral(n) && n.text === 'applyHint');
    expect(literals, "禁字符串形式访问 'applyHint'").toHaveLength(0);

    // 禁一切对成员 applyHint 的赋值(=, ??=, ||= …)
    const writes = collectNodes(skeleton, (n): n is ts.BinaryExpression => {
      if (!ts.isBinaryExpression(n)) return false;
      const isAssign = n.operatorToken.kind >= ts.SyntaxKind.FirstAssignment
        && n.operatorToken.kind <= ts.SyntaxKind.LastAssignment;
      if (!isAssign) return false;
      const lhs = n.left;
      return (ts.isPropertyAccessExpression(lhs) && lhs.name.text === 'applyHint')
        || (ts.isElementAccessExpression(lhs) && ts.isStringLiteral(lhs.argumentExpression)
          && lhs.argumentExpression.text === 'applyHint');
    });
    expect(writes.map((w) => printNorm(w, skeleton)), '禁遮蔽/改写 applyHint').toEqual([]);
  });

  it('pickHint 标识符恰两处:../hint-flow 具名 import(禁别名) + 调用', () => {
    const ids = collectNodes(skeleton, (n): n is ts.Identifier =>
      ts.isIdentifier(n) && n.text === 'pickHint');
    expect(ids).toHaveLength(2);
    const importSpec = ids.map((id) => id.parent).find(ts.isImportSpecifier);
    expect(importSpec, 'pickHint 必须经具名 import 进入').toBeTruthy();
    expect(importSpec!.propertyName, '禁 as 别名顶替').toBeUndefined();
    const importDecl = importSpec!.parent.parent.parent;
    expect(
      ts.isImportDeclaration(importDecl) ? importDecl.moduleSpecifier.getText(skeleton) : null,
      '导入源锁定为纯岛',
    ).toBe("'../hint-flow'");
    expect(ids.map((id) => id.parent).some(ts.isCallExpression), '另一处必须是调用').toBe(true);
  });

  it('skeleton 零提示原语标识符(AST 级,barrel 别名进口也是标识符,必现形)', () => {
    const banned = new Set(['adviseBestMove', 'nextHint', 'hintSuggestions', 'bestHint', 'rankHints']);
    const hits = collectNodes(skeleton, (n): n is ts.Identifier =>
      ts.isIdentifier(n) && banned.has(n.text));
    expect(hits.map((h) => h.text)).toEqual([]);
  });

  it('renderer context 绑定唯一且恰为 this.applyHint.bind(this)(入口链③)', () => {
    const props = collectNodes(skeleton, (n): n is ts.PropertyAssignment =>
      ts.isPropertyAssignment(n) && n.name.getText(skeleton) === 'applyHint');
    expect(props).toHaveLength(1);
    expect(printNorm(props[0].initializer, skeleton)).toBe('this.applyHint.bind(this)');
  });

  it('入口链②·skeleton 侧:使能量与转发调用逐字锁定,且只受 phase==="playing" 守卫(Codex R6 阻断②同类,上游一并封)', () => {
    // Codex R7 静态样例(非阻断·登记):`const actions = { ...vm.actions, hint: false };`
    // 这类上游中间变量改写在静态面无穷无尽——运行时闭合门(test/verify/hint-runtime-capture)
    // 才是完备证据。此处顺手锁住已知的中间变量,静态门只作疏漏级拦截器。
    const actionsVar = collectNodes(skeleton, (n): n is ts.VariableDeclaration =>
      ts.isVariableDeclaration(n) && n.name.getText(skeleton) === 'actions');
    expect(actionsVar).toHaveLength(1);
    expect(printNorm(actionsVar[0], skeleton)).toBe('actions = vm.actions');

    const hintEnabled = collectNodes(skeleton, (n): n is ts.VariableDeclaration =>
      ts.isVariableDeclaration(n) && n.name.getText(skeleton) === 'hintEnabled');
    expect(hintEnabled).toHaveLength(1);
    expect(printNorm(hintEnabled[0], skeleton)).toBe('hintEnabled = followUx.mustPass ? false : actions.hint');

    const calls = collectNodes(skeleton, (n): n is ts.CallExpression =>
      ts.isCallExpression(n) && n.expression.getText(skeleton) === 'this.renderActions');
    expect(calls, 'renderActions 调用点必须恰一个').toHaveLength(1);
    expect(printNorm(calls[0], skeleton)).toBe(
      'this.renderActions(playEnabled, actions.pass, hintEnabled, layout, canvas, followUx.mustPass)',
    );
    const guards = reachGuards(calls[0], skeleton);
    expect(guards.ifs, '可达性守卫必须恰为出牌阶段判断(禁 if(false&&…)/嵌套假守卫)')
      .toEqual(["phase === 'playing'"]);
    expect(guards.wraps, '禁循环/switch/三元包裹').toEqual([]);

    const forward = collectNodes(skeleton, (n): n is ts.MethodDeclaration =>
      ts.isMethodDeclaration(n) && n.name.getText(skeleton) === 'renderActions');
    expect(forward).toHaveLength(1);
    expect(printNorm(forward[0], skeleton)).toContain(
      'renderActionsSection(this.rendererContext(), play, pass, hint, layout, canvas, mustPass);',
    );
  });

  it('入口链①·renderer 侧:SHOW_HINT_ACTION、使能量定义、注册调用与守卫链全锁(Codex R6 阻断②)', () => {
    const flags = collectNodes(renderer, (n): n is ts.VariableDeclaration =>
      ts.isVariableDeclaration(n) && n.name.getText(renderer) === 'SHOW_HINT_ACTION');
    expect(flags).toHaveLength(1);
    expect(printNorm(flags[0].initializer!, renderer)).toBe('true');

    // Codex R6 阻断②:注册调用逐字不变但把 `const hintEnabled = mustPass ? false : hint`
    // 改成 `= false`,按钮永久禁用而旧门全绿 → 使能量定义一并锁定。
    const hintEnabled = collectNodes(renderer, (n): n is ts.VariableDeclaration =>
      ts.isVariableDeclaration(n) && n.name.getText(renderer) === 'hintEnabled');
    expect(hintEnabled).toHaveLength(1);
    expect(printNorm(hintEnabled[0], renderer)).toBe('hintEnabled = mustPass ? false : hint');

    const pushes = collectNodes(renderer, (n): n is ts.CallExpression =>
      ts.isCallExpression(n) && printNorm(n, renderer).includes("'action-hint'"));
    expect(pushes, 'action-hint 注册点必须恰一个').toHaveLength(1);
    expect(printNorm(pushes[0], renderer)).toBe(
      "actions.push({ text: t('action.hint'), enabled: hintEnabled, cb: () => ctx.applyHint(), name: 'action-hint' })",
    );
    const guards = reachGuards(pushes[0], renderer);
    expect(guards.ifs, '守卫链必须恰为 SHOW_HINT_ACTION(禁嵌套假守卫)').toEqual(['SHOW_HINT_ACTION']);
    expect(guards.wraps, '禁循环/switch/三元包裹').toEqual([]);
  });
});
