import re

with open("components/boostai/AuthLogin.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# For links that act as buttons (no href), we should probably use <button> or add href="#"
content = re.sub(r'<Link\s+id="toggleMode"([^>]*)>', r'<Link href="#" id="toggleMode"\1>', content)
content = re.sub(r'<Link\s+className="forgot([^>]*)>', r'<Link href="#" className="forgot\1>', content)

with open("components/boostai/AuthLogin.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed links.")
