import { AIProvider, ModelInfo, EmailSelectionContext, UserPreferences, EmailAnalysis, ModifierSettings } from '@/types';

export abstract class BaseAIProvider implements AIProvider {
  public abstract type: 'openai' | 'ollama';
  public abstract name: string;
  protected baseUrl: string;
  protected apiKey?: string;
  protected defaultModel: string;
  protected timeout: number = 30000;
  protected maxRetries: number = 3;

  constructor(config: { baseUrl: string; apiKey?: string; defaultModel: string }) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.defaultModel = config.defaultModel;
  }

  public abstract isHealthy(): Promise<boolean>;
  public abstract discoverModels(): Promise<ModelInfo[]>;
  public abstract generateResponse(prompt: string, context: EmailSelectionContext, userPrefs: UserPreferences): Promise<string>;
  
  public async generateResponseWithPreferences(
    prompt: string, 
    context: EmailSelectionContext, 
    userPrefs: UserPreferences,
    isProfessional: boolean,
    isDetailed: boolean,
    customInstructions?: string
  ): Promise<string> {
    const enhancedPrompt = this.buildPromptWithUserPreferences(
      prompt, 
      context, 
      userPrefs, 
      isProfessional, 
      isDetailed, 
      customInstructions
    );
    return this.generateResponse(enhancedPrompt, context, userPrefs);
  }
  public abstract analyzeEmail(email: EmailSelectionContext, userPrefs: UserPreferences): Promise<EmailAnalysis>;
  public abstract refineResponse(originalResponse: string, modifiers: ModifierSettings): Promise<string>;
  public abstract testConnectivity(): Promise<{ success: boolean; error?: string; responseTime: number }>;

  protected async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          signal: AbortSignal.timeout(this.timeout),
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders(),
            ...options.headers
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.maxRetries - 1) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  protected abstract getAuthHeaders(): Record<string, string>;

  /**
   * Format file size in bytes to human-readable format
   */
  protected formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  protected buildPrompt(basePrompt: string, context: EmailSelectionContext, userPrefs: UserPreferences): string {
    const stakeholder = userPrefs.stakeholderRegistry[context.sender.email];
    
    let prompt = basePrompt;
    
    // Add stakeholder context if available
    if (stakeholder) {
      prompt += `\n\nStakeholder Context:`;
      prompt += `\n- Relationship: ${stakeholder.relationship}`;
      prompt += `\n- Preferred tone: ${stakeholder.communicationPreferences.preferredTone}`;
      if (stakeholder.notes) {
        prompt += `\n- Notes: ${stakeholder.notes}`;
      }
    }
    
    // Add email context
    prompt += `\n\nEmail Context:`;
    prompt += `\n- Subject: ${context.subject}`;
    prompt += `\n- FROM (original sender): ${context.sender.name} <${context.sender.email}>`;
    prompt += `\n- TO (primary recipients): ${context.recipients.to.map(r => `${r.name} <${r.email}>`).join(', ')}`;
    if (context.recipients.cc.length > 0) {
      prompt += `\n- CC (copied recipients): ${context.recipients.cc.map(r => `${r.name} <${r.email}>`).join(', ')}`;
    }
    if (context.recipients.bcc.length > 0) {
      prompt += `\n- BCC (blind copied recipients): ${context.recipients.bcc.map(r => `${r.name} <${r.email}>`).join(', ')}`;
    }
    prompt += `\n- Importance: ${context.metadata.importance}`;
    
    // Add attachment information if present
    if (context.attachments && context.attachments.length > 0) {
      prompt += `\n- Attachments:`;
      for (const attachment of context.attachments) {
        prompt += `\n  📎 ${attachment.name} (${attachment.contentType}, ${this.formatFileSize(attachment.size)})`;
      }
      prompt += `\n  NOTE: Consider these attachments when analyzing the email and crafting responses.`;
    }
    
    prompt += `\n- Body: ${context.body}`;
    
    prompt += `\n\nIMPORTANT: You are drafting a REPLY to the email FROM ${context.sender.name} <${context.sender.email}>. Your response should be addressed TO ${context.sender.name}, not to anyone who was CC'd or BCC'd on the original email.`;
    
    return prompt;
  }

  /**
   * Build prompt with user-specified context and style preferences
   */
  protected buildPromptWithUserPreferences(
    basePrompt: string, 
    context: EmailSelectionContext, 
    userPrefs: UserPreferences,
    isProfessional: boolean,
    isDetailed: boolean,
    customInstructions?: string
  ): string {
    const stakeholder = userPrefs.stakeholderRegistry[context.sender.email];
    
    let prompt = basePrompt;
    
    // Add context type specification
    if (isProfessional) {
      prompt += `\n\nContext: PROFESSIONAL email communication`;
      prompt += `\n- Use professional language and maintain appropriate business tone`;
    } else {
      prompt += `\n\nContext: PERSONAL/PRIVATE email communication`;
      prompt += `\n- Respond personally, not professionally`;
      prompt += `\n- Use casual, warm language appropriate for personal relationships`;
      prompt += `\n- Avoid job titles and formal business language`;
    }
    
    // Add response style specification
    if (isDetailed) {
      prompt += `\n\nResponse Style: DETAILED`;
      prompt += `\n- Provide comprehensive responses with full context`;
      prompt += `\n- Include relevant background information and explanations`;
      prompt += `\n- Address all points thoroughly`;
    } else {
      prompt += `\n\nResponse Style: BRIEF`;
      prompt += `\n- Keep responses concise and to the point`;
      prompt += `\n- Focus on essential information only`;
      prompt += `\n- Use clear, direct language`;
    }
    
    // Add stakeholder context if available
    if (stakeholder) {
      prompt += `\n\nStakeholder Context:`;
      prompt += `\n- Relationship: ${stakeholder.relationship}`;
      prompt += `\n- Preferred tone: ${stakeholder.communicationPreferences.preferredTone}`;
      if (stakeholder.notes) {
        prompt += `\n- Notes: ${stakeholder.notes}`;
      }
    }
    
    // Add custom instructions if provided
    if (customInstructions && customInstructions.trim()) {
      prompt += `\n\nCustom Instructions: ${customInstructions.trim()}`;
    }
    
    // Add email context
    prompt += `\n\nEmail Context:`;
    prompt += `\n- Subject: ${context.subject}`;
    prompt += `\n- FROM (original sender): ${context.sender.name} <${context.sender.email}>`;
    prompt += `\n- TO (primary recipients): ${context.recipients.to.map(r => `${r.name} <${r.email}>`).join(', ')}`;
    if (context.recipients.cc.length > 0) {
      prompt += `\n- CC (copied recipients): ${context.recipients.cc.map(r => `${r.name} <${r.email}>`).join(', ')}`;
    }
    if (context.recipients.bcc.length > 0) {
      prompt += `\n- BCC (blind copied recipients): ${context.recipients.bcc.map(r => `${r.name} <${r.email}>`).join(', ')}`;
    }
    prompt += `\n- Importance: ${context.metadata.importance}`;
    
    // Add attachment information if present
    if (context.attachments && context.attachments.length > 0) {
      prompt += `\n- Attachments:`;
      for (const attachment of context.attachments) {
        prompt += `\n  📎 ${attachment.name} (${attachment.contentType}, ${this.formatFileSize(attachment.size)})`;
      }
      prompt += `\n  NOTE: Consider these attachments when analyzing the email and crafting responses.`;
    }
    
    prompt += `\n- Body: ${context.body}`;
    
    prompt += `\n\nIMPORTANT: You are drafting a REPLY to the email FROM ${context.sender.name} <${context.sender.email}>. Your response should be addressed TO ${context.sender.name}, not to anyone who was CC'd or BCC'd on the original email.`;
    
    // Add user signoff information
    const userSignoff = this.getUserSignoff(userPrefs, isProfessional);
    if (userSignoff) {
      prompt += `\n\nUSER SIGNOFF: End your response with the following signoff:\n${userSignoff}`;
    }
    
    return prompt;
  }

  protected applyModifiers(content: string, modifiers: ModifierSettings): string {
    // This is a simplified implementation - in practice, you'd use AI to apply modifiers
    let modifiedContent = content;
    
    // Apply length modifications
    if (modifiers.length === 'brief') {
      modifiedContent = this.shortenContent(modifiedContent);
    } else if (modifiers.length === 'comprehensive') {
      modifiedContent = this.expandContent(modifiedContent);
    }
    
    // Apply tone modifications
    if (modifiers.tone === 'professional') {
      modifiedContent = this.makeProfessional(modifiedContent);
    } else if (modifiers.tone === 'casual') {
      modifiedContent = this.makeCasual(modifiedContent);
    }
    
    return modifiedContent;
  }

  private shortenContent(content: string): string {
    // Simple implementation - in practice, use AI
    const sentences = content.split('.').filter(s => s.trim().length > 0);
    return sentences.slice(0, Math.max(1, Math.floor(sentences.length / 2))).join('.') + '.';
  }

  private expandContent(content: string): string {
    // Simple implementation - in practice, use AI
    return content + ' I would be happy to discuss this further if you have any questions.';
  }

  private makeProfessional(content: string): string {
    // Simple implementation - in practice, use AI
    return content
      .replace(/\bhi\b/gi, 'Hello')
      .replace(/\bthanks\b/gi, 'Thank you')
      .replace(/\bbye\b/gi, 'Best regards');
  }

  private makeCasual(content: string): string {
    // Simple implementation - in practice, use AI
    return content
      .replace(/\bHello\b/gi, 'Hi')
      .replace(/\bThank you\b/gi, 'Thanks')
      .replace(/\bBest regards\b/gi, 'Cheers');
  }

  /**
   * Gets the user's preferred signoff based on tone and current preferences
   */
  protected getUserSignoff(userPrefs: UserPreferences, isProfessional: boolean): string {
    const profile = userPrefs.userProfile;
    
    // Safety check - if userProfile is not initialized, return empty string
    if (!profile || !profile.signaturePreferences) {
      console.log('User profile not initialized, skipping signoff');
      return '';
    }
    
    // If custom template is provided, use it
    if (profile.signaturePreferences.customSignoffTemplate) {
      return this.formatSignoffTemplate(profile.signaturePreferences.customSignoffTemplate, profile);
    }
    
    // Use tone-specific signoff
    const template = isProfessional 
      ? profile.signaturePreferences.professionalSignoff 
      : profile.signaturePreferences.personalSignoff;
    
    return this.formatSignoffTemplate(template, profile);
  }

  /**
   * Formats a signoff template with user information
   */
  private formatSignoffTemplate(template: string, profile: any): string {
    if (!template) {
      return '';
    }
    
    let signoff = template;
    
    // Replace placeholders
    signoff = signoff.replace('{name}', profile.displayName || 'User');
    signoff = signoff.replace('{firstName}', profile.displayName?.split(' ')[0] || 'User');
    signoff = signoff.replace('{jobTitle}', profile.jobTitle || '');
    signoff = signoff.replace('{department}', profile.department || '');
    signoff = signoff.replace('{email}', profile.email || '');
    
    // Clean up any empty lines or extra spaces
    signoff = signoff.replace(/\n\s*\n/g, '\n').trim();
    
    return signoff;
  }
}
