/**
 * UI 提示委托链契约(Codex R1 阻断③补门;R2-R5 对抗演进史:
 * 文本正则→被合法改写绕过→行为契约+文本壳→被 barrel 别名/吞历史绕过→标识符封锁+导入锁
 * →被结果覆盖绕过→全文钉死→被注释假方法抢占提取、入口回调空操作绕过→前版)。
 * **W-AI-R2 章(2026-07-17,玩家打回证据②整改)**:提示会话重构——
 *   pickHint 升级为三态判别式 {move|passAdvice|none} + HintSession(AI 榜单内轮换,
 *   废除「小到大轮一圈」);AI 建议过牌不再哑火(toast 反馈);手动选牌不再劫持
 *   (selected 不匹配榜单游标 ⇒ 重新首按覆盖)。本文件行为层与 AST 规范体随之改写,
 *   加固哲学不变:行为契约在 node 直接可证 + AST 源码契约拦疏漏级改写 + 真机探针闭合兜底。
 * 维护口径:合法修改 applyHint/入口链必须同评审更新本文件规范体(门禁文件同款纪律)。
 * 残余披露:蓄意在纯岛 hint-flow 之外重写整套决策并同步伪造本文件属主动破坏,超出疏漏范畴。
 *
 * 落位:Codex 逐字节复制**覆盖** test/ui/hint-delegation.test.ts,独立 seed commit(R2a 棒)。
 * ── 预期红(对 R2 基线 main)── 行为层全部用例红(rankHintCandidates/HintSession 未落,
 *   旧 pickHint 返回 Move|null 无 kind);AST 层 applyHint 规范体/hintSession 单写/禁标识符
 *   扩容三用例红;入口链①②③与 pickHint 导入锁仍绿。
 * ── 负向变异自证(执行者实现后自查)──
 *   ① 轮换改回全枚举清单(hints 换 hintSuggestions 产物) → 榜单轮换用例红(N≤6+去重钉)。
 *   ② passAdvice 分支删 toast 改静默 return → AST 规范体红。
 *   ③ 手动选牌仍走旧轮换(不重置) → 手动覆盖用例红。
 *   ④ hintSession 在 render() 里旁路写入 → 单写不变式红。
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as ts from 'typescript';
import { adviseBestMove, rankHintCandidates } from '../../assets/scripts/ai';
import { pickHint, type HintSession } from '../../assets/scripts/ui/hint-flow';
import { apply, createPlayingRound, snapshot, type GameEvent, type GameSnapshot } from '../../assets/scripts/game';
import { compareMoves } from '../../assets/scripts/ai/levels/_shared';
import { simpleStrategy } from '../../assets/scripts/ai/levels/simple';
import { createRng, deal, enumerateMoves, recognize, type Card } from '../../assets/scripts/rules';
import { cards } from '../rules/_util';

const SKELETON_SRC = new URL(
  '../../assets/scripts/ui/components/game-scene-skeleton.ts',
  import.meta.url,
);
const RENDERER_SRC = new URL(
  '../../assets/scripts/ui/components/game-scene/bid-actions-renderer.ts',
  import.meta.url,
);

const SEEDS = Array.from({ length: 40 }, (_, i) => i + 1);
const keysOf = (list: Card[]): string => list.map((c) => `${c.rank}:${c.suit}`).sort().join(',');

function leadSnapshot(seed: number) {
  const state = createPlayingRound(deal(createRng(seed)), 0);
  return snapshot(state, 0); // viewer=地主=turn,首出局面
}

function firstPress(snap: GameSnapshot) {
  return pickHint({ snapshot: snap, history: [], selected: [], session: null });
}

describe('pickHint 行为契约(纯岛,三态判别式+会话轮换)', () => {
  it('首按(空会话)逐 seed:kind=move 且 ≡ rankHintCandidates.hints[0] ≡ adviseBestMove', () => {
    for (const seed of SEEDS) {
      const snap = leadSnapshot(seed);
      const verdict = firstPress(snap);
      const ranked = rankHintCandidates({ snapshot: snap, history: [] });
      const advised = adviseBestMove({ snapshot: snap, history: [] });
      expect(verdict.kind, `seed ${seed} 首出局面必有推荐`).toBe('move');
      expect(ranked.kind).toBe('ranked');
      if (verdict.kind === 'move' && ranked.kind === 'ranked') {
        expect(keysOf(verdict.move.cards)).toBe(keysOf(ranked.hints[0].move.cards));
        expect(keysOf(verdict.move.cards)).toBe(keysOf(advised!.cards));
      }
    }
  });

  it('判别性绊线:存在推荐 ≠「最小合法着法」的局面,且首按取推荐侧(防退回小到大枚举)', () => {
    let discriminating = 0;
    for (const seed of SEEDS) {
      const snap = leadSnapshot(seed);
      const advised = adviseBestMove({ snapshot: snap, history: [] });
      const smallest = enumerateMoves(snap.viewerHand!).slice().sort(compareMoves)[0];
      expect(advised, `seed ${seed} 首出局面推荐不应为空`).not.toBeNull();
      if (smallest && keysOf(advised!.cards) !== keysOf(smallest.cards)) {
        discriminating += 1;
        const verdict = firstPress(snap);
        expect(verdict.kind).toBe('move');
        if (verdict.kind === 'move') expect(keysOf(verdict.move.cards)).toBe(keysOf(advised!.cards));
      }
    }
    expect(discriminating, '40 个种子局面里应存在推荐≠最小着法的判别用例').toBeGreaterThan(0);
  });

  it('榜单轮换:第 2 按给 hints[1],到末回绕 hints[0];榜单 ≤6、去重、全合法(废除全枚举轮圈)', () => {
    let cycledSomewhere = 0;
    for (const seed of SEEDS.slice(0, 12)) {
      const snap = leadSnapshot(seed);
      const ranked = rankHintCandidates({ snapshot: snap, history: [] });
      expect(ranked.kind).toBe('ranked');
      if (ranked.kind !== 'ranked') continue;
      const hints = ranked.hints;
      expect(hints.length).toBeGreaterThan(0);
      expect(hints.length, '榜单上限 6(连按一圈以内)').toBeLessThanOrEqual(6);
      const keySet = new Set(hints.map((h) => keysOf(h.move.cards)));
      expect(keySet.size, '榜单不得含重复项').toBe(hints.length);
      const legal = new Set(enumerateMoves(snap.viewerHand!).map((m) => keysOf(m.cards)));
      for (const h of hints) expect(legal.has(keysOf(h.move.cards)), '榜单项必须全合法').toBe(true);

      const first = firstPress(snap);
      expect(first.kind).toBe('move');
      if (first.kind !== 'move') continue;
      let session: HintSession = first.session;
      let selected = first.move.cards;
      for (let press = 1; press <= hints.length; press += 1) {
        const next = pickHint({ snapshot: snap, history: [], selected, session });
        expect(next.kind).toBe('move');
        if (next.kind !== 'move') break;
        const expected = hints[press % hints.length];
        expect(keysOf(next.move.cards), `seed ${seed} 第 ${press + 1} 按 = 榜单第 ${(press % hints.length) + 1} 项`)
          .toBe(keysOf(expected.move.cards));
        session = next.session;
        selected = next.move.cards;
      }
      if (hints.length > 1) cycledSomewhere += 1;
    }
    expect(cycledSomewhere, '抽样局面中应存在可轮换(榜单≥2)的用例').toBeGreaterThan(0);
  });

  it('手动选牌不劫持:selected 与榜单游标不匹配(手动勾牌/非法半手) → 重新首按覆盖为 hints[0]', () => {
    for (const seed of SEEDS.slice(0, 8)) {
      const snap = leadSnapshot(seed);
      const first = firstPress(snap);
      expect(first.kind).toBe('move');
      if (first.kind !== 'move') continue;
      const hand = snap.viewerHand!;
      // 手动勾一张不等于当前游标项的牌(取手牌里与 hints[0] 首张不同的第一张)。
      const manual = [hand.find((c) => keysOf([c]) !== keysOf([first.move.cards[0]]))!];
      const verdict = pickHint({ snapshot: snap, history: [], selected: manual, session: first.session });
      expect(verdict.kind).toBe('move');
      if (verdict.kind === 'move') {
        expect(keysOf(verdict.move.cards), `seed ${seed} 手动选牌后按提示必回 AI 首选`).toBe(keysOf(first.move.cards));
      }
    }
  });

  it('passAdvice:策略建议过牌(仅剩炸弹可跟且对手不告急)→ kind=passAdvice,绝不静默', () => {
    const snap: GameSnapshot = {
      phase: leadSnapshot(1).phase,
      turn: 0,
      landlord: 0,
      top: { seat: 1, pattern: recognize(cards('K'))! },
      handCounts: [5, 5, 5],
      winner: null,
      viewerHand: cards('3 3 3 3 5'),
    };
    expect(adviseBestMove({ snapshot: snap, history: [] }), '前提自证:hard 此局面选择过牌').toBeNull();
    const ranked = rankHintCandidates({ snapshot: snap, history: [] });
    expect(ranked.kind).toBe('passAdvice');
    const verdict = pickHint({ snapshot: snap, history: [], selected: [], session: null });
    expect(verdict.kind).toBe('passAdvice');
  });

  it('none:对局结束/无 viewerHand → kind=none', () => {
    const done = { ...leadSnapshot(1), winner: 'landlord' as GameSnapshot['winner'] };
    expect(pickHint({ snapshot: done, history: [], selected: [], session: null }).kind).toBe('none');
    const { viewerHand: _dropped, ...rest } = leadSnapshot(1);
    expect(pickHint({ snapshot: rest as GameSnapshot, history: [], selected: [], session: null }).kind).toBe('none');
  });

  it('历史敏感性:存在富历史推荐 ≠ 空历史推荐的局面,且 pickHint 用的是真历史(R3 漏口②绊线)', () => {
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
            const picked = pickHint({ snapshot: snap, history: events, selected: [], session: null });
            if (withHistory === null) {
              expect(picked.kind === 'passAdvice' || picked.kind === 'none').toBe(true);
            } else {
              expect(picked.kind).toBe('move');
              if (picked.kind === 'move') expect(keysOf(picked.move.cards)).toBe(keysOf(withHistory.cards));
            }
            found = true;
            break outer;
          }
        }
        const action = simpleStrategy(snap, stubRng, events);
        const result = apply(state, action);
        state = result.state;
        events!.push(...result.events);
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

function enclosingMethodName(node: ts.Node, sf: ts.SourceFile): string {
  let cur: ts.Node | undefined = node.parent;
  while (cur && !ts.isSourceFile(cur)) {
    if (ts.isMethodDeclaration(cur)) return cur.name.getText(sf);
    cur = cur.parent;
  }
  return 'TOP_LEVEL';
}

describe('薄壳与入口链源码契约(TypeScript AST——注释假方法/字符串对解析器不可见)', () => {
  const skeleton = parseSource(SKELETON_SRC);
  const renderer = parseSource(RENDERER_SRC);

  it('applyHint 真身唯一,去注释打印后逐字等于 R2 规范体(三态分流+toast 反馈+会话存取)', () => {
    const methods = collectNodes(skeleton, (n): n is ts.MethodDeclaration =>
      ts.isMethodDeclaration(n) && n.name.getText(skeleton) === 'applyHint');
    expect(methods, 'applyHint 类方法必须恰一个(注释里的假方法不是节点)').toHaveLength(1);
    expect(printNorm(methods[0], skeleton)).toBe(
      'private applyHint(): void { if (!this.runtime) return; ' +
        'const snapshot = this.runtime.currentSnapshot(); ' +
        'if (!snapshot?.viewerHand || !this.runtime.isPlayerTurn()) return; ' +
        'const verdict = pickHint({ snapshot, history: this.fullGameEvents, selected: this.selected, session: this.hintSession }); ' +
        "if (verdict.kind === 'move') { this.hintSession = verdict.session; this.selected = verdict.move.cards.slice(); } " +
        'else { this.hintSession = null; this.selected = clearSelection(); ' +
        "this.toasts = pushToast(this.toasts, t(verdict.kind === 'passAdvice' ? 'hint.passAdvice' : 'hint.none'), this.toastClockMs); } " +
        'this.render(); }',
    );
  });

  it('applyHint 不可被遮蔽/改写:标识符恰 3 处且位置白名单,零字符串访问,零成员赋值(R6 阻断①)', () => {
    const ids = collectNodes(skeleton, (n): n is ts.Identifier =>
      ts.isIdentifier(n) && n.text === 'applyHint');
    const positions = ids.map((id) => {
      const p = id.parent;
      if (ts.isMethodDeclaration(p) && p.name === id) return 'method-name';
      if (ts.isPropertyAssignment(p) && p.name === id) return 'ctx-binding-key';
      if (ts.isPropertyAccessExpression(p) && p.name === id) return 'property-access';
      return `ILLEGAL:${ts.SyntaxKind[p.kind]}`;
    });
    expect(positions.sort()).toEqual(['ctx-binding-key', 'method-name', 'property-access']);

    const literals = collectNodes(skeleton, (n): n is ts.StringLiteral =>
      ts.isStringLiteral(n) && n.text === 'applyHint');
    expect(literals, "禁字符串形式访问 'applyHint'").toHaveLength(0);

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

  it('hintSession 单写不变式:成员赋值只许出现在 applyHint(两处)与 startGame(重置一处)', () => {
    const writes = collectNodes(skeleton, (n): n is ts.BinaryExpression => {
      if (!ts.isBinaryExpression(n)) return false;
      if (n.operatorToken.kind !== ts.SyntaxKind.EqualsToken) return false;
      const lhs = n.left;
      return ts.isPropertyAccessExpression(lhs) && lhs.name.text === 'hintSession';
    });
    const owners = writes.map((w) => enclosingMethodName(w, skeleton)).sort();
    expect(owners, 'hintSession 写入点=applyHint×2 + startGame 重置×1').toEqual(['applyHint', 'applyHint', 'startGame']);
    const literals = collectNodes(skeleton, (n): n is ts.StringLiteral =>
      ts.isStringLiteral(n) && n.text === 'hintSession');
    expect(literals, "禁字符串形式访问 'hintSession'").toHaveLength(0);
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

  it('skeleton 零提示原语标识符(R2 扩容:rankHintCandidates/pimcRank 也不得直入壳)', () => {
    const banned = new Set([
      'adviseBestMove', 'nextHint', 'hintSuggestions', 'bestHint', 'rankHints',
      'rankHintCandidates', 'pimcRank',
    ]);
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

  it('入口链②·skeleton 侧:使能量与转发调用逐字锁定,且只受 phase==="playing" 守卫', () => {
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

  it('入口链①·renderer 侧:SHOW_HINT_ACTION、使能量定义、注册调用与守卫链全锁', () => {
    const flags = collectNodes(renderer, (n): n is ts.VariableDeclaration =>
      ts.isVariableDeclaration(n) && n.name.getText(renderer) === 'SHOW_HINT_ACTION');
    expect(flags).toHaveLength(1);
    expect(printNorm(flags[0].initializer!, renderer)).toBe('true');

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
