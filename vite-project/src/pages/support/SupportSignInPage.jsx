import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, LifeBuoy } from 'lucide-react';
import { MobileStatusBar } from '../../layouts/CustomerLayout';
import { authStorage } from '../../services/storage/authStorage';
import '../auth/auth.css';

const LOGO_URL = 'https://res.cloudinary.com/dwmjz9csc/image/upload/v1787120716/image-removebg-preview_e1wfil.png';

export function SupportSignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (email && password) {
      authStorage.setSupportAuth({ email, role: 'support' });
      navigate('/support/dashboard', { replace: true });
    } else {
      setError('Please enter valid email and password.');
    }
  };

  const handleDemoLogin = () => {
    authStorage.setSupportAuth({ email: 'support@goldenbowl.com', role: 'support' });
    navigate('/support/dashboard', { replace: true });
  };

  return (
    <div className="mobile-prototype-frame">
      <div className="mobile-app-shell">
        <MobileStatusBar />
        <main className="auth-screen mobile-route-content" style={{ background: '#f8fafc' }}>
          <div className="auth-card" style={{ borderColor: '#cbd5e1' }}>
            <div className="auth-header-row" style={{ justifyContent: 'center' }}>
              <span className="eyebrow" style={{ color: '#0284c7' }}>GOLDEN FOOD BOWL SUPPORT</span>
            </div>

            <div className="auth-brand-centered">
              <img src={LOGO_URL} alt="Golden Food Bowl" className="auth-large-logo" />
              <strong style={{ color: '#0f172a' }}>SUPPORT DESK LOGIN</strong>
              <small style={{ color: '#0284c7' }}>Customer Care &amp; Operations Portal</small>
            </div>

            <h1 className="auth-title-clean" style={{ color: '#0f172a' }}>Agent Sign In</h1>
            <p className="auth-desc" style={{ color: '#64748b' }}>
              Enter your Golden Food Bowl support team credentials to access the live ticket desk.
            </p>

            <button
              type="button"
              className="demo-login-btn"
              onClick={handleDemoLogin}
              style={{
                background: '#f0f9ff',
                borderColor: '#38bdf8',
                color: '#0369a1',
                marginBottom: 16,
              }}
            >
              🎧 1-Click Demo Support Login (Agent Ananya)
            </button>

            {error && (
              <div
                style={{
                  padding: 10,
                  background: '#fef2f2',
                  border: '1px solid #fca5a5',
                  color: '#dc2626',
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="clean-form">
              <label className="clean-field">
                <span className="field-label">
                  <Mail size={15} style={{ color: '#0284c7' }} /> Agent Email Address
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="agent@goldenbowl.com"
                  required
                  autoComplete="email"
                />
              </label>

              <label className="clean-field">
                <span className="field-label">
                  <Lock size={15} style={{ color: '#0284c7' }} /> Password
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </label>

              <button
                type="submit"
                className="auth-primary"
                style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  marginTop: 10,
                  boxShadow: '0 4px 12px rgba(2,132,199,0.25)',
                }}
              >
                Sign In to Support Desk <ArrowRight size={16} />
              </button>
            </form>

            <div style={{ marginTop: 24, textAlign: 'center', fontSize: 11, color: '#64748b' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#0284c7' }}>
                <LifeBuoy size={14} /> 24/7 Agent Helpdesk Enabled
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
