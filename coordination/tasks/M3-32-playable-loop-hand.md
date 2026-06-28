# M3-32 可玩闭环：运行时接线 + 手牌交互（keystone）

- 状态：ready（编辑器交互链 #1）
- 派发模式：**编辑器执行者**（非 worktree·需 Cocos Creator）
- 执行分支：`task/M3-interaction`（M3-32→33→34→35→36 串行同一分支，单写者保 game.scene/.meta 一致）
- 文件域：
  - `assets/scene/game.scene`（编辑器改：挂控制器、连节点引用）
  - `assets/scripts/ui/components/game-scene-skeleton.ts`（**重写**：去除 mock，改真实 `round-runtime` 驱动；可改名 `game-scene.ts` 但更新 .scene 引用）
  - `assets/scripts/ui/components/*`（如需新交互子组件·import cc·**不被任何测试 import**）
  - prefab（手牌/座位如需）+ `.meta` 编辑器生成
- 依赖：M3-31（骨架·已并 main）、**M5-21 `round-runtime`**、**M5-20 `cocosStorage`**、**M5-13 `session`**、view-model（`screen-view`/`hand-interaction`/`selection`/`card-view` 均在 main）

## 目标
把游戏主场景从「mock 门面 + 静态 fixtures」换成**真实可玩闭环**：组合根实例化 `round-runtime`、注入 `cocosStorage` 与持久化回调、订阅事件渲染；玩家可点选手牌（选中上浮）。AI 座自动推进可见，hero 回合暂停等输入。

## 组合根接线（onLoad）
```ts
import { cocosStorage } from '../../runtime/cocos-storage';
import { restoreRound, persistRound, commitFinishedRound, type SessionKeys } from '../../data';
import { loadSettings } from '../../data';
import { difficultyConfig } from '../../data';
import { startRoundRuntime, resumeRoundRuntime } from '../../flow';
import { realClock } from '../../flow';

const KEYS: SessionKeys = { save: 'doudizhu.save', stats: 'doudizhu.stats', records: 'doudizhu.records' };
const HERO: SeatIndex = 0;
```
1. `const storage = cocosStorage();`
2. `const settings = loadSettings(storage, 'doudizhu.settings');` → AI 难度 `level = settings.difficulty`；`levels = [level, level, level]`（hero 座条目不被 facade 使用，hero 为人类）。
3. `const resume = restoreRound(storage, KEYS);`
4. config：`{ seed: Date.now()>>>0, heroSeat: HERO, levels, thinkingDelayMs: 600, clock: realClock, baseScore: settings...?, persist: p => persistRound(storage, KEYS, p), onSettled: f => commitFinishedRound(storage, KEYS, { result: f, heroSeat: HERO, playedAt: Date.now() }) }`
5. `this.runtime = resume ? resumeRoundRuntime(resume, config) : startRoundRuntime(config);`
6. `this.unsub = this.runtime.onEvent(e => { this.recent.push(e); this.render(); });`（onDestroy 调 `this.unsub?.()` + `this.runtime.dispose()`）
7. 初次 `this.render()`。

## render（每次事件/选牌后）
`deriveScreenVM({ snapshot: runtime.currentSnapshot() ?? undefined, bidding: runtime.currentBidding() ?? undefined, heroSeat: HERO, selectedCards: this.selected, recentEvents: this.recent.slice(-12), layoutOpts: { containerWidth: 390, cardWidth: 56, liftOffset: 18 }, settlement: runtime.settlement() ?? undefined })` → 绑：背景、手牌区（`vm.hand` 逐张 SpriteFrame + x/y/lift）、两 AI 座剩牌数、当前出牌区、倍数/身份/底牌占位（`vm.topBar`）。

## 手牌交互
- 每张手牌节点挂点击：toggle 选中（复用 `selection` VM 的 toggle，保持不可变）→ 更新 `this.selected`（Card[]）→ `render()`（选中牌按 `vm.hand[i].lifted` 上浮）。
- 仅 hero 回合（`runtime.isPlayerTurn()` 且 phase==='playing'）允许选牌；非 hero 回合点击忽略。
- 出牌/过牌按钮在 M3-33；本任务先让「选牌可见 + AI 自动推进 + 结算落库」跑通。

## 验收
- Cocos 打开 `game.scene` 无报错；运行：发牌→叫抢(AI/默认)→出牌循环 AI 自动可见→hero 手牌可点选上浮→（hero 出牌待 M3-33）→结算 `onSettled` 落库（save 槽清、stats/records 写，可在大厅续局/战绩侧验证）。
- 组件 import cc 但**不被任何测试 import**；`npm --prefix test test`/`typecheck` 不受影响（纯逻辑零改）。
- **390×844 截图**一张（运行中桌面 + 选牌上浮）。
