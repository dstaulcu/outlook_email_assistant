# Manual Icon Creation Guide for PromptReply

## Quick Icon Creation Steps

Since the PowerShell script didn't work, here's how to create simple icons manually:

### Option 1: Using Paint (Windows)
1. Open **Paint** (Windows built-in app)
2. Create a new image with these dimensions:
   - 16x16 pixels (for icon-16.png)
   - 32x32 pixels (for icon-32.png)
   - 64x64 pixels (for icon-64.png)
   - 80x80 pixels (for icon-80.png)
3. Choose a nice color (e.g., blue: #4682B4)
4. Fill the background
5. Add a white "P" or "PR" text in the center
6. Save as PNG to: `c:\Apps\code\outlook_email_assistant\public\assets\`

### Option 2: Using Online Icon Generator
1. Go to **favicon.io** or **canva.com**
2. Create a simple icon with:
   - Text: "P" or "PR"
   - Background color: Blue (#4682B4)
   - Font: Bold, white text
3. Download in PNG format
4. Resize to 16x16, 32x32, 64x64, 80x80 pixels
5. Save to: `c:\Apps\code\outlook_email_assistant\public\assets\`

### Option 3: Use the Robot Logo
If you have a robot logo or image:
1. Resize it to the required dimensions
2. Save as PNG files with the correct names
3. Place in: `c:\Apps\code\outlook_email_assistant\public\assets\`

## File Names Required
- `icon-16.png` (16x16 pixels)
- `icon-32.png` (32x32 pixels)
- `icon-64.png` (64x64 pixels)
- `icon-80.png` (80x80 pixels)

## After Creating Icons
1. Run: `npm run build && npm run deploy:home`
2. Wait 5-10 minutes for CloudFront to update
3. Remove and re-add the add-in in Outlook
4. The new icons should appear!

## Current Status
✅ Add-in is working with "PromptReply" branding
✅ Deployed to CloudFront: https://d343wke1xouc9b.cloudfront.net
⏳ Icons need to be updated manually (above steps)
⏳ Remove/re-add add-in in Outlook to see new icons
