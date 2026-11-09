"""
Agnostic Embedding Client Interface and Providers for Krishi Mitra.
Supports Google Gemini (text-embedding-004) and deterministic offline embeddings for CI and testing.
"""

from abc import ABC, abstractmethod
import hashlib
import logging
from django.conf import settings
import numpy as np
import requests

logger = logging.getLogger(__name__)


class BaseEmbeddingClient(ABC):
    """Abstract interface for embedding generation."""

    @abstractmethod
    def embed_text(self, text: str, is_query: bool = False) -> list[float]:
        """Embed a single string."""
        pass

    @abstractmethod
    def embed_batch(
        self, texts: list[str], is_query: bool = False
    ) -> list[list[float]]:
        """Embed a batch of strings."""
        pass


class GeminiEmbeddingClient(BaseEmbeddingClient):
    """
    Google Gemini text-embedding-004 client using REST API.
    Zero external SDK dependency; leverages existing requests library.
    """

    BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

    def __init__(self, api_key: str, model: str = "text-embedding-004"):
        self.api_key = api_key
        self.model = model

    def embed_text(self, text: str, is_query: bool = False) -> list[float]:
        url = f"{self.BASE_URL}/{self.model}:embedContent?key={self.api_key}"
        task_type = "RETRIEVAL_QUERY" if is_query else "RETRIEVAL_DOCUMENT"
        payload = {
            "content": {"parts": [{"text": text}]},
            "taskType": task_type,
        }
        resp = requests.post(url, json=payload, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        values = data.get("embedding", {}).get("values", [])
        return values

    def embed_batch(
        self, texts: list[str], is_query: bool = False
    ) -> list[list[float]]:
        if not texts:
            return []
        url = f"{self.BASE_URL}/{self.model}:batchEmbedContents?key={self.api_key}"
        task_type = "RETRIEVAL_QUERY" if is_query else "RETRIEVAL_DOCUMENT"

        # Gemini supports batches of up to 100 texts
        all_embeddings: list[list[float]] = []
        batch_size = 50

        for i in range(0, len(texts), batch_size):
            chunk_texts = texts[i : i + batch_size]
            payload = {
                "requests": [
                    {
                        "model": f"models/{self.model}",
                        "content": {"parts": [{"text": t}]},
                        "taskType": task_type,
                    }
                    for t in chunk_texts
                ]
            }
            resp = requests.post(url, json=payload, timeout=20)
            resp.raise_for_status()
            data = resp.json()
            for item in data.get("embeddings", []):
                all_embeddings.append(item.get("values", []))

        return all_embeddings


class MockEmbeddingClient(BaseEmbeddingClient):
    """
    Deterministic pseudo-semantic embedding generator for CI, local development, and tests.
    Encodes token n-grams and character hashes into a normalized 768-dimensional float vector.
    Enables deterministic cosine similarity testing without external API calls or secret keys.
    """

    def __init__(self, dim: int = 768):
        self.dim = dim

    def _hash_vector(self, text: str) -> list[float]:
        vec = np.zeros(self.dim, dtype=np.float32)
        words = text.lower().split()
        if not words:
            vec[0] = 1.0
            return vec.tolist()

        for word in words:
            # Hash tokens into multiple buckets for distribution
            h = int(hashlib.md5(word.encode("utf-8")).hexdigest(), 16)
            idx1 = h % self.dim
            idx2 = (h >> 16) % self.dim
            idx3 = (h >> 32) % self.dim
            vec[idx1] += 1.0
            vec[idx2] += 0.5
            vec[idx3] += 0.25

        # Also add full text md5 seed to break rare collisions
        full_h = int(hashlib.sha256(text.encode("utf-8")).hexdigest(), 16)
        for i in range(8):
            pos = (full_h >> (i * 8)) % self.dim
            vec[pos] += 0.1

        norm = float(np.linalg.norm(vec))
        if norm > 0:
            vec = vec / norm
        else:
            vec[0] = 1.0
        return vec.tolist()

    def embed_text(self, text: str, is_query: bool = False) -> list[float]:
        return self._hash_vector(text)

    def embed_batch(
        self, texts: list[str], is_query: bool = False
    ) -> list[list[float]]:
        return [self._hash_vector(t) for t in texts]


def get_embedding_client() -> BaseEmbeddingClient:
    """Factory to instantiate configured embedding client."""
    provider = getattr(settings, "EMBEDDING_PROVIDER", "gemini").lower()
    api_key = getattr(settings, "GEMINI_API_KEY", "").strip()

    if provider == "gemini" and api_key and not api_key.startswith("your-"):
        try:
            model = getattr(settings, "EMBEDDING_MODEL", "text-embedding-004")
            return GeminiEmbeddingClient(api_key=api_key, model=model)
        except Exception as e:
            logger.warning(
                "Failed to initialize GeminiEmbeddingClient (%s), falling back to MockEmbeddingClient",
                e,
            )

    return MockEmbeddingClient(dim=768)
