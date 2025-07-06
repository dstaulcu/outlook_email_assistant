# PromptReply - Force Cache Clear & Performance Test
Write-Host "PromptReply - Forcing Cache Clear" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Step 1: Clear browser cache (instructions)
Write-Host "`n1. CLEAR BROWSER CACHE:" -ForegroundColor Yellow
Write-Host "   - Press Ctrl+Shift+Delete" -ForegroundColor White
Write-Host "   - Clear cached images and files" -ForegroundColor White
Write-Host "   - Or try incognito/private mode" -ForegroundColor White

# Step 2: Force CloudFront invalidation
Write-Host "`n2. FORCE CLOUDFRONT REFRESH:" -ForegroundColor Yellow
try {
    aws cloudfront create-invalidation --distribution-id E3DV1IN6OR59UU --paths "/*" --region us-east-1
    Write-Host "   ✓ CloudFront invalidation created" -ForegroundColor Green
} catch {
    Write-Host "   ⚠ CloudFront invalidation failed: $_" -ForegroundColor Red
}

# Step 3: Test performance
Write-Host "`n3. PERFORMANCE TEST:" -ForegroundColor Yellow
Write-Host "   Opening fast test page..." -ForegroundColor White
Start-Process "https://d343wke1xouc9b.cloudfront.net/fast-test.html"

# Step 4: Instructions
Write-Host "`n4. NEXT STEPS:" -ForegroundColor Yellow
Write-Host "   a) Test the fast-test.html page first" -ForegroundColor White
Write-Host "   b) If it loads instantly, the performance fix is working" -ForegroundColor White
Write-Host "   c) Remove and re-add the add-in in Outlook" -ForegroundColor White
Write-Host "   d) Wait 2-3 minutes between removal and re-adding" -ForegroundColor White

Write-Host "`n5. IF STILL SLOW:" -ForegroundColor Yellow
Write-Host "   - Try different browser/incognito mode" -ForegroundColor White
Write-Host "   - Check if fast-test.html loads instantly" -ForegroundColor White
Write-Host "   - Clear Outlook cache (restart Outlook)" -ForegroundColor White

Write-Host "`nURLs to test:" -ForegroundColor Green
Write-Host "Fast test: https://d343wke1xouc9b.cloudfront.net/fast-test.html" -ForegroundColor Cyan
Write-Host "Main app:  https://d343wke1xouc9b.cloudfront.net" -ForegroundColor Cyan
Write-Host "Manifest:  https://d343wke1xouc9b.cloudfront.net/manifest.xml" -ForegroundColor Cyan
