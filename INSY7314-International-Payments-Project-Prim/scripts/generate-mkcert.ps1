<#
Generates localhost TLS certificates using mkcert.
Places `localhost.pem` and `localhost-key.pem` in the repo root.
Usage (PowerShell):
  - Run from repository root or anywhere: .\scripts\generate-mkcert.ps1 [-Force]
  - If `mkcert-v1.4.4-windows-amd64.exe` exists in repo root it will be used.
  - Otherwise, will try to use `mkcert` on PATH.

Notes:
  - Requires admin privileges to install the local CA the first time (mkcert -install).
  - If you don't want to overwrite existing certs, run without -Force.
#>
param(
    [switch]$Force,
    [string]$RepoRoot = "$(Split-Path -Parent $MyInvocation.MyCommand.Definition)\.."
)

$RepoRoot = (Resolve-Path $RepoRoot).ProviderPath
$mkcertLocal = Join-Path $RepoRoot "mkcert-v1.4.4-windows-amd64.exe"
$certOut = Join-Path $RepoRoot "localhost.pem"
$keyOut = Join-Path $RepoRoot "localhost-key.pem"

function Write-Info($msg){ Write-Host "[mkcert] $msg" -ForegroundColor Cyan }
function Write-ErrorAndExit($msg){ Write-Host "[mkcert] ERROR: $msg" -ForegroundColor Red; exit 1 }

Write-Info "Repo root: $RepoRoot"

if (-not $Force) {
    if (Test-Path $certOut -and Test-Path $keyOut) {
        Write-Host "Found existing cert files:" -ForegroundColor Yellow
        Get-ChildItem $certOut, $keyOut | ForEach-Object { Write-Host "  $($_.FullName) ($($_.Length) bytes)" }
        Write-Host "Run with -Force to overwrite." -ForegroundColor Yellow
        exit 0
    }
}

# Determine mkcert executable
$mkcertCmd = $null
if (Test-Path $mkcertLocal) {
    $mkcertCmd = $mkcertLocal
    Write-Info "Using bundled mkcert binary: $mkcertCmd"
} else {
    $which = Get-Command mkcert -ErrorAction SilentlyContinue
    if ($which) {
        $mkcertCmd = $which.Path
        Write-Info "Using mkcert from PATH: $mkcertCmd"
    }
}

if (-not $mkcertCmd) {
    Write-ErrorAndExit "mkcert not found. Place 'mkcert-v1.4.4-windows-amd64.exe' in the repo root or install mkcert and make it available on PATH. See scripts/README.mkcert.md for details."
}

# Ensure mkcert CA is installed (may require elevation)
Write-Info "Ensuring mkcert local CA is installed (may prompt for elevation)..."
$installProc = Start-Process -FilePath $mkcertCmd -ArgumentList "-install" -NoNewWindow -Wait -PassThru -ErrorAction SilentlyContinue
if ($installProc.ExitCode -ne 0) {
    Write-ErrorAndExit "mkcert -install failed with exit code $($installProc.ExitCode). Run the command manually with elevated privileges."
}

# Generate certs
Write-Info "Generating cert pair for: localhost 127.0.0.1 ::1"
# mkcert outputs files named like: localhost+2.pem and localhost+2-key.pem
Push-Location $RepoRoot
try {
    $args = @("localhost", "127.0.0.1", "::1")
    $genProc = Start-Process -FilePath $mkcertCmd -ArgumentList $args -NoNewWindow -Wait -PassThru -ErrorAction SilentlyContinue
    if ($genProc.ExitCode -ne 0) {
        Write-ErrorAndExit "mkcert generation failed with exit code $($genProc.ExitCode)."
    }
    # Find the newly created files (recent files matching localhost*.pem and *-key.pem)
    $pem = Get-ChildItem -Path $RepoRoot -Filter "localhost*.pem" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    $key = Get-ChildItem -Path $RepoRoot -Filter "localhost*-key.pem" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $pem -or -not $key) {
        Write-ErrorAndExit "mkcert ran but expected output files were not found in the repo root."
    }
    # Copy/rename to standard names
    Copy-Item -Path $pem.FullName -Destination $certOut -Force
    Copy-Item -Path $key.FullName -Destination $keyOut -Force
    Write-Info "Wrote cert: $certOut"
    Write-Info "Wrote key:  $keyOut"
    Write-Host "\nRemember to restart your dev servers if needed." -ForegroundColor Green
} finally {
    Pop-Location
}
