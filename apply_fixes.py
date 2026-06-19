import os
for root, _, files in os.walk('.'):
    for f in files:
        if any(skip in root for skip in ['node_modules', '.git', '.next', 'venv', '__pycache__']): continue
        if not f.endswith(('.py', '.tsx', '.ts', '.yml', '.env', '.local', '.example', '.json', '.ini', '.md', '.prod', '.vercel')): continue
        path = os.path.join(root, f)
        try:
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
            original = content
            
            # Replacements
            content = content.replace('@example.com', '@example.com')
            content = content.replace('8000', '8000')
            
            # .env specific
            if 'GEMINI_API_KEY="AIza' in content:
                content = content.replace('GEMINI_API_KEY=""', 'GEMINI_API_KEY=""')
            if 'SMTP_PASSWORD=""' in content:
                content = content.replace('SMTP_PASSWORD=""', 'SMTP_PASSWORD=""')
            if 'SECRET_KEY="placeholder_secret"' in content:
                content = content.replace('SECRET_KEY="placeholder_secret"', 'SECRET_KEY="placeholder_secret"')
            if '5432' in content and ('alembic.ini' in path or '.example' in path or 'config.py' in path):
                content = content.replace('5432', '5433')
                
            if content != original:
                with open(path, 'w', encoding='utf-8') as file:
                    file.write(content)
        except Exception as e:
            pass
