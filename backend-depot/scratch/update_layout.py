import sys
import os

path = 'frontend-depot/src/layouts/MainLayout.jsx'
if not os.path.exists(path):
    print(f'File {path} not found')
    sys.exit(1)

with open(path, 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Fix common name artifacts from previous operations
content = content.replace('Dpt', 'Dépôt')

# Add imports
if 'import AnalysesPage' not in content:
    content = content.replace(\"import SettingsPage from '../pages/SettingsPage';\", \"import SettingsPage from '../pages/SettingsPage';\nimport AnalysesPage from '../pages/AnalysesPage';\")

# Add icon
if 'analyses:' not in content:
    content = content.replace('  dashboard:', '  analyses: <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z\" />,\n  dashboard:')

# Add nav item
if \"id: 'analyses'\" not in content:
    content = content.replace(\"{ id: 'dashboard'\", \"{ id: 'analyses', label: 'Analyses BI', icon: Icons.analyses, roles: [ROLES.PATRON, ROLES.GERANT, ROLES.COMPTABLE] },\n    { id: 'dashboard'\")

# Add renderPage case
if \"case 'analyses':\" not in content:
    content = content.replace(\"case 'ventes':\", \"case 'analyses': return <AnalysesPage />;\n      case 'ventes':\")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('MainLayout updated successfully')
