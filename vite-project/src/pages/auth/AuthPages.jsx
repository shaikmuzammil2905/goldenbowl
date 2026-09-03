import { Link, useNavigate } from 'react-router-dom';
import { Mail, Phone, UserRound, ShieldCheck, Car, FileText, Loader2, Eye, EyeOff, Lock, ArrowLeft } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { registerCustomer, registerDeliveryPartner } from '../../services/prototypeStore';
import { usePrototypeContext } from '../../context/PrototypeContext';
import { authStorage } from '../../services/storage/authStorage';
import { MobileStatusBar } from '../../layouts/CustomerLayout';
import { openRazorpayCheckout } from '../../services/razorpay';
import { authApi } from '../../services/api/authApi';
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

// ── Google Icon ───────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

// ── Customer Friendly Error Message Box ───────────────────────────────────────
const ErrorBox = ({ msg }) => {
  if (!msg) return null;
  return (
    <div style={{
      color: '#b91c1c',
      fontSize: 12.5,
      lineHeight: 1.4,
      margin: '8px 0',
      padding: '10px 14px',
      background: '#fef2f2',
      borderRadius: 10,
      border: '1px solid #fecaca',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      <span>⚠️</span>
      <span>{msg}</span>
    </div>
  );
};

// ── 6-Box OTP Input with Paste & Auto-Focus ───────────────────────────────────
function OtpInputBoxes({ value, onChange }) {
  const inputsRef = useRef([]);

  const handleChange = (e, idx) => {
    const val = e.target.value.replace(/\D/g, '');
    const currentChars = (value + '      ').slice(0, 6).split('');

    if (val.length > 1) {
      // Handle paste in single box
      const pasted = val.slice(0, 6);
      onChange(pasted);
      const nextIdx = Math.min(pasted.length, 5);
      inputsRef.current[nextIdx]?.focus();
      return;
    }

    currentChars[idx] = val;
    const newOtp = currentChars.join('').trimEnd().slice(0, 6);
    onChange(newOtp);

    if (val && idx < 5) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !value[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasteData) {
      onChange(pasteData);
      const nextIdx = Math.min(pasteData.length, 5);
      inputsRef.current[nextIdx]?.focus();
    }
  };

  return (
    <div className="csi-otp-row" onPaste={handlePaste}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          className="csi-otp-box"
          maxLength={1}
          value={value[i] || ''}
          inputMode="numeric"
          autoFocus={i === 0}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
        />
      ))}
    </div>
  );
}

// ── 1. PASSWORD LOGIN SECTION ─────────────────────────────────────────────────
function PasswordLoginSection({ onLogin }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;
    setError('');
    setLoading(true);

    try {
      const res = await authApi.login({
        identifier: identifier.trim(),
        password,
        role: 'customer',
      });

      if (res?.success && (res?.user || res?.data?.user)) {
        const user = res.user || res.data?.user;
        onLogin(user);
      } else {
        setError(res?.message || 'Invalid login credentials. Please check your details.');
      }
    } catch (err) {
      setError(err?.message || 'Unable to connect to the server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="clean-form" onSubmit={handleLogin}>
      <label className="clean-field">
        <span className="field-label"><Mail size={15} /> Email or Phone</span>
        <input
          value={identifier}
          onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
          placeholder="Email or 10-digit mobile"
          required
          autoComplete="username"
        />
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
            autoComplete="current-password"
          />
          <button
            type="button"
            className="csi-pw-toggle"
            onClick={() => setShowPw(!showPw)}
            tabIndex={-1}
          >
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </label>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '-4px 0 2px' }}>
        <Link to="/customer/forgot-password" className="csi-forgot">Forgot password?</Link>
      </div>

      <ErrorBox msg={error} />

      <button
        type="submit"
        className="auth-primary gold-btn"
        disabled={!identifier.trim() || !password || loading}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        {loading ? <><Loader2 size={16} className="animate-spin" /> Logging in...</> : 'Login'}
      </button>
    </form>
  );
}

// ── 2. EMAIL OTP SECTION ──────────────────────────────────────────────────────
function EmailOtpSection({ onLogin }) {
  const [email, setEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (cooldown > 0) return;
    setError('');
    setLoading(true);

    try {
      const res = await authApi.sendEmailOtp({ email: email.trim() });
      if (res?.success) {
        setEmailOtpSent(true);
        setCooldown(60);
      } else {
        setError(res?.message || 'Unable to send verification code. Please try again.');
      }
    } catch (err) {
      setError(err?.message || 'Unable to deliver verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (emailOtp.replace(/\D/g, '').length !== 6) return;
    setError('');
    setLoading(true);

    try {
      const res = await authApi.verifyEmailOtp({ email: email.trim(), otp: emailOtp.trim() });
      if (res?.success && (res?.user || res?.data?.user)) {
        const user = res.user || res.data?.user;
        authStorage.setCustomerAuth(user);
        onLogin(user);
      } else {
        setError(res?.message || 'Invalid verification code. Please check and try again.');
        setEmailOtp('');
      }
    } catch (err) {
      setError(err?.message || 'Verification failed. Please check your code or request a new one.');
    } finally {
      setLoading(false);
    }
  };

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
          {loading ? <><Loader2 size={16} className="animate-spin" /> Sending Code...</> : 'Send Email Verification Code →'}
        </button>
        <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 6 }}>
          A 6-digit verification code will be sent to your Gmail inbox
        </p>
      </form>
    );
  }

  return (
    <form className="clean-form" onSubmit={handleVerifyOtp}>
      <p className="csi-otp-sent">
        Verification code sent to <strong>{email}</strong>
        <br /><small style={{ color: '#94a3b8', fontWeight: 400 }}>Please check your inbox &amp; spam folder</small>
      </p>

      <OtpInputBoxes value={emailOtp} onChange={setEmailOtp} />

      <ErrorBox msg={error} />

      <button
        type="submit"
        className="auth-primary gold-btn"
        disabled={emailOtp.replace(/\D/g, '').length !== 6 || loading}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : 'Verify & Sign In ✓'}
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
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
          disabled={loading || cooldown > 0}
          onClick={handleSendOtp}
          style={{ color: cooldown > 0 ? '#94a3b8' : '#d97706', cursor: cooldown > 0 ? 'not-allowed' : 'pointer' }}
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Code'}
        </button>
      </div>
    </form>
  );
}

// ── 3. MOBILE OTP SECTION ─────────────────────────────────────────────────────
function MobileOtpSection({ onLogin }) {
  const [mobile, setMobile] = useState('');
  const [mobileOtp, setMobileOtp] = useState('');
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (cooldown > 0) return;
    const cleanNumber = mobile.replace(/\D/g, '').slice(-10);
    if (cleanNumber.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await authApi.sendMobileOtp({ mobile: cleanNumber });
      if (res?.success) {
        setMobileOtpSent(true);
        setCooldown(60);
      } else {
        setError(res?.message || 'Unable to send SMS verification code. Please try again.');
      }
    } catch (err) {
      setError(err?.message || 'SMS service is temporarily unavailable. Please use Email OTP or Password login.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (mobileOtp.replace(/\D/g, '').length !== 6) return;
    const cleanNumber = mobile.replace(/\D/g, '').slice(-10);
    setError('');
    setLoading(true);

    try {
      const res = await authApi.verifyMobileOtp({ mobile: cleanNumber, otp: mobileOtp.trim() });
      if (res?.success && (res?.user || res?.data?.user)) {
        const user = res.user || res.data?.user;
        authStorage.setCustomerAuth(user);
        onLogin(user);
      } else {
        setError(res?.message || 'Invalid verification code. Please check and try again.');
        setMobileOtp('');
      }
    } catch (err) {
      setError(err?.message || 'Verification failed. Please check your code or request a new one.');
    } finally {
      setLoading(false);
    }
  };

  if (!mobileOtpSent) {
    return (
      <form className="clean-form" onSubmit={handleSendOtp}>
        <TextField
          icon={Phone}
          label="Mobile Number"
          value={mobile}
          onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
          placeholder="10-digit mobile number"
          inputMode="numeric"
          required
        />
        <ErrorBox msg={error} />
        <button
          type="submit"
          className="auth-primary gold-btn"
          disabled={mobile.replace(/\D/g, '').length !== 10 || loading}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {loading ? <><Loader2 size={16} className="animate-spin" /> Sending SMS...</> : 'Send Mobile Verification Code →'}
        </button>
        <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 6 }}>
          A 6-digit SMS code will be sent to your phone
        </p>
      </form>
    );
  }

  return (
    <form className="clean-form" onSubmit={handleVerifyOtp}>
      <p className="csi-otp-sent">
        Verification code sent to <strong>+91 {mobile}</strong>
        <br /><small style={{ color: '#94a3b8', fontWeight: 400 }}>Please check your SMS messages</small>
      </p>

      <OtpInputBoxes value={mobileOtp} onChange={setMobileOtp} />

      <ErrorBox msg={error} />

      <button
        type="submit"
        className="auth-primary gold-btn"
        disabled={mobileOtp.replace(/\D/g, '').length !== 6 || loading}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : 'Verify & Sign In ✓'}
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <button
          type="button"
          className="csi-back-link"
          onClick={() => { setMobileOtpSent(false); setMobileOtp(''); setError(''); }}
        >
          ← Change number
        </button>
        <button
          type="button"
          className="csi-back-link"
          disabled={loading || cooldown > 0}
          onClick={handleSendOtp}
          style={{ color: cooldown > 0 ? '#94a3b8' : '#d97706', cursor: cooldown > 0 ? 'not-allowed' : 'pointer' }}
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Code'}
        </button>
      </div>
    </form>
  );
}

// ── 4. CUSTOMER SIGN IN PAGE (Unified Redesigned Shell) ────────────────────────
export function CustomerSignInPage() {
  const n = useNavigate();
  const [mode, setMode] = useState('password'); // 'password' | 'email-otp' | 'mobile-otp'

  const handleSuccessfulLogin = (userData) => {
    authStorage.setCustomerAuth({ ...userData, role: 'customer' });
    n('/customer/home');
  };

  return (
    <div className="mobile-prototype-frame">
      <div className="mobile-app-shell">
        <MobileStatusBar />
        <main className="csi-screen">
          {/* Hero Header */}
          <div className="csi-hero">
            <div className="csi-hero-glow" />
            <div className="csi-hero-content">
              <img src={LOGO} alt="Golden Food Bowl" className="auth-large-logo" style={{ width: 68, height: 68 }} />
              <strong style={{ fontSize: 15, fontWeight: 900, color: '#fff', letterSpacing: 1 }}>GOLDEN FOOD BOWL</strong>
              <small style={{ fontSize: 9.5, fontWeight: 700, color: '#f5c518', letterSpacing: 1, textTransform: 'uppercase' }}>Fresh • Tasty • Fast</small>
            </div>
          </div>

          {/* White Card Sheet */}
          <div className="csi-sheet">
            <h1 className="auth-title-clean" style={{ marginBottom: 0 }}>Welcome back!</h1>
            <p className="auth-desc" style={{ margin: '2px 0 4px' }}>Login to order your favourite food bowls</p>

            {/* Auth Mode Tabs */}
            <div className="csi-tabs">
              <button
                type="button"
                className={`csi-tab${mode === 'password' ? ' csi-tab-active' : ''}`}
                onClick={() => setMode('password')}
              >
                🔐 Password
              </button>
              <button
                type="button"
                className={`csi-tab${mode === 'email-otp' ? ' csi-tab-active' : ''}`}
                onClick={() => setMode('email-otp')}
              >
                ✉️ Gmail OTP
              </button>
              <button
                type="button"
                className={`csi-tab${mode === 'mobile-otp' ? ' csi-tab-active' : ''}`}
                onClick={() => setMode('mobile-otp')}
              >
                📱 Mobile OTP
              </button>
            </div>

            {/* Active Mode Component */}
            {mode === 'password' && <PasswordLoginSection onLogin={handleSuccessfulLogin} />}
            {mode === 'email-otp' && <EmailOtpSection onLogin={handleSuccessfulLogin} />}
            {mode === 'mobile-otp' && <MobileOtpSection onLogin={handleSuccessfulLogin} />}

            {/* OR Divider */}
            <div className="auth-divider">OR</div>

            {/* Google Sign-In */}
            <button
              type="button"
              className="auth-social"
              onClick={() => {
                authStorage.clearCustomerAuth();
                authStorage.setCustomerAuth({ email: 'google.user@gmail.com', name: 'Google User', role: 'customer' });
                n('/customer/home');
              }}
            >
              <GoogleIcon /> Continue with Google
            </button>

            {/* Sign Up Link */}
            <p className="auth-switch-text" style={{ margin: '8px 0 4px' }}>
              Need to create an account? <Link to="/customer/signup">Sign Up</Link>
            </p>

          </div>
        </main>
      </div>
    </div>
  );
}

// ── 5. CUSTOMER SIGN UP PAGE ──────────────────────────────────────────────────
export function CustomerSignUpPage() {
  const n = useNavigate();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || password.length < 6) return;
    setError('');
    setLoading(true);

    try {
      const res = await authApi.register({
        name: name.trim(),
        email: email.trim() || undefined,
        mobile: mobile.trim() || undefined,
        password,
      });

      if (res?.success && (res?.user || res?.data?.user)) {
        const user = res.user || res.data?.user;
        const token = res.token || res.data?.token;
        registerCustomer({ name: user.name, mobile: user.mobile || mobile, email: user.email });
        authStorage.setCustomerAuth({
          ...user,
          role: 'customer',
          token,
        });
        n('/customer/home');
      } else {
        setError(res?.message || 'Registration failed. Please check your information.');
      }
    } catch (err) {
      setError(err?.message || 'Unable to complete registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Frame eyebrow="SIGN UP" title="Create Account">
      <p className="auth-desc">Enter your details to create your Golden Food Bowl account.</p>
      <form onSubmit={submit} className="clean-form">
        <TextField
          icon={UserRound}
          label="Full Name"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          placeholder="e.g. Priya Sharma"
          required
        />
        <TextField
          icon={Phone}
          label="Mobile Number"
          value={mobile}
          onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
          placeholder="10-digit mobile number"
          inputMode="numeric"
          required
        />
        <TextField
          icon={Mail}
          label={<>Email Address <small>(optional)</small></>}
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          placeholder="you@example.com"
          type="email"
        />

        <label className="clean-field">
          <span className="field-label"><Lock size={15} /> Password</span>
          <div className="csi-password-field">
            <input
              className="csi-password-input"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Minimum 6 characters"
              required
              autoComplete="new-password"
            />
            <button type="button" className="csi-pw-toggle" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>

        <ErrorBox msg={error} />

        <button
          type="submit"
          className="auth-primary gold-btn"
          disabled={!name.trim() || password.length < 6 || mobile.replace(/\D/g, '').length !== 10 || loading}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {loading ? <><Loader2 size={16} className="animate-spin" /> Creating Account...</> : 'Create Account'}
        </button>
      </form>

      <div className="auth-divider">OR</div>

      <button
        type="button"
        className="auth-social"
        onClick={() => {
          registerCustomer({ name: 'Google User', mobile: '', email: 'user@gmail.com' });
          authStorage.setCustomerAuth({ email: 'user@gmail.com', name: 'Google User', role: 'customer' });
          n('/customer/home');
        }}
      >
        <GoogleIcon /> Sign up with Google
      </button>

      <p className="auth-switch-text">Already have an account? <Link to="/customer/signin">Sign In</Link></p>
    </Frame>
  );
}

// ── 6. CUSTOMER FORGOT PASSWORD ───────────────────────────────────────────────
export function CustomerForgotPasswordPage() {
  const n = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  return (
    <Frame eyebrow="ACCOUNT RECOVERY" title="Reset Password">
      <p className="auth-desc">Enter your registered email or phone to receive recovery instructions.</p>
      {!submitted ? (
        <form onSubmit={async (e) => { 
          e.preventDefault(); 
          setLoading(true); 
          setError(''); 
          try { 
            authStorage.clearCustomerAuth();
            await authApi.requestPasswordReset({ identifier }); 
            setSubmitted(true); 
          } catch (err) { 
            console.error(err); 
            setError('Failed to send reset link. Please try again.'); 
          } finally { 
            setLoading(false); 
          } 
        }} className="clean-form">
          <TextField
            icon={Mail}
            label="Email or Mobile Number"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Registered email or phone"
            required
          />
          <button type="submit" className="auth-primary gold-btn" disabled={!identifier.trim() || loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Send Password Reset Link →'}
          </button>
          {error && <p style={{ color: '#b91c1c', marginTop: 8 }}>{error}</p>}
          <p className="auth-switch-text"><Link to="/customer/signin">Back to Sign In</Link></p>
        </form>
      ) : (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <p style={{ fontSize: 13, color: '#166534', background: '#f0fdf4', padding: '12px', borderRadius: 10, border: '1px solid #bbf7d0' }}>
            ✓ If an account exists for <strong>{identifier}</strong>, recovery instructions have been sent.
          </p>
          <button type="button" className="auth-primary gold-btn" onClick={() => n('/customer/signin')} style={{ marginTop: 12 }}>
            Return to Sign In
          </button>
        </div>
      )}
    </Frame>
  );
}

export function CustomerVerifyOtpPage() {
  const n = useNavigate();
  const [otp, setOtp] = useState('');
  return (
    <Frame eyebrow="OTP VERIFICATION" title="Verify your account">
      <p>Enter the 6-digit code sent to your phone or email.</p>
      <TextField icon={Phone} label="Verification code" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter 6-digit OTP" inputMode="numeric" />
      <button type="button" className="auth-primary" disabled={otp.length !== 6} onClick={() => { authStorage.setCustomerAuth({ role: 'customer' }); n('/customer/location'); }}>Verify &amp; continue</button>
      <p className="auth-switch-text"><Link to="/customer/signin">Use another account</Link></p>
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

// ── DELIVERY PARTNER ONBOARDING ───────────────────────────────────────────────
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
