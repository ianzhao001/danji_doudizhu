# M3-58 难度选择视图模型（消费 difficultyConfig · 第十二批·打磨）

- 状态：**ready**（依赖 `data/difficultyConfig.ts` 已在 main）
- 派发模式：纯逻辑 worktree · 禁 cc · 纯 spec
- 分支：`task/M3-58-difficulty-picker-view`（`git worktree add ../斗地主.worktrees/M3-58 -b task/M3-58-difficulty-picker-view main`）
- 文件域：`assets/scripts/ui/difficulty-picker-view.ts`（新）、`test/ui/difficulty-picker-view.test.ts`（新）、report

## 目标
难度选择面板的 VM：三档选项（标签 + 描述 + 是否当前选中），复用 `difficultyConfig()`/`difficultyOptions()`，不重写配置。

## 接口
```ts
export interface DifficultyOptionView { level: AiLevel; label: string; description: string; selected: boolean; }
export interface DifficultyPickerView { options: DifficultyOptionView[]; }
export function deriveDifficultyPicker(current: AiLevel): DifficultyPickerView;
```
- 三档顺序 simple/normal/hard；`label`/`description` 取自 `difficultyConfig(level)`；`selected = level===current`。
- 纯函数、确定性、不可变；零 cc。

## 验收
- 测试：三选项齐全且 label/description 来自配置、selected 仅当前档为 true、非法 current 回退（按 difficultyConfig 既有非法→Normal 行为）。
- 全绿、typecheck 净、零 cc、report 落盘。
