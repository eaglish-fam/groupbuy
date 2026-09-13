"""Outline the user-provided font without shipping the full font file.

Usage: uv run --with fonttools python scripts/build-faraway-wordmark.py FONT
The original font remains outside the public repository.
"""
import sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

font = TTFont(sys.argv[1])
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
units = font['head'].unitsPerEm
x = 0
paths = []
bounds = []
for character in '鷹家遠行所':
    glyph = glyphs[cmap[ord(character)]]
    pen = SVGPathPen(glyphs)
    glyph.draw(pen)
    bound = BoundsPen(glyphs)
    glyph.draw(bound)
    if bound.bounds:
        a, b, c, d = bound.bounds
        bounds.append((a + x, b, c + x, d))
    paths.append(f'<path transform="translate({x} 0)" d="{pen.getCommands()}"/>')
    x += glyph.width + units * .06
left = min(b[0] for b in bounds) - units * .03
bottom = min(b[1] for b in bounds) - units * .03
right = max(b[2] for b in bounds) + units * .03
top = max(b[3] for b in bounds) + units * .03
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{left} {-top} {right-left} {top-bottom}" role="img" aria-labelledby="title">'
       '<title id="title">鷹家遠行所</title><g fill="#15366a" transform="scale(1 -1)">'
       + ''.join(paths) + '</g></svg>\n')
destination = Path(__file__).resolve().parents[1] / 'flights/assets/faraway-wordmark.svg'
destination.write_text(svg, encoding='utf-8')
print(f'Outlined five verified glyphs to {destination}')
