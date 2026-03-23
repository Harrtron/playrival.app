#!/usr/bin/env python3
"""Remove checkerboard + light blob from RIVAL device mockups (PIL only)."""

from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image


def process_rgb(im: Image.Image) -> Image.Image:
    im = im.convert("RGB")
    w, h = im.size
    px = im.load()

    def rgb_at(x: int, y: int) -> tuple[int, int, int]:
        return px[x, y][:3]

    def stats(r: int, g: int, b: int) -> tuple[int, int, int]:
        mx = max(r, g, b)
        mn = min(r, g, b)
        return mx, mn, mx - mn

    removed = [[False] * w for _ in range(h)]

    def touches_removed(x: int, y: int) -> bool:
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and removed[ny][nx]:
                return True
        return False

    # Phase 1: strict neutral dark (checkerboard) from border only
    def is_checker(r: int, g: int, b: int) -> bool:
        mx, mn, d = stats(r, g, b)
        return mx <= 42 and d <= 4

    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_checker(*rgb_at(x, y)):
                removed[y][x] = True
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if removed[y][x]:
                continue
            if is_checker(*rgb_at(x, y)):
                removed[y][x] = True
                q.append((x, y))

    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not removed[ny][nx]:
                r, g, b = rgb_at(nx, ny)
                if is_checker(r, g, b):
                    removed[ny][nx] = True
                    q.append((nx, ny))

    # Phase 2: grow only into lighter / mid grays (blob + AA). Never remove dark UI (high chroma or very dark).
    for floor in (220, 195, 175, 155, 135, 118, 102, 92):
        changed = True
        while changed:
            changed = False
            for y in range(h):
                for x in range(w):
                    if removed[y][x]:
                        continue
                    r, g, b = rgb_at(x, y)
                    mx, mn, d = stats(r, g, b)
                    if d > 32:
                        continue
                    if mn < floor:
                        continue
                    if touches_removed(x, y):
                        removed[y][x] = True
                        changed = True

    # Phase 3: keep only largest opaque component (drops stray checker islands / noise)
    visited = [[False] * w for _ in range(h)]
    best_cells: list[tuple[int, int]] = []

    for sy in range(h):
        for sx in range(w):
            if removed[sy][sx] or visited[sy][sx]:
                continue
            comp: list[tuple[int, int]] = []
            dq: deque[tuple[int, int]] = deque([(sx, sy)])
            visited[sy][sx] = True
            while dq:
                x, y = dq.popleft()
                comp.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h and not removed[ny][nx] and not visited[ny][nx]:
                        visited[ny][nx] = True
                        dq.append((nx, ny))
            if len(comp) > len(best_cells):
                best_cells = comp

    keep = {c for c in best_cells}
    for y in range(h):
        for x in range(w):
            if removed[y][x]:
                continue
            if (x, y) not in keep:
                removed[y][x] = True

    out = Image.new("RGBA", (w, h))
    opx = out.load()
    for y in range(h):
        for x in range(w):
            if removed[y][x]:
                opx[x, y] = (0, 0, 0, 0)
            else:
                r, g, b = rgb_at(x, y)
                opx[x, y] = (r, g, b, 255)
    return out


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    images = root / "images"
    candidates = [images / "mockup_composite.png", images / "mockup.png"]
    src = next((p for p in candidates if p.exists()), None)
    if not src:
        raise SystemExit("No source mockup (images/mockup_composite.png or mockup.png)")

    print("Source:", src)
    cut = process_rgb(Image.open(src))
    w, h = cut.size
    max_w = 960
    if w > max_w:
        nh = int(h * max_w / w)
        cut = cut.resize((max_w, nh), Image.Resampling.LANCZOS)

    png_path = images / "mockup_nobg.png"
    webp_path = images / "mockup_nobg.webp"
    cut.save(png_path, optimize=True)
    cut.save(webp_path, quality=88, method=6)
    print("Wrote", png_path, cut.size)
    print("Wrote", webp_path)


if __name__ == "__main__":
    main()
