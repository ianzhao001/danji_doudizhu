# T-LASTPLAY-CARDS 实现报告

- 实现方标识：Cursor（执行者）
- 分支：`task/T-LASTPLAY-CARDS`
- 链式基点：`task/T-INTERACT-VIEWS` 尖 commit
- 状态：in-review

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

## 自检
- [x] deriveLastActions 本体未改
- [x] 全量 test + typecheck 绿
- [x] 未改既有测试
