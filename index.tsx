import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider } from './components/ThemeContext';

// Monkey patch console.error to ignore Firebase resource-exhausted errors to avoid spamming AI Studio metrics
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args && args.length > 0) {
    const msg = typeof args[0] === 'string' ? args[0] : (args[0] instanceof Error ? args[0].message : String(args[0]));
    if (msg.includes('resource-exhausted') || msg.includes('Using maximum backoff delay') || msg.includes('Quota limit exceeded')) {
      return; // Ignore
    }
  }
  originalConsoleError(...args);
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
