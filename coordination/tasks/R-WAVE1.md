# R-WAVE1 — v1.2 Wave 1 审查任务书（审查者专用）

- 适用任务：T-DEDUP / T-LAYOUT2 / T-FLOW-BID / T-AI-1 / ART-UIKIT（各自执行任务书在 `tasks/<ID>.md`）
- 角色与流程：见 [PROTOCOL.md](../PROTOCOL.md) 审查者工作流。**通过=你写 `approved`+你合并+验收披露回复规划者；不通过=`changes-requested` 直接打回执行者**（规划者不参与打回循环）。
- 通用核验（每个任务都做）：
  1. **文件域**：`git diff --name-only main...task/<ID>` 逐一对照 spec 文件域，越界=打回。
  2. **种子测试完整性**：`git log main..task/<ID> -- test/` 中除规划者种子提交外，执行者提交**不得触碰 test/**（新增测试允许，改动/删除既有断言=打回）。
  3. **双绿**：`npm --prefix test test`（基线 134 文件/660 + 各任务新增）与 `npm --prefix test run typecheck`。
  4. **红线核查**（各任务见下）+ 你的自主判断（检查单外问题同样可打回）。
  5. 合并按 lane 顺序排队：**T-DEDUP → T-LAYOUT2 → T-FLOW-BID → T-AI-1**（ART-UIKIT 用户图审通过后随到随合）。

---

## R:T-DEDUP 检查单
- [ ] `grep -rn "doudizhu\." assets/scripts --include=*.ts` 仅命中 `data/storage-keys.ts`（两巨组件 7 处字面量全替换、键值一字不变）。
- [ ] `isAiLevel` 全仓仅一处定义（settings/difficultyConfig 复用；回退 Normal 行为不变）。
- [ ] rank 数组归一未改变 `cardMemory`/`handStrength` 各自顺序语义（若二者原始内容不一致而未合并，报告须有说明）。
- [ ] **红线**：未碰 `ai/levels/**`；未合并 `game-scene-skeleton.ts:101` 的 `cardsSignature`（顺序敏感动画签名）。
- [ ] 组件替换后自测证据：一张 lobby CDP 截图（设置/难度读写不回归）。

## R:T-LAYOUT2 检查单
- [ ] 种子 `test/ui/table-zones.test.ts` 28 用例全绿；**既有 `table-layout*.test.ts` 零改动全绿**（竖屏/无参 toEqual 契约一字未破）。
- [ ] `table-layout.ts` 若被微调：仅 `landscapeLayout` 内部数值，6 个旧字段结构未动。
- [ ] 抽查数值合理性（不只测试绿）：报告应附四分辨率 zone 坐标表；肉眼核 780×360（最紧档）各 zone 不出屏、宽高够用（如 actionBar 能放下 3 键、手牌带高度 ≥80）。
- [ ] **红线**：纯函数、无 `cc` import、无随机性。

## R:T-FLOW-BID 检查单
- [ ] 种子 `test/flow/bidding-visibility.test.ts` 3 用例 + `screen-view.test.ts` biddingHand 用例全绿；既有 `test/flow`/`test/runtime` 零改动全绿。
- [ ] **红线**：`currentSnapshot()` 叫抢期仍返回 null（不得伪造快照）；`types.ts`/`driver.ts`/`policies.ts` 未被执行者改动（types 的新成员是规划者种子提交）。
- [ ] `biddingDeal()` 返回副本（外部 mutate 不污染内部——种子有断言，另抽查实现是否 slice/复制）。
- [ ] persist rider 只在**成功** apply 路径调用（审 diff：异常/非法路径无调用）；AI 路径与玩家路径都覆盖。
- [ ] `bottomRevealed` 的 cards 是 `deal.bottom` 副本且只发一次（redeal 后新一副）。

## R:T-AI-1 检查单
- [ ] 种子全绿：`normal-combo`（6）+ `tie-breaker`（normal→顺子）+ `selfplay/quality`（两道门）；**零改动全绿**：`simple/hard/hardening/conservative-action-paths/hint/hint-rank/balance`。
- [ ] 质量门数值（对照 Wave 0 基线：组合率 Simple 0/166、Normal 0/164；压队友率 1.0；胜率差 −0.067）：实现后 Normal 组合率 ≥0.35、Simple ≤0.15、压队友 ≤0.20、胜率差 ≥+0.05；质量套件运行 <120s。
- [ ] **红线**：`compareMoves`/`pickSmallest`/`pickLargest` 语义一字未动（hint 链共享）；`simple.ts` 行为未动；`_shared.ts` 只加不改；`hard.ts` 仅 cardKey→rules import + isTeammateTop 上移两处机械替换（`git diff` 逐行核）。
- [ ] 确定性：策略不消费 rng 引入随机（种子有断言，另审 diff 无 `rng.` 新调用）。
- [ ] 自主判断项：lead-score 的评分是否可解释（报告应说明权重取舍）；出完即胜的收官单张是否被组合偏好误伤（若有，打回）。

## R:ART-UIKIT 检查单
- [ ] 只有 `asset-previews/v12-uikit/` + report（**未碰 assets/resources**）。
- [ ] 九宫格安全判定齐全：现有 btn-*/panel-popup 的角部裁样图 + 结论；新图四角平坦区达标（名字牌 ≥24px、按钮四角 24px 无穿角纹样）。
- [ ] 拉伸模拟图齐全：按钮 64px/176px 两档、面板 214px/360px 两档。
- [ ] PROMPTS.md 记录生成 prompt；风格与现有粉色卡通基线一致（与 `assets/resources/art/backgrounds/` 对照）。
- [ ] **本任务合并前置**：需**用户视觉终审通过**记录在 report（审查者核流程完整性，美术好坏以用户终审为准）。

---

## 验收披露格式（每任务合并后写进 `reports/<ID>.report.md` 尾部并回复规划者）
```
## 验收披露（审查者）
- 结论：approved @ <commit>
- 打回轮次：N（每轮一句原因）
- 检查单核销：全过 / 例外项说明
- 自主判断发现：（有则列）
- 合并：claim <sha> / merge <sha> / release <sha>；合并后基线：<X files/Y tests> 绿 + typecheck 净
```
