# M3-65 大厅 home 密度重排 + 子屏不透明（编辑器·审查转化·M3-45/55/59/46a 打磨）

- 状态：blocked（待本批 M3-45/M3-55/M3-59/M3-46a 入 main；编辑器串行）
- 派发模式：编辑器执行者（Cocos Creator 3.8.8·单写者）· 编辑器串行分支
- 文件域：`assets/scripts/ui/components/lobby-scene.ts` + `.meta`、report
- 依赖：M3-45（战绩/历史屏）+ M3-55（教程入口）+ M3-59（难度面板）+ M3-46a（帮助入口）**全部入 main**
- 来源：M6-editor 第二批审查（通过）非阻塞项 #1、#3
- 验收按 BOARD「编辑器任务验收模板」

## 背景（审查发现）
多任务串行往 lobby home 累加「难度面板 + 三个 toggle + 教程/帮助/战绩/历史四入口」后，底部三排按钮密度过挤、未统一重排；子屏面板半透明导致 home 数据透出。功能均可达（战绩/历史已证可进、可返回），属**纯观感/密度**问题，本任务收口。

1. **home 三排纵向交叠**：难度面板 `setPosition(0, -296)` 尺寸 336×210（顶边≈ y −191）与 toggle 行 `y=-244`（[lobby-scene.ts:170](assets/scripts/ui/components/lobby-scene.ts#L170)）、入口行 `y=-218`（[lobby-scene.ts:248](assets/scripts/ui/components/lobby-scene.ts#L248)）相邻处各约 9px 交叠；且常驻 @property `难度 X` label 被难度面板顶边裁切。
2. **子屏透出**：战绩/历史/教程/帮助面板 fill α≈222–232（如 `new Color(36,42,58,232)`），面板后可隐约见 home 的 局数/胜率/净分/难度 label。

## 行为要求
1. **重排 home 底部区**：难度面板、toggle 行、四入口行三者**纵向不交叠**（建议各留 ≥8px 间隙）；常驻 `难度 X` label 不被面板裁切（下沉面板 / 上移 label / 或面板态隐藏该冗余 label，择一·report 说明）。四入口（教程/帮助/战绩/历史）保持全部可见可点。
2. **子屏不透出**：进入 tutorial/help/stats/records 任一子屏时，home 的 @property 数据 label 不可见（面板 fill 提至不透明，**或**子屏态隐藏/移出这些 home label，择一·report 说明）。
3. 守 scene/meta 铁律（运行时注入·不手写 scene/meta）。390×844 不溢出；四入口仍可达、子屏 `返回` 仍回 home。

## 验收
- home 三排不交叠、`难度` label 不被裁切；四入口可点、进入战绩/历史/教程/帮助再 `返回` home 正常。
- 任一子屏打开时 home 数据 label 不透出。
- Creator 编译零报错；cc 仅在组件。
- **390×844 截图**：① home（难度面板+toggle+四入口 clean 不交叠）；② 任一子屏（无 home 透出）。
- report 按编辑器验收模板填全（Creator 版本/分辨率+截图路径/scene·meta 改动/worktree 残留/Console 零报错）。
