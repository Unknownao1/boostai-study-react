import re

with open("components/boostai/legacy-auth.css", "r", encoding="utf-8") as f:
    css = f.read()

# Add basic scope where needed
css = css.replace("body{", ".auth-page-wrapper{")
css = css.replace("h1{", ".auth h1{")
css = css.replace("a{", ".auth a{")
css = css.replace("button{", ".auth button{")

with open("components/boostai/legacy-auth.css", "w", encoding="utf-8") as f:
    f.write(css)

print("Scoped CSS.")
