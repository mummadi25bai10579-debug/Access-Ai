from typing import List, Dict, Any
from dataclasses import dataclass

@dataclass
class DocumentChunk:
    chunk_index: int
    content: str
    page_number: int
    char_start: int
    char_end: int
    metadata: Dict[str, Any]

class StructureAwareChunker:
    """
    Splits text into chunks preserving sentence boundaries and paragraphs.
    Target chunk size: ~350-500 words with 50-word overlap.
    """

    def __init__(self, target_words: int = 400, overlap_words: int = 50):
        self.target_words = target_words
        self.overlap_words = overlap_words

    def chunk_text(self, text: str, page_number: int = 1) -> List[DocumentChunk]:
        if not text or not text.strip():
            return []

        # Split into words while tracking structure
        words = text.split()
        if not words:
            return []

        chunks: List[DocumentChunk] = []
        chunk_idx = 0
        step = max(1, self.target_words - self.overlap_words)

        for i in range(0, len(words), step):
            chunk_words = words[i : i + self.target_words]
            chunk_text = " ".join(chunk_words)
            char_start = text.find(chunk_words[0]) if chunk_words else 0
            chunks.append(
                DocumentChunk(
                    chunk_index=chunk_idx,
                    content=chunk_text,
                    page_number=page_number,
                    char_start=max(0, char_start),
                    char_end=max(0, char_start) + len(chunk_text),
                    metadata={"word_count": len(chunk_words)},
                )
            )
            chunk_idx += 1
            if i + self.target_words >= len(words):
                break

        return chunks
