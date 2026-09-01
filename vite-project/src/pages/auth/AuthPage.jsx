import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Phone, UserRound, ShieldCheck, CreditCard } from 'lucide-react';
import { registerCustomer, registerDeliveryPartner } from '../../services/prototypeStore';

function GoogleIcon() {
  return <span aria-hidden="true" style={{ fontWeight: 800, fontSize: 18 }}>G</span>;
}

export function AuthPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get('mode') || 'signup');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const validMobile = /^\d{10}$/.test(mobile);
  const submit = (e) => {
    e.preventDefault();
    if (mode === 'signup') {
      if (!name.trim() || !validMobile) return;
      registerCustomer({ name: name.trim(), mobile, email });
    } else if (!validMobile) return;
    navigate('/customer/home');
  };
  const social = (provider) => {
    registerCustomer({ name: name.trim() || `${provider} Customer`, mobile: mobile || '9999999999', email, provider });
    navigate('/customer/home');
  };
  return (
    <main className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-brand">🥣<span>GOLDEN FOOD BOWL</span></div>
        <span className="eyebrow">CUSTOMER ACCOUNT</span>
        <h1>{mode === 'signup' ? 'Welcome to Bowl' : 'Welcome back'}</h1>
        <p>{mode === 'signup' ? 'Create your account and start ordering fresh bowls.' : 'Sign in to continue your Bowl journey.'}</p>
        {mode === 'signup' && <label><UserRound />Full name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" required /></label>}
        <label><Phone />Mobile number<input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="10-digit mobile number" inputMode="numeric" maxLength={10} required /></label>
        {mode === 'signup' && <label><Mail />Email <small>optional</small><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" /></label>}
        <button className="auth-primary" type="submit">{mode === 'signup' ? 'Create account' : 'Send OTP'}</button>
        <div className="auth-divider"><span>or continue with</span></div>
        <button type="button" className="auth-social" onClick={() => social('google')}><GoogleIcon /> Continue with Google</button>
        <button type="button" className="auth-social" onClick={() => social('email')}><Mail /> Continue with Email</button>
        <button type="button" className="auth-switch" onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}>{mode === 'signup' ? 'Already have an account? Sign in' : 'New to Bowl? Create an account'}</button>
      </form>
    </main>
  );
}

export function DeliveryOnboardingPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [vehicle, setVehicle] = useState('Bike');
  const [docs, setDocs] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feePaid, setFeePaid] = useState(false);
  const submit = () => {
    registerDeliveryPartner({ name: name.trim(), mobile, vehicle, documentsVerified: docs, feeStatus: feePaid ? 'PAID' : 'PENDING' });
    setSubmitted(true);
  };
  if (submitted) return (
    <main className="auth-screen">
      <div className="auth-card">
        <ShieldCheck className="auth-success" />
        <span className="eyebrow">APPLICATION SUBMITTED</span>
        <h1>Verification in progress</h1>
        <p>Your partner profile is queued for admin verification. Partner fee: ₹499.</p>
        <div className="auth-summary"><span>Identity documents <b>{docs ? 'Submitted' : 'Pending'}</b></span><span>Onboarding fee <b>{feePaid ? 'Paid' : 'Pending'}</b></span><span>Vehicle <b>{vehicle}</b></span></div>
        <Link className="auth-primary" to="/delivery/dashboard">Go to delivery preview</Link>
      </div>
    </main>
  );
  return (
    <main className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">🛵<span>BOWL DELIVERY PARTNER</span></div>
        <div className="auth-progress"><span className={step >= 1 ? 'active' : ''}>1</span><i /><span className={step >= 2 ? 'active' : ''}>2</span><i /><span className={step >= 3 ? 'active' : ''}>3</span></div>
        {step === 1 && <><span className="eyebrow">PARTNER SIGNUP</span><h1>Become a Bowl delivery partner</h1><p>Complete your profile to start accepting delivery orders.</p><label><UserRound />Full name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" /></label><label><Phone />Mobile<input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="10-digit mobile number" inputMode="numeric" maxLength={10} /></label><button type="button" className="auth-primary" disabled={!name.trim() || !/^\d{10}$/.test(mobile)} onClick={() => setStep(2)}>Continue</button></>}
        {step === 2 && <><span className="eyebrow">VERIFICATION</span><h1>Verify your partner profile</h1><p>Prototype verification checklist for identity and vehicle details.</p><label>Vehicle type<select value={vehicle} onChange={(e) => setVehicle(e.target.value)}><option>Bike</option><option>Scooter</option><option>Car</option></select></label><label className="auth-check"><input type="checkbox" checked={docs} onChange={(e) => setDocs(e.target.checked)} /> I have submitted valid identity and driving documents</label><button type="button" className="auth-primary" disabled={!docs} onClick={() => setStep(3)}>Continue to fee</button></>}
        {step === 3 && <><span className="eyebrow">ONBOARDING FEE</span><h1>Complete partner onboarding</h1><div className="fee-card"><CreditCard /><div><strong>₹499</strong><span>One-time onboarding verification fee</span></div></div><p>Prototype payment is simulated. Production will connect this step to the payment gateway.</p><button type="button" className="auth-social" onClick={() => setFeePaid(true)}>{feePaid ? '✓ Fee marked paid' : 'Pay ₹499'}</button><button type="button" className="auth-primary" disabled={!feePaid} onClick={submit}>Submit for verification</button></>}
      </div>
    </main>
  );
}
