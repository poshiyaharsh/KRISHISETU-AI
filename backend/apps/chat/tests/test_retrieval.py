"""
Retrieval accuracy evaluation for Krishi Mitra knowledge base (T9.3).
Tests 15 agricultural questions across English, Hindi, and Gujarati.
Verifies that expected source appears within Top-3 retrieved chunks.
"""

import pytest
from django.core.management import call_command
from apps.chat.models import KnowledgeChunk
from apps.chat.retrieval import retrieve


@pytest.fixture(autouse=True)
def setup_knowledge_base(db):
    """Ensure seeds and knowledge chunks are loaded for retrieval tests."""
    call_command("seed_crops")
    call_command("load_schemes")
    call_command("load_nutrition")
    call_command("build_knowledge")


@pytest.mark.django_db
def test_retrieval_idempotency_check():
    """Verify knowledge chunk counts across all 4 domains."""
    total = KnowledgeChunk.objects.count()
    assert total == 70
    assert KnowledgeChunk.objects.filter(source_type="scheme").count() == 12
    assert KnowledgeChunk.objects.filter(source_type="crop").count() == 22
    assert KnowledgeChunk.objects.filter(source_type="nutrition").count() == 31
    assert KnowledgeChunk.objects.filter(source_type="guide").count() == 5


@pytest.mark.django_db
def test_15_multilingual_benchmark_retrieval():
    """
    Evaluate Top-3 retrieval rate across 15 agricultural questions (5 EN, 5 HI, 5 GU).
    Measures and asserts top-3 hit rate >= 80%.
    """
    test_suite = [
        # English
        {
            "query": "What are the eligibility rules and financial installments for PM-KISAN?",
            "expected_sources": ["scheme:pradhan-mantri-kisan-samman-nidhi"],
            "lang": "en",
        },
        {
            "query": "What is the optimal rainfall and temperature range for growing rice?",
            "expected_sources": ["crop:rice"],
            "lang": "en",
        },
        {
            "query": "How much protein and energy does cooked chickpeas have per 100g?",
            "expected_sources": ["nutrition:chickpea:cooked"],
            "lang": "en",
        },
        {
            "query": "How do I take a soil sample for a Soil Health Card testing?",
            "expected_sources": [
                "guide:soil-health-card",
                "scheme:soil-health-card-scheme",
            ],
            "lang": "en",
        },
        {
            "query": "What subsidy is available for solar water pumps under PM-KUSUM?",
            "expected_sources": ["scheme:pm-kusum"],
            "lang": "en",
        },
        # Hindi
        {
            "query": "पीएम किसान योजना में सालाना कितनी राशि मिलती है?",
            "expected_sources": ["scheme:pradhan-mantri-kisan-samman-nidhi"],
            "lang": "hi",
        },
        {
            "query": "मक्का (maize) के लिए नाइट्रोजन और फास्फोरस की क्या जरूरत होती है?",
            "expected_sources": ["crop:maize"],
            "lang": "hi",
        },
        {
            "query": "पकी हुई मूंग दाल में प्रोटीन कितना होता है?",
            "expected_sources": ["crop:mungbean", "nutrition:mungbean:cooked"],
            "lang": "hi",
        },
        {
            "query": "सूक्ष्म सिंचाई और ड्रिप सिस्टम के लिए क्या योजना है?",
            "expected_sources": [
                "scheme:pradhan-mantri-krishi-sinchayee-yojana-per-drop-more-crop",
                "guide:micro-irrigation-pmksy",
            ],
            "lang": "hi",
        },
        {
            "query": "फसलों में कीटनाशक के सुरक्षित उपयोग के नियम क्या हैं?",
            "expected_sources": ["guide:integrated-pest-management-safety"],
            "lang": "hi",
        },
        # Gujarati
        {
            "query": "સૌર ઊર્જા અને સોલાર પંપ માટે કુસુમ યોજનામાં શું સહાય મળે છે?",
            "expected_sources": ["scheme:pm-kusum"],
            "lang": "gu",
        },
        {
            "query": "ડાંગર ચોખા ના પાક માટે કેટલો વરસાદ અનુકૂળ રહે છે?",
            "expected_sources": ["crop:rice", "guide:crop-seasons-india"],
            "lang": "gu",
        },
        {
            "query": "રાંધેલા ભાતમાં કેલરી અને કાર્બોહાઇડ્રેટ કેટલા હોય છે?",
            "expected_sources": ["nutrition:rice:cooked", "crop:rice"],
            "lang": "gu",
        },
        {
            "query": "જમીન ચકાસણી અને સોઇલ હેલ્થ કાર્ડના શું ફાયદા છે?",
            "expected_sources": [
                "guide:soil-health-card",
                "scheme:soil-health-card-scheme",
            ],
            "lang": "gu",
        },
        {
            "query": "કપાસ ના પાક માટે પોષણ કેમ લાગુ નથી પડતું?",
            "expected_sources": ["nutrition:cotton:non_food", "crop:cotton"],
            "lang": "gu",
        },
    ]

    hits = 0
    total = len(test_suite)

    for item in test_suite:
        results = retrieve(item["query"], k=3, min_score=0.0)
        retrieved_sources = [r["source_id"] for r in results]
        is_hit = any(src in retrieved_sources for src in item["expected_sources"])
        if is_hit:
            hits += 1

    hit_rate = (hits / total) * 100.0
    print(
        f"\nMeasured Multilingual Retrieval Top-3 Hit Rate: {hits}/{total} ({hit_rate:.1f}%)"
    )
    assert hit_rate >= 80.0, f"Retrieval top-3 hit rate too low: {hit_rate:.1f}%"
