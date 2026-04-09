#!/usr/bin/env python3
"""Build images/og-image.png (1200×630) — Open Graph / link-preview card, RIVAL brand."""

import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "images" / "og-image.png"
LOGO = ROOT / "images" / "rival_logo_horizontal.png"
MOCKUP = ROOT / "images" / "mockup_nobg.png"
FONTS_DIR = Path(__file__).parent / "fonts"

W, H = 1200, 630
BG = (10, 11, 15)
PINK = (234, 20, 139)
GREEN = (0, 255, 136)
ORANGE = (255, 90, 31)
GOLD = (255, 215, 0)
MUTED = (167, 176, 190)
WHITE = (255, 255, 255)


# ---------------------------------------------------------------------------
# Font helpers
# ---------------------------------------------------------------------------

BEBAS_TTF_URL = (
    "https://github.com/dharmatype/Bebas-Neue/blob/master/"
    "fonts/BebasNeue(2018)ByDhamraType/ttf/BebasNeue-Regular.ttf?raw=true"
)


def get_bebas(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    FONTS_DIR.mkdir(exist_ok=True)
    ttf = FONTS_DIR / "BebasNeue-Regular.ttf"
    if not ttf.exists():
        print("  Downloading Bebas Neue…")
        try:
            urllib.request.urlretrieve(BEBAS_TTF_URL, ttf)
        except Exception as exc:
            print(f"  Download failed ({exc}), falling back to Impact")
    if ttf.exists():
        return ImageFont.truetype(str(ttf), size)
    # macOS fallback
    for path in [
        "/System/Library/Fonts/Supplemental/Impact.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def get_system_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in [
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/Geneva.ttf",
    ]:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def get_system_font_bold(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return get_system_font(size)


# ---------------------------------------------------------------------------
# Drawing helpers
# ---------------------------------------------------------------------------

def add_blob(target: Image.Image, xyxy, color_rgba, blur: int = 80) -> Image.Image:
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(layer).ellipse(xyxy, fill=color_rgba)
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    return Image.alpha_composite(target, layer)


def draw_grid(img: Image.Image, step: int = 48, alpha: int = 18) -> Image.Image:
    grid = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grid)
    line_col = (30, 37, 48, 60)
    for x in range(0, W + step, step):
        gd.line([(x, 0), (x, H)], fill=line_col, width=1)
    for y in range(0, H + step, step):
        gd.line([(0, y), (W, y)], fill=line_col, width=1)
    ga = grid.split()[3].point(lambda p: min(p, alpha))
    grid.putalpha(ga)
    return Image.alpha_composite(img, grid)


def measure_text(draw: ImageDraw.ImageDraw, text: str, font) -> tuple[int, int]:
    bb = draw.textbbox((0, 0), text, font=font)
    return bb[2] - bb[0], bb[3] - bb[1]


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    print("Building OG image…")

    # -- Background ----------------------------------------------------------
    img = Image.new("RGBA", (W, H), BG + (255,))

    # Aurora blobs
    img = add_blob(img, (-160, -180, 620, 560), PINK + (50,), blur=110)
    img = add_blob(img, (700, -120, 1400, 500), GREEN + (30,), blur=120)
    img = add_blob(img, (400, 280, 1100, 780), ORANGE + (22,), blur=100)
    img = add_blob(img, (-80, 300, 340, 720), PINK + (18,), blur=90)

    # Grid
    img = draw_grid(img)

    # Dark vignette on left to keep text legible
    vignette = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    for i, alpha in enumerate(range(130, 0, -5)):
        x = i * 12
        if x > W:
            break
        overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(overlay).rectangle([0, 0, x, H], fill=(10, 11, 15, alpha))
        vignette = Image.alpha_composite(vignette, overlay)

    # Simpler: flat semi-transparent gradient panel on left half
    panel = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    for x in range(0, 680):
        a = max(0, 170 - int(170 * (x / 680) ** 1.4))
        ImageDraw.Draw(panel).line([(x, 0), (x, H)], fill=(10, 11, 15, a), width=1)
    img = Image.alpha_composite(img, panel)

    img_rgb = img.convert("RGB")

    # -- Mockup (right side) -------------------------------------------------
    mockup = Image.open(MOCKUP).convert("RGBA")
    mh = 580
    mw = int(mockup.width * mh / mockup.height)
    mockup = mockup.resize((mw, mh), Image.Resampling.LANCZOS)

    # Subtle fade-out on the left edge of the mockup so it blends into panel
    fade = Image.new("RGBA", mockup.size, (0, 0, 0, 0))
    for x in range(min(160, mw)):
        a = int(255 * (1 - x / 160))
        ImageDraw.Draw(fade).line([(x, 0), (x, mh)], fill=(0, 0, 0, a), width=1)
    r, g, b, alpha_ch = mockup.split()
    new_alpha = Image.composite(
        Image.new("L", mockup.size, 0),
        alpha_ch,
        fade.split()[3],
    )
    mockup.putalpha(new_alpha)

    mx = W - mw + 30   # allow slight right-bleed
    my = (H - mh) // 2
    img_rgb.paste(mockup, (mx, my), mockup)

    # -- Text (left side) ----------------------------------------------------
    draw = ImageDraw.Draw(img_rgb)

    font_logo_tag = get_bebas(88)
    font_sub = get_bebas(36)
    font_pill = get_system_font_bold(18)

    pad_left = 68
    y = 148

    # Tagline — two lines
    line1, line2 = "WATCH LIVE.", "RIVAL EVERYONE."
    w1, h1 = measure_text(draw, line1, font_logo_tag)
    w2, h2 = measure_text(draw, line2, font_logo_tag)

    # Subtle glow behind tagline
    for dx, dy in [(-2, -2), (2, -2), (-2, 2), (2, 2), (0, 0)]:
        draw.text((pad_left + dx, y + dy), line1, fill=(*PINK, 60), font=font_logo_tag)
    draw.text((pad_left, y), line1, fill=WHITE, font=font_logo_tag)

    y += h1 + 6
    for dx, dy in [(-2, -2), (2, -2), (-2, 2), (2, 2), (0, 0)]:
        draw.text((pad_left + dx, y + dy), line2, fill=(*PINK, 60), font=font_logo_tag)
    draw.text((pad_left, y), line2, fill=WHITE, font=font_logo_tag)

    # Pink underline accent
    y += h2 + 10
    draw.rectangle([pad_left, y, pad_left + 220, y + 4], fill=PINK)
    y += 22

    # Sub-tagline
    sub = "The game you play while the game is on."
    draw.text((pad_left, y), sub, fill=MUTED, font=font_sub)
    _, sh = measure_text(draw, sub, font_sub)
    y += sh + 36

    # "Coming soon" pill
    pill_text = "Coming Soon  ·  iOS"
    pw, ph = measure_text(draw, pill_text, font_pill)
    pill_pad_x, pill_pad_y = 18, 10
    pill_x0 = pad_left
    pill_y0 = y
    pill_x1 = pill_x0 + pw + pill_pad_x * 2
    pill_y1 = pill_y0 + ph + pill_pad_y * 2

    # Pill background + border
    pill_layer = Image.new("RGBA", img_rgb.size, (0, 0, 0, 0))
    pill_d = ImageDraw.Draw(pill_layer)
    pill_d.rounded_rectangle(
        [pill_x0, pill_y0, pill_x1, pill_y1],
        radius=24,
        fill=(*PINK, 28),
        outline=(*PINK, 160),
        width=2,
    )
    img_rgb.paste(
        Image.alpha_composite(Image.new("RGBA", img_rgb.size, (0, 0, 0, 0)), pill_layer).convert("RGB"),
        mask=pill_layer.split()[3],
    )
    draw.text((pill_x0 + pill_pad_x, pill_y0 + pill_pad_y), pill_text, fill=PINK, font=font_pill)

    # -- Logo (bottom-left) --------------------------------------------------
    logo = Image.open(LOGO).convert("RGBA")
    lh = 52
    lw = int(logo.width * lh / logo.height)
    logo = logo.resize((lw, lh), Image.Resampling.LANCZOS)
    img_rgb.paste(logo, (pad_left, H - lh - 44), logo)

    # playrival.app label
    font_domain = get_system_font(16)
    draw.text((pad_left + lw + 16, H - lh - 44 + (lh - 16) // 2), "playrival.app", fill=MUTED, font=font_domain)

    # -- Save ----------------------------------------------------------------
    OUT.parent.mkdir(parents=True, exist_ok=True)
    img_rgb.save(OUT, "PNG", optimize=True)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
