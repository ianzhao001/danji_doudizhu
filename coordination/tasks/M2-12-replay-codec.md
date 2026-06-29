# M2-12 回放编解码（事件流 ↔ 可分享串 · 第十三批·离线）

- 状态：**ready**（依赖 `game` GameEvent + replay 已在 main）
- 派发模式：纯逻辑 worktree · 禁 cc · 纯 spec
- 分支：`task/M2-12-replay-codec`（`git worktree add ../斗地主.worktrees/M2-12 -b task/M2-12-replay-codec main`）
- 文件域：`assets/scripts/game/replay-codec.ts`（新）、`test/game/replay-codec.test.ts`（新）、report
- **不改** `game/replay.ts`（可 import 复用类型）

## 目标
把一局的 `GameEvent[]` 编码为紧凑可分享字符串、并能解析回 `GameEvent[]`（离线复盘/分享用，无网络）。往返一致。纯函数。

## 接口
```ts
export function encodeReplay(events: GameEvent[]): string;          // 版本化 + JSON（或紧凑编码）
export function decodeReplay(text: string): GameEvent[];            // 非法/版本不符 → 抛错（明确前缀）
```
- 版本化（首字段含 REPLAY_VERSION）；编码确定性（同 events 同串）；`decodeReplay(encodeReplay(e))` 深相等 e。
- 非法输入（坏 JSON/缺版本/事件形态非法）→ 抛错并带明确前缀（复用 save 层错误约定风格）；逐事件形态校验（参考 `data/save.ts` 的 `isGameEvent`）。
- 纯函数、确定性、不改入参；零 cc。

## 验收
- 测试：往返一致（含 play/pass/bomb/rocket/reset/win）、空事件、确定性（编码两次相等）、坏 JSON/缺版本/非法事件抛错、版本不符抛错。
- 全绿、typecheck 净、零 cc、report 落盘。
