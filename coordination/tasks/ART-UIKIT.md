# ART-UIKIT — UI 皮肤缺口定向文生图（preview-only · 用户视觉终审）

- 状态：ready（**最早派发**——用户图审是全链唯一外部时钟）
- 类型：美术 · 文生图（执行者生成）
- 文件域（**只允许改这些**）：
  - `asset-previews/v12-uikit/`（生成图 + PROMPTS.md + 拉伸模拟图）
  - `coordination/reports/ART-UIKIT.report.md`
  - **不碰** `assets/resources/**`（导入属 ART-IMPORT-UIKIT，须用户终审后）
- 依赖：—
- 分支：`task/ART-UIKIT`

## 背景（v1.2 规划书 §1-1 · 用户裁决「接线现有+定向新生成」）

33 张已导入美术将由 P-G3③/P-L3② 直接接线（头像/图标/徽标/牌背/胜负徽/空态等）。本任务只生成**真空缺**与**九宫格适配风险件**。风格延续现有粉色卡通基线（参考 `asset-previews/` 既有包与 `assets/resources/art/backgrounds/`）。

## 需要产出

| 图 | 规格 | 九宫格要求 |
|---|---|---|
| `seat-nameplate.png` 座位名字牌底板 | ~320×120 | 四角 ≥24px 平坦区、无穿角纹样 |
| `bottom-cards-dock.png` 底牌区版式底板（3 张底牌托架） | ~480×160 | 同上 |
| 按钮三态 `btn-primary/secondary/disabled` **重制**（仅当现图九宫格不安全时） | 240×96 | 四角 24px 内无渐变/纹样穿角 |
| `panel-popup` **重制**（仅当现图不安全时） | 900×1100 | 同上 |

- **先做判定**：对现有 `assets/resources/art/ui/btn-*.png` 与 `panel-popup.png` 出具九宫格安全性判定（角部裁样图）；安全则**不重制**、report 记录判定依据。
- **每张新图必附**：生成 prompt；缩略预览；**64px 与 176px 两档目标宽的九宫格拉伸模拟对照图**（按钮）/ 214px 与 360px 两档（面板）——把「图不适配」的发现从导入后提前到图审时。
- 5 张 `*-set`/`status-badges`/`action-icons` 图集**登记弃用**（无切分配置、与单图重复），不重制。

## 验收（用户视觉终审）
- `asset-previews/v12-uikit/` 齐全 + 判定/模拟图 + PROMPTS.md；用户终审通过后进入 ART-IMPORT-UIKIT（导入 + Creator 配九宫格 border + asset-keys 新键；**届时也不碰两巨组件**，接线归 P-G3③/P-L3②）。

## 交付物
分支提交 preview + report；获架构 `approved`（含用户终审记录）后 `claim→merge→release`。
