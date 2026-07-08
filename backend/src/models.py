from pydantic import BaseModel
from typing import Optional, List, Dict

class AnalyzeRequest(BaseModel):
    title: str
    price: str
    materialsText: str
    url: str

class AnalysisResult(BaseModel):
    material_score: float
    durability_score: float
    value_score: float
    gsm_context: str
    materials_breakdown: Dict[str, int] # e.g. {"Cotton": 100}
    ai_summary: Optional[str] = None
