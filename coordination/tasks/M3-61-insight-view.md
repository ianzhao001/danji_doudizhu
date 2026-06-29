# M3-61 出牌建议视图模型（消费 M4-40 · 第十三批·打磨）

- 状态：**blocked: 待 M4-40 merge**
- 派发模式：纯逻辑 worktree · 禁 cc · 纯 spec
- 分支：`task/M3-61-insight-view`（M4-40 入 main 后建）
- 文件域：`assets/scripts/ui/insight-view.ts`（新）、`test/ui/insight-view.test.ts`（新）、report
- 依赖：**M4-40**（`adviseAction`/`ActionInsight`）

## 目标
把 `ActionInsight` 转成玩家「智能建议」浮条 VM（建议文案 + 是否建议过牌 + 强度提示），供游戏屏可选开启的 advisor。纯函数。

## 接口
```ts
export interface InsightView { text: string; isPass: boolean; emphasize: boolean; }
export function deriveInsightView(insight: ActionInsight): InsightView;
```
- `text`：建议出牌时给牌型短描述（复用 rationale）、`shouldPass` 时「建议过牌」、空手时空文案；`isPass = insight.shouldPass`；`emphasize = insight.strengthScore >= 67`（强手强调）。
- 纯函数、确定性、不可变；零 cc。

## 验收
- 测试：推荐出牌文案、shouldPass 文案、空手安全、emphasize 阈值。
- 全绿、typecheck 净、零 cc、report 落盘。
