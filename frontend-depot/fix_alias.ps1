$srcPath = 'c:\Users\ALAIN\Desktop\depot-saas\frontend-depot\src\modules'
$encoding = [System.Text.Encoding]::UTF8
$fixed = 0

$alias = "  const page = currentPage;`n  const setPage = setCurrentPage;"

Get-ChildItem -Recurse -Filter '*.jsx' $srcPath | Where-Object {
  $raw = [System.IO.File]::ReadAllText($_.FullName, $encoding)
  ($raw -match 'usePagination') -and ($raw -notmatch 'const page = currentPage') -and (
    $raw -match '\{page\}' -or $raw -match '\bpage ===' -or $raw -match '\bpage /' -or $raw -match '\bsetPage\('
  )
} | ForEach-Object {
  $path = $_.FullName
  $content = [System.IO.File]::ReadAllText($path, $encoding)
  # Injecter l'alias juste après la destructuration usePagination
  $content = $content -replace '(\} = usePagination\([^;]+;\r?\n)', ('${1}' + $alias + "`n")
  [System.IO.File]::WriteAllText($path, $content, $encoding)
  Write-Host "ALIAS: $($_.Name)"
  $fixed++
}
Write-Host "`nAlias injectes dans $fixed fichiers."
