param(
  [Parameter(Mandatory=$true)][string]$Html,
  [Parameter(Mandatory=$true)][string]$AssetsDir
)

if (-not (Test-Path $Html)) {
  Write-Host "FEJL: $Html findes ikke"
  exit 1
}

$matches = Select-String -Path $Html -Pattern 'assets/([A-Za-z0-9_-]+\.(?:json|css|js))' -AllMatches
$refs = $matches.Matches | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique

if (-not $refs) {
  Write-Host "FEJL: fandt ingen assets-referencer i $Html"
  exit 1
}

$missing = @()
foreach ($ref in $refs) {
  $target = Join-Path $AssetsDir $ref
  if (-not (Test-Path $target)) {
    $missing += $ref
  }
}

if ($missing) {
  Write-Host "FEJL: $Html peger paa filer som ikke findes i ${AssetsDir}:"
  $missing | ForEach-Object { Write-Host "  - $_" }
  exit 1
}

Write-Host "OK: $Html peger korrekt paa alle assets ($($refs -join ', '))"
exit 0
