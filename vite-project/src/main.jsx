import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/globals.css';
import './styles/shared.css';
import './App.css';
import './mobile-prototype.css';
import './route-prototype.css';
import './logo-size-fix.css';
import './customer-signin-mobile.css';
import './admin-fixed.css';
import './mobile-viewport-fix.css';
import '../public/customer-bottom-nav-transparent.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AppRouter } from './app/AppRouter.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { PrototypeProvider } from './context/PrototypeContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <BrowserRouter>
        <AuthProvider>
          <PrototypeProvider>
            <AppRouter />
          </PrototypeProvider>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>
);
