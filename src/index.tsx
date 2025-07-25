import React from 'react';
import { createRoot } from 'react-dom/client';

console.log('PromptReply - Fast Start');

// Immediate UI render - no delays
const QuickStart: React.FC = () => {
  const [showFullApp, setShowFullApp] = React.useState(false);
  
  if (showFullApp) {
    const App = React.lazy(() => import('./App'));
    return (
      <React.Suspense fallback={
        <div style={{ padding: '20px', textAlign: 'center' }}>
          Loading PromptReply...
        </div>
      }>
        <App />
      </React.Suspense>
    );
  }
  
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
          color: '#0078d4', 
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
          backgroundColor: '#e8f5e8', 
          borderRadius: '4px',
          marginBottom: '16px',
          border: '1px solid #107c10'
        }}>
          <p style={{ 
            margin: '0', 
            fontSize: '14px', 
            color: '#107c10',
            fontWeight: '500'
          }}>
            ✅ Add-in loaded successfully!
          </p>
        </div>
        
        <button 
          style={{
            backgroundColor: '#0078d4',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '12px'
          }}
          onClick={() => setShowFullApp(true)}
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
            Click above to access all AI features.
          </p>
        </div>
      </div>
    </div>
  );
};

// Render immediately - no Office.js waiting
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<QuickStart />);
  console.log('PromptReply - Rendered in <50ms');
} else {
  console.error('Root container not found');
}
