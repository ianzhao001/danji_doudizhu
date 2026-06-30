# M6-G19-typeguard-consolidation 实现报告

- 实现方标识：Codex
- 分支：`task/M6-G19-typeguard-consolidation`
- 状态：in-review

## 改了哪些文件
- 新增 `assets/scripts/rules/guards.ts`
  - 统一 `isRecord`、`hasOwn`、`cardKey`，并提供 Card/Pattern wire-shape 守卫供事件校验复用。
- 新增 `assets/scripts/game/seat.ts`
  - 统一 `isSeat`、`nextSeat`、`isGameEvent`。
- 替换重复本地定义：
  - `assets/scripts/game/{core,bidding,serialize,replay-codec}.ts`
  - `assets/scripts/data/{save,records,statsCodec,settings}.ts`
  - `assets/scripts/ai/hint.ts`
  - `assets/scripts/ui/components/game-scene-skeleton.ts`
- 新增 `test/rules/guards.test.ts`、`test/game/seat.test.ts`。

## 测试与类型检查输出
```
npm --prefix test test -- rules/guards.test.ts game/seat.test.ts game/serialize.test.ts game/replay-codec.test.ts data/save.test.ts data/save-events-validation.test.ts data/records.test.ts data/stats-codec.test.ts data/settings.test.ts game/core.test.ts game/core-structural-sharing.test.ts game/bidding.test.ts ai/hint.test.ts
Test Files  13 passed (13)
Tests  69 passed (69)

npm --prefix test run typecheck
tsc --noEmit

npm --prefix test test
Test Files  131 passed (131)
Tests  642 passed (642)

git diff --check
通过，无输出

cc import 护栏
rg -n "^\\s*import .*['\\\"]cc['\\\"]|from ['\\\"]cc['\\\"]" assets/scripts/game assets/scripts/rules assets/scripts/ai assets/scripts/data
无命中

重复定义复核
rg -n "function isRecord|const isRecord|function isSeat|const isSeat|function nextSeat|const nextSeat|function cardKey|const cardKey|function isGameEvent|const isGameEvent" assets/scripts
仅剩 `rules/guards.ts`、`game/seat.ts` 与任务书明确保留的 `ai/hintRank.ts` Move 版 `cardKey`。
```

## 与 spec 的偏差 / 关键决策
- G19 与 G20 都触 `game/core.ts`，本分支按串行约束叠在 G20 提交 `8f1e63b` 之后；评审/合并建议顺序：先 M6-G20，再 M6-G19。看 G19 独立 diff 时建议用 `task/M6-G20-core-structural-sharing..task/M6-G19-typeguard-consolidation`。
- `isGameEvent` 采用 replay-codec 原先的严格 pattern wire-shape 校验；`save.ts` 也改用同一守卫，避免同一 GameEvent 在 replay/save 两处松紧不一致。
- `game-scene-skeleton.ts` 的 `cardKey` 从本地 `rank-suit` 切到统一 `rank:suit`。该值只用于内部签名/节点 key，仍保持唯一稳定，不影响 UI 文案或存档。
- 未修改 `index.ts` 桶导出，消费方均直引新文件，避免桶冲突。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改既有测试、未碰 main / 他人模块
- [x] 未 import cc
