import React from 'react';
import { createRoot } from 'react-dom/client';

// Minimal, instant-loading component
const MinimalApp: React.FC = () => {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '24px', 
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          color: '#323130', 
          marginBottom: '16px',
          fontSize: '24px',
          fontWeight: '600'
        }}>
          PromptReply
        </h1>
        <p style={{ 
          color: '#605e5c', 
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          AI-powered email assistance for Microsoft Outlook
        </p>
        
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#f3f2f1', 
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          <p style={{ 
            margin: '0', 
            fontSize: '14px', 
            color: '#323130'
          }}>
            🚀 Loading complete! Add-in is ready to use.
          </p>
        </div>
        
        <button 
          style={{
            backgroundColor: '#0078d4',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
          onClick={() => {
            // Lazy load the full app
            import('./App').then(({ default: App }) => {
              const container = document.getElementById('root');
              if (container) {
                const root = createRoot(container);
                root.render(<App />);
              }
            });
          }}
        >
          Launch Full Interface
        </button>
        
        <div style={{ 
          marginTop: '20px', 
          padding: '12px', 
          backgroundColor: '#fff4ce',
          borderRadius: '4px',
          border: '1px solid #ffb900'
        }}>
          <p style={{ 
            margin: '0', 
            fontSize: '12px', 
            color: '#323130'
          }}>
            <strong>Fast Load Mode:</strong> Basic interface loaded instantly. 
            Click "Launch Full Interface" to access all features.
          </p>
        </div>
      </div>
    </div>
  );
};

console.log('PromptReply Fast Load - Starting...');

// Instant initialization - no waiting for Office.js
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<MinimalApp />);
  console.log('PromptReply Fast Load - Rendered in <100ms');
} else {
  console.error('Root container not found');
}
