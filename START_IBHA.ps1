# Ibha - Complete Startup Script
# This script sets up and starts the entire Ibha application

$ErrorActionPreference = "Stop"
$PSQL = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$PROJECT_ROOT = "C:\Projects\Ibha\ibha-ksp"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   IBHA - KSP Crime Intelligence Startup" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check PostgreSQL
Write-Host "[1/6] Checking PostgreSQL..." -ForegroundColor Yellow
$pgService = Get-Service -Name "*postgres*" -ErrorAction SilentlyContinue
if ($pgService.Status -ne "Running") {
    Write-Host "   Starting PostgreSQL service..." -ForegroundColor Yellow
    Start-Service $pgService.Name
    Start-Sleep -Seconds 3
}
Write-Host "   [OK] PostgreSQL is running" -ForegroundColor Green

# Step 2: Check/Create Database
Write-Host ""
Write-Host "[2/6] Setting up database..." -ForegroundColor Yellow

# Check if database exists
$dbExists = & $PSQL -U postgres -lqt | Select-String -Pattern "ibha"

if (-not $dbExists) {
    Write-Host "   Creating database 'ibha'..." -ForegroundColor Yellow
    & $PSQL -U postgres -c "CREATE DATABASE ibha;"
    Write-Host "   [OK] Database created" -ForegroundColor Green
} else {
    Write-Host "   [OK] Database 'ibha' already exists" -ForegroundColor Green
}

# Step 3: Load Schema and Data
Write-Host ""
Write-Host "[3/6] Loading schema and seed data..." -ForegroundColor Yellow

# Check if data is already loaded
$recordCount = & $PSQL -U postgres -d ibha -t -c "SELECT COUNT(*) FROM \"CaseMaster\";" 2>$null

if ($LASTEXITCODE -ne 0 -or $recordCount -eq 0) {
    Write-Host "   Loading init_db.sql..." -ForegroundColor Yellow
    & $PSQL -U postgres -d ibha -f "$PROJECT_ROOT\catalyst\datastore\init_db.sql" | Out-Null
    
    Write-Host "   Loading schema_official_ksp.sql..." -ForegroundColor Yellow
    & $PSQL -U postgres -d ibha -f "$PROJECT_ROOT\catalyst\datastore\schema_official_ksp.sql" | Out-Null
    
    Write-Host "   Loading seed_data.sql..." -ForegroundColor Yellow
    & $PSQL -U postgres -d ibha -f "$PROJECT_ROOT\catalyst\datastore\seed_data.sql" | Out-Null
    
    Write-Host "   [OK] Schema and data loaded" -ForegroundColor Green
} else {
    Write-Host "   [OK] Data already loaded" -ForegroundColor Green
}

# Verify data
$caseCount = (& $PSQL -U postgres -d ibha -t -c "SELECT COUNT(*) FROM \"CaseMaster\";").Trim()
$userCount = (& $PSQL -U postgres -d ibha -t -c "SELECT COUNT(*) FROM users;").Trim()

Write-Host "   → $caseCount FIRs loaded" -ForegroundColor Cyan
Write-Host "   → $userCount users loaded" -ForegroundColor Cyan

# Step 4: Check Python Dependencies
Write-Host ""
Write-Host "[4/6] Checking Python dependencies..." -ForegroundColor Yellow

$pythonDeps = @("flask", "flask-cors", "psycopg2", "jwt")
$missingDeps = @()

foreach ($dep in $pythonDeps) {
    $installed = python -c "import $dep" 2>$null
    if ($LASTEXITCODE -ne 0) {
        $missingDeps += $dep
    }
}

if ($missingDeps.Count -gt 0) {
    Write-Host "   Installing missing Python packages..." -ForegroundColor Yellow
    pip install flask flask-cors psycopg2-binary PyJWT | Out-Null
    Write-Host "   [OK] Python dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   [OK] All Python dependencies installed" -ForegroundColor Green
}

# Step 5: Check Frontend Dependencies
Write-Host ""
Write-Host "[5/6] Checking frontend dependencies..." -ForegroundColor Yellow

if (-not (Test-Path "$PROJECT_ROOT\web\node_modules")) {
    Write-Host "   Installing npm packages (this may take a minute)..." -ForegroundColor Yellow
    Set-Location "$PROJECT_ROOT\web"
    npm install --silent | Out-Null
    Set-Location $PROJECT_ROOT
    Write-Host "   [OK] Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   [OK] Frontend dependencies already installed" -ForegroundColor Green
}

# Step 6: Start Services
Write-Host ""
Write-Host "[6/6] Starting services..." -ForegroundColor Yellow
Write-Host ""

Write-Host "============================================================" -ForegroundColor Green
Write-Host "   SETUP COMPLETE!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Starting Ibha services in 3 seconds..." -ForegroundColor Cyan
Write-Host ""
Write-Host "THREE WINDOWS WILL OPEN:" -ForegroundColor Yellow
Write-Host "   1. Backend API Server (http://localhost:8000)" -ForegroundColor Cyan
Write-Host "   2. Frontend Dev Server (http://localhost:3000)" -ForegroundColor Cyan
Write-Host "   3. Browser (Auto-opens to http://localhost:3000)" -ForegroundColor Cyan
Write-Host ""
Write-Host "DO NOT CLOSE THOSE WINDOWS!" -ForegroundColor Red
Write-Host ""
Write-Host "To stop Ibha: Close all three windows or press Ctrl+C" -ForegroundColor Yellow
Write-Host ""

Start-Sleep -Seconds 3

# Start Backend in new window
Write-Host "Starting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PROJECT_ROOT'; python local_server.py"

# Wait for backend to start
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start Frontend in new window
Write-Host "Starting frontend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PROJECT_ROOT\web'; npm run dev"

# Wait for frontend to start
Write-Host "Waiting for frontend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Open browser
Write-Host "Opening browser..." -ForegroundColor Yellow
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "   IBHA IS NOW RUNNING!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "LOGIN CREDENTIALS:" -ForegroundColor Cyan
Write-Host "   Email:    rajesh.kumar@ksp.gov.in" -ForegroundColor White
Write-Host "   Password: password123" -ForegroundColor White
Write-Host ""
Write-Host "OTHER TEST USERS:" -ForegroundColor Cyan
Write-Host "   DSP:      lakshmi.rao@ksp.gov.in / password123" -ForegroundColor White
Write-Host "   Admin:    admin.system@ksp.gov.in / password123" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to close this setup window..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
