# M6-G15 难度平衡度量护栏

## 变更
- 新增 `test/selfplay/balance.test.ts`。
- 使用固定 seeds 1..8，对 hard/simple 与 normal/simple 做三座位轮换，消除座位偏置。
- 断言每局 settled 基本不变量：零和、turns 在 0..300 内；并比较 winRate/平均分。

## 验证
- 通过：`npm --prefix test test -- --run`（104 文件 / 509 用例）
- 通过：`npm --prefix test run typecheck`

## 说明
- 绿护栏任务，未修改产品码。
- 若后续红，按 spec 视为难度梯度产品问题暴露，不应通过放宽断言糊弄。
