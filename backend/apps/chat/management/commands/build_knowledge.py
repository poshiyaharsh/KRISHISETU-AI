"""
Management command to build, chunk, embed, and index the Krishi Mitra knowledge base.
Idempotent: Only new or modified chunks are re-embedded.
"""

from django.core.management.base import BaseCommand
from apps.chat.knowledge.builder import build_all_knowledge_chunks
from apps.chat.knowledge.embedding import get_embedding_client
from apps.chat.models import KnowledgeChunk


class Command(BaseCommand):
    help = "Build and embed agricultural knowledge chunks from schemes, crops, nutrition, and guides."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Force re-embedding of all chunks even if content_hash has not changed.",
        )

    def handle(self, *args, **options):
        force = options.get("force", False)
        self.stdout.write("Starting Krishi Mitra knowledge base extraction...")

        raw_chunks = build_all_knowledge_chunks()
        embedding_client = get_embedding_client()

        created_count = 0
        updated_count = 0
        unchanged_count = 0

        # Identify chunks requiring embedding
        chunks_to_embed = []
        for c in raw_chunks:
            source_id = c["source_id"]
            chunk_index = c["chunk_index"]

            existing = KnowledgeChunk.objects.filter(
                source_id=source_id,
                chunk_index=chunk_index,
            ).first()

            if (
                not force
                and existing
                and existing.content_hash == c["content_hash"]
                and existing.embedding
            ):
                unchanged_count += 1
            else:
                chunks_to_embed.append((c, existing))

        if chunks_to_embed:
            self.stdout.write(
                f"Generating embeddings for {len(chunks_to_embed)} new/updated chunks..."
            )
            texts = [c["text"] for c, _ in chunks_to_embed]
            embeddings = embedding_client.embed_batch(texts, is_query=False)

            for (c, existing), emb in zip(chunks_to_embed, embeddings):
                if existing:
                    existing.title = c["title"]
                    existing.url = c["url"]
                    existing.source_type = c["source_type"]
                    existing.language = c["language"]
                    existing.text = c["text"]
                    existing.content_hash = c["content_hash"]
                    existing.embedding = emb
                    existing.save()
                    updated_count += 1
                else:
                    KnowledgeChunk.objects.create(
                        source_id=c["source_id"],
                        chunk_index=c["chunk_index"],
                        source_type=c["source_type"],
                        title=c["title"],
                        url=c["url"],
                        language=c["language"],
                        text=c["text"],
                        content_hash=c["content_hash"],
                        embedding=emb,
                    )
                    created_count += 1

        # Delete any orphaned chunks no longer present in source data
        current_source_ids = {c["source_id"] for c in raw_chunks}
        deleted_count, _ = KnowledgeChunk.objects.exclude(
            source_id__in=current_source_ids
        ).delete()

        # Group and report counts by source type
        counts_by_type = {}
        for source_type, label in KnowledgeChunk.SOURCE_TYPES:
            cnt = KnowledgeChunk.objects.filter(source_type=source_type).count()
            counts_by_type[source_type] = cnt

        total_chunks = KnowledgeChunk.objects.count()

        self.stdout.write(
            self.style.SUCCESS("Krishi Mitra Knowledge Base Build Complete!")
        )
        self.stdout.write(f"  - Schemes: {counts_by_type.get('scheme', 0)} chunks")
        self.stdout.write(f"  - Crops: {counts_by_type.get('crop', 0)} chunks")
        self.stdout.write(f"  - Nutrition: {counts_by_type.get('nutrition', 0)} chunks")
        self.stdout.write(
            f"  - Curated Guides: {counts_by_type.get('guide', 0)} chunks"
        )
        self.stdout.write(f"  - Total indexed chunks: {total_chunks}")
        self.stdout.write(
            f"  - Operations: Created={created_count}, Updated={updated_count}, "
            f"Unchanged={unchanged_count}, Pruned={deleted_count}"
        )
