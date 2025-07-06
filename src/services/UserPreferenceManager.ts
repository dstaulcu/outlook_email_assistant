import * as CryptoJS from 'crypto-js';
import { UserPreferences, Stakeholder } from '@/types';

export class UserPreferenceManager {
  private static readonly STORAGE_KEY = 'outlook_ai_assistant_preferences';
  private static readonly ENCRYPTION_KEY = 'outlook_ai_assistant_encryption_key';
  private static readonly CURRENT_VERSION = 2;

  /**
   * Checks if Office.js is available and roaming settings are supported
   */
  private static isOfficeAvailable(): boolean {
    return typeof (window as any).Office !== 'undefined' && 
           (window as any).Office.context && 
           (window as any).Office.context.roamingSettings;
  }

  /**
   * Gets user preferences from Office.js roaming settings or localStorage fallback
   */
  public static getPreferences(): UserPreferences {
    try {
      let preferences: UserPreferences;
      
      if (this.isOfficeAvailable()) {
        // Use Office.js roaming settings
        const settings = (window as any).Office.context.roamingSettings;
        const encryptedData = settings.get(this.STORAGE_KEY);
        
        if (encryptedData) {
          const decryptedData = this.decryptData(encryptedData);
          preferences = JSON.parse(decryptedData);
          
          // Handle version migration
          if (preferences.version < this.CURRENT_VERSION) {
            preferences = this.migratePreferences(preferences);
          }
        } else {
          preferences = this.getDefaultPreferences();
        }
      } else {
        // Fallback to localStorage for development/standalone mode
        preferences = this.getPreferencesFromLocalStorage();
      }
      
      // Ensure userProfile is initialized (safety check for existing users)
      if (!preferences.userProfile) {
        const defaultPrefs = this.getDefaultPreferences();
        preferences.userProfile = defaultPrefs.userProfile;
      }
      
      return preferences;
    } catch (error) {
      console.error('Failed to load user preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Gets user preferences from local storage (fallback method)
   */
  private static getPreferencesFromLocalStorage(): UserPreferences {
    try {
      const encryptedData = localStorage.getItem(this.STORAGE_KEY);
      if (!encryptedData) {
        return this.getDefaultPreferences();
      }

      const decryptedData = this.decryptData(encryptedData);
      const preferences: UserPreferences = JSON.parse(decryptedData);
      
      // Handle version migration
      if (preferences.version < this.CURRENT_VERSION) {
        return this.migratePreferences(preferences);
      }

      return preferences;
    } catch (error) {
      console.error('Failed to load user preferences from localStorage:', error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Saves user preferences to Office.js roaming settings or localStorage fallback
   */
  public static async setPreferences(preferences: UserPreferences): Promise<void> {
    try {
      preferences.version = this.CURRENT_VERSION;
      preferences.updatedAt = new Date();
      
      const dataToStore = JSON.stringify(preferences);
      const encryptedData = this.encryptData(dataToStore);
      
      if (this.isOfficeAvailable()) {
        // Use Office.js roaming settings
        const settings = (window as any).Office.context.roamingSettings;
        settings.set(this.STORAGE_KEY, encryptedData);
        
        // Save to server (returns Promise)
        return new Promise((resolve, reject) => {
          settings.saveAsync((asyncResult: any) => {
            if (asyncResult.status === 'succeeded') {
              console.log('Preferences saved to Office roaming settings');
              // Trigger preference change event
              this.notifyPreferenceChange(preferences);
              resolve();
            } else {
              console.error('Failed to save preferences to Office roaming settings:', asyncResult.error);
              reject(new Error(asyncResult.error?.message || 'Failed to save to roaming settings'));
            }
          });
        });
      } else {
        // Fallback to localStorage for development/standalone mode
        localStorage.setItem(this.STORAGE_KEY, encryptedData);
        console.log('Preferences saved to localStorage (fallback mode)');
        
        // Trigger preference change event
        this.notifyPreferenceChange(preferences);
        return Promise.resolve();
      }
    } catch (error) {
      console.error('Failed to save user preferences:', error);
      throw new Error('Failed to save preferences');
    }
  }

  /**
   * Updates specific preference sections
   */
  public static async updatePreferences(updates: Partial<UserPreferences>): Promise<UserPreferences> {
    const currentPrefs = this.getPreferences();
    const updatedPrefs: UserPreferences = {
      ...currentPrefs,
      ...updates,
      updatedAt: new Date()
    };
    
    await this.setPreferences(updatedPrefs);
    return updatedPrefs;
  }

  /**
   * Resets preferences to default values
   */
  public static async resetPreferences(): Promise<UserPreferences> {
    const defaultPrefs = this.getDefaultPreferences();
    await this.setPreferences(defaultPrefs);
    return defaultPrefs;
  }

  /**
   * Adds or updates a stakeholder
   */
  public static addStakeholder(stakeholder: Stakeholder): void {
    const preferences = this.getPreferences();
    preferences.stakeholderRegistry[stakeholder.email] = stakeholder;
    this.setPreferences(preferences);
  }

  /**
   * Removes a stakeholder
   */
  public static removeStakeholder(email: string): void {
    const preferences = this.getPreferences();
    delete preferences.stakeholderRegistry[email];
    this.setPreferences(preferences);
  }

  /**
   * Gets all stakeholders
   */
  public static getStakeholders(): Stakeholder[] {
    const preferences = this.getPreferences();
    return Object.values(preferences.stakeholderRegistry).filter(s => s.isActive);
  }

  /**
   * Gets a specific stakeholder by email
   */
  public static getStakeholder(email: string): Stakeholder | null {
    const preferences = this.getPreferences();
    return preferences.stakeholderRegistry[email] || null;
  }

  /**
   * Updates stakeholder interaction history
   */
  public static updateStakeholderInteraction(email: string, responseTime: number): void {
    const preferences = this.getPreferences();
    const stakeholder = preferences.stakeholderRegistry[email];
    
    if (stakeholder) {
      stakeholder.interactionHistory.emailCount += 1;
      stakeholder.interactionHistory.lastInteraction = new Date();
      
      // Update average response time
      const currentAvg = stakeholder.interactionHistory.averageResponseTime;
      const count = stakeholder.interactionHistory.emailCount;
      stakeholder.interactionHistory.averageResponseTime = 
        ((currentAvg * (count - 1)) + responseTime) / count;
      
      this.setPreferences(preferences);
    }
  }

  /**
   * Gets provider preferences
   */
  public static getProviderPreferences(): UserPreferences['providerPreferences'] {
    return this.getPreferences().providerPreferences;
  }

  /**
   * Updates provider preferences
   */
  public static updateProviderPreferences(
    providerPrefs: Partial<UserPreferences['providerPreferences']>
  ): void {
    this.updatePreferences({ providerPreferences: { ...this.getProviderPreferences(), ...providerPrefs } });
  }

  /**
   * Exports preferences for backup
   */
  public static exportPreferences(): string {
    const preferences = this.getPreferences();
    
    // Remove sensitive data for export
    const exportData = {
      ...preferences,
      providerPreferences: {
        ...preferences.providerPreferences,
        openai: {
          ...preferences.providerPreferences.openai,
          apiKey: '[REDACTED]'
        }
      }
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Imports preferences from backup
   */
  public static importPreferences(importData: string, includeApiKeys = false): UserPreferences {
    try {
      const importedPrefs: UserPreferences = JSON.parse(importData);
      const currentPrefs = this.getPreferences();
      
      const mergedPrefs: UserPreferences = {
        ...importedPrefs,
        id: currentPrefs.id, // Keep current ID
        version: this.CURRENT_VERSION,
        updatedAt: new Date(),
        // Preserve API keys unless explicitly importing them
        providerPreferences: includeApiKeys 
          ? importedPrefs.providerPreferences 
          : {
              ...importedPrefs.providerPreferences,
              openai: {
                ...importedPrefs.providerPreferences.openai,
                apiKey: currentPrefs.providerPreferences.openai.apiKey
              }
            }
      };
      
      this.setPreferences(mergedPrefs);
      return mergedPrefs;
    } catch (error) {
      console.error('Failed to import preferences:', error);
      throw new Error('Invalid preference data');
    }
  }

  /**
   * Exports preferences in a format suitable for file system storage
   */
  public static exportForFileSystem(): string {
    const preferences = this.getPreferences();
    
    const exportData = {
      version: 'enterprise-v1',
      exportDate: new Date().toISOString(),
      userInfo: {
        id: preferences.id,
        exportedBy: 'outlook_email_assistant'
      },
      preferences: {
        ...preferences,
        providerPreferences: {
          ...preferences.providerPreferences,
          openai: {
            ...preferences.providerPreferences.openai,
            apiKey: preferences.providerPreferences.openai.apiKey ? '[ENCRYPTED]' : ''
          }
        }
      }
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Imports preferences from file system format
   */
  public static importFromFileSystem(fileContent: string, includeApiKeys = false): UserPreferences {
    try {
      const importData = JSON.parse(fileContent);
      
      if (importData.version !== 'enterprise-v1') {
        throw new Error('Unsupported file format version');
      }
      
      const currentPrefs = this.getPreferences();
      const importedPrefs = importData.preferences;
      
      const mergedPrefs: UserPreferences = {
        ...importedPrefs,
        id: currentPrefs.id, // Keep current ID
        version: this.CURRENT_VERSION,
        updatedAt: new Date(),
        // Handle API keys
        providerPreferences: includeApiKeys 
          ? importedPrefs.providerPreferences 
          : {
              ...importedPrefs.providerPreferences,
              openai: {
                ...importedPrefs.providerPreferences.openai,
                apiKey: currentPrefs.providerPreferences.openai.apiKey
              }
            }
      };
      
      this.setPreferences(mergedPrefs);
      return mergedPrefs;
    } catch (error) {
      console.error('Failed to import preferences from file system:', error);
      throw new Error('Invalid preference file format');
    }
  }

  /**
   * Generates PowerShell script for admin management
   */
  public static generateAdminScript(): string {
    return `# Outlook Email AI Assistant - Admin Management Script
# This script provides administrative functions for managing user preferences

function Get-OutlookAIPreferences {
    param(
        [Parameter(Mandatory=$true)]
        [string]$UserName
    )
    
    $path = "C:\\Users\\$UserName\\AppData\\Roaming\\OutlookEmailAssistant\\preferences.json"
    
    if (Test-Path $path) {
        $content = Get-Content $path -Raw | ConvertFrom-Json
        return $content
    } else {
        Write-Warning "No preferences found for user: $UserName"
        return $null
    }
}

function Set-OutlookAIPreferences {
    param(
        [Parameter(Mandatory=$true)]
        [string]$UserName,
        [Parameter(Mandatory=$true)]
        [object]$Preferences
    )
    
    $path = "C:\\Users\\$UserName\\AppData\\Roaming\\OutlookEmailAssistant\\preferences.json"
    $directory = Split-Path $path -Parent
    
    if (!(Test-Path $directory)) {
        New-Item -ItemType Directory -Path $directory -Force
    }
    
    $Preferences | ConvertTo-Json -Depth 10 | Out-File $path -Encoding UTF8
    Write-Host "Preferences updated for user: $UserName"
}

function Export-OutlookAIPreferences {
    param(
        [Parameter(Mandatory=$true)]
        [string]$UserName,
        [Parameter(Mandatory=$true)]
        [string]$ExportPath
    )
    
    $preferences = Get-OutlookAIPreferences -UserName $UserName
    if ($preferences) {
        $preferences | ConvertTo-Json -Depth 10 | Out-File $ExportPath -Encoding UTF8
        Write-Host "Preferences exported to: $ExportPath"
    }
}

function Import-OutlookAIPreferences {
    param(
        [Parameter(Mandatory=$true)]
        [string]$UserName,
        [Parameter(Mandatory=$true)]
        [string]$ImportPath
    )
    
    if (Test-Path $ImportPath) {
        $preferences = Get-Content $ImportPath -Raw | ConvertFrom-Json
        Set-OutlookAIPreferences -UserName $UserName -Preferences $preferences
    } else {
        Write-Error "Import file not found: $ImportPath"
    }
}

function Get-OutlookAIUsers {
    $users = Get-ChildItem "C:\\Users" -Directory | Where-Object {
        Test-Path "C:\\Users\\$($_.Name)\\AppData\\Roaming\\OutlookEmailAssistant\\preferences.json"
    }
    
    return $users | ForEach-Object {
        [PSCustomObject]@{
            UserName = $_.Name
            PreferencesPath = "C:\\Users\\$($_.Name)\\AppData\\Roaming\\OutlookEmailAssistant\\preferences.json"
            LastModified = (Get-Item "C:\\Users\\$($_.Name)\\AppData\\Roaming\\OutlookEmailAssistant\\preferences.json").LastWriteTime
        }
    }
}

# Export functions
Export-ModuleMember -Function Get-OutlookAIPreferences, Set-OutlookAIPreferences, Export-OutlookAIPreferences, Import-OutlookAIPreferences, Get-OutlookAIUsers

Write-Host "Outlook Email AI Assistant Admin Module Loaded"
Write-Host "Available functions:"
Write-Host "  - Get-OutlookAIPreferences -UserName <username>"
Write-Host "  - Set-OutlookAIPreferences -UserName <username> -Preferences <object>"
Write-Host "  - Export-OutlookAIPreferences -UserName <username> -ExportPath <path>"
Write-Host "  - Import-OutlookAIPreferences -UserName <username> -ImportPath <path>"
Write-Host "  - Get-OutlookAIUsers"
`;
  }

  /**
   * Provides instructions for file system storage setup
   */
  public static getFileSystemSetupInstructions(): string {
    return `# Outlook Email AI Assistant - File System Storage Setup

## For Users:

### Export Current Settings:
1. Open Outlook Email AI Assistant
2. Go to Settings
3. Use the "Export Settings" button to save your preferences to a file
4. Save the file to your desired location (e.g., Documents, Desktop)

### Import Settings:
1. Open Outlook Email AI Assistant
2. Go to Settings
3. Use the "Import Settings" button to load preferences from a file

## For IT Administrators:

### Setup Instructions:
1. Save the PowerShell admin script to a file (e.g., OutlookAIAdmin.psm1)
2. Import the module: Import-Module .\\OutlookAIAdmin.psm1
3. Use the provided functions to manage user preferences

### Directory Structure:
User preferences are stored in:
%APPDATA%\\OutlookEmailAssistant\\preferences.json

This translates to:
C:\\Users\\[username]\\AppData\\Roaming\\OutlookEmailAssistant\\preferences.json

### Group Policy Deployment:
You can deploy default preference files using Group Policy:
1. Create a default preferences.json file
2. Use Group Policy to copy the file to user directories
3. Set appropriate permissions

### Backup and Restore:
The preferences.json files can be backed up and restored like any other user data files.
Include them in your standard user profile backup procedures.

### Security Considerations:
- API keys are encrypted in localStorage but exported as [ENCRYPTED] for security
- File permissions should restrict access to the user and administrators
- Consider using Group Policy to manage sensitive settings centrally
`;
  }

  /**
   * Checks if this is the first run (no preferences saved)
   */
  public static isFirstRun(): boolean {
    try {
      const encryptedData = localStorage.getItem(this.STORAGE_KEY);
      return !encryptedData;
    } catch (error) {
      return true;
    }
  }

  /**
   * Marks the first run as completed
   */
  public static markFirstRunComplete(): void {
    const preferences = this.getPreferences();
    preferences.updatedAt = new Date();
    this.setPreferences(preferences);
  }

  /**
   * Gets default preferences
   */
  private static getDefaultPreferences(): UserPreferences {
    return {
      id: `user_${Date.now()}`,
      version: this.CURRENT_VERSION,
      providerPreferences: {
        defaultProvider: 'ollama',
        openai: {
          apiKey: '',
          model: 'gpt-3.5-turbo',
          baseUrl: 'https://api.openai.com/v1'
        },
        ollama: {
          baseUrl: 'http://localhost:11434',
          model: 'llama3.2'
        }
      },
      stakeholderRegistry: {},
      emailTonePreferences: {
        formal: false,
        casual: false,
        technical: false,
        friendly: true
      },
      responsePersonalization: true,
      securityPreferences: {
        strictClassificationCheck: true,
        auditLogging: true, // Always enabled for compliance
        allowOverride: false
      },
      uiPreferences: {
        taskPaneAutoOpen: true,
        defaultViewMode: 'dashboard',
        showQuickModifiers: true,
        enableKeyboardShortcuts: true,
        autoAnalyzeEmail: false,
        defaultTone: 'professional',
        defaultLength: 'brief'
      },
      userProfile: {
        displayName: '',
        email: '',
        jobTitle: '',
        department: '',
        signaturePreferences: {
          includeNameInSignoff: true,
          includeJobTitle: false,
          includeDepartment: false,
          customSignoffTemplate: '',
          professionalSignoff: 'Best regards,\n{name}',
          personalSignoff: 'Thanks,\n{name}'
        },
        autoDetectFromOffice: true
      },
      cacheSettings: {
        enableCaching: true,
        maxCacheSize: 50 * 1024 * 1024, // 50MB
        defaultTTL: 3600 // 1 hour
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Migrates preferences from older versions
   */
  private static migratePreferences(oldPrefs: UserPreferences): UserPreferences {
    const defaultPrefs = this.getDefaultPreferences();
    
    // Merge old preferences with new defaults
    const migratedPrefs: UserPreferences = {
      ...defaultPrefs,
      ...oldPrefs,
      version: this.CURRENT_VERSION,
      updatedAt: new Date(),
      
      // Ensure required fields exist
      securityPreferences: {
        ...defaultPrefs.securityPreferences,
        ...(oldPrefs.securityPreferences || {})
      },
      uiPreferences: {
        ...defaultPrefs.uiPreferences,
        ...(oldPrefs.uiPreferences || {})
      },
      userProfile: {
        ...defaultPrefs.userProfile,
        ...(oldPrefs.userProfile || {})
      },
      cacheSettings: {
        ...defaultPrefs.cacheSettings,
        ...(oldPrefs.cacheSettings || {})
      }
    };
    
    console.log(`Migrated preferences from version ${oldPrefs.version} to ${this.CURRENT_VERSION}`);
    return migratedPrefs;
  }

  /**
   * Encrypts sensitive preference data
   */
  private static encryptData(data: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(data, this.ENCRYPTION_KEY).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      // Fallback to base64 encoding
      return btoa(data);
    }
  }

  /**
   * Decrypts preference data
   */
  private static decryptData(encryptedData: string): string {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.ENCRYPTION_KEY);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption failed, trying base64:', error);
      try {
        return atob(encryptedData);
      } catch (base64Error) {
        console.error('Base64 decode failed:', base64Error);
        throw new Error('Unable to decrypt preference data');
      }
    }
  }

  /**
   * Notifies components of preference changes
   */
  private static notifyPreferenceChange(preferences: UserPreferences): void {
    // Dispatch custom event for preference changes
    const event = new CustomEvent('preferences-changed', {
      detail: preferences
    });
    window.dispatchEvent(event);
  }

  /**
   * Validates preference data structure
   */
  public static validatePreferences(preferences: any): boolean {
    try {
      // Check required fields
      const required = ['id', 'version', 'providerPreferences'];
      for (const field of required) {
        if (!(field in preferences)) {
          console.error(`Missing required field: ${field}`);
          return false;
        }
      }
      
      // Validate provider preferences
      if (!preferences.providerPreferences.defaultProvider) {
        console.error('Missing default provider');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Preference validation failed:', error);
      return false;
    }
  }

  /**
   * Gets preference statistics for analytics
   */
  public static getPreferenceStats(): any {
    const preferences = this.getPreferences();
    
    return {
      stakeholderCount: Object.keys(preferences.stakeholderRegistry).length,
      activeStakeholders: Object.values(preferences.stakeholderRegistry).filter(s => s.isActive).length,
      defaultProvider: preferences.providerPreferences.defaultProvider,
      cacheEnabled: preferences.cacheSettings.enableCaching,
      securityLevel: preferences.securityPreferences.strictClassificationCheck ? 'strict' : 'normal',
      lastUpdated: preferences.updatedAt
    };
  }

  /**
   * Creates a profile template based on role
   */
  public static createProfileTemplate(role: string): Partial<UserPreferences> {
    const templates: Record<string, Partial<UserPreferences>> = {
      'executive': {
        emailTonePreferences: {
          formal: true,
          casual: false,
          technical: false,
          friendly: false
        },
        uiPreferences: {
          taskPaneAutoOpen: true,
          defaultViewMode: 'simple',
          showQuickModifiers: false,
          enableKeyboardShortcuts: true,
          autoAnalyzeEmail: false,
          defaultTone: 'professional',
          defaultLength: 'brief'
        }
      },
      'manager': {
        emailTonePreferences: {
          formal: false,
          casual: false,
          technical: false,
          friendly: true
        },
        uiPreferences: {
          taskPaneAutoOpen: true,
          defaultViewMode: 'dashboard',
          showQuickModifiers: true,
          enableKeyboardShortcuts: true,
          autoAnalyzeEmail: true,
          defaultTone: 'professional',
          defaultLength: 'brief'
        }
      },
      'developer': {
        emailTonePreferences: {
          formal: false,
          casual: true,
          technical: true,
          friendly: true
        },
        uiPreferences: {
          taskPaneAutoOpen: false,
          defaultViewMode: 'detailed',
          showQuickModifiers: true,
          enableKeyboardShortcuts: true,
          autoAnalyzeEmail: true,
          defaultTone: 'professional',
          defaultLength: 'detailed'
        }
      }
    };
    
    return templates[role.toLowerCase()] || {};
  }

  /**
   * Extracts user profile information from Office.js context
   */
  public static async extractUserProfileFromOffice(): Promise<{
    displayName: string;
    email: string;
    jobTitle: string;
    department: string;
  }> {
    const defaultProfile = {
      displayName: '',
      email: '',
      jobTitle: '',
      department: ''
    };

    try {
      if (!this.isOfficeAvailable()) {
        console.log('Office.js not available, cannot extract user profile');
        return defaultProfile;
      }

      const userProfile = (window as any).Office.context.mailbox.userProfile;
      if (!userProfile) {
        console.log('User profile not available in Office.js context');
        return defaultProfile;
      }

      return {
        displayName: userProfile.displayName || '',
        email: userProfile.emailAddress || '',
        jobTitle: userProfile.jobTitle || '',
        department: userProfile.department || ''
      };
    } catch (error) {
      console.error('Failed to extract user profile from Office.js:', error);
      return defaultProfile;
    }
  }

  /**
   * Updates user profile from Office.js if auto-detect is enabled
   */
  public static async updateUserProfileFromOffice(): Promise<void> {
    try {
      const preferences = this.getPreferences();
      
      if (!preferences.userProfile.autoDetectFromOffice) {
        return;
      }

      const officeProfile = await this.extractUserProfileFromOffice();
      
      // Only update if we got meaningful data from Office.js
      if (officeProfile.displayName || officeProfile.email) {
        preferences.userProfile.displayName = officeProfile.displayName || preferences.userProfile.displayName;
        preferences.userProfile.email = officeProfile.email || preferences.userProfile.email;
        preferences.userProfile.jobTitle = officeProfile.jobTitle || preferences.userProfile.jobTitle;
        preferences.userProfile.department = officeProfile.department || preferences.userProfile.department;
        
        await this.setPreferences(preferences);
        console.log('User profile updated from Office.js');
      }
    } catch (error) {
      console.error('Failed to update user profile from Office.js:', error);
    }
  }

  /**
   * Gets the user's preferred signoff based on tone and current preferences
   */
  public static getUserSignoff(isProfessional: boolean): string {
    const preferences = this.getPreferences();
    const profile = preferences.userProfile;
    
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
  private static formatSignoffTemplate(template: string, profile: any): string {
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
