# Outlook Email AI Assistant - Production Sideloading Scrip    Write-Host "2. Settings -> View all Outlook settings -> General -> Manage add-ins" -ForegroundColor White
    Write-Host "3. Click 'Add a custom add-in' -> 'Add from file'" -ForegroundColor White
# This script prepares the manifest file for sideloading in Outlook

Write-Host "Outlook Email AI Assistant - Production Sideloading" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green

# Check if manifest file exists
$manifestPath = ".\public\manifest.xml"
if (Test-Path $manifestPath) {
    Write-Host "✓ Manifest file found: $manifestPath" -ForegroundColor Green
    
    # Copy to temp directory for easy access
    $tempPath = "$env:TEMP\outlook-ai-assistant-manifest.xml"
    Copy-Item $manifestPath $tempPath -Force
    Write-Host "✓ Manifest copied to: $tempPath" -ForegroundColor Green
    
    # Test CloudFront URLs
    Write-Host "`nTesting CloudFront deployment..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri "https://d343wke1xouc9b.cloudfront.net" -UseBasicParsing -TimeoutSec 10
        Write-Host "✓ Main app URL is accessible" -ForegroundColor Green
    } catch {
        Write-Host "✗ Main app URL failed: $_" -ForegroundColor Red
    }
    
    try {
        $response = Invoke-WebRequest -Uri "https://d343wke1xouc9b.cloudfront.net/manifest.xml" -UseBasicParsing -TimeoutSec 10
        Write-Host "✓ Manifest URL is accessible" -ForegroundColor Green
    } catch {
        Write-Host "✗ Manifest URL failed: $_" -ForegroundColor Red
    }
    
    try {
        $response = Invoke-WebRequest -Uri "https://d343wke1xouc9b.cloudfront.net/assets/icon-32.png" -UseBasicParsing -TimeoutSec 10
        Write-Host "✓ Icon URLs are accessible" -ForegroundColor Green
    } catch {
        Write-Host "✗ Icon URLs failed: $_" -ForegroundColor Red
    }
    
    # Open temp folder
    Write-Host "`nOpening temporary folder..." -ForegroundColor Yellow
    explorer "$env:TEMP"
    
    Write-Host "`n" -ForegroundColor Green
    Write-Host "SIDELOADING INSTRUCTIONS:" -ForegroundColor Green
    Write-Host "=========================" -ForegroundColor Green
    Write-Host "1. Open Microsoft Outlook" -ForegroundColor White
    Write-Host "2. Go to File -> Manage Add-ins" -ForegroundColor White
    Write-Host "3. Click 'My add-ins'" -ForegroundColor White
    Write-Host "4. Click 'Add a custom add-in'" -ForegroundColor White
    Write-Host "5. Choose 'Add from file'" -ForegroundColor White
    Write-Host "6. Select the manifest file from the opened folder:" -ForegroundColor White
    Write-Host "   $tempPath" -ForegroundColor Cyan
    Write-Host "7. Click 'Install'" -ForegroundColor White
    Write-Host "`n" -ForegroundColor Green
    Write-Host "ALTERNATIVE (Outlook Web App):" -ForegroundColor Green
    Write-Host "==============================" -ForegroundColor Green
    Write-Host "1. Open https://outlook.live.com or https://outlook.office.com" -ForegroundColor White
    Write-Host "2. Settings → View all Outlook settings → General → Manage add-ins" -ForegroundColor White
    Write-Host "3. Click 'Add a custom add-in' -> 'Add from file'" -ForegroundColor White
    Write-Host "4. Upload the manifest file" -ForegroundColor White
    Write-Host "`n" -ForegroundColor Green
    Write-Host "Production URL: https://d343wke1xouc9b.cloudfront.net" -ForegroundColor Cyan
    Write-Host "GitHub Repo: https://github.com/dstaulcu/outlook_email_assistant" -ForegroundColor Cyan
    
} else {
    Write-Host "✗ Manifest file not found: $manifestPath" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory" -ForegroundColor Red
}
