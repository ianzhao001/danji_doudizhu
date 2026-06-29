# M6-L9 提示着法策略排序（第十一批·打磨）

- 状态：**ready**（依赖 `ai/hint.ts`、`rules` 着法枚举已在 main）
- 派发模式：纯逻辑 worktree · 禁 `cc` · 纯 spec
- 分支：`task/M6-L9-hint-ranking`（`git worktree add ../斗地主.worktrees/M6-L9 -b task/M6-L9-hint-ranking main`）
- 文件域：`assets/scripts/ai/hintRank.ts`（新）、`test/ai/hint-rank.test.ts`（新）、report
- **不改** `ai/hint.ts`/`ai/bidding*.ts`（仅 import 复用）

## 目标
当前 `hintSuggestions` 按枚举序返回候选；本任务在其外层做**策略排序**，让玩家提示优先给“代价最小”的合法着法：不拆炸弹/火箭、优先消耗低价值散牌、同价值取张数更少者。纯函数。

## 接口
```ts
export function rankHints(hand: Card[], current: HandPattern | null): Move[];
export function bestHint(hand: Card[], current: HandPattern | null): Move | null;
```
- 内部调用 `hintSuggestions(hand, current)` 取合法集，再用稳定排序键重排（不新增非法着法、不丢合法着法）。
- 排序键（从优到劣，确定性、全序、无随机）：① 不含炸弹/火箭的着法优先；② mainRank 更低优先（先出小牌）；③ 张数更少优先；④ 最终用既有 `compareMoves`/牌序兜底成全序，保证可复现。
- `bestHint` = 排序后第一个；空集 → `null`。
- 纯函数、确定性、零 `cc`、不改 hand。

## 验收
- 测试：领出时偏小单/对在前、炸弹排最后；跟牌时给最小可压；空集 null；同输入两次结果深相等（全序稳定）。
- 全绿、typecheck 净、零 cc、report 落盘。
