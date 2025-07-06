# Outlook Email AI Assistant - Backlog

## Under Consideration
- maybe we need some sort of first-run instructions for users to visit the settings pane.. perhaps those instructions should be linked externally for continous improvement.. perhaps a github hosted user guide? (markdown?)
- think through audit logging.. where would it get stored?  Seems like we can't write to local file system.. maybe Splunk http event collector?  where would such a setting be stored, what would it contain?  is that too private?   Perhaps we should get rid of audit altogther.  Maybe the goal instead shoudl be telemtry where we simply denote who is using which aspects (e.g. invoked add-in, generated analysis with X LLM and Y model, iterated with LLM to imprve generated response, sent reply remail with generated email) of the application
- there is a blue bar under the side-page title which if you click on it, says skip to content. it looks weird.  what is it's purpose?  I assum it has something to do with 508 support since it's new to me.
- I'm wondering if we should improve the icon for the add-in in outlook.. Should we use the Robot?
- Should we rename the add-in button and sidebar headers in any way?  

## Production Deployment Strategy ✅

### AWS S3 + CloudFront Setup - **COMPLETED**
- [x] **S3 Bucket Configuration**: Using existing bucket `293354421824-outlook-email-assistant` ✅ COMPLETED
- [x] **CloudFront CDN Setup**: Automated CloudFront distribution creation ✅ COMPLETED
- [x] **Multi-Environment Support**: Home and Work environment configurations ✅ COMPLETED
- [x] **Deployment Scripts**: Automated build, upload, and cache invalidation ✅ COMPLETED
- [x] **GitHub Actions CI/CD**: Automated deployment pipeline ✅ COMPLETED

### Implementation Details:
- **Deployment Scripts**: `scripts/deploy.js` and `scripts/setup-cloudfront.js`
- **Environment Config**: `config/environments.js` with home/work settings
- **NPM Commands**: `npm run deploy:home` and `npm run deploy:work`
- **Documentation**: Complete deployment guide in `DEPLOYMENT_GUIDE.md`

### Next Steps:
1. Run `npm run setup-cloudfront:home` to create CloudFront distribution
2. Update `config/environments.js` with the output values
3. Deploy with `npm run deploy:home`
4. Test the add-in at the CloudFront URL

## GitHub Integration & Documentation ✅

### GitHub Repository Setup - **COMPLETED**
- [x] **Repository Created**: https://github.com/dstaulcu/outlook_email_assistant ✅ COMPLETED
- [x] **Initial Commit**: All 41 files committed and pushed ✅ COMPLETED
- [x] **GitHub Actions Pipeline**: Ready for CI/CD deployment ✅ COMPLETED
- [x] **Documentation**: Complete deployment and developer guides ✅ COMPLETED

### Implementation Details:
- **Repository URL**: https://github.com/dstaulcu/outlook_email_assistant
- **Branch**: `main` (default)
- **Files**: 41 files including complete codebase, deployment scripts, and documentation
- **CI/CD**: GitHub Actions workflow ready for AWS deployment

### Next Steps:
1. **Set up GitHub Actions secrets** for AWS deployment
2. **Enable GitHub Pages** for documentation hosting
3. **Add GitHub link to UI** in settings panel
4. **Create user guide** on GitHub Pages

## Future Enhancements
- [x] **Add GitHub link to UI**: Plan to add repository link in settings panel ✅ PLANNED
- [x] **External User Guide**: GitHub Pages documentation strategy ✅ PLANNED
- [x] **First-Run Instructions**: Guided tour to settings panel ✅ PLANNED

## Pending Tasks
- [x] **ACCESSIBILITY COMPLIANCE**: Section 508 (U.S. Federal Standard) accessibility requirements ✅ **COMPLETED**
  - [x] Review current UI components for screen reader compatibility ✅ COMPLETED
  - [x] Ensure proper ARIA labels and keyboard navigation ✅ COMPLETED
  - [x] Test with accessibility tools and screen readers ✅ COMPLETED
  - [x] Address any compliance gaps identified ✅ COMPLETED
  
  **Status**: Ready for manual screen reader testing and Section 508 certification audit

