import React from 'react';
import { Card, CardHeader, CardPreview, Text, Button, Divider, Switch, Label } from '@fluentui/react-components';
import { Mail24Regular, Settings24Regular, Bot24Regular } from '@fluentui/react-icons';
import { AIProviderManager } from '@/services/AIProviderManager';
import { UserPreferenceManager } from '@/services/UserPreferenceManager';
import { SecurityClassificationService } from '@/services/SecurityClassificationService';
import { Colors } from '@/styles/colors';
import { KeyboardNavigationUtils } from '@/utils/accessibility';
import '@/styles/accessibility.css';
import SettingsPanel from './SettingsPanel';


interface TaskPaneContainerProps {
  isOfficeReady: boolean;
}

export const TaskPaneContainer: React.FC<TaskPaneContainerProps> = ({ isOfficeReady }) => {
  const [selectedEmail, setSelectedEmail] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<string | null>(null);
  const [showSettings, setShowSettings] = React.useState(false);
  const [isFirstRun, setIsFirstRun] = React.useState(UserPreferenceManager.isFirstRun());
  const [emailContent, setEmailContent] = React.useState<{
    subject: string;
    body: string;
    sender: string;
    isClassified: boolean;
    classificationLevel?: string;
    receivedTime?: Date;
    attachments?: Array<{
      id: string;
      name: string;
      size: number;
      contentType: string;
    }>;
  } | null>(null);
  const [refinementInput, setRefinementInput] = React.useState<string>('');
  const [generatedDraft, setGeneratedDraft] = React.useState<string>('');
  
  // Get user preferences for default values
  const userPrefs = UserPreferenceManager.getPreferences();
  const [isProfessional, setIsProfessional] = React.useState<boolean>(
    userPrefs.uiPreferences.defaultTone === 'professional'
  );
  const [isDetailed, setIsDetailed] = React.useState<boolean>(
    userPrefs.uiPreferences.defaultLength === 'detailed'
  );

  
  // AI Provider Manager instance
  const [aiManager] = React.useState(() => new AIProviderManager());
  
  // Keyboard navigation ref
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // Load current email when Office is ready
  React.useEffect(() => {
    if (isOfficeReady) {
      loadCurrentEmail();
    }
  }, [isOfficeReady]);
  
  // Add keyboard navigation and accessibility features
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Add skip links for main content areas
    KeyboardNavigationUtils.addSkipLinks(container);
    
    // Handle keyboard navigation
    const handleKeyDown = (event: KeyboardEvent) => {
      const focusableElements = KeyboardNavigationUtils.getFocusableElements(container);
      KeyboardNavigationUtils.handleKeyboardNavigation(event, focusableElements);
    };
    
    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  const loadCurrentEmail = async () => {
    try {
      if (!(window as any).Office) {
        console.warn('Office.js not available');
        return;
      }
      
      const item = (window as any).Office.context.mailbox.item;
      if (item) {
        const subject = item.subject || '';
        const sender = item.from?.displayName || item.from?.emailAddress || 'Unknown';
        const receivedTime = item.dateTimeCreated || item.dateTimeModified || new Date();
        
        // Get email body
        item.body.getAsync((window as any).Office.CoercionType.Text, (result: any) => {
          if (result.status === (window as any).Office.AsyncResultStatus.Succeeded) {
            const body = result.value || '';
            
            // Extract attachment metadata
            const attachments = item.attachments ? item.attachments.map((att: any) => ({
              id: att.id || `att-${Date.now()}`,
              name: att.name || 'Unknown attachment',
              size: att.size || 0,
              contentType: att.contentType || 'application/octet-stream'
            })) : [];
            
            // Check for security classification
            const emailContext = {
              id: 'current-email',
              subject,
              body,
              sender: { name: sender, email: sender },
              recipients: { to: [], cc: [], bcc: [] },
              attachments: attachments,
              metadata: {
                importance: 'normal' as const,
                categories: [],
                flags: [],
                receivedTime: receivedTime,
                threadId: ''
              }
            };
            
            const classificationResult = SecurityClassificationService.analyzeEmailClassification(emailContext);
            
            setEmailContent({
              subject,
              body,
              sender,
              isClassified: !classificationResult.isProcessingAllowed,
              classificationLevel: classificationResult.classification?.level,
              receivedTime: receivedTime,
              attachments: attachments
            });
            
            // Auto-analyze if enabled and email is safe for AI processing
            const userPrefs = UserPreferenceManager.getPreferences();
            console.log('Auto-analyze check:', {
              autoAnalyzeEnabled: userPrefs.uiPreferences.autoAnalyzeEmail,
              isProcessingAllowed: classificationResult.isProcessingAllowed,
              classification: classificationResult.classification
            });
            
            if (userPrefs.uiPreferences.autoAnalyzeEmail && classificationResult.isProcessingAllowed) {
              console.log('Auto-analyzing email...');
              // Use setTimeout to ensure the state is updated before analysis
              setTimeout(() => {
                handleAnalyzeEmail();
              }, 100);
            } else {
              console.log('Auto-analyze skipped:', {
                reason: !userPrefs.uiPreferences.autoAnalyzeEmail ? 'Auto-analyze disabled' : 'Processing not allowed'
              });
            }
          }
        });
      }
    } catch (error) {
      console.error('Error loading current email:', error);
    }
  };
  
  const handleAnalyzeEmail = async () => {
    if (!emailContent) {
      console.warn('No email content to analyze');
      return;
    }
    
    if (emailContent.isClassified) {
      console.warn('Cannot analyze classified email');
      return;
    }
    
    setIsProcessing(true);
    setAnalysisResult(null);
    
    try {
      // Get user preferences
      const userPrefs = UserPreferenceManager.getPreferences();
      
      // Initialize providers if not already done
      await aiManager.initializeProviders(userPrefs);
      
      // Create email context for analysis
      const emailContext = {
        id: 'current-email',
        subject: emailContent.subject,
        body: emailContent.body,
        sender: {
          name: emailContent.sender,
          email: emailContent.sender
        },
        recipients: { to: [], cc: [], bcc: [] },
        attachments: emailContent.attachments || [],
        metadata: {
          importance: 'normal' as const,
          categories: [],
          flags: [],
          receivedTime: new Date(),
          threadId: ''
        }
      };
      
      // Get default AI provider
      const provider = aiManager.getDefaultProvider(userPrefs);
      if (!provider) {
        throw new Error('No AI provider available. Please configure a provider in settings.');
      }
      
      console.log('Analyzing email with AI provider:', provider.constructor.name);
      
      // Analyze the email
      const analysis = await provider.analyzeEmail(emailContext, userPrefs);
      
      // Format the analysis result for display with improved structure
      const keyPoints = analysis.summary.keyPoints?.length > 0 
        ? analysis.summary.keyPoints 
        : ['No key points identified'];
      
      const actions = analysis.actions?.length > 0 
        ? analysis.actions 
        : [{ description: 'No specific actions required', priority: 'low' }];
      
      const resultText = `🎯 KEY POINTS:
${keyPoints.map((point: string, index: number) => `${index + 1}. ${point}`).join('\n')}

📝 ACTION ITEMS:
${actions.map((action: any, index: number) => 
  `${index + 1}. ${action.description} [${action.priority?.toUpperCase() || 'NORMAL'}]`
).join('\n')}

📊 DETAILS:
• Priority: ${analysis.priority.score}/10 - ${analysis.priority.reasoning}
• Sentiment: ${analysis.summary.sentiment?.toUpperCase() || 'NEUTRAL'}
• Response Time: ${analysis.priority.recommendedResponseTime || 'Within 24 hours'}
• Topics: ${analysis.summary.topics?.join(', ') || 'General correspondence'}
${analysis.summary.urgencyIndicators?.length > 0 ? 
  `\n⚠️ URGENCY INDICATORS:\n${analysis.summary.urgencyIndicators.map((indicator: string) => `• ${indicator}`).join('\n')}` : ''}

💡 RECOMMENDATIONS:
• ${analysis.priority.score >= 8 ? 'High priority - respond promptly' : 
     analysis.priority.score >= 5 ? 'Medium priority - respond within normal timeframe' : 
     'Low priority - can be addressed when convenient'}
• Consider the sender's relationship and context when responding
• Address all action items in your response`.trim();
      
      setAnalysisResult(resultText);
      
    } catch (error) {
      console.error('Error analyzing email:', error);
      setAnalysisResult(`❌ Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleComposeAssist = async () => {
    if (!emailContent) {
      console.warn('No email content available for compose assistance');
      return;
    }
    
    if (emailContent.isClassified) {
      console.warn('Cannot provide compose assistance for classified email');
      return;
    }
    
    setIsProcessing(true);
    try {
      // Get user preferences
      const userPrefs = UserPreferenceManager.getPreferences();
      
      // Initialize providers if not already done
      await aiManager.initializeProviders(userPrefs);
      
      // Create email context
      const emailContext = {
        id: 'current-email',
        subject: emailContent.subject,
        body: emailContent.body,
        sender: { name: emailContent.sender, email: emailContent.sender },
        recipients: { to: [], cc: [], bcc: [] },
        attachments: emailContent.attachments || [],
        metadata: {
          importance: 'normal' as const,
          categories: [],
          flags: [],
          receivedTime: new Date(),
          threadId: ''
        }
      };
      
      // Get default AI provider
      const provider = aiManager.getDefaultProvider(userPrefs);
      if (!provider) {
        throw new Error('No AI provider available. Please configure a provider in settings.');
      }
      
      console.log('Generating compose assistance with AI provider:', provider.constructor.name);
      
      // Generate response with user preferences
      const basePrompt = `You are an intelligent email assistant. Please generate an appropriate response to this email based on the specified context and style preferences.`;
      
      const suggestion = await provider.generateResponseWithPreferences(
        basePrompt, 
        emailContext, 
        userPrefs, 
        isProfessional, 
        isDetailed, 
        refinementInput.trim() || undefined
      );
      
      setGeneratedDraft(suggestion);
      
      // Format the suggestion
      const resultText = `
📝 Generated Response

💡 Your ${isProfessional ? 'Professional' : 'Personal'} ${isDetailed ? 'Detailed' : 'Brief'} Response:
${suggestion}

${refinementInput.trim() ? `🎯 Applied Custom Instructions: ${refinementInput}\n` : ''}
📋 Settings Used:
• Context: ${isProfessional ? 'Professional' : 'Personal/Private'}
• Style: ${isDetailed ? 'Detailed' : 'Brief'}

📧 Next Steps:
• Review and edit the draft as needed
• Click "Create Reply in Outlook" to compose
      `.trim();
      
      setAnalysisResult(resultText);
      
    } catch (error) {
      console.error('Error with compose assistance:', error);
      setAnalysisResult(`❌ Compose assistance failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateReply = async () => {
    if (!generatedDraft) {
      console.warn('No draft available to create reply');
      return;
    }
    
    try {
      if (!(window as any).Office) {
        console.warn('Office.js not available - cannot create reply');
        alert('Office.js not available. Please use this feature within Outlook.');
        return;
      }
      
      // Get current item
      const item = (window as any).Office.context.mailbox.item;
      if (!item) {
        console.warn('No email item available');
        return;
      }
      
      // Create reply
      item.displayReplyAllForm({
        htmlBody: `<p>${generatedDraft.replace(/\n/g, '<br>')}</p>`,
        attachments: []
      });
      
      console.log('Reply created successfully');
      
    } catch (error) {
      console.error('Error creating reply:', error);
      alert('Error creating reply. Please try again.');
    }
  };
  
  const handleOpenSettings = () => {
    setShowSettings(true);
    if (isFirstRun) {
      UserPreferenceManager.markFirstRunComplete();
      setIsFirstRun(false);
    }
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
    // Reload preferences and re-test providers
    const preferences = UserPreferenceManager.getPreferences();
    aiManager.initializeProviders(preferences);
  };
  
  return (
    <>
      {showSettings ? (
        <SettingsPanel onClose={handleCloseSettings} />
      ) : (
        <div 
          style={{ 
            height: '100vh', 
            display: 'flex', 
            flexDirection: 'column', 
            minWidth: '100%', 
            maxWidth: '100%',
            boxSizing: 'border-box',
            overflowY: 'auto'
          }} 
          ref={containerRef}
          role="main"
          aria-label="PromptReply"
        >
          {/* Header */}
          <div style={{ 
            padding: '16px 20px 12px 20px', 
            borderBottom: '1px solid #e5e5e5',
            backgroundColor: '#f8f9fa',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '18px' }}>🤖</span>
            <Text size={500} weight="semibold" style={{ color: '#0078d4' }}>
              PromptReply
            </Text>
          </div>
          
          <div style={{ 
            padding: '8px 16px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
          {/* First Run Welcome Message */}
          {isFirstRun && (
            <Card style={{ marginBottom: '12px', backgroundColor: '#e6f3ff', borderColor: '#0078d4' }}>
              <CardPreview>
                <div style={{ padding: '16px' }}>
                  <Text weight="semibold" size={400} style={{ color: '#0078d4', marginBottom: '8px', display: 'block' }}>
                    Welcome to PromptReply! 🎉
                  </Text>
                  <Text size={300} style={{ marginBottom: '12px', display: 'block' }}>
                    Get started by configuring your AI provider. For the best first experience, we recommend using Ollama (local AI) which is already set as your default.
                  </Text>
                  <Button 
                    appearance="primary" 
                    onClick={handleOpenSettings}
                    size="small"
                  >
                    Configure Settings
                  </Button>
                </div>
              </CardPreview>
            </Card>
          )}

          {/* Email Status */}
      <Card style={{ marginBottom: '12px' }}>
        <CardHeader
          header={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail24Regular />
              <Text weight="semibold">Current Email</Text>
            </div>
          }
        />
        <CardPreview>
          <div style={{ padding: '16px' }}>
            {!isOfficeReady ? (
              <Text size={300} style={{ color: '#666' }}>
                Office.js not available - Running in standalone mode
              </Text>
            ) : !emailContent ? (
              <Text size={300} style={{ color: '#666' }}>
                Loading email content...
              </Text>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <Text size={200} weight="semibold">Received:</Text>
                  <Text size={300} style={{ marginLeft: '8px' }}>
                    {emailContent.receivedTime ? 
                      new Date(emailContent.receivedTime).toLocaleString() : 
                      'Unknown date'}
                  </Text>
                </div>
                <div>
                  <Text size={200} weight="semibold">From:</Text>
                  <Text size={300} style={{ marginLeft: '8px' }}>
                    {emailContent.sender}
                  </Text>
                </div>
                <div>
                  <Text size={200} weight="semibold">Subject:</Text>
                  <Text size={300} style={{ marginLeft: '8px' }}>
                    {emailContent.subject || 'No subject'}
                  </Text>
                </div>
                <div>
                  <Text size={200} weight="semibold">Security Status:</Text>
                  <Text 
                    size={300} 
                    style={{ 
                      marginLeft: '8px',
                      color: emailContent.isClassified ? '#d13438' : '#107c10'
                    }}
                  >
                    {emailContent.isClassified ? '🔒 Classified - AI Processing Disabled' : '✅ Safe for AI Processing'}
                  </Text>
                </div>
              </div>
            )}
          </div>
        </CardPreview>
      </Card>
      
      {/* Main Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0 }}>
        <Card style={{ flexShrink: 0 }}>
          <CardHeader
            header={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail24Regular />
                <Text weight="semibold">Email Analysis</Text>
              </div>
            }
          />
          <CardPreview>
            <div style={{ padding: '16px' }}>
              <Text size={300} style={{ marginBottom: '12px', display: 'block' }}>
                Analyze the current email for key information, actions, and context.
              </Text>
              <Button
                appearance="primary"
                onClick={handleAnalyzeEmail}
                disabled={isProcessing || !emailContent || emailContent.isClassified}
                style={{ width: '100%' }}
                aria-label={isProcessing ? 'Analyzing email content' : 'Analyze current email for key information and context'}
              >
                {isProcessing ? 'Analyzing...' : 'Analyze Email'}
              </Button>
              {emailContent?.isClassified && (
                <Text 
                  size={200} 
                  style={{ color: '#d13438', marginTop: '8px', display: 'block' }}
                  aria-live="assertive"
                  role="alert"
                >
                  ⚠️ Analysis disabled for classified content
                </Text>
              )}
              
              {/* Loading state announcement */}
              {isProcessing && (
                <Text 
                  size={200} 
                  style={{ color: '#0078d4', marginTop: '8px', display: 'block' }}
                  aria-live="polite"
                  role="status"
                >
                  Processing request...
                </Text>
              )}
              
              {analysisResult && (
                <div 
                  style={{ 
                    marginTop: '16px', 
                    padding: '12px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '6px',
                    border: '1px solid #e1e4e8',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}
                  aria-live="polite"
                  aria-label="Email analysis results"
                  role="region"
                >
                  <pre style={{ 
                    whiteSpace: 'pre-wrap', 
                    fontSize: '12px', 
                    lineHeight: '1.4', 
                    margin: 0,
                    fontFamily: 'inherit'
                  }}>
                    {analysisResult}
                  </pre>
                </div>
              )}
            </div>
          </CardPreview>
        </Card>
        
        <Card style={{ flexShrink: 0 }}>
          <CardHeader
            header={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail24Regular />
                <Text weight="semibold">Compose Assistance</Text>
              </div>
            }
          />
          <CardPreview>
            <div style={{ padding: '16px' }}>
              <Text size={300} style={{ marginBottom: '12px', display: 'block' }}>
                Get AI assistance for composing or responding to emails with personalized suggestions.
              </Text>
              
              {/* Context and Style Toggles */}
              <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Switch 
                    checked={isProfessional} 
                    onChange={(e, data) => setIsProfessional(data.checked)}
                    id="professional-toggle"
                    aria-describedby="professional-help"
                  />
                  <Label htmlFor="professional-toggle" size="small">
                    {isProfessional ? '💼 Professional' : '👤 Personal/Private'}
                  </Label>
                </div>
                <Text 
                  id="professional-help"
                  size={100} 
                  style={{ color: '#666', marginLeft: '32px', display: 'block' }}
                >
                  Choose between formal business tone or casual personal tone
                </Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Switch 
                    checked={isDetailed} 
                    onChange={(e, data) => setIsDetailed(data.checked)}
                    id="detailed-toggle"
                    aria-describedby="detailed-help"
                  />
                  <Label htmlFor="detailed-toggle" size="small">
                    {isDetailed ? '📄 Detailed Response' : '📝 Brief Response'}
                  </Label>
                </div>
                <Text 
                  id="detailed-help"
                  size={100} 
                  style={{ color: '#666', marginLeft: '32px', display: 'block' }}
                >
                  Select response length: detailed explanation or concise summary
                </Text>
              </div>
              
              {/* Custom Instructions Input */}
              <div style={{ marginBottom: '12px' }}>
                <Text size={200} weight="semibold" style={{ marginBottom: '4px', display: 'block' }}>
                  Custom Instructions (optional):
                </Text>
                <textarea
                  value={refinementInput}
                  onChange={(e) => setRefinementInput(e.target.value)}
                  placeholder="e.g., Add urgency, include specific details, mention deadline..."
                  aria-label="Custom instructions for AI response generation"
                  aria-describedby="custom-instructions-help"
                  style={{
                    width: '100%',
                    minHeight: '60px',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #d1d1d1',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
                <Text 
                  id="custom-instructions-help"
                  size={100} 
                  style={{ color: '#666', marginTop: '4px', display: 'block' }}
                >
                  Provide specific guidance for the AI response tone, content, or structure
                </Text>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Button
                  appearance="primary"
                  onClick={handleComposeAssist}
                  disabled={isProcessing || !emailContent || emailContent.isClassified}
                  style={{ width: '100%' }}
                  aria-label={isProcessing ? 'Generating AI response' : 'Generate AI-powered email response'}
                >
                  {isProcessing ? 'Generating...' : 'Generate Response'}
                </Button>
                
                {/* Reply Button */}
                {generatedDraft && (
                  <Button
                    appearance="outline"
                    onClick={handleCreateReply}
                    disabled={isProcessing}
                    style={{ width: '100%' }}
                  >
                    📧 Create Reply in Outlook
                  </Button>
                )}
              </div>
              
              {emailContent?.isClassified && (
                <Text 
                  size={200} 
                  style={{ color: '#d13438', marginTop: '8px', display: 'block' }}
                  aria-live="assertive"
                  role="alert"
                >
                  ⚠️ Compose assistance disabled for classified content
                </Text>
              )}
            </div>
          </CardPreview>
        </Card>
        
        <Card style={{ flexShrink: 0 }}>
          <CardHeader
            header={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings24Regular />
                <Text weight="semibold">Configuration</Text>
              </div>
            }
          />
          <CardPreview>
            <div style={{ padding: '16px' }}>
              <Text size={300} style={{ marginBottom: '12px', display: 'block' }}>
                Configure AI providers, preferences, and settings.
              </Text>
              <Button
                appearance="outline"
                style={{ width: '100%' }}
                onClick={handleOpenSettings}
                aria-label="Open AI provider and user preferences settings"
              >
                Open Settings
              </Button>
            </div>
          </CardPreview>
        </Card>
      </div>
      
      {/* Footer */}
      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #e5e5e5' }}>
        <Text size={200} style={{ color: '#666', textAlign: 'center', display: 'block' }}>
          PromptReply v1.0.0
        </Text>
      </div>
      </div>
    </div>
      )}
    </>
  );
};

export default TaskPaneContainer;
