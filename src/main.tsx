import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import { AppRouter } from './app/router/AppRouter';
import { LanguageProvider } from './shared/i18n/LanguageProvider';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <AppRouter />
      <Toaster position="top-right" />
    </LanguageProvider>
  </React.StrictMode>
);
