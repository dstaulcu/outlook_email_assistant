import { AIProvider, ProviderConfig, UserPreferences, ModelTestResult, ProviderTestResult } from '@/types';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { OllamaProvider } from './providers/OllamaProvider';

export class AIProviderFactory {
  /**
   * Creates an AI provider instance based on configuration
   */
  public static createProvider(config: ProviderConfig): AIProvider {
    switch (config.type) {
      case 'openai':
        if (!config.apiKey) {
          throw new Error('OpenAI API key is required');
        }
        return new OpenAIProvider({
          baseUrl: config.baseUrl,
          apiKey: config.apiKey,
          defaultModel: config.models.find(m => m.isDefault)?.id || 'gpt-3.5-turbo'
        });
      
      case 'ollama':
        return new OllamaProvider({
          baseUrl: config.baseUrl,
          defaultModel: config.models.find(m => m.isDefault)?.id || 'llama3.2'
        });
      
      default:
        throw new Error(`Unsupported provider type: ${(config as any).type}`);
    }
  }

  /**
   * Tests provider connectivity and configuration
   */
  public static async testProvider(config: ProviderConfig): Promise<ProviderTestResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    
    try {
      const provider = this.createProvider(config);
      const connectivityTest = await provider.testConnectivity();
      
      if (!connectivityTest.success) {
        errors.push(connectivityTest.error || 'Connectivity test failed');
      }
      
      const models = await provider.discoverModels();
      const averageResponseTime = connectivityTest.responseTime;
      
      return {
        provider: config.type,
        success: connectivityTest.success && models.length > 0,
        modelsFound: models.length,
        averageResponseTime,
        errors,
        recommendations: this.generateRecommendations(config, models, connectivityTest)
      };
    } catch (error) {
      errors.push((error as Error).message);
      
      return {
        provider: config.type,
        success: false,
        modelsFound: 0,
        averageResponseTime: Date.now() - startTime,
        errors,
        recommendations: ['Check provider configuration and network connectivity']
      };
    }
  }

  /**
   * Generates recommendations based on test results
   */
  private static generateRecommendations(
    config: ProviderConfig,
    models: any[],
    connectivityTest: any
  ): string[] {
    const recommendations: string[] = [];
    
    if (connectivityTest.responseTime > 5000) {
      recommendations.push('Consider using a closer server location for better performance');
    }
    
    if (models.length === 0) {
      if (config.type === 'ollama') {
        recommendations.push('No models found. Run "ollama pull llama3.2" to download a model');
      } else {
        recommendations.push('No models available. Check API key permissions');
      }
    }
    
    if (config.type === 'ollama' && config.baseUrl === 'http://localhost:11434') {
      recommendations.push('Ensure Ollama is started with CORS enabled: OLLAMA_ORIGINS="*" ollama serve');
    }
    
    if (config.type === 'openai' && !config.apiKey) {
      recommendations.push('OpenAI API key is required for this provider');
    }
    
    return recommendations;
  }
}

export class AIProviderManager {
  private providers: Map<string, AIProvider> = new Map();
  private healthStatus: Map<string, boolean> = new Map();
  private lastHealthCheck: Map<string, Date> = new Map();
  private healthCheckInterval = 5 * 60 * 1000; // 5 minutes

  /**
   * Initializes providers based on user preferences
   */
  public async initializeProviders(userPrefs: UserPreferences): Promise<void> {
    this.providers.clear();
    this.healthStatus.clear();
    this.lastHealthCheck.clear();

    // Initialize OpenAI provider if configured
    if (userPrefs.providerPreferences.openai.apiKey) {
      try {
        const openaiConfig: ProviderConfig = {
          type: 'openai',
          name: 'OpenAI',
          baseUrl: userPrefs.providerPreferences.openai.baseUrl || 'https://api.openai.com/v1',
          apiKey: userPrefs.providerPreferences.openai.apiKey,
          models: [],
          healthStatus: {
            isHealthy: false,
            lastCheck: new Date(),
            responseTime: 0,
            errorCount: 0
          },
          capabilities: {
            streaming: true,
            functionCalling: true,
            vision: false,
            embedding: true,
            maxContextLength: 128000
          },
          rateLimits: {
            requestsPerMinute: 60,
            tokensPerMinute: 150000,
            concurrentRequests: 10
          }
        };

        const provider = AIProviderFactory.createProvider(openaiConfig);
        this.providers.set('openai', provider);
        await this.checkProviderHealth('openai');
      } catch (error) {
        console.error('Failed to initialize OpenAI provider:', error);
      }
    }

    // Initialize Ollama provider if configured
    if (userPrefs.providerPreferences.ollama.baseUrl) {
      try {
        const ollamaConfig: ProviderConfig = {
          type: 'ollama',
          name: 'Ollama',
          baseUrl: userPrefs.providerPreferences.ollama.baseUrl,
          models: [],
          healthStatus: {
            isHealthy: false,
            lastCheck: new Date(),
            responseTime: 0,
            errorCount: 0
          },
          capabilities: {
            streaming: true,
            functionCalling: false,
            vision: false,
            embedding: false,
            maxContextLength: 128000
          },
          rateLimits: {
            requestsPerMinute: 1000,
            tokensPerMinute: 1000000,
            concurrentRequests: 5
          }
        };

        const provider = AIProviderFactory.createProvider(ollamaConfig);
        this.providers.set('ollama', provider);
        await this.checkProviderHealth('ollama');
      } catch (error) {
        console.error('Failed to initialize Ollama provider:', error);
      }
    }

    // Start health monitoring
    this.startHealthMonitoring();
  }

  /**
   * Gets the default provider based on user preferences
   */
  public getDefaultProvider(userPrefs: UserPreferences): AIProvider | null {
    const defaultType = userPrefs.providerPreferences.defaultProvider;
    const provider = this.providers.get(defaultType);
    
    if (provider && this.healthStatus.get(defaultType)) {
      return provider;
    }

    // Fallback to any healthy provider
    for (const [type, healthyProvider] of this.providers.entries()) {
      if (this.healthStatus.get(type)) {
        return healthyProvider;
      }
    }

    return null;
  }

  /**
   * Gets a specific provider by type
   */
  public getProvider(type: 'openai' | 'ollama'): AIProvider | null {
    return this.providers.get(type) || null;
  }

  /**
   * Gets all available providers
   */
  public getAllProviders(): Array<{ type: string; provider: AIProvider; isHealthy: boolean }> {
    return Array.from(this.providers.entries()).map(([type, provider]) => ({
      type,
      provider,
      isHealthy: this.healthStatus.get(type) || false
    }));
  }

  /**
   * Checks the health of a specific provider
   */
  public async checkProviderHealth(type: string): Promise<boolean> {
    const provider = this.providers.get(type);
    if (!provider) return false;

    try {
      const isHealthy = await provider.isHealthy();
      this.healthStatus.set(type, isHealthy);
      this.lastHealthCheck.set(type, new Date());
      return isHealthy;
    } catch (error) {
      console.error(`Health check failed for ${type}:`, error);
      this.healthStatus.set(type, false);
      this.lastHealthCheck.set(type, new Date());
      return false;
    }
  }

  /**
   * Gets health status for all providers
   */
  public getHealthStatus(): Record<string, { isHealthy: boolean; lastCheck: Date }> {
    const status: Record<string, { isHealthy: boolean; lastCheck: Date }> = {};
    
    for (const [type] of this.providers.entries()) {
      status[type] = {
        isHealthy: this.healthStatus.get(type) || false,
        lastCheck: this.lastHealthCheck.get(type) || new Date(0)
      };
    }
    
    return status;
  }

  /**
   * Tests all available models for a provider
   */
  public async testProviderModels(type: 'openai' | 'ollama'): Promise<ModelTestResult[]> {
    const provider = this.providers.get(type);
    if (!provider) return [];

    try {
      const models = await provider.discoverModels();
      const results: ModelTestResult[] = [];

      for (const model of models) {
        try {
          const startTime = Date.now();
          
          // Simple test with a basic prompt
          const testPrompt = 'Hello, this is a test message. Please respond briefly.';
          const mockContext: any = {
            id: 'test',
            subject: 'Test',
            body: 'Test email',
            sender: { name: 'Test', email: 'test@example.com' },
            recipients: { to: [], cc: [], bcc: [] },
            attachments: [],
            metadata: { importance: 'normal', categories: [], flags: [], receivedTime: new Date(), threadId: 'test' }
          };
          const mockUserPrefs: any = {
            stakeholderRegistry: {}
          };

          const response = await provider.generateResponse(testPrompt, mockContext, mockUserPrefs);
          const responseTime = Date.now() - startTime;
          
          results.push({
            modelId: model.id,
            success: true,
            responseTime,
            sampleResponse: response.substring(0, 100) + '...',
            qualityScore: this.assessResponseQuality(response)
          });
        } catch (error) {
          results.push({
            modelId: model.id,
            success: false,
            responseTime: 0,
            error: (error as Error).message
          });
        }
      }

      return results;
    } catch (error) {
      console.error(`Failed to test models for ${type}:`, error);
      return [];
    }
  }

  /**
   * Discovers and caches models for all providers
   */
  public async refreshProviderModels(): Promise<void> {
    for (const [type, provider] of this.providers.entries()) {
      try {
        const models = await provider.discoverModels();
        console.log(`Discovered ${models.length} models for ${type}:`, models.map(m => m.name));
      } catch (error) {
        console.error(`Failed to refresh models for ${type}:`, error);
      }
    }
  }

  /**
   * Starts background health monitoring
   */
  private startHealthMonitoring(): void {
    setInterval(async () => {
      for (const type of this.providers.keys()) {
        const lastCheck = this.lastHealthCheck.get(type);
        if (!lastCheck || Date.now() - lastCheck.getTime() > this.healthCheckInterval) {
          await this.checkProviderHealth(type);
        }
      }
    }, this.healthCheckInterval);
  }

  /**
   * Assesses the quality of an AI response
   */
  private assessResponseQuality(response: string): number {
    // Simple quality assessment - in practice, this would be more sophisticated
    let score = 0.5; // Base score
    
    // Check length (not too short, not too long)
    if (response.length > 20 && response.length < 1000) score += 0.2;
    
    // Check for complete sentences
    if (response.endsWith('.') || response.endsWith('!') || response.endsWith('?')) score += 0.1;
    
    // Check for coherence (simple heuristic)
    const words = response.split(' ').length;
    if (words > 5 && words < 200) score += 0.1;
    
    // Check for politeness indicators
    const politeWords = ['thank', 'please', 'appreciate', 'help'];
    if (politeWords.some(word => response.toLowerCase().includes(word))) score += 0.1;
    
    return Math.min(1.0, score);
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    this.providers.clear();
    this.healthStatus.clear();
    this.lastHealthCheck.clear();
  }
}
