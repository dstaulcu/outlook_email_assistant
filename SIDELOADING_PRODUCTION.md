# Outlook Email AI Assistant - Production Sideloading Guide

## 🚀 **Production Sideloading (CloudFront Deployment)**

Your add-in is deployed at: **https://d343wke1xouc9b.cloudfront.net**

### **Method 1: Sideload Using Local Manifest File**

1. **Navigate to your project folder**:
   ```
   C:\Apps\code\outlook_email_assistant\public\
   ```

2. **Find the manifest.xml file** (now updated to point to CloudFront)

3. **Open Microsoft Outlook**

4. **Go to File → Manage Add-ins**

5. **Click "My add-ins"**

6. **Click "Add a custom add-in"**

7. **Choose "Add from file"**

8. **Browse and select**: `C:\Apps\code\outlook_email_assistant\public\manifest.xml`

9. **Click "Install"**

### **Method 2: Outlook Web App (If Desktop Fails)**

1. **Open Outlook Web App**: https://outlook.live.com or https://outlook.office.com

2. **Go to Settings** (gear icon) → **View all Outlook settings**

3. **General** → **Manage add-ins**

4. **Click "Add a custom add-in"**

5. **Choose "Add from file"**

6. **Upload the manifest.xml file**

### **Method 3: PowerShell Alternative**

If you prefer PowerShell automation:

```powershell
# Copy manifest to a temporary location
Copy-Item "C:\Apps\code\outlook_email_assistant\public\manifest.xml" "$env:TEMP\outlook-ai-assistant-manifest.xml"

# Open the temp folder
explorer "$env:TEMP"

# The manifest file is now ready for upload through Outlook
Write-Host "Manifest file copied to: $env:TEMP\outlook-ai-assistant-manifest.xml"
Write-Host "Use this file to sideload the add-in in Outlook"
```

### **🔧 **Troubleshooting**

**If add-in doesn't load:**
1. **Check CloudFront**: Visit https://d343wke1xouc9b.cloudfront.net to ensure it's accessible
2. **Clear Outlook cache**: File → Options → Advanced → Clear Office cache
3. **Trust the add-in**: Check if Outlook is blocking the add-in

**If manifest validation fails:**
1. **Validate manifest**: Run `npm run validate-manifest`
2. **Check URLs**: Ensure all URLs in manifest are accessible
3. **Review manifest syntax**: Ensure XML is well-formed

### **🎯 **Expected Behavior**

After successful sideloading:
1. **New button** appears in Outlook ribbon: "Email AI Assistant"
2. **Click the button** to open the AI assistant task pane
3. **Task pane loads** from CloudFront URL: https://d343wke1xouc9b.cloudfront.net
4. **All features work**: AI analysis, settings, accessibility features

### **📋 **Verification Steps**

1. **Test the main URL**: https://d343wke1xouc9b.cloudfront.net
2. **Test the commands**: https://d343wke1xouc9b.cloudfront.net/commands.html
3. **Test the manifest**: https://d343wke1xouc9b.cloudfront.net/manifest.xml
4. **Test the icons**: https://d343wke1xouc9b.cloudfront.net/assets/icon-32.png

All URLs should be accessible via HTTPS without certificate errors.

---

**Note**: This manifest is now configured for production deployment. For development, you would need to update the URLs back to localhost:3001.
