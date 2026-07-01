# T-C0 asset-keys 资源绑定审计

- 状态：ready
- 文件域（**只允许改这些**）：
  - `assets/scripts/ui/asset-keys.ts`（若审计发现死键/命名不清可清理，**不动其它模块**）
  - 新 `coordination/reports/T-C0-asset-key-audit.md`（审计结论）
  - 可新增 `test/ui/asset-keys*.test.ts`（如需锁不变量；不可改既有测试）
- 依赖：T-DOC ✅
- 分支：`task/T-C0`

## 背景（关联规划书 §1、§6 T-C0；目标2「代码命名/绑定规范」侧）

`asset-keys.ts` 的 `RESOURCE_PATHS` 有 `fontRegular/fontHeavy`（已导入未消费）与大量资源键。审计其绑定/使用状态，梳理 SpriteFrame 加载路径一致性，产出结论文件，供 P-G/P-L 的「运行时节点命名/资源绑定规范」消费。**本轮不上字体**，只登记状态。

## 行为要求
1. 逐条核对 `RESOURCE_PATHS`：每个键 → 实际资源存在？被哪个组件消费？未消费的登记（如 `fontRegular/fontHeavy`）。
2. 核对 SpriteFrame 键统一经 `spriteFrameResourcePath()` 加载；列出**例外**（font/audio/appIcon/splash 等非 SpriteFrame 资源不走该路径，属正常）。
3. 如发现死键/命名不清，谨慎清理（不破坏现有加载）；否则只登记、不改代码。
4. 审计结论落 `coordination/reports/T-C0-asset-key-audit.md`：键清单 + 绑定/使用状态 + 例外说明 + 建议（供 P-G/P-L）。

## 验收
- `npm --prefix test test` 全绿 + `typecheck` 净；未 import 破坏纯边界（`asset-keys.ts` 现状与 cc 关系保持）。
- 审计报告存在且逐键有结论；SpriteFrame 例外清单明确。
- 若改了 `asset-keys.ts`：改动最小、现有资源加载不回归（编辑器或消费方 typecheck 佐证）。

## 交付物
- 分支 `task/T-C0` 提交；`coordination/reports/T-C0.report.md` + `T-C0-asset-key-audit.md`。
- 获架构 `approved` 后 `claim → merge → release` 自合。

## 测试命令
`npm --prefix test test`
