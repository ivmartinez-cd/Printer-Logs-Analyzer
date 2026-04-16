from lxml import html
tree = html.parse('device_dashboard.html')
links = tree.xpath('//a[contains(@class, "entity-name") and contains(@class, "model")]')
print('Found links:', len(links))
for x in links:
    print('-', x.text_content().strip())
