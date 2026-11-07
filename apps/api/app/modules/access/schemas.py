from typing import List, Optional
from pydantic import BaseModel, Field

class AskQuestionRequest(BaseModel):
    document_id: str
    question: str
    language: str = "en"
    include_citations: bool = True

class CitationModel(BaseModel):
    document_id: str
    page_number: int = 1
    chunk_index: int = 0
    quoted_text: str

class AskQuestionResponse(BaseModel):
    answer: str
    language: str
    confidence: str
    citations: List[CitationModel] = Field(default_factory=list)
    evidence_tier: str = "document_grounded"

class SimplifyTextRequest(BaseModel):
    text: str
    language: str = "en"

class SimplifyTextResponse(BaseModel):
    simplified_text: str
    language: str

class TranslateTextRequest(BaseModel):
    text: str
    target_language: str
    source_language: Optional[str] = None

class TranslateTextResponse(BaseModel):
    translated_text: str
    target_language: str
