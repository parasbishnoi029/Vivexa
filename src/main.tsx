import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent unhandled rejections from WebSocket close/fail in sandboxed environments
const isWebSocketError = (err: any): boolean => {
  if (!err) return false;
  try {
    const str = typeof err === 'string' ? err : (err.message || err.description || String(err));
    const lower = str.toLowerCase();
    return (
      lower.includes('websocket') ||
      lower.includes('failed to connect') ||
      lower.includes('closed without opened') ||
      lower.includes('ws://') ||
      lower.includes('wss://')
    );
  } catch (e) {
    return false;
  }
};

window.addEventListener('unhandledrejection', (event) => {
  if (isWebSocketError(event.reason)) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }
}, true);

window.addEventListener('error', (event) => {
  if (isWebSocketError(event.error) || isWebSocketError(event.message)) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }
}, true);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
