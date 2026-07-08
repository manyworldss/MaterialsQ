import re
from typing import Dict, Tuple

def parse_materials(text: str) -> Dict[str, int]:
    """
    Naively parses material percentages from a text block.
    Example text: 'Body: 100% Cotton/ Rib: 78% Cotton, 22% Polyester'
    """
    materials = {}
    # Simple regex to find percentage and the word following it
    pattern = r'(\d{1,3})\s*%\s*([a-zA-Z]+)'
    matches = re.findall(pattern, text, re.IGNORECASE)
    
    for match in matches:
        pct = int(match[0])
        mat = match[1].capitalize()
        # accumulate if seen multiple times (e.g., body vs rib) - simplistic for MVP
        if mat in materials:
            materials[mat] += pct
        else:
            materials[mat] = pct
    
    # Normalize if it exceeds 100% due to multiple parts (body, rib, lining)
    total = sum(materials.values())
    if total > 100:
        # Just normalize relative to 100 for simplicity in the beta
        materials = {k: int((v / total) * 100) for k, v in materials.items()}

    return materials

def calculate_scores(title: str, price_str: str, text: str, materials: Dict[str, int]) -> Tuple[float, float, float, str]:
    material_score = 5.0
    durability_score = 3.0
    gsm_context = "Standard Weight - Versatile for year-round wear."
    
    # Parse Price
    price = 25.0
    try:
        clean_price = re.sub(r'[^\d.]', '', price_str)
        if clean_price:
            price = float(clean_price)
    except Exception:
        pass
    
    text_lower = text.lower()
    title_lower = title.lower()
    is_activewear = "dry-ex" in title_lower or "airism" in title_lower or "active" in text_lower
    
    # Material Score Logic
    if "supima" in text_lower or "organic" in text_lower:
        material_score = 9.0
    elif materials.get("Cotton", 0) >= 95:
        material_score = 7.5
    elif materials.get("Cotton", 0) >= 80 and materials.get("Polyester", 0) <= 20:
        material_score = 6.0
    elif is_activewear and materials.get("Polyester", 0) > 50:
        material_score = 7.5 # Contextually good for activewear
    elif materials.get("Polyester", 0) > 50:
        material_score = 4.0 # Generic high synthetic
    
    # Durability Logic
    if "heavyweight" in text_lower or "u crew" in title_lower:
        durability_score = 5.0
        gsm_context = "Heavyweight - Highly durable, holds its shape well, better for cooler weather."
    elif "lightweight" in text_lower or "sheer" in text_lower:
        durability_score = 2.0
        gsm_context = "Lightweight - Ideal for summer or layering, but may require delicate care."
    elif is_activewear:
        durability_score = 4.0
        gsm_context = "Performance Weight - Designed for moisture wicking and high movement."

    # Value Score
    # Baseline for a decent Uniqlo tee is ~$20. 
    baseline_price = 20.0
    quality_factor = (material_score * 0.6) + (durability_score * 0.4) # Max ~8.6 for supima heavyweight
    # Value is ratio of quality to price modifier
    price_modifier = max(price / baseline_price, 0.5) 
    
    value_score = quality_factor / price_modifier
    
    # Cap at 10, round to 1 decimal
    value_score = min(round(value_score, 1), 10.0)
    material_score = round(material_score, 1)
    durability_score = round(durability_score, 1)

    return material_score, durability_score, value_score, gsm_context

