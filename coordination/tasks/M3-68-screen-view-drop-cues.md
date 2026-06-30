# M3-68 screen-view 去除死字段 `cues`（纯 UI 岛·审查转化）

- 状态：ready（纯逻辑·无依赖·可即认领）
- 派发模式：**纯 spec**（架构出任务定义；实现方改 VM + 同步其测试）
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/screen-view.ts`
  - `test/ui/screen-view.test.ts`（同步删除对 `cues` 的断言；**不得弱化**其余断言）
- 依赖：无
- 分支：`task/M3-68-screen-view-drop-cues`
- 来源：M6-editor 第三轮审查 #6（dead `vm.cues`）
- 禁 `cc` import（UI 纯岛）

## 背景（审查发现·已核实）
[screen-view.ts:46-48](assets/scripts/ui/screen-view.ts#L46-L48) 每次 `deriveScreenVM` 都 `recentEvents.map(cueForFlowEvent).filter(...)` 产出 `cues`（[字段 L21](assets/scripts/ui/screen-view.ts#L21)、[赋值 L59](assets/scripts/ui/screen-view.ts#L59)）。但 `game-scene-skeleton.ts` **从不读 `vm.cues`**（grep 确认）——cue 播放走 `playCue(event)` 独立路径；`recentEvents` 另在 `renderLastActions` 直接消费。该映射+过滤每帧空转。

## 行为要求
1. 从 `ScreenVM` 删除 `cues` 字段与其 `map/filter` 计算。
2. 若删除后 `recentEvents` 入参在 `deriveScreenVM` 内再无使用，一并从入参签名移除（连带清掉未用 import `cueForFlowEvent`/`CueId`）；若仍被其它逻辑用到则保留入参。**保持其余 VM 字段与返回结构不变**。
3. 同步更新 `screen-view.test.ts`：移除 `cues` 相关断言，其余覆盖不减。

## 验收
- `npm --prefix test test` 全绿（screen-view 测试同步通过，未弱化非 cues 断言）。
- `npm --prefix test run typecheck` 无错（无未用 import/参数遗留）。
- 仅改声明文件域；未 import `cc`；其余 VM 字段/契约不变（调用方 `game-scene-skeleton` 无需改，因其本就不读 `cues`）。

## 测试命令
`npm --prefix test test`
