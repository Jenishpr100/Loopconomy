# Loopconomy Bot Installer - Windows PowerShell

Write-Host @"

████████╗███████╗██████╗ ███╗   ███╗██╗███╗   ██╗ █████╗ ██╗     
╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██║████╗  ██║██╔══██╗██║     
   ██║   █████╗  ██████╔╝██╔████╔██║██║██╔██╗ ██║███████║██║     
   ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║██║╚██╗██║██╔══██║██║     
   ██║   ███████╗██║  ██║██║ ╚═╝ ██║██║██║ ╚████║██║  ██║███████╗
   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝
                                                      
              ╔═══════════════════════════════════╗
              ║    Loopconomy Bot Installer     ║
              ║         v1.0.0 | Beta 2          ║
              ╚═══════════════════════════════════╝
"@ -ForegroundColor Cyan

Write-Host ""

# Check for Node.js
Write-Host "[1/6] Checking Dependencies..." -ForegroundColor Yellow
$nodeVersion = & node --version 2>$null
if ($nodeVersion) {
    Write-Host "[OK] Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Node.js not found. Install from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check npm
$npmVersion = & npm --version 2>$null
if ($npmVersion) {
    Write-Host "[OK] npm: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "[FAIL] npm not found" -ForegroundColor Red
    exit 1
}

# Check PostgreSQL
$psql = & where.exe psql 2>$null
if ($psql) {
    Write-Host "[OK] PostgreSQL: Found" -ForegroundColor Green
} else {
    Write-Host "[WARN] PostgreSQL not found. Install from https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
}

Write-Host ""

# Get credentials
Write-Host "[2/6] Configuration" -ForegroundColor Yellow
Write-Host ""

Set-Location $PSScriptRoot\..

if (Test-Path ".env") {
    $overwrite = Read-Host "Existing .env found. Overwrite? (y/n)"
    if ($overwrite -ne "y") {
        Write-Host "Keeping existing configuration."
    } else {
        $envContent = @"
BOT_TOKEN=$((Read-Host 'Bot Token'))
CLIENT_ID=$((Read-Host 'Client ID'))
DATABASE_URL=$((Read-Host 'PostgreSQL URL (postgres://user:pass@localhost/db)'))
TAX_COLLECTOR_ID=$((Read-Host 'Tax Collector ID (optional)'))
"@
        Set-Content -Path ".env" -Value $envContent
        Write-Host "[OK] Configuration saved" -ForegroundColor Green
    }
} else {
    $envContent = @"
BOT_TOKEN=$((Read-Host 'Bot Token'))
CLIENT_ID=$((Read-Host 'Client ID'))
DATABASE_URL=$((Read-Host 'PostgreSQL URL (postgres://user:pass@localhost/db)'))
TAX_COLLECTOR_ID=$((Read-Host 'Tax Collector ID (optional)'))
"@
    Set-Content -Path ".env" -Value $envContent
    Write-Host "[OK] Configuration saved" -ForegroundColor Green
}

Write-Host ""

# Install dependencies
Write-Host "[3/6] Installing Dependencies..." -ForegroundColor Yellow
npm install 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "[FAIL] npm install failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Setup directories
Write-Host "[4/6] Setting Up Directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "commands", "addons", "notes", "scripts" | Out-Null

if (-not (Test-Path "addons/manifest.json")) {
    @"
{
    "addons": {}
}
"@ | Set-Content "addons/manifest.json"
    Write-Host "[OK] Root manifest created" -ForegroundColor Green
}

Write-Host ""

# Database setup
Write-Host "[5/6] Database Setup..." -ForegroundColor Yellow

$schemaSQL = @"
CREATE TABLE IF NOT EXISTS economy (
    uid VARCHAR(20) PRIMARY KEY,
    coins BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS warnings (
    id SERIAL PRIMARY KEY,
    uid VARCHAR(20),
    reason TEXT,
    ts TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cooldowns (
    uid VARCHAR(20),
    command VARCHAR(50),
    last_used TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (uid, command)
);
"@

$schemaSQL | Set-Content "schema.sql" -Encoding UTF8
Write-Host "[OK] Schema file created" -ForegroundColor Green

if ($psql) {
    $runDb = Read-Host "Apply schema to database? (y/n)"
    if ($runDb -eq "y") {
        & psql $env:DATABASE_URL -f schema.sql 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Database schema applied" -ForegroundColor Green
        } else {
            Write-Host "[WARN] Schema apply failed (run manually)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""

# Complete
Write-Host "[6/6] Complete!" -ForegroundColor Yellow
Write-Host ""

Write-Host @"

╔════════════════════════════════════════╗
║         Installation Complete!          ║
╚════════════════════════════════════════╝

Next steps:
  1. Edit .env with your credentials
  2. Run: node main.js
  3. Or use: .\scripts\manage.ps1

Docs: docs\README.md

"@ -ForegroundColor Green

$startNow = Read-Host "Start the bot now? (y/n)"
if ($startNow -eq "y") {
    node main.js
}
