import { BaseAIProvider } from './BaseAIProvider';
import { ModelInfo, EmailSelectionContext, UserPreferences, EmailAnalysis, ModifierSettings } from '@/types';

export class OllamaProvider extends BaseAIProvider {
  public type: 'ollama' = 'ollama';
  public name = 'Ollama';

  constructor(config: { baseUrl?: string; defaultModel: string }) {
    super({
      baseUrl: config.baseUrl || 'http://localhost:11434',
      defaultModel: config.defaultModel
    });
  }

  protected getAuthHeaders(): Record<string, string> {
    // Ollama doesn't require authentication headers
    return {};
  }

  public async isHealthy(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/api/tags');
      return response.ok;
    } catch (error) {
      console.error('Ollama health check failed:', error);
      return false;
    }
  }

  public async discoverModels(): Promise<ModelInfo[]> {
    try {
      const response = await this.makeRequest('/api/tags');
      const data = await response.json();
      
      return data.models.map((model: any) => ({
        id: model.name,
        name: model.name,
        description: this.getModelDescription(model.name),
        contextLength: this.getContextLength(model.name),
        capabilities: ['text-generation', 'conversation'],
        performance: {
          averageResponseTime: 3000,
          tokensPerSecond: 30,
          qualityScore: 0.8,
          reliability: 0.9
        },
        pricing: {
          inputTokens: 0,
          outputTokens: 0,
          currency: 'USD'
        },
        isDefault: model.name === this.defaultModel,
        isAvailable: true
      }));
    } catch (error) {
      console.error('Failed to discover Ollama models:', error);
      return [];
    }
  }

  public async generateResponse(prompt: string, context: EmailSelectionContext, userPrefs: UserPreferences): Promise<string> {
    const fullPrompt = this.buildPrompt(prompt, context, userPrefs);
    
    try {
      const response = await this.makeRequest('/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          model: this.defaultModel,
          prompt: fullPrompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 1000
          }
        })
      });

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Ollama generate response failed:', error);
      throw new Error('Failed to generate response from Ollama');
    }
  }

  public async analyzeEmail(email: EmailSelectionContext, userPrefs: UserPreferences): Promise<EmailAnalysis> {
    const analysisPrompt = `You are an expert email analyst. Analyze this email thoroughly and provide specific, actionable insights.

Email Subject: ${email.subject}
FROM: ${email.sender.name} <${email.sender.email}>
TO: ${email.recipients.to.map(r => `${r.name} <${r.email}>`).join(', ')}
${email.recipients.cc.length > 0 ? `CC: ${email.recipients.cc.map(r => `${r.name} <${r.email}>`).join(', ')}` : ''}

Email Body:
${email.body}

${email.attachments && email.attachments.length > 0 ? `
Attachments:
${email.attachments.map(att => `- ${att.name} (${att.contentType}, ${this.formatFileSize(att.size)})`).join('\n')}
` : ''}

Please analyze this email and provide specific, detailed insights about its content. Focus on what actually matters in this email - don't give generic responses.

Respond EXACTLY in this format:

KEY POINTS:
- [Specific point 1 based on email content]
- [Specific point 2 based on email content]  
- [Specific point 3 based on email content]

ACTION ITEMS:
- [Specific action 1 with priority]
- [Specific action 2 with priority]

PRIORITY: [1-10 score] - [Specific reasoning based on email content]

SENTIMENT: [positive/negative/neutral]

TOPICS: [comma-separated list of specific topics mentioned]

URGENCY INDICATORS: [any urgent language found, or "none"]

Be specific and base your analysis on the actual email content, not generic templates.`;

    try {
      const response = await this.generateResponse(analysisPrompt, email, userPrefs);
      console.log('Raw LLM Response:', response); // Debug logging
      
      // Parse the response more robustly
      const keyPoints = this.parseSection(response, 'KEY POINTS') || ['No key points identified in email content'];
      const actionItems = this.parseActionItems(response);
      const priority = this.parsePriority(response);
      const sentiment = this.parseSentiment(response);
      const topics = this.parseTopics(response);
      const urgencyIndicators = this.parseUrgencyIndicators(response);

      return {
        id: `analysis-${Date.now()}`,
        emailId: email.id,
        summary: {
          keyPoints,
          sentiment,
          context: keyPoints.length > 0 ? keyPoints[0] : 'Email analysis completed',
          relationshipInfo: {
            recipientType: this.determineRecipientType(email.sender.email, userPrefs),
            relationshipLevel: this.determineRelationshipLevel(email.sender.email, userPrefs),
            previousInteractions: 0
          },
          urgencyIndicators,
          topics
        },
        actions: actionItems,
        priority: priority,
        draft: {
          content: `Thank you for your email regarding ${email.subject}. I will review the information and respond accordingly.`,
          tone: 'professional',
          confidence: 0.7,
          alternatives: [],
          reasoning: 'Generated basic acknowledgment response',
          personalizationApplied: {
            userContext: false,
            stakeholderContext: false,
            toneAdjustment: false
          }
        },
        generatedAt: new Date(),
        confidence: 0.8
      };
    } catch (error) {
      console.error('Ollama analyze email failed:', error);
      throw new Error('Failed to analyze email with Ollama');
    }
  }

  public async refineResponse(originalResponse: string, modifiers: ModifierSettings): Promise<string> {
    const refinementPrompt = `
      Please refine this email response according to these specifications:
      
      Verbosity level: ${modifiers.verbosity}/5 (1=very brief, 5=very detailed)
      Tone: ${modifiers.tone}
      Formality: ${modifiers.formality}
      Length: ${modifiers.length}
      Urgency level: ${modifiers.urgency}
      Personal touch: ${modifiers.personalTouch ? 'Include personal elements' : 'Keep it professional only'}
      
      Original response:
      ${originalResponse}
      
      Please provide the refined version that matches these requirements:
    `;

    try {
      const response = await this.makeRequest('/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          model: this.defaultModel,
          prompt: refinementPrompt,
          stream: false,
          options: {
            temperature: 0.5,
            top_p: 0.8,
            max_tokens: 1000
          }
        })
      });

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Ollama refine response failed:', error);
      throw new Error('Failed to refine response with Ollama');
    }
  }

  public async testConnectivity(): Promise<{ success: boolean; error?: string; responseTime: number }> {
    const startTime = Date.now();
    
    try {
      const response = await this.makeRequest('/api/tags');
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

  // Helper methods for parsing responses (similar to OpenAI but adapted for Ollama responses)
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
      (line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().startsWith('*')) && line.trim().length > 5
    );
    
    if (lines.length > 0) {
      return lines.map(line => line.trim().replace(/^[-•*]\s*/, ''));
    }
    
    // Final fallback - no structured points found
    return ['Email analysis completed'];
  }

  private detectSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['thank', 'great', 'excellent', 'good', 'pleased', 'happy', 'wonderful', 'appreciate'];
    const negativeWords = ['problem', 'issue', 'concern', 'urgent', 'error', 'failed', 'disappointed', 'trouble'];
    
    const lowercaseText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowercaseText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowercaseText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private extractContext(response: string): string {
    const sentences = response.split('.').filter(s => s.trim().length > 10);
    return sentences[0]?.trim() + '.' || 'No context available';
  }

  private determineRecipientType(email: string, userPrefs: UserPreferences): 'internal' | 'external' | 'stakeholder' {
    if (userPrefs.stakeholderRegistry[email]) {
      return 'stakeholder';
    }
    
    // Simple heuristic - check if same domain as known stakeholders
    const knownDomains = Object.keys(userPrefs.stakeholderRegistry)
      .map(e => e.split('@')[1])
      .filter(domain => domain);
    
    const senderDomain = email.split('@')[1];
    return knownDomains.indexOf(senderDomain) !== -1 ? 'internal' : 'external';
  }

  private determineRelationshipLevel(email: string, userPrefs: UserPreferences): 'formal' | 'professional' | 'casual' | 'friendly' {
    const stakeholder = userPrefs.stakeholderRegistry[email];
    return stakeholder?.communicationPreferences.preferredTone || 'professional';
  }

  private extractUrgencyIndicators(text: string): string[] {
    const urgentWords = ['urgent', 'asap', 'immediate', 'priority', 'deadline', 'critical', 'emergency', 'rush'];
    const lowercaseText = text.toLowerCase();
    return urgentWords.filter(word => lowercaseText.includes(word));
  }

  private extractTopics(text: string): string[] {
    const commonTopics = ['meeting', 'project', 'deadline', 'budget', 'report', 'presentation', 'review', 'contract', 'proposal'];
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
          category: this.determineCategory(item),
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

  private determinePriority(text: string): 'low' | 'medium' | 'high' | 'urgent' {
    const lowercaseText = text.toLowerCase();
    if (lowercaseText.includes('urgent') || lowercaseText.includes('asap')) return 'urgent';
    if (lowercaseText.includes('important') || lowercaseText.includes('priority')) return 'high';
    if (lowercaseText.includes('when possible') || lowercaseText.includes('eventually')) return 'low';
    return 'medium';
  }

  private determineCategory(text: string): 'task' | 'meeting' | 'decision' | 'information' | 'follow-up' {
    const lowercaseText = text.toLowerCase();
    if (lowercaseText.includes('meeting') || lowercaseText.includes('schedule')) return 'meeting';
    if (lowercaseText.includes('decide') || lowercaseText.includes('decision')) return 'decision';
    if (lowercaseText.includes('inform') || lowercaseText.includes('update')) return 'information';
    if (lowercaseText.includes('follow') || lowercaseText.includes('check')) return 'follow-up';
    return 'task';
  }

  private assessPriority(email: EmailSelectionContext, response: string): any {
    const urgencyScore = this.extractUrgencyIndicators(email.body).length;
    const importanceScore = email.metadata.importance === 'high' ? 3 : email.metadata.importance === 'low' ? 1 : 2;
    const responseUrgency = response.toLowerCase().includes('urgent') ? 2 : 0;
    
    const score = Math.min(10, (urgencyScore * 2) + (importanceScore * 2) + responseUrgency + 1);
    
    return {
      score,
      reasoning: `Priority assessed based on urgency indicators (${urgencyScore}), email importance (${email.metadata.importance}), and analysis context`,
      factors: {
        urgency: urgencyScore,
        importance: importanceScore,
        businessImpact: 2,
        stakeholderLevel: 2,
        timeConstraints: responseUrgency
      },
      recommendedResponseTime: score > 7 ? 'Within 2 hours' : score > 5 ? 'Within 6 hours' : 'Within 24 hours',
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
      reasoning: 'Generated based on Ollama email analysis',
      personalizationApplied: {
        userContext: true,
        stakeholderContext: false,
        toneAdjustment: true
      }
    };
  }

  private getModelDescription(modelName: string): string {
    const descriptions: Record<string, string> = {
      'llama3.2': 'Latest Llama 3.2 model with improved reasoning',
      'llama3.1': 'Llama 3.1 with enhanced capabilities',
      'llama3': 'Meta\'s Llama 3 language model',
      'mistral': 'Mistral AI\'s efficient language model',
      'mixtral': 'Mistral\'s mixture of experts model',
      'codellama': 'Code-specialized version of Llama',
      'phi3': 'Microsoft\'s Phi-3 small language model'
    };
    
    return descriptions[modelName] || 'Local language model via Ollama';
  }

  private getContextLength(modelName: string): number {
    const contextLengths: Record<string, number> = {
      'llama3.2': 128000,
      'llama3.1': 128000,
      'llama3': 8192,
      'mistral': 8192,
      'mixtral': 32768,
      'codellama': 16384,
      'phi3': 4096
    };
    
    return contextLengths[modelName] || 4096;
  }

  // New robust parsing methods
  private parseSection(response: string, sectionName: string): string[] | null {
    const pattern = new RegExp(`${sectionName}:\\s*([\\s\\S]*?)(?=\\n\\n|\\n[A-Z][A-Z\\s]*:|$)`, 'i');
    const match = response.match(pattern);
    
    if (match) {
      const content = match[1].trim();
      const items = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('-') || line.startsWith('•') || line.startsWith('*'))
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(item => item.length > 0);
      
      return items.length > 0 ? items : null;
    }
    
    return null;
  }

  private parseActionItems(response: string): any[] {
    const items = this.parseSection(response, 'ACTION ITEMS');
    
    if (items && items.length > 0) {
      return items.map((item, index) => ({
        id: `action-${index}`,
        description: item,
        priority: this.determinePriority(item),
        category: this.determineCategory(item),
        status: 'pending'
      }));
    }
    
    return [{
      id: 'no-action',
      description: 'No specific actions required',
      priority: 'low',
      category: 'information',
      status: 'pending'
    }];
  }

  private parsePriority(response: string): any {
    const priorityMatch = response.match(/PRIORITY:\s*(\d+)\s*-\s*(.+?)(?=\n|$)/i);
    
    if (priorityMatch) {
      const score = Math.min(10, Math.max(1, parseInt(priorityMatch[1]) || 5));
      const reasoning = priorityMatch[2].trim();
      
      return {
        score,
        reasoning,
        factors: {
          urgency: score > 7 ? 3 : score > 5 ? 2 : 1,
          importance: score > 6 ? 3 : 2,
          businessImpact: 2,
          stakeholderLevel: 2,
          timeConstraints: score > 8 ? 3 : 1
        },
        recommendedResponseTime: score > 7 ? 'Within 2 hours' : score > 5 ? 'Within 6 hours' : 'Within 24 hours',
        escalationRequired: score > 8
      };
    }
    
    // Fallback
    return {
      score: 5,
      reasoning: 'Priority assessed based on email content analysis',
      factors: {
        urgency: 1,
        importance: 2,
        businessImpact: 2,
        stakeholderLevel: 2,
        timeConstraints: 1
      },
      recommendedResponseTime: 'Within 24 hours',
      escalationRequired: false
    };
  }

  private parseSentiment(response: string): 'positive' | 'negative' | 'neutral' {
    const sentimentMatch = response.match(/SENTIMENT:\s*(\w+)/i);
    
    if (sentimentMatch) {
      const sentiment = sentimentMatch[1].toLowerCase();
      if (sentiment.includes('pos')) return 'positive';
      if (sentiment.includes('neg')) return 'negative';
      return 'neutral';
    }
    
    // Fallback to original detection
    return this.detectSentiment(response);
  }

  private parseTopics(response: string): string[] {
    const topicsMatch = response.match(/TOPICS:\s*(.+?)(?=\n|$)/i);
    
    if (topicsMatch) {
      return topicsMatch[1].split(',').map(topic => topic.trim()).filter(topic => topic.length > 0);
    }
    
    // Fallback to original detection
    return this.extractTopics(response);
  }

  private parseUrgencyIndicators(response: string): string[] {
    const urgencyMatch = response.match(/URGENCY INDICATORS:\s*(.+?)(?=\n|$)/i);
    
    if (urgencyMatch) {
      const indicators = urgencyMatch[1].trim();
      if (indicators.toLowerCase() === 'none') {
        return [];
      }
      return indicators.split(',').map(indicator => indicator.trim()).filter(indicator => indicator.length > 0);
    }
    
    // Fallback to original detection
    return this.extractUrgencyIndicators(response);
  }
}
