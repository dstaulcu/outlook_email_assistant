# PromptReply - Force Fresh Test
# This creates a cache-busted manifest for absolute fresh testing

$timestamp = Get-Date -UFormat %s
$manifestUrl = "https://d343wke1xouc9b.cloudfront.net/manifest.xml?v=$timestamp"
$downloadDir = "$env:USERPROFILE\Downloads\PromptReply"
$testManifestPath = "$downloadDir\manifest-fresh-test.xml"

Write-Host "PromptReply - Force Fresh Cache Test" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# Download with cache busting
Write-Host "`nDownloading fresh manifest with cache busting..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $manifestUrl -OutFile $testManifestPath -UseBasicParsing -Headers @{"Cache-Control"="no-cache"}
    Write-Host "✓ Downloaded: $testManifestPath" -ForegroundColor Green
    
    # Copy to clipboard
    $testManifestPath | Set-Clipboard
    Write-Host "✓ Path copied to clipboard!" -ForegroundColor Green
    
    # Test the main URL with cache busting
    $testUrl = "https://d343wke1xouc9b.cloudfront.net/?v=$timestamp"
    Write-Host "`nTesting fresh URL: $testUrl" -ForegroundColor Yellow
    Start-Process $testUrl
    
} catch {
    Write-Host "✗ Download failed: $_" -ForegroundColor Red
}

Write-Host "`n📋 INSTRUCTIONS:" -ForegroundColor Yellow
Write-Host "1. Remove current PromptReply add-in from Outlook" -ForegroundColor White
Write-Host "2. Wait 30 seconds" -ForegroundColor White
Write-Host "3. Add from file: " -NoNewline -ForegroundColor White
Write-Host "$testManifestPath" -ForegroundColor Cyan
Write-Host "4. This should now load with async Office.js" -ForegroundColor White

Write-Host "`n🔬 WHAT TO EXPECT:" -ForegroundColor Green
Write-Host "- Page loads instantly" -ForegroundColor White
Write-Host "- Shows 'Initializing...' then 'Loading Office.js...'" -ForegroundColor White
Write-Host "- Then 'Office.js loaded, starting app...'" -ForegroundColor White
Write-Host "- Total time should be <5 seconds" -ForegroundColor White

Write-Host "`n⚠️ IF STILL SLOW:" -ForegroundColor Red
Write-Host "The issue might be Office.js CDN itself being slow" -ForegroundColor White
Write-Host "We may need to host Office.js locally on CloudFront" -ForegroundColor White
