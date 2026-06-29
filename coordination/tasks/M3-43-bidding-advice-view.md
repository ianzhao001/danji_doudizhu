# M3-43 叫抢建议视图模型（消费 M6-L10 · 第十一批·打磨）

- 状态：**ready**（依赖 M6-L10 入 main 后认领）
- 派发模式：纯逻辑 worktree · 禁 `cc` · 纯 spec
- 分支：`task/M3-43-bidding-advice-view`（`git worktree add ../斗地主.worktrees/M3-43 -b task/M3-43-bidding-advice-view main`）
- 文件域：`assets/scripts/ui/bidding-advice-view.ts`（新）、`test/ui/bidding-advice-view.test.ts`（新）、report
- 依赖：**M6-L10**（`adviseBid`/`BidAdvice`）

## 目标
把 `BidAdvice` 转成叫抢界面的提示 VM（中文建议文案 + 强弱标识），不重算逻辑。

## 接口
```ts
export interface BiddingAdviceView { text: string; emphasize: boolean; }
export function deriveBiddingAdviceView(advice: BidAdvice): BiddingAdviceView;
```
- text：如 `建议叫地主`/`建议抢地主`/`建议不叫`。`emphasize = advice.strong`。
- 纯函数、确定性、不可变；零 `cc`。

## 验收
- 测试：三种 suggestion 文案、emphasize 跟随 strong。
- 全绿、typecheck 净、零 cc、report 落盘。
