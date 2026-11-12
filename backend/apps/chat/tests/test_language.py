from apps.chat.language import (
    detect_message_language,
    detect_script_language,
    get_language_support_tier,
)


def test_detect_script_language_indic():
    assert detect_script_language("गेहूं की खेती के लिए तापमान") == "hi"
    assert detect_script_language("કપાસના પાક માટે પાણી") == "gu"
    assert detect_script_language("धान की फसल") == "hi"
    assert detect_script_language("") is None
    assert detect_script_language("Rice cultivation") is None
    assert detect_script_language("a") is None
    # Single stray Indic character below threshold of 2
    assert detect_script_language("hello क world") is None


def test_detect_message_language_transliteration_and_fallback():
    assert detect_message_language("गेहूं की खेती", default_ui_lang="en") == "hi"
    assert (
        detect_message_language("ghau mate ikhedut saahay", default_ui_lang="en")
        == "gu"
    )
    assert (
        detect_message_language("gehu ki kheti kaise kare", default_ui_lang="en")
        == "hi"
    )
    assert detect_message_language("What is PM KISAN?", default_ui_lang="gu") == "gu"
    assert detect_message_language("What is PM KISAN?", default_ui_lang="") == "en"


def test_get_language_support_tier():
    assert get_language_support_tier("en") == "ready"
    assert get_language_support_tier("hi") == "ready"
    assert get_language_support_tier("gu") == "ready"
    assert get_language_support_tier("ta") == "experimental"
    assert get_language_support_tier("ur") == "experimental"
