"""Generates the README art in docs/assets from the app's own pixel sprites.

Each SVG embeds font subsets (only the glyphs it uses) so its text renders on GitHub,
where an <img> SVG can't load web fonts.

Usage:
    python3 tools/gen-readme-art.py <font-dir>

<font-dir> holds the Google Fonts TTFs:
    goround-700.ttf, goround-900.ttf  (Chiron GoRound TC, weights 700 and 900)
    bungee.ttf                        (Bungee)
"""
import base64
import io
import re
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
SPRITES = ROOT / 'src' / 'assets' / 'pixel'
OUT = ROOT / 'docs' / 'assets'
FONT_DIR = Path(sys.argv[1]) if len(sys.argv) > 1 else None

THEMES = {
    'light': dict(
        paper='#9ED6FF', surface='#FFFFFF', surface2='#E3F2FF', ink='#10122B', ink2='#2D3766', ink3='#4D5A8C',
        edge='#10122B', shadow='rgba(16,18,43,0.22)', title_shadow='#FFFFFF', sky='sky', ground='ground',
        morning='#00A651', afternoon='#E09200', evening='#D6336C', night='#3B44C9', coin='#FBD000', stamp='#E52521',
    ),
    'dark': dict(
        paper='#14123A', surface='#24216A', surface2='#2F2B80', ink='#F4F1FF', ink2='#C9C5F2', ink3='#9C97D6',
        edge='#05041A', shadow='rgba(0,0,0,0.4)', title_shadow='#24216A', sky='stars', ground='ground-night',
        morning='#3BE07A', afternoon='#FFC93C', evening='#FF6FA0', night='#8C97FF', coin='#FBD000', stamp='#FF5A4E',
    ),
}

COPY = {
    'en': dict(
        title=('Your day,', 'drawn as a level.'),
        lede='Say where and for how long. Walk the day it draws.',
        place='Dihua Street', until='Stay until 14:45',
        steps=[
            ('Where and how long', 'A place, 2 hours to 7 days'),
            ('Real places', 'Candidates from Google Places'),
            ('Pick and order', 'The model chooses, you adjust'),
            ('Walk the level', 'Scrub, play, navigate'),
        ],
        how_label='How TourGuide works',
    ),
    'zh': dict(
        title=('把一天，', '畫成一個關卡。'),
        lede='說去哪、待多久，跟著它畫出的一天走。',
        place='迪化街', until='停留到 14:45',
        steps=[
            ('去哪、多久', '一個地點，2 小時到 7 天'),
            ('找真實地點', '候選地點來自 Google Places'),
            ('挑選並排序', '模型挑選排序，你隨時調整'),
            ('跟著關卡走', '拖動、播放、導航'),
        ],
        how_label='TourGuide 怎麼運作',
    ),
}


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def sprite(name, x, y, scale, outlined=False):
    """Inline a pixel sprite from src/assets/pixel at (x, y), scaled.
    `outlined` traces it in a light rim (see OUTLINE) so ink-dark pixels survive the night sky."""
    body = (SPRITES / f'{name}.svg').read_text()
    inner = re.sub(r'^<svg[^>]*>', '', body).removesuffix('</svg>')
    rim = ' filter="url(#rim)"' if outlined else ''
    return f'<g transform="translate({x} {y}) scale({scale})"{rim}>{inner}</g>'


def outline_filter(t):
    """One sprite pixel of light rim around a sprite, used on the dark theme only."""
    return (f'<defs><filter id="rim" x="-20%" y="-20%" width="140%" height="140%">'
            f'<feMorphology in="SourceAlpha" operator="dilate" radius="1" result="grown"/>'
            f'<feFlood flood-color="{t["ink3"]}"/><feComposite in2="grown" operator="in" result="rim"/>'
            f'<feMerge><feMergeNode in="rim"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>')


def font_face(family, ttf, text):
    """A @font-face holding only the glyphs needed for `text`, as base64 WOFF."""
    opts = subset.Options()
    opts.flavor = 'woff'
    opts.layout_features = ['*']
    opts.name_IDs = []
    font = TTFont(FONT_DIR / ttf)
    sub = subset.Subsetter(opts)
    sub.populate(text=''.join(sorted(set(text))))
    sub.subset(font)
    buf = io.BytesIO()
    font.flavor = 'woff'
    font.save(buf)
    data = base64.b64encode(buf.getvalue()).decode()
    return f"@font-face{{font-family:'{family}';src:url(data:font/woff;base64,{data}) format('woff');}}"


class Text:
    """Collects text per face so each SVG embeds just the glyphs it draws."""

    FACES = {'TG9': 'goround-900.ttf', 'TG7': 'goround-700.ttf', 'TGB': 'bungee.ttf'}
    STACKS = {
        'TG9': "'TG9','PingFang TC','Microsoft JhengHei',sans-serif",
        'TG7': "'TG7','PingFang TC','Microsoft JhengHei',sans-serif",
        'TGB': "'TGB',Impact,sans-serif",
    }

    def __init__(self):
        self.used = {k: '' for k in self.FACES}

    def __call__(self, face, x, y, size, fill, s, anchor='start'):
        self.used[face] += s
        return (f'<text x="{x}" y="{y}" font-family="{self.STACKS[face]}" font-size="{size}" fill="{fill}" '
                f'text-anchor="{anchor}">{esc(s)}</text>')

    def defs(self):
        faces = [font_face(f, self.FACES[f], t) for f, t in self.used.items() if t]
        return f'<defs><style>{"".join(faces)}</style></defs>'


def pixel_box(x, y, w, h, fill, edge, px=4, drop=None):
    """A panel with a notched pixel edge (corners left open) and an optional hard drop."""
    parts = []
    if drop:
        parts.append(f'<rect x="{x}" y="{y + h + px}" width="{w}" height="{px * 2}" fill="{drop}"/>')
    parts += [
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}"/>',
        f'<rect x="{x}" y="{y - px}" width="{w}" height="{px}" fill="{edge}"/>',
        f'<rect x="{x}" y="{y + h}" width="{w}" height="{px}" fill="{edge}"/>',
        f'<rect x="{x - px}" y="{y}" width="{px}" height="{h}" fill="{edge}"/>',
        f'<rect x="{x + w}" y="{y}" width="{px}" height="{h}" fill="{edge}"/>',
    ]
    return ''.join(parts)


def ground_strip(t, y, width, tile):
    """A row of ground blocks, drawn once as a pattern tile."""
    return (f'<defs><pattern id="ground" x="0" y="{y}" width="{tile}" height="{tile}" patternUnits="userSpaceOnUse">'
            f'{sprite(t["ground"], 0, 0, tile / 16)}</pattern></defs>'
            f'<rect x="0" y="{y - 4}" width="{width}" height="4" fill="{t["edge"]}"/>'
            f'<rect x="0" y="{y}" width="{width}" height="{tile}" fill="url(#ground)"/>')


def sky_and_ground(t, width, height, ground_y, tile, clouds=True, sky_x=0):
    """The level backdrop: sky colour, clouds (or stars at night), and a ground floor."""
    parts = [f'<rect width="{width}" height="{height}" fill="{t["paper"]}"/>']
    if clouds or t['sky'] == 'stars':
        for x in range(sky_x - 640, width, 640):
            parts.append(sprite(t['sky'], x, 0, 1))
    parts.append(ground_strip(t, ground_y, width, tile))
    if t['sky'] == 'stars':
        parts.append(outline_filter(t))
    return ''.join(parts)


def hero(lang, theme):
    t, c, txt = THEMES[theme], COPY[lang], Text()
    W, H = 1200, 630
    night = t['sky'] == 'stars'
    # shift the cloud tile so no cloud sits behind the wordmark
    body = [sky_and_ground(t, W, H, 582, 48, sky_x=420)]

    # wordmark
    body.append(sprite('coin', 72, 62, 3.5))
    body.append(txt('TG9', 112, 88, 32, t['ink'], 'TourGuide'))

    # headline with the app's hard offset shadow
    for i, line in enumerate(c['title']):
        y = 196 + i * 82
        body.append(txt('TG9', 77, y + 5, 70, t['title_shadow'], line))
        body.append(txt('TG9', 72, y, 70, t['ink'], line))
    body.append(txt('TG7', 72, 340, 25, t['ink2'], c['lede']))

    # the readout card: the clock is the score
    cx, cy, cw, ch = 800, 76, 328, 150
    body.append(pixel_box(cx, cy, cw, ch, t['surface'], t['edge'], drop=t['shadow']))
    body.append(txt('TGB', 828 + 3, 146 + 3, 52, t['edge'], '14:20'))
    body.append(txt('TGB', 828, 146, 52, t['afternoon'], '14:20'))
    body.append(txt('TG9', 828, 186, 26, t['ink'], c['place']))
    body.append(txt('TG7', 828, 212, 17, t['ink3'], c['until']))

    # the level: thick = staying, thin = travelling, dashed = free time
    line_y = 470
    pieces = [
        ('stay', 96, 220, 'morning'), ('move', 220, 300, 'morning'),
        ('stay', 300, 430, 'afternoon'), ('move', 430, 520, 'afternoon'),
        ('gap', 520, 610, None),
        ('stay', 610, 760, 'evening'), ('move', 760, 860, 'evening'),
        ('stay', 860, 1040, 'night'),
    ]
    for kind, x0, x1, slot in pieces:
        if kind == 'gap':
            for x in range(x0, x1, 16):
                body.append(f'<rect x="{x}" y="{line_y - 3}" width="8" height="6" fill="{t["ink3"]}"/>')
            continue
        h = 16 if kind == 'stay' else 6
        faded = '' if x1 <= 430 else ' opacity="0.4"'
        body.append(f'<g{faded}><rect x="{x0}" y="{line_y - h / 2 - 3}" width="{x1 - x0}" height="{h + 6}" fill="{t["edge"]}"/>'
                    f'<rect x="{x0}" y="{line_y - h / 2}" width="{x1 - x0}" height="{h}" fill="{t[slot]}"/></g>')
    # stops: passed ones are used blocks, ahead ones are ? blocks
    for x, used in [(96, True), (300, True), (610, False), (860, False)]:
        body.append(sprite('qblock-used' if used else 'qblock', x - 18, line_y - 18, 3))
    body.append(sprite('coin', 600 - 12 + 10, line_y - 74, 3))  # a coin popping out of the next block
    body.append(sprite('hiker', 404, line_y - 18 - 42, 3, outlined=night))
    body.append(sprite('flag', 1060, line_y - 46, 3, outlined=night))
    body.append(txt('TGB', 96, 528, 18, t['ink3'], '09:00', 'middle'))
    body.append(txt('TGB', 1060, 528, 18, t['ink3'], '22:00', 'middle'))

    label = f'TourGuide: {" ".join(c["title"])}'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" '
            f'aria-label="{esc(label)}" shape-rendering="crispEdges"><title>{esc(label)}</title>'
            f'{txt.defs()}{"".join(body)}</svg>')


def how(lang, theme):
    t, c, txt = THEMES[theme], COPY[lang], Text()
    W, H = 1200, 260
    night = t['sky'] == 'stars'
    # no clouds here: they'd sit behind the step blocks
    body = [sky_and_ground(t, W, H, 228, 32, clouds=False)]
    xs = [150, 450, 750, 1050]
    # a track joining the four blocks, in sequence
    body.append(f'<rect x="{xs[0]}" y="69" width="{xs[-1] - xs[0]}" height="10" fill="{t["edge"]}"/>')
    body.append(f'<rect x="{xs[0]}" y="72" width="{xs[-1] - xs[0]}" height="4" fill="{t["surface"]}"/>')
    for i, (x, (title, sub)) in enumerate(zip(xs, c['steps'])):
        s = 56
        bx, by = x - s / 2, 46
        body.append(pixel_box(bx, by, s, s, t['coin'], '#10122B', px=4))
        body.append(f'<rect x="{bx}" y="{by + s - 6}" width="{s}" height="6" fill="#C88A00"/>')
        body.append(f'<rect x="{bx}" y="{by}" width="{s}" height="4" fill="#FFF4B0"/>')
        body.append(txt('TGB', x, by + 41, 30, '#10122B', str(i + 1), 'middle'))
        body.append(txt('TG9', x, 150, 23, t['ink'], title, 'middle'))
        body.append(txt('TG7', x, 180, 16, t['ink2'], sub, 'middle'))
    body.append(sprite('hiker', xs[0] - 66, 46 + 56 - 42, 3, outlined=night))
    body.append(sprite('flag', xs[-1] + 44, 46 + 56 - 48, 3, outlined=night))

    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" '
            f'aria-label="{esc(c["how_label"])}" shape-rendering="crispEdges"><title>{esc(c["how_label"])}</title>'
            f'{txt.defs()}{"".join(body)}</svg>')


def divider(theme):
    t = THEMES[theme]
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="28" viewBox="0 0 1200 28" '
            f'shape-rendering="crispEdges" aria-hidden="true">{ground_strip(t, 4, 1200, 24)}</svg>')


def main():
    if not FONT_DIR:
        sys.exit(__doc__)
    OUT.mkdir(parents=True, exist_ok=True)
    for theme in THEMES:
        (OUT / f'divider-{theme}.svg').write_text(divider(theme))
        for lang in COPY:
            (OUT / f'hero-{lang}-{theme}.svg').write_text(hero(lang, theme))
            (OUT / f'how-{lang}-{theme}.svg').write_text(how(lang, theme))
    for f in sorted(OUT.glob('*.svg')):
        print(f'{f.relative_to(ROOT)}  {f.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
