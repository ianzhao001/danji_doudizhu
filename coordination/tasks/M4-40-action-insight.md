# M4-40 出牌建议综合（组合 M4-30/32 + hintRank · 第十三批·AI 纵深）

- 状态：**blocked: 待 M4-30 + M4-32 merge**（hintRank/M6-L9 已在 main）
- 派发模式：纯逻辑 worktree · 禁 cc · 纯 spec
- 分支：`task/M4-40-action-insight`（dep 入 main 后建）
- 文件域：`assets/scripts/ai/insight.ts`（新）、`test/ai/insight.test.ts`（新）、report
- **不改** 既有 AI strategy（additive·组合既有纯模块；接入 AI/UI 是后续任务）

## 目标
把分散的纯模块（`evaluateHand` M4-30、`finishingFollow`/`canFinishInOneMove` M4-32、`rankHints`/`bestHint` M6-L9）组合成给玩家的「出牌建议」，输出推荐着法 + 简短理由。纯函数，仅用公开信息（snapshot.viewerHand + top）。

## 接口
```ts
export interface ActionInsight {
  recommended: Move | null;       // 建议出的牌；null=建议过牌或无手牌
  shouldPass: boolean;            // 跟牌时无划算着法→建议过
  rationale: string;              // 中文短理由（如「可一手出完」「留炸弹，先出小牌」）
  strengthScore: number;         // evaluateHand(hand).score
}
export function adviseAction(hand: Card[], top: HandPattern | null): ActionInsight;
```
- 领出（top=null）：优先 `canFinishInOneMove`→整手出完；否则 `bestHint(hand, null)`，理由「先出小牌/保炸弹」。
- 跟牌（top≠null）：优先 `finishingFollow`；否则 `bestHint(hand, top)`；都无→`shouldPass=true, recommended=null`。
- 空手→recommended null、rationale 说明。纯函数、确定性、不改入参；零 cc。

## 验收
- 测试：整手顺子→recommended=整手；跟不上→shouldPass；保炸弹偏好（领出不先拆炸）；strengthScore 来自 evaluateHand；可复现。
- 全绿、typecheck 净、零 cc、report 落盘。
