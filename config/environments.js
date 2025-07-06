// Environment-specific configuration for deployment
module.exports = {
  // Home development environment - Direct S3 for faster iteration
  home: {
    s3Bucket: '293354421824-outlook-email-assistant',
    region: 'us-east-1',
    // Using direct S3 URL instead of CloudFront for faster testing
    baseUrl: 'https://293354421824-outlook-email-assistant.s3.amazonaws.com',
    environment: 'home',
    useCloudFront: false // Skip CloudFront for now
  },
  
  // Work environment (to be configured when ready)
  work: {
    s3Bucket: '', // TBD - your work S3 bucket ARN
    region: 'us-gov-west-1', // GovCloud region, update as needed
    cloudFrontDistributionId: '', // Will be populated after CloudFront setup
    baseUrl: '', // Will be populated after CloudFront setup
    environment: 'work'
  }
};

// Helper function to get current environment config
function getCurrentEnvironment() {
  const env = process.env.NODE_ENV || 'home';
  return module.exports[env] || module.exports.home;
}

module.exports.getCurrentEnvironment = getCurrentEnvironment;
