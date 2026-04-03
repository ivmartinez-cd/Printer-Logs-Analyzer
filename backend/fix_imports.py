import os
import re

BASE_DIR = "backend"

REPLACEMENTS = [
    (r"\bfrom application\.", "from backend.application."),
    (r"\bimport application\.", "import backend.application."),
    
    (r"\bfrom domain\.", "from backend.domain."),
    (r"\bimport domain\.", "import backend.domain."),
    
    (r"\bfrom infrastructure\.", "from backend.infrastructure."),
    (r"\bimport infrastructure\.", "import backend.infrastructure."),
]

def process_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    original = content

    for pattern, replacement in REPLACEMENTS:
        content = re.sub(pattern, replacement, content)

    if content != original:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"✔ Updated: {filepath}")


def main():
    for root, _, files in os.walk(BASE_DIR):
        for file in files:
            if file.endswith(".py"):
                process_file(os.path.join(root, file))


if __name__ == "__main__":
    main()