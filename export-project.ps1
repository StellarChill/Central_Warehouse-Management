# Simple Clean Export Script

$zipFile = ".\sai-jai-source-code.zip"
if (Test-Path $zipFile) { Remove-Item $zipFile }

Write-Host "� Creating export package..."

# Create a temporary folder inside current dir to avoid permission issues
$tempDir = ".\temp_export"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Function to copy folder excluding node_modules
function Copy-Clean($folder) {
    if (Test-Path $folder) {
        Write-Host "   - Copying $folder..."
        # Use robocopy because it's fast and handles exclusions well
        # /E = recursive, /XD = exclude dirs, /XF = exclude files, /NFL/NDL = quiet
        $dest = "$tempDir\$folder"
        robocopy $folder $dest /E /XD node_modules .git dist .next build /XF .env *.log *.zip /NFL /NDL /NJH /NJS
    }
}

Copy-Clean "frontend"
Copy-Clean "backend"

# Copy root files
Get-ChildItem -File | Where-Object { $_.Name -notmatch ".zip$" -and $_.Name -notmatch ".log$" } | ForEach-Object {
    Copy-Item $_.FullName $tempDir
}

Write-Host "🗜️ Zipping..."
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipFile

Write-Host "🧹 Cleaning up..."
Remove-Item $tempDir -Recurse -Force

Write-Host ""
Write-Host "✅ DONE! File created: $zipFile" -ForegroundColor Green
Write-Host "👉 Upload this file to Lovable or use it for backup."
