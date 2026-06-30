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
1. 从 `ScreenVM` 删除 `cues` 字段与其 `map/filter` 计算（去掉 `cueForFlowEvent`/`CueId` import）。
2. **⚠️ caller/callee 一致性（第一轮被打回点）**：`game-scene-skeleton.ts` 的 `deriveScreenVM({...})` 调用**仍传 `recentEvents: this.recentEvents`**。该组件 import `cc`、**不在 test tsc 程序内**（test tsconfig 在 `test/` 下 `include:["**/*.ts"]`，只编译 `test/**`+被 import 文件；无测试 import 该组件）——故「typecheck 绿」**无法证明 caller 没坏**；删入参会让 Cocos 编译报 TS2353 excess-property。二选一并在 report 说明：
   - **A（推荐·自洽于纯岛）**：**保留 `recentEvents` 入参类型**（`FlowEvent[]`，保留 `FlowEvent` import），仅删 `cues` 字段+计算+`cueForFlowEvent`/`CueId` import；函数体不再解构/使用 `recentEvents`。caller 零改。
   - **B**：删 `recentEvents` 入参，**并**同步删 `game-scene-skeleton.ts` 调用处 `recentEvents: this.recentEvents,` 一行（注意 `this.recentEvents` 仍用于 `renderLastActions`，只删传参不删字段）。**touch cc 组件 → 需 Creator 3.8.8 编译零报错复核**。
3. 同步更新 `screen-view.test.ts`：移除 `cues` 相关断言，其余覆盖不减。

## 验收
- `npm --prefix test test` 全绿（screen-view 测试同步通过，未弱化非 cues 断言）。
- `npm --prefix test run typecheck` 无错。
- caller/callee 一致：选 A 则 caller 不动且类型仍接受；选 B 则**附 Creator 编译零报错证据**（该组件不在 test tsc 程序内，test 绿不充分）。
- 仅改声明文件域（选 B 额外允许 `game-scene-skeleton.ts` 删一行传参）；未 import `cc`（screen-view 侧）。

## 测试命令
`npm --prefix test test`
