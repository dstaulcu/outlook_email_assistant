import { BaseAIProvider } from './BaseAIProvider';
import { ModelInfo, EmailSelectionContext, UserPreferences, EmailAnalysis, ModifierSettings } from '@/types';

export class OpenAIProvider extends BaseAIProvider {
  public type: 'openai' = 'openai';
  public name = 'OpenAI';

  constructor(config: { baseUrl?: string; apiKey: string; defaultModel: string }) {
    super({
      baseUrl: config.baseUrl || 'https://api.openai.com/v1',
      apiKey: config.apiKey,
      defaultModel: config.defaultModel
    });
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`
    };
  }

  public async isHealthy(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/models');
      return response.ok;
    } catch (error) {
      console.error('OpenAI health check failed:', error);
      return false;
    }
  }

  public async discoverModels(): Promise<ModelInfo[]> {
    try {
      const response = await this.makeRequest('/models');
      const data = await response.json();
      
      return data.data
        .filter((model: any) => model.id.startsWith('gpt'))
        .map((model: any) => ({
          id: model.id,
          name: model.id,
          description: this.getModelDescription(model.id),
          contextLength: this.getContextLength(model.id),
          capabilities: ['text-generation', 'conversation'],
          performance: {
            averageResponseTime: 2000,
            tokensPerSecond: 50,
            qualityScore: 0.9,
            reliability: 0.95
          },
          pricing: {
            inputTokens: this.getInputTokenPrice(model.id),
            outputTokens: this.getOutputTokenPrice(model.id),
            currency: 'USD'
          },
          isDefault: model.id === this.defaultModel,
          isAvailable: true
        }));
    } catch (error) {
      console.error('Failed to discover OpenAI models:', error);
      return [];
    }
  }

  public async generateResponse(prompt: string, context: EmailSelectionContext, userPrefs: UserPreferences): Promise<string> {
    const fullPrompt = this.buildPrompt(prompt, context, userPrefs);
    
    try {
      const response = await this.makeRequest('/chat/completions', {
        method: 'POST',
        body: JSON.stringify({
          model: this.defaultModel,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful email assistant. Provide professional, contextually appropriate responses.'
            },
            {
              role: 'user',
              content: fullPrompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI generate response failed:', error);
      throw new Error('Failed to generate response from OpenAI');
    }
  }

  public async analyzeEmail(email: EmailSelectionContext, userPrefs: UserPreferences): Promise<EmailAnalysis> {
    const analysisPrompt = `
      You are helping a professional user analyze and respond to an email. The user will be replying to this email FROM their own email account.
      
      Email Subject: ${email.subject}
      FROM (original sender): ${email.sender.name} <${email.sender.email}>
      TO (who received the email - this is the USER you are helping): ${email.recipients.to.map(r => `${r.name} <${r.email}>`).join(', ')}
      ${email.recipients.cc.length > 0 ? `CC: ${email.recipients.cc.map(r => `${r.name} <${r.email}>`).join(', ')}` : ''}
      Email Body: ${email.body}
      
      IMPORTANT: You are helping the user (who received this email) craft a REPLY back to ${email.sender.name}. The user should sign the response with their own name, not the original sender's name.
      
      Please provide your analysis in the following format:
      
      KEY POINTS:
      - [List 2-4 most important points from the email]
      
      ACTION ITEMS:
      - [List specific actions that need to be taken, if any]
      
      PRIORITY ASSESSMENT:
      - [Rate priority 1-10 and explain reasoning]
      
      DRAFT RESPONSE:
      [Provide a professional draft response that the user can send back to ${email.sender.name}. Do not sign with ${email.sender.name} - let the user add their own signature.]
    `;

    try {
      const response = await this.generateResponse(analysisPrompt, email, userPrefs);
      
      // Parse the response and structure it
      // This is a simplified implementation - in practice, you'd use structured outputs
      return {
        id: `analysis-${Date.now()}`,
        emailId: email.id,
        summary: {
          keyPoints: this.extractKeyPoints(response),
          sentiment: this.detectSentiment(email.body),
          context: this.extractContext(response),
          relationshipInfo: {
            recipientType: this.determineRecipientType(email.sender.email, userPrefs),
            relationshipLevel: this.determineRelationshipLevel(email.sender.email, userPrefs),
            previousInteractions: 0
          },
          urgencyIndicators: this.extractUrgencyIndicators(email.body),
          topics: this.extractTopics(email.body)
        },
        actions: this.extractActionItems(response),
        priority: this.assessPriority(email, response),
        draft: this.extractDraftResponse(response),
        generatedAt: new Date(),
        confidence: 0.8
      };
    } catch (error) {
      console.error('OpenAI analyze email failed:', error);
      throw new Error('Failed to analyze email with OpenAI');
    }
  }

  public async refineResponse(originalResponse: string, modifiers: ModifierSettings): Promise<string> {
    const refinementPrompt = `
      Please refine this response according to these specifications:
      - Verbosity level: ${modifiers.verbosity}/5
      - Tone: ${modifiers.tone}
      - Formality: ${modifiers.formality}
      - Length: ${modifiers.length}
      - Urgency: ${modifiers.urgency}
      - Personal touch: ${modifiers.personalTouch ? 'Include' : 'Exclude'}
      
      Original response: ${originalResponse}
      
      Please provide the refined version:
    `;

    try {
      const response = await this.makeRequest('/chat/completions', {
        method: 'POST',
        body: JSON.stringify({
          model: this.defaultModel,
          messages: [
            {
              role: 'system',
              content: 'You are an expert at refining email responses according to specific style requirements.'
            },
            {
              role: 'user',
              content: refinementPrompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.5
        })
      });

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI refine response failed:', error);
      throw new Error('Failed to refine response with OpenAI');
    }
  }

  public async testConnectivity(): Promise<{ success: boolean; error?: string; responseTime: number }> {
    const startTime = Date.now();
    
    try {
      const response = await this.makeRequest('/models');
      const responseTime = Date.now() - startTime;
      
      return {
        success: response.ok,
        responseTime,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        responseTime: Date.now() - startTime
      };
    }
  }

  // Helper methods for parsing responses
  private extractKeyPoints(response: string): string[] {
    // Look for the KEY POINTS section
    const keyPointsMatch = response.match(/KEY POINTS:\s*((?:.*\n)*?)(?=\n[A-Z]|\n\n|$)/i);
    if (keyPointsMatch) {
      const keyPointsText = keyPointsMatch[1];
      const points = keyPointsText.split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
        .map(line => line.trim().replace(/^[-•]\s*/, ''))
        .filter(point => point.length > 0);
      
      if (points.length > 0) {
        return points;
      }
    }
    
    // Fallback to any bullet points in the response
    const lines = response.split('\n').filter(line => 
      (line.trim().startsWith('-') || line.trim().startsWith('•')) && line.trim().length > 5
    );
    
    if (lines.length > 0) {
      return lines.map(line => line.trim().replace(/^[-•]\s*/, ''));
    }
    
    // Final fallback - no structured points found
    return ['Email analysis completed'];
  }

  private detectSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    // Simplified sentiment detection
    const positiveWords = ['thank', 'great', 'excellent', 'good', 'pleased', 'happy'];
    const negativeWords = ['problem', 'issue', 'concern', 'urgent', 'error', 'failed'];
    
    const lowercaseText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowercaseText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowercaseText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private extractContext(response: string): string {
    // Extract first meaningful sentence as context
    const sentences = response.split('.').filter(s => s.trim().length > 10);
    return sentences[0]?.trim() + '.' || 'No context available';
  }

  private determineRecipientType(email: string, userPrefs: UserPreferences): 'internal' | 'external' | 'stakeholder' {
    if (userPrefs.stakeholderRegistry[email]) {
      return 'stakeholder';
    }
    // Simple heuristic - check if same domain
    const userDomain = Object.keys(userPrefs.stakeholderRegistry)[0]?.split('@')[1];
    const senderDomain = email.split('@')[1];
    return userDomain === senderDomain ? 'internal' : 'external';
  }

  private determineRelationshipLevel(email: string, userPrefs: UserPreferences): 'formal' | 'professional' | 'casual' | 'friendly' {
    const stakeholder = userPrefs.stakeholderRegistry[email];
    return stakeholder?.communicationPreferences.preferredTone || 'professional';
  }

  private extractUrgencyIndicators(text: string): string[] {
    const urgentWords = ['urgent', 'asap', 'immediate', 'priority', 'deadline', 'critical'];
    const lowercaseText = text.toLowerCase();
    return urgentWords.filter(word => lowercaseText.includes(word));
  }

  private extractTopics(text: string): string[] {
    // Simplified topic extraction
    const commonTopics = ['meeting', 'project', 'deadline', 'budget', 'report', 'presentation', 'review'];
    const lowercaseText = text.toLowerCase();
    return commonTopics.filter(topic => lowercaseText.includes(topic));
  }

  private extractActionItems(response: string): any[] {
    // Look for the ACTION ITEMS section
    const actionItemsMatch = response.match(/ACTION ITEMS:\s*((?:.*\n)*?)(?=\n[A-Z]|\n\n|$)/i);
    if (actionItemsMatch) {
      const actionItemsText = actionItemsMatch[1];
      const items = actionItemsText.split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
        .map(line => line.trim().replace(/^[-•]\s*/, ''))
        .filter(item => item.length > 0);
      
      if (items.length > 0) {
        return items.map((item, index) => ({
          id: `action-${index}`,
          description: item,
          priority: this.determinePriority(item),
          category: 'task',
          status: 'pending'
        }));
      }
    }
    
    // Fallback - no action items found
    return [{
      id: 'no-action',
      description: 'No specific actions required',
      priority: 'low',
      category: 'information',
      status: 'pending'
    }];
  }

  private determinePriority(item: string): string {
    const urgentKeywords = ['urgent', 'asap', 'immediate', 'critical', 'deadline'];
    const lowercaseItem = item.toLowerCase();
    
    if (urgentKeywords.some(keyword => lowercaseItem.includes(keyword))) {
      return 'high';
    }
    
    if (lowercaseItem.includes('respond') || lowercaseItem.includes('reply') || lowercaseItem.includes('follow')) {
      return 'medium';
    }
    
    return 'low';
  }

  private assessPriority(email: EmailSelectionContext, response: string): any {
    // Simplified priority assessment
    const urgencyScore = this.extractUrgencyIndicators(email.body).length;
    const importanceScore = email.metadata.importance === 'high' ? 3 : email.metadata.importance === 'low' ? 1 : 2;
    
    const score = Math.min(10, (urgencyScore * 2) + (importanceScore * 2) + 2);
    
    return {
      score,
      reasoning: `Priority based on urgency indicators (${urgencyScore}) and email importance (${email.metadata.importance})`,
      factors: {
        urgency: urgencyScore,
        importance: importanceScore,
        businessImpact: 2,
        stakeholderLevel: 2,
        timeConstraints: 2
      },
      recommendedResponseTime: score > 7 ? 'Within 1 hour' : score > 5 ? 'Within 4 hours' : 'Within 24 hours',
      escalationRequired: score > 8
    };
  }

  private extractDraftResponse(response: string): any {
    // Look for the DRAFT RESPONSE section
    const draftMatch = response.match(/DRAFT RESPONSE:\s*((?:.*\n)*?)(?=\n[A-Z]|\n\n$|$)/i);
    let draftContent = '';
    
    if (draftMatch) {
      draftContent = draftMatch[1].trim();
    } else {
      // Fallback - look for any line mentioning draft or response
      const lines = response.split('\n');
      let inDraftSection = false;
      
      for (const line of lines) {
        if (line.toLowerCase().includes('draft') && line.toLowerCase().includes('response')) {
          inDraftSection = true;
          continue;
        }
        if (inDraftSection && line.trim().length > 0) {
          draftContent += line + '\n';
        }
      }
    }
    
    if (!draftContent.trim()) {
      draftContent = 'Thank you for your email. I will review this and provide a response shortly.';
    }
    
    return {
      content: draftContent.trim(),
      tone: 'professional',
      confidence: 0.7,
      alternatives: [],
      reasoning: 'Generated based on email analysis',
      personalizationApplied: {
        userContext: true,
        stakeholderContext: false,
        toneAdjustment: true
      }
    };
  }

  private getModelDescription(modelId: string): string {
    const descriptions: Record<string, string> = {
      'gpt-4': 'Most capable GPT-4 model, great for complex tasks',
      'gpt-4-turbo': 'Faster GPT-4 with updated knowledge',
      'gpt-3.5-turbo': 'Fast and cost-effective for most tasks',
      'gpt-3.5-turbo-16k': 'Extended context version of GPT-3.5 Turbo'
    };
    
    return descriptions[modelId] || 'OpenAI language model';
  }

  private getContextLength(modelId: string): number {
    const contextLengths: Record<string, number> = {
      'gpt-4': 8192,
      'gpt-4-turbo': 128000,
      'gpt-3.5-turbo': 4096,
      'gpt-3.5-turbo-16k': 16384
    };
    
    return contextLengths[modelId] || 4096;
  }

  private getInputTokenPrice(modelId: string): number {
    const prices: Record<string, number> = {
      'gpt-4': 0.03,
      'gpt-4-turbo': 0.01,
      'gpt-3.5-turbo': 0.0015,
      'gpt-3.5-turbo-16k': 0.003
    };
    
    return prices[modelId] || 0.001;
  }

  private getOutputTokenPrice(modelId: string): number {
    const prices: Record<string, number> = {
      'gpt-4': 0.06,
      'gpt-4-turbo': 0.03,
      'gpt-3.5-turbo': 0.002,
      'gpt-3.5-turbo-16k': 0.004
    };
    
    return prices[modelId] || 0.002;
  }
}
