import React from 'react';

// Lightweight loading component
const LoadingApp: React.FC = () => {
  const [loadingStage, setLoadingStage] = React.useState('Starting...');
  const [isReady, setIsReady] = React.useState(false);
  
  React.useEffect(() => {
    // Simulate progressive loading stages
    const stages = [
      'Initializing Office.js...',
      'Loading UI components...',
      'Setting up services...',
      'Ready!'
    ];
    
    let currentStage = 0;
    const updateStage = () => {
      if (currentStage < stages.length) {
        setLoadingStage(stages[currentStage]);
        currentStage++;
        
        if (currentStage < stages.length) {
          setTimeout(updateStage, 300); // Fast progression
        } else {
          setIsReady(true);
        }
      }
    };
    
    updateStage();
  }, []);
  
  if (!isReady) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '32px', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          maxWidth: '400px'
        }}>
          <h1 style={{ 
            color: '#0078d4', 
            marginBottom: '24px',
            fontSize: '28px',
            fontWeight: '600'
          }}>
            PromptReply
          </h1>
          
          <div style={{ 
            marginBottom: '20px'
          }}>
            <div style={{
              width: '100%',
              height: '4px',
              backgroundColor: '#e1dfdd',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#0078d4',
                animation: 'progress 1.5s ease-in-out infinite'
              }} />
            </div>
          </div>
          
          <p style={{ 
            color: '#605e5c', 
            fontSize: '14px',
            margin: '0'
          }}>
            {loadingStage}
          </p>
          
          <style>
            {`
              @keyframes progress {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
              }
            `}
          </style>
        </div>
      </div>
    );
  }
  
  // Lazy load the full app only when ready
  const [FullApp, setFullApp] = React.useState<React.ComponentType | null>(null);
  
  React.useEffect(() => {
    if (isReady && !FullApp) {
      import('./App').then(({ default: App }) => {
        setFullApp(() => App);
      });
    }
  }, [isReady, FullApp]);
  
  if (FullApp) {
    return <FullApp />;
  }
  
  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center',
      fontFamily: 'Segoe UI, system-ui, sans-serif' 
    }}>
      Loading full interface...
    </div>
  );
};

export default LoadingApp;
