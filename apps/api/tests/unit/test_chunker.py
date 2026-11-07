import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.intelligence.rag.chunker import StructureAwareChunker

class TestStructureAwareChunker(unittest.TestCase):
    def setUp(self):
        self.chunker = StructureAwareChunker(target_words=20, overlap_words=5)

    def test_chunking_with_overlap(self):
        text = "Paragraph one with several words explaining the government guidelines for application. " * 3
        chunks = self.chunker.chunk_text(text, page_number=2)
        self.assertGreater(len(chunks), 1)
        self.assertEqual(chunks[0].page_number, 2)
        self.assertEqual(chunks[0].chunk_index, 0)
        self.assertEqual(chunks[1].chunk_index, 1)

    def test_empty_text_handling(self):
        chunks = self.chunker.chunk_text("")
        self.assertEqual(len(chunks), 0)

if __name__ == "__main__":
    unittest.main()
