import React, { useState, useEffect } from 'react';
import { Button } from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import { UserPreferenceManager } from '@/services/UserPreferenceManager';
import { AIProviderManager } from '@/services/AIProviderManager';
import { accessibilityTester } from '@/utils/accessibilityTester';
import { UserPreferences } from '../types/index';
import './SettingsPanel.css';

interface SettingsPanelProps {
    onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
    const [preferences, setPreferences] = useState<UserPreferences | null>(null);
    const [saving, setSaving] = useState(false);
    const [testingOpenAI, setTestingOpenAI] = useState(false);
    const [testingOllama, setTestingOllama] = useState(false);
    const [testResults, setTestResults] = useState<{[key: string]: boolean | null}>({});
    const [ollamaModels, setOllamaModels] = useState<string[]>([]);
    const [openaiModels, setOpenaiModels] = useState<string[]>([]);
    const [discoveringModels, setDiscoveringModels] = useState(false);
    const [discoveringOpenaiModels, setDiscoveringOpenaiModels] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);
    const [saveMessage, setSaveMessage] = useState<string>('');
    const [testingAccessibility, setTestingAccessibility] = useState(false);

    const providerManager = new AIProviderManager();

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            // Load from Office.js roaming settings (or localStorage fallback)
            const prefs = UserPreferenceManager.getPreferences();
            setPreferences(prefs);
        } catch (error) {
            console.error('Error loading preferences:', error);
            // Final fallback
            const defaultPrefs = UserPreferenceManager.getPreferences();
            setPreferences(defaultPrefs);
        }
    };

    const handleSavePreferences = async () => {
        if (!preferences) return;

        try {
            setSaving(true);
            setSaveSuccess(null);
            setSaveMessage('');
            
            // Save to Office.js roaming settings (or localStorage fallback)
            await UserPreferenceManager.setPreferences(preferences);
            
            setSaveSuccess(true);
            setSaveMessage('Settings saved successfully! They will roam with your Office profile.');
            
            // Clear success message after 3 seconds
            setTimeout(() => {
                setSaveSuccess(null);
                setSaveMessage('');
            }, 3000);
            
        } catch (error) {
            console.error('Error saving preferences:', error);
            setSaveSuccess(false);
            setSaveMessage('Error saving settings. Please try again.');
            
            // Clear error message after 5 seconds
            setTimeout(() => {
                setSaveSuccess(null);
                setSaveMessage('');
            }, 5000);
        } finally {
            setSaving(false);
        }
    };

    const handleTestProvider = async (providerId: 'openai' | 'ollama') => {
        if (!preferences) return;

        const setTesting = providerId === 'openai' ? setTestingOpenAI : setTestingOllama;
        setTesting(true);
        
        try {
            await providerManager.initializeProviders(preferences);
            const provider = providerManager.getProvider(providerId);
            
            if (provider) {
                const result = await provider.testConnectivity();
                setTestResults(prev => ({ ...prev, [providerId]: result.success }));
                
                // If testing is successful, also discover models
                if (result.success) {
                    if (providerId === 'ollama') {
                        await discoverOllamaModels();
                    } else if (providerId === 'openai') {
                        await discoverOpenaiModels();
                    }
                }
            } else {
                setTestResults(prev => ({ ...prev, [providerId]: false }));
            }
        } catch (error) {
            console.error('Error testing provider:', error);
            setTestResults(prev => ({ ...prev, [providerId]: false }));
        } finally {
            setTesting(false);
        }
    };

    const discoverOllamaModels = async () => {
        if (!preferences) return;
        
        setDiscoveringModels(true);
        try {
            const baseUrl = preferences.providerPreferences.ollama.baseUrl || 'http://localhost:11434';
            const response = await fetch(`${baseUrl}/api/tags`);
            
            if (response.ok) {
                const data = await response.json();
                const models = data.models?.map((model: any) => model.name) || [];
                setOllamaModels(models);
                console.log('Discovered Ollama models:', models);
            } else {
                console.warn('Failed to discover Ollama models');
                setOllamaModels([]);
            }
        } catch (error) {
            console.error('Error discovering Ollama models:', error);
            setOllamaModels([]);
        } finally {
            setDiscoveringModels(false);
        }
    };

    const discoverOpenaiModels = async () => {
        if (!preferences || !preferences.providerPreferences.openai.apiKey) {
            alert('Please enter your OpenAI API key first');
            return;
        }
        
        setDiscoveringOpenaiModels(true);
        try {
            const baseUrl = preferences.providerPreferences.openai.baseUrl || 'https://api.openai.com/v1';
            const response = await fetch(`${baseUrl}/models`, {
                headers: {
                    'Authorization': `Bearer ${preferences.providerPreferences.openai.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const models = data.data
                    ?.filter((model: any) => model.id.includes('gpt') || model.id.includes('text-'))
                    ?.map((model: any) => model.id)
                    ?.sort() || [];
                setOpenaiModels(models);
                console.log('Discovered OpenAI models:', models);
            } else {
                console.warn('Failed to discover OpenAI models');
                setOpenaiModels([]);
            }
        } catch (error) {
            console.error('Error discovering OpenAI models:', error);
            setOpenaiModels([]);
        } finally {
            setDiscoveringOpenaiModels(false);
        }
    };

    const handleProviderConfigChange = (providerId: 'openai' | 'ollama', key: string, value: string) => {
        if (!preferences) return;

        setPreferences({
            ...preferences,
            providerPreferences: {
                ...preferences.providerPreferences,
                [providerId]: {
                    ...preferences.providerPreferences[providerId],
                    [key]: value
                }
            }
        });
    };

    const handleTestAccessibility = async () => {
        setTestingAccessibility(true);
        try {
            const results = await accessibilityTester.runAccessibilityAudit();
            console.log('Accessibility audit completed:', results);
            alert(`Accessibility Audit Complete!\n\nPassed: ${results.summary.passed}/${results.summary.totalTests} tests\nCheck console for detailed results.`);
        } catch (error) {
            console.error('Accessibility audit failed:', error);
            alert('Accessibility audit failed. Check console for details.');
        } finally {
            setTestingAccessibility(false);
        }
    };

    if (!preferences) {
        return <div className="settings-panel" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            fontSize: '16px',
            color: '#605e5c'
        }}>Loading...</div>;
    }

    const fieldStyle = {
        marginBottom: '16px'
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '6px',
        fontSize: '14px',
        fontWeight: '600',
        color: '#323130'
    };

    const inputStyle = {
        width: '100%',
        padding: '8px 12px',
        fontSize: '14px',
        border: '1px solid #d1d1d1',
        borderRadius: '2px',
        boxSizing: 'border-box' as const
    };

    const textareaStyle = {
        ...inputStyle,
        resize: 'vertical' as const,
        fontFamily: 'inherit'
    };

    const selectStyle = {
        ...inputStyle,
        backgroundColor: '#ffffff'
    };

    const buttonStyle = {
        padding: '8px 16px',
        fontSize: '14px',
        fontWeight: '600',
        border: '1px solid #0078d4',
        borderRadius: '2px',
        backgroundColor: '#0078d4',
        color: '#ffffff',
        cursor: 'pointer'
    };

    return (
        <div className="settings-panel" style={{
            width: '100%',
            height: '100vh',
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box'
        }}>
            <div className="settings-header" style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e1e1e1',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f8f9fa',
                flexShrink: 0
            }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#323130' }}>Email AI Assistant Settings</h2>
                <Button
                    appearance="subtle"
                    icon={<Dismiss24Regular />}
                    onClick={onClose}
                    aria-label="Close settings panel"
                    size="small"
                />
            </div>
            
            <div className="settings-content" style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px'
            }}>
                <div className="settings-section" style={{
                    marginBottom: '28px',
                    padding: '16px',
                    border: '1px solid #e1e1e1',
                    borderRadius: '4px',
                    backgroundColor: '#fafafa'
                }}>
                    <h3 style={{ 
                        margin: '0 0 16px 0', 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: '#323130' 
                    }}>AI Providers</h3>
                    
                    {/* OpenAI Provider */}
                    <div className="provider-card">
                        <div className="provider-header">
                            <h4>OpenAI</h4>
                            <div className="provider-actions">
                                <button
                                    className="test-button"
                                    onClick={() => handleTestProvider('openai')}
                                    disabled={testingOpenAI}
                                >
                                    {testingOpenAI ? 'Testing...' : 'Test Connection'}
                                </button>
                                <button
                                    className="discover-button"
                                    onClick={discoverOpenaiModels}
                                    disabled={discoveringOpenaiModels}
                                    style={{ marginLeft: '8px' }}
                                >
                                    {discoveringOpenaiModels ? 'Discovering...' : 'Discover Models'}
                                </button>
                            </div>
                        </div>
                        
                        {testResults['openai'] !== undefined && (
                            <div className={`health-status ${testResults['openai'] ? 'healthy' : 'unhealthy'}`}>
                                {testResults['openai'] ? '✓ Provider is healthy' : '✗ Provider is not responding'}
                            </div>
                        )}
                        
                        <div className="provider-config">
                            <div className="config-field">
                                <label>API Key:</label>
                                <input
                                    type="password"
                                    value={preferences.providerPreferences.openai.apiKey || ''}
                                    onChange={(e) => handleProviderConfigChange('openai', 'apiKey', e.target.value)}
                                    placeholder="Enter OpenAI API key"
                                />
                            </div>
                            <div className="config-field">
                                <label>Model:</label>
                                <select
                                    value={preferences.providerPreferences.openai.model || 'gpt-3.5-turbo'}
                                    onChange={(e) => handleProviderConfigChange('openai', 'model', e.target.value)}
                                >
                                    {/* Show discovered models first */}
                                    {openaiModels.length > 0 ? (
                                        <>
                                            <optgroup label="Discovered Models">
                                                {openaiModels.map(model => (
                                                    <option key={model} value={model}>{model}</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="Common Models">
                                                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                                <option value="gpt-4">GPT-4</option>
                                                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                                <option value="gpt-4o">GPT-4o</option>
                                            </optgroup>
                                        </>
                                    ) : (
                                        <>
                                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                            <option value="gpt-4">GPT-4</option>
                                            <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                            <option value="gpt-4o">GPT-4o</option>
                                        </>
                                    )}
                                </select>
                                {openaiModels.length === 0 && (
                                    <small style={{ color: '#888', marginTop: '4px', display: 'block' }}>
                                        Click "Discover Models" to see available OpenAI models
                                    </small>
                                )}
                            </div>
                            <div className="config-field">
                                <label>Base URL (optional):</label>
                                <input
                                    type="url"
                                    value={preferences.providerPreferences.openai.baseUrl || ''}
                                    onChange={(e) => handleProviderConfigChange('openai', 'baseUrl', e.target.value)}
                                    placeholder="https://api.openai.com/v1"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Ollama Provider */}
                    <div className="provider-card">
                        <div className="provider-header">
                            <h4>Ollama (Local)</h4>
                            <div className="provider-actions">
                                <button
                                    className="test-button"
                                    onClick={() => handleTestProvider('ollama')}
                                    disabled={testingOllama}
                                >
                                    {testingOllama ? 'Testing...' : 'Test Connection'}
                                </button>
                                <button
                                    className="discover-button"
                                    onClick={discoverOllamaModels}
                                    disabled={discoveringModels}
                                    style={{ marginLeft: '8px' }}
                                >
                                    {discoveringModels ? 'Discovering...' : 'Discover Models'}
                                </button>
                            </div>
                        </div>
                        
                        {testResults['ollama'] !== undefined && (
                            <div className={`health-status ${testResults['ollama'] ? 'healthy' : 'unhealthy'}`}>
                                {testResults['ollama'] ? '✓ Provider is healthy' : '✗ Provider is not responding'}
                            </div>
                        )}
                        
                        <div className="provider-config">
                            <div className="config-field">
                                <label>Base URL:</label>
                                <input
                                    type="url"
                                    value={preferences.providerPreferences.ollama.baseUrl || 'http://localhost:11434'}
                                    onChange={(e) => handleProviderConfigChange('ollama', 'baseUrl', e.target.value)}
                                    placeholder="http://localhost:11434"
                                />
                            </div>
                            <div className="config-field">
                                <label>Model:</label>
                                <select
                                    value={preferences.providerPreferences.ollama.model || 'llama3.2'}
                                    onChange={(e) => handleProviderConfigChange('ollama', 'model', e.target.value)}
                                >
                                    {/* Show discovered models first */}
                                    {ollamaModels.length > 0 ? (
                                        <>
                                            <optgroup label="Discovered Models">
                                                {ollamaModels.map(model => (
                                                    <option key={model} value={model}>{model}</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="Common Models">
                                                <option value="llama3.2">Llama 3.2</option>
                                                <option value="llama3.1">Llama 3.1</option>
                                                <option value="mistral">Mistral</option>
                                                <option value="codellama">Code Llama</option>
                                                <option value="phi3">Phi 3</option>
                                            </optgroup>
                                        </>
                                    ) : (
                                        <>
                                            <option value="llama3.2">Llama 3.2</option>
                                            <option value="llama3.1">Llama 3.1</option>
                                            <option value="mistral">Mistral</option>
                                            <option value="codellama">Code Llama</option>
                                            <option value="phi3">Phi 3</option>
                                        </>
                                    )}
                                </select>
                                {ollamaModels.length === 0 && (
                                    <small style={{ color: '#888', marginTop: '4px', display: 'block' }}>
                                        Click "Discover Models" to see available Ollama models
                                    </small>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="settings-section">
                    <h3>Default Provider</h3>
                    <select
                        value={preferences.providerPreferences.defaultProvider || 'ollama'}
                        onChange={(e) => setPreferences({
                            ...preferences,
                            providerPreferences: {
                                ...preferences.providerPreferences,
                                defaultProvider: e.target.value as 'openai' | 'ollama'
                            }
                        })}
                    >
                        <option value="ollama">Ollama (Local)</option>
                        <option value="openai">OpenAI</option>
                    </select>
                </div>

                <div className="settings-section">
                    <h3>Security Preferences</h3>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={preferences.securityPreferences.strictClassificationCheck}
                            onChange={(e) => setPreferences({
                                ...preferences,
                                securityPreferences: {
                                    ...preferences.securityPreferences,
                                    strictClassificationCheck: e.target.checked
                                }
                            })}
                        />
                        Enable strict classification detection
                    </label>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={preferences.securityPreferences.auditLogging}
                            onChange={(e) => setPreferences({
                                ...preferences,
                                securityPreferences: {
                                    ...preferences.securityPreferences,
                                    auditLogging: e.target.checked
                                }
                            })}
                        />
                        Enable audit logging
                    </label>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={preferences.securityPreferences.allowOverride}
                            onChange={(e) => setPreferences({
                                ...preferences,
                                securityPreferences: {
                                    ...preferences.securityPreferences,
                                    allowOverride: e.target.checked
                                }
                            })}
                        />
                        Allow security override (admin only)
                    </label>
                </div>

                <div className="settings-section">
                    <h3>UI Preferences</h3>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={preferences.uiPreferences.taskPaneAutoOpen}
                            onChange={(e) => setPreferences({
                                ...preferences,
                                uiPreferences: {
                                    ...preferences.uiPreferences,
                                    taskPaneAutoOpen: e.target.checked
                                }
                            })}
                        />
                        Auto-open task pane on email selection
                    </label>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={preferences.uiPreferences.showQuickModifiers}
                            onChange={(e) => setPreferences({
                                ...preferences,
                                uiPreferences: {
                                    ...preferences.uiPreferences,
                                    showQuickModifiers: e.target.checked
                                }
                            })}
                        />
                        Show quick modifier buttons
                    </label>
                    <div className="config-field">
                        <label>Default View Mode:</label>
                        <select
                            value={preferences.uiPreferences.defaultViewMode || 'dashboard'}
                            onChange={(e) => setPreferences({
                                ...preferences,
                                uiPreferences: {
                                    ...preferences.uiPreferences,
                                    defaultViewMode: e.target.value as 'dashboard' | 'simple' | 'detailed'
                                }
                            })}
                        >
                            <option value="dashboard">Dashboard</option>
                            <option value="simple">Simple</option>
                            <option value="detailed">Detailed</option>
                        </select>
                    </div>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={preferences.uiPreferences.autoAnalyzeEmail}
                            onChange={(e) => setPreferences({
                                ...preferences,
                                uiPreferences: {
                                    ...preferences.uiPreferences,
                                    autoAnalyzeEmail: e.target.checked
                                }
                            })}
                        />
                        Auto-analyze email if security status is "Safe for AI processing"
                    </label>
                    <div className="config-field">
                        <label>Default Tone:</label>
                        <select
                            value={preferences.uiPreferences.defaultTone || 'professional'}
                            onChange={(e) => setPreferences({
                                ...preferences,
                                uiPreferences: {
                                    ...preferences.uiPreferences,
                                    defaultTone: e.target.value as 'professional' | 'personal'
                                }
                            })}
                        >
                            <option value="professional">💼 Professional</option>
                            <option value="personal">👤 Personal/Private</option>
                        </select>
                    </div>
                    <div className="config-field">
                        <label>Default Response Length:</label>
                        <select
                            value={preferences.uiPreferences.defaultLength || 'brief'}
                            onChange={(e) => setPreferences({
                                ...preferences,
                                uiPreferences: {
                                    ...preferences.uiPreferences,
                                    defaultLength: e.target.value as 'brief' | 'detailed'
                                }
                            })}
                        >
                            <option value="brief">📝 Brief Response</option>
                            <option value="detailed">📄 Detailed Response</option>
                        </select>
                    </div>
                </div>

                <div className="settings-section">
                    <h3>User Profile & Signoffs</h3>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={preferences.userProfile.autoDetectFromOffice}
                            onChange={(e) => setPreferences({
                                ...preferences,
                                userProfile: {
                                    ...preferences.userProfile,
                                    autoDetectFromOffice: e.target.checked
                                }
                            })}
                        />
                        Auto-detect profile from Office.js
                    </label>
                    <div className="config-field">
                        <label>Display Name:</label>
                        <input
                            type="text"
                            value={preferences.userProfile.displayName}
                            onChange={(e) => setPreferences({
                                ...preferences,
                                userProfile: {
                                    ...preferences.userProfile,
                                    displayName: e.target.value
                                }
                            })}
                            placeholder="Your full name"
                        />
                    </div>
                    <div className="config-field">
                        <label>Email:</label>
                        <input
                            type="email"
                            value={preferences.userProfile.email}
                            onChange={(e) => setPreferences({
                                ...preferences,
                                userProfile: {
                                    ...preferences.userProfile,
                                    email: e.target.value
                                }
                            })}
                            placeholder="your.email@domain.com"
                        />
                    </div>
                    <div className="config-field">
                        <label>Job Title:</label>
                        <input
                            type="text"
                            value={preferences.userProfile.jobTitle}
                            onChange={(e) => setPreferences({
                                ...preferences,
                                userProfile: {
                                    ...preferences.userProfile,
                                    jobTitle: e.target.value
                                }
                            })}
                            placeholder="Your job title"
                        />
                    </div>
                    <div className="config-field">
                        <label>Department:</label>
                        <input
                            type="text"
                            value={preferences.userProfile.department}
                            onChange={(e) => setPreferences({
                                ...preferences,
                                userProfile: {
                                    ...preferences.userProfile,
                                    department: e.target.value
                                }
                            })}
                            placeholder="Your department"
                        />
                    </div>
                    <div className="config-field">
                        <label>Professional Signoff Template:</label>
                        <textarea
                            value={preferences.userProfile.signaturePreferences.professionalSignoff}
                            onChange={(e) => setPreferences({
                                ...preferences,
                                userProfile: {
                                    ...preferences.userProfile,
                                    signaturePreferences: {
                                        ...preferences.userProfile.signaturePreferences,
                                        professionalSignoff: e.target.value
                                    }
                                }
                            })}
                            placeholder="Best regards,&#10;{name}"
                            rows={3}
                        />
                        <small style={{color: '#666', fontSize: '12px'}}>
                            Use {'{name}'}, {'{firstName}'}, {'{jobTitle}'}, {'{department}'} as placeholders
                        </small>
                    </div>
                    <div className="config-field">
                        <label>Personal Signoff Template:</label>
                        <textarea
                            value={preferences.userProfile.signaturePreferences.personalSignoff}
                            onChange={(e) => setPreferences({
                                ...preferences,
                                userProfile: {
                                    ...preferences.userProfile,
                                    signaturePreferences: {
                                        ...preferences.userProfile.signaturePreferences,
                                        personalSignoff: e.target.value
                                    }
                                }
                            })}
                            placeholder="Thanks,&#10;{name}"
                            rows={3}
                        />
                        <small style={{color: '#666', fontSize: '12px'}}>
                            Use {'{name}'}, {'{firstName}'}, {'{jobTitle}'}, {'{department}'} as placeholders
                        </small>
                    </div>
                    <div className="config-field">
                        <label>Custom Signoff Template (overrides above):</label>
                        <textarea
                            value={preferences.userProfile.signaturePreferences.customSignoffTemplate}
                            onChange={(e) => setPreferences({
                                ...preferences,
                                userProfile: {
                                    ...preferences.userProfile,
                                    signaturePreferences: {
                                        ...preferences.userProfile.signaturePreferences,
                                        customSignoffTemplate: e.target.value
                                    }
                                }
                            })}
                            placeholder="Leave blank to use tone-specific templates above"
                            rows={3}
                        />
                    </div>
                    <div style={{marginTop: '10px'}}>
                        <button
                            type="button"
                            onClick={async () => {
                                try {
                                    await UserPreferenceManager.updateUserProfileFromOffice();
                                    // Reload preferences to show the updated profile
                                    await loadPreferences();
                                    alert('Profile updated from Office.js successfully!');
                                } catch (error) {
                                    console.error('Error updating profile:', error);
                                    alert('Failed to update profile from Office.js');
                                }
                            }}
                            style={{
                                padding: '8px 16px',
                                border: '1px solid #0078d4',
                                backgroundColor: '#0078d4',
                                color: 'white',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            🔄 Update Profile from Office
                        </button>
                    </div>
                </div>
            </div>

            <div className="settings-footer" style={{
                padding: '16px 20px',
                borderTop: '1px solid #e1e1e1',
                backgroundColor: '#f8f9fa'
            }}>
                <button 
                    className="save-button" 
                    onClick={handleSavePreferences}
                    disabled={saving}
                    style={{
                        ...buttonStyle,
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '16px',
                        backgroundColor: saving ? '#ccc' : '#0078d4',
                        cursor: saving ? 'not-allowed' : 'pointer'
                    }}
                >
                    {saving ? 'Saving to Office Profile...' : 'Save Settings'}
                </button>
                {saveMessage && (
                    <div className="save-feedback" style={{
                        marginTop: '12px',
                        fontSize: '14px',
                        color: saveSuccess !== null ? (saveSuccess ? '#28a745' : '#dc3545') : '#333',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        {saveSuccess !== null && (
                            <span className="icon" style={{
                                marginRight: '4px',
                                fontSize: '18px',
                                lineHeight: 1
                            }}>
                                {saveSuccess ? '✓' : '✗'}
                            </span>
                        )}
                        {saveMessage}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsPanel;
