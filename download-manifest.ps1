# PromptReply - Download Production Manifest
# This script downloads the production manifest from CloudFront for manual sideloading

Write-Host "PromptReply - Download Production Manifest" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# Create download directory
$downloadDir = "$env:USERPROFILE\Downloads\PromptReply"
$manifestPath = "$downloadDir\manifest.xml"

Write-Host "`nCreating download directory..." -ForegroundColor Yellow
if (!(Test-Path $downloadDir)) {
    New-Item -ItemType Directory -Path $downloadDir -Force | Out-Null
    Write-Host "✓ Created: $downloadDir" -ForegroundColor Green
} else {
    Write-Host "✓ Directory exists: $downloadDir" -ForegroundColor Green
}

# Download the production manifest
Write-Host "`nDownloading production manifest..." -ForegroundColor Yellow
$manifestUrl = "https://d343wke1xouc9b.cloudfront.net/manifest.xml"

try {
    # Download with progress
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $manifestUrl -OutFile $manifestPath -UseBasicParsing
    $ProgressPreference = 'Continue'
    
    Write-Host "✓ Downloaded successfully!" -ForegroundColor Green
    Write-Host "✓ File saved to: $manifestPath" -ForegroundColor Green
    
    # Verify the file was downloaded
    if (Test-Path $manifestPath) {
        $fileSize = (Get-Item $manifestPath).Length
        Write-Host "✓ File size: $fileSize bytes" -ForegroundColor Green
        
        # Copy file path to clipboard
        $manifestPath | Set-Clipboard
        Write-Host "✓ File path copied to clipboard!" -ForegroundColor Green
        
        # Show file contents preview
        Write-Host "`nManifest preview:" -ForegroundColor Yellow
        $content = Get-Content $manifestPath -Raw
        if ($content -match '<DisplayName[^>]*>([^<]+)</DisplayName>') {
            Write-Host "  Add-in Name: $($matches[1])" -ForegroundColor Cyan
        }
        if ($content -match '<Description[^>]*>([^<]+)</Description>') {
            Write-Host "  Description: $($matches[1])" -ForegroundColor Cyan
        }
        if ($content -match 'https://d343wke1xouc9b\.cloudfront\.net') {
            Write-Host "  CloudFront URL: ✓ Verified" -ForegroundColor Green
        }
    }
    
} catch {
    Write-Host "✗ Download failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please check your internet connection and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host "`n" -NoNewline
Write-Host "📋 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Open Outlook" -ForegroundColor White
Write-Host "2. Go to Home > Get Add-ins > My add-ins" -ForegroundColor White
Write-Host "3. Click 'Add from file'" -ForegroundColor White
Write-Host "4. Paste the file path (already in clipboard): " -NoNewline -ForegroundColor White
Write-Host "$manifestPath" -ForegroundColor Cyan
Write-Host "5. Or browse to: " -NoNewline -ForegroundColor White
Write-Host "$downloadDir" -ForegroundColor Cyan

Write-Host "`n" -NoNewline
Write-Host "📁 OPENING DOWNLOAD FOLDER..." -ForegroundColor Yellow
try {
    Start-Process -FilePath "explorer.exe" -ArgumentList $downloadDir
    Write-Host "✓ File Explorer opened" -ForegroundColor Green
} catch {
    Write-Host "⚠ Could not open File Explorer" -ForegroundColor Yellow
}

Write-Host "`n" -NoNewline
Write-Host "🔄 IMPORTANT:" -ForegroundColor Red
Write-Host "Before adding the new manifest:" -ForegroundColor White
Write-Host "1. Remove the current 'PromptReply' add-in from Outlook" -ForegroundColor White
Write-Host "2. Restart Outlook completely" -ForegroundColor White
Write-Host "3. Then add the new manifest file" -ForegroundColor White
Write-Host "This ensures Outlook uses the fast-loading version!" -ForegroundColor Green

Write-Host "`n" -NoNewline
Write-Host "✅ MANIFEST READY FOR SIDELOADING" -ForegroundColor Green
Write-Host "File path is in your clipboard - just paste it when prompted!" -ForegroundColor White
