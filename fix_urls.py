import os
import re

d = r"e:\s1\shree-sales\frontend\src"

for root, dirs, files in os.walk(d):
    for f in files:
        if f.endswith('.jsx') or f.endswith('.js'):
            filepath = os.path.join(root, f)
            with open(filepath, 'r', encoding='utf-8') as file:
                content = file.read()
            
            # Replace occurrences of "http://127.0.0.1:8000
            if 'http://127.0.0.1:8000' in content:
                # We replace string literals with template literals
                content = content.replace('"http://127.0.0.1:8000', '`http://${window.location.hostname}:8000')
                content = content.replace("'http://127.0.0.1:8000", '`http://${window.location.hostname}:8000')
                # Also replace the trailing quote if it was a plain string without backticks
                content = re.sub(r'(`http://\$\{window\.location\.hostname\}:8000[^\n"\'`]*)(["\'])', r'\1`', content)

                
                with open(filepath, 'w', encoding='utf-8') as file:
                    file.write(content)
                print(f"Updated {f}")
