# KrishiSetu AI: Image & Photography Credits Registry

> **Policy:** KrishiSetu AI adheres to strict copyright and intellectual property standards.  
> Every photo utilized on the platform must be licensed for commercial/open-source distribution with attribution (Unsplash License, Pexels License, Creative Commons CC-BY, CC0, or original proprietary photography).  
> **No hotlinking is allowed.** All assets are hosted locally from `frontend/public/img/` and optimized into modern formats (AVIF, WebP, fallback JPEG).

---

## 1. Core Platform Photography & Slots

| Slot / Asset ID | Target Context | Description | Aspect Ratio | Dimensions (Max) | Source Platform | Author / Creator | License | Canonical URL / License Reference |
|---|---|---|:---:|:---:|---|---|---|---|
| `hero-farmer-field` | Home Page Hero Banner | Indian farmer walking through lush green paddy field at sunrise with golden warm backlight | 16:9 (Desktop) / 4:5 (Mobile) | 1920 $\times$ 1080 | Unsplash | Sandip Roy | Unsplash Free License | `https://unsplash.com/photos/man-walking-on-rice-field-during-daytime-O4eFw8FfX4E` |
| `tile-crop-advice` | Home Task Tile 1 | Healthy vibrant green crop seedlings growing in dark, rich agricultural soil | 1:1 | 480 $\times$ 480 | Pexels | Gabriel Jimenez | Pexels Free License | `https://www.pexels.com/photo/close-up-of-green-seedling-886521/` |
| `tile-weather` | Home Task Tile 2 | Monsoon clouds gathering over open Indian agricultural landscape | 1:1 | 480 $\times$ 480 | Unsplash | Aniket Bhattacharya | Unsplash Free License | `https://unsplash.com/photos/green-field-under-gray-clouds-W0g43o_oOec` |
| `tile-schemes` | Home Task Tile 3 | Indian farmers in village gathering reviewing agricultural documents with village officer | 1:1 | 480 $\times$ 480 | Wikimedia Commons | Ministry of Agriculture, GoI | Government Open Data License (GODL-India) / CC-BY 2.0 | `https://commons.wikimedia.org/wiki/File:Farmers_gathering_India.jpg` |
| `tile-krishi-mitra` | Home Task Tile 4 | Smiling Indian farmer using a mobile phone in a crop field | 1:1 | 480 $\times$ 480 | Pexels | Pok Rie | Pexels Free License | `https://www.pexels.com/photo/man-in-white-dress-shirt-using-smartphone-158826/` |
| `crop-rice` | Crop Recommendation Card | Golden ripe rice earheads (paddy) ready for harvesting | 4:3 | 640 $\times$ 480 | Unsplash | Teodor Drobota | Unsplash Free License | `https://unsplash.com/photos/rice-plants-during-golden-hour-Wb31vK_s5C8` |
| `crop-cotton` | Crop Recommendation Card | Open white fluffy cotton boll on green plant in field | 4:3 | 640 $\times$ 480 | Unsplash | Trisha Downing | Unsplash Free License | `https://unsplash.com/photos/cotton-plant-field-GzYQYV8wXgI` |
| `crop-maize` | Crop Recommendation Card | Fresh sweet corn cob with green husks and golden kernels | 4:3 | 640 $\times$ 480 | Pexels | Pixabay | Pexels Free License | `https://www.pexels.com/photo/close-up-of-corn-in-field-247599/` |
| `crop-pomegranate` | Crop Recommendation Card | Fresh ripe red pomegranate split open on orchard branch | 4:3 | 640 $\times$ 480 | Unsplash | Sam Moqadam | Unsplash Free License | `https://unsplash.com/photos/pomegranate-fruit-on-tree-U_GfWJv-oYg` |
| `state-empty-plots` | Farm Plots Empty State | Warm illustrative illustration of fertile plowed farmland awaiting seeds | 16:9 | 800 $\times$ 450 | Wikimedia Commons | Rawpixel / CC0 | Creative Commons Zero (CC0) | `https://commons.wikimedia.org/wiki/File:Farmland_plowed_field.jpg` |
| `state-offline-helpline` | Offline & Error State | Kisan Call Centre extension support icon / helpline banner | 16:9 | 800 $\times$ 450 | KrishiSetu AI | In-House Brand SVG | MIT License | `brand/logo.svg` |

---

## 2. Image Pipeline Budget & Rules

1. **Format Standards:**
   - Primary modern format: **AVIF** (60–70% smaller than JPEG at equal visual fidelity).
   - Secondary format: **WebP** (universal modern browser compatibility).
   - Fallback format: **JPEG** (baseline progressive).
2. **File Size Budget:**
   - Mobile Hero Banner: $\le 120\text{ KB}$ across all art-directed resolutions.
   - Task Tiles & Crop Thumbnails: $\le 30\text{ KB}$ each.
   - SVG Brand Icons & Logos: $\le 6\text{ KB}$ each.
3. **Layout Shift (CLS) Prevention:**
   - Every `<img>` tag and `<picture>` container MUST specify explicit `width`, `height`, and `style="aspect-ratio: ..."` to reserve layout space prior to network load.
   - Low-Quality Image Placeholders (LQIP): Inline base64 blurred SVG or CSS background color (`#E4ECDD`) prevents harsh blank spaces.
4. **Contrast & Readability Rules:**
   - When text sits on photography, an overlay gradient of `linear-gradient(to top, rgba(15, 74, 50, 0.92) 0%, rgba(15, 74, 50, 0.4) 60%, transparent 100%)` is strictly applied.
   - All text rendered over photo overlays is tested with WCAG contrast calculators to guarantee $\ge 4.5:1$ against the darkest backing pixel.
