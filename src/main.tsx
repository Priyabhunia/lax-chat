import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../frontend/app';
import './index.css';

// Render without StrictMode to prevent double rendering in development
ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
); 