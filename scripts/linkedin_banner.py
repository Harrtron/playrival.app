#!/usr/bin/env python3
"""Build images/linkedin-banner.png (1584×396) — LinkedIn cover, RIVAL brand."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "images" / "linkedin-banner.png"
LOGO = ROOT / "images" / "rival_logo_horizontal.png"

W, H = 1584, 396
BG = (10, 11, 15)
PINK = (234, 20, 139)
# Cool slate (replaces neon green) — dark blue-grey wash
SLATE = (38, 46, 64)
ORANGE = (255, 90, 31)
MUTED = (167, 176, 190)


def add_blob(target, xyxy, color_rgba, blur=70):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse(xyxy, fill=color_rgba)
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    return Image.alpha_composite(target, layer)


def main() -> None:
    img = Image.new("RGBA", (W, H), BG + (255,))
    img = add_blob(img, (-120, -100, 720, 480), PINK + (55,), 90)
    img = add_blob(img, (980, -80, 1750, 520), SLATE + (48,), 88)
    img = add_blob(img, (520, 200, 1150, 520), ORANGE + (28,), 78)
    img = add_blob(img, (-200, 220, 420, 560), PINK + (22,), 95)

    grid = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grid)
    step = 48
    line = (30, 37, 48, 38)
    for x in range(0, W + step, step):
        gd.line([(x, 0), (x, H)], fill=line, width=1)
    for y in range(0, H + step, step):
        gd.line([(0, y), (W, y)], fill=line, width=1)
    ga = grid.split()[3].point(lambda p: min(p, 20))
    grid.putalpha(ga)
    img = Image.alpha_composite(img, grid)

    bar = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(bar)
    bd.rectangle([0, 0, W, 48], fill=(0, 0, 0, 100))
    bd.rectangle([0, H - 40, W, H], fill=(0, 0, 0, 95))
    img = Image.alpha_composite(img, bar)

    img_rgb = img.convert("RGB")

    logo = Image.open(LOGO).convert("RGBA")
    lh = 104
    lw = int(logo.width * lh / logo.height)
    logo = logo.resize((lw, lh), Image.Resampling.LANCZOS)
    margin = 76
    right_x = W - margin

    try:
        font_bold = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 24)
    except OSError:
        font_bold = ImageFont.load_default()
    tag = "Watch Live Sport. RIVAL Everyone."
    gap = 18
    meas = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    tb = meas.textbbox((0, 0), tag, font=font_bold)
    tw, th = tb[2] - tb[0], tb[3] - tb[1]
    block_h = lh + gap + th
    ly = (H - block_h) // 2

    lx_logo = right_x - lw
    img_rgb.paste(logo, (lx_logo, ly), logo)
    draw = ImageDraw.Draw(img_rgb)
    tx = right_x - tw
    draw.text((tx, ly + lh + gap), tag, fill=MUTED, font=font_bold)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img_rgb.save(OUT, "PNG", optimize=True)
    print("Wrote", OUT)


if __name__ == "__main__":
    main()
