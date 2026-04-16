import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import PrivacyPolicy from './components/PrivacyPolicy.tsx';
import { LanguageProvider } from './i18n/LanguageContext';
import './index.css';
import 'material-symbols/outlined.css';

const isPrivacy = window.location.pathname === '/privacy';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      {isPrivacy ? (
        <PrivacyPolicy onBack={() => { window.location.href = '/'; }} />
      ) : (
        <App />
      )}
    </LanguageProvider>
  </StrictMode>,
);
