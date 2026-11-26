#!/usr/bin/env python3
"""Gộp toàn bộ game (HTML + CSS + JS + config + ảnh) thành 1 file HTML duy nhất.
Chạy:  python tools/build.py        ->  dist/pixel-stickman-runner.html
Chỉ dùng thư viện có sẵn của Python, không cần cài thêm gì."""
import base64, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def read(p): 
    with open(os.path.join(ROOT, p), encoding='utf-8') as f: return f.read()

html = read('index.html')

# 1) nhúng CSS
def css_sub(m): return '<style>\n' + read(m.group(1)) + '\n</style>'
html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', css_sub, html)

# 2) nhúng ảnh (base64) thành window.EMBEDDED_ASSETS
assets_js = read('src/assets.js')
files = dict(re.findall(r"(\w+): '(assets/[^']+\.png)'", assets_js))
embedded = {}
for name, path in files.items():
    full = os.path.join(ROOT, path)
    if os.path.exists(full):
        with open(full, 'rb') as f:
            embedded[name] = 'data:image/png;base64,' + base64.b64encode(f.read()).decode()
    else:
        print('  [!] thiếu ảnh:', path, '(game sẽ dùng hình tạm)')
emb_tag = '<script>window.EMBEDDED_ASSETS=' + json.dumps(embedded) + ';</script>'

# 3) nhúng JS theo đúng thứ tự trong index.html
def js_sub(m):
    code = read(m.group(1)).replace('</script>', '<\\/script>')
    return '<script>\n' + code + '\n</script>'
html = re.sub(r'<script src="([^"]+)"></script>', js_sub, html)
html = html.replace('<!--SCRIPTS-->', emb_tag, 1)

os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
out = os.path.join(ROOT, 'dist', 'pixel-stickman-runner.html')
with open(out, 'w', encoding='utf-8') as f: f.write(html)
print('OK ->', out, '(%d KB, %d ảnh nhúng)' % (os.path.getsize(out) // 1024, len(embedded)))
