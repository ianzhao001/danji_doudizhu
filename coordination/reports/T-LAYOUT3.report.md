# T-LAYOUT3 实现报告

- 实现方标识：Codex
- 分支：`task/T-LAYOUT3`
- 状态：in-review

## 改了哪些文件

- `assets/scripts/ui/table-zones.ts`
- `coordination/reports/T-LAYOUT3.report.md`

## 实现摘要

- `TableZones` 纯加法扩展 v13 新区：`heroBody`、`opponentLeftBody`、`opponentRightBody`、`heroNameplate`、`opponentLeftNameplate`、`opponentRightNameplate`、`heroHandLarge`、`tableActionBar`、`settlementShowcase`。
- 保持 legacy 6 字段来自 `tableLayout(width, height)` 并与旧测试深相等；旧 `actionBar` / `playerHand` 不改，v13 接线后消费 `tableActionBar` / `heroHandLarge`。
- v13 新区使用独立 `gameRemakeZones()` 计算：三名角色围桌、底部大手牌、桌面中部行动区、居中结算展示区。
- 纯函数、确定性；未 import `cc`。

## 四横屏 v13 zone 尺寸

导出命令：

```
npm --prefix test exec -- tsx -e "import { tableZones } from './assets/scripts/ui/table-zones.ts'; const names=['heroBody','opponentLeftBody','opponentRightBody','heroNameplate','opponentLeftNameplate','opponentRightNameplate','heroHandLarge','tableActionBar','settlementShowcase','bottomCardsDock']; for (const [w,h] of [[844,390],[812,375],[915,412],[780,360]]) { const z=tableZones(w,h); console.log('## '+w+'x'+h); for (const n of names) { const r=(z as any)[n]; console.log(n+': '+JSON.stringify(r)); } }"
```

```
## 844x390
heroBody: {"x":8,"y":140,"width":152,"height":164}
opponentLeftBody: {"x":8,"y":47,"width":169,"height":249}
opponentRightBody: {"x":667,"y":47,"width":169,"height":249}
heroNameplate: {"x":8,"y":271,"width":152,"height":33}
opponentLeftNameplate: {"x":16,"y":179,"width":152,"height":33}
opponentRightNameplate: {"x":684,"y":179,"width":152,"height":33}
heroHandLarge: {"x":176,"y":304,"width":660,"height":86}
tableActionBar: {"x":287,"y":247,"width":270,"height":49}
settlementShowcase: {"x":186,"y":35,"width":473,"height":195}
bottomCardsDock: {"x":321,"y":58,"width":203,"height":27}

## 812x375
heroBody: {"x":8,"y":135,"width":146,"height":157}
opponentLeftBody: {"x":8,"y":45,"width":162,"height":239}
opponentRightBody: {"x":642,"y":45,"width":162,"height":239}
heroNameplate: {"x":8,"y":260,"width":146,"height":32}
opponentLeftNameplate: {"x":16,"y":172,"width":146,"height":32}
opponentRightNameplate: {"x":658,"y":172,"width":146,"height":32}
heroHandLarge: {"x":171,"y":292,"width":633,"height":83}
tableActionBar: {"x":276,"y":237,"width":260,"height":47}
settlementShowcase: {"x":179,"y":34,"width":455,"height":188}
bottomCardsDock: {"x":309,"y":57,"width":195,"height":26}

## 915x412
heroBody: {"x":8,"y":148,"width":156,"height":173}
opponentLeftBody: {"x":8,"y":49,"width":176,"height":264}
opponentRightBody: {"x":731,"y":49,"width":176,"height":264}
heroNameplate: {"x":8,"y":286,"width":164,"height":35}
opponentLeftNameplate: {"x":16,"y":189,"width":164,"height":35}
opponentRightNameplate: {"x":743,"y":189,"width":164,"height":35}
heroHandLarge: {"x":176,"y":321,"width":731,"height":91}
tableActionBar: {"x":311,"y":261,"width":293,"height":52}
settlementShowcase: {"x":202,"y":37,"width":512,"height":206}
bottomCardsDock: {"x":348,"y":61,"width":220,"height":29}

## 780x360
heroBody: {"x":8,"y":130,"width":140,"height":150}
opponentLeftBody: {"x":8,"y":43,"width":156,"height":229}
opponentRightBody: {"x":616,"y":43,"width":156,"height":229}
heroNameplate: {"x":8,"y":249,"width":140,"height":31}
opponentLeftNameplate: {"x":16,"y":164,"width":140,"height":31}
opponentRightNameplate: {"x":632,"y":164,"width":140,"height":31}
heroHandLarge: {"x":164,"y":280,"width":608,"height":80}
tableActionBar: {"x":264,"y":227,"width":252,"height":45}
settlementShowcase: {"x":172,"y":32,"width":437,"height":180}
bottomCardsDock: {"x":297,"y":55,"width":187,"height":25}
```

## 测试与类型检查输出

```
npm --prefix test exec -- vitest run ui/table-zones-v13.test.ts
Test Files  1 failed (1)
Tests       16 failed (16)
主要失败：heroBody missing；作为实现前红测基线。

npm --prefix test exec -- vitest run ui/table-zones-v13.test.ts ui/table-zones.test.ts
Test Files  2 passed (2)
Tests       44 passed (44)

npm --prefix test test
Test Files  141 passed (141)
Tests       727 passed (727)

npm --prefix test run typecheck
tsc --noEmit passed

git diff --check
passed

rg -n "from 'cc'|from \"cc\"|import .*cc" assets/scripts/ui/table-zones.ts
No cc import; only source comment contains the phrase "import `cc`".
```

## 工作树状态

```
git status --short --untracked-files=all
 M assets/scripts/ui/table-zones.ts
```

## 非文字模态 / IDE 实操验收证据

- 验收面：不适用（纯 UI 布局算法，无 Cocos/浏览器实操）
- 用户主观终审状态：不适用

## 与 spec 的偏差 / 关键决策

- 未修改种子测试；`test/ui/table-zones-v13.test.ts` 保持规划者种子。
- 旧 `playerHand` 与 `actionBar` 保持兼容，不承担 v13 大手牌/大按钮职责；新增 `heroHandLarge` 与 `tableActionBar` 给 P-G4 消费。

## 疑问 / 需规划者裁定

- 无。

## 批次交接记录 / 下一步

- 所属批次 / 任务号：UI-REMAKE 第四波 / `T-LAYOUT3`
- 本回合结论 / 状态：布局契约实现完成，已自检全绿，待审查者按 `R-UI-REMAKE` 的 `R:T-LAYOUT3` 审查。
- 下一步找谁：审查者
- 用户终审配合：不适用
- 给下一窗口的可粘贴提示词（指针化）：

```
你是本仓库 斗地主 的审查型 AI。本批/任务号：T-LAYOUT3。
先读：coordination/PROTOCOL.md、coordination/tasks/T-LAYOUT3.md、coordination/tasks/R-UI-REMAKE.md、coordination/reports/T-LAYOUT3.report.md、coordination/BOARD.md 的 UI-REMAKE 段。
本回合最小增量：task/T-LAYOUT3 已实现 v13 TableZones，报告含四横屏 zone 尺寸、红测基线和全量测试/typecheck/diff-check 证据；请按 R:T-LAYOUT3 审查，勿替用户做视觉判断。
```

## 自检（对照验收项）

- [x] 测试全绿
- [x] typecheck 无错
- [x] `git status --short --untracked-files=all` 已记录，越域未跟踪文件已清理或说明
- [x] 仅改声明文件域
- [x] 未改测试、未碰他人模块
- [x] 未获精确机器态 `approved` 前未合并 main；高风险 `approved-pending-planner` 未直接合并；获批后仅由审查者通过 `agentctl.sh claim/merge/release` 合并
- [x] 未 import cc
