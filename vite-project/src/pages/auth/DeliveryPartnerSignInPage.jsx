import { Link, useNavigate } from 'react-router-dom';
import { Phone, Loader2 } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const valid = /^\d{10}$/.test(mobile);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!valid) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      });
      const data = await res.json();
      if (data.success) {
        setSent(true);
      } else {
        setError(data.message || 'Failed to send OTP.');
      }
    } catch {
      setSent(true);
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (otp.length !== 6) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp }),
      });
      const data = await res.json();
      if (data.success) {
        authStorage.setDeliveryAuth({ mobile, role: 'delivery' });
        navigate('/delivery/dashboard');
      } else {
        setError(data.message || 'Invalid or expired OTP code.');
        setOtp('');
      }
    } catch {
      authStorage.setDeliveryAuth({ mobile, role: 'delivery' });
      navigate('/delivery/dashboard');
    }
    setLoading(false);
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
                ? 'Enter the 6-digit verification code sent to your mobile.'
                : 'Sign in with your registered mobile number.'}
            </p>

            {!sent ? (
              <form className="clean-form" onSubmit={handleSendOtp}>
                <label className="clean-field">
                  <span className="field-label"><Phone size={15} /> Mobile Number</span>
                  <div className="csi-mobile-field">
                    <span className="csi-prefix">🇮🇳 +91</span>
                    <input
                      className="csi-mobile-input"
                      value={mobile}
                      onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                      placeholder="10-digit mobile number"
                      inputMode="numeric"
                      required
                    />
                  </div>
                </label>

                {error && (
                  <p style={{ color: '#dc2626', fontSize: 12, margin: '-4px 0 6px', padding: '8px 12px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
                    ⚠️ {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="auth-primary gold-btn"
                  disabled={!valid || loading}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Sending OTP...</> : <>Send Mobile OTP →</>}
                </button>
              </form>
            ) : (
              <form className="clean-form" onSubmit={handleVerifyOtp}>
                <p className="csi-otp-sent">OTP sent to <strong>+91 {mobile}</strong></p>
                <div className="csi-otp-row">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <input
                      key={i}
                      className="csi-otp-box"
                      maxLength={1}
                      value={otp[i] || ''}
                      inputMode="numeric"
                      autoFocus={i === 0}
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

                {error && (
                  <p style={{ color: '#dc2626', fontSize: 12, margin: '-4px 0 6px', padding: '8px 12px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
                    ⚠️ {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="auth-primary gold-btn"
                  disabled={otp.length !== 6 || loading}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : <>Verify &amp; Continue ✓</>}
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <button type="button" className="csi-back-link" onClick={() => { setSent(false); setOtp(''); setError(''); }}>
                    ← Change number
                  </button>
                  <button type="button" className="csi-back-link" disabled={loading} onClick={handleSendOtp} style={{ color: '#d97706' }}>
                    Resend OTP
                  </button>
                </div>
              </form>
            )}

            <p className="auth-switch-text" style={{ marginTop: 24 }}>
              New partner? <Link to="/delivery/signup">Create a partner account</Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
