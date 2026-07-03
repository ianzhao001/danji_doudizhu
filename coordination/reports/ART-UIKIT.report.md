# ART-UIKIT 实现报告

- 任务：ART-UIKIT — UI 皮肤缺口定向文生图（preview-only）
- 分支：`task/ART-UIKIT`
- 实现者：Codex
- 日期：2026-07-03

## 产出目录

全部产物均位于 `asset-previews/v12-uikit/`，未修改 `assets/resources/**`。

核心预览图：

- `seat-nameplate.png`：320x120，座位名字牌底板。
- `bottom-cards-dock.png`：480x160，三张底牌托架底板。
- `btn-primary.png`：240x96，按钮 primary v12 preview 重制。
- `btn-secondary.png`：240x96，按钮 secondary v12 preview 重制。
- `btn-disabled.png`：240x96，按钮 disabled v12 preview 重制。
- `uikit-review-sheet.png`：图审汇总图。
- `source/uikit-reference.generated.png`：内置 `image_gen` 生成的风格方向参考图。
- `PROMPTS.md`：生成 prompt、精修 prompt、弃用图集登记。

审查辅助：

- `corner-samples/*.png`：现有按钮 / 面板与 v12 按钮的 24px 四角裁样。
- `corner-samples/corner-metrics.txt`：角部 alpha/RGB 波动指标。
- `stretch-sim/*.png`：九宫格宽度拉伸模拟。
- `thumbs/*.png`：缩略预览。

## 九宫格判定

### 新增底板

| 文件 | 尺寸 | 模拟 | 结论 |
|---|---:|---|---|
| `seat-nameplate.png` | 320x120 | 176px / 320px width | 角部无纹样穿角，窄宽下装饰仍在主体内 |
| `bottom-cards-dock.png` | 480x160 | 214px / 360px width | 角部无纹样穿角，214px 下三格托架会压缩但仍可辨认 |

### 现有资源判定

| 现有资源 | 判定 | 依据 |
|---|---|---|
| `assets/resources/art/ui/panel-popup.png` | 保留，不重制 | 四角 24px alpha 全 0；214px / 360px 模拟未出现角部纹样拉伸 |
| `assets/resources/art/ui/btn-primary.png` | v12 重制 preview | 64px 模拟下侧边花饰被中段挤压，窄按钮适配风险明显 |
| `assets/resources/art/ui/btn-secondary.png` | v12 重制 preview | 与 primary 同结构，按三态一致性重制 |
| `assets/resources/art/ui/btn-disabled.png` | v12 重制 preview | 与按钮三态一起重制，去除窄宽中心装饰风险 |

## 重制按钮说明

v12 三态按钮移除了现有按钮两侧花饰，保留纯按钮底板：

- outer 24px 角部不放置图案。
- stretchable center 不放花饰、文字、图标。
- 64px 与 176px 宽度模拟均输出到 `stretch-sim/btn-*-stretch.png`。

## 弃用登记

以下 atlas-style 资源不重制、不作为 v12 图审输入；原因是缺少切分配置，且与单图资产重复：

- `assets/resources/art/avatars/avatar-frame-set.png`
- `assets/resources/art/ui/button-set.png`
- `assets/resources/art/ui/panel-set.png`
- `assets/resources/art/ui/status-badges.png`
- `assets/resources/art/ui/action-icons.png`

## 验证

- ✅ `find asset-previews/v12-uikit -maxdepth 2 -type f | sort`
  - 已确认 preview 包、prompt、角部裁样、拉伸模拟、缩略图齐全。
- ✅ `sips -g pixelWidth -g pixelHeight assets/resources/art/ui/btn-primary.png assets/resources/art/ui/btn-secondary.png assets/resources/art/ui/btn-disabled.png assets/resources/art/ui/panel-popup.png`
  - 已确认现有按钮 240x96，现有面板 900x1100。
- ✅ 视觉复核：
  - `uikit-review-sheet.png`
  - `stretch-sim/btn-primary-stretch.png`
  - `stretch-sim/seat-nameplate-stretch.png`
  - `stretch-sim/bottom-cards-dock-stretch.png`
  - `stretch-sim/panel-popup-stretch.png`
- ✅ `git status --short` 复核未触碰 `assets/resources/**`。

## 后续

等待用户视觉终审。若通过，后续 ART-IMPORT-UIKIT 再导入到 `assets/resources/**` 并配置 Creator 九宫格 border；本任务不执行导入。
