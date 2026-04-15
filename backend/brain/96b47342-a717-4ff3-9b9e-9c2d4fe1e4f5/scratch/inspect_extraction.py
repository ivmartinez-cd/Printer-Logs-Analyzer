import sys
from pathlib import Path
from backend.application.services.cpmd_parser import extract_error_blocks
from backend.application.services.cpmd_structured_extractor import extract_all

def inspect_extraction(pdf_path: str):
    print(f"Reading PDF: {pdf_path}")
    pdf_bytes = Path(pdf_path).read_bytes()
    
    print("Extracting blocks...")
    blocks = extract_error_blocks(pdf_bytes)
    print(f"Found {len(blocks)} blocks.")
    
    print("Parsing blocks with Regex...")
    results = extract_all(blocks)
    
    # Sort by confidence to show different types
    results.sort(key=lambda x: x.confidence_score, reverse=True)
    
    print("\n" + "="*80)
    print("MUESTRA DE DATOS EXTRAÍDOS (REGEX)")
    print("="*80)
    
    # Show 5 high-confidence blocks
    for r in results[:5]:
        print(f"\nCÓDIGO: {r.block.code}")
        print(f"TÍTULO: {r.block.raw_title}")
        print(f"CONFIDENCIA: {r.confidence_score:.3f}")
        print(f"CAUSA: {r.solution.cause if r.solution else 'N/A'}")
        print("PASOS TÉCNICOS:")
        if r.solution and r.solution.technician_steps:
            for i, step in enumerate(r.solution.technician_steps[:3], 1):
                print(f"  {i}. {step}")
            if len(r.solution.technician_steps) > 3:
                print(f"  ... ({len(r.solution.technician_steps) - 3} más)")
        else:
            print("  (Sin pasos detectados)")
        print("-" * 40)

    print("\n" + "="*80)
    print("MUESTRA DE DATOS DE BAJA CONFIANZA (DIRECCIONADOS A LLM)")
    print("="*80)
    
    # Show 3 low-confidence blocks
    low_conf = [r for r in results if r.confidence_score < 0.75]
    for r in low_conf[:3]:
        print(f"\nCÓDIGO: {r.block.code}")
        print(f"TÍTULO: {r.block.raw_title}")
        print(f"CONFIDENCIA: {r.confidence_score:.3f}")
        print(f"CAUSA DETECTADA (Regex): {r.solution.cause if r.solution else 'N/A'}")
        print("NOTA: Este bloque se enviaría a Claude Haiku para refinamiento.")
        print("-" * 40)

if __name__ == "__main__":
    inspect_extraction("CPMD - 62655.pdf")
