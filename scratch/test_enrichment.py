import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent))

from backend.application.services.sds_web_service import extract_help_urls

def test_extraction():
    sample_path = Path("samples/hp_respuesta_muestra.html")
    if not sample_path.exists():
        print("Sample file not found!")
        return

    with open(sample_path, "r", encoding="utf-8") as f:
        raw_html = f.read()

    results = extract_help_urls(raw_html)
    
    print(f"Total codes extracted: {len(results)}")
    
    # Check a specific code from the sample (33.27.01)
    code = "33.27.01"
    if code in results:
        data = results[code]
        print(f"Code: {code}")
        print(f"URL: {data['url'][:50]}...")
        print(f"Description: {data['description']}")
        
        # Verify description is not empty and matches expected snippet
        if "Errors in the 33.* family" in data['description']:
            print("SUCCESS: Description accurately extracted!")
        else:
            print("FAILURE: Description mismatch!")
    else:
        print(f"FAILURE: Code {code} not found in results!")

if __name__ == "__main__":
    test_extraction()
