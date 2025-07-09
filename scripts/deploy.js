#!/usr/bin/env node

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load configuration
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf8'));

// Configure AWS SDK - S3 only for direct hosting
const s3 = new AWS.S3();

// Get environment from command line args (for potential future multi-environment support)
const environment = process.argv[2] || 'home';

console.log(`🚀 Deploying to ${environment} environment...`);
console.log(`📦 S3 Bucket: ${config.s3.bucket}`);

async function buildProject() {
  console.log('📦 Building project...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

async function uploadToS3() {
  console.log('📤 Uploading files to S3...');
  
  const distPath = path.join(__dirname, '../dist');
  const publicPath = path.join(__dirname, '../public');
  
  // Upload dist files
  await uploadDirectory(distPath, '');
  
  // Upload public files (including manifest.xml)
  await uploadDirectory(publicPath, '');
  
  console.log('✅ Files uploaded successfully');
}

async function uploadDirectory(dirPath, prefix) {
  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(dirPath, file.name);
    const s3Key = prefix ? `${prefix}/${file.name}` : file.name;
    
    if (file.isDirectory()) {
      await uploadDirectory(filePath, s3Key);
    } else {
      await uploadFile(filePath, s3Key);
    }
  }
}

async function uploadFile(filePath, s3Key) {
  const fileContent = fs.readFileSync(filePath);
  const contentType = getContentType(filePath);
  
  const params = {
    Bucket: config.s3.bucket,
    Key: s3Key,
    Body: fileContent,
    ContentType: contentType,
    CacheControl: getCacheControl(filePath)
  };
  
  try {
    await s3.upload(params).promise();
    console.log(`📄 Uploaded: ${s3Key}`);
  } catch (error) {
    console.error(`❌ Failed to upload ${s3Key}:`, error.message);
    throw error;
  }
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
  };
  
  return contentTypes[ext] || 'application/octet-stream';
}

function getCacheControl(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  // Cache static assets for 1 year
  if (['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot'].includes(ext)) {
    return 'public, max-age=31536000, immutable';
  }
  
  // Cache HTML and manifest for 1 hour
  if (['.html', '.xml'].includes(ext)) {
    return 'public, max-age=3600';
  }
  
  // Default cache for other files
  return 'public, max-age=86400';
}

async function invalidateCloudFront() {
  // Skip CloudFront - using S3 direct hosting only
  console.log('⚠️  Using S3 direct hosting - no CloudFront invalidation needed');
  return;
}

async function deploy() {
  try {
    await buildProject();
    await uploadToS3();
    await invalidateCloudFront();
    
    console.log('\n🎉 Deployment completed successfully!');
    console.log(`🌐 Your add-in is available at: ${config.s3.baseUrl}`);
    console.log(`📄 Manifest URL: ${config.s3.baseUrl}/manifest.xml`);
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment
deploy();
