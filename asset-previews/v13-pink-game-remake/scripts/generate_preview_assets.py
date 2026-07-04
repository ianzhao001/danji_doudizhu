#!/usr/bin/env python3
"""Generate preview-only pink game-scene remake assets.

This script intentionally writes only under asset-previews/. It does not touch
assets/resources, .meta files, Cocos scenes, or gameplay code.
"""

from __future__ import annotations

import hashlib
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT


PINK = (245, 96, 139)
PINK_DARK = (168, 48, 92)
PINK_SOFT = (255, 205, 222)
CREAM = (255, 246, 236)
GOLD = (246, 177, 61)
PURPLE = (150, 92, 214)
INK = (92, 42, 72)
MUTED = (134, 84, 106)


def ensure_dirs() -> None:
    for name in ["backgrounds", "avatars", "cards", "ui", "composites", "source"]:
        (OUT / name).mkdir(parents=True, exist_ok=True)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/STHeiti Medium.ttc" if bold else "/System/Library/Fonts/STHeiti Light.ttc",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/Library/Fonts/Arial Unicode.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size=size, index=0)
            except Exception:
                continue
    return ImageFont.load_default()


def text_center(draw: ImageDraw.ImageDraw, xy: tuple[float, float], text: str, size: int, fill, bold: bool = False, stroke=0, stroke_fill=(255, 255, 255, 255)) -> None:
    f = font(size, bold)
    box = draw.textbbox((0, 0), text, font=f, stroke_width=stroke)
    draw.text((xy[0] - (box[2] - box[0]) / 2, xy[1] - (box[3] - box[1]) / 2), text, font=f, fill=fill, stroke_width=stroke, stroke_fill=stroke_fill)


def rounded(draw: ImageDraw.ImageDraw, box, radius: int, fill, outline=None, width: int = 1) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def save(img: Image.Image, path: Path) -> None:
    img.save(path)


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:16]


def draw_background() -> None:
    w, h = 1844, 853
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for y in range(h):
        t = y / h
        r = int(255 * (1 - t) + 242 * t)
        g = int(224 * (1 - t) + 145 * t)
        b = int(235 * (1 - t) + 180 * t)
        draw.line([(0, y), (w, y)], fill=(r, g, b, 255))
    for x in range(0, w, 54):
        height = 70 + int(70 * math.sin(x / 137))
        color = (255, 186, 210, 90) if x % 2 else (204, 126, 180, 70)
        draw.rounded_rectangle((x, 150 - height // 2, x + 38, 230), radius=14, fill=color)
    for i in range(130):
        x = (i * 97) % w
        y = 30 + ((i * 53) % 320)
        r = 4 + (i % 10)
        draw.ellipse((x - r, y - r, x + r, y + r), fill=(255, 232, 242, 55))
    draw.rectangle((0, int(h * 0.48), w, h), fill=(232, 116, 166, 40))
    draw.ellipse((-260, 175, w + 260, 950), fill=(205, 91, 143, 230), outline=(255, 214, 158, 255), width=26)
    draw.ellipse((-190, 232, w + 190, 870), fill=(246, 146, 183, 255), outline=(255, 238, 213, 210), width=6)
    draw.ellipse((360, 310, w - 360, 645), fill=(238, 116, 166, 185), outline=(255, 213, 230, 135), width=4)
    text_center(draw, (w / 2, 340), "底分: 15   倍数: 3", 36, (142, 80, 112, 110), True)
    img = img.filter(ImageFilter.UnsharpMask(radius=1.5, percent=110))
    save(img, OUT / "backgrounds/game-table-bg-preview.png")


def draw_avatar(name: str, hair: tuple[int, int, int], outfit: tuple[int, int, int], accent: tuple[int, int, int], pose: str) -> None:
    w, h = 512, 512
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse((132, 58, 380, 306), fill=hair + (255,))
    d.ellipse((158, 86, 354, 286), fill=(255, 224, 218, 255))
    d.ellipse((188, 160, 218, 188), fill=(70, 38, 46, 255))
    d.ellipse((294, 160, 324, 188), fill=(70, 38, 46, 255))
    d.arc((204, 190, 308, 244), 10, 170, fill=(198, 78, 112, 255), width=4)
    for x in [170, 205, 240, 275, 310]:
        d.pieslice((x - 42, 54, x + 42, 170), 190, 350, fill=hair + (255,))
    d.rounded_rectangle((155, 284, 357, 510), radius=54, fill=outfit + (255,), outline=(255, 255, 255, 210), width=5)
    d.polygon([(210, 292), (256, 370), (302, 292)], fill=(255, 246, 245, 255))
    d.rectangle((218, 336, 294, 408), fill=accent + (255,))
    d.rounded_rectangle((226, 344, 306, 421), radius=10, fill=(255, 156, 190, 255), outline=(255, 240, 246, 255), width=3)
    d.rounded_rectangle((202, 355, 282, 432), radius=10, fill=(248, 122, 164, 255), outline=(255, 240, 246, 255), width=3)
    if pose == "left":
        d.ellipse((98, 320, 170, 402), fill=(255, 224, 218, 255))
    elif pose == "right":
        d.ellipse((340, 320, 414, 402), fill=(255, 224, 218, 255))
    else:
        d.ellipse((95, 350, 168, 426), fill=(255, 224, 218, 255))
        d.ellipse((344, 350, 417, 426), fill=(255, 224, 218, 255))
    save(img, OUT / f"avatars/{name}-body-preview.png")


def draw_cards() -> None:
    W, H = 400, 560
    for filename, label, suit, red in [
        ("card-template-preview.png", "A", "♥", True),
        ("joker-small-preview.png", "JOKER", "小王", True),
        ("joker-big-preview.png", "JOKER", "大王", False),
    ]:
        img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        rounded(d, (8, 8, W - 8, H - 8), 30, (255, 252, 247, 255), (220, 185, 198, 255), 5)
        color = (206, 42, 63, 255) if red else (48, 45, 58, 255)
        text_center(d, (72, 86), label, 62 if label != "JOKER" else 34, color, True)
        text_center(d, (78, 156), suit, 62 if suit in "♥♦♣♠" else 32, color, True)
        text_center(d, (W / 2, H / 2 + 32), suit if label == "A" else "粉小丑", 92 if label == "A" else 54, color, True)
        save(img, OUT / f"cards/{filename}")
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rounded(d, (8, 8, W - 8, H - 8), 30, (245, 105, 150, 255), (255, 235, 244, 255), 6)
    for inset in [42, 72, 102]:
        d.rounded_rectangle((inset, inset, W - inset, H - inset), radius=28, outline=(255, 220, 235, 170), width=5)
    text_center(d, (W / 2, H / 2), "斗", 118, (255, 246, 238, 245), True, 3, (180, 52, 98, 255))
    save(img, OUT / "cards/card-back-preview.png")
    for filename, symbol, color in [
        ("suit-heart-preview.png", "♥", (214, 48, 84, 255)),
        ("suit-diamond-preview.png", "♦", (214, 48, 84, 255)),
        ("suit-spade-preview.png", "♠", (52, 48, 62, 255)),
        ("suit-club-preview.png", "♣", (52, 48, 62, 255)),
    ]:
        icon = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
        text_center(ImageDraw.Draw(icon), (64, 61), symbol, 98, color, True)
        save(icon, OUT / f"cards/{filename}")


def button(path: str, text: str, fill, outline) -> None:
    img = Image.new("RGBA", (320, 120), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rounded(d, (8, 12, 312, 104), 42, fill, outline, 5)
    d.rounded_rectangle((30, 20, 290, 52), radius=24, fill=(255, 255, 255, 58))
    text_center(d, (160, 63), text, 42, (255, 255, 255, 255), True, 3, (160, 54, 94, 255))
    save(img, OUT / f"ui/{path}")


def draw_ui() -> None:
    button("btn-primary-preview.png", "出牌", (244, 89, 132, 255), (255, 223, 179, 255))
    button("btn-secondary-preview.png", "不要", (151, 102, 225, 255), (235, 221, 255, 255))
    button("btn-disabled-preview.png", "出牌", (176, 164, 176, 210), (238, 229, 236, 255))
    for filename, text, color in [
        ("badge-win-preview.png", "胜利", (248, 82, 122, 255)),
        ("badge-lose-preview.png", "失败", (128, 94, 204, 255)),
    ]:
        img = Image.new("RGBA", (480, 150), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        rounded(d, (18, 30, 462, 128), 42, color, (255, 229, 174, 255), 6)
        text_center(d, (240, 78), text, 66, (255, 250, 220, 255), True, 4, (162, 58, 88, 255))
        save(img, OUT / f"ui/{filename}")
    img = Image.new("RGBA", (420, 128), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rounded(d, (10, 18, 410, 108), 38, (255, 223, 234, 245), (245, 128, 166, 255), 5)
    d.rounded_rectangle((50, 32, 370, 62), radius=18, fill=(255, 255, 255, 86))
    text_center(d, (210, 68), "玩家名牌", 38, INK + (255,), True)
    save(img, OUT / "ui/seat-nameplate-preview.png")
    img = Image.new("RGBA", (560, 150), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rounded(d, (12, 28, 548, 136), 32, (248, 148, 184, 245), (255, 227, 190, 255), 5)
    for x in [210, 280, 350]:
        rounded(d, (x - 32, 50, x + 32, 120), 10, (255, 205, 224, 255), (255, 246, 250, 255), 3)
    save(img, OUT / "ui/bottom-cards-dock-preview.png")
    img = Image.new("RGBA", (900, 620), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rounded(d, (26, 26, 874, 594), 56, (255, 237, 244, 248), (247, 139, 172, 255), 8)
    rounded(d, (88, 118, 812, 496), 36, (255, 249, 241, 238), (255, 214, 228, 255), 3)
    text_center(d, (450, 86), "本局结算", 54, INK + (255,), True)
    save(img, OUT / "ui/settlement-panel-preview.png")


def paste_fit(base: Image.Image, overlay: Image.Image, box: tuple[int, int, int, int]) -> None:
    ow, oh = overlay.size
    bw, bh = box[2] - box[0], box[3] - box[1]
    scale = min(bw / ow, bh / oh)
    resized = overlay.resize((int(ow * scale), int(oh * scale)), Image.LANCZOS)
    x = box[0] + (bw - resized.width) // 2
    y = box[1] + (bh - resized.height) // 2
    base.alpha_composite(resized, (x, y))


def card_image(label: str, red: bool = False) -> Image.Image:
    img = Image.new("RGBA", (92, 128), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rounded(d, (2, 2, 90, 126), 10, (255, 252, 247, 255), (214, 188, 198, 255), 2)
    color = (206, 42, 63, 255) if red else (48, 45, 58, 255)
    display = "王" if label == "JOKER" else label
    text_center(d, (30, 34), display, 38 if label == "JOKER" else 42, color, True)
    text_center(d, (60, 90), "★" if label == "JOKER" else ("♥" if red else "♣"), 44, color, True)
    return img


def composite(path: Path, size: tuple[int, int], mode: str) -> None:
    bg = Image.open(OUT / "backgrounds/game-table-bg-preview.png").convert("RGBA").resize(size, Image.LANCZOS)
    d = ImageDraw.Draw(bg)
    w, h = size
    hero = Image.open(OUT / "avatars/hero-body-preview.png").convert("RGBA")
    left = Image.open(OUT / "avatars/left-ai-body-preview.png").convert("RGBA")
    right = Image.open(OUT / "avatars/right-ai-body-preview.png").convert("RGBA")
    paste_fit(bg, left, (80, 72, 250, 292))
    paste_fit(bg, right, (w - 250, 72, w - 80, 292))
    paste_fit(bg, hero, (28, 142, 205, h + 50))
    nameplate = Image.open(OUT / "ui/seat-nameplate-preview.png").convert("RGBA")
    for bx, by, label in [(135, 190, "左家 17张"), (w - 135, 190, "右家 17张"), (112, h - 52, "你 地主")]:
        np = nameplate.resize((150, 46), Image.LANCZOS)
        bg.alpha_composite(np, (int(bx - 75), int(by - 23)))
        text_center(d, (bx, by), label, 20, INK + (255,), True)
    dock = Image.open(OUT / "ui/bottom-cards-dock-preview.png").convert("RGBA").resize((156, 42), Image.LANCZOS)
    bg.alpha_composite(dock, (w // 2 - 78, 8))
    if mode == "bidding":
        labels = [("叫地主", "btn-primary-preview.png"), ("不叫", "btn-secondary-preview.png")]
        for i, (txt, btn) in enumerate(labels):
            b = Image.open(OUT / f"ui/{btn}").convert("RGBA").resize((122, 46), Image.LANCZOS)
            x = w // 2 - 76 + i * 152
            bg.alpha_composite(b, (x - 61, h // 2 - 12))
            text_center(d, (x, h // 2 + 11), txt, 27, (255, 255, 255, 255), True, 2, PINK_DARK + (255,))
    else:
        for i, (txt, btn) in enumerate([("出牌", "btn-primary-preview.png"), ("不要", "btn-secondary-preview.png"), ("提示", "btn-secondary-preview.png")]):
            b = Image.open(OUT / f"ui/{btn}").convert("RGBA").resize((104, 40), Image.LANCZOS)
            x = w // 2 - 116 + i * 116
            bg.alpha_composite(b, (x - 52, h // 2 - 4))
            text_center(d, (x, h // 2 + 16), txt, 22, (255, 255, 255, 255), True, 2, PINK_DARK + (255,))
    cards = ["JOKER", "JOKER", "2", "K", "K", "Q", "J", "10", "9", "8", "7", "6", "3", "3", "3", "3"]
    step = min(48, (w - 245) / max(1, len(cards) - 1))
    start = w - 92 - step * (len(cards) - 1) - 38
    y = h - 132
    for i, label in enumerate(cards):
        bg.alpha_composite(card_image(label, i % 3 == 0), (int(start + i * step), y))
    text_center(d, (w // 2, h - 25), "明牌 x4", 26, (255, 248, 221, 255), True, 3, PINK_DARK + (255,))
    if mode == "settlement":
        veil = Image.new("RGBA", size, (54, 28, 46, 128))
        bg.alpha_composite(veil)
        panel = Image.open(OUT / "ui/settlement-panel-preview.png").convert("RGBA").resize((430, 286), Image.LANCZOS)
        bg.alpha_composite(panel, (w // 2 - 215, h // 2 - 143))
        badge = Image.open(OUT / "ui/badge-win-preview.png").convert("RGBA").resize((260, 82), Image.LANCZOS)
        bg.alpha_composite(badge, (w // 2 - 130, h // 2 - 118))
        text_center(d, (w // 2, h // 2 - 78), "地主胜利", 42, (255, 249, 220, 255), True, 3, PINK_DARK + (255,))
        for i, text in enumerate(["左家 -120", "你 +240", "右家 -120"]):
            text_center(d, (w // 2 - 132 + i * 132, h // 2 + 28), text, 22, INK + (255,), True)
        for i, text in enumerate(["再来一局", "返回大厅"]):
            b = Image.open(OUT / f"ui/{'btn-primary-preview.png' if i == 0 else 'btn-secondary-preview.png'}").convert("RGBA").resize((112, 42), Image.LANCZOS)
            x = w // 2 - 66 + i * 132
            bg.alpha_composite(b, (x - 56, h // 2 + 80))
            text_center(d, (x, h // 2 + 101), text, 19, (255, 255, 255, 255), True, 2, PINK_DARK + (255,))
    save(bg, path)


def review_sheet() -> None:
    sheet = Image.new("RGBA", (1600, 1000), (255, 247, 250, 255))
    d = ImageDraw.Draw(sheet)
    text_center(d, (800, 44), "v13 pink game remake preview", 42, PINK_DARK + (255,), True)
    previews = [
        ("844x390 叫抢", OUT / "composites/composite-844x390-bidding.png", (24, 86, 820, 454)),
        ("780x360 出牌", OUT / "composites/composite-780x360-playing.png", (24, 504, 760, 844)),
        ("844x390 结算", OUT / "composites/composite-844x390-settlement.png", (820, 86, 1576, 434)),
    ]
    for title, src, box in previews:
        img = Image.open(src).convert("RGBA")
        paste_fit(sheet, img, box)
        text_center(d, ((box[0] + box[2]) / 2, box[1] - 18), title, 24, INK + (255,), True)
    x0, y0 = 824, 492
    for i, file in enumerate(["btn-primary-preview.png", "btn-secondary-preview.png", "seat-nameplate-preview.png", "bottom-cards-dock-preview.png", "badge-win-preview.png", "badge-lose-preview.png"]):
        img = Image.open(OUT / f"ui/{file}").convert("RGBA")
        paste_fit(sheet, img, (x0 + (i % 2) * 350, y0 + (i // 2) * 130, x0 + 310 + (i % 2) * 350, y0 + 94 + (i // 2) * 130))
    for i, file in enumerate(["card-template-preview.png", "card-back-preview.png", "joker-small-preview.png", "joker-big-preview.png"]):
        img = Image.open(OUT / f"cards/{file}").convert("RGBA")
        paste_fit(sheet, img, (56 + i * 92, 862, 132 + i * 92, 970))
    text_center(d, (1040, 910), "粉色卡通风格保持 / 仅借鉴布局层级 / 不新增功能入口", 28, MUTED + (255,), True)
    save(sheet, OUT / "review-sheet.png")


def prompts() -> None:
    files = sorted([p for p in OUT.rglob("*.png") if "scripts" not in p.parts])
    lines = [
        "# v13 pink game remake preview prompts",
        "",
        "目标：保持现有 pink 粉色卡通风格，只借鉴用户参考截图的布局与元素层级，不复刻第三方 IP、logo、角色或图标。",
        "",
        "内置 image_gen 方向稿：`source/ai-direction-sheet.png`，仅作风格参考；其中出现的非当前功能按钮不进入正式接线。",
        "",
        "脚本生成资产：`python3 asset-previews/v13-pink-game-remake/scripts/generate_preview_assets.py`。",
        "",
        "正式接线限制：只允许使用现有功能入口：叫地主 / 不叫 / 抢 / 不抢 / 出牌 / 不要 / 提示 / 暂停 / 再来一局 / 返回大厅。",
        "",
        "## Generated files",
        "",
    ]
    for path in files:
        rel = path.relative_to(OUT)
        lines.append(f"- `{rel}` sha256 `{sha(path)}`")
    (OUT / "PROMPTS.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    ensure_dirs()
    draw_background()
    draw_avatar("hero", (91, 53, 62), (255, 218, 230), (246, 122, 166), "front")
    draw_avatar("left-ai", (112, 83, 56), (255, 232, 190), (252, 158, 96), "left")
    draw_avatar("right-ai", (57, 68, 108), (225, 207, 255), (157, 107, 219), "right")
    draw_cards()
    draw_ui()
    composite(OUT / "composites/composite-844x390-bidding.png", (844, 390), "bidding")
    composite(OUT / "composites/composite-780x360-playing.png", (780, 360), "playing")
    composite(OUT / "composites/composite-844x390-settlement.png", (844, 390), "settlement")
    review_sheet()
    prompts()


if __name__ == "__main__":
    main()
