import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Initialize Office.js
declare const Office: any;

if (typeof Office !== 'undefined' && Office.onReady) {
  Office.onReady((info: any) => {
    if (info.host === Office.HostType.Outlook) {
      console.log('Outlook Email AI Assistant initialized');
      
      // Create React root and render the app
      const container = document.getElementById('root');
      if (container) {
        const root = createRoot(container);
        root.render(<App />);
      }
    }
  });
} else {
  // For development without Office.js
  console.log('Running in development mode without Office.js');
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(<App />);
  }
}
