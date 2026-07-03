# V — Wave 3 收口：发布态横屏 e2e 冒烟 + PLAYTEST

- 状态：ready（P-G ✅ / P-L ✅ / ART-IMPORT-06 ✅ 全落 main，main `7b7ee53` 发布态真背景）
- 类型：**验证 + 记录**（verify-only，**不改产品代码**）
- 文件域（**只允许改这些**）：
  - `coordination/reports/V.report.md`
  - 截图/CDP 证据落 `/tmp/doudizhu-v11-visual-gate/V/`（仓库外，报告里记路径）
- 依赖：P-G ✅ / P-L ✅ / ART-IMPORT-06 ✅（均已并 main）
- 分支：`task/V`
- **worktree 测试环境**：新 worktree 若报缺 `./temp/cli/tsconfig.cocos.json`，`mkdir -p temp/cli && cp /Users/admin/Documents/Cocos/斗地主/temp/cli/tsconfig.cocos.json temp/cli/`。

## 背景（关联规划书 §4 V / §7 Wave 3）

P-G/P-L/ART-IMPORT-06 各自的 CDP 视觉门是**孤立桩态**（stub 单屏截图）。V 是**集成 e2e**：在合并后的发布态 main 上跑**真实一局的状态流转**（发牌→叫抢→出牌→暂停/恢复→结算→回大厅），照出仅在真流程出现、桩态照不到的问题（例如叫牌提示文案、回合切换提示、动画、暂停中态）。V-0 baseline 未落盘 → **不做回归 diff，作发布态全新验证**。

## 行为要求

### 1. 构建发布态
- Cocos Creator 3.8.8 web-mobile 构建当前 main（发布态真背景已在 main）。确认 `build/web-mobile/src/settings.json`：`orientation:"landscape"`、`designResolution 844×390`。

### 2. 四横屏 e2e 冒烟（**真实流程，非桩态**）
四分辨率：**844×390 / 812×375 / 915×412 / 780×360**。每分辨率驱动一条完整链路并截图：
1. **大厅** home（三栏：入口 / 难度 / 设置）。
2. 点「**开始新局**」→ 进 game。
3. **叫抢阶段**：截图（**重点看提示文案**——是否仍出现「座位 N」等原始座位号，见已知项 T-COPY-BID）。
4. **出牌阶段**：出牌 / 不要 / 提示各一次，截图（手牌铺底、HUD 不叠压、按压反馈）。
5. **暂停**→ 暂停菜单 → 恢复，截图。
6. **结算**：一局分出胜负 → 结算弹层（透明外区无黑边、分数行文案），截图。
7. 「**返回大厅**」→ 回 home，截图。
- 每屏 `productErrors=[]`（favicon 404 可忽略）。

### 3. 交互复核（发布态）
- 大厅入口 / 游戏按钮 / 结算按钮均**真按钮**、有可见按压态；手牌点击有按压反馈且选牌/出牌功能正常。
- 无纯文字裸点击区残留；导航（大厅↔game、暂停↔恢复）在横屏可用。

### 4. 发现记录（**关键产物**）
- 报告列**发现清单**，每条：现象 + 截图 + **归属文件域**（供架构補发 scoped-fix），按 blocker / nit 分级。
- **已知待修（预登记）**：`bidding-view.ts:28/38` 叫抢提示 `请座位 ${turn+1} 行动` 暴露原始座位号 → **T-COPY-BID**（本 V 复核其现状并归档，不在 V 内修）。

## 验收
- `npm --prefix test test`（134/659 不回归）+ `npm --prefix test run typecheck` 净（V 不改代码，应天然通过；作发布态 sanity）。
- 四横屏 × 全链路截图齐全、`productErrors=[]`；证据落 `/tmp/doudizhu-v11-visual-gate/V/` + `summary.json`。
- 发现清单成文于 `coordination/reports/V.report.md`（含 T-COPY-BID 现状复核）。
- **注**：最终「好不好玩 / 手感」的主观 PLAYTEST 终审属**用户**；V 执行者产出的证据+清单供用户高效终审。

## 不可做（护栏）
- **不改任何产品代码**（发现的 bug 一律进发现清单，由架构按域補发 scoped-fix，V 只验证）。
- 不改测试；不碰他人文件域；不手写 `.scene`/`.meta`。

## 交付物
- 分支 `task/V` 提交 `coordination/reports/V.report.md`；证据目录路径写入报告。
- 获架构 `approved` 后 `claim → merge → release` 自合（单 lane）。

## 测试命令
`npm --prefix test test`
