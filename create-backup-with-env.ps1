param (
    [string]$ProjectName = ""  # Empty by default, will be auto-detected if not specified
)

# Create a timestamp for the filename
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

# Get current directory and construct parent directory path
$currentDir = (Get-Location).Path
$parentDir = Split-Path -Parent $currentDir

# Auto-detect project name from current directory if not specified
if ([string]::IsNullOrEmpty($ProjectName)) {
    $ProjectName = (Get-Item -Path $currentDir).Name
    Write-Host "Auto-detected project name: $ProjectName" -ForegroundColor Cyan
}
else {
    Write-Host "Using specified project name: $ProjectName" -ForegroundColor Cyan
}

# Define backup directory in parent folder
$backupDirectory = Join-Path -Path $parentDir -ChildPath "Backup"
Write-Host "Using backup directory: $backupDirectory" -ForegroundColor Cyan

# Create Backup folder in parent directory if it doesn't exist
if (-not (Test-Path -Path $backupDirectory)) {
    New-Item -Path $backupDirectory -ItemType Directory -Force
    Write-Host "Created Backup directory in parent folder: $backupDirectory" -ForegroundColor Yellow
}

# Define essential files for PM2 deployment (with full paths)
$essentialFilePaths = @()
$essentialFiles = @('.next', 'public', 'package.json', 'package-lock.json', 'next.config.js')

# Add only .env.production file
$envFile = ".env.production"
if (Test-Path -Path (Join-Path -Path $currentDir -ChildPath $envFile)) {
    $essentialFiles += $envFile
    Write-Host "Including environment file: .env.production" -ForegroundColor Yellow
}

foreach ($file in $essentialFiles) {
    $fullPath = Join-Path -Path $currentDir -ChildPath $file
    if (Test-Path -Path $fullPath) {
        $essentialFilePaths += $fullPath
    }
}

# Add optional config files if they exist
$optionalFiles = @('ecosystem.config.js', '.babelrc', 'babel.config.js', 'postcss.config.js', 'tailwind.config.js')
foreach ($file in $optionalFiles) {
    $fullPath = Join-Path -Path $currentDir -ChildPath $file
    if (Test-Path -Path $fullPath) {
        $essentialFilePaths += $fullPath
        Write-Host "Including optional file: $file" -ForegroundColor Yellow
    }
}

# Create deployment-ready backup directly in the parent's Backup folder
$deploymentZipPath = Join-Path -Path $backupDirectory -ChildPath "${ProjectName}_deployment_$timestamp.zip"
Compress-Archive -Path $essentialFilePaths -DestinationPath $deploymentZipPath -Force
Write-Host "Deployment-ready backup created in parent directory: $deploymentZipPath" -ForegroundColor Green

# Create complete project backup using compatible method
$tempDir = Join-Path -Path $parentDir -ChildPath "temp_archive_$timestamp"
New-Item -Path $tempDir -ItemType Directory -Force

# Copy files to temp directory with exclusions
Get-ChildItem -Path $currentDir -Force | Where-Object { 
    $_.Name -ne "node_modules" -and 
    $_.Name -ne ".git" -and
    $_.Name -ne "Backup"
} | Copy-Item -Destination $tempDir -Recurse -Force

# Create complete project zip directly in the parent's Backup folder
$completeZipPath = Join-Path -Path $backupDirectory -ChildPath "complete_project_${ProjectName}_$timestamp.zip"
Compress-Archive -Path "$tempDir\*" -DestinationPath $completeZipPath -Force

# Clean up temp directory
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "Complete project backup created in parent directory: $completeZipPath" -ForegroundColor Blue