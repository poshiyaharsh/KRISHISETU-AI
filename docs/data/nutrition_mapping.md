# Crop Nutrition Mapping Documentation

This document describes the mapping between the 22 supported crops from the KrishiSetu Crop Recommendation System (CRS) and standardized dietary food items from **USDA FoodData Central (SR Legacy)**.

---

## 1. Governance & Data Principles

1. **No Memory-Based Values:** Every nutrient value is strictly retrieved from authoritative food databases (USDA FoodData Central SR Legacy) and tracked with `source_id`, retrieval date, and public domain license.
2. **Standard Basis:** All values represent nutritional content **per 100 g edible portion**.
3. **Staple Crop Forms (Raw vs. Cooked):**
   - Cereals and pulses (rice, maize, chickpea, kidney beans, lentil, black gram, mung bean, moth beans, pigeon peas) expand significantly upon cooking with water.
   - Providing only raw (dry) data would grossly misrepresent cooked meal density (e.g., ~360 kcal/100 g dry rice vs. ~130 kcal/100 g cooked rice).
   - Therefore, staples maintain two entries: **raw (dry)** and **cooked**. Cooked is designated as the default view for realistic consumer dietary understanding.
4. **Special Crops:**
   - **Coffee:** Cultivated as a cash crop, but dietary consumption occurs as a brewed beverage. Analyzing raw or unroasted green beans provides misleading dietary information. The dietary entry is mapped to `Coffee, brewed, prepared with tap water` (FDC ID 171890) and clearly labeled as form `brewed`.
   - **Non-Food Crops:** Cotton and Jute are commercial fiber crops. They have no edible food portion and are explicitly flagged with `is_food: false` (`Not a food crop`).

---

## 2. Complete Mapping Matrix (22 Supported Crops)

| Crop Key | Crop Name | Food Item (USDA FDC) | FDC ID | Form | Is Food | Default View | Justification |
|---|---|---|---|---|---|---|---|
| `apple` | Apple | Apples, raw, with skin | 171688 | raw | Yes | Yes | Whole fresh apple consumed raw |
| `banana` | Banana | Bananas, raw | 173944 | raw | Yes | Yes | Fresh peeled ripe banana pulp |
| `blackgram` | Black Gram (Urad) | Mungo beans, mature seeds, raw | 174259 | raw | Yes | No | Dry raw whole urad pulse baseline |
| `blackgram` | Black Gram (Urad) | Mungo beans, mature seeds, cooked, boiled, without salt | 172427 | cooked | Yes | Yes | Boiled urad pulse portion ready for consumption |
| `chickpea` | Chickpea (Chana) | Chickpeas (garbanzo beans, bengal gram), mature seeds, raw | 173756 | raw | Yes | No | Dry raw chickpea baseline |
| `chickpea` | Chickpea (Chana) | Chickpeas (garbanzo beans, bengal gram), mature seeds, cooked, boiled, without salt | 173757 | cooked | Yes | Yes | Boiled chickpea portion ready for consumption |
| `coconut` | Coconut | Nuts, coconut meat, raw | 170169 | raw | Yes | Yes | Fresh edible solid coconut endosperm |
| `coffee` | Coffee | Coffee, brewed, prepared with tap water | 171890 | brewed | Yes | Yes | Brewed beverage per 100 g reflects dietary consumption |
| `cotton` | Cotton | Not a food crop | NONE | non_food | No | Yes | Commercial industrial fiber crop |
| `grapes` | Grapes | Grapes, red or green (European type, such as Thompson seedless), raw | 174683 | raw | Yes | Yes | Fresh table grapes consumed raw |
| `jute` | Jute | Not a food crop | NONE | non_food | No | Yes | Bast fiber crop; inedible |
| `kidneybeans` | Kidney Beans (Rajma) | Beans, kidney, all types, mature seeds, raw | 175193 | raw | Yes | No | Dry raw kidney beans baseline |
| `kidneybeans` | Kidney Beans (Rajma) | Beans, kidney, all types, mature seeds, cooked, boiled, without salt | 173740 | cooked | Yes | Yes | Boiled rajma beans portion ready for consumption |
| `lentil` | Lentil (Masoor) | Lentils, raw | 172420 | raw | Yes | No | Dry raw lentils baseline |
| `lentil` | Lentil (Masoor) | Lentils, mature seeds, cooked, boiled, without salt | 172421 | cooked | Yes | Yes | Boiled masoor lentils portion ready for consumption |
| `maize` | Maize (Corn) | Corn, sweet, yellow, raw | 169998 | raw | Yes | No | Fresh sweet corn kernels raw baseline |
| `maize` | Maize (Corn) | Corn, sweet, yellow, cooked, boiled, drained, without salt | 169999 | cooked | Yes | Yes | Boiled sweet corn kernels ready for consumption |
| `mango` | Mango | Mangos, raw | 169910 | raw | Yes | Yes | Fresh ripe mango fruit pulp |
| `mothbeans` | Moth Beans (Matki) | Mothbeans, mature seeds, raw | 172425 | raw | Yes | No | Dry raw moth beans baseline |
| `mothbeans` | Moth Beans (Matki) | Mothbeans, mature seeds, cooked, boiled, without salt | 172426 | cooked | Yes | Yes | Boiled moth beans portion ready for consumption |
| `mungbean` | Mung Bean (Moong) | Mung beans, mature seeds, raw | 174256 | raw | Yes | No | Dry raw green gram baseline |
| `mungbean` | Mung Bean (Moong) | Mung beans, mature seeds, cooked, boiled, without salt | 174257 | cooked | Yes | Yes | Boiled moong pulse portion ready for consumption |
| `muskmelon` | Muskmelon | Melons, cantaloupe, raw | 169092 | raw | Yes | Yes | Fresh cantaloupe melon flesh consumed raw |
| `orange` | Orange | Oranges, raw, all commercial varieties | 169097 | raw | Yes | Yes | Fresh peeled orange fruit segments |
| `papaya` | Papaya | Papayas, raw | 169926 | raw | Yes | Yes | Fresh ripe papaya fruit flesh |
| `pigeonpeas` | Pigeon Peas (Arhar/Toor) | Pigeon peas (red gram), mature seeds, raw | 172436 | raw | Yes | No | Dry raw red gram baseline |
| `pigeonpeas` | Pigeon Peas (Arhar/Toor) | Pigeon peas (red gram), mature seeds, cooked, boiled, without salt | 172437 | cooked | Yes | Yes | Boiled arhar/toor pulse portion ready for consumption |
| `pomegranate` | Pomegranate | Pomegranates, raw | 169134 | raw | Yes | Yes | Fresh raw pomegranate arils |
| `rice` | Rice | Rice, white, long-grain, regular, raw, unenriched | 169756 | raw | Yes | No | Dry raw white rice grains baseline |
| `rice` | Rice | Rice, white, long-grain, regular, enriched, cooked | 168878 | cooked | Yes | Yes | Steamed/boiled white rice portion ready for consumption |
| `watermelon` | Watermelon | Watermelon, raw | 167765 | raw | Yes | Yes | Fresh watermelon edible flesh consumed raw |

---

## 3. Coverage Summary

- Total CRS Crops: 22
- Non-Food Crops: 2 (`cotton`, `jute`)
- Food Crops: 20
- Food Crop Forms: 29 total nutrition profiles (9 staples with dual raw/cooked entries, 10 fruits/nuts with raw entries, 1 beverage with brewed entry).
- Weak matches: 0. Every item has an exact botanical and culinary match in USDA FoodData Central SR Legacy.
