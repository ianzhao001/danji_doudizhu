# <ID> 实现报告

- 实现方标识：
- 分支：`task/<ID>`
- 状态：in-review / blocked / changes-requested / approved / merge-claimed:<ID> / done <commit>

## 改了哪些文件
-

## 测试与类型检查输出
```
<贴 npm --prefix test test 与 npm --prefix test run typecheck 结果>
```

## 合并证据（approved 后由执行者回填）
- 合并前回归：
  - `npm --prefix test test`：
  - `npm --prefix test run typecheck`：
- merge commit：
- BOARD 状态：

## 与 spec 的偏差 / 关键决策
-

## 疑问（给架构）
-

## 自检（对照验收项）
- [ ] 测试全绿
- [ ] typecheck 无错
- [ ] 仅改声明文件域
- [ ] 未改测试、未碰他人模块
- [ ] 未获 `approved` 前未合并 main；获批后仅通过 `agentctl.sh claim/merge/release` 合并
- [ ] 未 import cc
