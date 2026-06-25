# M2-03 settlement 结算（倍数连乘 + 春天 + 胜负）

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/game/settlement.ts`（实现 + 本模块自有类型）
  - 可读不可改：`assets/scripts/game/types.ts`（用 `SeatIndex`/`Side`/`GameEvent`）、`test/game/settlement.test.ts`
- 依赖：M2-01（types）
- 分支：`task/M2-03-settlement`

## 目标
由一局的事件流 + 叫抢倍数算出最终倍数与各座位得分。纯函数、无状态。

## 公共 API 契约（见 settlement.ts 桩）
- `settle(input: SettlementInput): Settlement`
- `SettlementInput { landlord: SeatIndex; winner: Side; bidMultiplier: number; events: GameEvent[]; baseScore?: number }`（baseScore 默认 1）
- `Settlement { multiplier: number; spring: 'none'|'spring'|'anti-spring'; bombs: number; scores: [number, number, number] }`

## 规则
- `bombs` = events 中 `'bomb'`+`'rocket'` 事件数；每个使倍数 ×2。
- `spring`：地主赢且农民全程 0 次 `'play'` 事件 → `'spring'`；农民赢且地主全程仅 1 次 `'play'` → `'anti-spring'`；否则 `'none'`。spring/anti-spring 使倍数 ×2。
- `multiplier = bidMultiplier × 2^bombs × (spring==='none' ? 1 : 2)`。
- `scores`（和为 0）：地主赢 → 地主 `+2×baseScore×multiplier`，两农民各 `−baseScore×multiplier`；农民赢 → 地主 `−2×…`，两农民各 `+…`。

## 验收（test/game/settlement.test.ts）
- 无炸无春、bidMultiplier=1、地主(座位0)赢 → scores `[+2,−1,−1]`，multiplier=1。
- 1 个炸弹事件 + bidMultiplier=2 → multiplier=4。
- 地主赢且 events 中无农民 `'play'` → spring='spring' 且 multiplier 含额外 ×2。
- `npm --prefix test test` 全绿、`typecheck` 无错、未 import `cc`。
