import { SecurityClassification, ClassificationResult, EmailSelectionContext, AppError } from '@/types';

export class SecurityClassificationService {
  private static readonly CLASSIFICATION_PATTERNS = [
    // Standard US Government classifications
    { level: 'UNCLASSIFIED', patterns: [/^UNCLASSIFIED$/i, /^UNCLASSIFIED\/\/[A-Z\s]+$/i] },
    { level: 'CONFIDENTIAL', patterns: [/^CONFIDENTIAL$/i, /^CONFIDENTIAL\/\/[A-Z\s]+$/i] },
    { level: 'SECRET', patterns: [/^SECRET$/i, /^SECRET\/\/[A-Z\s]+$/i] },
    { level: 'TOP_SECRET', patterns: [/^TOP\s+SECRET$/i, /^TOP\s+SECRET\/\/[A-Z\s]+$/i] },
    
    // Alternative formats
    { level: 'SECRET', patterns: [/^SECRET\s*$/i, /^SECRET\s+[A-Z\s]+$/i] },
    { level: 'TOP_SECRET', patterns: [/^TOP\s*SECRET\s*$/i, /^TS\s*$/i] },
    { level: 'CONFIDENTIAL', patterns: [/^CONF\s*$/i, /^CONFIDENTIAL\s+[A-Z\s]+$/i] },
    
    // NATO classifications
    { level: 'SECRET', patterns: [/^NATO\s+SECRET$/i] },
    { level: 'TOP_SECRET', patterns: [/^NATO\s+TOP\s+SECRET$/i] },
    { level: 'CONFIDENTIAL', patterns: [/^NATO\s+CONFIDENTIAL$/i] },
    
    // Common variations
    { level: 'SECRET', patterns: [/^\*\*\*\s*SECRET\s*\*\*\*$/i] },
    { level: 'TOP_SECRET', patterns: [/^\*\*\*\s*TOP\s+SECRET\s*\*\*\*$/i] },
  ] as const;

  private static readonly CLASSIFICATION_HIERARCHY = {
    'UNCLASSIFIED': 0,
    'CONFIDENTIAL': 1,
    'SECRET': 2,
    'TOP_SECRET': 3
  } as const;

  private static readonly PROCESSING_BLOCKED_LEVELS = ['SECRET', 'TOP_SECRET'] as const;

  /**
   * Analyzes the first 4 lines of an email body for security classification markings
   */
  public static analyzeEmailClassification(email: EmailSelectionContext): ClassificationResult {
    try {
      const bodyLines = this.extractFirstFourLines(email.body);
      const classification = this.detectClassification(bodyLines);
      
      const result: ClassificationResult = {
        classification,
        isProcessingAllowed: classification ? this.isProcessingAllowed(classification.level) : true,
        warningMessage: classification ? this.getWarningMessage(classification) : undefined
      };

      // Log security event
      this.logSecurityEvent(email.id, result);

      return result;
    } catch (error) {
      console.error('Classification analysis error:', error);
      
      // Security-first approach: if we can't determine classification, block processing
      return {
        classification: null,
        isProcessingAllowed: false,
        warningMessage: 'Unable to determine email classification. Processing blocked for security.',
        detectionErrors: [(error as Error).message]
      };
    }
  }

  /**
   * Extracts the first 4 lines from email body content
   */
  private static extractFirstFourLines(body: string): string[] {
    if (!body) return [];
    
    // Remove HTML tags if present
    const plainText = body.replace(/<[^>]*>/g, '');
    
    // Split into lines and take first 4
    const lines = plainText
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .slice(0, 4);
    
    return lines;
  }

  /**
   * Detects classification markings in the provided lines
   */
  private static detectClassification(lines: string[]): SecurityClassification | null {
    let highestClassification: SecurityClassification | null = null;
    let highestLevel = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const classificationDef of this.CLASSIFICATION_PATTERNS) {
        for (const pattern of classificationDef.patterns) {
          const match = line.match(pattern);
          if (match) {
            const level = this.CLASSIFICATION_HIERARCHY[classificationDef.level];
            
            if (level > highestLevel) {
              highestLevel = level;
              highestClassification = {
                level: classificationDef.level,
                detectionConfidence: this.calculateConfidence(match, line),
                sourceLocation: {
                  lineNumber: i + 1,
                  text: line
                },
                processingAuthorized: this.isProcessingAllowed(classificationDef.level),
                detectedAt: new Date()
              };
            }
          }
        }
      }
    }

    return highestClassification;
  }

  /**
   * Calculates confidence score for classification detection
   */
  private static calculateConfidence(match: RegExpMatchArray, line: string): number {
    // Higher confidence for exact matches
    if (match[0] === line) return 0.95;
    
    // Medium confidence for partial matches
    if (match[0].length > line.length * 0.8) return 0.85;
    
    // Lower confidence for shorter matches
    return 0.75;
  }

  /**
   * Determines if processing is allowed for the given classification level
   */
  private static isProcessingAllowed(level: SecurityClassification['level']): boolean {
    return ['SECRET', 'TOP_SECRET'].indexOf(level) === -1;
  }

  /**
   * Generates appropriate warning message for classified content
   */
  private static getWarningMessage(classification: SecurityClassification): string {
    if (!classification.processingAuthorized) {
      return `This email contains ${classification.level} classified content. AI processing is not authorized for security reasons.`;
    }
    
    return `This email is classified as ${classification.level}. Please verify classification before processing.`;
  }

  /**
   * Logs security-related events for audit purposes
   */
  private static logSecurityEvent(emailId: string, result: ClassificationResult): void {
    const event = {
      timestamp: new Date(),
      emailId,
      classification: result.classification?.level || 'UNCLASSIFIED',
      processingAllowed: result.isProcessingAllowed,
      confidence: result.classification?.detectionConfidence || 0,
      sourceLocation: result.classification?.sourceLocation
    };

    // Log to console in development
    console.log('Security Classification Event:', event);

    // Store in local storage for audit trail
    this.storeAuditEvent(event);
  }

  /**
   * Stores audit events in local storage
   */
  private static storeAuditEvent(event: any): void {
    try {
      const auditLog = JSON.parse(localStorage.getItem('security_audit_log') || '[]');
      auditLog.push(event);
      
      // Keep only last 100 events
      if (auditLog.length > 100) {
        auditLog.splice(0, auditLog.length - 100);
      }
      
      localStorage.setItem('security_audit_log', JSON.stringify(auditLog));
    } catch (error) {
      console.error('Failed to store audit event:', error);
    }
  }

  /**
   * Validates email content before AI processing
   */
  public static validateForProcessing(email: EmailSelectionContext): { canProcess: boolean; error?: AppError } {
    const classificationResult = this.analyzeEmailClassification(email);
    
    if (!classificationResult.isProcessingAllowed) {
      const error: AppError = {
        type: 'classification',
        message: 'Email processing blocked due to security classification',
        details: {
          classification: classificationResult.classification,
          emailId: email.id
        },
        timestamp: new Date(),
        userMessage: classificationResult.warningMessage || 'Email processing blocked for security reasons',
        canRetry: false,
        suggestedAction: 'Contact your security administrator if you believe this is an error'
      };
      
      return { canProcess: false, error };
    }
    
    return { canProcess: true };
  }

  /**
   * Gets security audit log for review
   */
  public static getAuditLog(): any[] {
    try {
      return JSON.parse(localStorage.getItem('security_audit_log') || '[]');
    } catch (error) {
      console.error('Failed to retrieve audit log:', error);
      return [];
    }
  }

  /**
   * Clears security audit log
   */
  public static clearAuditLog(): void {
    try {
      localStorage.removeItem('security_audit_log');
    } catch (error) {
      console.error('Failed to clear audit log:', error);
    }
  }

  /**
   * Tests classification detection with sample text
   */
  public static testClassificationDetection(testText: string): ClassificationResult {
    const mockEmail: EmailSelectionContext = {
      id: 'test-email',
      subject: 'Test Email',
      body: testText,
      sender: { name: 'Test', email: 'test@example.com' },
      recipients: { to: [], cc: [], bcc: [] },
      attachments: [],
      metadata: {
        importance: 'normal',
        categories: [],
        flags: [],
        receivedTime: new Date(),
        threadId: 'test-thread'
      }
    };

    return this.analyzeEmailClassification(mockEmail);
  }
}
