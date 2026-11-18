# CARMART Perth Broker Portal -- backup-first DEV/TEST finance reset.
# Run from project root. Requires PostgreSQL CLI: pg_dump, pg_restore, psql.
# Does NOT read .env automatically. Supply DATABASE_URL in this terminal.
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Require-Tool([string]$name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Missing '$name'. Install PostgreSQL client tools and add them to PATH."
  }
}
Require-Tool 'pg_dump'
Require-Tool 'pg_restore'
Require-Tool 'psql'

if (-not $env:DATABASE_URL) { throw 'DATABASE_URL is not set in this PowerShell session. Stop; do not guess the database.' }
if ($env:NODE_ENV -eq 'production') { throw 'Refusing reset with NODE_ENV=production.' }

$projectRoot = (Get-Location).Path
$sqlPath = Join-Path $PSScriptRoot 'reset-finance-test-data.sql'
if (-not (Test-Path -LiteralPath $sqlPath)) { throw "Missing $sqlPath. Keep both scripts together." }
if (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'prisma/schema.prisma'))) {
  throw 'Run this from your Carmart project root (prisma/schema.prisma missing).'
}

$dbNameOutput = & psql --no-psqlrc --dbname $env:DATABASE_URL --no-align --tuples-only --command 'SELECT current_database();'
if ($LASTEXITCODE -ne 0) { throw 'Could not connect to database; no changes made.' }
$dbName = ($dbNameOutput | Out-String).Trim()
if (-not $dbName) { throw 'Could not identify database; no changes made.' }
Write-Host "Connected database name: $dbName" -ForegroundColor Yellow
Write-Warning 'ONLY use against a disposable DEVELOPMENT/TEST database. ALL finance applications and associated finance-test data will be deleted.'

$typedDbName = Read-Host 'Type the database name displayed above to verify the target'
if ($typedDbName -cne $dbName) { throw 'Database-name confirmation failed; no changes made.' }

# Backups are stored OUTSIDE the project repository.
$backupParent = Join-Path (Split-Path -Parent $projectRoot) 'carmart-secure-backups'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupFolder = Join-Path $backupParent "finance-reset-$stamp"
New-Item -ItemType Directory -Force -Path $backupFolder | Out-Null
$dbBackup = Join-Path $backupFolder 'database-before-reset.dump'
$keyManifest = Join-Path $backupFolder 'finance-document-storage-keys.txt'
Write-Host "Backup folder: $backupFolder"

& pg_dump --dbname $env:DATABASE_URL --format=custom --no-owner --no-privileges --file $dbBackup
if ($LASTEXITCODE -ne 0 -or -not (Test-Path $dbBackup) -or (Get-Item $dbBackup).Length -eq 0) {
  throw 'Database backup failed/empty. No rows deleted.'
}
& pg_restore --list $dbBackup | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Database backup failed archive-list validation. No rows deleted.' }
Write-Host 'Database archive created and archive list checked (not a full restore test).' -ForegroundColor Green

# Save a manifest of just the files referenced by finance documents.
$keys = @('SELECT "storageKey" FROM "FinanceDocument" ORDER BY "storageKey";' | & psql --no-psqlrc --dbname $env:DATABASE_URL --no-align --tuples-only --set ON_ERROR_STOP=1)
if ($LASTEXITCODE -ne 0) { throw 'Could not export file keys. No rows deleted.' }
$keys | Set-Content -LiteralPath $keyManifest -Encoding utf8

# Preserve the current private file directory before any database deletion.
$privateUploads = Join-Path $projectRoot 'private-uploads'
if (Test-Path -LiteralPath $privateUploads) {
  Copy-Item -LiteralPath $privateUploads -Destination (Join-Path $backupFolder 'private-uploads-backup') -Recurse -Force
  Write-Host 'Private upload directory backed up.' -ForegroundColor Green
} else {
  Write-Warning 'No private-uploads directory was found; DB backup still available.'
}

Write-Host 'SQL will delete finance applications, their docs/history/consent, finance-link SMS, and finance prefills.'
Write-Host 'It will PRESERVE accounts, broker PDF templates, database schema and legacy CRM.'
$phrase = Read-Host 'For final confirmation type: DELETE ALL TEST FINANCE DATA'
if ($phrase -cne 'DELETE ALL TEST FINANCE DATA') { throw 'Confirmation mismatch; no data deleted.' }

# One transaction: on any SQL error, psql stops and PostgreSQL rolls back.
& psql --no-psqlrc --dbname $env:DATABASE_URL --set ON_ERROR_STOP=1 --file $sqlPath
if ($LASTEXITCODE -ne 0) { throw 'SQL cleanup failed; check database state. Backup remains intact.' }
Write-Host 'Finance database records deleted.' -ForegroundColor Green

# Move only invoice/supporting-document files identified BEFORE SQL deletion
# out of the active private-uploads folder. Files remain recoverable in backup.
$quarantine = Join-Path $backupFolder 'removed-from-active-uploads'
New-Item -ItemType Directory -Force -Path $quarantine | Out-Null
$moved = 0
$failed = 0
foreach ($key in $keys) {
  $key = ([string]$key).Trim()
  if ($key -notmatch '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$') { continue }
  $source = Join-Path $privateUploads $key
  if (Test-Path -LiteralPath $source -PathType Leaf) {
    try {
      Move-Item -LiteralPath $source -Destination (Join-Path $quarantine $key) -ErrorAction Stop
      $moved++
    } catch {
      $failed++
      Write-Warning "Could not move one file with storage key $key. Check manually."
    }
  }
}
Write-Host "Done. Removed $moved finance files from active storage; failures: $failed"
Write-Host "KEEP THIS BACKUP SECURE: $backupFolder" -ForegroundColor Yellow
Write-Host 'Verify zero applications in Prisma Studio and confirm user accounts/templates and legacy CRM remain.'
