# setup-postgres.ps1
# Automates setting up a local, zero-install portable PostgreSQL 16 server for Euroshub Kitchen on Windows

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$PgDir = Join-Path $RootDir ".postgres"
$PgBinDir = Join-Path $PgDir "pgsql\bin"
$PgDataDir = Join-Path $PgDir "data"
$PgLogFile = Join-Path $PgDir "postgres.log"

Write-Host "==> Checking PostgreSQL installation for Euroshub Kitchen..." -ForegroundColor Cyan

if (-not (Test-Path $PgDir)) {
    New-Item -ItemType Directory -Path $PgDir -Force | Out-Null
}

$PgCtl = Join-Path $PgBinDir "pg_ctl.exe"
$InitDb = Join-Path $PgBinDir "initdb.exe"
$Createdb = Join-Path $PgBinDir "createdb.exe"
$Psql = Join-Path $PgBinDir "psql.exe"

if (-not (Test-Path $PgCtl)) {
    Write-Host "==> Downloading portable PostgreSQL 16.3 binaries (Official EnterpriseDB)..." -ForegroundColor Yellow
    $ZipPath = Join-Path $PgDir "postgresql-binaries.zip"
    $DownloadUrl = "https://get.enterprisedb.com/postgresql/postgresql-16.3-1-windows-x64-binaries.zip"
    
    curl.exe -L $DownloadUrl -o $ZipPath
    
    Write-Host "==> Extracting PostgreSQL binaries to $PgDir..." -ForegroundColor Yellow
    Expand-Archive -Path $ZipPath -DestinationPath $PgDir -Force
    Remove-Item -Path $ZipPath -Force
    Write-Host "==> Extraction completed." -ForegroundColor Green
}

if (-not (Test-Path $PgDataDir)) {
    Write-Host "==> Initializing PostgreSQL database cluster in $PgDataDir..." -ForegroundColor Yellow
    & $InitDb -D $PgDataDir -U postgres -A trust --encoding=UTF8
    Write-Host "==> Database cluster initialized." -ForegroundColor Green
}

# Check if PostgreSQL is already running on port 5432
$Running = $false
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $tcp.Connect("127.0.0.1", 5432)
    $Running = $true
    $tcp.Close()
} catch {
    $Running = $false
}

if (-not $Running) {
    Write-Host "==> Starting PostgreSQL server on localhost:5432..." -ForegroundColor Yellow
    & $PgCtl -D $PgDataDir -l $PgLogFile -w start
    Write-Host "==> PostgreSQL server started." -ForegroundColor Green
} else {
    Write-Host "==> PostgreSQL is already running on port 5432." -ForegroundColor Green
}

# Create database if not exists
Write-Host "==> Ensuring database 'euroshub_kitchen' exists..." -ForegroundColor Yellow
& $Psql -U postgres -h 127.0.0.1 -p 5432 -tc "SELECT 1 FROM pg_database WHERE datname = 'euroshub_kitchen'" | Out-String -OutVariable dbExists
if ($dbExists -notmatch "1") {
    & $Createdb -U postgres -h 127.0.0.1 -p 5432 euroshub_kitchen
    Write-Host "==> Database 'euroshub_kitchen' created successfully." -ForegroundColor Green
} else {
    Write-Host "==> Database 'euroshub_kitchen' already exists." -ForegroundColor Green
}

# Set password for postgres user to match .env.example
& $Psql -U postgres -h 127.0.0.1 -p 5432 -c "ALTER USER postgres WITH PASSWORD 'postgrespassword';" | Out-Null
Write-Host "==> PostgreSQL setup complete and ready for Euroshub Kitchen!" -ForegroundColor Green
