import { Link, useNavigate } from 'react-router-dom';
import { Mail, Phone, UserRound, ShieldCheck, Car, FileText, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { registerCustomer, registerDeliveryPartner } from '../../services/prototypeStore';
import { usePrototypeContext } from '../../context/PrototypeContext';
import { authStorage } from '../../services/storage/authStorage';
import { MobileStatusBar } from '../../layouts/CustomerLayout';
import { openRazorpayCheckout } from '../../services/razorpay';
import './auth.css';
import './customer-signin-mobile.css';

const LOGO = 'https://res.cloudinary.com/dwmjz9csc/image/upload/v1787120716/image-removebg-preview_e1wfil.png';

const Frame = ({ eyebrow, title, children }) => (
  <div className="mobile-prototype-frame">
    <div className="mobile-app-shell">
      <MobileStatusBar />
      <main className="auth-screen mobile-route-content">
        <div className="auth-card">
          {eyebrow && (
            <div className="auth-header-row" style={{ justifyContent: 'center' }}>
              <span className="eyebrow">{eyebrow}</span>
            </div>
          )}
          <div className="auth-brand-centered">
            <img src={LOGO} alt="Golden Food Bowl" className="auth-large-logo" />
            <strong>GOLDEN FOOD BOWL</strong>
            <small>Fresh • Tasty • Fast</small>
          </div>
          <h1 className="auth-title-clean">{title}</h1>
          {children}
        </div>
      </main>
    </div>
  </div>
);

const DeliveryFrame = ({ step = 1, totalSteps = 3, stepLabel = 'Partner Onboarding', children }) => (
  <div className="mobile-prototype-frame">
    <div className="mobile-app-shell">
      <MobileStatusBar />
      <main className="auth-screen mobile-route-content" style={{ background: '#f8fafc' }}>
        <div className="auth-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, fontSize: 11, fontWeight: 700, color: '#0284c7' }}>
            <span>STEP {step} OF {totalSteps}</span>
            <span>{stepLabel}</span>
          </div>
          {children}
        </div>
      </main>
    </div>
  </div>
);

const TextField = ({ icon: Icon, label, ...props }) => (
  <label className="clean-field">
    <span className="field-label">{Icon && <Icon size={15} />} {label}</span>
    <input {...props} />
  </label>
);

// ─── Email OTP Section ────────────────────────────────────────────────────────
function EmailOtpSection({ onLogin }) {
  const [email, setEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailOtpSent(true);
      } else {
        setError(data.message || 'Failed to send OTP. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: emailOtp }),
      });
      const data = await res.json();
      if (data.success) {
        onLogin({ email: email.trim(), name: data.data?.user?.name || email.split('@')[0] });
      } else {
        setError(data.message || 'Invalid or expired OTP. Try again.');
        setEmailOtp('');
      }
    } catch {
      setError('Verification failed. Check your connection.');
    }
    setLoading(false);
  };

  const handleOtpBoxChange = (e, i) => {
    const v = e.target.value.replace(/\D/g, '');
    const arr = (emailOtp + '      ').slice(0, 6).split('');
    arr[i] = v;
    setEmailOtp(arr.join('').trimEnd().slice(0, 6));
    if (v && e.target.nextSibling) e.target.nextSibling.focus();
  };

  const ErrorBox = ({ msg }) => msg ? (
    <p style={{ color: '#dc2626', fontSize: 12, margin: '0 0 8px', padding: '8px 12px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
      ⚠️ {msg}
    </p>
  ) : null;

  if (!emailOtpSent) {
    return (
      <form className="clean-form" onSubmit={handleSendOtp}>
        <TextField
          icon={Mail}
          label="Email Address"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          placeholder="you@example.com"
          type="email"
          required
        />
        <ErrorBox msg={error} />
        <button
          type="submit"
          className="auth-primary gold-btn"
          disabled={!email || loading}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {loading ? <><Loader2 size={16} className="animate-spin" /> Sending OTP...</> : <>✉️ Send OTP to Email →</>}
        </button>
        <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 6 }}>
          A 6-digit verification code will be sent to your inbox
        </p>
      </form>
    );
  }

  return (
    <form className="clean-form" onSubmit={handleVerifyOtp}>
      <p className="csi-otp-sent">
        OTP sent to <strong>{email}</strong>
        <br /><small style={{ color: '#94a3b8', fontWeight: 400 }}>Check your inbox &amp; spam folder</small>
      </p>
      <div className="csi-otp-row">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <input
            key={i}
            className="csi-otp-box"
            maxLength={1}
            value={emailOtp[i] || ''}
            inputMode="numeric"
            autoFocus={i === 0}
            onChange={(e) => handleOtpBoxChange(e, i)}
          />
        ))}
      </div>
      <ErrorBox msg={error} />
      <button
        type="submit"
        className="auth-primary gold-btn"
        disabled={emailOtp.replace(/\s/g, '').length !== 6 || loading}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : <>✓ Verify &amp; Sign In</>}
      </button>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <button
          type="button"
          className="csi-back-link"
          onClick={() => { setEmailOtpSent(false); setEmailOtp(''); setError(''); }}
        >
          ← Change email
        </button>
        <button
          type="button"
          className="csi-back-link"
          disabled={loading}
          onClick={handleSendOtp}
          style={{ color: '#d97706' }}
        >
          Resend OTP
        </button>
      </div>
    </form>
  );
}

// ─── Mobile OTP Section ───────────────────────────────────────────────────────
function MobileOtpSection({ onLogin }) {
  const [mobile, setMobile] = useState('');
  const [mobileOtp, setMobileOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const mobileOk = /^\d{10}$/.test(mobile);

  const handleSendMobileOtp = async (e) => {
    e.preventDefault();
    if (!mobileOk) return;
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
        setError(data.message || 'Failed to send OTP to mobile.');
      }
    } catch {
      // Fallback: Proceed to OTP screen
      setSent(true);
    }
    setLoading(false);
  };

  const handleVerifyMobileOtp = async (e) => {
    e.preventDefault();
    if (mobileOtp.length !== 6) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp: mobileOtp }),
      });
      const data = await res.json();
      if (data.success) {
        onLogin({ mobile, name: data.data?.user?.name || `Customer ${mobile.slice(-4)}` });
      } else {
        setError(data.message || 'Invalid or expired OTP code.');
        setMobileOtp('');
      }
    } catch {
      onLogin({ mobile, name: `Customer ${mobile.slice(-4)}` });
    }
    setLoading(false);
  };

  const handleOtpBoxChange = (e, i) => {
    const v = e.target.value.replace(/\D/g, '');
    const arr = (mobileOtp + '      ').slice(0, 6).split('');
    arr[i] = v;
    setMobileOtp(arr.join('').trimEnd().slice(0, 6));
    if (v && e.target.nextSibling) e.target.nextSibling.focus();
  };

  if (!sent) {
    return (
      <form className="clean-form" onSubmit={handleSendMobileOtp}>
        <label className="clean-field">
          <span className="field-label"><Phone size={15} /> Mobile Number</span>
          <div className="csi-mobile-field">
            <span className="csi-prefix">🇮🇳 +91</span>
            <input
              className="csi-mobile-input"
              value={mobile}
              onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
              placeholder="Enter 10-digit mobile"
              inputMode="numeric"
              autoComplete="tel"
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
          disabled={!mobileOk || loading}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {loading ? <><Loader2 size={16} className="animate-spin" /> Sending OTP...</> : <>Send Mobile OTP →</>}
        </button>
      </form>
    );
  }

  return (
    <form className="clean-form" onSubmit={handleVerifyMobileOtp}>
      <p className="csi-otp-sent">OTP sent to <strong>+91 {mobile}</strong></p>
      <div className="csi-otp-row">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <input
            key={i}
            className="csi-otp-box"
            maxLength={1}
            value={mobileOtp[i] || ''}
            inputMode="numeric"
            autoFocus={i === 0}
            onChange={(e) => handleOtpBoxChange(e, i)}
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
        disabled={mobileOtp.replace(/\s/g, '').length !== 6 || loading}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : <>Verify &amp; Sign In ✓</>}
      </button>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <button
          type="button"
          className="csi-back-link"
          onClick={() => { setSent(false); setMobileOtp(''); setError(''); }}
        >
          ← Change number
        </button>
        <button
          type="button"
          className="csi-back-link"
          disabled={loading}
          onClick={handleSendMobileOtp}
          style={{ color: '#d97706' }}
        >
          Resend OTP
        </button>
      </div>
    </form>
  );
}

// ─── Sign Up Page ─────────────────────────────────────────────────────────────
export function CustomerSignUpPage() {
  const n = useNavigate();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const ok = name.trim() && /^\d{10}$/.test(mobile);

  const submit = (e) => {
    e.preventDefault();
    if (!ok) return;
    registerCustomer({ name: name.trim(), mobile, email });
    authStorage.setCustomerAuth({ mobile, email, name: name.trim(), role: 'customer' });
    n('/customer/verify-otp');
  };

  return (
    <Frame eyebrow="SIGN UP" title="Create Account">
      <p className="auth-desc">Enter your details to create your Golden Food Bowl account.</p>
      <form onSubmit={submit} className="clean-form">
        <TextField icon={UserRound} label="Full Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Sharma" required />
        <TextField icon={Phone} label="Mobile Number" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile number" inputMode="numeric" required />
        <TextField icon={Mail} label={<>Email <small>(optional)</small></>} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" />
        <button type="submit" className="auth-primary gold-btn" disabled={!ok}>Create Account</button>
      </form>
      <p className="auth-switch-text">Already have an account? <Link to="/customer/signin">Sign In</Link></p>
    </Frame>
  );
}

// ─── Customer Sign In Page ────────────────────────────────────────────────────
export function CustomerSignInPage() {
  const n = useNavigate();
  const [mode, setMode] = useState('mobile');

  const handleSuccessfulLogin = (userData) => {
    authStorage.setCustomerAuth({ ...userData, role: 'customer' });
    n('/customer/home');
  };

  return (
    <Frame eyebrow="SIGN IN" title="Welcome Back">
      <p className="auth-desc">Sign in to order your favourite food bowls.</p>

      {/* Tabs */}
      <div className="csi-tabs">
        <button
          type="button"
          className={`csi-tab${mode === 'mobile' ? ' csi-tab-active' : ''}`}
          onClick={() => setMode('mobile')}
        >
          📱 Mobile OTP
        </button>
        <button
          type="button"
          className={`csi-tab${mode === 'email' ? ' csi-tab-active' : ''}`}
          onClick={() => setMode('email')}
        >
          ✉️ Email OTP
        </button>
      </div>

      {mode === 'mobile' && <MobileOtpSection onLogin={handleSuccessfulLogin} />}
      {mode === 'email' && <EmailOtpSection onLogin={handleSuccessfulLogin} />}

      <p className="auth-switch-text" style={{ marginTop: 24 }}>
        New to Bowl? <Link to="/customer/signup">Create an account</Link>
      </p>
    </Frame>
  );
}

export function CustomerVerifyOtpPage() {
  const n = useNavigate();
  const [otp, setOtp] = useState('');
  return (
    <Frame eyebrow="OTP VERIFICATION" title="Verify your mobile">
      <p>Enter the 6-digit code sent to your mobile number.</p>
      <TextField icon={Phone} label="Verification code" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter 6-digit OTP" inputMode="numeric" />
      <button type="button" className="auth-primary" disabled={otp.length !== 6} onClick={() => { authStorage.setCustomerAuth({ role: 'customer' }); n('/customer/location'); }}>Verify &amp; continue</button>
      <p className="auth-switch-text"><Link to="/customer/signin">Use another number</Link></p>
    </Frame>
  );
}

export function CustomerForgotPasswordPage() {
  const n = useNavigate();
  const [mobile, setMobile] = useState('');
  return (
    <Frame eyebrow="ACCOUNT RECOVERY" title="Recover your account">
      <p>Enter your registered mobile number and we'll send a verification code.</p>
      <TextField icon={Phone} label="Mobile number" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile number" inputMode="numeric" />
      <button type="button" className="auth-primary" disabled={!/^\d{10}$/.test(mobile)} onClick={() => { n('/customer/verify-otp'); }}>Send recovery OTP</button>
      <p className="auth-switch-text"><Link to="/customer/signin">Back to sign in</Link></p>
    </Frame>
  );
}

export function CustomerLocationPage() {
  const n = useNavigate();
  return (
    <Frame eyebrow="LOCATION" title="Select Delivery Address">
      <p className="auth-desc">Choose your location in Bengaluru to view available bowls and delivery time.</p>
      <button type="button" className="auth-primary gold-btn" onClick={() => n('/customer/home')}>
        📍 Deliver to Indiranagar, Bengaluru
      </button>
      <button type="button" className="auth-secondary" style={{ marginTop: 8 }} onClick={() => n('/customer/home')}>
        Use Current GPS Location
      </button>
    </Frame>
  );
}

export function DeliverySignUpPage() {
  const n = useNavigate();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [vehicle, setVehicle] = useState('Bike');

  const submit = (e) => {
    e.preventDefault();
    if (name.trim() && /^\d{10}$/.test(mobile)) {
      registerDeliveryPartner({ name: name.trim(), mobile, vehicle });
      n('/delivery/verification');
    }
  };

  return (
    <DeliveryFrame step={1} totalSteps={3} stepLabel="Partner Application">
      <h2>Join Bowl Delivery Team</h2>
      <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 16px' }}>Earn up to ₹35,000/month delivering fresh food bowls.</p>
      <form onSubmit={submit} className="clean-form">
        <TextField icon={UserRound} label="Full Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rahul Kumar" required />
        <TextField icon={Phone} label="Mobile Number" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile number" inputMode="numeric" required />
        <label className="clean-field">
          <span className="field-label"><Car size={15} /> Vehicle Type</span>
          <select value={vehicle} onChange={(e) => setVehicle(e.target.value)} style={{ padding: 10, borderRadius: 10, border: '1px solid #cbd5e1', width: '100%' }}>
            <option value="Bike">Motorcycle / Bike</option>
            <option value="Scooter">Scooter / Moped</option>
            <option value="Electric Vehicle">Electric EV Scooter</option>
          </select>
        </label>
        <button type="submit" className="auth-primary gold-btn" disabled={!name.trim() || !/^\d{10}$/.test(mobile)}>
          Continue to Verification →
        </button>
      </form>
      <p className="auth-switch-text">Already a partner? <Link to="/delivery/signin">Sign In</Link></p>
    </DeliveryFrame>
  );
}

export function DeliveryVerificationPage() {
  const n = useNavigate();
  const [aadhaar, setAadhaar] = useState('');
  const [dl, setDl] = useState('');

  const submit = (e) => {
    e.preventDefault();
    n('/delivery/onboarding-fee/payment');
  };

  return (
    <DeliveryFrame step={2} totalSteps={3} stepLabel="Document Upload">
      <h2>Verify Documents</h2>
      <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 16px' }}>Provide Aadhaar and Driving License details for background check.</p>
      <form onSubmit={submit} className="clean-form">
        <TextField icon={FileText} label="Aadhaar Number" value={aadhaar} onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="12-digit Aadhaar" inputMode="numeric" required />
        <TextField icon={ShieldCheck} label="Driving License Number" value={dl} onChange={(e) => setDl(e.target.value)} placeholder="e.g. KA-01-2023-1234567" required />
        <button type="submit" className="auth-primary gold-btn" disabled={aadhaar.length !== 12 || !dl.trim()}>
          Proceed to Onboarding Fee →
        </button>
      </form>
    </DeliveryFrame>
  );
}

export function DeliveryFeePage() {
  const n = useNavigate();
  const [loading, setLoading] = useState(false);
  const context = usePrototypeContext();
  const deliverySettings = context?.deliverySettings || { onboardingFee: 499, kitFee: 350, verificationFee: 149 };

  const currentFee = Number(deliverySettings?.onboardingFee ?? 499);
  const kitFee = Number(deliverySettings?.kitFee ?? (currentFee > 150 ? Math.round(currentFee * 0.7) : currentFee));
  const verificationFee = currentFee - kitFee > 0 ? currentFee - kitFee : 0;
  const isFree = currentFee === 0;
  const isReduced = currentFee < 700;
  const discountPercent = isReduced ? Math.round(((700 - currentFee) / 700) * 100) : 0;

  const pay = () => {
    if (isFree) {
      n('/delivery/application-submitted');
      return;
    }
    setLoading(true);
    openRazorpayCheckout({
      amount: currentFee,
      description: `Delivery Partner Kit & Onboarding Fee (₹${currentFee})`,
      customerName: 'Rahul Kumar',
      customerPhone: '9876543210',
      notes: { purpose: 'Delivery Partner Onboarding Kit & Verification', fee: currentFee },
      onSuccess: (paymentData) => {
        setLoading(false);
        console.log('Razorpay Delivery Onboarding Fee Paid:', paymentData);
        n('/delivery/application-submitted');
      },
      onFailure: (err) => {
        setLoading(false);
        console.error('Payment failure:', err);
      },
      onDismiss: () => {
        setLoading(false);
      }
    });
  };

  return (
    <DeliveryFrame step={3} totalSteps={3} stepLabel="Onboarding Fee">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h2 style={{ margin: 0 }}>Partner Kit &amp; Fee</h2>
        {isReduced && (
          <span style={{
            background: isFree ? '#dcfce7' : '#fef08a',
            color: isFree ? '#15803d' : '#854d0e',
            padding: '3px 8px',
            borderRadius: 6,
            fontSize: 10,
            fontWeight: 900
          }}>
            {isFree ? '🎉 100% FEE WAIVED' : `🔥 ${discountPercent}% DISCOUNT`}
          </span>
        )}
      </div>

      <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 14px' }}>
        {isFree
          ? 'Onboarding fee waived by Admin promo! Includes free kit & background check.'
          : 'One-time onboarding fee includes Golden Bowl Delivery Bag & Uniform T-shirt.'}
      </p>

      {deliverySettings?.promoNotice && (
        <div style={{
          background: isFree ? '#ecfdf5' : '#fff9ec',
          border: `1px solid ${isFree ? '#a7f3d0' : '#fed7aa'}`,
          borderRadius: 10,
          padding: '8px 12px',
          marginBottom: 14,
          fontSize: 11.5,
          color: isFree ? '#065f46' : '#9a3412',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <span>{isFree ? '🎁' : '⚡'}</span>
          <span><strong>{deliverySettings.promoNotice}</strong></span>
        </div>
      )}

      <div style={{
        background: '#fff9ec',
        border: '1px solid #fed7aa',
        borderRadius: 10,
        padding: '8px 12px',
        marginBottom: 14,
        fontSize: 11.5,
        color: '#9a3412',
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }}>
        <span>💳</span>
        <span><strong>Razorpay Integration Active</strong> — Secure UPI, Cards &amp; NetBanking.</span>
      </div>

      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
          <span>Delivery Bag &amp; Uniform Kit</span>
          <strong>{isFree ? <span style={{ textDecoration: 'line-through', color: '#94a3b8' }}>₹500</span> : `₹${kitFee}`} {isFree && <b style={{ color: '#16a34a', marginLeft: 4 }}>FREE</b>}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span>Background Verification Fee</span>
          <strong>{isFree ? <span style={{ textDecoration: 'line-through', color: '#94a3b8' }}>₹200</span> : `₹${verificationFee}`} {isFree && <b style={{ color: '#16a34a', marginLeft: 4 }}>FREE</b>}</strong>
        </div>
        <hr style={{ margin: '12px 0', borderColor: '#cbd5e1' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 13, color: '#64748b', display: 'block' }}>Total One-Time Fee</span>
            {isReduced && !isFree && (
              <span style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'line-through' }}>Original: ₹700</span>
            )}
          </div>
          <span style={{ fontSize: 20, fontWeight: 900, color: isFree ? '#16a34a' : '#0284c7' }}>
            {isFree ? '₹0 FREE' : `₹${currentFee}`}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="auth-primary gold-btn"
        onClick={pay}
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          background: isFree ? 'linear-gradient(135deg, #16a34a, #22c55e)' : undefined
        }}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
        {loading ? 'Opening Razorpay...' : (isFree ? 'Complete Free Registration (₹0) ✓' : `Pay ₹${currentFee} with Razorpay →`)}
      </button>
    </DeliveryFrame>
  );
}

export function DeliveryApplicationSubmittedPage() {
  const n = useNavigate();
  return (
    <DeliveryFrame step={3} totalSteps={3} stepLabel="Submitted">
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <span style={{ fontSize: 48 }}>🎉</span>
        <h2 style={{ marginTop: 12 }}>Application Submitted!</h2>
        <p style={{ fontSize: 12, color: '#64748b', margin: '8px 0 20px' }}>
          Your delivery partner application is currently under verification by Golden Bowl Admin.
        </p>
        <button type="button" className="auth-primary gold-btn" onClick={() => { authStorage.setDeliveryAuth({ role: 'delivery' }); n('/delivery/orders'); }}>
          Go to Partner App →
        </button>
      </div>
    </DeliveryFrame>
  );
}
