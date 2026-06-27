# M3-29 资源基线导入（预览包 → assets/resources/，Cocos 生成 .meta）

- 状态：ready（编辑器集成链 #1；M3-30 → M3-31 串行其后）
- 派发模式：**编辑器执行者**（非 worktree 纯逻辑协议·需 Cocos Creator 3.8.8）
- 执行分支：`task/M3-editor-integration`（M3-29→30→31 串行同一分支，**单写者**保 .meta UUID 一致）
- 文件域：
  - `assets/resources/art/cards/`（从 `asset-previews/pink-cartoon-production-v1/cards/` 导入：card-template、suit-spade/heart/club/diamond、joker-small/big）
  - `assets/resources/audio/`（从 `.../audio/wav/` 导入 9 个：deal/select/play/pass/bomb/rocket/win/lose/button）
  - `assets/resources/fonts/`（从 `.../fonts/` 导入：SourceHanSansCN-Regular.otf、SourceHanSansCN-Heavy.otf、LICENSE-SourceHanSans.txt）
  - `assets/scripts/ui/asset-keys.ts`（新·**纯逻辑·禁 cc**·逻辑键→`resources/` 加载路径对照）+ `test/ui/asset-keys.test.ts`（实现方自写）
  - `.meta`：**Cocos 编辑器自动生成，不手写**
- 依赖：无。是 **M3-30/M3-31 的硬前置**（场景缺资源则预制体引用 broken）

## 目标
把已验收的预览包（`pink-cartoon-production-v1`）物理导入 `assets/resources/`，让 Cocos 生成 `.meta`，并落一张可被场景绑定复用的「资源键→`resources` 路径」对照表，为大厅/游戏场景提供可引用资源。

## 步骤
1. **复制资源**（目录约定取自 `asset-previews/pink-cartoon-production-v1/MANIFEST.md` 的 "Suggested future Cocos import path" + `docs/ASSET_LIST.md`）：
   - 7 张卡牌 PNG → `assets/resources/art/cards/`（与既有 `card-back.png` 同目录共存）。
   - 9 个音效 → `assets/resources/audio/`。**优先转码 mp3**（移动端友好）；若本机无编码器，**先导 WAV**（Cocos 可识别），mp3 转码记入报告 follow-up。
   - 2 字体 + LICENSE → `assets/resources/fonts/`。
2. **生成 .meta**：在 Cocos Creator 打开工程，对新资源由编辑器自动生成 `.meta`（**不手写**）。
3. **资源键对照表** `ui/asset-keys.ts`（纯常量/函数，禁 cc）：
   - 牌面/花色/王、背景（lobby-bg/game-table-bg/settlement-bg 已在 main）、头像（player/farmer/landlord/ai-calm/ai-cheerful/avatar-frame 已在 main）、UI（button-set/panel-set/status-badges/action-icons 已在 main）、音效、字体的**逻辑键 → `resources/` 下加载路径（不含扩展名，符合 Cocos `resources.load` 约定）**。
   - 与既有 `ui/card-view.ts`（`assetKey`，见 `card-view.ts:10,19`）和 `ui/event-cues.ts`（cue id，见 `event-cues.ts:12-19`）**对齐不冲突**：asset-keys 负责「键→resources 路径」，card-view/event-cues 负责「领域对象→键」。
4. **自测** `test/ui/asset-keys.test.ts`：每个逻辑键有路径、路径无重复、覆盖 `card-view.assetKey` 全部产物 + `event-cues` 音效 cue。

## 验收
- 资源物理存在于 `assets/resources/{art/cards,audio,fonts}/`，`.meta` 由 Cocos 生成（非手写）。
- Cocos Creator 打开工程**无导入/编译错误**；音效可被 Cocos 识别（实际播放后置 M3-35）。
- `asset-keys.ts` 键表完备、`npm --prefix test test` 含其测试全绿、typecheck 净、零 cc。
- 报告记录：实际导入清单、是否转码 mp3、未尽项 follow-up。

## 测试命令
`npm --prefix test test`（asset-keys 纯逻辑部分）；资源/.meta/编辑器编译为人工 + 编辑器验收。
