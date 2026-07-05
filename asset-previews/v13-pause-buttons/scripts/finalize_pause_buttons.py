from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "source"
UI = ROOT / "ui"
STRETCH = ROOT / "stretch"
KEY = (0, 255, 0)
TEXT = (108, 46, 76, 255)


ASSETS = {
    "pause-btn-toggle": {
        "source": SOURCE / "pause-btn-toggle-source.png",
        "out": UI / "pause-btn-toggle.png",
        "samples": [("audio-on", "音效开"), ("motion-on", "动效开"), ("haptic-on", "震动开")],
    },
    "pause-btn-action": {
        "source": SOURCE / "pause-btn-action-source.png",
        "out": UI / "pause-btn-action.png",
        "samples": [("continue", "继续"), ("restart", "重开"), ("exit", "退出")],
    },
}


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        Path("/System/Library/Fonts/PingFang.ttc"),
        Path("/System/Library/Fonts/STHeiti Light.ttc"),
        Path("/System/Library/Fonts/Hiragino Sans GB.ttc"),
        Path("/System/Library/Fonts/Supplemental/Arial Unicode.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def remove_green(src: Image.Image) -> Image.Image:
    rgba = src.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if g > 170 and r < 90 and b < 90:
                pixels[x, y] = (r, g, b, 0)
            elif g > 135 and r < 135 and b < 135:
                alpha = max(0, min(255, int((max(r, b) / 135) * 255)))
                pixels[x, y] = (r, g, b, alpha)
    return rgba


def crop_alpha(img: Image.Image, pad: int = 18) -> Image.Image:
    alpha = img.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        return img
    left, top, right, bottom = bbox
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(img.width, right + pad)
    bottom = min(img.height, bottom + pad)
    return img.crop((left, top, right, bottom))


def contain(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    copy = img.copy()
    copy.thumbnail((size[0] - 8, size[1] - 8), Image.Resampling.LANCZOS)
    canvas.alpha_composite(copy, ((size[0] - copy.width) // 2, (size[1] - copy.height) // 2))
    return canvas


def nine_slice(img: Image.Image, width: int, height: int, border: int = 24) -> Image.Image:
    src = img.convert("RGBA")
    src_w, src_h = src.size
    border = min(border, src_w // 3, src_h // 3, width // 2 - 1, height // 2 - 1)
    out = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    x_src = [0, border, src_w - border, src_w]
    y_src = [0, border, src_h - border, src_h]
    x_dst = [0, border, width - border, width]
    y_dst = [0, border, height - border, height]
    for yi in range(3):
        for xi in range(3):
            patch = src.crop((x_src[xi], y_src[yi], x_src[xi + 1], y_src[yi + 1]))
            target = (x_dst[xi + 1] - x_dst[xi], y_dst[yi + 1] - y_dst[yi])
            if patch.size != target:
                patch = patch.resize(target, Image.Resampling.LANCZOS)
            out.alpha_composite(patch, (x_dst[xi], y_dst[yi]))
    return out


def draw_centered_text(img: Image.Image, text: str, size: int) -> Image.Image:
    out = img.copy()
    draw = ImageDraw.Draw(out)
    fnt = font(size)
    bbox = draw.textbbox((0, 0), text, font=fnt)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = (out.width - tw) / 2 - bbox[0]
    y = (out.height - th) / 2 - bbox[1] - 1
    draw.text((x, y), text, font=fnt, fill=TEXT)
    return out


def label(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str) -> None:
    draw.text(xy, text, font=font(18), fill=(108, 46, 76, 255))


def finalize_asset(name: str, spec: dict[str, object]) -> dict[str, object]:
    src_path = spec["source"]
    out_path = spec["out"]
    assert isinstance(src_path, Path)
    assert isinstance(out_path, Path)
    src = Image.open(src_path)
    cutout = crop_alpha(remove_green(src))
    final = contain(cutout, (360, 96))
    final.save(out_path)

    samples = spec["samples"]
    assert isinstance(samples, list)
    for width in [64, 176]:
      for sample_slug, sample in samples:
        sim = nine_slice(final, width, 48, 24)
        text_size = 11 if width <= 64 else 22
        sim = draw_centered_text(sim, sample, text_size)
        sim.save(STRETCH / f"{name}-{width}-{sample_slug}.png")

    return {
        "name": name,
        "source": str(src_path.relative_to(ROOT)),
        "output": str(out_path.relative_to(ROOT)),
        "size": list(final.size),
        "sha256": sha256(out_path),
        "source_sha256": sha256(src_path),
        "alpha": final.mode == "RGBA" and final.getchannel("A").getextrema()[0] == 0,
        "suggestedBorder": 24,
        "suggestedTextColor": "#6C2E4C",
        "samples": [{"slug": slug, "text": text} for slug, text in samples],
    }


def make_review_sheet(manifest: list[dict[str, object]]) -> None:
    sheet = Image.new("RGBA", (1280, 820), (255, 236, 246, 255))
    draw = ImageDraw.Draw(sheet)
    title_font = font(30)
    draw.text((40, 28), "v13 pause buttons review sheet", font=title_font, fill=TEXT)
    draw.text((40, 68), "Formal image_gen sources + local chroma-key/crop/9-slice preview. Text is Cocos-rendered simulation.", font=font(16), fill=(132, 68, 96, 255))

    y = 120
    for item in manifest:
        name = str(item["name"])
        img = Image.open(ROOT / str(item["output"]))
        sheet.alpha_composite(img, (54, y))
        label(draw, (54, y - 26), name)
        labels = item["samples"]
        assert isinstance(labels, list)
        x = 480
        label_texts = [str(label_item["text"]) for label_item in labels]
        for text in label_texts:
            sim = draw_centered_text(nine_slice(img, 176, 52, 24), text, 22)
            sheet.alpha_composite(sim, (x, y + 22))
            x += 210
        small = draw_centered_text(nine_slice(img, 64, 48, 24), label_texts[0], 11)
        wide = draw_centered_text(nine_slice(img, 176, 48, 24), label_texts[-1], 22)
        sheet.alpha_composite(small, (480, y + 102))
        sheet.alpha_composite(wide, (570, y + 102))
        draw.text((760, y + 112), "64px / 176px stretch simulation", font=font(16), fill=(132, 68, 96, 255))
        y += 300

    sheet.convert("RGB").save(ROOT / "review-sheet.png", quality=95)


def main() -> None:
    UI.mkdir(parents=True, exist_ok=True)
    STRETCH.mkdir(parents=True, exist_ok=True)
    for stale in STRETCH.glob("*.png"):
        stale.unlink()
    manifest = [finalize_asset(name, spec) for name, spec in ASSETS.items()]
    make_review_sheet(manifest)
    (ROOT / "manifest.json").write_text(json.dumps({"assets": manifest}, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
