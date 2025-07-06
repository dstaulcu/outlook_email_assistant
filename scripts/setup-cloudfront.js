#!/usr/bin/env node

const AWS = require('aws-sdk');
const environments = require('../config/environments');

// Configure AWS SDK
const cloudfront = new AWS.CloudFront();

// Get environment from command line args
const environment = process.argv[2] || 'home';
const config = environments[environment];

if (!config) {
  console.error(`❌ Unknown environment: ${environment}`);
  console.error('Available environments:', Object.keys(environments));
  process.exit(1);
}

console.log(`🌐 Setting up CloudFront distribution for ${environment} environment...`);

async function createCloudFrontDistribution() {
  const params = {
    DistributionConfig: {
      CallerReference: `outlook-email-assistant-${environment}-${Date.now()}`,
      Comment: `Outlook Email AI Assistant - ${environment} environment`,
      DefaultCacheBehavior: {
        TargetOriginId: `S3-${config.s3Bucket}`,
        ViewerProtocolPolicy: 'redirect-to-https',
        MinTTL: 0,
        ForwardedValues: {
          QueryString: false,
          Cookies: {
            Forward: 'none'
          }
        },
        TrustedSigners: {
          Enabled: false,
          Quantity: 0
        },
        Compress: true,
        DefaultTTL: 86400,
        MaxTTL: 31536000
      },
      Origins: {
        Quantity: 1,
        Items: [
          {
            Id: `S3-${config.s3Bucket}`,
            DomainName: `${config.s3Bucket}.s3.amazonaws.com`,
            S3OriginConfig: {
              OriginAccessIdentity: ''
            }
          }
        ]
      },
      Enabled: true,
      DefaultRootObject: 'index.html',
      PriceClass: 'PriceClass_100', // Use only US, Canada, and Europe
      HttpVersion: 'http2',
      CustomErrorResponses: {
        Quantity: 1,
        Items: [
          {
            ErrorCode: 404,
            ResponsePagePath: '/index.html',
            ResponseCode: '200',
            ErrorCachingMinTTL: 300
          }
        ]
      },
      CacheBehaviors: {
        Quantity: 2,
        Items: [
          {
            PathPattern: '*.xml',
            TargetOriginId: `S3-${config.s3Bucket}`,
            ViewerProtocolPolicy: 'redirect-to-https',
            MinTTL: 0,
            DefaultTTL: 3600,
            MaxTTL: 3600,
            ForwardedValues: {
              QueryString: false,
              Cookies: {
                Forward: 'none'
              }
            },
            TrustedSigners: {
              Enabled: false,
              Quantity: 0
            },
            Compress: true
          },
          {
            PathPattern: 'static/*',
            TargetOriginId: `S3-${config.s3Bucket}`,
            ViewerProtocolPolicy: 'redirect-to-https',
            MinTTL: 31536000,
            DefaultTTL: 31536000,
            MaxTTL: 31536000,
            ForwardedValues: {
              QueryString: false,
              Cookies: {
                Forward: 'none'
              }
            },
            TrustedSigners: {
              Enabled: false,
              Quantity: 0
            },
            Compress: true
          }
        ]
      }
    }
  };

  try {
    console.log('🔄 Creating CloudFront distribution...');
    const result = await cloudfront.createDistribution(params).promise();
    
    console.log('✅ CloudFront distribution created successfully!');
    console.log(`📋 Distribution ID: ${result.Distribution.Id}`);
    console.log(`🌐 Domain Name: ${result.Distribution.DomainName}`);
    console.log(`🔗 Your add-in URL: https://${result.Distribution.DomainName}`);
    
    console.log('\n📝 Next steps:');
    console.log('1. Update your config/environments.js with the following:');
    console.log(`   cloudFrontDistributionId: '${result.Distribution.Id}'`);
    console.log(`   baseUrl: 'https://${result.Distribution.DomainName}'`);
    console.log('\n2. Wait 10-15 minutes for the distribution to deploy');
    console.log('3. Run deployment: npm run deploy:' + environment);
    
    return result.Distribution;
    
  } catch (error) {
    console.error('❌ Failed to create CloudFront distribution:', error.message);
    
    if (error.code === 'InvalidOriginAccessIdentity') {
      console.log('\n💡 Tip: You may need to create an Origin Access Identity first');
    }
    
    throw error;
  }
}

async function setupBucketPolicy() {
  console.log('🔧 Setting up S3 bucket policy for CloudFront access...');
  
  const s3 = new AWS.S3();
  
  const policy = {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'AllowCloudFrontAccess',
        Effect: 'Allow',
        Principal: {
          Service: 'cloudfront.amazonaws.com'
        },
        Action: 's3:GetObject',
        Resource: `arn:aws:s3:::${config.s3Bucket}/*`
      },
      {
        Sid: 'AllowPublicRead',
        Effect: 'Allow',
        Principal: '*',
        Action: 's3:GetObject',
        Resource: `arn:aws:s3:::${config.s3Bucket}/*`
      }
    ]
  };
  
  try {
    await s3.putBucketPolicy({
      Bucket: config.s3Bucket,
      Policy: JSON.stringify(policy)
    }).promise();
    
    console.log('✅ S3 bucket policy updated successfully');
  } catch (error) {
    console.error('❌ Failed to update S3 bucket policy:', error.message);
    console.log('💡 You may need to set this up manually in the AWS console');
  }
}

async function setupCloudFront() {
  try {
    await setupBucketPolicy();
    await createCloudFrontDistribution();
    
    console.log('\n🎉 CloudFront setup completed successfully!');
    console.log('\n⏰ Note: It takes 10-15 minutes for CloudFront distributions to become active');
    
  } catch (error) {
    console.error('\n❌ CloudFront setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup
setupCloudFront();
