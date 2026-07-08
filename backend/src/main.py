from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .models import AnalyzeRequest, AnalysisResult
from .scoring import parse_materials, calculate_scores

app = FastAPI(title="MaterialIQ API")

# Allow extension to call API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to chrome-extension://...
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "ok"}

@app.post("/analyze", response_model=AnalysisResult)
def analyze_product(req: AnalyzeRequest):
    try:
        materials_breakdown = parse_materials(req.materialsText)
        
        mat_score, dur_score, val_score, gsm = calculate_scores(
            req.title, req.price, req.materialsText, materials_breakdown
        )
        
        # Placeholder for AI summary (Phase 5)
        ai_summary = "Based on the material composition and price, this appears to be a standard everyday t-shirt. The cotton blend provides breathability."
        
        return AnalysisResult(
            material_score=mat_score,
            durability_score=dur_score,
            value_score=val_score,
            gsm_context=gsm,
            materials_breakdown=materials_breakdown,
            ai_summary=ai_summary
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
