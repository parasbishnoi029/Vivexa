import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent unhandled rejections from WebSocket close/fail in sandboxed environments
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason && 
    (event.reason.message?.includes('WebSocket') || 
     event.reason.message?.includes('websocket') ||
     event.reason.message?.includes('failed to connect') ||
     event.reason.toString().includes('WebSocket') ||
     event.reason.toString().includes('websocket'))
  ) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
