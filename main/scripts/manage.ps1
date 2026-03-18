# Loopconomy Bot Manager - Windows PowerShell

$script:botProcess = $null
$script:logFile = "$PSScriptRoot\..\bot.log"

function Show-Banner {
    Clear-Host
    Write-Host @"

 ╔════════════════════════════════════════╗
 ║        Loopconomy Bot Manager          ║
 ╚════════════════════════════════════════╝
"@ -ForegroundColor Magenta
    Write-Host ""
}

function Get-BotStatus {
    $process = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*main.js*" }
    if ($process) {
        return @{
            Running = $true
            PID = $process.Id
            Uptime = (Get-Date) - $process.StartTime
        }
    }
    return @{ Running = $false }
}

function Show-Status {
    $status = Get-BotStatus
    
    Write-Host "Bot Status:" -ForegroundColor Cyan
    Write-Host ""
    
    if ($status.Running) {
        Write-Host "  [RUNNING] 🟢" -ForegroundColor Green
        Write-Host "  PID: $($status.PID)"
        Write-Host "  Uptime: $($status.Uptime.ToString('hh\:mm\:ss'))"
    } else {
        Write-Host "  [STOPPED] 🔴" -ForegroundColor Red
    }
    Write-Host ""
}

function Start-Bot {
    $status = Get-BotStatus
    if ($status.Running) {
        Write-Host "Bot is already running!" -ForegroundColor Yellow
        return
    }
    
    Set-Location "$PSScriptRoot\.."
    Start-Process -FilePath "node" -ArgumentList "main.js" -RedirectStandardOutput $logFile -RedirectStandardError "$logFile.err" -WindowStyle Hidden
    Start-Sleep 3
    
    $status = Get-BotStatus
    if ($status.Running) {
        Write-Host "Bot started! (PID: $($status.PID))" -ForegroundColor Green
    } else {
        Write-Host "Bot failed to start. Check logs." -ForegroundColor Red
    }
}

function Stop-Bot {
    $status = Get-BotStatus
    if (-not $status.Running) {
        Write-Host "Bot is not running." -ForegroundColor Yellow
        return
    }
    
    Stop-Process -Id $status.PID -Force
    Start-Sleep 2
    
    $status = Get-BotStatus
    if (-not $status.Running) {
        Write-Host "Bot stopped." -ForegroundColor Green
    }
}

function Restart-Bot {
    Write-Host "Restarting bot..."
    Stop-Bot
    Start-Sleep 2
    Start-Bot
}

function View-Logs {
    if (Test-Path $logFile) {
        Get-Content $logFile -Tail 30
    } else {
        Write-Host "No log file found." -ForegroundColor Yellow
    }
}

function Update-Bot {
    Set-Location "$PSScriptRoot\.."
    Write-Host "Pulling updates..."
    
    & git pull 2>&1 | ForEach-Object { Write-Host $_ }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Updates pulled successfully!" -ForegroundColor Green
        
        Write-Host "Checking dependencies..."
        npm install 2>&1 | Out-Null
        
        $restart = Read-Host "Restart bot to apply updates? (y/n)"
        if ($restart -eq "y") {
            Restart-Bot
        }
    } else {
        Write-Host "Git pull failed." -ForegroundColor Red
    }
}

function Backup-Database {
    Set-Location "$PSScriptRoot\.."
    
    if (-not (Test-Path ".env")) {
        Write-Host ".env not found." -ForegroundColor Red
        return
    }
    
    . .\.env 2>$null
    
    if (-not $env:DATABASE_URL) {
        Write-Host "DATABASE_URL not set." -ForegroundColor Red
        return
    }
    
    $backupFile = "backups\backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
    New-Item -ItemType Directory -Force -Path "backups" | Out-Null
    
    Write-Host "Creating backup: $backupFile"
    & pg_dump $env:DATABASE_URL 2>$null | Set-Content $backupFile -Encoding UTF8
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Backup created: $backupFile" -ForegroundColor Green
    } else {
        Write-Host "Backup failed. Is PostgreSQL running?" -ForegroundColor Red
    }
}

function Show-Menu {
    Show-Banner
    Show-Status
    
    Write-Host @"

        ╔════════════════════════════════╗
        ║        Management Menu          ║
        ╚════════════════════════════════╝

  1. Start Bot
  2. Stop Bot
  3. Restart Bot
  4. View Logs
  5. Update Bot (git pull)
  6. Backup Database
  7. Refresh Status
  8. Exit

"@ -ForegroundColor Cyan
    
    $choice = Read-Host "Select option"
    Write-Host ""
    
    switch ($choice) {
        "1" { Start-Bot }
        "2" { Stop-Bot }
        "3" { Restart-Bot }
        "4" { 
            View-Logs
            Write-Host ""
            Read-Host "Press Enter to continue"
        }
        "5" { Update-Bot }
        "6" { Backup-Database }
        "7" { return }
        "8" { 
            Write-Host "Goodbye!" -ForegroundColor Cyan
            exit 
        }
        default { 
            Write-Host "Invalid option." -ForegroundColor Red 
            Start-Sleep 1
        }
    }
}

# Main loop
while ($true) {
    Show-Menu
}
