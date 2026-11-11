"""
Language and script detection module for Krishi Mitra.
Identifies Indic script families and resolves user message language.
"""

import re
from typing import Literal

TIER_1_LANGUAGES = {"en", "hi", "gu"}

# Unicode script ranges for Indian Eighth Schedule languages
SCRIPT_RANGES = [
    (
        "hi",
        re.compile(r"[\u0900-\u097F]"),
    ),  # Devanagari (Hindi, Marathi, Sanskrit, Maithili, etc.)
    ("gu", re.compile(r"[\u0A80-\u0AFF]")),  # Gujarati
    ("bn", re.compile(r"[\u0980-\u09FF]")),  # Bengali / Assamese
    ("pa", re.compile(r"[\u0A00-\u0A7F]")),  # Gurmukhi (Punjabi)
    ("ta", re.compile(r"[\u0B80-\u0BFF]")),  # Tamil
    ("te", re.compile(r"[\u0C00-\u0C7F]")),  # Telugu
    ("kn", re.compile(r"[\u0C80-\u0CFF]")),  # Kannada
    ("ml", re.compile(r"[\u0D00-\u0D7F]")),  # Malayalam
    ("or", re.compile(r"[\u0B00-\u0B7F]")),  # Odia
    ("ur", re.compile(r"[\u0600-\u06FF]")),  # Perso-Arabic (Urdu, Kashmiri, Sindhi)
]

# Common Latin-script Indic markers (Hinglish / Gujlish)
HINGLISH_WORDS = {
    "kisan",
    "kisaan",
    "kheti",
    "fasal",
    "paani",
    "yojana",
    "kitna",
    "kaise",
    "bima",
    "mandhan",
    "khad",
    "mitti",
    "beej",
    "subsidy",
    "sampark",
    "sarkari",
    "chawal",
    "gehu",
}
GUJLISH_WORDS = {
    "khedut",
    "kheti",
    "pak",
    "paani",
    "jameen",
    "khatar",
    "biaran",
    "ketli",
    "kem",
    "chokha",
    "ghau",
    "saahay",
    "ikhedut",
    "ikhedutportal",
}


def detect_script_language(text: str) -> str | None:
    """
    Detect language based on non-Latin Unicode Indic script character counts.
    Returns language code (e.g. 'hi', 'gu', 'bn', 'ta', 'te') or None if mostly Latin/ASCII.
    """
    if not text:
        return None

    counts: dict[str, int] = {}
    for lang, pattern in SCRIPT_RANGES:
        matches = len(pattern.findall(text))
        if matches > 0:
            counts[lang] = matches

    if not counts:
        return None

    # Pick dominant script
    best_lang, best_count = max(counts.items(), key=lambda item: item[1])
    # Minimum threshold to avoid stray single characters
    if best_count >= 2:
        return best_lang

    return None


def detect_message_language(text: str, default_ui_lang: str = "en") -> str:
    """
    Resolve final response language for user query.
    1. Checks for native Indic script.
    2. Checks for Latin-transliterated Indic words (Hinglish / Gujlish).
    3. Falls back to default_ui_lang.
    """
    script_lang = detect_script_language(text)
    if script_lang:
        return script_lang

    lower_words = set(re.findall(r"\b[a-zA-Z]+\b", text.lower()))

    # Check for Gujarati Latin-script keywords
    if len(lower_words.intersection(GUJLISH_WORDS)) >= 2:
        return "gu"

    # Check for Hindi Latin-script keywords
    if len(lower_words.intersection(HINGLISH_WORDS)) >= 2:
        return "hi"

    # If user provided a valid UI language, honour it
    if default_ui_lang:
        return default_ui_lang

    return "en"


def get_language_support_tier(lang: str) -> Literal["ready", "experimental"]:
    """Returns quality tier for language: 'ready' for Tier 1 (en, hi, gu), 'experimental' for others."""
    return "ready" if lang in TIER_1_LANGUAGES else "experimental"
