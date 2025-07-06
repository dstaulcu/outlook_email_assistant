# Outlook Email AI Assistant - Operational Support Guide

## 📋 Overview
This document provides operational teams with the information needed to deploy, maintain, and support the Outlook Email AI Assistant in a production enterprise environment.

## 🚀 Production Deployment

### Prerequisites Checklist
- [ ] Web server with HTTPS support
- [ ] Office 365 tenant administrator access
- [ ] SSL certificates (production domain)
- [ ] AI provider access (OpenAI API keys or Ollama infrastructure)
- [ ] Network firewall rules configured
- [ ] Security team approval for AI processing

### Deployment Steps

#### 1. Infrastructure Setup
```bash
# Build production version
npm run build

# Deploy to web server
# Copy dist/ contents to production web server
# Ensure HTTPS is enabled and certificates are valid
```

#### 2. Manifest Configuration
- Update `public/manifest.xml` with production URLs
- Configure correct HTTPS endpoints
- Set appropriate permissions and scopes
- Test manifest validation

#### 3. Office 365 Integration
- Upload manifest to Office 365 Admin Center
- Configure add-in distribution policies
- Set user/group access permissions
- Enable centralized deployment

#### 4. Security Configuration
- Review and configure security classification settings
- Enable audit logging (required for compliance)
- Set processing restrictions per organizational policy
- Configure security overrides (admin only)

## 🔧 Configuration Management

### AI Provider Setup

#### OpenAI (Recommended for Enterprise)
- **API Key Management**: Use Azure Key Vault or similar
- **Rate Limiting**: Configure appropriate limits
- **Monitoring**: Set up usage alerts
- **Backup**: Configure secondary provider if needed

#### Ollama (On-Premises Option)
- **Infrastructure**: Dedicated servers with GPU support
- **Models**: Deploy approved models only
- **Security**: Network isolation and access controls
- **Monitoring**: Resource usage and performance metrics

### User Profile Defaults
```json
{
  "organizationDefaults": {
    "signatureTemplates": {
      "professional": "Best regards,\n{name}\n{jobTitle}\n{department}",
      "personal": "Thanks,\n{name}"
    },
    "autoDetectProfile": true,
    "defaultTone": "professional",
    "defaultLength": "brief"
  }
}
```

## 🛡️ Security & Compliance

### Data Handling Policies
- **Email Processing**: In-memory only, no persistent storage
- **Classification**: Automatic detection of sensitive content
- **Audit Logging**: All AI interactions logged for compliance
- **Encryption**: AES encryption for all user preferences

### Compliance Features
- **Section 508**: Accessibility compliance features
- **GDPR**: Data processing transparency and controls
- **SOX**: Audit trail and data integrity
- **HIPAA**: Secure handling of sensitive information

### Security Monitoring
- Monitor for classification bypass attempts
- Track AI provider API usage and costs
- Alert on security policy violations
- Regular security assessment reviews

## 📊 Monitoring & Maintenance

### Key Metrics to Monitor
- **User Adoption**: Active users, feature usage
- **Performance**: Response times, error rates
- **Security**: Classification accuracy, policy violations
- **Cost**: AI provider API usage and billing

### Health Checks
```bash
# Check add-in availability
curl -k https://your-domain.com/manifest.xml

# Verify AI provider connectivity
# Monitor through admin dashboard

# Check certificate expiration
openssl x509 -in certificate.crt -text -noout
```

### Maintenance Tasks
- **Daily**: Monitor system health and alerts
- **Weekly**: Review usage reports and costs
- **Monthly**: Security and compliance review
- **Quarterly**: Performance optimization review

## 🚨 Troubleshooting

### Common Production Issues

#### Certificate Problems
**Symptoms**: Add-in fails to load, HTTPS errors
**Solutions**:
- Verify certificate chain and expiration
- Check certificate matches manifest URLs
- Ensure intermediate certificates are installed

#### Sideloading Issues
**Symptoms**: Add-in not appearing in Outlook
**Solutions**:
- Verify manifest.xml syntax and URLs
- Check Office 365 deployment status
- Confirm user permissions and group membership

#### AI Provider Connectivity
**Symptoms**: Analysis/compose features failing
**Solutions**:
- Verify API keys and endpoints
- Check network connectivity and firewall rules
- Review rate limiting and quota status

#### Performance Issues
**Symptoms**: Slow response times
**Solutions**:
- Monitor AI provider response times
- Check network latency
- Review server resource utilization

### Escalation Procedures
1. **Level 1**: Basic troubleshooting (help desk)
2. **Level 2**: Technical investigation (IT support)
3. **Level 3**: Developer/vendor escalation
4. **Emergency**: Security incident response team

## 📞 Support Contacts

### Internal Teams
- **IT Helpdesk**: Level 1 support
- **Security Team**: Policy and compliance
- **Network Team**: Connectivity issues
- **Office 365 Admins**: Deployment and configuration

### External Vendors
- **Microsoft Support**: Office.js and deployment issues
- **OpenAI Support**: API issues and billing
- **Ollama Community**: Local LLM support

## 📋 Runbooks

### Daily Operations
1. Check system health dashboard
2. Review overnight alerts
3. Monitor usage metrics
4. Verify backup operations

### Incident Response
1. **Identify**: Classify incident severity
2. **Contain**: Implement temporary workarounds
3. **Investigate**: Root cause analysis
4. **Resolve**: Apply permanent fix
5. **Document**: Update runbooks and knowledge base

### Change Management
1. **Plan**: Review change requirements
2. **Test**: Validate in staging environment
3. **Approve**: Security and management sign-off
4. **Deploy**: Controlled rollout process
5. **Verify**: Post-deployment validation

## 📋 Backup & Recovery

### Configuration Backup
- Export user preferences and settings
- Backup manifest and certificate files
- Document AI provider configurations
- Store security policies and overrides

### Disaster Recovery
- **RTO**: 4 hours (Recovery Time Objective)
- **RPO**: 24 hours (Recovery Point Objective)
- **Procedures**: Documented restoration steps
- **Testing**: Quarterly DR exercises

## 📈 Reporting

### Usage Reports
- Monthly active users
- Feature adoption rates
- AI provider costs
- Security incident summary

### Performance Reports
- Response time metrics
- Error rate analysis
- User satisfaction scores
- System availability

### Compliance Reports
- Audit trail summaries
- Security policy adherence
- Data processing transparency
- Classification accuracy metrics

---

**For technical implementation details, see [DEVELOPER_SUPPORT.md](DEVELOPER_SUPPORT.md)**

## 🔧 Troubleshooting Guide

### Common Issues and Solutions

#### 1. "Could not load. Please make sure you have network and/or internet connectivity"

This error usually indicates one of the following issues:

**SSL Certificate Issues**
- **Solution**: Ensure development certificates are properly installed
- **Command**: `npm run install-certs`
- **Verify**: `npm run verify-certs`

**Port/URL Issues**
- **Check**: Verify the development server is running on the correct port
- **Command**: `npm run dev`
- **URL**: Should be accessible at `https://localhost:3001`

**Manifest File Issues**
- **Check**: Verify manifest.xml is accessible at `https://localhost:3001/manifest.xml`
- **Verify**: All URLs in manifest point to port 3001 (not 3000)

**Firewall/Network Issues**
- **Windows Firewall**: Allow connections to `localhost:3001`
- **Corporate Network**: Check if HTTPS localhost connections are blocked
- **Proxy**: Configure proxy settings if needed

#### 2. Add-in Not Loading in Outlook

**Desktop Outlook**
1. Go to **File > Manage Add-ins**
2. Click **My add-ins**
3. Select **Developer add-ins**
4. Click **Add a custom add-in**
5. Choose **Add from URL**
6. Enter: `https://localhost:3001/manifest.xml`

**Outlook Web App**
1. Go to **Settings > View all Outlook settings**
2. Navigate to **General > Manage add-ins**
3. Click **Add a custom add-in**
4. Select **Add from URL**
5. Enter: `https://localhost:3001/manifest.xml`

#### 3. Development Server Issues

**Port Already in Use**
- **Error**: `EADDRINUSE: address already in use :::3001`
- **Solution**: Stop any process using port 3001 or use a different port
- **Command**: `npm run dev -- --port 3002`

**Certificate Path Issues**
- **Error**: Certificate files not found
- **Solution**: Update paths in `webpack.config.js` to match your system
- **Default**: `C:\Users\{username}\.office-addin-dev-certs\`

#### 4. Office.js Issues

**Office.js Not Loading**
- **Check**: Verify Office.js script tag in `public/index.html`
- **URL**: `https://appsforoffice.microsoft.com/lib/1/hosted/office.js`
- **Debug**: Check browser console for Office.js errors

**Office.onReady Not Firing**
- **Cause**: Add-in not properly registered with Office
- **Solution**: Ensure manifest is correctly sideloaded
- **Debug**: Check if `Office` object exists in browser console

#### 5. AI Provider Issues

**OpenAI Connection**
- **Check**: Valid API key configured
- **Verify**: Network access to OpenAI API
- **Test**: Use settings panel to test connection

**Ollama Connection**
- **Check**: Ollama server running on `http://localhost:11434`
- **Start**: `ollama serve`
- **CORS**: Set `OLLAMA_ORIGINS="*"` environment variable
- **Test**: Use settings panel to test connection

### Debug Commands

```bash
# Check if server is running
curl -k https://localhost:3001

# Check manifest accessibility
curl -k https://localhost:3001/manifest.xml

# Install certificates
npm run install-certs

# Verify certificates
npm run verify-certs

# Run sideload helper
npm run sideload

# Build for production
npm run build
```

### Browser Console Debugging

Open browser developer tools (F12) and check:

1. **Console tab**: Look for JavaScript errors
2. **Network tab**: Check if resources are loading
3. **Security tab**: Verify SSL certificate is valid
4. **Application tab**: Check localStorage for user preferences

### Log Files

Check the following logs:
- Browser console (F12)
- Office application logs
- Windows Event Viewer (if applicable)

---

**For developer-specific guidance, see [DEVELOPER_SUPPORT.md](DEVELOPER_SUPPORT.md)**

## 🤖 AI Provider Configuration

### Quick Start - Testing with Local Ollama

To test the AI functionality immediately, you can use Ollama locally:

1. **Install Ollama** (if not already installed):
   ```bash
   # Windows
   winget install Ollama.Ollama
   
   # Or download from https://ollama.com
   ```

2. **Start Ollama and pull a model**:
   ```bash
   ollama serve
   ollama pull llama3.2  # or another model
   ```

3. **The add-in will automatically detect Ollama** at `http://localhost:11434`

### OpenAI Configuration

If you want to use OpenAI instead:

1. **Get an API key** from https://platform.openai.com
2. **Add it to user preferences** (Settings button in the add-in)
3. **Set OpenAI as default provider**

### Current Default Configuration

The add-in is configured with these defaults:
- **Default Provider**: OpenAI (falls back to Ollama if OpenAI not configured)
- **OpenAI**: `gpt-3.5-turbo` model
- **Ollama**: `llama3.2` model at `http://localhost:11434`

### Testing the Integration

1. **Open an email** in Outlook
2. **Open the AI Assistant** from the ribbon
3. **Click "Analyze Email"** - this will:
   - Check if the email is classified
   - Use the available AI provider
   - Display a detailed analysis

4. **Click "Compose Assist"** - this will:
   - Generate a suggested response
   - Provide writing tips
   - Respect classification restrictions

## 🔐 Certificate Installation Guide

### Issue
Office Add-ins require trusted HTTPS certificates. The error "content is blocked because it isn't signed by a valid security certificate" occurs because the self-signed certificate isn't trusted by Office.

### Solutions

#### Option 1: Install Certificate Manually (Recommended)
1. Open PowerShell as Administrator
2. Run the following commands:

```powershell
# Navigate to project directory
cd C:\Apps\code\outlook_email_assistant

# Install Office Add-in development certificates
npx office-addin-dev-certs install

# Verify installation
npx office-addin-dev-certs verify
```

#### Option 2: Manual Certificate Installation
1. Navigate to: C:\Apps\code\outlook_email_assistant\node_modules\.cache\webpack-dev-server\server.pem
2. Right-click on server.pem → "Install Certificate"
3. Choose "Local Machine" → "Place all certificates in the following store"
4. Browse → "Trusted Root Certification Authorities" → OK
5. Complete the installation

#### Option 3: Use Office Add-in CLI (Alternative)
```bash
# Install Office Add-in CLI globally
npm install -g @microsoft/office-addin-cli

# Create and install certificates
office-addin-dev-certs install --machine
```

#### Option 4: Temporary Workaround
If certificate installation fails, you can temporarily:
1. Open Internet Explorer or Edge
2. Navigate to https://localhost:3000
3. Accept the certificate warning
4. This may help Office trust the certificate

### After Certificate Installation
1. Restart Outlook completely
2. Reinstall the add-in manifest
3. Test the add-in functionality
