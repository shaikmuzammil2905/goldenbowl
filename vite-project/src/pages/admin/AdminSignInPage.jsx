import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldCheck } from 'lucide-react';
import { MobileStatusBar } from '../../layouts/CustomerLayout';
import { authStorage } from '../../services/storage/authStorage';
import '../auth/auth.css';

const LOGO = 'https://res.cloudinary.com/dwmjz9csc/image/upload/v1787120716/image-removebg-preview_e1wfil.png';

export function AdminSignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@goldenbowl.com');
  const [password, setPassword] = useState('admin123');
  const valid = email.trim() && password.trim();

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    if (!valid) return;
    authStorage.setAdminAuth({ email, role: 'admin' });
    navigate('/admin/dashboard');
  };

  const quickDemoLogin = () => {
    authStorage.setAdminAuth({ email: 'admin@goldenbowl.com', role: 'admin' });
    navigate('/admin/dashboard');
  };

  return (
    <div className="mobile-prototype-frame">
      <div className="mobile-app-shell">
        <MobileStatusBar />
        <main className="auth-screen mobile-route-content">
          <div className="auth-card">
            <div className="auth-header-row" style={{ justifyContent: 'center' }}>
              <span className="eyebrow">ADMINISTRATOR PORTAL</span>
            </div>

            <div className="auth-brand-centered">
              <img src={LOGO} alt="Golden Food Bowl" className="auth-large-logo" />
              <strong>GOLDEN FOOD BOWL</strong>
              <small>Operations &amp; Admin Desk</small>
            </div>

            <h1 className="auth-title-clean">Admin Sign In</h1>
            <p className="auth-desc">Sign in with authorized administrator credentials.</p>

            <button type="button" className="demo-login-btn" onClick={quickDemoLogin}>
              ⚡ 1-Click Demo Admin Login
            </button>

            <form className="clean-form" onSubmit={handleLogin}>
              <label className="clean-field">
                <span className="field-label"><Mail size={15} /> Admin Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@goldenbowl.com"
                  required
                />
              </label>

              <label className="clean-field">
                <span className="field-label"><Lock size={15} /> Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </label>

              <button type="submit" className="auth-primary gold-btn" disabled={!valid} style={{ marginTop: '8px' }}>
                Sign In to Admin Portal →
              </button>
            </form>

            <div className="auth-summary" style={{ marginTop: '16px' }}>
              <div className="auth-summary-row">
                <span>Access Level</span>
                <b className="auth-badge-ok"><ShieldCheck size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Super Admin</b>
              </div>
              <div className="auth-summary-row"><span>Demo Credentials</span><b>admin@goldenbowl.com</b></div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
