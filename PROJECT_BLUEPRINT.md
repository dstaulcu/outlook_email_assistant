# Copilot Prompt: Create Outlook Email AI Assistant with OpenAI/Ollama Support

## Project Overview
Create a Microsoft Outlook add-in that provides AI-powered email assistance using both cloud AI services (OpenAI) and local AI models (Ollama). The add-in should help users summarize emails, compose replies, and perform other AI-powered email tasks. **The add-in activates when the user selects an email and displays in a task pane docked to the email interface.**

## Technical Requirements

### Core Technologies
- **Framework**: Microsoft Office Add-ins (React + TypeScript)
- **Build Tool**: Webpack
- **UI Library**: Fluent UI React components
- **Deployment**: Amazon S3 static hosting
- **Local Development**: Node.js with npm

### AI Service Integration
1. **OpenAI API** (GPT models) - Cloud-based AI service with API key authentication
2. **Local Ollama** (with proper CORS handling) - Local/self-hosted AI service
3. **Model Discovery System** - Dynamically discover and test available models
4. **Provider Abstraction Layer** - Unified interface for both providers with user-selectable default

## Key Features to Implement

### 1. Configuration Panel
- **AI Provider selection dropdown** (OpenAI, Ollama Local)
- **Dynamic configuration fields** based on selected provider
- **Provider-specific validation** for URLs, API keys, and models
- **Base URL input field** with provider-specific defaults
- **API Key input field** (required for OpenAI, optional for Ollama)
- **Model discovery and testing** - List available models and test connectivity
- **Default model selection** per provider
- **Settings persistence** in Office.js roaming settings with localStorage fallback
- **User profile management** - Personal and professional context settings

### 2. AI Service Manager
- **Provider Factory Pattern**: Create OpenAI/Ollama providers dynamically
- **Unified abstraction layer** for both providers with consistent interfaces
- **Model discovery service** - Enumerate and test available models
- **Provider health monitoring** - Check connectivity and model availability
- **Configuration validation** per provider type
- **Graceful error handling** and fallback mechanisms
- **CORS-compatible requests** for Ollama
- **Dynamic model fetching** with provider-specific endpoints
- **Authentication abstraction** (API keys for OpenAI, no-auth for Ollama)
- **Request/response normalization** across OpenAI and Ollama APIs

### 3. User Preference System
- **Provider preferences** - Default AI provider, URLs, and models
- **Personal context profile** - User's role, job description, communication style
- **Professional stakeholder registry** - Key contacts and their relationship context
- **Email tone preferences** - Formal, casual, technical, friendly settings
- **Response personalization** - Tailor AI responses based on user profile
- **Preference persistence** - Office.js roaming settings with fallback:
  - **Primary**: Office.js roamingSettings API for automatic cross-device sync
  - **Enterprise**: Works with older Exchange versions without Graph API
  - **Fallback**: localStorage with encryption for development/standalone mode
  - **No Admin Required**: Uses built-in Office Add-in capabilities
- **Profile templates** - Pre-configured settings for common roles
- **Context-aware prompting** - Inject user context into AI requests
- **Office.js roaming storage** - Automatic cross-device sync with Office profile
- **Roaming profile support** - Settings follow users across domain computers

### 4. Model Discovery & Testing
- **Dynamic model enumeration** - Discover available models from each provider
- **Fallback model selection** - Automatic fallback when primary model unavailable

### 5. Email AI Features
- **Email summarization** with user context awareness
- **Reply composition assistance** tailored to user's communication style
- **Email classification/categorization** based on user's role and priorities
- **Tone adjustment** according to recipient relationship and context
- **Language translation** with professional/personal context preservation
- **Template generation** based on user's common email patterns
- **Stakeholder-aware responses** - Adjust tone based on recipient relationship
- **AI Analysis Dashboard** - Structured insights with editable draft responses
- **Draft iteration system** - User feedback loop for refining AI responses
- **Action item extraction** - Automatically identify tasks and due dates
- **Priority assessment** - AI-driven email priority scoring

#### 5.1. AI Email Analysis Dashboard
- **Structured AI Response Format** - Return observations, actions, due dates, priority, and draft
- **Dashboard UI Components** - Visual elements for summary, actions, priority above text editor
- **Editable Draft Interface** - Rich text editor for direct draft modification
- **Feedback Loop System** - User can provide feedback to refine AI responses
- **Iteration Tracking** - Version control for draft refinements
- **Action Item Management** - Extract and display actionable items with due dates
- **Priority Visualization** - Color-coded priority indicators and explanations

#### 5.2. Quick-Modifier Feedback Interface
- **Verbosity Slider** - 1-5 scale from brief to detailed responses
- **Tone Controls** - Radio buttons for enthusiastic, neutral, reserved, professional, casual
- **Formality Selector** - Dropdown for formal, professional, casual, friendly
- **Length Presets** - Quick buttons for brief, standard, comprehensive
- **Urgency Adjustment** - Low, medium, high urgency settings
- **Personal Touch Toggle** - Include/exclude relationship context
- **Custom Presets** - Save and load frequently used modifier combinations
- **Real-time Preview** - Show what changes will be applied before refinement

### 6. User Interface
- **Clean, modern Fluent UI design** optimized for Outlook task pane
- **Responsive layout** for different screen sizes
- **Model testing interface** - Test and compare different models
- **User profile editor** - Manage personal and professional context
- **Preference dashboard** - Configure all settings in one place
- **Loading states and error messages** with helpful troubleshooting
- **Keyboard shortcuts support** for power users
- **S3-hosted assets** for reliable performance and caching
- **AI Analysis Dashboard** - Visual insights with editable draft interface
- **Draft iteration controls** - Previous/next draft versions with feedback interface
- **Action item widgets** - Interactive cards for tasks and due dates
- **Priority indicators** - Visual priority scoring with explanations

#### 6.1. UI Components
- **Summary Card** - Visual summary of email content and key points
- **Action Items Panel** - List of extracted tasks with due dates and priority
- **Priority Indicator** - Color-coded priority score with reasoning
- **Draft Editor** - Rich text editor for AI-generated draft responses
- **Feedback Interface** - User input for refining AI responses
- **Iteration Controls** - Navigate between draft versions and revisions
- **Stakeholder Context** - Display recipient relationship and suggested tone

### 7. Security Classification Detection
- **Classification Parser** - Analyze first 4 lines of email body for classification markings
- **Classification Validation** - Detect UNCLASSIFIED, CONFIDENTIAL, SECRET, TOP SECRET markings
- **Processing Gate** - Block LLM processing for SECRET and above classifications
- **Security Warnings** - Display clear warnings when classified content is detected
- **Bypass Prevention** - Prevent users from overriding security restrictions
- **Audit Logging** - Log attempts to process classified content
- **Classification Indicators** - Visual indicators showing email classification status
- **Safe Processing Mode** - Allow processing only for UNCLASSIFIED or unmarked emails

#### 7.1. Classification Detection Logic
- **Pattern Recognition** - Search for standard classification patterns in email headers
- **Multi-format Support** - Detect various classification marking formats
- **Case Insensitive** - Handle different capitalization of classification markings
- **Position Validation** - Check first 4 lines of email body content
- **Precedence Rules** - Higher classifications override lower ones if multiple found
- **Default Behavior** - Treat unmarked emails as safe to process
- **Error Handling** - Gracefully handle parsing errors with security-first approach

### 8. Email Context Management
- **Selected email detection** - Automatically detect when user selects an email
- **Email content extraction** - Parse email body, subject, sender, recipients
- **Classification detection** - Check first 4 lines for security classification markings
- **Security validation** - Block LLM processing for SECRET and above classifications
- **Thread context awareness** - Understand email conversations and history
- **Attachment handling** - Process and reference email attachments
- **Email metadata extraction** - Parse importance, categories, flags
- **Multi-email session management** - Handle switching between different emails
- **Email state persistence** - Remember AI interactions per email
- **Real-time email updates** - Sync with email changes and updates

### 9. Task Pane Integration
- **Email-activated task pane** - Opens when user selects an email
- **Docked to email interface** - Remains visible alongside selected email
- **Context-aware display** - Shows relevant AI features based on selected email
- **Multi-email support** - Handle switching between different selected emails
- **Persistent state** - Maintain AI conversation context per email
- **Ribbon integration** - Provide ribbon buttons for quick activation
- **Auto-activation options** - Configurable auto-open for new emails
- **Pinnable task pane** - Users can pin/unpin the task pane as needed
- **Email Selection Detection** - Automatically detect when user selects an email in Outlook
- **Task Pane Service** - Manage task pane lifecycle and state persistence
- **Email Context Extraction** - Parse email content, metadata, and attachments
- **Context Caching** - Cache email context for fast switching between emails
- **Event Notification System** - Notify components when email selection changes

### 10. Manifest Configuration
- **Task pane configuration** - Define task pane dimensions and source location
- **Ribbon button integration** - Manual activation buttons in Outlook ribbon
- **Auto-activation rules** - Trigger task pane on email selection events
- **Required permissions** - ReadWriteItem permissions for email processing
- **Event-based activation** - OnMessageSelect and OnNewMessageCompose events
- **S3-hosted manifest** - Serve manifest and assets from S3 with proper caching
- **Icon assets** - Multiple icon sizes (16px, 32px, 80px) hosted on S3
- **Version management** - Support for manifest updates and cache invalidation

## Architecture Requirements

### Provider Abstraction
- **Abstract Provider Interface** - Unified interface for OpenAI and Ollama
- **Provider Factory Pattern** - Dynamic provider instantiation based on configuration
- **Configuration Schema System** - Provider-specific field definitions and validation
- **Authentication Manager** - Handle different auth mechanisms (API keys vs no-auth)
- **Endpoint Resolver** - Provider-specific URL resolution for models and chat
- **Response Adapters** - Normalize responses from different provider APIs

### Security Architecture
- **Classification Service** - Centralized security classification detection
- **Content Security Policy** - Prevent classified content from reaching LLMs
- **Access Control** - Role-based permissions for different classification levels
- **Audit Trail** - Log all security-related events and decisions
- **Secure Processing Pipeline** - Validate security clearance before LLM processing
- **Error Handling** - Security-first approach to classification parsing errors

### Caching Strategy
- **Email Context Cache** - Cache parsed email content for fast switching
- **AI Response Cache** - Cache similar responses to reduce API calls
- **User Preference Cache** - Persistent storage with cross-device sync
- **Model Metadata Cache** - Cache discovered models and performance data
- **Draft Iteration Cache** - Version history for draft refinements
- **Classification Cache** - Cache classification results to avoid re-parsing

### Office.js Roaming Storage Requirements
- **Office.js roamingSettings API** - Built-in Office Add-in storage for:
  - **Automatic Cross-Device Sync** - Settings follow users across devices with Office profile
  - **No Admin Configuration** - Works with existing Exchange infrastructure
  - **Enterprise Compatible** - Works with older Exchange versions without Graph API
  - **Secure by Design** - Uses Office's built-in security and encryption
- **localStorage Fallback** - Development and standalone mode support
- **Encrypted Storage** - CryptoJS encryption for sensitive preference data
- **Async Save Operations** - Non-blocking save with user feedback
- **Backward Compatibility** - Seamless migration from localStorage to roaming settings

### Error Handling
- **Graceful Degradation** - Fallback mechanisms when providers are unavailable
- **Provider Health Monitoring** - Check connectivity and model availability
- **User-Friendly Error Messages** - Clear troubleshooting guidance
- **Retry Logic** - Automatic retry with exponential backoff
- **Offline Support** - Essential features work with cached data
- **Security Error Handling** - Clear messaging for classification blocking

## S3 Direct Hosting Requirements
- **Static website hosting** - Enable S3 static hosting for add-in files
- **CORS configuration** - Allow requests from Office 365 domains
- **Cache headers** - Proper cache control for manifest and assets
- **Cache busting** - Hash-based filenames for updated deployments
- **Direct S3 hosting** - Use S3 static website endpoints for immediate deployment
- **Deployment automation** - PowerShell scripts for automated S3 deployment

## Office Add-in Manifest Requirements
- **Task pane configuration** - Define default dimensions and source location
- **Event-based activation** - OnMessageSelect and OnNewMessageCompose events
- **Ribbon integration** - Manual activation buttons in Outlook ribbon
- **Permission requirements** - ReadWriteItem for full email processing
- **Auto-activation rules** - Trigger task pane when emails are selected
- **Icon assets** - Multiple icon sizes (16px, 32px, 80px) hosted on S3
- **Version management** - Support for manifest updates and cache invalidation

## Data Structure Requirements

### Core Interfaces
- **EmailSelectionContext** - Selected email data with content, metadata, and attachments
- **EmailAnalysis** - Structured AI analysis with summary, actions, priority, and draft
- **ModifierSettings** - Quick-modifier controls for verbosity, tone, formality, length
- **UserPreferences** - Provider settings, user profile, and email preferences
- **ProviderConfig** - Provider-specific configuration with models and health status
- **Stakeholder** - Contact relationship data with communication preferences
- **ClassificationResult** - Email classification status and security level detection

### AI Analysis Structure
- **EmailSummary** - Key points, sentiment, context, and relationship info
- **ActionItem** - Task description, due date, priority, assignee, and category
- **PriorityAssessment** - Priority score (1-10), reasoning, factors, urgency, business impact
- **DraftResponse** - Generated content, tone, confidence, alternatives, and reasoning
- **ModifierPreferences** - Default settings, contextual defaults, recent modifiers, custom presets
- **SecurityClassification** - Classification level, detection confidence, source location, processing authorization

## Environment Setup Requirements

### Prerequisites
- **Node.js** (v18+) and npm
- **AWS CLI** configured for S3 deployment
- **Office 365 subscription** for testing
- **Ollama** installed locally (optional for local AI)

### Ollama Setup for Development
- **Install Ollama** from official installer
- **Pull Models** - Download popular models (llama3.2, mistral)
- **Start with CORS** - Enable CORS for browser requests
- **Configure localhost:11434** as default base URL

### S3 Bucket Configuration
- **CORS Configuration** - Allow requests from Office 365 domains
- **Static Website Hosting** - Enable S3 static hosting
- **Cache Headers** - Configure appropriate cache policies
- **CloudFront Distribution** - Optional CDN for better performance

## Success Criteria
- Add-in loads successfully in Outlook and connects to S3-hosted assets
- **Task pane activates automatically** when user selects an email
- **Task pane docks properly** alongside the selected email interface
- **Email context extraction** works reliably for subject, body, sender, recipients
- **Classification detection** accurately identifies security markings in first 4 lines
- **Security blocking** prevents LLM processing for SECRET and above classifications
- **Multi-email session management** handles switching between different emails
- **Provider abstraction system** supports OpenAI and Ollama seamlessly
- **Model discovery system** can enumerate and test available models from both providers
- **Configuration UI dynamically adapts** to selected provider's requirements
- **User preference system** captures and persists personal/professional context
- **Stakeholder relationship management** enables context-aware email responses
- **Email AI features work with personalization** based on user profile and recipient context
- **Provider-specific logic is properly isolated** within respective implementations
- **Model testing and comparison tools** help users choose optimal models
- **Task pane state persistence** maintains context per email
- **Ribbon integration** provides manual activation options
- **S3 deployment pipeline** works reliably with proper caching and CORS
- **Performance is optimized** with efficient caching and CDN delivery
- **Error handling is comprehensive** with helpful user feedback
- **Security compliance** ensures classified content is never processed by LLMs

Please create this project step by step, ensuring each component is properly abstracted and tested before moving to the next. Pay special attention to the **OpenAI/Ollama provider abstraction**, **user preference management system**, **model discovery and testing capabilities**, and **S3 deployment optimization** to create a robust, personalized email assistant.
