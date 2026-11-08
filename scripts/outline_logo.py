import re
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

def generate_outlined_logo(font_path, source_svg_path, output_svg_path, reversed_output_path=None):
    font = TTFont(font_path)
    inst = instantiateVariableFont(font, {'wght': 800})
    glyph_set = inst.getGlyphSet()
    cmap = inst.getBestCmap()
    upm = inst['head'].unitsPerEm
    hmtx = inst['hmtx']

    font_size = 56
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

    def text_to_paths(text, start_x, baseline_y, letter_spacing=0):
        cur_x = start_x
        paths = []
        for char in text:
            d, adv = get_char_path(char)
            if d:
                paths.append(f'<path d="{d}" transform="translate({cur_x:.2f}, {baseline_y:.2f})" />')
            cur_x += adv + letter_spacing
        return ''.join(paths), cur_x

    # Render "KrishiSetu"
    paths_krishi, end_x1 = text_to_paths("KrishiSetu", 134, 82, letter_spacing=-0.5)
    # Render "AI" with dx=10 gap
    paths_ai, end_x2 = text_to_paths("AI", end_x1 + 10, 82, letter_spacing=-0.5)

    with open(source_svg_path, 'r', encoding='utf-8') as f:
        src = f.read()

    # Remove live <text> tag
    base_graphic = re.sub(r'<text[\s\S]*?</text>', '', src)
    # Also clean metadata if any
    base_graphic = re.sub(r'<metadata[\s\S]*?</metadata>', '', base_graphic).strip()
    if base_graphic.endswith('</svg>'):
        base_graphic = base_graphic[:-6].strip()

    standard_svg = f"""{base_graphic}
  <g id="wordmark">
    <g fill="#0F4A32">
      {paths_krishi}
    </g>
    <g fill="#3B8E4F">
      {paths_ai}
    </g>
  </g>
</svg>
"""
    with open(output_svg_path, 'w', encoding='utf-8') as f:
        f.write(standard_svg)
    print(f"Written outlined logo to {output_svg_path}")

    if reversed_output_path:
        # Create reversed version for dark backgrounds
        # cream arch #F5F0DC, light-green sprout #7BC47F, wheat deck #D9A93F
        # cables cream with opacity .5
        # wordmark: KrishiSetu in #F5F0DC, AI in #D9A93F
        reversed_svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 120" role="img" aria-labelledby="t">
  <title id="t">KrishiSetu AI</title>
  <g fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M30 65V100M45 56.5V100M75 56.5V100M90 65V100" stroke="#F5F0DC" stroke-width="2.5" opacity=".5"/>
    <path d="M14 100A46 46 0 0 1 106 100" stroke="#F5F0DC" stroke-width="7"/>
    <path d="M8 100H112" stroke="#D9A93F" stroke-width="7"/>
    <path d="M60 100V46" stroke="#7BC47F" stroke-width="5"/>
  </g>
  <path d="M60 46C44 46 33 36 31 20C48 20 58 29 60 46Z" fill="#7BC47F"/>
  <path d="M60 46C76 46 87 36 89 20C72 20 62 29 60 46Z" fill="#7BC47F"/>
  <g id="wordmark-reversed">
    <g fill="#F5F0DC">
      {paths_krishi}
    </g>
    <g fill="#D9A93F">
      {paths_ai}
    </g>
  </g>
</svg>
"""
        with open(reversed_output_path, 'w', encoding='utf-8') as f:
            f.write(reversed_svg)
        print(f"Written reversed logo to {reversed_output_path}")

if __name__ == '__main__':
    generate_outlined_logo(
        'NotoSans.ttf',
        'docs/brand/logo.source.svg',
        'frontend/public/logo.svg',
        'frontend/public/logo-reversed.svg'
    )
