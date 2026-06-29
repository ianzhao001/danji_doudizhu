# M3-53 瞬时提示队列模型（第十二批·打磨）

- 状态：**ready**（无代码依赖·纯不可变模型）
- 派发模式：纯逻辑 worktree · 禁 cc · 纯 spec
- 分支：`task/M3-53-toast-queue`（`git worktree add ../斗地主.worktrees/M3-53 -b task/M3-53-toast-queue main`）
- 文件域：`assets/scripts/ui/toast-queue.ts`（新）、`test/ui/toast-queue.test.ts`（新）、report

## 目标
对局内瞬时提示（如「炸弹！」「不要」「春天」）的纯不可变队列模型——组件用 `tick(now)` 驱动过期。无 cc、无定时器。

## 接口
```ts
export interface Toast { id: number; text: string; expiresAt: number; }
export interface ToastQueue { items: Toast[]; nextId: number; }
export const emptyToasts: ToastQueue;
export function pushToast(q: ToastQueue, text: string, now: number, ttlMs?: number): ToastQueue; // 默认 ttl 2000
export function tickToasts(q: ToastQueue, now: number): ToastQueue; // 移除 expiresAt<=now
```
- 不可变（返回新对象）；`nextId` 单调递增；`pushToast` 追加；`tickToasts` 过滤过期；可限制最大并存条数（如 ≤3，超出丢最旧）。
- 纯函数、确定性、不改入参；零 cc。

## 验收
- 测试：push 后含该 toast、tick 到期移除、未到期保留、nextId 递增、最大条数裁剪、空队列 tick 安全。
- 全绿、typecheck 净、零 cc、report 落盘。
