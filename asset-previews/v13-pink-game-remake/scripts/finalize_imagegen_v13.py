from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "source" / "generated-v13"
OUT_BG = ROOT / "backgrounds"
OUT_AVATAR = ROOT / "avatars"
OUT_UI = ROOT / "ui"
OUT_CARDS = ROOT / "cards"
OUT_STRETCH = ROOT / "stretch-simulations"
OUT_COMPOSITES = ROOT / "composites" / "v13"

KEY = (0, 255, 0)
TRANSPARENT = (0, 0, 0, 0)


@dataclass(frozen=True)
class CropSpec:
  source: str
  box: tuple[int, int, int, int]
  out: str
  size: tuple[int, int]
  pad: int = 10
  mode: str = "contain"


AVATAR_SPECS = [
  CropSpec("avatars-v13-source.png", (45, 35, 560, 825), "avatars/hero-body-v13.png", (320, 360), 0),
  CropSpec("avatars-v13-source.png", (600, 40, 1090, 825), "avatars/left-ai-body-v13.png", (360, 520), 0),
  CropSpec("avatars-v13-source.png", (1190, 35, 1705, 825), "avatars/right-ai-body-v13.png", (360, 520), 0),
]

UI_SPECS = [
  CropSpec("ui-v13-source.png", (35, 95, 405, 330), "ui/seat-nameplate-v13.png", (360, 96), 8),
  CropSpec("ui-v13-source.png", (420, 135, 765, 305), "ui/btn-primary-v13.png", (480, 160), 8),
  CropSpec("ui-v13-source.png", (775, 135, 1125, 305), "ui/btn-secondary-v13.png", (480, 160), 8),
  CropSpec("ui-v13-source.png", (1130, 135, 1490, 305), "ui/btn-tertiary-v13.png", (480, 160), 8),
  CropSpec("ui-v13-source.png", (30, 420, 395, 625), "ui/btn-disabled-v13.png", (480, 160), 8),
  CropSpec("ui-v13-source.png", (375, 405, 775, 635), "ui/settlement-banner-win-v13.png", (640, 180), 8),
  CropSpec("ui-v13-source.png", (760, 405, 1130, 635), "ui/settlement-banner-lose-v13.png", (640, 180), 8),
  CropSpec("ui-v13-source.png", (1115, 350, 1515, 670), "ui/settlement-panel-v13.png", (760, 380), 10),
  CropSpec("ui-v13-source.png", (35, 710, 485, 940), "ui/bottom-cards-dock-v13.png", (440, 140), 8),
  CropSpec("ui-v13-source.png", (525, 680, 795, 990), "ui/badge-multiplier-v13.png", (180, 180), 6),
  CropSpec("ui-v13-source.png", (835, 685, 1110, 970), "ui/badge-timer-v13.png", (180, 180), 6),
  CropSpec("ui-v13-source.png", (1190, 675, 1465, 990), "ui/badge-role-v13.png", (180, 180), 6),
]

CARD_SPECS = [
  CropSpec("cards-v13-source.png", (35, 15, 335, 365), "cards/card-template-v13.png", (220, 320), 8),
  CropSpec("cards-v13-source.png", (380, 20, 660, 365), "cards/card-back-v13.png", (220, 320), 8),
  CropSpec("cards-v13-source.png", (720, 25, 1010, 375), "cards/suit-spade-v13.png", (128, 128), 6),
  CropSpec("cards-v13-source.png", (1090, 65, 1370, 345), "cards/suit-heart-v13.png", (128, 128), 6),
  CropSpec("cards-v13-source.png", (40, 395, 330, 715), "cards/suit-club-v13.png", (128, 128), 6),
  CropSpec("cards-v13-source.png", (395, 390, 670, 720), "cards/suit-diamond-v13.png", (128, 128), 6),
  CropSpec("cards-v13-source.png", (740, 365, 1015, 735), "cards/joker-small-v13.png", (220, 320), 8),
  CropSpec("cards-v13-source.png", (1105, 350, 1375, 735), "cards/joker-big-v13.png", (220, 320), 8),
]

ZONE_SIZES = {
  "844x390": {
    "heroBody": (17, 199, 120, 191),
    "leftBody": (145, 47, 120, 191),
    "rightBody": (577, 47, 120, 191),
    "heroNameplate": (8, 271, 138, 33),
    "leftNameplate": (153, 148, 152, 33),
    "rightNameplate": (667, 148, 152, 33),
    "hand": (176, 304, 660, 86),
    "action": (287, 247, 270, 49),
    "settlement": (186, 35, 473, 195),
  },
  "780x360": {
    "heroBody": (16, 184, 112, 176),
    "leftBody": (136, 43, 112, 176),
    "rightBody": (531, 43, 112, 176),
    "heroNameplate": (8, 249, 130, 31),
    "leftNameplate": (144, 136, 140, 31),
    "rightNameplate": (615, 136, 140, 31),
    "hand": (164, 280, 608, 80),
    "action": (264, 227, 252, 45),
    "settlement": (172, 32, 437, 180),
  },
}


def main() -> None:
  for path in [OUT_BG, OUT_AVATAR, OUT_UI, OUT_CARDS, OUT_STRETCH, OUT_COMPOSITES]:
    path.mkdir(parents=True, exist_ok=True)

  build_background()
  for spec in AVATAR_SPECS + UI_SPECS + CARD_SPECS:
    build_cutout(spec)
  build_stretch_simulations()
  build_composites()
  write_manifest()
  write_prompts()


def build_background() -> None:
  src = Image.open(SOURCE / "game-table-bg-v13-source.png").convert("RGBA")
  bg = ImageOps.fit(src, (1688, 780), method=Image.Resampling.LANCZOS, centering=(0.5, 0.55))
  bg.save(OUT_BG / "game-table-bg-v13.png")


def build_cutout(spec: CropSpec) -> None:
  src = Image.open(SOURCE / spec.source).convert("RGBA")
  crop = src.crop(spec.box)
  cut = remove_green(crop)
  bbox = cut.getbbox()
  if bbox is not None:
    cut = cut.crop(bbox)
  final = contain(cut, spec.size, spec.pad)
  out = ROOT / spec.out
  out.parent.mkdir(parents=True, exist_ok=True)
  final.save(out)


def remove_green(image: Image.Image) -> Image.Image:
  rgba = image.convert("RGBA")
  pixels = rgba.load()
  width, height = rgba.size
  for y in range(height):
    for x in range(width):
      r, g, b, a = pixels[x, y]
      green_delta = g - max(r, b)
      if g > 150 and green_delta > 45:
        alpha = max(0, min(255, int((green_delta - 45) * 3.2)))
        pixels[x, y] = (r, g, b, max(0, 255 - alpha))
      elif g > 115 and green_delta > 28:
        pixels[x, y] = (r, g, b, 80)
  return rgba


def contain(image: Image.Image, size: tuple[int, int], pad: int) -> Image.Image:
  canvas = Image.new("RGBA", size, TRANSPARENT)
  max_w = max(1, size[0] - pad * 2)
  max_h = max(1, size[1] - pad * 2)
  scale = min(max_w / image.width, max_h / image.height)
  resized = image.resize((max(1, round(image.width * scale)), max(1, round(image.height * scale))), Image.Resampling.LANCZOS)
  canvas.alpha_composite(resized, ((size[0] - resized.width) // 2, (size[1] - resized.height) // 2))
  return canvas


def build_stretch_simulations() -> None:
  stretch_assets = [
    "btn-primary-v13",
    "btn-secondary-v13",
    "btn-tertiary-v13",
    "btn-disabled-v13",
    "settlement-panel-v13",
    "seat-nameplate-v13",
    "bottom-cards-dock-v13",
  ]
  for name in stretch_assets:
    src_path = find_asset(name)
    src = Image.open(src_path).convert("RGBA")
    sheet = Image.new("RGBA", (300, max(220, src.height + 60)), (255, 246, 252, 255))
    draw = ImageDraw.Draw(sheet)
    font = load_font(18)
    draw.text((16, 12), name, fill=(110, 56, 84), font=font)
    for idx, target_width in enumerate([64, 176]):
      resized = nine_slice_horizontal(src, target_width)
      x = 28 + idx * 126
      y = 54
      sheet.alpha_composite(resized, (x, y))
      draw.text((x, y + resized.height + 8), f"{target_width}px", fill=(110, 56, 84), font=font)
    sheet.save(OUT_STRETCH / f"{name}-stretch.png")


def nine_slice_horizontal(src: Image.Image, target_width: int) -> Image.Image:
  src = src.convert("RGBA")
  border = min(48, src.width // 4, max(8, target_width // 3))
  if target_width <= border * 2:
    return src.resize((target_width, src.height), Image.Resampling.BICUBIC)
  left = src.crop((0, 0, border, src.height))
  center = src.crop((border, 0, src.width - border, src.height))
  right = src.crop((src.width - border, 0, src.width, src.height))
  out = Image.new("RGBA", (target_width, src.height), TRANSPARENT)
  out.alpha_composite(left, (0, 0))
  out.alpha_composite(center.resize((target_width - border * 2, src.height), Image.Resampling.BICUBIC), (border, 0))
  out.alpha_composite(right, (target_width - border, 0))
  return out


def build_composites() -> None:
  build_scene_composite("844x390", (844, 390), OUT_COMPOSITES / "composite-844x390-bidding-v13.png", "bidding")
  build_scene_composite("780x360", (780, 360), OUT_COMPOSITES / "composite-780x360-playing-v13.png", "playing")
  build_scene_composite("844x390", (844, 390), OUT_COMPOSITES / "composite-844x390-settlement-v13.png", "settlement")
  build_review_sheet()


def build_scene_composite(zone_key: str, size: tuple[int, int], out: Path, mode: str) -> None:
  zones = ZONE_SIZES[zone_key]
  bg = Image.open(OUT_BG / "game-table-bg-v13.png").convert("RGBA").resize(size, Image.Resampling.LANCZOS)
  canvas = bg.copy()

  paste_subject_fit(canvas, OUT_AVATAR / "left-ai-body-v13.png", zones["leftBody"])
  paste_subject_fit(canvas, OUT_AVATAR / "right-ai-body-v13.png", zones["rightBody"])
  paste_subject_fit(canvas, OUT_AVATAR / "hero-body-v13.png", zones["heroBody"])
  restore_table_foreground(canvas, bg, zones["leftBody"])
  restore_table_foreground(canvas, bg, zones["rightBody"])
  paste_fit(canvas, OUT_UI / "seat-nameplate-v13.png", zones["leftNameplate"])
  paste_fit(canvas, OUT_UI / "seat-nameplate-v13.png", zones["rightNameplate"])
  paste_fit(canvas, OUT_UI / "seat-nameplate-v13.png", zones["heroNameplate"])

  if mode == "settlement":
    shade = Image.new("RGBA", size, (40, 16, 42, 112))
    canvas.alpha_composite(shade)
    paste_fit(canvas, OUT_UI / "settlement-banner-win-v13.png", (zones["settlement"][0] + 68, zones["settlement"][1] + 18, zones["settlement"][2] - 136, 64))
    paste_fit(canvas, OUT_UI / "settlement-panel-v13.png", (zones["settlement"][0] + 20, zones["settlement"][1] + 92, zones["settlement"][2] - 40, zones["settlement"][3] - 105))
    draw_text(canvas, "地主胜利", (size[0] // 2, zones["settlement"][1] + 52), 38, anchor="mm", fill=(255, 244, 203), stroke=3)
    draw_text(canvas, "+3954", (size[0] // 2, zones["settlement"][1] + 135), 30, anchor="mm", fill=(255, 96, 128), stroke=2)
    paste_fit(canvas, OUT_UI / "btn-primary-v13.png", (size[0] // 2 - 128, size[1] - 58, 112, 44))
    paste_fit(canvas, OUT_UI / "btn-secondary-v13.png", (size[0] // 2 + 16, size[1] - 58, 112, 44))
    draw_text(canvas, "再来一局", (size[0] // 2 - 72, size[1] - 36), 18, anchor="mm", fill=(255, 255, 255), stroke=2)
    draw_text(canvas, "返回大厅", (size[0] // 2 + 72, size[1] - 36), 18, anchor="mm", fill=(255, 255, 255), stroke=2)
  else:
    paste_fit(canvas, OUT_UI / "bottom-cards-dock-v13.png", (size[0] // 2 - 85, 16, 170, 44))
    hand = zones["hand"]
    draw_cards(canvas, (hand[0], hand[1] + 3, hand[2], hand[3] - 6), count=12 if mode == "playing" else 6)
    action = zones["action"]
    if mode == "bidding":
      paste_fit(canvas, OUT_UI / "btn-primary-v13.png", (action[0] + 14, action[1], 116, action[3]))
      paste_fit(canvas, OUT_UI / "btn-secondary-v13.png", (action[0] + action[2] - 130, action[1], 116, action[3]))
      draw_text(canvas, "叫地主", (action[0] + 72, action[1] + action[3] // 2), 18, anchor="mm", fill=(255, 255, 255), stroke=2)
      draw_text(canvas, "不叫", (action[0] + action[2] - 72, action[1] + action[3] // 2), 18, anchor="mm", fill=(255, 255, 255), stroke=2)
    else:
      for i, (asset, label) in enumerate([
        ("btn-primary-v13.png", "出牌"),
        ("btn-secondary-v13.png", "不要"),
        ("btn-tertiary-v13.png", "提示"),
      ]):
        bx = action[0] + 6 + i * ((action[2] - 12) // 3)
        bw = (action[2] - 24) // 3
        paste_fit(canvas, OUT_UI / asset, (bx, action[1], bw, action[3]))
        draw_text(canvas, label, (bx + bw // 2, action[1] + action[3] // 2), 17, anchor="mm", fill=(255, 255, 255), stroke=2)

  out.parent.mkdir(parents=True, exist_ok=True)
  canvas.save(out)


def paste_fit(canvas: Image.Image, asset_path: Path, rect: tuple[int, int, int, int]) -> None:
  asset = Image.open(asset_path).convert("RGBA")
  x, y, w, h = rect
  fitted = contain(asset, (w, h), 0)
  canvas.alpha_composite(fitted, (x, y))


def paste_subject_fit(canvas: Image.Image, asset_path: Path, rect: tuple[int, int, int, int]) -> None:
  asset = Image.open(asset_path).convert("RGBA")
  bbox = asset.getbbox()
  if bbox is not None:
    asset = asset.crop(bbox)
  x, y, w, h = rect
  fitted = contain(asset, (w, h), 0)
  canvas.alpha_composite(fitted, (x, y))


def restore_table_foreground(canvas: Image.Image, background: Image.Image, rect: tuple[int, int, int, int]) -> None:
  x, y, w, h = rect
  top = y + round(h * 0.74)
  left = max(0, x - 14)
  right = min(canvas.width, x + w + 14)
  bottom = min(canvas.height, y + h + 20)
  if top >= bottom or left >= right:
    return
  patch = background.crop((left, top, right, bottom))
  canvas.alpha_composite(patch, (left, top))


def draw_cards(canvas: Image.Image, rect: tuple[int, int, int, int], count: int) -> None:
  x, y, w, h = rect
  template = Image.open(OUT_CARDS / "card-template-v13.png").convert("RGBA")
  suits = [
    Image.open(OUT_CARDS / "suit-heart-v13.png").convert("RGBA"),
    Image.open(OUT_CARDS / "suit-spade-v13.png").convert("RGBA"),
    Image.open(OUT_CARDS / "suit-diamond-v13.png").convert("RGBA"),
    Image.open(OUT_CARDS / "suit-club-v13.png").convert("RGBA"),
  ]
  card_h = h
  card_w = max(34, round(card_h * 0.68))
  step = max(24, min(card_w - 8, (w - card_w) // max(1, count - 1)))
  ranks = ["J", "K", "Q", "10", "9", "8", "7", "6", "3", "3", "2", "A"]
  for i in range(count):
    cx = x + i * step
    card = template.resize((card_w, card_h), Image.Resampling.LANCZOS)
    canvas.alpha_composite(card, (cx, y))
    suit = suits[i % len(suits)].resize((round(card_w * 0.28), round(card_w * 0.28)), Image.Resampling.LANCZOS)
    canvas.alpha_composite(suit, (cx + 8, y + round(card_h * 0.28)))
    color = (214, 48, 72) if i % 2 == 0 else (38, 34, 44)
    draw_text(canvas, ranks[i % len(ranks)], (cx + 12, y + 9), max(13, round(card_w * 0.28)), anchor="la", fill=color)


def build_review_sheet() -> None:
  sheet = Image.new("RGBA", (1800, 1320), (255, 247, 252, 255))
  draw = ImageDraw.Draw(sheet)
  font_h = load_font(34)
  font = load_font(21)
  draw.text((36, 24), "v13 pink game remake - image_gen formal preview", fill=(94, 46, 74), font=font_h)
  draw.text((36, 70), "Pillow only crops/removes chroma key/resizes/composes; old preview files are layout mockups only.", fill=(126, 72, 94), font=font)

  bg = Image.open(OUT_BG / "game-table-bg-v13.png").convert("RGBA").resize((520, 240), Image.Resampling.LANCZOS)
  sheet.alpha_composite(bg, (36, 112))
  draw.text((36, 360), "background", fill=(94, 46, 74), font=font)

  x = 600
  for name in ["hero-body-v13.png", "left-ai-body-v13.png", "right-ai-body-v13.png"]:
    img = Image.open(OUT_AVATAR / name).convert("RGBA")
    img = contain(img, (190, 260), 0)
    sheet.alpha_composite(img, (x, 108))
    draw.text((x, 374), name.replace(".png", ""), fill=(94, 46, 74), font=font)
    x += 230

  ui_names = [
    "seat-nameplate-v13.png",
    "btn-primary-v13.png",
    "btn-secondary-v13.png",
    "btn-tertiary-v13.png",
    "btn-disabled-v13.png",
    "settlement-banner-win-v13.png",
    "settlement-banner-lose-v13.png",
    "settlement-panel-v13.png",
    "bottom-cards-dock-v13.png",
    "badge-multiplier-v13.png",
    "badge-timer-v13.png",
  ]
  draw.text((36, 430), "UI sprites", fill=(94, 46, 74), font=font_h)
  render_asset_grid(sheet, ui_names, OUT_UI, (36, 486), (255, 172), 4)

  card_names = [
    "card-template-v13.png",
    "card-back-v13.png",
    "suit-spade-v13.png",
    "suit-heart-v13.png",
    "suit-club-v13.png",
    "suit-diamond-v13.png",
    "joker-small-v13.png",
    "joker-big-v13.png",
  ]
  draw.text((1120, 430), "card sprites", fill=(94, 46, 74), font=font_h)
  render_asset_grid(sheet, card_names, OUT_CARDS, (1120, 486), (200, 172), 3)

  comp1 = Image.open(OUT_COMPOSITES / "composite-844x390-bidding-v13.png").convert("RGBA").resize((422, 195), Image.Resampling.LANCZOS)
  comp2 = Image.open(OUT_COMPOSITES / "composite-780x360-playing-v13.png").convert("RGBA").resize((422, 195), Image.Resampling.LANCZOS)
  comp3 = Image.open(OUT_COMPOSITES / "composite-844x390-settlement-v13.png").convert("RGBA").resize((422, 195), Image.Resampling.LANCZOS)
  for i, (comp, label) in enumerate([(comp1, "844x390 bidding"), (comp2, "780x360 playing"), (comp3, "844x390 settlement")]):
    x0 = 36 + i * 570
    sheet.alpha_composite(comp, (x0, 1080))
    draw.text((x0, 1286), label, fill=(94, 46, 74), font=font)

  sheet.save(ROOT / "review-sheet-v2.png")


def render_asset_grid(sheet: Image.Image, names: list[str], folder: Path, origin: tuple[int, int], cell: tuple[int, int], cols: int) -> None:
  draw = ImageDraw.Draw(sheet)
  font = load_font(16)
  for idx, name in enumerate(names):
    col = idx % cols
    row = idx // cols
    x = origin[0] + col * cell[0]
    y = origin[1] + row * cell[1]
    img = Image.open(folder / name).convert("RGBA")
    img = contain(img, (cell[0] - 28, cell[1] - 48), 0)
    sheet.alpha_composite(img, (x + 14, y + 8))
    draw.text((x + 8, y + cell[1] - 30), name.replace(".png", ""), fill=(94, 46, 74), font=font)


def draw_text(canvas: Image.Image, text: str, xy: tuple[int, int], size: int, anchor: str, fill: tuple[int, int, int], stroke: int = 0) -> None:
  draw = ImageDraw.Draw(canvas)
  draw.text(xy, text, font=load_font(size), anchor=anchor, fill=fill, stroke_width=stroke, stroke_fill=(112, 51, 70))


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
  candidates = [
    "/System/Library/Fonts/PingFang.ttc",
    "/System/Library/Fonts/STHeiti Medium.ttc",
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    "/Library/Fonts/Arial Unicode.ttf",
  ]
  for path in candidates:
    if Path(path).exists():
      return ImageFont.truetype(path, size=size)
  return ImageFont.load_default()


def find_asset(name: str) -> Path:
  for folder in [OUT_UI, OUT_CARDS, OUT_AVATAR, OUT_BG]:
    candidate = folder / f"{name}.png"
    if candidate.exists():
      return candidate
  raise FileNotFoundError(name)


def png_files() -> Iterable[Path]:
  yield from sorted(SOURCE.glob("*.png"))
  for folder in [OUT_BG, OUT_AVATAR, OUT_UI, OUT_CARDS]:
    for path in sorted(folder.glob("*.png")):
      if path.stem.endswith("-v13"):
        yield path
  yield from sorted(OUT_STRETCH.glob("*.png"))
  yield from sorted(OUT_COMPOSITES.glob("*-v13.png"))
  yield ROOT / "review-sheet-v2.png"


def file_sha(path: Path) -> str:
  return hashlib.sha256(path.read_bytes()).hexdigest()


def alpha_summary(path: Path) -> dict[str, object]:
  im = Image.open(path).convert("RGBA")
  alpha = im.getchannel("A")
  has_transparency = alpha.getextrema()[0] < 255
  corners = [alpha.getpixel((0, 0)), alpha.getpixel((im.width - 1, 0)), alpha.getpixel((0, im.height - 1)), alpha.getpixel((im.width - 1, im.height - 1))]
  return {
    "size": im.size,
    "mode": im.mode,
    "hasAlpha": has_transparency,
    "transparentCorners": all(v == 0 for v in corners),
  }


def write_manifest() -> None:
  records = []
  for path in png_files():
    if not path.exists():
      continue
    rel = path.relative_to(ROOT).as_posix()
    records.append({
      "path": rel,
      "sha256": file_sha(path),
      **alpha_summary(path),
    })
  (ROOT / "manifest-v13.json").write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_prompts() -> None:
  records = json.loads((ROOT / "manifest-v13.json").read_text(encoding="utf-8"))
  lines = [
    "# v13 pink game remake image_gen prompts",
    "",
    "目标：保持现有 pink 粉色卡通风格，只借鉴用户参考截图的布局与元素层级，不复刻第三方 IP、logo、角色或图标。",
    "",
    "## Pipeline Ruling",
    "",
    "- `source/ai-direction-sheet.png` is the user-approved direction reference.",
    "- Existing `*-preview.png`, `review-sheet.png`, and `composites/composite-*.png` are **layout mockup only / 非正式资产** from the older Pillow pass.",
    "- Formal `*-v13.png` assets in this package are derived from built-in `image_gen` source images under `source/generated-v13/`.",
    "- Pillow is used only for non-creative post-processing: crop, chroma-key removal, resize, 9-slice stretch simulation, review-sheet/composite layout, and sha256 calculation.",
    "- User feedback fix 2026-07-05: bidding/playing/settlement composites were rejected because characters overlapped, the three body sizes were inconsistent, and the hero appeared on the tabletop instead of beside the hand. Follow-up feedback required the upper-left and upper-right characters to move further left, all three characters to be smaller, and the table/background relationship to match the reference more closely. Composite zones match the T-LAYOUT3 main merge `1b523df`, use equal body rectangles, keep the hero left of `heroHandLarge`, and use a regenerated built-in image_gen table background with a lower pink tabletop. Avatar/UI/card source images were reused.",
    "",
    "## Review package checklist",
    "",
    "- Formal source sheets: 4 built-in image_gen sources under `source/generated-v13/`.",
    "- Formal item previews: background 1, body avatars 3, UI sprites 12, card sprites 8.",
    "- Card sprite coverage: template, back, spade, heart, club, diamond, small Joker, big Joker.",
    "- Stretch simulations: 7 sheets; each sheet shows 64px and 176px horizontal 9-slice candidates.",
    "- Composite previews: 844x390 bidding, 780x360 playing, 844x390 settlement.",
    "- User review entry: `review-sheet-v2.png`; per-file sha256 is listed below and in `manifest-v13.json`.",
    "",
    "## Built-in image_gen source prompts",
    "",
    "### `source/generated-v13/game-table-bg-v13-source.png`",
    "",
    "Prompt summary: original sweet pink cartoon landscape game table background; large oval table; no characters, no cards, no UI buttons, no logo, no readable text.",
    "",
    "### `source/generated-v13/avatars-v13-source.png`",
    "",
    "Prompt summary: three original cute cartoon female player body sprites on flat #00ff00 chroma-key background; no labels, no logo, no third-party IP.",
    "",
    "### `source/generated-v13/ui-v13-source.png`",
    "",
    "Prompt summary: 4x3 text-free pink cartoon UI sprite sheet on flat #00ff00 chroma-key background: nameplate, buttons, settlement ribbons/panel, dock, timer/multiplier/role badges.",
    "",
    "### `source/generated-v13/cards-v13-source.png`",
    "",
    "Prompt summary: text-free pink cartoon card sprite sheet on flat #00ff00 chroma-key background: card template, back, suits, Joker skins.",
    "",
    "## Formal generated files",
    "",
  ]
  for item in records:
    lines.append(f"- `{item['path']}` sha256 `{item['sha256']}` size `{item['size'][0]}x{item['size'][1]}` alpha `{item['hasAlpha']}` transparentCorners `{item['transparentCorners']}` userReview `waiting`")
  lines.append("")
  (ROOT / "PROMPTS.md").write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
  main()
