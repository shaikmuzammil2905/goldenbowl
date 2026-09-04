import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, ArrowLeft, KeyRound } from 'lucide-react';
import { MobileStatusBar } from '../../layouts/CustomerLayout';
import { authStorage } from '../../services/storage/authStorage';
import { apiClient } from '../../services/api/apiClient';
import '../auth/auth.css';

const LOGO = 'https://res.cloudinary.com/dwmjz9csc/image/upload/v1787120716/image-removebg-preview_e1wfil.png';

export function AdminSignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@goldenbowl.com');
  const [password, setPassword] = useState('GoldenBowl2026!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authStorage.getAdminAuth()) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [navigate]);

  const valid = email.trim() && password.trim();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!valid) return;
    setLoading(true);
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const MASTER_EMAILS = ['admin@goldenbowl.com', 'muzammilshaik826@gmail.com'];
    const MASTER_PASSWORDS = ['GoldenBowl2026!', 'admin123', 'Admin@123'];

    try {
      const response = await apiClient('/auth/login', {
        method: 'POST',
        body: { identifier: cleanEmail, password: cleanPassword, role: 'ADMIN' },
      });

      authStorage.setAdminAuth({ 
        email: response.user?.email || cleanEmail, 
        role: response.user?.role || 'admin',
        token: response.token || response.accessToken || 'admin-session-active'
      });
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      // If server returned error but credentials match configured Master Admin, allow offline entry
      if (MASTER_EMAILS.includes(cleanEmail) && MASTER_PASSWORDS.includes(cleanPassword)) {
        authStorage.setAdminAuth({
          email: cleanEmail,
          role: 'admin',
          token: 'master-offline-token'
        });
        navigate('/admin/dashboard', { replace: true });
        return;
      }
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const autofillMaster = () => {
    setEmail('admin@goldenbowl.com');
    setPassword('GoldenBowl2026!');
    setError('');
  };

  return (
    <div className="mobile-prototype-frame">
      <div className="mobile-app-shell">
        <MobileStatusBar />
        <main className="auth-screen mobile-route-content">
          <div className="auth-card">
            <div className="auth-header-row" style={{ justifyContent: 'space-between' }}>
              <Link to="/customer/home" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#78716c', textDecoration: 'none', fontSize: 11, fontWeight: 700 }}>
                <ArrowLeft size={14} /> Back to Store
              </Link>
              <span className="eyebrow">ADMINISTRATOR PORTAL</span>
            </div>

            <div className="auth-brand-centered">
              <img src={LOGO} alt="Golden Food Bowl" className="auth-large-logo" />
              <strong>GOLDEN FOOD BOWL</strong>
              <small>Operations &amp; Admin Desk</small>
            </div>

            <h1 className="auth-title-clean">Admin Sign In</h1>
            <p className="auth-desc">Sign in with authorized administrator credentials.</p>

            <button
              type="button"
              className="demo-login-btn"
              onClick={autofillMaster}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <KeyRound size={14} /> Reset Master Credentials (admin@goldenbowl.com)
            </button>

            {error && (
              <div style={{ margin: '8px 0 14px', padding: '10px 14px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: 10, fontSize: 12, fontWeight: 700 }}>
                {error}
              </div>
            )}

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

              <button type="submit" className="auth-primary gold-btn" disabled={!valid || loading} style={{ marginTop: '8px' }}>
                {loading ? 'Authenticating...' : 'Sign In to Admin Portal →'}
              </button>
            </form>

            <div className="auth-summary" style={{ marginTop: '16px' }}>
              <div className="auth-summary-row">
                <span>Access Level</span>
                <b className="auth-badge-ok"><ShieldCheck size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Super Admin</b>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
