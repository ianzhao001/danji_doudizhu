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

## 非文字模态 / IDE 实操验收证据（如适用，由执行者填写）
- 验收面：图像 / 音频 / 视频 / Cocos Creator / IDE / 浏览器调试 / 其他
- 环境与版本：
- 操作步骤：
- 原始证据路径（截图/录屏/样本/日志）：
- 结果摘要：
- 用户终审状态（如适用）：等待 / 通过 / 不通过 / 不适用

## 合并证据（approved 后由审查者回填）
- 合并前回归：
  - `npm --prefix test test`：
  - `npm --prefix test run typecheck`：
- merge commit：
- BOARD 状态：

## 与 spec 的偏差 / 关键决策
-

## 疑问 / 需规划者裁定
-

## 阻塞升级（转规划者，仅 blocked 时填写）
- 阻塞类型：spec/测试矛盾 / 文件域不足 / 环境或能力不可达 / 多轮修复不收敛 / 外部 gate / 其他
- 已尝试路径：
- 失败证据：
- 为什么不能由执行者/审查者继续解决：
- 建议选项：改 spec / 补测试 / 拆新任务 / 调整文件域 / 暂缓
- 需规划者裁定的问题：

## 自检（对照验收项）
- [ ] 测试全绿
- [ ] typecheck 无错
- [ ] 仅改声明文件域
- [ ] 未改测试、未碰他人模块
- [ ] 未获 `approved` 前未合并 main；获批后仅通过 `agentctl.sh claim/merge/release` 合并
- [ ] 未 import cc
