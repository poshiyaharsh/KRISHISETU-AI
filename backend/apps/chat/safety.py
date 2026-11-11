"""
Safety guardrails and system prompt formatting for Krishi Mitra.
Enforces out-of-scope refusal, prompt-injection defense, medical/legal guardrails,
and agricultural pesticide safety advisories citing Kisan Call Centre 1800-180-1551.
"""

from dataclasses import dataclass
from pathlib import Path
import re

PROMPTS_DIR = Path(__file__).resolve().parent / "prompts"
SYSTEM_PROMPT_PATH = PROMPTS_DIR / "system.md"

# Official verified contact
KISAN_CALL_CENTRE_TOLL_FREE = "1800-180-1551"


@dataclass
class SafetyCheckResult:
    """Outcome of safety evaluation on user query."""

    is_safe: bool
    category: str
    enforced_response: str | None = None
    requires_advisory: bool = False


# Prompt injection and jailbreak attack patterns (EN, HI, GU)
INJECTION_PATTERNS = [
    r"ignore\s+(?:all\s+)?(?:the\s+)?(?:previous|prior|above)\s+instructions",
    r"reveal\s+.*(?:prompt|instructions|passwords?|credentials?|keys?)",
    r"(?:what\s+is|show\s+me)\s+(?:your\s+)?(?:system\s+)?(?:prompt|instructions)",
    r"you\s+are\s+now\s+(?:dan|unrestricted|evil|jailbroken)",
    r"act\s+as\s+(?:an?\s+)?(?:unfiltered|unrestricted|jailbroken|evil)\s+ai",
    r"bypass\s+(?:all\s+)?(?:safety|content\s+filters)",
    r"developer\s+mode\s+output",
    r"system\s*:\s*override",
    r"\[system\s*instruction\]",
    r"<\s*system\s*>",
    # Hindi injection patterns
    r"(?:निर्देश\s*भूल|नियम\s*भूल|सिस्टम\s*प्रॉम्प्ट|प्रॉम्प्ट\s*दिखाओ|पासवर्ड\s*दिखाओ)",
    # Gujarati injection patterns
    r"(?:નિયમો\s*રદ|નિયમો\s*ભૂલી|પ્રોમ્પ્ટ\s*બતાવો|પાસવર્ડ\s*આપો)",
]

# Medical advice queries
MEDICAL_PATTERNS = [
    r"\b(?:fever|headache|stomach\s*ache|cough|chest\s*pain|vomiting|diarrhea)\b",
    r"\b(?:paracetamol|ibuprofen|antibiotic|insulin|aspirin|crocin)\b",
    r"\b(?:what\s+medicine\s+should\s+i\s+take|prescribe\s+me\s+a\s+tablet)\b",
    # Hindi medical
    r"(?:सिर\s*दर्द|पेट\s*दर्द|तेज\s*बुखार|बुखार\s*है|दवा\s*खाऊं|खांसी|उल्टी)",
    # Gujarati medical (use whitespace/boundaries to avoid matching બતાવો)
    r"(?:માથા(?:માં|નો)\s*(?:[^\s]+\s+)?દુખાવો|પેટમાં\s*દુખાવો|પેટનો\s*દુખાવો|ઝાડા|ઉધરસ|તાવ\s+છે|તાવ\s+અને|ગોળી\s*લેવી|દવા\s*લેવી)",
]

# Speculative investment & general coding / non-agri out-of-scope
OUT_OF_SCOPE_PATTERNS = [
    r"\b(?:bitcoin|ethereum|crypto|cryptocurrency|stock\s*market|stocks?|nifty|sensex|forex\s*trading)\b",
    r"\b(?:write\s+a\s+(?:python|javascript|react|c\+\+|java)\s+(?:code|script)\s+(?:for|to))\b",
    r"\b(?:who\s+(?:won|will\s+win)|election|presidential|prime\s*minister|political\s*party|vote\s+for)\b",
    r"\b(?:movie\s*review|lyrics\s*of|tell\s+me\s+a\s+joke\s+about\s+celebrity)\b",
    # Hindi out-of-scope
    r"(?:क्रिप्टो|क्रिप्टोकरेंसी|शेयर\s*बाजार|शेयर\s*मार्केट|म्यूचुअल\s*फंड|बिटकॉइन|चुनाव\s*कौन\s*जीतेगा|राजनीति)",
    # Gujarati out-of-scope
    r"(?:શેર\s*બજાર|શેરબજાર|શેરમાં\s*રોકાણ|ક્રિપ્ટો|બિટકોઇન|ચૂંટણી\s*કોણ\s*જીતશે|રાજકારણ)",
]

# Chemical dosage request indicators
DOSAGE_PATTERNS = [
    r"\b(?:how\s+(?:much|many)\s+(?:dose|ml|grams?|kg)\b|mix\s+how\s+much\b|\bhow\s+(?:much|many)\s+(?:ml|liters?|grams?)\b.*(?:mix|spray|water))",
    r"\b(?:dosage\s+per\s+(?:acre|hectare|liter|litre|pump))\b",
    r"\b(?:spray\s+dose|mix\s+how\s+much\s+medicine|mix\s+.*(?:weedicide|fungicide|pesticide))\b",
    r"(?:कितनी\s*मात्रा\s*में\s*दवा|कितने\s*एमएल|दवा\s*का\s*डोज|कीटनाशक\s*कितना\s*डालें|दवा\s*कितने\s*(?:लीटर|एमएल)|खरपतवार\s*नाशक)",
    r"(?:કેટલી\s*માત્રામાં\s*દવા|કેટલા\s*(?:એમએલ|મિલી)|પમ્પ?માં\s*કેટલી\s*દવા|પમ્પ?માં\s*કેટલા\s*મિલી|જંતુનાશક\s*માપ|કેટલું\s*પ્રમાણ|નીંદણનાશક)",
]


def load_system_prompt() -> str:
    """Load core system prompt markdown."""
    if SYSTEM_PROMPT_PATH.exists():
        return SYSTEM_PROMPT_PATH.read_text(encoding="utf-8")
    return (
        "You are Krishi Mitra, AI agricultural advisor for Indian farmers. "
        "Answer agricultural questions only using provided sources. "
        "Never prescribe chemical dosages. Consult KVK and Kisan Call Centre 1800-180-1551."
    )


def evaluate_query_safety(query: str, lang: str = "en") -> SafetyCheckResult:
    """
    Evaluate user query against safety guardrails before sending to LLM.
    Returns SafetyCheckResult with immediate refusal response if unsafe.
    """
    clean_query = query.strip()
    lower_query = clean_query.lower()

    # 1. Prompt Injection & Jailbreak Defense (Highest priority)
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, lower_query, re.IGNORECASE):
            enforced = _get_injection_refusal(lang)
            return SafetyCheckResult(
                is_safe=False,
                category="prompt_injection",
                enforced_response=enforced,
            )

    # 2. Medical Advice Defense
    for pattern in MEDICAL_PATTERNS:
        if re.search(pattern, lower_query, re.IGNORECASE):
            enforced = _get_medical_refusal(lang)
            return SafetyCheckResult(
                is_safe=False,
                category="medical",
                enforced_response=enforced,
            )

    # 3. Off-Topic / Speculative / Non-agri
    for pattern in OUT_OF_SCOPE_PATTERNS:
        if re.search(pattern, lower_query, re.IGNORECASE):
            enforced = _get_out_of_scope_refusal(lang)
            return SafetyCheckResult(
                is_safe=False,
                category="out_of_scope",
                enforced_response=enforced,
            )

    # 4. Check for chemical dosage requests (Safe to answer, but flag for mandatory safety advisory)
    requires_advisory = False
    for pattern in DOSAGE_PATTERNS:
        if re.search(pattern, lower_query, re.IGNORECASE):
            requires_advisory = True
            break

    # Also flag general pesticide/disease keywords for safety advisory
    pesticide_keywords = [
        "pesticide",
        "fungicide",
        "insecticide",
        "कीटनाशक",
        "रोग",
        "कीड़े",
        "જીવાત",
        "જંતુનાશક",
        "રોગ",
    ]
    if any(k in lower_query for k in pesticide_keywords):
        requires_advisory = True

    return SafetyCheckResult(
        is_safe=True,
        category="safe",
        requires_advisory=requires_advisory,
    )


def get_mandatory_pesticide_disclaimer(lang: str = "en") -> str:
    """Mandatory agricultural safety advisory citing Kisan Call Centre."""
    if lang == "hi":
        return (
            "\n\n**कृषि सुरक्षा सलाह:** रासायनिक कीटनाशकों का प्रयोग केवल अंतिम उपाय के रूप में करें। "
            "विशिष्ट दवा और सही मात्रा (डोज) के लिए हमेशा अपने स्थानीय कृषि विस्तार अधिकारी, नजदीकी कृषि विज्ञान केंद्र (KVK) "
            f"से संपर्क करें या राष्ट्रीय किसान कॉल सेंटर के टोल-फ्री नंबर **{KISAN_CALL_CENTRE_TOLL_FREE}** पर कॉल करें (प्रतिदिन सुबह 6 से रात 10 बजे)। "
            "हमेशा उत्पाद के डिब्बे पर छपे CIB&RC स्वीकृत लेबल को ध्यानपूर्वक पढ़ें।"
        )
    elif lang == "gu":
        return (
            "\n\n**કૃષિ સલામતી માર્ગદર્શિકા:** રાસાયણિક જંતુનાશકોનો ઉપયોગ માત્ર છેલ્લો વિકલ્પ તરીકે જ કરવો. "
            "ચોક્કસ દવા અને તેના માપ (ડોઝ) ની ખાતરી માટે તમારા સ્થાનિક ગ્રામ સેવક/કૃષિ અધિકારી, નજીકના કૃષિ વિજ્ઞાન કેન્દ્ર (KVK) "
            f"અથવા રાષ્ટ્રીય કિસાન કૉલ સેન્ટરના ટોલ-ફ્રી નંબર **{KISAN_CALL_CENTRE_TOLL_FREE}** પર સંપર્ક કરો (દરરોજ સવારે ૬ થી રાત્રે ૧૦ વાગ્યા સુધી). "
            "હંમેશા બોટલ કે પેકેટ પર દર્શાવેલ સરકારી માન્યતા પ્રાપ્ત લેબલ વાંચીને જ છંટકાવ કરવો."
        )
    return (
        "\n\n**Agricultural Safety Advisory:** Apply chemical pesticides only as a last resort under integrated pest management. "
        "For specific brand diagnosis and exact dosage, always consult your local Agriculture Extension Officer, nearest "
        f"Krishi Vigyan Kendra (KVK), or call the national Kisan Call Centre toll-free at **{KISAN_CALL_CENTRE_TOLL_FREE}** "
        "(available 6:00 AM to 10:00 PM daily in 22 languages). Always read the CIB&RC approved product container label."
    )


def sanitize_and_enforce_output(
    response_text: str,
    requires_advisory: bool = False,
    lang: str = "en",
) -> str:
    """
    Post-process generated LLM text to guarantee:
    1. System prompt leakage protection.
    2. Enforce Kisan Call Centre disclaimer if chemical advice was requested or discussed.
    """
    clean_text = response_text

    # Guard against prompt leaking
    clean_text = re.sub(
        r"(?:You are Krishi Mitra|=== CORE IDENTITY & ETHICS ===|=== BOUNDARIES & SCOPE RULES ===)",
        "",
        clean_text,
    ).strip()

    # If pesticide/chemical was discussed, ensure the disclaimer with 1800-180-1551 is present
    if requires_advisory or any(
        w in clean_text.lower()
        for w in ["pesticide", "fungicide", "insecticide", "कीटनाशक", "જંતુનાશક"]
    ):
        if KISAN_CALL_CENTRE_TOLL_FREE not in clean_text:
            clean_text += get_mandatory_pesticide_disclaimer(lang)

    return clean_text


def _get_injection_refusal(lang: str) -> str:
    if lang == "hi":
        return "मैं केवल कृषि, मौसम, सरकारी योजनाओं और फसल पोषण से जुड़े प्रश्नों में आपकी सहायता कर सकता हूँ।"
    if lang == "gu":
        return "હું માત્ર ખેતી, હવામાન, સરકારી યોજનાઓ અને પાક પોષણને લગતા પ્રશ્નોમાં જ તમારી મદદ કરી શકું છું."
    return "I am Krishi Mitra, your agricultural assistant. I can only assist with farming, weather, schemes, and crop guidance."


def _get_medical_refusal(lang: str) -> str:
    if lang == "hi":
        return (
            "मैं एक कृषि सहायक हूँ और मानवीय स्वास्थ्य या चिकित्सीय सलाह नहीं दे सकता। "
            "कृपया किसी योग्य चिकित्सक या प्राथमिक स्वास्थ्य केंद्र (PHC) से परामर्श लें।"
        )
    if lang == "gu":
        return (
            "હું ખેતી સહાયક છું અને માનવ સ્વાસ્થ્ય અથવા તબીબી સલાહ આપી શકતો નથી. "
            "કૃપા કરીને લાયકાત ધરાવતા ડૉક્ટર અથવા નજીકના પ્રાથમિક આરોગ્ય કેન્દ્ર (PHC) નો સંપર્ક કરો."
        )
    return (
        "I am an agricultural assistant and cannot provide human medical advice. "
        "Please consult a licensed doctor or your nearest health center."
    )


def _get_out_of_scope_refusal(lang: str) -> str:
    if lang == "hi":
        return (
            "मैं कृषि मित्र हूँ, आपका खेती सहायक। मैं केवल फसलों, मौसम, सरकारी योजनाओं और मिट्टी स्वास्थ्य जैसी "
            "कृषि संबंधी जानकारी दे सकता हूँ। मैं आपकी खेती में क्या सहायता कर सकता हूँ?"
        )
    if lang == "gu":
        return (
            "હું કૃષિ મિત્ર છું, તમારો ખેતી સહાયક. હું માત્ર પાક, હવામાન, સરકારી યોજનાઓ અને જમીન આરોગ્ય જેવી "
            "ખેતી વિષયક માહિતી આપી શકું છું. હું તમારી ખેતીમાં શું સહાય કરી શકું?"
        )
    return (
        "I am Krishi Mitra, your farming assistant. I can only assist with agricultural topics such as crops, "
        "weather, schemes, and soil health. How can I help with your farm today?"
    )
