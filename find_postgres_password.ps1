# PostgreSQL Password Finder/Tester
Write-Host "Testing common PostgreSQL passwords..." -ForegroundColor Yellow
Write-Host ""

$PSQL = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$commonPasswords = @("", "postgres", "admin", "password", "yeet", "root", "12345", "123456")

foreach ($pwd in $commonPasswords) {
    if ($pwd -eq "") {
        $displayPwd = "(empty)"
    } else {
        $displayPwd = $pwd
    }
    
    Write-Host "Trying: $displayPwd" -NoNewline
    
    $env:PGPASSWORD = $pwd
    $result = & $PSQL -U postgres -c "SELECT 1;" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host " - SUCCESS!" -ForegroundColor Green
        Write-Host ""
        Write-Host "============================================================" -ForegroundColor Green
        Write-Host "   FOUND IT! Password is: $displayPwd" -ForegroundColor Green
        Write-Host "============================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Updating local_server.py with correct password..." -ForegroundColor Yellow
        
        # Update the server file
        $serverFile = "local_server.py"
        $content = Get-Content $serverFile -Raw
        $content = $content -replace "os.environ\['DB_PASSWORD'\] = '.*'", "os.environ['DB_PASSWORD'] = '$pwd'"
        Set-Content -Path $serverFile -Value $content -NoNewline
        
        Write-Host "Done! You can now run: python local_server.py" -ForegroundColor Green
        exit 0
    } else {
        Write-Host " - Failed" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Red
Write-Host "   Could not find the password!" -ForegroundColor Red
Write-Host "============================================================" -ForegroundColor Red
Write-Host ""
Write-Host "Options:" -ForegroundColor Yellow
Write-Host "1. Reset PostgreSQL password using Windows authentication"
Write-Host "2. Reinstall PostgreSQL"
Write-Host "3. Check if you have a password file saved somewhere"
Write-Host ""
Write-Host "To reset password, run as administrator:" -ForegroundColor Cyan
Write-Host '   $env:PGPASSWORD="yournewpassword"; psql -U postgres -c "ALTER USER postgres PASSWORD ''yournewpassword'';"'
Write-Host ""
