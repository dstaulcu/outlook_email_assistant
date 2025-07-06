# PromptReply - Icon Generation Script
# This script converts logo.png to the required Office add-in icon sizes

Write-Host "PromptReply - Generating Icons from Logo" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

$logoPath = ".\logo.png"
$assetsPath = ".\public\assets"

if (Test-Path $logoPath) {
    Write-Host "✓ Logo found: $logoPath" -ForegroundColor Green
    
    # Check if we have ImageMagick or similar tools
    try {
        $magickPath = Get-Command "magick" -ErrorAction SilentlyContinue
        if ($magickPath) {
            Write-Host "✓ ImageMagick found, generating icons..." -ForegroundColor Green
            
            # Generate icons in different sizes
            & magick "$logoPath" -resize 16x16 "$assetsPath\icon-16.png"
            & magick "$logoPath" -resize 32x32 "$assetsPath\icon-32.png"
            & magick "$logoPath" -resize 64x64 "$assetsPath\icon-64.png"
            & magick "$logoPath" -resize 80x80 "$assetsPath\icon-80.png"
            
            Write-Host "✓ Icons generated successfully!" -ForegroundColor Green
        } else {
            Write-Host "⚠ ImageMagick not found. Manual steps needed:" -ForegroundColor Yellow
            Write-Host "1. Open logo.png in an image editor" -ForegroundColor White
            Write-Host "2. Resize and save as:" -ForegroundColor White
            Write-Host "   - public/assets/icon-16.png (16x16)" -ForegroundColor Cyan
            Write-Host "   - public/assets/icon-32.png (32x32)" -ForegroundColor Cyan
            Write-Host "   - public/assets/icon-64.png (64x64)" -ForegroundColor Cyan
            Write-Host "   - public/assets/icon-80.png (80x80)" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "⚠ Error checking for ImageMagick: $_" -ForegroundColor Yellow
    }
    
    # Copy logo as main icon for backup
    Copy-Item $logoPath "$assetsPath\logo.png" -Force
    Write-Host "✓ Logo copied to assets folder" -ForegroundColor Green
    
} else {
    Write-Host "✗ Logo not found: $logoPath" -ForegroundColor Red
    Write-Host "Please ensure logo.png is in the project root" -ForegroundColor Red
}

Write-Host "`nNext steps:" -ForegroundColor Green
Write-Host "1. Run: npm run update-branding" -ForegroundColor White
Write-Host "2. Run: npm run deploy:home" -ForegroundColor White
