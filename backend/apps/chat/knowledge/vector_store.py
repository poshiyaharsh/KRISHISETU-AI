"""
Vector Store Interface and In-Database Cosine Similarity Implementation.
Decoupled behind BaseVectorStore so pgvector can replace it without touching business logic.
Supports dense vector embeddings (Gemini) and TF-IDF offline fallback (scikit-learn).
"""

from abc import ABC, abstractmethod
from typing import Any
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from apps.chat.models import KnowledgeChunk


class BaseVectorStore(ABC):
    """Abstract vector store interface."""

    @abstractmethod
    def search(
        self,
        query_embedding: list[float] | None = None,
        query_text: str = "",
        top_k: int = 5,
        min_score: float = 0.0,
        source_type: str | None = None,
    ) -> list[dict[str, Any]]:
        """Search vector store for top-k most similar chunks."""
        pass

    @abstractmethod
    def count(self) -> int:
        """Return total number of embedded chunks."""
        pass


class DatabaseVectorStore(BaseVectorStore):
    """
    In-memory matrix cosine similarity over DB-stored embeddings.
    Zero vector database infrastructure needed for small/medium knowledge bases (~1,000 to 10,000 chunks).
    """

    def count(self) -> int:
        return KnowledgeChunk.objects.count()

    def search(
        self,
        query_embedding: list[float] | None = None,
        query_text: str = "",
        top_k: int = 5,
        min_score: float = 0.0,
        source_type: str | None = None,
    ) -> list[dict[str, Any]]:
        qs = KnowledgeChunk.objects.all()
        if source_type:
            qs = qs.filter(source_type=source_type)

        chunks = list(qs)
        if not chunks:
            return []

        # If dense vector embedding is provided and valid
        if query_embedding and any(c.embedding for c in chunks):
            # Check if dense embeddings are present
            first_emb = next((c.embedding for c in chunks if c.embedding), None)
            if first_emb and len(first_emb) == len(query_embedding):
                q_vec = np.array(query_embedding, dtype=np.float32)
                q_norm = np.linalg.norm(q_vec)
                if q_norm > 0:
                    q_vec = q_vec / q_norm
                    valid_chunks = [
                        c
                        for c in chunks
                        if c.embedding and len(c.embedding) == len(query_embedding)
                    ]
                    matrix = np.array(
                        [c.embedding for c in valid_chunks], dtype=np.float32
                    )
                    norms = np.linalg.norm(matrix, axis=1, keepdims=True)
                    norms[norms == 0] = 1e-10
                    matrix_normalized = matrix / norms
                    scores = np.dot(matrix_normalized, q_vec)

                    results = []
                    for idx, score in enumerate(scores):
                        f_score = float(score)
                        if f_score >= min_score:
                            c = valid_chunks[idx]
                            results.append(
                                {
                                    "chunk_id": c.id,
                                    "source_id": c.source_id,
                                    "source_type": c.source_type,
                                    "title": c.title,
                                    "url": c.url,
                                    "language": c.language,
                                    "text": c.text,
                                    "score": round(f_score, 4),
                                }
                            )
                    results.sort(key=lambda x: x["score"], reverse=True)
                    if results:
                        return results[:top_k]

        # TF-IDF Cosine Similarity Fallback for test / offline / lexical search
        if query_text:
            texts = [c.text for c in chunks]
            vectorizer = TfidfVectorizer(
                ngram_range=(1, 2),
                stop_words="english",
                sublinear_tf=True,
            )
            try:
                chunk_matrix = vectorizer.fit_transform(texts)
                q_vec = vectorizer.transform([query_text])
                scores = (chunk_matrix * q_vec.T).toarray().flatten()

                results = []
                for idx, score in enumerate(scores):
                    f_score = float(score)
                    if f_score >= min_score and f_score > 0:
                        c = chunks[idx]
                        results.append(
                            {
                                "chunk_id": c.id,
                                "source_id": c.source_id,
                                "source_type": c.source_type,
                                "title": c.title,
                                "url": c.url,
                                "language": c.language,
                                "text": c.text,
                                "score": round(f_score, 4),
                            }
                        )
                results.sort(key=lambda x: x["score"], reverse=True)
                return results[:top_k]
            except Exception:
                pass

        return []
