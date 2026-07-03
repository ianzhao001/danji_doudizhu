# T-COPY-BID — 叫抢提示改用 你/左家/右家（相对措辞）

- 状态：ready（V 发现 #2 / ART-IMPORT-06 视觉门；用户裁决「相对措辞」）
- 类型：**纯 view-model 文案**（禁 import `cc`）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/bidding-view.ts`
  - `coordination/reports/T-COPY-BID.report.md`
  - **失败测试 `test/ui/bidding-view.test.ts` 由架构种入（契约·执行者不改）**
- 依赖：—（独立，可与 E-ORIENT / T-FIX-GS 并行）
- 分支：`task/T-COPY-BID`
- **worktree 测试环境**：缺 `./temp/cli/tsconfig.cocos.json` 时 `mkdir -p temp/cli && cp /Users/admin/Documents/Cocos/斗地主/temp/cli/tsconfig.cocos.json temp/cli/`。

## 背景

`bidding-view.ts:28/38` 现为 `请座位 ${state.turn + 1} 行动`，暴露原始座位号（座位1=左家）。`deriveBiddingView(state, viewerSeat)` 同时握有 `state.turn` 与 `viewerSeat`，可做**相对措辞**。

## 行为要求（**架构已种失败测试，实现到绿即可**）

把 `calling` / `grabbing` 两分支的 `prompt` 改为：

```
seatLabel(seat): 0→'你', 1→'左家', 2→'右家'
verb: calling→'叫地主', grabbing→'抢地主'
prompt = state.turn === viewerSeat
  ? `轮到你${verb}`
  : `等待${seatLabel(state.turn)}${verb}`
```

- 例：calling 轮到你 → `轮到你叫地主`；calling 轮到左家（viewer=你）→ `等待左家叫地主`；grabbing 轮到你 → `轮到你抢地主`。
- `done`→`叫抢结束`、`redeal`→`重新发牌` **保持不变**。
- `seatLabel` 用本地纯函数（与 game-scene `seatName` 同映射，锚定座位0=你）；**纯层禁 import `cc`**；**不得修改入参**（现有「入参不变」测试须仍绿）。

## 契约 / 验收

- 架构种入的 `test/ui/bidding-view.test.ts` 新断言（`轮到你叫地主` / `等待左家叫地主` / `轮到你抢地主`）**转绿**。
- `npm --prefix test test` 全绿（134 文件不回归）+ `npm --prefix test run typecheck` 净。
- 证据落 `coordination/reports/T-COPY-BID.report.md`。

## 不可做（护栏）

- 不改测试（有疑问在报告提出）；不碰他人文件域；不 import `cc`；不改按钮/enabled 逻辑（仅改 prompt 文案）。

## 交付物

- 分支 `task/T-COPY-BID` 提交；报告。
- 获架构 `approved` 后 `claim → merge → release` 自合（单 lane，排队）。

## 测试命令

`npm --prefix test test`
