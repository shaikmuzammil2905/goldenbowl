import { Link, useNavigate } from 'react-router-dom';
import { Phone, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { MobileStatusBar } from '../../layouts/CustomerLayout';
import { authStorage } from '../../services/storage/authStorage';
import { apiClient } from '../../services/api/apiClient';
import './auth.css';

const LOGO = 'https://res.cloudinary.com/dwmjz9csc/image/upload/v1787120716/image-removebg-preview_e1wfil.png';

export function DeliveryPartnerSignInPage() {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const valid = /^\d{10}$/.test(mobile);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!valid || cooldown > 0) return;
    setError('');
    setLoading(true);
    try {
      const data = await apiClient('/auth/send-otp', {
        method: 'POST',
        body: { mobile: mobile.trim() },
      });
      if (data.success) {
        setSent(true);
        setCooldown(60);
      } else {
        setError(data.message || 'Unable to send SMS verification code. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Unable to reach SMS server. Please check your connection.');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (otp.replace(/\D/g, '').length !== 6) return;
    setError('');
    setLoading(true);
    try {
      const data = await apiClient('/auth/verify-otp', {
        method: 'POST',
        body: { mobile: mobile.trim(), otp: otp.trim() },
      });
      if (data.success && data.data?.user) {
        authStorage.setDeliveryAuth({ mobile: mobile.trim(), role: 'delivery' });
        navigate('/delivery/dashboard');
      } else {
        setError(data.message || 'Invalid verification code. Please try again.');
        setOtp('');
      }
    } catch (err) {
      setError(err.message || 'Verification request failed. Please check your connection.');
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
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Sending SMS Code...</> : <>Send SMS Code →</>}
                </button>
              </form>
            ) : (
              <form className="clean-form" onSubmit={handleVerifyOtp}>
                <p className="csi-otp-sent">Verification code sent to <strong>+91 {mobile}</strong></p>
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
                        const arr = (otp + '      ').slice(0, 6).split('');
                        arr[i] = v;
                        setOtp(arr.join('').trimEnd().slice(0, 6));
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
                  disabled={otp.replace(/\s/g, '').length !== 6 || loading}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : <>Verify &amp; Continue ✓</>}
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <button type="button" className="csi-back-link" onClick={() => { setSent(false); setOtp(''); setError(''); }}>
                    ← Change number
                  </button>
                  <button
                    type="button"
                    className="csi-back-link"
                    disabled={loading || cooldown > 0}
                    onClick={handleSendOtp}
                    style={{ color: cooldown > 0 ? '#94a3b8' : '#d97706' }}
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
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
