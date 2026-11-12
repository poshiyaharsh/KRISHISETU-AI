"""
Agnostic LLM Client interface and implementations for Krishi Mitra.
Supports Google Gemini (gemini-2.0-flash / gemini-1.5-flash) with streaming SSE
and deterministic offline mock client for CI, testing, and local development.
"""

from abc import ABC, abstractmethod
from collections.abc import Generator
import json
import logging
from typing import Any
from django.conf import settings
import requests
from .safety import (
    KISAN_CALL_CENTRE_TOLL_FREE,
    sanitize_and_enforce_output,
)

logger = logging.getLogger(__name__)


class BaseLLMClient(ABC):
    """Abstract LLM generation client."""

    @abstractmethod
    def stream_chat(
        self,
        system_prompt: str,
        messages: list[dict[str, str]],
        context_chunks: list[dict[str, Any]],
        lang: str = "en",
    ) -> Generator[str, None, None]:
        """Stream response tokens progressively."""
        pass

    @abstractmethod
    def generate_chat(
        self,
        system_prompt: str,
        messages: list[dict[str, str]],
        context_chunks: list[dict[str, Any]],
        lang: str = "en",
    ) -> str:
        """Generate full response synchronously."""
        pass


class GeminiLLMClient(BaseLLMClient):
    """
    Google Gemini chat client using REST streaming endpoint.
    Zero external heavy SDK dependency; handles Server-Sent Events natively.
    """

    BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

    def __init__(self, api_key: str, model: str = "gemini-2.5-flash"):
        self.api_key = api_key
        self.model = model

    def _build_payload(
        self,
        system_prompt: str,
        messages: list[dict[str, str]],
        context_chunks: list[dict[str, Any]],
    ) -> dict[str, Any]:
        # Build context header from retrieved knowledge chunks
        context_text = ""
        if context_chunks:
            sources_summary = []
            for i, c in enumerate(context_chunks, 1):
                sources_summary.append(
                    f"--- SOURCE CHUNK {i} [{c.get('source_type', 'data').upper()}: {c.get('title', '')}] ---\n"
                    f"{c.get('text', '')}\n"
                    f"URL: {c.get('url', '')}"
                )
            context_text = "\n\n[RETRIEVED KNOWLEDGE SOURCES]:\n" + "\n\n".join(
                sources_summary
            )

        # Structure messages for Gemini API
        contents = []
        for msg in messages:
            role = "user" if msg.get("role") == "user" else "model"
            contents.append({"role": role, "parts": [{"text": msg.get("content", "")}]})

        # Inject context into last user message
        if contents and contents[-1]["role"] == "user" and context_text:
            contents[-1]["parts"][0]["text"] += f"\n\n{context_text}"

        return {
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": contents,
            "generationConfig": {
                "temperature": 0.2,
                "topP": 0.8,
                "maxOutputTokens": 800,
            },
        }

    def stream_chat(
        self,
        system_prompt: str,
        messages: list[dict[str, str]],
        context_chunks: list[dict[str, Any]],
        lang: str = "en",
    ) -> Generator[str, None, None]:
        url = f"{self.BASE_URL}/{self.model}:streamGenerateContent?alt=sse&key={self.api_key}"
        payload = self._build_payload(system_prompt, messages, context_chunks)

        try:
            with requests.post(url, json=payload, stream=True, timeout=20) as resp:
                resp.raise_for_status()
                for line in resp.iter_lines(decode_unicode=True):
                    if not line or not line.startswith("data: "):
                        continue
                    data_str = line[6:].strip()
                    try:
                        data_json = json.loads(data_str)
                        candidates = data_json.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            for part in parts:
                                text_piece = part.get("text", "")
                                if text_piece:
                                    yield text_piece
                    except Exception as e:
                        logger.debug("Error parsing Gemini streaming chunk: %s", e)
        except requests.RequestException as exc:
            status_code = getattr(getattr(exc, "response", None), "status_code", None)
            logger.warning(
                "Gemini stream_chat failed (model=%s status=%s err=%s); falling back to grounded mock",
                self.model,
                status_code,
                type(exc).__name__,
            )
            yield from MockLLMClient().stream_chat(
                system_prompt=system_prompt,
                messages=messages,
                context_chunks=context_chunks,
                lang=lang,
            )

    def generate_chat(
        self,
        system_prompt: str,
        messages: list[dict[str, str]],
        context_chunks: list[dict[str, Any]],
        lang: str = "en",
    ) -> str:
        url = f"{self.BASE_URL}/{self.model}:generateContent?key={self.api_key}"
        payload = self._build_payload(system_prompt, messages, context_chunks)
        try:
            resp = requests.post(url, json=payload, timeout=20)
            resp.raise_for_status()
            data = resp.json()
        except (requests.RequestException, ValueError) as exc:
            status_code = getattr(getattr(exc, "response", None), "status_code", None)
            logger.warning(
                "Gemini generate_chat failed (model=%s status=%s err=%s); falling back to grounded mock",
                self.model,
                status_code,
                type(exc).__name__,
            )
            return MockLLMClient().generate_chat(
                system_prompt=system_prompt,
                messages=messages,
                context_chunks=context_chunks,
                lang=lang,
            )

        candidates = data.get("candidates", [])
        if not candidates:
            return ""
        parts = candidates[0].get("content", {}).get("parts", [])
        full_text = "".join(p.get("text", "") for p in parts)
        return sanitize_and_enforce_output(
            full_text, requires_advisory=False, lang=lang
        )


class MockLLMClient(BaseLLMClient):
    """
    Deterministic simulated LLM generation client for CI, tests, and offline development.
    Extracts answers directly from retrieved knowledge chunks with language-specific formatting.
    """

    def _compose_grounded_answer(
        self,
        messages: list[dict[str, str]],
        context_chunks: list[dict[str, Any]],
        lang: str,
    ) -> str:
        if not context_chunks:
            if lang == "hi":
                return (
                    "मुझे इस प्रश्न के संबंध में कृषिसेतु के पास सत्यापित डेटा नहीं मिला। "
                    f"कृपया स्थानीय कृषि विस्तार अधिकारी या राष्ट्रीय किसान कॉल सेंटर ({KISAN_CALL_CENTRE_TOLL_FREE}) से संपर्क करें।"
                )
            elif lang == "gu":
                return (
                    "આ પ્રશ્ન અંગે કૃષિસેતુ પાસે કોઈ ચકાસાયેલ માહિતી મળી નથી. "
                    f"કૃપા કરીને સ્થાનિક ગ્રામ સેવક અથવા રાષ્ટ્રીય કિસાન કૉલ સેન્ટર ({KISAN_CALL_CENTRE_TOLL_FREE}) નો સંપર્ક કરો."
                )
            return (
                "I do not have verified records on this specific detail in KrishiSetu. "
                f"Please consult your local Agriculture Extension Officer or call the Kisan Call Centre at {KISAN_CALL_CENTRE_TOLL_FREE}."
            )

        # Ground response in the top matching chunk
        top_chunk = context_chunks[0]
        title = top_chunk.get("title", "")
        text = top_chunk.get("text", "")
        url = top_chunk.get("url", "")

        lines = [line.strip() for line in text.split("\n") if line.strip()]
        summary = lines[0] if lines else text[:200]
        key_facts = lines[1:4] if len(lines) > 1 else []

        if lang == "hi":
            res = f"**{title}**\n\n{summary}\n"
            if key_facts:
                res += "\n" + "\n".join(f"- {f}" for f in key_facts)
            if url:
                res += f"\n\nआधिकारिक स्रोत: {url}"
            return res
        elif lang == "gu":
            res = f"**{title}**\n\n{summary}\n"
            if key_facts:
                res += "\n" + "\n".join(f"- {f}" for f in key_facts)
            if url:
                res += f"\n\nસત્તાવાર સ્ત્રોત: {url}"
            return res

        res = f"**{title}**\n\n{summary}\n"
        if key_facts:
            res += "\n" + "\n".join(f"- {f}" for f in key_facts)
        if url:
            res += f"\n\nSource: {url}"
        return res

    def stream_chat(
        self,
        system_prompt: str,
        messages: list[dict[str, str]],
        context_chunks: list[dict[str, Any]],
        lang: str = "en",
    ) -> Generator[str, None, None]:
        full_text = self._compose_grounded_answer(messages, context_chunks, lang)
        # Yield in realistic token-sized words
        words = full_text.split(" ")
        for i, w in enumerate(words):
            prefix = "" if i == 0 else " "
            yield prefix + w

    def generate_chat(
        self,
        system_prompt: str,
        messages: list[dict[str, str]],
        context_chunks: list[dict[str, Any]],
        lang: str = "en",
    ) -> str:
        return self._compose_grounded_answer(messages, context_chunks, lang)


def get_llm_client() -> BaseLLMClient:
    """Factory to instantiate configured LLM client."""
    provider = getattr(settings, "LLM_PROVIDER", "gemini").lower()
    api_key = getattr(settings, "GEMINI_API_KEY", "").strip()

    if provider == "gemini" and api_key and not api_key.startswith("your-"):
        try:
            model = getattr(settings, "LLM_MODEL", "gemini-2.5-flash")
            return GeminiLLMClient(api_key=api_key, model=model)
        except Exception as e:
            logger.warning(
                "Failed to initialize GeminiLLMClient: %s, falling back to mock", e
            )

    return MockLLMClient()
