$content = Get-Content "c:\Users\ALAIN\Desktop\depot-saas\frontend-depot\src\pages\GesTockLandingPage.jsx" -Raw

# Fix finalTitle
$content = $content -replace "finalTitle: 'Prêt à transformer votre commerce \?'", "finalTitle: 'Ne laissez plus la gestion manuelle freiner votre croissance'"

# Fix finalText
$content = $content -replace "finalText:\s*'Rejoignez les commerçants qui gagnent déjà du temps, réduisent leurs pertes et développent leur entreprise grâce à GesTock\.'", "finalText:`n        'Rejoignez les centaines d'entreprises africaines qui ont deja choisi GesTock pour digitaliser leurs operations et booster leur rentabilite.'"

# Fix footer
$content = $content -replace "footer: 'GesTock — Plateforme SaaS intelligente pour les commerçants africains\.'", "footer: 'GesTock - La solution de gestion pensee pour l'Afrique, par des professionnels qui comprennent vos defis.'"

Set-Content "c:\Users\ALAIN\Desktop\depot-saas\frontend-depot\src\pages\GesTockLandingPage.jsx" -Value $content -NoNewline
