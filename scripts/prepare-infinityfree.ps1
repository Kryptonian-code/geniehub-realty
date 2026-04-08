$ErrorActionPreference = "Stop"

function Write-Step($message) {
    Write-Host ""
    Write-Host "==> $message" -ForegroundColor Cyan
}

function Ensure-Directory($path) {
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path | Out-Null
    }
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$distPath = Join-Path $projectRoot "dist"
$deployRoot = Join-Path $projectRoot "deploy\infinityfree"
$backendSource = Join-Path $projectRoot "backend"
$backendTarget = Join-Path $deployRoot "backend"
$uploadsTarget = Join-Path $deployRoot "uploads"
$templatesPath = Join-Path $projectRoot "scripts\templates"
$phpPath = "C:\xampp\php\php.exe"

Write-Step "Generating sitemap"
if (Test-Path $phpPath) {
    try {
        & $phpPath (Join-Path $projectRoot "backend\scripts\generate-sitemap.php") | Out-Host
    } catch {
        Write-Warning "Sitemap generation skipped: $($_.Exception.Message)"
    }
} else {
    Write-Warning "Sitemap generation skipped because PHP was not found at $phpPath"
}

Write-Step "Building production frontend"
Push-Location $projectRoot
try {
    npm.cmd run build | Out-Host
    if ($LASTEXITCODE -ne 0) {
        throw "Frontend build failed with exit code $LASTEXITCODE"
    }
} finally {
    Pop-Location
}

if (-not (Test-Path $distPath)) {
    throw "Build output not found at $distPath"
}

Write-Step "Preparing deploy/infinityfree"
Ensure-Directory $deployRoot

Get-ChildItem -Force $deployRoot | Remove-Item -Recurse -Force

Write-Step "Copying frontend build"
Copy-Item (Join-Path $distPath "*") $deployRoot -Recurse -Force

if (Test-Path (Join-Path $projectRoot "public\robots.txt")) {
    Copy-Item (Join-Path $projectRoot "public\robots.txt") (Join-Path $deployRoot "robots.txt") -Force
}

if (Test-Path (Join-Path $projectRoot "public\placeholder.svg")) {
    Copy-Item (Join-Path $projectRoot "public\placeholder.svg") (Join-Path $deployRoot "placeholder.svg") -Force
}

Write-Step "Copying backend"
Copy-Item $backendSource $backendTarget -Recurse -Force

if (Test-Path (Join-Path $projectRoot "database.sql")) {
    Copy-Item (Join-Path $projectRoot "database.sql") (Join-Path $backendTarget "database.sql") -Force
}

Write-Step "Writing InfinityFree support files"
Copy-Item (Join-Path $templatesPath "infinityfree-root.htaccess") (Join-Path $deployRoot ".htaccess") -Force

if (Test-Path (Join-Path $templatesPath "infinityfree.backend.htaccess")) {
    Copy-Item (Join-Path $templatesPath "infinityfree.backend.htaccess") (Join-Path $backendTarget ".htaccess") -Force
}

Ensure-Directory $uploadsTarget

if (Test-Path (Join-Path $templatesPath "infinityfree.uploads.htaccess")) {
    Copy-Item (Join-Path $templatesPath "infinityfree.uploads.htaccess") (Join-Path $uploadsTarget ".htaccess") -Force
}

$indexHtml = Join-Path $deployRoot "index.html"
$notFoundHtml = Join-Path $deployRoot "404.html"
if (Test-Path $indexHtml) {
    Copy-Item $indexHtml $notFoundHtml -Force
}

Write-Step "Cleaning backend leftovers"
$cleanupTargets = @(
    (Join-Path $backendTarget "error.log"),
    (Join-Path $backendTarget "README.md"),
    (Join-Path $backendTarget "scripts\__pycache__")
)

foreach ($cleanupTarget in $cleanupTargets) {
    if (Test-Path $cleanupTarget) {
        Remove-Item $cleanupTarget -Recurse -Force
    }
}

Write-Step "Preparing uploads"
$uploadFolders = @(
    (Join-Path $uploadsTarget "property-images"),
    (Join-Path $uploadsTarget "agent-photos"),
    (Join-Path $uploadsTarget "blog-images")
)

foreach ($uploadFolder in $uploadFolders) {
    Ensure-Directory $uploadFolder
    $gitkeep = Join-Path $uploadFolder ".gitkeep"
    if (-not (Test-Path $gitkeep)) {
        New-Item -ItemType File -Path $gitkeep | Out-Null
    }
}

Write-Step "InfinityFree bundle ready"
Write-Host "Upload the contents of:" -ForegroundColor White
Write-Host "  $deployRoot" -ForegroundColor Green
Write-Host ""
Write-Host "Expected folders:" -ForegroundColor White
Write-Host "  assets/" -ForegroundColor Green
Write-Host "  backend/" -ForegroundColor Green
Write-Host "  uploads/property-images/" -ForegroundColor Green
Write-Host "  uploads/agent-photos/" -ForegroundColor Green
Write-Host "  uploads/blog-images/" -ForegroundColor Green
