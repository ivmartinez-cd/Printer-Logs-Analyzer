import json
import re

html = open('device_dashboard.html', encoding='utf-8').read()
# Find all URLs matching /PortalWeb/... that might be API endpoints
urls = re.findall(r'"(/PortalWeb/[^"]+)"', html)
print("Found URLs:", set(urls))
