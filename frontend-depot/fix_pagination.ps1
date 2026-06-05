# ============================================================
# fix-pagination.ps1
# Injecte usePagination dans tous les modules JSX concernés
# ============================================================
# USAGE : .\fix-pagination.ps1
# ============================================================

$srcPath   = "c:\Users\ALAIN\Desktop\depot-saas\frontend-depot\src\modules"
$encoding  = [System.Text.Encoding]::UTF8
$fixed     = 0
$skipped   = 0
$errors    = 0
$skipLog   = @()

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host " Gestock — Correcteur de pagination" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# ── 1. Cibler les JSX qui utilisent totalPages sans usePagination ───────
$files = Get-ChildItem -Recurse -Filter "*.jsx" $srcPath |
  Where-Object {
    $raw = [System.IO.File]::ReadAllText($_.FullName, $encoding)
    ($raw -match "totalPages") -and ($raw -notmatch "usePagination")
  }

Write-Host "Fichiers à corriger : $($files.Count)" -ForegroundColor White

if ($files.Count -eq 0) {
  Write-Host "Aucun fichier à corriger. Tout est déjà propre." -ForegroundColor Green
  exit 0
}

foreach ($file in $files) {
  $path    = $file.FullName
  $name    = $file.Name
  $content = [System.IO.File]::ReadAllText($path, $encoding)

  try {

    # ── 2. Détecter le chemin relatif correct selon la profondeur ─────
    # Compte les séparateurs entre $srcPath et le fichier
    $relativePath = $path.Substring($srcPath.Length).TrimStart('\')
    $depth = ($relativePath -split '\\').Count  # ex: supermarche\pages\VentesPage.jsx → 3
    $relImport = ("../" * $depth).TrimEnd('/') + "/hooks/usePagination"

    # ── 3. Détecter la variable de données (plusieurs patterns) ───────
    $dataVar = $null

    # Pattern A : destructuring useData  →  data: ventes = []
    $m = [regex]::Match($content, "data:\s+(\w+)\s*=\s*\[\]")
    if ($m.Success) { $dataVar = $m.Groups[1].Value }

    # Pattern B : const { data } = useData  →  utiliser "data" directement
    if (-not $dataVar) {
      $m = [regex]::Match($content, "const\s+\{\s*data\b")
      if ($m.Success) { $dataVar = "data" }
    }

    # Pattern C : const ventes = data?.ventes ?? []
    if (-not $dataVar) {
      $m = [regex]::Match($content, "const\s+(\w+)\s*=\s*data\?\.\w+\s*\?\?")
      if ($m.Success) { $dataVar = $m.Groups[1].Value }
    }

    # Pattern D : const [ventes, setVentes] = useState([])
    if (-not $dataVar) {
      $m = [regex]::Match($content, "const\s+\[(\w+),\s*set\w+\]\s*=\s*useState\(\[\]\)")
      if ($m.Success) { $dataVar = $m.Groups[1].Value }
    }

    if (-not $dataVar) {
      $msg = "SKIP (variable de données introuvable) : $name"
      Write-Host $msg -ForegroundColor Yellow
      $skipLog += $msg
      $skipped++
      continue
    }

    # ── 4. Ajouter l'import usePagination ─────────────────────────────
    $importLine = "import { usePagination } from '$relImport';"

    if ($content -notmatch [regex]::Escape($importLine)) {

      # Insérer après le dernier import existant (useData, useAuth, useState, useEffect...)
      $importPatterns = @(
        "(import \{[^\}]*\} from '\.\.[\./]+hooks\/useData';\r?\n)",
        "(import \{[^\}]*\} from '\.\.[\./]+hooks\/useAuth';\r?\n)",
        "(import \{[^\}]*useState[^\}]*\} from 'react';\r?\n)",
        "(import \{[^\}]*useEffect[^\}]*\} from 'react';\r?\n)"
      )

      $inserted = $false
      foreach ($pattern in $importPatterns) {
        if ($content -match $pattern) {
          $content = $content -replace $pattern, "`${1}$importLine`n"
          $inserted = $true
          break
        }
      }

      if (-not $inserted) {
        # Fallback : insérer après la dernière ligne d'import
        $content = $content -replace "(import [^\n]+\n)(?!import)", "`${1}$importLine`n"
      }
    }

    # ── 5. Supprimer les anciennes déclarations locales de totalPages ──
    # const totalPages = ...  ou  let totalPages = ...
    $content = $content -replace "[ \t]*(const|let|var)\s+totalPages\s*=\s*[^\n]+\n", ""
    $content = $content -replace "[ \t]*(const|let|var)\s+currentPage\s*=\s*[^\n]+\n", ""
    $content = $content -replace "[ \t]*(const|let|var)\s+\[currentPage,\s*setCurrentPage\]\s*=\s*useState\([^\)]*\);\r?\n", ""
    $content = $content -replace "[ \t]*(const|let|var)\s+\[page,\s*setPage\]\s*=\s*useState\([^\)]*\);\r?\n", ""

    # ── 6. Injecter le bloc usePagination après le bloc useData ────────
    $hookBlock = @"

  // Pagination centralisée — FIX: totalPages non défini
  const filtres = ($dataVar || []).filter(item =>
    !search || JSON.stringify(item).toLowerCase().includes((search || '').toLowerCase())
  );
  const {
    currentPage,
    setCurrentPage,
    goToPage,
    nextPage,
    prevPage,
    totalPages,
    totalItems,
    paginatedData: paginated,
    hasNext,
    hasPrev,
    from,
    to,
  } = usePagination(filtres, 10);
"@

    # Cherche la fin du bloc useData (plusieurs formes)
    $useDataPatterns = @(
      "(} = useData\([^)]+\)\s*;\r?\n)",
      "(} = useData\([^)]+\),\s*\{[^}]*\}\s*;\r?\n)",
      "(}\s*=\s*useData\([^;]+;\r?\n)"
    )

    $injected = $false
    foreach ($p in $useDataPatterns) {
      if ($content -match $p -and $content -notmatch "const filtres =") {
        $content = $content -replace $p, "`${1}$hookBlock`n"
        $injected = $true
        break
      }
    }

    # Fallback : insérer avant le premier return (
    if (-not $injected -and $content -notmatch "const filtres =") {
      $content = $content -replace "([ \t]*return\s*\()", "$hookBlock`n`${1}"
    }

    # ── 7. Corriger les handlers de pagination ─────────────────────────
    # Anciens patterns → nouveaux patterns sécurisés
    $content = $content -replace "onClick=\{\(\) => setPage\(p => p - 1\)\}",   "onClick={prevPage}"
    $content = $content -replace "onClick=\{\(\) => setPage\(p => p \+ 1\)\}",  "onClick={nextPage}"
    $content = $content -replace "onClick=\{\(\) => setCurrentPage\(p => p - 1\)\}", "onClick={prevPage}"
    $content = $content -replace "onClick=\{\(\) => setCurrentPage\(p => p \+ 1\)\}", "onClick={nextPage}"
    $content = $content -replace "setPage\(page - 1\)",    "prevPage()"
    $content = $content -replace "setPage\(page \+ 1\)",   "nextPage()"
    $content = $content -replace "disabled=\{currentPage === 1\}",          "disabled={hasPrev === false}"
    $content = $content -replace "disabled=\{currentPage === totalPages\}",  "disabled={hasNext === false}"

    # ── 8. Remplacer les anciens noms de variables dans le JSX ─────────
    # items.map / ventes.map → paginated.map
    $content = $content -replace "\b$dataVar\.map\(",  "paginated.map("
    $content = $content -replace "\b$dataVar\.length\b", "totalItems"

    # ── 9. Écriture du fichier ─────────────────────────────────────────
    [System.IO.File]::WriteAllText($path, $content, $encoding)
    Write-Host "CORRIGE  : $name  (data=$dataVar)" -ForegroundColor Green
    $fixed++

  } catch {
    $msg = "ERREUR sur $name : $_"
    Write-Host $msg -ForegroundColor Red
    $skipLog += $msg
    $errors++
  }
}

# ── Rapport final ──────────────────────────────────────────────────────
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host " Rapport final" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " Corriges  : $fixed"  -ForegroundColor Green
Write-Host " Ignores   : $skipped" -ForegroundColor Yellow
Write-Host " Erreurs   : $errors"  -ForegroundColor Red

if ($skipLog.Count -gt 0) {
  Write-Host "`nFichiers ignorés ou en erreur :" -ForegroundColor Yellow
  $skipLog | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
  Write-Host "`nPour ces fichiers, utilise le prompt suivant dans ton editeur :" -ForegroundColor White
  Write-Host @"

  Voici les fichiers JSX qui n'ont pas pu être corrigés automatiquement 
  par le script PowerShell (pattern de données non reconnu) :
  [LISTE LES FICHIERS SKIPPÉS ICI]

  Pour chacun, applique manuellement usePagination :
  1. Identifie la variable de données principale (tableau affiché)
  2. Remplace les déclarations locales de totalPages/currentPage
  3. Injecte : const { currentPage, setCurrentPage, totalPages, 
       paginatedData: paginated } = usePagination(maVariable, 10)
  4. Utilise paginated.map() à la place de maVariable.map()
  Fichier complet, aucune troncature.
"@ -ForegroundColor Gray
}

Write-Host "`nTermine. Relance ton app et verifie que les pages s'affichent." -ForegroundColor Cyan