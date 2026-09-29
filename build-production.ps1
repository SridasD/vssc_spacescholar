<#
.SYNOPSIS
    Runs a real production build locally as a pre-flight check (npm ci + next
    build, failing loudly on any error), then — unless -SkipPackage is passed —
    packages the SOURCE tree into a zip for transfer to a server that will run
    its own `npm ci && npm run build` (the deploy target has no git access, so
    source has to be hand-carried rather than `git pull`-ed).

    This deliberately does NOT ship the locally-built .next — the target server
    rebuilds from source itself, so a Windows-built .next would be dead weight
    at best. The local build here exists purely to catch a broken build BEFORE
    shipping source over, rather than finding out only after DevOps runs it.

    Unlike the retired create-backup*.ps1 scripts (now in legacy-scripts/, git-ignored),
    which only zip up an *already-built* .next folder (the opposite use case —
    a pre-built artifact for a server that just runs `next start`), this script
    fails loudly (non-zero exit code) on any build error instead of silently
    continuing with a partial/incomplete result.

.PARAMETER ProjectName
    Name used in the output zip filename. Auto-detected from the current folder
    name if not specified.

.PARAMETER SkipInstall
    Skip the `npm ci` step (e.g. when dependencies haven't changed since the last run).

.PARAMETER SkipPackage
    Stop after the local build check; don't produce a source zip.

.PARAMETER IncludeEnvFile
    Bundle .env.production into the source zip. Off by default — a
    secrets-bearing file should be opted into a zip explicitly, not included
    by default the way the older backup scripts do.
#>
param (
    [string]$ProjectName = "",
    [switch]$SkipInstall,
    [switch]$SkipPackage,
    [switch]$IncludeEnvFile
)

$ErrorActionPreference = "Stop"

function Invoke-Checked {
    param([string]$Command, [string[]]$CommandArgs)
    Write-Host "> $Command $($CommandArgs -join ' ')" -ForegroundColor DarkGray
    & $Command @CommandArgs
    if ($LASTEXITCODE -ne 0) {
        throw "'$Command $($CommandArgs -join ' ')' failed with exit code $LASTEXITCODE"
    }
}

try {
    $currentDir = (Get-Location).Path

    if ([string]::IsNullOrEmpty($ProjectName)) {
        $ProjectName = (Get-Item -Path $currentDir).Name
        Write-Host "Auto-detected project name: $ProjectName" -ForegroundColor Cyan
    }

    if (-not (Test-Path -Path (Join-Path $currentDir "package.json"))) {
        throw "No package.json found in $currentDir — run this script from the project root."
    }

    # ---- Install ----
    if (-not $SkipInstall) {
        Write-Host "`n==> Installing dependencies (npm ci)" -ForegroundColor Cyan
        Invoke-Checked "npm" @("ci")
    }
    else {
        Write-Host "`n==> Skipping install (-SkipInstall)" -ForegroundColor Yellow
    }

    # ---- Build ----
    Write-Host "`n==> Building for production (npm run build)" -ForegroundColor Cyan
    $env:NODE_ENV = "production"
    Invoke-Checked "npm" @("run", "build")

    $buildIdPath = Join-Path $currentDir ".next\BUILD_ID"
    if (-not (Test-Path -Path $buildIdPath)) {
        throw "Build reported success but .next\BUILD_ID is missing — treating this as a failed build."
    }
    Write-Host "Build succeeded locally (BUILD_ID: $(Get-Content $buildIdPath)) — safe to ship source" -ForegroundColor Green

    if ($SkipPackage) {
        Write-Host "`n==> Skipping packaging (-SkipPackage)" -ForegroundColor Yellow
        exit 0
    }

    # ---- Package (source, for the target server's own npm ci && npm run build) ----
    Write-Host "`n==> Packaging source zip" -ForegroundColor Cyan

    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $parentDir = Split-Path -Parent $currentDir
    $backupDirectory = Join-Path -Path $parentDir -ChildPath "Backup"

    if (-not (Test-Path -Path $backupDirectory)) {
        New-Item -Path $backupDirectory -ItemType Directory -Force | Out-Null
        Write-Host "Created backup directory: $backupDirectory" -ForegroundColor Yellow
    }

    # Everything except what the target build doesn't need / shouldn't have:
    # node_modules and .next get rebuilt on the server; .git isn't needed since
    # this is a hand-carried copy, not a clone; Backup/staging/source_* are this
    # script's own output from current or previous runs; .env* and certificates
    # are environment-specific config the server manages itself, not source
    # (opt .env.production back in individually below if actually needed);
    # uploaded_files is real application data (user-uploaded documents), not
    # source — bundling it would also risk overwriting whatever's already live
    # on the server with this machine's local/test uploads.
    # docs holds internal reports (e.g. VAPT scans) and legacy-scripts holds
    # retired scripts — neither belongs on the server.
    $excludedNames = @('node_modules', '.git', '.next', 'Backup', 'certificates', 'uploaded_files', 'docs', 'legacy-scripts')
    $excludedPatterns = @('staging_*', 'source_*', '.env*')

    $stagingDir = Join-Path -Path $parentDir -ChildPath "source_$timestamp"
    New-Item -Path $stagingDir -ItemType Directory -Force | Out-Null

    Get-ChildItem -Path $currentDir -Force | Where-Object {
        $name = $_.Name
        ($excludedNames -notcontains $name) -and
        (-not ($excludedPatterns | Where-Object { $name -like $_ }))
    } | Copy-Item -Destination $stagingDir -Recurse -Force

    if ($IncludeEnvFile) {
        $envPath = Join-Path -Path $currentDir -ChildPath ".env.production"
        if (Test-Path -Path $envPath) {
            Copy-Item -Path $envPath -Destination $stagingDir -Force
            Write-Host "Including .env.production (-IncludeEnvFile was passed)" -ForegroundColor Yellow
        }
        else {
            Write-Host ".env.production not found — nothing to include" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "Not including any .env file (pass -IncludeEnvFile to bundle .env.production)" -ForegroundColor Yellow
    }

    $sourceZipPath = Join-Path -Path $backupDirectory -ChildPath "${ProjectName}_source_$timestamp.zip"
    Compress-Archive -Path "$stagingDir\*" -DestinationPath $sourceZipPath -Force
    Remove-Item -Path $stagingDir -Recurse -Force

    $zipSizeMb = [math]::Round((Get-Item $sourceZipPath).Length / 1MB, 2)
    Write-Host "`nSource package created: $sourceZipPath ($zipSizeMb MB)" -ForegroundColor Green
    Write-Host "On the server: unzip, then run 'npm ci && npm run build' followed by 'npm start' / your PM2 restart." -ForegroundColor Cyan
}
catch {
    Write-Host "`nBUILD FAILED: $_" -ForegroundColor Red
    if ($stagingDir -and (Test-Path -Path $stagingDir)) {
        Remove-Item -Path $stagingDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    exit 1
}
