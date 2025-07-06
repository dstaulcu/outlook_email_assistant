import React from 'react';
import { FluentProvider, teamsLightTheme } from '@fluentui/react-components';
import { TaskPaneContainer } from './components/TaskPaneContainer';
import { UserPreferenceManager } from './services/UserPreferenceManager';
import { AIProviderManager } from './services/AIProviderManager';

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [isOfficeReady, setIsOfficeReady] = React.useState(false);
  const [initError, setInitError] = React.useState<string | null>(null);
  const [debugInfo, setDebugInfo] = React.useState<string[]>([]);
  
  const addDebugInfo = (message: string) => {
    console.log(`[DEBUG] ${message}`);
    setDebugInfo(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };
  
  React.useEffect(() => {
    // Initialize Office.js
    const initializeOffice = async () => {
      try {
        addDebugInfo('Starting Office.js initialization');
        
        // Check if we're running in an Office environment
        if (typeof (window as any).Office !== 'undefined') {
          addDebugInfo('Office.js detected, waiting for ready state');
          return new Promise<void>((resolve) => {
            (window as any).Office.onReady((info: any) => {
              addDebugInfo(`Office.js ready - Host: ${info?.host}, Platform: ${info?.platform}`);
              setIsOfficeReady(true);
              resolve();
            });
          });
        } else {
          addDebugInfo('Office.js not available - running in standalone mode');
          setIsOfficeReady(false);
        }
      } catch (error) {
        const errorMessage = `Failed to initialize Office.js: ${error}`;
        addDebugInfo(errorMessage);
        setInitError(errorMessage);
        setIsOfficeReady(false);
      }
    };
    
    // Initialize services
    const initializeServices = async () => {
      try {
        addDebugInfo('Initializing services');
        
        // Check for first run
        const isFirstRun = UserPreferenceManager.isFirstRun();
        if (isFirstRun) {
          addDebugInfo('First run detected - will show welcome message');
        }
        
        // Initialize user preferences
        const preferences = UserPreferenceManager.getPreferences();
        addDebugInfo(`User preferences loaded - Provider: ${preferences.providerPreferences.defaultProvider}`);
        
        // Initialize AI provider manager
        const aiManager = new AIProviderManager();
        addDebugInfo('AI Provider Manager initialized');
        
        // Try to initialize providers
        try {
          await aiManager.initializeProviders(preferences);
          addDebugInfo('AI providers initialized successfully');
        } catch (error) {
          addDebugInfo(`AI provider initialization warning: ${error}`);
        }
        
        setIsInitialized(true);
        addDebugInfo('Application initialization complete');
      } catch (error) {
        const errorMessage = `Failed to initialize services: ${error}`;
        addDebugInfo(errorMessage);
        setInitError(errorMessage);
        setIsInitialized(false);
      }
    };
    
    // Initialize everything
    Promise.all([initializeOffice(), initializeServices()])
      .then(() => {
        addDebugInfo('All initialization complete');
      })
      .catch(error => {
        const errorMessage = `Initialization failed: ${error}`;
        addDebugInfo(errorMessage);
        setInitError(errorMessage);
      });
  }, []);

  // Error boundary for debugging
  if (initError) {
    return (
      <FluentProvider theme={teamsLightTheme}>
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ color: '#d13438' }}>Initialization Error</h2>
          <p><strong>Error:</strong> {initError}</p>
          
          <details style={{ marginTop: '20px' }}>
            <summary>Debug Information</summary>
            <div style={{ 
              background: '#f5f5f5', 
              padding: '10px', 
              marginTop: '10px',
              fontSize: '12px',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap'
            }}>
              {debugInfo.join('\n')}
            </div>
          </details>
          
          <div style={{ marginTop: '20px' }}>
            <h3>Troubleshooting Steps:</h3>
            <ol>
              <li>Ensure the development server is running: <code>npm run dev</code></li>
              <li>Check SSL certificates: <code>npm run install-certs</code></li>
              <li>Verify the manifest is accessible: <a href="https://localhost:3001/manifest.xml" target="_blank">https://localhost:3001/manifest.xml</a></li>
              <li>Check browser console for additional errors</li>
              <li>See <a href="https://localhost:3001/public/TROUBLESHOOTING.md" target="_blank">TROUBLESHOOTING.md</a> for detailed help</li>
            </ol>
          </div>
          
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              marginTop: '20px', 
              padding: '10px 20px', 
              background: '#0078d4', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px' 
            }}
          >
            Retry
          </button>
        </div>
      </FluentProvider>
    );
  }

  // Loading state
  if (!isInitialized) {
    return (
      <FluentProvider theme={teamsLightTheme}>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Loading Email AI Assistant...</h2>
          <p>Initializing Office.js and services...</p>
          
          <details style={{ marginTop: '20px', textAlign: 'left' }}>
            <summary>Debug Information</summary>
            <div style={{ 
              background: '#f5f5f5', 
              padding: '10px', 
              marginTop: '10px',
              fontSize: '12px',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap'
            }}>
              {debugInfo.join('\n')}
            </div>
          </details>
        </div>
      </FluentProvider>
    );
  }

  return (
    <FluentProvider theme={teamsLightTheme}>
      <TaskPaneContainer isOfficeReady={isOfficeReady} />
    </FluentProvider>
  );
};

export default App;
