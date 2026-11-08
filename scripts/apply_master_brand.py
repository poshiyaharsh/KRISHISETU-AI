import base64
import os
import shutil
from PIL import Image

USER_UPLOADED_LOGO = r"C:\Users\Harsh Poshiya\.gemini\antigravity\brain\2f557816-3780-4e18-9a8b-8750d185762c\.user_uploaded\media_1794141482664_48e87ebd.png"
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PUBLIC_DIR = os.path.join(ROOT_DIR, "frontend", "public")
DOCS_BRAND_DIR = os.path.join(ROOT_DIR, "docs", "brand")

os.makedirs(PUBLIC_DIR, exist_ok=True)
os.makedirs(DOCS_BRAND_DIR, exist_ok=True)

def apply_master_logo():
    print("--- Applying Full and Final Official Brand Logo (Cleaned Icon) ---")
    
    # 1. Copy Master Image to docs/brand and frontend/public
    master_png_dest = os.path.join(DOCS_BRAND_DIR, "logo.master.png")
    shutil.copy2(USER_UPLOADED_LOGO, master_png_dest)
    
    public_logo_png = os.path.join(PUBLIC_DIR, "logo.png")
    shutil.copy2(USER_UPLOADED_LOGO, public_logo_png)
    
    docs_logo_png = os.path.join(DOCS_BRAND_DIR, "logo.png")
    shutil.copy2(USER_UPLOADED_LOGO, docs_logo_png)
    print("Copied master PNG to docs/brand/logo.png and frontend/public/logo.png")

    # 2. Generate frontend/public/logo.svg and docs/brand/logo.source.svg
    with open(USER_UPLOADED_LOGO, "rb") as f:
        png_b64 = base64.b64encode(f.read()).decode("utf-8")
    
    logo_svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 341" width="1024" height="341" role="img" aria-label="KrishiSetu AI">
  <title>KrishiSetu AI</title>
  <image width="1024" height="341" href="data:image/png;base64,{png_b64}"/>
</svg>
"""
    with open(os.path.join(PUBLIC_DIR, "logo.svg"), "w", encoding="utf-8") as f:
        f.write(logo_svg_content)
    with open(os.path.join(DOCS_BRAND_DIR, "logo.source.svg"), "w", encoding="utf-8") as f:
        f.write(logo_svg_content)
    print("Generated logo.svg embedding the master logo")

    # 3. Extract Clean Stylized K Emblem (Removing any stray pixels from letter K or tagline line)
    orig_im = Image.open(USER_UPLOADED_LOGO).convert("RGBA")
    
    # Crop the exact emblem area
    emblem_crop = orig_im.crop((66, 12, 298, 320))
    
    # Pixel-level cleaning: eliminate any stray dark green text from letter K (x >= 270)
    # and any tagline rule line pixels (y around 240-248 for x >= 292)
    cleaned_emblem = Image.new("RGBA", emblem_crop.size, (0, 0, 0, 0))
    for y in range(emblem_crop.height):
        for x in range(emblem_crop.width):
            orig_x = 66 + x
            orig_y = 12 + y
            r, g, b, a = emblem_crop.getpixel((x, y))
            if a > 0:
                # Discard dark forest green text pixels from letter K
                if orig_x >= 270 and r < 20 and g < 65 and b < 30:
                    continue
                # Discard tagline horizontal rule line
                if orig_x >= 292 and 240 <= orig_y <= 248:
                    continue
                cleaned_emblem.putpixel((x, y), (r, g, b, a))
                
    # Tight bounding box of cleaned emblem
    emblem_bbox = cleaned_emblem.getbbox()
    final_emblem = cleaned_emblem.crop(emblem_bbox)
    emblem_w, emblem_h = final_emblem.size # ~232 x 308

    # Create 512x512 square icon with centered emblem and proportional padding
    square_dim = 360
    square_canvas = Image.new("RGBA", (square_dim, square_dim), (0, 0, 0, 0))
    paste_x = (square_dim - emblem_w) // 2
    paste_y = (square_dim - emblem_h) // 2
    square_canvas.paste(final_emblem, (paste_x, paste_y), final_emblem)
    
    # Resize to 512x512 master icon
    icon_512 = square_canvas.resize((512, 512), Image.Resampling.LANCZOS)
    icon_512_path = os.path.join(PUBLIC_DIR, "logo-icon.png")
    icon_512.save(icon_512_path)
    shutil.copy2(icon_512_path, os.path.join(DOCS_BRAND_DIR, "logo-icon.png"))
    print("Saved perfectly cleaned logo-icon.png (512x512)")

    # Generate logo-icon.svg
    with open(icon_512_path, "rb") as f:
        icon_b64 = base64.b64encode(f.read()).decode("utf-8")
    icon_svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img" aria-label="KrishiSetu AI Icon">
  <title>KrishiSetu AI Icon</title>
  <image width="512" height="512" href="data:image/png;base64,{icon_b64}"/>
</svg>
"""
    with open(os.path.join(PUBLIC_DIR, "logo-icon.svg"), "w", encoding="utf-8") as f:
        f.write(icon_svg_content)
    with open(os.path.join(PUBLIC_DIR, "favicon.svg"), "w", encoding="utf-8") as f:
        f.write(icon_svg_content)
    print("Generated logo-icon.svg and favicon.svg without stray lines")

    # 4. Generate Favicon PNGs from Cleaned Emblem
    # 32x32
    fav32 = icon_512.resize((32, 32), Image.Resampling.LANCZOS)
    fav32.save(os.path.join(PUBLIC_DIR, "favicon-32.png"))

    # 192x192
    fav192 = icon_512.resize((192, 192), Image.Resampling.LANCZOS)
    fav192.save(os.path.join(PUBLIC_DIR, "favicon-192.png"))

    # 512x512
    fav512 = icon_512.resize((512, 512), Image.Resampling.LANCZOS)
    fav512.save(os.path.join(PUBLIC_DIR, "favicon-512.png"))
    print("Generated clean favicon-32.png, favicon-192.png, favicon-512.png")

    # 5. Generate Apple Touch Icon (180x180, solid deep forest green #02280C, no transparency)
    apple_canvas = Image.new("RGBA", (180, 180), (2, 40, 12, 255))
    fit_h = 136
    fit_w = int(emblem_w * (fit_h / emblem_h))
    emblem_apple = final_emblem.resize((fit_w, fit_h), Image.Resampling.LANCZOS)
    apple_x = (180 - fit_w) // 2
    apple_y = (180 - fit_h) // 2
    apple_canvas.paste(emblem_apple, (apple_x, apple_y), emblem_apple)
    apple_canvas = apple_canvas.convert("RGB")
    apple_canvas.save(os.path.join(PUBLIC_DIR, "apple-touch-icon.png"))
    print("Generated clean apple-touch-icon.png (180x180)")

    # 6. Generate Open Graph Image (1200x630)
    og_canvas = Image.new("RGBA", (1200, 630), (255, 255, 255, 255))
    logo_tight = orig_im.crop((66, 12, 1011, 330))
    tight_w, tight_h = logo_tight.size
    
    scale = 960 / tight_w
    target_w = int(tight_w * scale)
    target_h = int(tight_h * scale)
    scaled_logo = logo_tight.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    og_x = (1200 - target_w) // 2
    og_y = (630 - target_h) // 2
    og_canvas.paste(scaled_logo, (og_x, og_y), scaled_logo)
    og_canvas = og_canvas.convert("RGB")
    og_canvas.save(os.path.join(PUBLIC_DIR, "og-image.png"))
    og_canvas.save(os.path.join(DOCS_BRAND_DIR, "og-image.png"))
    print("Generated og-image.png (1200x630)")

    print("\n--- All brand icon assets have been perfected with zero stray lines! ---")

if __name__ == "__main__":
    apply_master_logo()
