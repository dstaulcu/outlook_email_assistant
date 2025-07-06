# Simple Icon Generator - Creates basic colored square icons without ImageMagick
Write-Host "PromptReply - Simple Icon Generator" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green

Add-Type -AssemblyName System.Drawing

$assetsPath = ".\public\assets"
$iconColor = [System.Drawing.Color]::FromArgb(70, 130, 180)  # Steel Blue
$backgroundColor = [System.Drawing.Color]::White

# Function to create a simple square icon
function Create-SimpleIcon {
    param(
        [int]$Size,
        [string]$OutputPath
    )
    
    $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    # Fill background
    $graphics.Clear($backgroundColor)
    
    # Draw border
    $pen = New-Object System.Drawing.Pen($iconColor, 2)
    $graphics.DrawRectangle($pen, 1, 1, $Size-3, $Size-3)
    
    # Draw "P" for PromptReply
    $font = New-Object System.Drawing.Font("Arial", [math]::Max(8, $Size/3), [System.Drawing.FontStyle]::Bold)
    $brush = New-Object System.Drawing.SolidBrush($iconColor)
    $stringFormat = New-Object System.Drawing.StringFormat
    $stringFormat.Alignment = [System.Drawing.StringAlignment]::Center
    $stringFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
    
    $rect = New-Object System.Drawing.Rectangle(0, 0, $Size, $Size)
    $graphics.DrawString("P", $font, $brush, $rect, $stringFormat)
    
    # Save the image
    $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Clean up
    $graphics.Dispose()
    $bitmap.Dispose()
    $pen.Dispose()
    $brush.Dispose()
    $font.Dispose()
    
    Write-Host "✓ Created: $OutputPath" -ForegroundColor Green
}

# Create all required icon sizes
try {
    Create-SimpleIcon -Size 16 -OutputPath "$assetsPath\icon-16.png"
    Create-SimpleIcon -Size 32 -OutputPath "$assetsPath\icon-32.png"
    Create-SimpleIcon -Size 64 -OutputPath "$assetsPath\icon-64.png"
    Create-SimpleIcon -Size 80 -OutputPath "$assetsPath\icon-80.png"
    
    Write-Host "`n✓ All icons created successfully!" -ForegroundColor Green
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Run: npm run build" -ForegroundColor White
    Write-Host "2. Run: npm run deploy:home" -ForegroundColor White
    Write-Host "3. Wait 5-10 minutes for CloudFront cache to update" -ForegroundColor White
    Write-Host "4. Remove and re-add the add-in in Outlook to see new icons" -ForegroundColor White
    
} catch {
    Write-Host "✗ Error creating icons: $_" -ForegroundColor Red
    Write-Host "You may need to create the icons manually using an image editor." -ForegroundColor Yellow
}
