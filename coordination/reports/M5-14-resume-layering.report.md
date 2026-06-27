# M5-14-resume-layering 实现报告

- 实现方标识：Codex
- 分支：`task/M5-14-resume-layering`
- 状态：in-review

## 改了哪些文件
- `game/types.ts`：新增 `ResumePayload` 与 `RoundFinishInput` 两个纯 DTO。
- `game/resume.ts`：`resumeRound` 改为接收 `ResumePayload`，移除 `game -> data/save` 依赖。
- `data/save.ts`：新增 `toResumePayload` 投影 helper，并对 `events` 做逐元素最小校验。
- `data/aggregate.ts` / `data/session.ts`：去除 `data -> flow` 的 `FlowResult` 依赖，改用 `RoundFinishInput`。
- `data/records.ts`：新增 `serializeRecords`，让 records 写入与迁移读取对称。
- 新增 `test/game/resume-layering.test.ts`、`test/data/save-events-validation.test.ts`、`test/data/session-atomicity.test.ts`。

## 测试与类型检查输出
```
npm --prefix test run typecheck
> tsc --noEmit
通过

npm --prefix test test
Test Files  82 passed (82)
Tests       422 passed (422)
```

补充检查：
```
rg "from '../data/save'" assets/scripts/game
无命中

rg "from '../flow'" assets/scripts/data
无命中

rg "from 'cc'|import('cc')" assets/scripts/{rules,game,ai,flow,data,ui}
无命中

git diff --check
通过
```

## 与 spec 的偏差 / 关键决策
- `commitFinishedRound` 支持新参数 `finish: RoundFinishInput`，同时保留旧参数名 `result` 的结构兼容入口；内部类型不再引用 `FlowResult`，既有测试和潜在调用不会因参数名立刻断裂。
- 原子性顺序采用：先 `removeSave`，再写 `records`，最后写 `stats`。`records` 写入成功但 `stats` 写入失败时，重试会识别同一条记录并补写 stats，避免 `stats.rounds` 双计。
- `loadRecords` 对损坏 JSON 使用 `console.warn` 作为最小可观测通道，然后回退空 records；未引入新的返回结构，避免扩大调用面。
- `data/statsCodec.ts` 不在本任务文件域内，未改 unknown-version 行为。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改既有测试、未碰 main / 他人模块
- [x] 未 import cc
