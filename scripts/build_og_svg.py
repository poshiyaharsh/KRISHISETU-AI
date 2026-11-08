import os
import re
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

def build_og_svg(logo_path, font_path, output_svg_path):
    # Load font for tagline
    font = TTFont(font_path)
    inst = instantiateVariableFont(font, {'wght': 600})
    glyph_set = inst.getGlyphSet()
    cmap = inst.getBestCmap()
    upm = inst['head'].unitsPerEm
    hmtx = inst['hmtx']

    font_size = 32
    scale = font_size / upm

    def get_char_path(char):
        gid = cmap.get(ord(char))
        if not gid:
            return '', 0
        glyph = glyph_set[gid]
        pen = SVGPathPen(glyph_set)
        tpen = TransformPen(pen, (scale, 0, 0, -scale, 0, 0))
        glyph.draw(tpen)
        adv = hmtx[gid][0] * scale
        return pen.getCommands(), adv

    tagline = "Smarter Farming. Better Decisions. Brighter Tomorrow."
    total_width = sum(get_char_path(c)[1] for c in tagline)
    start_x = (1200 - total_width) / 2.0
    baseline_y = 430.0

    tagline_paths = []
    cur_x = start_x
    for c in tagline:
        d, adv = get_char_path(c)
        if d:
            tagline_paths.append(f'<path d="{d}" transform="translate({cur_x:.2f}, {baseline_y:.2f})" />')
        cur_x += adv
    tagline_svg = "".join(tagline_paths)

    # Read outlined logo
    with open(logo_path, 'r', encoding='utf-8') as f:
        logo_content = f.read()

    # Extract inner content of svg
    match = re.search(r'<svg[^>]*>([\s\S]*)</svg>', logo_content)
    inner_logo = match.group(1) if match else logo_content

    # Logo dimensions: 520x120. Scale to 1.35x -> 702x162.
    # Center horizontally: (1200 - 702)/2 = 249
    # Vertical pos: y = 180
    og_svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <!-- Background -->
  <rect width="1200" height="630" fill="#F5F0DC" />
  
  <!-- Subtle border frame -->
  <rect x="24" y="24" width="1152" height="582" rx="16" fill="none" stroke="#E4ECDD" stroke-width="2" />
  
  <!-- Centered Logo -->
  <g transform="translate(249, 180) scale(1.35)">
    {inner_logo}
  </g>
  
  <!-- Divider ornament -->
  <line x1="460" y1="365" x2="740" y2="365" stroke="#D9A93F" stroke-width="3" stroke-linecap="round" />
  
  <!-- Tagline Outlined Paths -->
  <g fill="#1D2B22">
    {tagline_svg}
  </g>
  
  <!-- Subtle badge -->
  <g transform="translate(520, 480)">
    <rect width="160" height="36" rx="18" fill="#E4ECDD" />
    <text x="80" y="23" font-family="'Noto Sans',system-ui,sans-serif" font-size="14" font-weight="700" fill="#0F4A32" text-anchor="middle" letter-spacing="1.5">KRISHISETU AI</text>
  </g>
</svg>
"""
    with open(output_svg_path, 'w', encoding='utf-8') as f:
        f.write(og_svg)
    print(f"Generated OG image SVG at {output_svg_path}")

if __name__ == '__main__':
    build_og_svg('frontend/public/logo.svg', 'NotoSans.ttf', 'docs/brand/og-image.svg')
