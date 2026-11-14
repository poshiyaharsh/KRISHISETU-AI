import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCALES_DIR = path.resolve(__dirname, "../frontend/src/i18n/locales");

const enPath = path.join(LOCALES_DIR, "en.json");
const en = JSON.parse(fs.readFileSync(enPath, "utf-8"));

// Comprehensive language names and localized common terms
const LOCALE_METADATA = {
  hi: { name: "Hindi", native: "हिन्दी" },
  gu: { name: "Gujarati", native: "ગુજરાતી" },
  mr: { name: "Marathi", native: "मराठी" },
  bn: { name: "Bengali", native: "বাংলা" },
  ta: { name: "Tamil", native: "தமிழ்" },
  te: { name: "Telugu", native: "తెలుగు" },
  kn: { name: "Kannada", native: "ಕನ್ನಡ" },
  ml: { name: "Malayalam", native: "മലയാളം" },
  pa: { name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  or: { name: "Odia", native: "ଓଡ଼ିଆ" },
  ur: { name: "Urdu", native: "اردو" },
  as: { name: "Assamese", native: "অসমীয়া" },
  brx: { name: "Bodo", native: "बर'" },
  doi: { name: "Dogri", native: "डोगरी" },
  kok: { name: "Konkani", native: "कोंकणी" },
  ks: { name: "Kashmiri", native: "کٲشُر" },
  mai: { name: "Maithili", native: "मैथिली" },
  mni: { name: "Manipuri", native: "মৈতৈલોন্" },
  ne: { name: "Nepali", native: "नेपाली" },
  sa: { name: "Sanskrit", native: "संस्कृतम्" },
  sat: { name: "Santali", native: "ᱥᱟᱱᱛᱟᱲᱤ" },
  sd: { name: "Sindhi", native: "سنڌي" },
};

// Known Indic translations for crops
const CROP_TRANSLATIONS = {
  mr: {
    apple: "सफरचंद", banana: "केळी", blackgram: "उडीद", chickpea: "हरभरा (चना)",
    coconut: "नारळ", coffee: "कॉफी", cotton: "कापूस", grapes: "द्राक्षे",
    jute: "ताग", kidneybeans: "राजमा", lentil: "मसूर", maize: "मका",
    mango: "आંબા", mothbeans: "मठ", mungbean: "मूગ", muskmelon: "खरबूज",
    orange: "संत्री", papaya: "पपई", pigeonpeas: "तूर", pomegranate: "डाळिंब",
    rice: "भात (तांदूळ)", watermelon: "कलिंगડ"
  },
  bn: {
    apple: "আপেল", banana: "কলা", blackgram: "মাসকলাই", chickpea: "ছোলা",
    coconut: "নারকেল", coffee: "কফি", cotton: "তুলা", grapes: "আঙ্গুর",
    jute: "পাট", kidneybeans: "রাজমা", lentil: "মসুর ডাল", maize: "ভুট্টা",
    mango: "আম", mothbeans: "মথ বিন", mungbean: "মুগ ডাল", muskmelon: "ফুটি (খরবূজা)",
    orange: "কমলালেবু", papaya: "পেঁপে", pigeonpeas: "অড়হর ডাল", pomegranate: "বেদানা (ডালিম)",
    rice: "ধান (চাল)", watermelon: "তরমুজ"
  },
  ta: {
    apple: "ஆப்பிள்", banana: "வாழைப்பழம்", blackgram: "உளுந்து", chickpea: "கொண்டைக்கடலை",
    coconut: "தேங்காய்", coffee: "காபி", cotton: "பருத்தி", grapes: "திராட்சை",
    jute: "சணல்", kidneybeans: "ராஜ்மா", lentil: "மைசூர் பருப்பு", maize: "மக்காச்சோளம்",
    mango: "மாம்பழம்", mothbeans: "நரிப்பயறு", mungbean: "பாசிப்பயறு", muskmelon: "முலாம் பழம்",
    orange: "ஆரஞ்சு", papaya: "பப்பாளி", pigeonpeas: "துவரம் பருப்பு", pomegranate: "மாதுளை",
    rice: "நெல் (அரிசி)", watermelon: "தர்பூசணி"
  },
  te: {
    apple: "యాపిల్", banana: "అరటి", blackgram: "మినుములు", chickpea: "శనగలు",
    coconut: "కొబ్బరి", coffee: "కాఫీ", cotton: "ప్రత్తి", grapes: "ద్రాక్ష",
    jute: "జనపనార", kidneybeans: "రాజ్మా", lentil: "ఎర్ర కందులు", maize: "మొక్కజొన్న",
    mango: "మామిడి", mothbeans: "బొబ్బర్లు", mungbean: "పెసలు", muskmelon: "ఖర్బూజ",
    orange: "నారింజ", papaya: "బొప్పాయి", pigeonpeas: "కందులు", pomegranate: "దానిమ్మ",
    rice: "వరి (బియ్యం)", watermelon: "పుచ్చకాయ"
  },
  kn: {
    apple: "ಸೇಬು", banana: "ಬಾಳೆಹಣ್ಣು", blackgram: "ಉದ್ದು", chickpea: "ಕಡಲೆ",
    coconut: "ತೆಂಗಿನಕಾಯಿ", coffee: "ಕಾಫಿ", cotton: "ಹತ್ತಿ", grapes: "ದ್ರಾಕ್ಷಿ",
    jute: "ಸೆಣಬು", kidneybeans: "ರಾಜ್ಮಾ", lentil: "ತೊಗರಿ/ಮಸೂರ", maize: "ಮೆಕ್ಕೆಜೋಳ",
    mango: "ಮಾವಿನಹಣ್ಣು", mothbeans: "ಮಡಿಕೆ ಕಾಳು", mungbean: "ಹೆಸರು ಕಾಳು", muskmelon: "ಕರಬೂಜ",
    orange: "ಕಿತ್ತಳೆ", papaya: "ಪರಂಗಿ (ಪಪ್ಪಾಯಿ)", pigeonpeas: "ತೊಗರಿ", pomegranate: "ದಾಳಿಂಬೆ",
    rice: "ಭತ್ತ (ಅಕ್ಕಿ)", watermelon: "ಕಲ್ಲಂಗಡಿ"
  },
  ml: {
    apple: "ആപ്പിൾ", banana: "വാഴപ്പഴം", blackgram: "ഉഴുന്ന്", chickpea: "കടല",
    coconut: "തേങ്ങ", coffee: "കാപ്പി", cotton: "പരുത്തി", grapes: "മുന്തിരി",
    jute: "ചണം", kidneybeans: "രാജ്മ", lentil: "പരിപ്പ്", maize: "മക്കച്ചോളം",
    mango: "മാങ്ങ", mothbeans: "പയർ", mungbean: "ചെറുപയർ", muskmelon: "തണ്ണിമത്തൻ",
    orange: "ഓറഞ്ച്", papaya: "പപ്പായ", pigeonpeas: "തുവരപ്പരിപ്പ്", pomegranate: "മാതളനാരങ്ങ",
    rice: "നെല്ല് (അരി)", watermelon: "വത്തക്ക"
  },
  pa: {
    apple: "ਸੇਬ", banana: "ਕੇਲਾ", blackgram: "ਮਾਂਹ (ਉੜਦ)", chickpea: "ਛੋਲੇ",
    coconut: "ਨਾਰੀਅਲ", coffee: "ਕੌਫੀ", cotton: "ਕਪਾਹ", grapes: "ਅੰਗੂਰ",
    jute: "ਪਟਸਨ", kidneybeans: "ਰਾਜਮਾਂਹ", lentil: "ਮਸਰ", maize: "ਮੱਕੀ",
    mango: "ਅੰਬ", mothbeans: "ਮੋਠ", mungbean: "ਮੂੰਗੀ", muskmelon: "ਖ਼ਰਬੂਜ਼ਾ",
    orange: "ਸੰਤਰਾ", papaya: "ਪਪੀਤਾ", pigeonpeas: "ਅਰਹਰ", pomegranate: "ਅਨਾਰ",
    rice: "ਝੋਨਾ (ਚੌਲ)", watermelon: "ਤਰਬੂਜ਼"
  },
  or: {
    apple: "ସେଓ", banana: "କଦଳୀ", blackgram: "ବିରି", chickpea: "ବୁଟ (ଚଣା)",
    coconut: "ନଡ଼ିଆ", coffee: "କଫି", cotton: "କପା", grapes: "ଅଙ୍ଗୁର",
    jute: "ଝୋଟ", kidneybeans: "ରାଜମା", lentil: "ମସୁର", maize: "ମକା",
    mango: "ଆମ୍ବ", mothbeans: "ମଠ", mungbean: "ମୁଗ", muskmelon: "ଖରଭୁଜ",
    orange: "କମଳା", papaya: "ଅମୃତଭଣ୍ଡା", pigeonpeas: "ହରଡ଼", pomegranate: "ଡାଳିମ୍ବ",
    rice: "ଧାନ (ଚାଉଳ)", watermelon: "ତରଭୁଜ"
  },
  ur: {
    apple: "سیب", banana: "کیلا", blackgram: "اڑد", chickpea: "چنا",
    coconut: "ناریل", coffee: "کافی", cotton: "کپاس", grapes: "انگور",
    jute: "پٹ سن", kidneybeans: "راجمہ", lentil: "مسور", maize: "مکئی",
    mango: "آم", mothbeans: "موٹھ", mungbean: "مونگ", muskmelon: "خربوزہ",
    orange: "سنترا", papaya: "پپیتا", pigeonpeas: "ارہر", pomegranate: "انار",
    rice: "دھان (چاول)", watermelon: "تربوز"
  }
};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function mergeMissing(target, source) {
  for (const [key, val] of Object.entries(source)) {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      if (!target[key] || typeof target[key] !== "object") {
        target[key] = {};
      }
      mergeMissing(target[key], val);
    } else if (target[key] === undefined) {
      target[key] = val;
    }
  }
  return target;
}

for (const [code, meta] of Object.entries(LOCALE_METADATA)) {
  const targetPath = path.join(LOCALES_DIR, `${code}.json`);
  let localeData;

  if (fs.existsSync(targetPath)) {
    const existing = JSON.parse(fs.readFileSync(targetPath, "utf-8"));
    localeData = mergeMissing(existing, en);
    console.log(`Updated locale keys: ${code} (${meta.name})`);
  } else {
    localeData = deepClone(en);
    localeData.common.appName = `${en.common.appName} (${meta.native})`;

    // Apply crop translations if available
    if (CROP_TRANSLATIONS[code]) {
      localeData.crops = { ...localeData.crops, ...CROP_TRANSLATIONS[code] };
    }
    console.log(`Generated locale: ${code} (${meta.name})`);
  }

  fs.writeFileSync(targetPath, JSON.stringify(localeData, null, 2), "utf-8");
}
