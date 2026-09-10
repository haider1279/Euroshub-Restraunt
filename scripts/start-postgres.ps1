# start-postgres.ps1
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$PgDir = Join-Path $RootDir ".postgres"
$PgBinDir = Join-Path $PgDir "pgsql\bin"
$PgDataDir = Join-Path $PgDir "data"
$PgLogFile = Join-Path $PgDir "postgres.log"
$PgCtl = Join-Path $PgBinDir "pg_ctl.exe"

if (Test-Path $PgCtl) {
    & $PgCtl -D $PgDataDir -l $PgLogFile -w start
} else {
    powershell -ExecutionPolicy Bypass -File (Join-Path $ScriptDir "setup-postgres.ps1")
}
