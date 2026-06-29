# M3-43 叫抢建议视图模型

## 变更
- 新增 `assets/scripts/ui/bidding-advice-view.ts`，导出 `deriveBiddingAdviceView`。
- 新增 `test/ui/bidding-advice-view.test.ts` 覆盖 call/grab/pass 三种建议与强调态。

## 验证
- 通过：`npm --prefix test test -- --run`（104 文件 / 510 用例）
- 通过：`npm --prefix test run typecheck`

## 说明
- 只消费 `BidAdvice`，不重算叫抢逻辑。
- 零 `cc`，未修改桶导出。
