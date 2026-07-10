# T-LASTPLAY-CARDS 实现报告

- 实现方标识：Cursor（执行者）
- 分支：`task/T-LASTPLAY-CARDS`
- 链式基点：`task/T-INTERACT-VIEWS` 尖 commit
- 状态：changes-requested

## 改了哪些文件
- 新 `assets/scripts/ui/last-play-view.ts`（`deriveLastPlays`）
- `assets/scripts/ui/index.ts`（追加 `export * from './last-play-view'`）
- 新 `test/ui/last-play-view.test.ts`
- `last-action-view.ts` **零 diff**

## 用例清单落实映射
| # | 用例 | 测试 |
|---|---|---|
| 1 | 单/对/顺/三带一 cards+text | `单/对/顺子/三带一` |
| 2 | 炸弹/火箭 emphasis | `炸弹` / `火箭` |
| 3 | pass 覆盖 play | `pass 覆盖旧 play` |
| 4 | reset 清空三席 | `reset 清空三席`（注：text 用 `—`，与 deriveLastActions 对 reset 语义不同，按 spec 清空） |
| 5 | 空流三席 null | `空事件流` + `恒返回长度 3` |
| 6 | 不可变 + 零 cc | `入参未被修改` + `源码零 from 'cc'` |

## 测试与类型检查输出
```
Test Files  152 passed (152)
Tests       807 passed (807)
npm --prefix test run typecheck → exit 0
```

## 与 spec 的偏差 / 关键决策
- `text` 内部调用 `deriveLastActions` 合流；`reset` 后 kind=null 时强制 `—`（派生遍历清空，与 deriveLastActions 忽略 reset 的差异在测试注明）。
- `play` 的 `cards` 引用透传 `event.pattern.cards`，不深拷。

## 评审结论（Codex 审查者·2026-07-10）
- 结论：`changes-requested`，不得越过前棒或按当前提交合并。
- diff 逐行审读：`fa3c4f0..ff7e454`；文件域合规，`last-action-view.ts` 零 diff，桶仅一行追加，无既有测试改动，零 `cc` import，`git diff --check` 净。
- 全量闸门：链尖 152 files / 807 tests 绿，typecheck exit 0；下列语义与覆盖缺口仍阻断 approved。
- 定向抽查：`deriveLastActions` 的 `seats-renderer.ts` / `resume-replay-rebuild` 既有消费链零变更；新导出 `deriveLastPlays` / `SeatLastPlay` 尚无产品消费方，符合 P-TABLE-INFO 后置接线。

### 阻断项 1：bomb/rocket 未限定「紧随同席 play」
- 实现对任意后续同席 `bomb` / `rocket` 都会改写 Map 中旧 play 的 emphasis，即使中间已经有其他事件。
- 定向复现：`seat0 play(单张 3) → seat1 pass → seat0 bomb` 得到 `kind:'play', cards:[3], emphasis:'bomb', text:'炸弹'`，产生「单张牌面+炸弹强调」的自相矛盾状态。
- 修复要求：只有当紧邻前一事件为同席 `play` 时才设 emphasis；增加「非相邻事件不污染旧 play」测试，不得删弱已有相邻炸弹/火箭用例。

### 阻断项 2：「单/对/顺子/三带一各一例」未真正逐例落实
- 当前测试把 4 次 play 放进同一事件流，但只有 3 席，seat0 的早期单张被后续三带一覆盖；变量 `single` 实际断言的是 `cases[3]` 三带一，因此单张用例并未被验证。
- 修复要求：四种牌型分别派生（或分开事件流），每例均核对 `cards` 长度、逐张等值、与 `pattern.cards` 引用同一性，以及 text 与 `deriveLastActions` 一致。

### 保留结论
- `reset` 后本派生层将无状态席文案置 `—` 可接受：它满足 spec 的清桌语义，且未修改 `deriveLastActions` 既有行为。
- 入参不变、play cards 引用透传、pass 覆盖、空流三席稳定序均已通过审读与现有测试。

## 自检
- [x] deriveLastActions 本体未改
- [x] 全量 test + typecheck 绿
- [x] 未改既有测试
