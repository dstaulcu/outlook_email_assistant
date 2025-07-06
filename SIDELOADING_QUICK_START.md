# PromptReply Sideloading Instructions

## Quick Start

1. **Run the PowerShell script** to copy the manifest to your temp folder:
   ```powershell
   .\sideload-manifest.ps1
   ```

2. **In Outlook Desktop:**
   - Go to **Home** tab → **Get Add-ins** → **My add-ins**
   - Click **Add from file** 
   - Select the manifest.xml from: `%TEMP%\PromptReply\manifest.xml`

3. **In Outlook Web:**
   - Go to **Settings** (gear icon) → **View all Outlook settings**
   - Click **Mail** → **Customize actions** → **Add-ins**
   - Click **Add from file**
   - Select the manifest.xml from: `%TEMP%\PromptReply\manifest.xml`

## Production URLs

- **CloudFront Distribution**: `https://d343wke1xouc9b.cloudfront.net`
- **Manifest Location**: `%TEMP%\PromptReply\manifest.xml` (after running script)

## Troubleshooting

If the add-in doesn't load:
1. Check browser console for errors
2. Verify internet connectivity to CloudFront
3. Clear browser cache and try again
4. Ensure manifest.xml is the correct file (not a copy)

## Icons

The add-in uses these icons from the CloudFront distribution:
- icon-16.png, icon-32.png, icon-64.png, icon-80.png
- If icons don't appear, run: `.\generate-icons.ps1` to create them from logo.png

## Next Steps

After sideloading, you'll see "PromptReply" in your Outlook ribbon. Click it to open the AI assistant task pane.
