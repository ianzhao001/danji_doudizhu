# M3-45 战绩/历史明细屏实现报告

## 任务范围

- 任务：M3-45-stats-records-screens
- 分支：`task/M6-editor`
- 文件域：`assets/scripts/ui/components/lobby-scene.ts` + 本报告 + 390x844 验收截图
- 场景/Meta：未手写、未修改 `assets/scene/lobby.scene` / `.meta`；沿用既有 `LobbyScene` 运行时注入节点路径。

## 实现说明

- 大厅底部入口扩展为 `教程 / 帮助 / 战绩 / 历史` 四项。
- 战绩屏消费 `deriveStatsDetailView(digestRecords(records))`，records 从 `doudizhu.records` 本地存储读取并经 `migrateRecords` 容错迁移。
- 历史屏消费 `deriveRecordsDetailView(records, query)`，支持结果过滤 `全部 / 胜 / 负`、角色过滤 `全部 / 地主 / 农民`、顺序过滤 `最新 / 最早`，点击后重渲。
- 顶部大厅概览继续读取 `doudizhu.stats` / `doudizhu.records`，子屏统计使用记录明细派生，组件不重算业务规则。

## Cocos Creator 复核

- Creator：3.8.8
- Preview：`lobby.scene` (`dc62324b-10d4-4870-9518-1a34ce682067`)
- 分辨率：390x844（DPR2 原图 780x1688，验收图下采样为 390x844）
- 截图：
  - `coordination/reports/M3-45-stats-screen-390x844.png`
  - `coordination/reports/M3-45-records-filter-390x844.png`
- CDP 注入的验证记录：
  - 3 局：地主胜 +8、农民负 -4、农民胜 +16（春天、炸弹 x2）
  - 战绩屏显示：总局数 3、胜利 2、失败 1、胜率 67%、连胜 1、最佳净分 16、最差净分 -4、炸弹数 3、春天数 2、地主局 1（胜 1）、农民局 2（胜 1）
  - 历史过滤态显示：`胜局·农民·最新`，结果行 `胜 农民 +16 ×8 春天 炸弹×2`
  - 运行时 `ERROR_EVENTS []`
- 布局：两张 390x844 截图均未出现面板溢出；返回按钮可见。

## 验证

- `npm --prefix test run typecheck`
- `npm --prefix test test -- ui/stats-detail-view.test.ts ui/records-detail-view.test.ts ui/records-view.test.ts ui/stats-view.test.ts ui/lobby-view.test.ts`
- `npm --prefix test test`
- `git diff --check`
- `rg -n "from 'cc'|from \"cc\"" assets/scripts/{rules,game,ai,flow,data} assets/scripts/ui/{stats-detail-view,records-detail-view,records-view,stats-view,lobby-view}.ts`

## 备注

- 本任务没有引入新组件文件或 `.meta`，避免手写 Cocos 资产。
- Creator 本地未提交噪声检查：未发现 `package.json` / `settings/` / `profiles/` 变更。
