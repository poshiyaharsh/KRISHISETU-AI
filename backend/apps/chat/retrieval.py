"""
Retrieval engine for Krishi Mitra chatbot.
Performs semantic similarity search over knowledge chunks with cross-lingual support.
"""

from typing import Any
from .knowledge.embedding import GeminiEmbeddingClient, get_embedding_client
from .knowledge.vector_store import DatabaseVectorStore

# Cross-lingual expansion map for Indic query grounding in offline / local mode
CROSS_LINGUAL_SYNONYMS = {
    # Crops
    "चावल": "rice paddy crop rainfall",
    "चोखा": "rice paddy crop rainfall",
    "ચોખા": "rice paddy crop rainfall temperature",
    "धान": "rice paddy crop rainfall temperature",
    "ડાંગર": "rice paddy crop rainfall temperature",
    "भात": "rice cooked nutrition carbohydrate calories",
    "ભાત": "rice cooked nutrition carbohydrate calories",
    "गेहूं": "wheat cereal rabi winter",
    "ઘઉં": "wheat cereal rabi winter",
    "कपास": "cotton fiber non-food",
    "કપાસ": "cotton fiber non-food",
    "मक्का": "maize corn nitrogen phosphorus npk",
    "मक्के": "maize corn nitrogen phosphorus npk",
    "મકાઈ": "maize corn nitrogen phosphorus npk",
    "चना": "chickpea gram raw nutrition protein",
    "ચણા": "chickpea gram raw nutrition protein",
    "मूंग": "mungbean moong cooked raw protein nutrition",
    "મગ": "mungbean moong cooked raw protein nutrition",
    "उड़द": "blackgram",
    "અડદ": "blackgram",
    "अरहर": "pigeonpeas tur",
    "તુવેર": "pigeonpeas tur",
    "मूंगफली": "groundnut peanut",
    "મગફળી": "groundnut peanut",
    "कॉफी": "coffee beverage brewed",
    "કોફી": "coffee beverage brewed",
    "जूट": "jute fiber non-food",
    "શણ": "jute fiber non-food",
    "केला": "banana fruit",
    "કેળા": "banana fruit",
    "आम": "mango fruit",
    "કેરી": "mango fruit",
    "सेब": "apple fruit",
    "સફરજન": "apple fruit",
    "संतरा": "orange fruit",
    "સંતરા": "orange fruit",
    "पपीता": "papaya fruit",
    "પપૈયું": "papaya fruit",
    "तरबूज": "watermelon",
    "તરબૂચ": "watermelon",
    "खरबूजा": "muskmelon",
    "ટેટી": "muskmelon",
    # Seasons & Agronomy
    "रवि": "rabi winter season wheat mustard sowing",
    "રવિ": "rabi winter season wheat mustard sowing",
    "खरीफ": "kharif monsoon season rice cotton sowing",
    "ખરીફ": "kharif monsoon season rice cotton sowing",
    # Schemes & Institutions
    "पीएम किसान": "pm-kisan pradhan mantri kisan samman nidhi installment 6000",
    "પીએમ કિસાન": "pm-kisan pradhan mantri kisan samman nidhi installment 6000",
    "किसान": "farmer kisan agriculture",
    "ખેડૂત": "farmer kisan agriculture",
    "सिंचाई": "irrigation drip sprinkler pmksy per drop more crop",
    "સિંચાઈ": "irrigation drip sprinkler pmksy per drop more crop",
    "ड्रिप": "drip micro-irrigation pmksy",
    "ડ્રિપ": "drip micro-irrigation pmksy",
    "फसल बीमा": "pmfby pradhan mantri fasal bima yojana premium rabi 1.5% kharif 2%",
    "પાક વીમો": "pmfby pradhan mantri fasal bima yojana premium rabi 1.5% kharif 2%",
    "માનધન": "mandhan pension scheme",
    "मानधन": "mandhan pension scheme",
    "क्रेडिट कार्ड": "kisan credit card kcc loan interest subvention",
    "ક્રેડિટ કાર્ડ": "kisan credit card kcc loan interest subvention",
    "कुसुम": "pm-kusum solar pump solar urja subsidy",
    "કુસુમ": "pm-kusum solar pump solar urja subsidy",
    "ट्रैक्टर": "tractor farm mechanization ikhedut smam",
    "ટ્રેક્ટર": "tractor farm mechanization ikhedut smam",
    "आई-खेड़ूत": "ikhedut gujarat portal",
    "આઇ-ખેડૂત": "ikhedut gujarat portal",
    # Agronomy, Soil & Protection
    "मिट्टी": "soil health card testing nitrogen phosphorus potassium sample",
    "જમીન": "soil health card testing nitrogen phosphorus potassium sample",
    "नमूना": "soil sample sampling depth v-shaped slice testing",
    "નમૂનો": "soil sample sampling depth v-shaped slice testing",
    "खाद": "fertilizer manure organic npk nutrient",
    "ખાતર": "fertilizer manure organic npk nutrient",
    "कीटनाशक": "pesticide integrated pest management safety kvk 1800-180-1551",
    "જંતુનાશક": "pesticide integrated pest management safety kvk 1800-180-1551",
    "दवा": "pesticide medicine chemicals protection",
    "રોગ": "disease pest pathogen infection",
    "रोग": "disease pest pathogen infection",
    "પોષણ": "nutrition protein energy calories",
    "पोषण": "nutrition protein energy calories",
    "પ્રોટીન": "protein nutrition grams",
    "प्रोटीन": "protein nutrition grams",
}

DEFAULT_MIN_SCORE = 0.05


def expand_query_multilingual(query: str) -> str:
    """
    Augment user query with semantic English keywords for cross-lingual vector retrieval.
    Preserves original query while bridging Indic terms to English knowledge chunks.
    """
    augmented = [query]

    for term, expansion in CROSS_LINGUAL_SYNONYMS.items():
        if term in query:
            augmented.append(expansion)

    return " ".join(augmented)


def retrieve(
    query: str,
    k: int = 5,
    min_score: float = DEFAULT_MIN_SCORE,
    source_type: str | None = None,
) -> list[dict[str, Any]]:
    """
    Retrieve top-k relevant knowledge chunks for a user query.
    Returns list of dicts with chunk metadata, relevance score, and source details.
    """
    if not query or not query.strip():
        return []

    expanded_query = expand_query_multilingual(query.strip())
    embedding_client = get_embedding_client()

    query_vector = None
    if isinstance(embedding_client, GeminiEmbeddingClient):
        try:
            query_vector = embedding_client.embed_text(expanded_query, is_query=True)
        except Exception:
            query_vector = None

    vector_store = DatabaseVectorStore()
    results = vector_store.search(
        query_embedding=query_vector,
        query_text=expanded_query,
        top_k=k,
        min_score=min_score,
        source_type=source_type,
    )

    return results
