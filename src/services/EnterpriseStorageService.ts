import { UserPreferences } from '@/types';
import * as CryptoJS from 'crypto-js';

export class EnterpriseStorageService {
  private static readonly STORAGE_KEY = 'outlook_ai_assistant_roaming_preferences';
  private static readonly ENCRYPTION_KEY = 'outlook_ai_assistant_roaming_key';
  private static readonly APPDATA_PATH = '%APPDATA%\\OutlookEmailAssistant';

  /**
   * Encrypts data for storage
   */
  private static encryptData(data: string): string {
    return CryptoJS.AES.encrypt(data, this.ENCRYPTION_KEY).toString();
  }

  /**
   * Decrypts data from storage
   */
  private static decryptData(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Exports preferences in %APPDATA% roaming format
   */
  public static exportPreferences(preferences: UserPreferences): string {
    try {
      const exportData = {
        version: 'roaming-v1',
        exportDate: new Date().toISOString(),
        roamingProfile: {
          enabled: true,
          storagePath: this.APPDATA_PATH,
          syncEnabled: true,
          backupEnabled: true
        },
        userInfo: {
          id: preferences.id,
          exportedBy: 'outlook_email_assistant',
          computerName: navigator.userAgent,
          domain: navigator.userAgent.includes('Windows') ? 'domain' : 'workgroup'
        },
        preferences: {
          ...preferences,
          // Sanitize sensitive data for roaming export
          providerPreferences: {
            ...preferences.providerPreferences,
            openai: {
              ...preferences.providerPreferences.openai,
              apiKey: '[REDACTED_FOR_ROAMING]'
            }
          }
        },
        metadata: {
          roamingCompatible: true,
          enterpriseReady: true,
          auditRequired: true,
          storageType: 'appdata_roaming'
        }
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting preferences:', error);
      throw new Error('Failed to export preferences for roaming storage');
    }
  }

  /**
   * Imports preferences from %APPDATA% roaming format
   */
  public static importPreferences(importData: string, currentPreferences: UserPreferences): UserPreferences {
    try {
      const data = JSON.parse(importData);
      
      // Validate roaming format
      if (!data.version || !data.version.startsWith('roaming-')) {
        throw new Error('Invalid roaming storage format - expected roaming-v1');
      }
      
      if (!data.preferences) {
        throw new Error('No preferences found in roaming data');
      }
      
      // Validate roaming profile settings
      if (!data.roamingProfile || !data.roamingProfile.enabled) {
        console.warn('Roaming profile not enabled in imported data');
      }
      
      const importedPrefs = data.preferences as UserPreferences;
      
      // Merge with current preferences, preserving sensitive data for roaming
      const mergedPrefs: UserPreferences = {
        ...importedPrefs,
        id: currentPreferences.id, // Keep current ID
        version: 2, // Current version
        updatedAt: new Date(),
        // Preserve API keys from current preferences (not roamed for security)
        providerPreferences: {
          ...importedPrefs.providerPreferences,
          openai: {
            ...importedPrefs.providerPreferences.openai,
            apiKey: currentPreferences.providerPreferences.openai.apiKey
          }
        }
      };
      
      console.log('Preferences imported from %APPDATA% roaming storage');
      return mergedPrefs;
    } catch (error) {
      console.error('Error importing preferences:', error);
      throw new Error('Failed to import preferences');
    }
  }

  /**
   * Saves preferences to localStorage with enterprise metadata
   */
  public static saveToEnterpriseStorage(preferences: UserPreferences): void {
    try {
      const enterpriseData = {
        version: 'enterprise-v1',
        lastUpdated: new Date().toISOString(),
        userInfo: {
          id: preferences.id,
          computerName: navigator.userAgent,
          roamingProfile: true
        },
        preferences: preferences
      };
      
      const jsonData = JSON.stringify(enterpriseData);
      const encryptedData = this.encryptData(jsonData);
      
      localStorage.setItem(this.STORAGE_KEY, encryptedData);
      console.log('Preferences saved to enterprise storage');
    } catch (error) {
      console.error('Error saving to enterprise storage:', error);
      throw new Error('Failed to save to enterprise storage');
    }
  }

  /**
   * Loads preferences from enterprise storage
   */
  public static loadFromEnterpriseStorage(): UserPreferences | null {
    try {
      const encryptedData = localStorage.getItem(this.STORAGE_KEY);
      if (!encryptedData) {
        return null;
      }
      
      const decryptedData = this.decryptData(encryptedData);
      const enterpriseData = JSON.parse(decryptedData);
      
      // Validate the data structure
      if (!enterpriseData.preferences || !enterpriseData.version) {
        throw new Error('Invalid enterprise storage format');
      }
      
      console.log('Preferences loaded from enterprise storage');
      return enterpriseData.preferences as UserPreferences;
    } catch (error) {
      console.error('Error loading from enterprise storage:', error);
      return null;
    }
  }

  /**
   * Gets storage information for diagnostic purposes
   */
  public static getStorageInfo(): {
    hasEnterpriseStorage: boolean;
    lastUpdated?: string;
    userInfo?: any;
  } {
    try {
      const encryptedData = localStorage.getItem(this.STORAGE_KEY);
      if (!encryptedData) {
        return { hasEnterpriseStorage: false };
      }
      
      const decryptedData = this.decryptData(encryptedData);
      const enterpriseData = JSON.parse(decryptedData);
      
      return {
        hasEnterpriseStorage: true,
        lastUpdated: enterpriseData.lastUpdated,
        userInfo: enterpriseData.userInfo
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { hasEnterpriseStorage: false };
    }
  }

  /**
   * Migrates from regular storage to enterprise storage
   */
  public static migrateToEnterpriseStorage(preferences: UserPreferences): void {
    this.saveToEnterpriseStorage(preferences);
    console.log('Migrated preferences to enterprise storage');
  }
}
