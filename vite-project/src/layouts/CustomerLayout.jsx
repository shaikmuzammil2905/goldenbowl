import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, ClipboardList, ShoppingCart, Tag, Menu, UserRound, MapPin, LocateFixed, Search, Smartphone, Download } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { authStorage } from '../services/storage/authStorage';
import { AppDownloadModal } from '../components/common/AppDownloadModal';
import { CustomerFooter } from '../components/common/CustomerFooter';
import '../styles/customer-polish.css';
import '../customer-panel-enhancements.css';
import '../customer-mobile-final.css';
import '../customer-header-mobile.css';
import '../customer-layout-final.css';
import '../customer-search-veg-final.css';

const BOWL_LOGO = 'https://res.cloudinary.com/dwmjz9csc/image/upload/v1787120716/image-removebg-preview_e1wfil.png';

export function MobileStatusBar() {
  return null;
}

function HeaderLocation() {
  const [location, setLocation] = useState(() => localStorage.getItem('goldbowl_current_location') || 'Detecting...');
  const [loading, setLoading] = useState(false);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation('Unavailable');
      return;
    }
    setLoading(true);
    setLocation('Detecting...');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`);
          const data = await response.json();
          const a = data.address || {};
          const place = a.suburb || a.neighbourhood || a.city_district || a.city || a.town || a.village || 'Current location';
          const area = a.city || a.town || a.village;
          const label = area && area !== place ? `${place}, ${area}` : place;
          setLocation(label);
          localStorage.setItem('goldbowl_current_location', label);
        } catch {
          const label = `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
          setLocation(label);
          localStorage.setItem('goldbowl_current_location', label);
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLocation('Unable to detect');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!localStorage.getItem('goldbowl_current_location')) detectLocation();
    }, 0);
    return () => clearTimeout(timer);
  }, [detectLocation]);

  return (
    <div className="customer-header-location" title={location}>
      <MapPin size={16} fill="currentColor" />
      <div className="customer-header-location-copy">
        <span>Present Location</span>
        <strong>{location}</strong>
      </div>
      <button type="button" onClick={detectLocation} disabled={loading} aria-label="Detect present location">
        <LocateFixed size={15} />
      </button>
    </div>
  );
}

export function CustomerHeader({ onProfile, onOpenAppModal }) {
  return (
    <div className="goldbowl-top-header-group">
      <header className="goldbowl-customer-header">
        <NavLink to="/customer/home" className="goldbowl-brand" aria-label="Golden Food Bowl home">
          <img src={BOWL_LOGO} alt="Golden Food Bowl" />
          <div className="brand-title-wrap">
            <strong className="header-company-name" aria-label="Golden Food Bowl">
              <span className="brand-word brand-word-golden">Golden</span>
              <span className="brand-word brand-word-food">Food</span>
              <span className="brand-word brand-word-bowl">Bowl</span>
            </strong>
            <span className="header-company-tagline">Fresh • Tasty • Fast</span>
          </div>
        </NavLink>
        <HeaderLocation />
        <nav className="desktop-header-nav" aria-label="Desktop customer navigation">
          <NavLink to="/customer/home" className={({ isActive }) => (isActive ? 'active' : '')}>
            <Home size={18} />
            <span>Home</span>
          </NavLink>
          <NavLink to="/customer/search" className={({ isActive }) => (isActive ? 'active' : '')}>
            <Search size={18} />
            <span>Menu</span>
          </NavLink>
          <NavLink to="/customer/offers" className={({ isActive }) => (isActive ? 'active' : '')}>
            <Tag size={18} />
            <span>Offers</span>
          </NavLink>
          <NavLink to="/customer/orders" className={({ isActive }) => (isActive ? 'active' : '')}>
            <ClipboardList size={18} />
            <span>Orders</span>
          </NavLink>
          <NavLink to="/customer/cart" className={({ isActive }) => (isActive ? 'active' : '')}>
            <ShoppingCart size={18} />
            <span>Cart</span>
          </NavLink>
          <button
            type="button"
            onClick={onOpenAppModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 999,
              background: 'linear-gradient(135deg, #1c1208 0%, #3a2610 100%)',
              color: '#f5c518',
              border: '1px solid #b4811d',
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
              marginLeft: 6
            }}
          >
            <Smartphone size={14} /> Get App
          </button>
        </nav>
        <button type="button" className="profile-button" aria-label="Profile or sign in" onClick={onProfile}>
          <UserRound size={23} />
        </button>
      </header>
    </div>
  );
}

export function CustomerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAppModal, setShowAppModal] = useState(false);
  const isCheckout = location.pathname === '/customer/checkout';
  const links = [
    ['home', 'Home', Home],
    ['orders', 'Orders', ClipboardList],
    ['cart', 'Cart', ShoppingCart],
    ['offers', 'Offers', Tag],
    ['profile', 'More', Menu],
  ];
  const handleProfile = () => {
    const authenticated = authStorage.getCustomerAuth();
    navigate(authenticated ? '/customer/profile' : '/customer/signin');
  };

  return (
    <div className={`mobile-prototype-frame customer-prototype-frame ${isCheckout ? 'checkout-page' : ''}`}>
      <div className="mobile-app-shell customer-app-shell">
        <CustomerHeader onProfile={handleProfile} onOpenAppModal={() => setShowAppModal(true)} />
        <main className="mobile-route-content customer-route-content">
          <Outlet />
          <CustomerFooter onOpenAppModal={() => setShowAppModal(true)} />
        </main>

        <AppDownloadModal isOpen={showAppModal} onClose={() => setShowAppModal(false)} />

        <nav className="customer-bottom-nav" aria-label="Customer navigation">
          {links.map(([to, label, Icon]) => (
            <NavLink key={to} to={`/customer/${to}`} className={({ isActive }) => (isActive ? 'active' : '')}>
              <Icon size={23} strokeWidth={2.2} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}