# Reset PostgreSQL Password Script
# Run this as Administrator

$pgVersion = "18"
$pgDataDir = "C:\Program Files\PostgreSQL\$pgVersion\data"
$pgHbaFile = "$pgDataDir\pg_hba.conf"
$serviceName = "postgresql-x64-$pgVersion"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   PostgreSQL Password Reset Utility" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[1/5] Backing up pg_hba.conf..." -ForegroundColor Yellow
Copy-Item $pgHbaFile "$pgHbaFile.backup" -Force
Write-Host "   Backup created: $pgHbaFile.backup" -ForegroundColor Green

Write-Host ""
Write-Host "[2/5] Modifying pg_hba.conf to allow trust authentication..." -ForegroundColor Yellow
$content = Get-Content $pgHbaFile
$newContent = $content -replace 'host\s+all\s+all\s+127\.0\.0\.1/32\s+scram-sha-256', 'host    all             all             127.0.0.1/32            trust'
$newContent = $newContent -replace 'host\s+all\s+all\s+::1/128\s+scram-sha-256', 'host    all             all             ::1/128                 trust'
Set-Content -Path $pgHbaFile -Value $newContent
Write-Host "   pg_hba.conf modified" -ForegroundColor Green

Write-Host ""
Write-Host "[3/5] Restarting PostgreSQL service..." -ForegroundColor Yellow
Restart-Service $serviceName
Start-Sleep -Seconds 3
Write-Host "   Service restarted" -ForegroundColor Green

Write-Host ""
Write-Host "[4/5] Resetting postgres user password to 'yeet'..." -ForegroundColor Yellow
$PSQL = "C:\Program Files\PostgreSQL\$pgVersion\bin\psql.exe"
& $PSQL -U postgres -c "ALTER USER postgres WITH PASSWORD 'yeet';"
Write-Host "   Password reset to: yeet" -ForegroundColor Green

Write-Host ""
Write-Host "[5/5] Restoring pg_hba.conf security settings..." -ForegroundColor Yellow
Copy-Item "$pgHbaFile.backup" $pgHbaFile -Force
Restart-Service $serviceName
Start-Sleep -Seconds 3
Write-Host "   Security restored" -ForegroundColor Green

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "   SUCCESS! Password is now: yeet" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "You can now run Ibha with:" -ForegroundColor Cyan
Write-Host "   python local_server.py" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"
