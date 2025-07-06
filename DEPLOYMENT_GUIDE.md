# Outlook Email AI Assistant - AWS Deployment Guide

## 🚀 Deployment Overview

This guide will help you deploy the Outlook Email AI Assistant to AWS S3 with CloudFront CDN for both your home development environment and future work environment.

## 📋 Prerequisites

### 1. AWS CLI Setup
```bash
# Install AWS CLI v2
# Windows: Download from https://aws.amazon.com/cli/
# Or use PowerShell:
winget install Amazon.AWSCLI

# Configure AWS credentials
aws configure
```

### 2. Node.js Dependencies
```bash
# Install AWS SDK
npm install aws-sdk --save-dev
```

### 3. AWS Permissions
Ensure your AWS credentials have the following permissions:
- S3: `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket`, `s3:PutBucketPolicy`
- CloudFront: `cloudfront:CreateDistribution`, `cloudfront:GetDistribution`, `cloudfront:CreateInvalidation`

## 🏠 Home Environment Setup

### Step 1: Configure Your Environment
Update `config/environments.js` with your specific settings:

```javascript
home: {
  s3Bucket: '293354421824-outlook-email-assistant',
  region: 'us-east-1', // Update to your bucket's region
  // CloudFront settings will be populated automatically
}
```

### Step 2: Set Up CloudFront Distribution
```bash
# Create CloudFront distribution for your S3 bucket
node scripts/setup-cloudfront.js home
```

This will:
- Create a CloudFront distribution
- Configure S3 bucket policy
- Output the distribution ID and domain name

### Step 3: Update Configuration
After CloudFront setup, update `config/environments.js` with the output:

```javascript
home: {
  s3Bucket: '293354421824-outlook-email-assistant',
  region: 'us-east-1',
  cloudFrontDistributionId: 'E123456789ABCD', // From setup output
  baseUrl: 'https://d123456789abcd.cloudfront.net', // From setup output
  environment: 'home'
}
```

### Step 4: Deploy Your Application
```bash
# Deploy to home environment
npm run deploy:home
```

## 🏢 Work Environment Setup

### Step 1: Configure Work Environment
When you're ready to set up your work environment, update `config/environments.js`:

```javascript
work: {
  s3Bucket: 'your-work-bucket-name', // Your work S3 bucket
  region: 'us-gov-west-1', // GovCloud or your work region
  cloudFrontDistributionId: '', // Will be populated
  baseUrl: '', // Will be populated
  environment: 'work'
}
```

### Step 2: Set Up Work CloudFront
```bash
# Create CloudFront distribution for work environment
node scripts/setup-cloudfront.js work
```

### Step 3: Deploy to Work Environment
```bash
# Deploy to work environment
npm run deploy:work
```

## 📝 Available Commands

### Deployment Commands
```bash
npm run deploy:home    # Deploy to home environment
npm run deploy:work    # Deploy to work environment
npm run build         # Build project locally
```

### Setup Commands
```bash
node scripts/setup-cloudfront.js home    # Setup CloudFront for home
node scripts/setup-cloudfront.js work    # Setup CloudFront for work
```

## 🔧 Manual Configuration

### S3 Bucket Settings
Ensure your S3 bucket has:
- Public read access (for the add-in files)
- Static website hosting enabled
- CORS configuration for cross-origin requests

### CloudFront Settings
The automated setup configures:
- HTTPS redirect (required for Office add-ins)
- Gzip compression
- Caching rules:
  - Static assets: 1 year cache
  - HTML/XML: 1 hour cache
  - Default: 1 day cache

## 🌐 Office Add-in Configuration

### Manifest URL
After deployment, your manifest.xml will be available at:
- Home: `https://your-cloudfront-domain.cloudfront.net/manifest.xml`
- Work: `https://your-work-cloudfront-domain.cloudfront.net/manifest.xml`

### Sideloading in Outlook
1. Go to Outlook > Get Add-ins > My add-ins
2. Choose "Add a custom add-in" > "Add from URL"
3. Enter your manifest URL
4. Click "OK" to install

## 🔍 Troubleshooting

### Common Issues

#### 1. CloudFront Distribution Not Working
- Wait 10-15 minutes for distribution to deploy
- Check if S3 bucket policy allows CloudFront access
- Verify bucket is in the correct region

#### 2. Office Add-in Not Loading
- Ensure HTTPS is working (CloudFront provides this)
- Check that manifest.xml is accessible
- Verify all referenced files are uploaded

#### 3. Deployment Failures
- Check AWS credentials and permissions
- Verify S3 bucket exists and is accessible
- Ensure Node.js dependencies are installed

### Debug Commands
```bash
# Check AWS credentials
aws sts get-caller-identity

# List S3 bucket contents
aws s3 ls s3://your-bucket-name/

# Check CloudFront distribution status
aws cloudfront get-distribution --id YOUR-DISTRIBUTION-ID
```

## 📊 Monitoring and Maintenance

### CloudFront Metrics
Monitor your deployment through AWS CloudWatch:
- Request count
- Error rates
- Cache hit ratio
- Data transfer

### Automated Invalidation
The deployment script automatically invalidates CloudFront cache, ensuring users get the latest version immediately.

### Cost Optimization
- CloudFront pricing is based on data transfer and requests
- S3 costs are minimal for static hosting
- Use CloudFront's free tier (1TB transfer, 10M requests/month)

## 🚀 CI/CD Pipeline

For automated deployments, see `.github/workflows/deploy.yml` for GitHub Actions configuration.

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify AWS permissions and configuration
3. Review CloudFront and S3 logs in AWS Console
4. Ensure all Node.js dependencies are installed

## 🎯 Next Steps

After successful deployment:
1. Test the add-in in Outlook
2. Verify all features work correctly
3. Monitor performance and costs
4. Set up automated deployments via GitHub Actions
5. Configure domain name (optional) for branded URLs
