# PowerShell script to copy manifest to temp folder for easy sideloading
Write-Host "PromptReply Manifest Sideloading Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Create temp directory
$tempDir = "$env:TEMP\PromptReply"
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# Copy manifest
Copy-Item -Path ".\public\manifest.xml" -Destination "$tempDir\manifest.xml"

Write-Host "Manifest copied to: $tempDir\manifest.xml" -ForegroundColor Green
Write-Host ""
Write-Host "To sideload in Outlook:" -ForegroundColor Yellow
Write-Host "1. Open Outlook (Desktop or Web)" -ForegroundColor White
Write-Host "2. Go to Home tab > Get Add-ins > My add-ins" -ForegroundColor White
Write-Host "3. Click 'Add from file' and select the manifest.xml from:" -ForegroundColor White
Write-Host "   $tempDir\manifest.xml" -ForegroundColor Cyan
Write-Host ""
Write-Host "CloudFront URL: https://d343wke1xouc9b.cloudfront.net" -ForegroundColor Green
Write-Host "Manifest location: $tempDir\manifest.xml" -ForegroundColor Green
Write-Host ""
Write-Host "Opening temp folder..." -ForegroundColor Yellow
Start-Process -FilePath "explorer.exe" -ArgumentList $tempDir
