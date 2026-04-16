from lxml import html

tree = html.parse('device_dashboard.html')
print('Title:', tree.xpath('//title/text()'))
print('Device Name Title:', tree.xpath('//*[@class=\"entity-name model\"]/text()'))
[print('H1/H2:', x.tag, x.text_content().strip()) for x in tree.xpath('//h1 | //h2')]
headings = tree.xpath('//h3/text()')
print('H3s:', headings)

