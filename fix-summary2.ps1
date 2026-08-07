$content = Get-Content "c:\Users\ALAIN\Desktop\depot-saas\frontend-depot\src\pages\GesTockLandingPage.jsx" -Raw

# Fix chooseSummary using regex pattern
$content = $content -replace "chooseSummary: 'GesTock n\\'est pas simplement un logiciel de gestion\. C\\'est le copilote intelligent de votre entreprise\.'", "chooseSummary: 'GesTock transforme la gestion de votre PME en un avantage compétitif.'"

Set-Content "c:\Users\ALAIN\Desktop\depot-saas\frontend-depot\src\pages\GesTockLandingPage.jsx" -Value $content -NoNewline
