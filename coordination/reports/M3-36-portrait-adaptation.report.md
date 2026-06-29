# M3-36 / M6-C3a portrait adaptation 实现报告

- 实现方标识：Codex
- 分支：`task/M6-editor`
- 状态：done for C3a（待审查者确认 `settings/v2/packages/project.json` 范围例外后合并）
- Creator 版本：Cocos Creator 3.8.8

## 改了哪些文件
- `assets/scene/lobby.scene`
  - Canvas 根节点追加 `cc.SafeArea`。
  - `lobby-bg` 追加全屏 `cc.Widget`，用于 fit-width / 高机型下背景铺满。
- `assets/scene/game.scene`
  - Canvas 根节点追加 `cc.SafeArea`。
  - `game-table-bg` 追加全屏 `cc.Widget`，用于 fit-width / 高机型下背景铺满。
- `settings/v2/packages/project.json`
  - 设置设计分辨率为 `390x844`，`fitWidth: true`，`fitHeight: false`。
  - 这是 C3a 的范围例外：Cocos Creator 3.8.8 的设计分辨率 / ResolutionPolicy 配置落在 `general.designResolution.*`，不写入 `.scene`。不提交该配置时 Preview 会继续按 1280x720 运行，三档截图无法代表目标移动端基线。
- `coordination/reports/M6-C3a-*.png`
  - 6 张多分辨率截图落盘，见下。
- `docs/QA_CHECKLIST.md`
  - 更新 UI 验收证据，不关闭仍需 C4 复核的设置弹窗项。

## 截图证据
- `coordination/reports/M6-C3a-lobby-390x844.png`
- `coordination/reports/M6-C3a-game-390x844.png`
- `coordination/reports/M6-C3a-lobby-412x915.png`
- `coordination/reports/M6-C3a-game-412x915.png`
- `coordination/reports/M6-C3a-lobby-360x780.png`
- `coordination/reports/M6-C3a-game-360x780.png`

尺寸复核：
```
sips -g pixelWidth -g pixelHeight coordination/reports/M6-C3a-*.png
M6-C3a-game-360x780.png   360 x 780
M6-C3a-game-390x844.png   390 x 844
M6-C3a-game-412x915.png   412 x 915
M6-C3a-lobby-360x780.png  360 x 780
M6-C3a-lobby-390x844.png  390 x 844
M6-C3a-lobby-412x915.png  412 x 915
```

## Creator / Console 复核
- 打开方式：Cocos Dashboard -> `M6-editor` -> Cocos Creator 3.8.8，项目路径 `/Users/admin/Documents/Cocos/斗地主.worktrees/M6-editor`。
- 预览地址：`http://localhost:7456/`。
- 运行时检查：`lobby` / `game` 场景均可加载；Canvas 上存在 `cc.SafeArea`，背景节点存在 `cc.Widget`。
- Console 状态：未捕获脚本错误 / pageerror。Chrome headless 截图阶段仅出现 WebGL `GPU stall due to ReadPixels` 性能 warning，属于截图读像素告警，不是项目运行错误。
- 本地残留：仅有 ignored 的 `library/`、`profiles/`、`temp/`、`test/node_modules/` 运行目录；没有提交 `package.json` 噪声。`settings/v2/packages/project.json` 为本任务的显式配置变更，不作为本地噪声处理。

## 测试与类型检查输出
```
npm --prefix test test -- --testTimeout=60000
Test Files  127 passed (127)
Tests       623 passed (623)

npm --prefix test run typecheck
tsc --noEmit
```

## 与 spec 的偏差 / 关键决策
- C3a 任务书文件域未列 `settings/v2/packages/project.json`，但任务目标明确要求 Canvas ResolutionPolicy = fit-width。经 Creator 3.8.8 配置结构核对，fit-width 目标只能通过 `settings/v2/packages/project.json` 的 `general.designResolution` 落地。请规划者 / 审查者确认该范围例外；若不接受，需要另开配置任务，否则三档 Preview 基线会回退到 1280x720。
- 本次只建立 SafeArea + fit-width + 截图基线，不改 `game-scene-skeleton.ts`。底部按钮的更精细相对布局和 render diff 去抖仍归 C3b。

## 自检（对照验收项）
- [x] `lobby.scene` Canvas 根加 `cc.SafeArea`
- [x] `game.scene` Canvas 根加 `cc.SafeArea`
- [x] 设计分辨率 `390x844` + fit-width 配置生效
- [x] 背景节点在 390x844 / 412x915 / 360x780 下铺满视口
- [x] 390x844 大厅 + 游戏截图落盘
- [x] 412x915 大厅 + 游戏截图落盘
- [x] 360x780 大厅 + 游戏截图落盘
- [x] Creator Preview 无脚本错误
- [x] 既有测试 / typecheck 不受影响
