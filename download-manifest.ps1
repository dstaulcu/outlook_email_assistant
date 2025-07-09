# PromptReply - Download Production Manifest from S3
# This script downloads the production manifest from S3 for manual sideloading

Write-Host "PromptReply - Download Production Manifest" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# Load configuration
$configPath = ".\config.json"
if (!(Test-Path $configPath)) {
    Write-Host "Configuration file not found: $configPath" -ForegroundColor Red
    exit 1
}

try {
    $config = Get-Content $configPath -Raw | ConvertFrom-Json
    $baseUrl = $config.s3.baseUrl
    $projectName = $config.project.name
    
    Write-Host "Configuration loaded" -ForegroundColor Green
    Write-Host "Project: $projectName" -ForegroundColor Cyan
    Write-Host "Base URL: $baseUrl" -ForegroundColor Cyan
} catch {
    Write-Host "Failed to parse configuration: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$manifestUrl = "$baseUrl/manifest.xml"

# Create download directory
$downloadDir = "$env:USERPROFILE\Downloads\$projectName"
$manifestPath = "$downloadDir\manifest.xml"

Write-Host "`nCreating download directory..." -ForegroundColor Yellow
if (!(Test-Path $downloadDir)) {
    New-Item -ItemType Directory -Path $downloadDir -Force | Out-Null
    Write-Host "Created: $downloadDir" -ForegroundColor Green
} else {
    Write-Host "Directory exists: $downloadDir" -ForegroundColor Green
}

# Download the production manifest from S3
Write-Host "`nDownloading production manifest from S3..." -ForegroundColor Yellow

try {
    # Download with progress
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $manifestUrl -OutFile $manifestPath -UseBasicParsing
    $ProgressPreference = 'Continue'
    
    Write-Host "Downloaded successfully!" -ForegroundColor Green
    Write-Host "File saved to: $manifestPath" -ForegroundColor Green
    
    # Verify the file was downloaded
    if (Test-Path $manifestPath) {
        $fileSize = (Get-Item $manifestPath).Length
        Write-Host "File size: $fileSize bytes" -ForegroundColor Green
        
        # Copy file path to clipboard
        $manifestPath | Set-Clipboard
        Write-Host "File path copied to clipboard!" -ForegroundColor Green
        
        # Show file contents preview
        Write-Host "`nManifest preview:" -ForegroundColor Yellow
        $content = Get-Content $manifestPath -Raw
        if ($content -match '<DisplayName[^>]*>([^<]+)</DisplayName>') {
            Write-Host "  Add-in Name: $($matches[1])" -ForegroundColor Cyan
        }
        if ($content -match '<Description[^>]*>([^<]+)</Description>') {
            Write-Host "  Description: $($matches[1])" -ForegroundColor Cyan
        }
        $escapedBaseUrl = [regex]::Escape($baseUrl)
        if ($content -match $escapedBaseUrl) {
            Write-Host "  S3 URL: Verified" -ForegroundColor Green
        }
    }
    
} catch {
    Write-Host "Download failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please check your internet connection and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host "`nNEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Open Outlook" -ForegroundColor White
Write-Host "2. Go to Home > Get Add-ins > My add-ins" -ForegroundColor White
Write-Host "3. Click Add from file" -ForegroundColor White
Write-Host "4. Paste the file path (already in clipboard): $manifestPath" -ForegroundColor White
Write-Host "5. Or browse to: $downloadDir" -ForegroundColor White

Write-Host "`nIMPORTANT:" -ForegroundColor Red
Write-Host "Before adding the new manifest:" -ForegroundColor White
Write-Host "1. Remove the current $projectName add-in from Outlook" -ForegroundColor White
Write-Host "2. Restart Outlook completely" -ForegroundColor White
Write-Host "3. Then add the new manifest file" -ForegroundColor White
Write-Host "This ensures Outlook uses the latest S3-hosted version!" -ForegroundColor Green

Write-Host "`nMANIFEST READY FOR SIDELOADING" -ForegroundColor Green
Write-Host "File path is in your clipboard - just paste it when prompted!" -ForegroundColor White
