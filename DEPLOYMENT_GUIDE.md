# PromptReply - AWS S3 Direct Deployment Guide

## 🚀 Deployment Overview

This guide will help you deploy the PromptReply Outlook add-in to AWS S3 with direct static website hosting (no CDN) for both development and enterprise private network environments.

## 📋 Prerequisites

### 1. Configuration Setup
Before deployment, ensure your `config.json` file is properly configured:
```json
{
  "s3": {
    "bucket": "your-bucket-name",
    "region": "us-east-1",
    "baseUrl": "https://your-bucket-name.s3.amazonaws.com"
  },
  "project": {
    "name": "PromptReply",
    "displayName": "PromptReply - AI Email Assistant"
  }
}
```

> **Important**: Update the `s3.bucket` and `s3.baseUrl` values to match your AWS S3 bucket configuration.

### 2. AWS CLI Setup
```bash
# Install AWS CLI v2
# Windows: Download from https://aws.amazon.com/cli/
# Or use PowerShell:
winget install Amazon.AWSCLI

# Configure AWS credentials
aws configure
```

### 3. Node.js Dependencies
```bash
# Install AWS SDK
npm install aws-sdk --save-dev
```

### 4. AWS Permissions
Ensure your AWS credentials have the following permissions:
- S3: `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket`, `s3:PutBucketPolicy`, `s3:PutBucketWebsite`

## 🏠 Development Environment Setup

### Step 1: Create and Configure S3 Bucket
```bash
# Create S3 bucket (replace with your unique bucket name)
aws s3 mb s3://your-unique-bucket-name --region us-east-1

# Enable static website hosting
aws s3 website s3://your-unique-bucket-name --index-document index.html --error-document index.html
```

### Step 2: Configure Bucket Policy for Public Access
Create a bucket policy to allow public read access:

```bash
# Create bucket policy file (bucket-policy.json)
cat > bucket-policy.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::your-unique-bucket-name/*"
        }
    ]
}
EOF

# Apply the bucket policy
aws s3api put-bucket-policy --bucket your-unique-bucket-name --policy file://bucket-policy.json
```

### Step 3: Configure CORS for Cross-Origin Requests
```bash
# Create CORS configuration (cors.json)
cat > cors.json << 'EOF'
{
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "HEAD"],
            "AllowedOrigins": ["*"],
            "ExposeHeaders": ["ETag"],
            "MaxAgeSeconds": 3000
        }
    ]
}
EOF

# Apply CORS configuration
aws s3api put-bucket-cors --bucket your-unique-bucket-name --cors-configuration file://cors.json
```

### Step 4: Configure Your Environment
Update `config/environments.js` with your S3 settings:

```javascript
development: {
  s3Bucket: 'your-unique-bucket-name',
  region: 'us-east-1',
  baseUrl: 'https://your-unique-bucket-name.s3-website-us-east-1.amazonaws.com',
  environment: 'development'
}
```

### Step 5: Deploy Your Application
```bash
# Deploy to development environment
npm run deploy:dev
```

## 🏢 Enterprise Private Network Environment Setup

### Step 1: Create Enterprise S3 Bucket
For enterprise private network environments (e.g., AWS GovCloud or TS regions):

```bash
# Create S3 bucket in enterprise region
aws s3 mb s3://enterprise-promptreply-bucket --region us-gov-west-1

# Enable static website hosting
aws s3 website s3://enterprise-promptreply-bucket --index-document index.html --error-document index.html
```

### Step 2: Configure Enterprise Environment
Update `config/environments.js` for enterprise deployment:

```javascript
enterprise: {
  s3Bucket: 'enterprise-promptreply-bucket',
  region: 'us-gov-west-1', // GovCloud or TS region
  baseUrl: 'https://enterprise-promptreply-bucket.s3-website-us-gov-west-1.amazonaws.com',
  environment: 'enterprise'
}
```

### Step 3: Apply Enterprise Security Policies
```bash
# Create restricted bucket policy for enterprise
cat > enterprise-bucket-policy.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "RestrictedPublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::enterprise-promptreply-bucket/*",
            "Condition": {
                "IpAddress": {
                    "aws:SourceIp": ["10.0.0.0/8", "192.168.0.0/16"]
                }
            }
        }
    ]
}
EOF

# Apply enterprise bucket policy
aws s3api put-bucket-policy --bucket enterprise-promptreply-bucket --policy file://enterprise-bucket-policy.json
```

### Step 4: Deploy to Enterprise Environment
```bash
# Deploy to enterprise environment
npm run deploy:enterprise
```

## 📝 Available Commands

### Deployment Commands
```bash
npm run deploy:dev        # Deploy to development environment
npm run deploy:enterprise # Deploy to enterprise environment
npm run build             # Build project locally
```

### S3 Management Commands
```bash
# List bucket contents
aws s3 ls s3://your-bucket-name/

# Sync local files to S3
aws s3 sync ./public s3://your-bucket-name/ --delete

# Check website configuration
aws s3api get-bucket-website --bucket your-bucket-name
```

## 🔧 S3 Static Website Configuration

### Required S3 Settings
Your S3 bucket must have the following configuration:

#### 1. Static Website Hosting
```bash
# Enable static website hosting
aws s3 website s3://your-bucket-name \
  --index-document index.html \
  --error-document index.html
```

#### 2. Public Access Configuration
```bash
# Disable "Block all public access" (required for website hosting)
aws s3api put-public-access-block \
  --bucket your-bucket-name \
  --public-access-block-configuration \
  "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
```

#### 3. Content Type Settings
Ensure proper MIME types are set for Office add-in files:
- `.xml` files: `application/xml`
- `.html` files: `text/html`
- `.js` files: `application/javascript`
- `.css` files: `text/css`
- `.json` files: `application/json`

The deployment script automatically sets these content types.

### S3 Website Endpoints
Your S3 static website will be available at:
- **US Standard**: `https://bucket-name.s3-website-us-east-1.amazonaws.com`
- **US West**: `https://bucket-name.s3-website-us-west-2.amazonaws.com`
- **GovCloud**: `https://bucket-name.s3-website-us-gov-west-1.amazonaws.com`

### Security Considerations for Enterprise
- Use IP address restrictions in bucket policies
- Enable S3 access logging for audit trails
- Consider VPC endpoints for completely private access
- Implement least-privilege IAM policies

## 🌐 Office Add-in Configuration

### Manifest URL
After deployment, your manifest.xml will be available at:
- **Development**: `https://your-bucket-name.s3-website-region.amazonaws.com/manifest.xml`
- **Enterprise**: `https://enterprise-bucket.s3-website-us-gov-west-1.amazonaws.com/manifest.xml`

### Sideloading in Outlook
1. Go to Outlook > Get Add-ins > My add-ins
2. Choose "Add a custom add-in" > "Add from URL"
3. Enter your S3 website manifest URL
4. Click "OK" to install

### HTTPS Requirements
**Important**: Office add-ins require HTTPS. S3 static website hosting provides HTTPS by default when accessed via the website endpoint.

## 📲 Sideloading Instructions

### **Method 1: PowerShell Script (Recommended)**
```powershell
# Copy manifest to temp folder and sideload
.\sideload-manifest.ps1
```

### **Method 2: Manual Sideloading**

#### **Outlook Desktop:**
1. Go to **Home** tab → **Get Add-ins** → **My add-ins**
2. Click **Add a custom add-in** → **Add from URL**
3. Enter your S3 website manifest URL:
   ```
   https://your-bucket-name.s3-website-region.amazonaws.com/manifest.xml
   ```
4. Click **OK** to install

#### **Outlook Web App:**
1. Go to **Settings** (gear icon) → **View all Outlook settings**
2. Click **Mail** → **Customize actions** → **Add-ins**
3. Click **Add a custom add-in** → **Add from URL**
4. Enter your manifest URL and install

### **Method 3: Local File Sideloading**
1. Navigate to your project folder: `public/manifest.xml`
2. In Outlook → **Add from file**
3. Select the local manifest.xml file

### **Troubleshooting Sideloading**
- **Add-in doesn't appear**: Check manifest URL accessibility in browser
- **Load errors**: Verify HTTPS and CORS configuration
- **Permission issues**: Ensure Office 365 allows custom add-ins
- **Network issues**: Test S3 website endpoint connectivity

## 🔍 Troubleshooting

### Common Issues

#### 1. S3 Website Not Accessible
- Verify static website hosting is enabled
- Check bucket policy allows public read access
- Ensure "Block all public access" is disabled
- Confirm you're using the website endpoint, not the REST API endpoint

#### 2. Office Add-in Not Loading
- Verify HTTPS is working (use S3 website endpoint)
- Check that manifest.xml is accessible and valid
- Ensure all referenced files are uploaded with correct content types
- Test the manifest URL in a browser first

#### 3. CORS Errors
- Verify CORS configuration is applied to the bucket
- Check that AllowedOrigins includes "*" or specific Office domains
- Ensure AllowedMethods includes "GET" and "HEAD"

#### 4. Deployment Failures
- Check AWS credentials and permissions
- Verify S3 bucket exists and is accessible
- Ensure bucket name is globally unique
- Check region configuration matches bucket location

### Debug Commands
```bash
# Check AWS credentials
aws sts get-caller-identity

# Test bucket website configuration
aws s3api get-bucket-website --bucket your-bucket-name

# Check bucket policy
aws s3api get-bucket-policy --bucket your-bucket-name

# Test public access
curl -I https://your-bucket-name.s3-website-region.amazonaws.com/manifest.xml
```

## 📊 Monitoring and Maintenance

### S3 Metrics
Monitor your deployment through AWS CloudWatch:
- Request count and errors
- Data transfer metrics
- Bucket size and object count

### Cost Optimization
- S3 static website hosting costs:
  - Storage: $0.023/GB/month (standard)
  - Requests: $0.0004/1,000 GET requests
  - Data transfer: $0.09/GB (first 10TB/month)
- No CloudFront costs = significant savings
- Consider S3 Intelligent Tiering for long-term storage

### Automated Deployments
The deployment script automatically:
- Sets correct content types for all files
- Applies proper caching headers
- Validates file uploads
- Provides deployment status and URLs

## 🚀 CI/CD Pipeline

For automated deployments, see `.github/workflows/deploy.yml` for GitHub Actions configuration that supports direct S3 deployment.

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify AWS permissions and S3 configuration
3. Test S3 website endpoint directly in browser
4. Ensure all Node.js dependencies are installed
5. Validate manifest.xml syntax and accessibility

## 🎯 Next Steps

After successful deployment:
1. Test the add-in in Outlook using the S3 website URL
2. Verify all features work correctly
3. Monitor S3 costs and usage
4. Set up automated deployments via GitHub Actions
5. Configure custom domain (optional) using Route 53
6. Implement additional security measures for enterprise private network environments

## 🔐 Enterprise Private Network Security Enhancements

For enterprise private network or high-security environments:

### VPC Endpoints (Optional)
```bash
# Create VPC endpoint for S3 (for completely private access)
aws ec2 create-vpc-endpoint \
  --vpc-id vpc-12345678 \
  --service-name com.amazonaws.region.s3 \
  --vpc-endpoint-type Gateway
```

### Access Logging
```bash
# Enable S3 access logging for audit trails
aws s3api put-bucket-logging \
  --bucket your-bucket-name \
  --bucket-logging-status file://logging.json
```

### Encryption at Rest
```bash
# Enable default encryption
aws s3api put-bucket-encryption \
  --bucket your-bucket-name \
  --server-side-encryption-configuration file://encryption.json
```

## 🔐 Enterprise Operations & Monitoring

### **Production Checklist**
- [ ] S3 bucket configured with website hosting
- [ ] HTTPS access verified
- [ ] CORS policies applied
- [ ] Bucket policies configured for network restrictions
- [ ] AI provider endpoints tested and secured
- [ ] User permissions and access controls validated
- [ ] Monitoring and alerting configured

### **Daily Operations**
1. **System Health**: Monitor S3 availability and response times
2. **Usage Metrics**: Track add-in adoption and feature usage  
3. **Security Alerts**: Review classification screening logs
4. **Cost Monitoring**: Track AI provider API usage and costs

### **Weekly Maintenance**
- Review usage reports and user feedback
- Check certificate expiration dates
- Validate backup and recovery procedures
- Update security and compliance documentation

### **Monthly Reviews**
- Security and compliance assessment
- Performance optimization review
- User training and adoption analysis
- Cost optimization evaluation

### **Incident Response**
1. **Level 1**: Basic troubleshooting (help desk)
2. **Level 2**: Technical investigation (IT support) 
3. **Level 3**: Developer/vendor escalation
4. **Emergency**: Security incident response team

### **Common Issues & Solutions**

**Add-in Not Loading:**
- Verify S3 website endpoint accessibility
- Check manifest.xml syntax and URLs
- Confirm HTTPS certificate validity
- Test CORS configuration

**AI Features Failing:**
- Validate AI provider connectivity
- Check API keys and rate limits
- Review network firewall rules
- Verify classification screening logic

**Performance Issues:**
- Monitor S3 response times
- Check AI provider latency
- Review network connectivity
- Optimize static asset caching

### **Security Monitoring**
- Monitor classification bypass attempts
- Track AI provider API usage patterns
- Alert on security policy violations
- Regular security assessment reviews
- Audit trail maintenance and compliance
