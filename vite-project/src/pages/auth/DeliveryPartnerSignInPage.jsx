import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { MobileStatusBar } from '../../layouts/CustomerLayout';
import { authStorage } from '../../services/storage/authStorage';
import { apiClient } from '../../services/api/apiClient';
import './auth.css';

const LOGO = 'https://res.cloudinary.com/dwmjz9csc/image/upload/v1787120716/image-removebg-preview_e1wfil.png';

export function DeliveryPartnerSignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validEmail || !password) return;
    setError('');
    setLoading(true);

    try {
      const data = await apiClient('/auth/login', {
        method: 'POST',
        body: { identifier: email.trim().toLowerCase(), password },
      });

      if (data.success && data.user) {
        authStorage.setDeliveryAuth({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role || 'delivery',
          token: data.token || data.accessToken,
        });
        navigate('/delivery/dashboard');
      } else {
        setError(data.message || 'Invalid email or password. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-prototype-frame">
      <div className="mobile-app-shell">
        <MobileStatusBar />
        <main className="auth-screen mobile-route-content">
          <div className="auth-card">
            <div className="auth-header-row" style={{ justifyContent: 'center' }}>
              <span className="eyebrow">DELIVERY PARTNER LOGIN</span>
            </div>

            <div className="auth-brand-centered">
              <img src={LOGO} alt="Golden Food Bowl" className="auth-large-logo" />
              <strong>GOLDEN FOOD BOWL</strong>
              <small>Delivery Partner Portal</small>
            </div>

            <h1 className="auth-title-clean">Delivery Partner Login</h1>
            <p className="auth-desc">
              Sign in with your registered email and password to access your delivery dashboard.
            </p>

            <form className="clean-form" onSubmit={handleLogin}>
              <label className="clean-field">
                <span className="field-label"><Mail size={15} /> Email Address</span>
                <div className="csi-field-box" style={{ position: 'relative' }}>
                  <input
                    className="csi-input"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="name@example.com"
                    autoCapitalize="none"
                    autoCorrect="off"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1px solid #cbd5e1',
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>
              </label>

              <label className="clean-field">
                <span className="field-label"><Lock size={15} /> Password</span>
                <div className="csi-password-field">
                  <input
                    className="csi-password-input"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    className="csi-pw-toggle"
                    onClick={() => setShowPw(!showPw)}
                    tabIndex={-1}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '-4px 0 4px' }}>
                <Link to="/delivery/forgot-password" className="csi-forgot">
                  Forgot Password?
                </Link>
              </div>

              {error && (
                <p style={{
                  color: '#dc2626',
                  fontSize: 12,
                  margin: '-4px 0 6px',
                  padding: '8px 12px',
                  background: '#fef2f2',
                  borderRadius: 8,
                  border: '1px solid #fecaca'
                }}>
                  ⚠️ {error}
                </p>
              )}

              <button
                type="submit"
                className="auth-primary gold-btn"
                disabled={!validEmail || !password || loading}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6 }}
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Signing In...</> : <>Sign In →</>}
              </button>
            </form>

            <p className="auth-switch-text" style={{ marginTop: 24 }}>
              Don't have an account?{' '}
              <Link to="/delivery/signup">Apply as Delivery Partner</Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
