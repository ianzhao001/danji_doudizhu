# <ID> <标题>

- 状态：todo
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
- 合并按新流程：架构在报告/BOARD 给 `approved` 后，执行者回到 main 重跑 test/typecheck，全绿再执行 `./coordination/agentctl.sh claim <ID>` → `merge <ID>` → `release <ID>`

## 测试命令
`npm --prefix test test`
