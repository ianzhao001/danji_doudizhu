# <ID> <标题>

- 状态：todo
- 任务模式：seeded-red / pure-spec / editor-evidence / verify-only
- 文件域（**只允许改这些**）：
  - `assets/scripts/<...>`
  - `test/<...>`（测试由架构提供，实现方只读、可新增不可改）
- 依赖：<...>
- 分支：`task/<ID>`

## 目标
<一句话>

## 公共 API 契约（必须实现的签名/类型，由架构固定）
```ts
// ...
```

## 行为要求
- ...

## 验收
- `npm --prefix test test` 全绿（含本任务测试）
- `npm --prefix test run typecheck` 无错
- 仅改声明的文件域；未 import `cc`
- 合并按新流程：审查者在报告/BOARD 写精确机器态 `approved` 后，由审查者本人回到 main 重跑 test/typecheck，全绿再执行 `./coordination/agentctl.sh claim <ID>` → `merge <ID>` → `release <ID>`；高风险任务先置 `approved-pending-planner`，规划者批量把关通过并改回 `approved` 后再合并。
- 涉及图像/音频/视频、Cocos Creator、IDE、浏览器、截图/录屏等实操时，由执行者完成取证；用户主观终审不可由任何 AI 替代，但可由执行者配合用户进行并记录结论。

## 测试命令
`npm --prefix test test`
