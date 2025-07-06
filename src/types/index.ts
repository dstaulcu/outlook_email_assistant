// Core data structures for the Outlook Email AI Assistant

export interface EmailSelectionContext {
  id: string;
  subject: string;
  body: string;
  sender: {
    name: string;
    email: string;
  };
  recipients: {
    to: Array<{ name: string; email: string }>;
    cc: Array<{ name: string; email: string }>;
    bcc: Array<{ name: string; email: string }>;
  };
  attachments: Array<{
    id: string;
    name: string;
    size: number;
    contentType: string;
  }>;
  metadata: {
    importance: 'low' | 'normal' | 'high';
    categories: string[];
    flags: string[];
    receivedTime: Date;
    threadId: string;
  };
  classification?: SecurityClassification;
}

export interface SecurityClassification {
  level: 'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  detectionConfidence: number;
  sourceLocation: {
    lineNumber: number;
    text: string;
  };
  processingAuthorized: boolean;
  detectedAt: Date;
}

export interface ClassificationResult {
  classification: SecurityClassification | null;
  isProcessingAllowed: boolean;
  warningMessage?: string;
  detectionErrors?: string[];
}

export interface EmailAnalysis {
  id: string;
  emailId: string;
  summary: EmailSummary;
  actions: ActionItem[];
  priority: PriorityAssessment;
  draft: DraftResponse;
  generatedAt: Date;
  confidence: number;
}

export interface EmailSummary {
  keyPoints: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  context: string;
  relationshipInfo: {
    recipientType: 'internal' | 'external' | 'stakeholder';
    relationshipLevel: 'formal' | 'professional' | 'casual' | 'friendly';
    previousInteractions: number;
  };
  urgencyIndicators: string[];
  topics: string[];
}

export interface ActionItem {
  id: string;
  description: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: string;
  category: 'task' | 'meeting' | 'decision' | 'information' | 'follow-up';
  status: 'pending' | 'in-progress' | 'completed';
  estimatedEffort?: string;
}

export interface PriorityAssessment {
  score: number; // 1-10 scale
  reasoning: string;
  factors: {
    urgency: number;
    importance: number;
    businessImpact: number;
    stakeholderLevel: number;
    timeConstraints: number;
  };
  recommendedResponseTime: string;
  escalationRequired: boolean;
}

export interface DraftResponse {
  content: string;
  tone: 'professional' | 'casual' | 'formal' | 'friendly' | 'urgent';
  confidence: number;
  alternatives: string[];
  reasoning: string;
  personalizationApplied: {
    userContext: boolean;
    stakeholderContext: boolean;
    toneAdjustment: boolean;
  };
}

export interface ModifierSettings {
  verbosity: 1 | 2 | 3 | 4 | 5; // 1=brief, 5=detailed
  tone: 'enthusiastic' | 'neutral' | 'reserved' | 'professional' | 'casual';
  formality: 'formal' | 'professional' | 'casual' | 'friendly';
  length: 'brief' | 'standard' | 'comprehensive';
  urgency: 'low' | 'medium' | 'high';
  personalTouch: boolean;
  customPreset?: string;
}

export interface ModifierPreferences {
  defaultSettings: ModifierSettings;
  contextualDefaults: Record<string, Partial<ModifierSettings>>;
  recentModifiers: ModifierSettings[];
  customPresets: Record<string, ModifierSettings>;
  autoApplyRules: Array<{
    condition: string;
    modifiers: Partial<ModifierSettings>;
  }>;
}

export interface UserPreferences {
  id: string;
  version: number;
  providerPreferences: {
    defaultProvider: 'openai' | 'ollama';
    openai: {
      apiKey: string;
      model: string;
      baseUrl?: string;
    };
    ollama: {
      baseUrl: string;
      model: string;
    };
  };

  stakeholderRegistry: Record<string, Stakeholder>;
  emailTonePreferences: {
    formal: boolean;
    casual: boolean;
    technical: boolean;
    friendly: boolean;
  };
  responsePersonalization: boolean;
  securityPreferences: {
    strictClassificationCheck: boolean;
    auditLogging: boolean;
    allowOverride: boolean;
  };
  uiPreferences: {
    taskPaneAutoOpen: boolean;
    defaultViewMode: 'dashboard' | 'simple' | 'detailed';
    showQuickModifiers: boolean;
    enableKeyboardShortcuts: boolean;
    autoAnalyzeEmail: boolean;
    defaultTone: 'professional' | 'personal';
    defaultLength: 'brief' | 'detailed';
  };
  userProfile: {
    displayName: string;
    email: string;
    jobTitle: string;
    department: string;
    signaturePreferences: {
      includeNameInSignoff: boolean;
      includeJobTitle: boolean;
      includeDepartment: boolean;
      customSignoffTemplate: string;
      professionalSignoff: string;
      personalSignoff: string;
    };
    autoDetectFromOffice: boolean;
  };
  cacheSettings: {
    enableCaching: boolean;
    maxCacheSize: number;
    defaultTTL: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Stakeholder {
  id: string;
  name: string;
  email: string;
  relationship: 'colleague' | 'manager' | 'client' | 'vendor' | 'partner' | 'external' | 'family' | 'friend' | 'personal';
  context: string;
  communicationPreferences: {
    preferredTone: 'formal' | 'professional' | 'casual' | 'friendly';
    responseExpectation: 'immediate' | 'same-day' | 'next-day' | 'weekly';
    detailLevel: 'brief' | 'standard' | 'comprehensive';
  };
  interactionHistory: {
    emailCount: number;
    lastInteraction: Date;
    averageResponseTime: number;
    satisfactionScore?: number;
  };
  tags: string[];
  notes: string;
  isActive: boolean;
}

export interface ProviderConfig {
  type: 'openai' | 'ollama';
  name: string;
  baseUrl: string;
  apiKey?: string;
  models: ModelInfo[];
  healthStatus: {
    isHealthy: boolean;
    lastCheck: Date;
    responseTime: number;
    errorCount: number;
  };
  capabilities: {
    streaming: boolean;
    functionCalling: boolean;
    vision: boolean;
    embedding: boolean;
    maxContextLength: number;
  };
  rateLimits: {
    requestsPerMinute: number;
    tokensPerMinute: number;
    concurrentRequests: number;
  };
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  capabilities: string[];
  performance: {
    averageResponseTime: number;
    tokensPerSecond: number;
    qualityScore: number;
    reliability: number;
  };
  pricing?: {
    inputTokens: number;
    outputTokens: number;
    currency: string;
  };
  isDefault: boolean;
  isAvailable: boolean;
}

// UI Component Types
export interface DashboardState {
  selectedEmailId: string | null;
  isLoading: boolean;
  error: string | null;
  analysis: EmailAnalysis | null;
  currentDraft: string;
  modifierSettings: ModifierSettings;
  showModifiers: boolean;
  iterationHistory: DraftIteration[];
  currentIteration: number;
}

export interface DraftIteration {
  id: string;
  content: string;
  modifiers: ModifierSettings;
  feedback: string;
  timestamp: Date;
  confidence: number;
}

// Service Types
export interface AIProvider {
  type: 'openai' | 'ollama';
  name: string;
  isHealthy(): Promise<boolean>;
  discoverModels(): Promise<ModelInfo[]>;
  generateResponse(prompt: string, context: EmailSelectionContext, userPrefs: UserPreferences): Promise<string>;
  generateResponseWithPreferences(prompt: string, context: EmailSelectionContext, userPrefs: UserPreferences, isProfessional: boolean, isDetailed: boolean, customInstructions?: string): Promise<string>;
  analyzeEmail(email: EmailSelectionContext, userPrefs: UserPreferences): Promise<EmailAnalysis>;
  refineResponse(originalResponse: string, modifiers: ModifierSettings): Promise<string>;
  testConnectivity(): Promise<{ success: boolean; error?: string; responseTime: number }>;
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: Date;
  ttl: number;
  hits: number;
}

export interface CacheOptions {
  ttl?: number;
  compress?: boolean;
  encrypt?: boolean;
}

// Event Types
export interface EmailSelectionEvent {
  type: 'email-selected';
  emailId: string;
  context: EmailSelectionContext;
}

export interface ProviderStatusEvent {
  type: 'provider-status-changed';
  provider: 'openai' | 'ollama';
  status: 'healthy' | 'unhealthy' | 'unknown';
  error?: string;
}

export interface PreferenceChangeEvent {
  type: 'preferences-changed';
  changes: Partial<UserPreferences>;
  source: 'ui' | 'sync' | 'migration';
}

// Error Types
export interface AppError {
  type: 'classification' | 'provider' | 'network' | 'validation' | 'cache' | 'unknown';
  message: string;
  details?: any;
  timestamp: Date;
  userMessage: string;
  canRetry: boolean;
  suggestedAction?: string;
}

export interface SecurityError extends AppError {
  type: 'classification';
  classification: SecurityClassification;
  attemptedAction: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
  requestId: string;
}

export interface ModelTestResult {
  modelId: string;
  success: boolean;
  responseTime: number;
  error?: string;
  sampleResponse?: string;
  qualityScore?: number;
}

export interface ProviderTestResult {
  provider: 'openai' | 'ollama';
  success: boolean;
  modelsFound: number;
  averageResponseTime: number;
  errors: string[];
  recommendations: string[];
}

// Configuration Types
export interface AppConfig {
  version: string;
  buildNumber: string;
  environment: 'development' | 'staging' | 'production';
  features: {
    enableCaching: boolean;
    enableSecurity: boolean;
    enableAnalytics: boolean;
    enableDebugMode: boolean;
  };
  providers: {
    openai: {
      defaultModel: string;
      maxRetries: number;
      timeout: number;
    };
    ollama: {
      defaultModel: string;
      maxRetries: number;
      timeout: number;
    };
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    taskPaneWidth: number;
    taskPaneHeight: number;
    enableAnimations: boolean;
  };
  cache: {
    defaultTTL: number;
    maxSize: number;
    compressionEnabled: boolean;
    encryptionEnabled: boolean;
  };
  security: {
    strictMode: boolean;
    auditEnabled: boolean;
    allowClassificationOverride: boolean;
  };
}
