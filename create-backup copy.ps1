# Create a timestamp for the filename
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

# Create Backup folder if it doesn't exist
if (-not (Test-Path -Path "Backup")) {
    New-Item -Path "Backup" -ItemType Directory
}

# Create regular backup
Compress-Archive -Path .next, public, package.json, next.config.js -DestinationPath "Backup/spc_v4_$timestamp.zip" -Force
Write-Host "Regular backup created: Backup/spc_v4_$timestamp.zip" -ForegroundColor Green

# Create complete project backup using compatible method
$tempDir = "temp_archive_$timestamp"
New-Item -Path $tempDir -ItemType Directory

# Copy files to temp directory, but filter out the temp directory itself along with node_modules and .git
Get-ChildItem -Path . | Where-Object { 
    $_.Name -ne "node_modules" -and 
    $_.Name -ne ".git" -and 
    $_.Name -ne $tempDir 
} | Copy-Item -Destination $tempDir -Recurse

# Create zip from temp directory
Compress-Archive -Path "$tempDir\*" -DestinationPath "Backup/complete_project_spc_v4_$timestamp.zip" -Force

# Clean up temp directory
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "Complete project backup created: Backup/complete_project_spc_v4_$timestamp.zip" -ForegroundColor Blue