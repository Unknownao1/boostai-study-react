import re
import json

with open("public/login.html", "r", encoding="utf-8") as f:
    html = f.read()

# Extract CSS
style_match = re.search(r'<style>(.*?)</style>', html, flags=re.DOTALL)
if style_match:
    css = style_match.group(1).strip()
    with open("components/boostai/legacy-auth.css", "w", encoding="utf-8") as f:
        f.write(css)

# Extract body
body_match = re.search(r'<div class="auth">(.*?)</div>\s*<script>', html, flags=re.DOTALL)
if body_match:
    body = '<div className="auth">\n' + body_match.group(1) + '</div>'
    
    # Convert some basic HTML to JSX
    body = body.replace('class="', 'className="')
    body = body.replace('for="', 'htmlFor="')
    body = body.replace('autocomplete="', 'autoComplete="')
    body = body.replace('stroke-width="', 'strokeWidth="')
    body = body.replace('stroke-linecap="', 'strokeLinecap="')
    body = body.replace('stroke-linejoin="', 'strokeLinejoin="')
    body = body.replace('fill-rule="', 'fillRule="')
    body = body.replace('clip-rule="', 'clipRule="')
    body = body.replace('type="text"', 'type="text"') # Just to trigger syntax hilighting?
    body = re.sub(r'style="([^"]+)"', r'style={{\1}}', body)
    
    with open("components/boostai/body.jsx", "w", encoding="utf-8") as f:
        f.write(body)

print("Extracted CSS and Body.")
