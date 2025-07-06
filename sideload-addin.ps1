# PowerShell script to sideload the Outlook Email AI Assistant add-in

Write-Host "Outlook Email AI Assistant - Sideloading Script" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Check if development server is running
$url = "https://localhost:3001"
$manifest = "https://localhost:3001/manifest.xml"

try {
    Write-Host "Checking development server..." -ForegroundColor Yellow
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 10
    Write-Host "✓ Development server is running at $url" -ForegroundColor Green
} catch {
    Write-Host "✗ Development server is not running!" -ForegroundColor Red
    Write-Host "Please run 'npm run dev' first" -ForegroundColor Red
    exit 1
}

try {
    Write-Host "Checking manifest file..." -ForegroundColor Yellow
    $manifestResponse = Invoke-WebRequest -Uri $manifest -UseBasicParsing -TimeoutSec 10
    Write-Host "✓ Manifest file is accessible at $manifest" -ForegroundColor Green
} catch {
    Write-Host "✗ Manifest file is not accessible!" -ForegroundColor Red
    Write-Host "Please check that the manifest.xml file exists in the public folder" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Next steps to sideload the add-in:" -ForegroundColor Yellow
Write-Host "1. Open Microsoft Outlook" -ForegroundColor White
Write-Host "2. Go to File > Manage Add-ins" -ForegroundColor White
Write-Host "3. Click 'Upload from file' or 'My add-ins'" -ForegroundColor White
Write-Host "4. Select 'Developer add-ins' and click 'Add a custom add-in'" -ForegroundColor White
Write-Host "5. Choose 'Add from URL' and enter: $manifest" -ForegroundColor White
Write-Host "6. Click 'Install' to sideload the add-in" -ForegroundColor White
Write-Host ""
Write-Host "Alternative method:" -ForegroundColor Yellow
Write-Host "1. Open Outlook Web App (https://outlook.live.com)" -ForegroundColor White
Write-Host "2. Go to Settings > View all Outlook settings > General > Manage add-ins" -ForegroundColor White
Write-Host "3. Click 'Add a custom add-in' > 'Add from URL'" -ForegroundColor White
Write-Host "4. Enter: $manifest" -ForegroundColor White
Write-Host ""
Write-Host "Troubleshooting:" -ForegroundColor Yellow
Write-Host "- Ensure your certificates are trusted (run: office-addin-dev-certs install)" -ForegroundColor White
Write-Host "- Check that your firewall allows connections to localhost:3001" -ForegroundColor White
Write-Host "- Try using Outlook Web App if desktop Outlook has issues" -ForegroundColor White
Write-Host ""
Write-Host "Development server is ready! Press Ctrl+C to stop." -ForegroundColor Green
