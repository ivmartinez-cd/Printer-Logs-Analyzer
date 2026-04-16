import json
import re

with open('device_dashboard.html', encoding='utf-8') as f:
    html = f.read()

scripts = re.findall(r'<script.*?>\s*(.*?)\s*</script>', html, re.DOTALL | re.IGNORECASE)

for i, s in enumerate(scripts):
    if 'MXSCS7' in s.upper() or 'model' in s.lower():
        print(f'Script {i} contains matching text. Length: {len(s)}')
        # Check if we can find model names directly
        # Sometimes it's inside `window.initialState = {...}` or `var device = {...}`
        for match in re.finditer(r'\"?model\"?\s*:\s*\"([^\"]+)\"', s, re.IGNORECASE):
            print('Found inside JS:', match.group(1))
