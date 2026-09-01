import { Link, useNavigate } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import { useState } from 'react';
import { MobileStatusBar } from '../../layouts/CustomerLayout';
import { authStorage } from '../../services/storage/authStorage';
import './auth.css';

const LOGO = 'https://res.cloudinary.com/dwmjz9csc/image/upload/v1787120716/image-removebg-preview_e1wfil.png';

export function DeliveryPartnerSignInPage() {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const valid = /^\d{10}$/.test(mobile);

  const continueLogin = () => {
    authStorage.setDeliveryAuth({ mobile: mobile || '9876543210', role: 'delivery' });
    navigate('/delivery/dashboard');
  };

  return (
    <div className="mobile-prototype-frame">
      <div className="mobile-app-shell">
        <MobileStatusBar />
        <main className="auth-screen mobile-route-content">
          <div className="auth-card">
            <div className="auth-header-row" style={{ justifyContent: 'center' }}>
              <span className="eyebrow">DELIVERY PARTNER SIGN IN</span>
            </div>

            <div className="auth-brand-centered">
              <img src={LOGO} alt="Golden Food Bowl" className="auth-large-logo" />
              <strong>GOLDEN FOOD BOWL</strong>
              <small>Delivery Partner Portal</small>
            </div>

            <h1 className="auth-title-clean">Welcome back, partner</h1>
            <p className="auth-desc">
              {sent
                ? 'Enter the simulated 6-digit verification code.'
                : 'Sign in with your registered mobile number.'}
            </p>

            <button type="button" className="demo-login-btn" onClick={continueLogin}>
              ⚡ 1-Click Demo Login (Delivery Partner)
            </button>

            {!sent ? (
              <form className="clean-form" onSubmit={(e) => { e.preventDefault(); if (valid) setSent(true); }}>
                <label className="clean-field">
                  <span className="field-label"><Phone size={15} /> Mobile Number</span>
                  <div className="csi-mobile-field">
                    <span className="csi-prefix">🇮🇳 +91</span>
                    <input
                      className="csi-mobile-input"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit mobile number"
                      inputMode="numeric"
                    />
                  </div>
                </label>

                <button type="submit" className="auth-primary gold-btn" disabled={!valid}>
                  Continue →
                </button>

                <div className="auth-divider"><span>or continue with</span></div>

                <div className="auth-social-stack">
                  <button type="button" className="auth-social google-btn" onClick={continueLogin}>
                    <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  <button type="button" className="auth-social email-btn" onClick={continueLogin}>
                    <Mail size={17} className="email-icon" />
                    <span>Continue with Email</span>
                  </button>
                </div>
              </form>
            ) : (
              <form className="clean-form" onSubmit={(e) => { e.preventDefault(); if (otp.length === 6) continueLogin(); }}>
                <p className="csi-otp-sent">OTP sent to <strong>+91 {mobile}</strong></p>
                <div className="csi-otp-row">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <input
                      key={i}
                      className="csi-otp-box"
                      maxLength={1}
                      value={otp[i] || ''}
                      inputMode="numeric"
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, '');
                        const arr = otp.split('');
                        arr[i] = v;
                        const next = arr.join('').slice(0, 6);
                        setOtp(next);
                        if (v && e.target.nextSibling) e.target.nextSibling.focus();
                      }}
                    />
                  ))}
                </div>
                <p className="csi-otp-hint">Prototype OTP: <strong>123456</strong></p>
                <button type="submit" className="auth-primary gold-btn" disabled={otp.length !== 6}>
                  Verify &amp; Continue ✓
                </button>
                <button type="button" className="csi-back-link" onClick={() => { setSent(false); setOtp(''); }}>
                  ← Use another sign-in method
                </button>
              </form>
            )}

            <p className="auth-switch-text">
              New partner? <Link to="/delivery/signup">Create a partner account</Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
