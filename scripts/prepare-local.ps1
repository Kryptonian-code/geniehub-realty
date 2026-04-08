$ErrorActionPreference = "Stop"

function Write-Step($message) {
    Write-Host ""
    Write-Host "==> $message" -ForegroundColor Cyan
}

function Write-Ok($message) {
    Write-Host "  [ok] $message" -ForegroundColor Green
}

function Write-WarnMessage($message) {
    Write-Host "  [warn] $message" -ForegroundColor Yellow
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$phpPath = "C:\xampp\php\php.exe"
$mysqlPath = "C:\xampp\mysql\bin\mysql.exe"
$databaseName = "geniehub_realty"
$schemaRoot = Join-Path $projectRoot "database.sql"
$schemaMigration = Join-Path $projectRoot "backend\migrations\database.sql"

Write-Step "Checking project location"
if ($projectRoot -notlike "C:\xampp\htdocs\*") {
    Write-WarnMessage "Project is not under C:\xampp\htdocs. Current path: $projectRoot"
} else {
    Write-Ok "Project is inside XAMPP htdocs"
}

Write-Step "Checking required local tools"
if (Test-Path $phpPath) {
    Write-Ok "Found PHP at $phpPath"
} else {
    Write-WarnMessage "PHP was not found at $phpPath"
}

if (Test-Path $mysqlPath) {
    Write-Ok "Found MySQL client at $mysqlPath"
} else {
    Write-WarnMessage "MySQL client was not found at $mysqlPath"
}

Write-Step "Checking SQL files"
if (Test-Path $schemaRoot) {
    Write-Ok "Found root schema file"
} else {
    throw "Missing database.sql in project root."
}

if (Test-Path $schemaMigration) {
    Write-Ok "Found backend migration schema file"
} else {
    Write-WarnMessage "Missing backend migration schema file"
}

Write-Step "Linting PHP auth entry points"
if (Test-Path $phpPath) {
    & $phpPath -l (Join-Path $projectRoot "backend\config.php")
    & $phpPath -l (Join-Path $projectRoot "backend\api\auth.php")
}

Write-Step "Helpful next steps"
Write-Host "  1. Start Apache and MySQL from XAMPP Control Panel." -ForegroundColor White
Write-Host "  2. Import database.sql into phpMyAdmin using database name '$databaseName'." -ForegroundColor White
Write-Host "  3. Run 'npm install' if node_modules is missing." -ForegroundColor White
Write-Host "  4. Run 'npm run dev' and open http://localhost:5173/admin/login" -ForegroundColor White
Write-Host "  5. Create the first admin account from the login screen." -ForegroundColor White

Write-Step "Preparation check complete"
Write-Ok "Local setup helper finished"
