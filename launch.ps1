# Quantum Noise Learning Lab - local preview launcher (PowerShell).
# Run from PowerShell:  ./launch.ps1
# Or right-click -> Run with PowerShell.

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

Write-Host ""
Write-Host "=== Quantum Noise Learning Lab - local preview ===" -ForegroundColor Cyan
Write-Host "Project dir: $PWD"
Write-Host ""

# Pick a Python interpreter
$py = $null
foreach ($cand in @("py", "python")) {
    if (Get-Command $cand -ErrorAction SilentlyContinue) { $py = $cand; break }
}
if (-not $py) {
    Write-Host "[ERROR] No Python found on PATH. Install Python 3.10+ from https://www.python.org/downloads/" -ForegroundColor Red
    Read-Host "Press Enter to close"
    exit 1
}
$pyArgs = if ($py -eq "py") { @("-3") } else { @() }
Write-Host "Using Python: $py $($pyArgs -join ' ')"
& $py @pyArgs --version

# Ensure dependencies are installed
Write-Host ""
Write-Host "Checking dependencies..."
& $py @pyArgs -c "import streamlit, plotly, numpy, scipy, quantum_noise_lab" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing missing dependencies..." -ForegroundColor Yellow
    & $py @pyArgs -m pip install -e ".[all]"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] pip install failed." -ForegroundColor Red
        Read-Host "Press Enter to close"
        exit 1
    }
}

# Pick a free port
$port = 8501
$busy = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
if ($busy) { $port = 8765 }
$url = "http://localhost:$port/"
Write-Host "Using port: $port"
Write-Host "Opening $url after the server is ready..."
Write-Host ""

# Open the browser after a short delay so the server has time to bind
Start-Job -ScriptBlock {
    param($u)
    Start-Sleep -Seconds 4
    Start-Process $u
} -ArgumentList $url | Out-Null

# Run Streamlit in the foreground
& $py @pyArgs -m streamlit run app/main.py `
    --server.port $port `
    --server.address localhost `
    --browser.gatherUsageStats false `
    --server.headless true

Write-Host ""
Write-Host "Streamlit server stopped." -ForegroundColor Cyan
Read-Host "Press Enter to close"
