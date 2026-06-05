import os

def fix_file_encoding(file_path):
    try:
        with open(file_path, 'rb') as f:
            content = f.read()
        
        # Try to decode from various encodings to find the original intent
        decoded = None
        for enc in ['utf-8', 'latin-1', 'cp1252']:
            try:
                decoded = content.decode(enc)
                break
            except:
                continue
        
        if decoded:
            # Replace common corrupted patterns
            replacements = {
                'â€¢': '••••',
                'â ³': '⏳',
                'âœ…': '✅',
                'ðŸ’¬': '💬',
                'â€“': '–',
                'â€”': '—',
                'Â': '',
                'Ã©': 'é',
                'Ã ': 'à',
                'Ã¨': 'è',
                'Ãª': 'ê',
                'Ã®': 'î',
                'Ã´': 'ô',
                'Ã»': 'û',
                'Ã§': 'ç',
                'Â·': '·'
            }
            for old, new in replacements.items():
                decoded = decoded.replace(old, new)
            
            with open(file_path, 'w', encoding='utf-8', newline='\n') as f:
                f.write(decoded)
            return True
    except Exception as e:
        print(f"Error fixing {file_path}: {e}")
    return False

def main():
    paths = [
        'src/pages/LoginPage.jsx',
        'src/pages/VentesPage.jsx',
        'src/pages/RegisterPage.jsx',
        'src/pages/ReceptionsPage.jsx'
    ]
    base_dir = r'c:\Users\ALAIN\Desktop\depot-saas\frontend-depot'
    
    for p in paths:
        full_path = os.path.join(base_dir, p)
        if os.path.exists(full_path):
            if fix_file_encoding(full_path):
                print(f"Fixed encoding for {p}")
            else:
                print(f"Failed to fix {p}")

if __name__ == "__main__":
    main()
