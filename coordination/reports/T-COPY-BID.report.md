# T-COPY-BID 实现报告

- 实现方标识：Codex
- 分支：`task/T-COPY-BID`
- 状态：in-review

## 改了哪些文件
- `assets/scripts/ui/bidding-view.ts`
  - 增加本地 `seatLabel(seat)`：0=`你`、1=`左家`、2=`右家`。
  - 增加 `promptForTurn(turn, viewerSeat, verb)`。
  - 将叫地主/抢地主阶段的 `请座位 N 行动` 改为相对措辞：`轮到你叫地主` / `等待左家叫地主` / `轮到你抢地主` 等。
  - `done` / `redeal` 阶段与按钮逻辑未改。

## 测试与类型检查输出
```
npm --prefix test test
Test Files  134 passed (134)
Tests       660 passed (660)

npm --prefix test run typecheck
tsc --noEmit passed
```

## 合并证据（approved 后由执行者回填）
- 合并前回归：
  - `npm --prefix test test`：
  - `npm --prefix test run typecheck`：
- merge commit：
- BOARD 状态：

## 与 spec 的偏差 / 关键决策
- 无偏差。
- `seatLabel` 保持在 `bidding-view.ts` 本地，不新增模块、不改 `strings.ts`。

## 疑问（给架构）
- 无。

## 自检（对照验收项）
- [x] 测试全绿
- [x] typecheck 无错
- [x] 仅改声明文件域
- [x] 未改测试、未碰他人模块
- [x] 未获 `approved` 前未合并 main；获批后仅通过 `agentctl.sh claim/merge/release` 合并
- [x] 未 import cc
