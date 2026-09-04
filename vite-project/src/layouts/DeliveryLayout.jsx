import { useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, PackageCheck, Calendar, Wallet, User } from 'lucide-react'
import { MobileStatusBar } from '../layouts/CustomerLayout'

export function DeliveryLayout() {
  const navigate = useNavigate()
  
  useEffect(() => {
    const handleAuthExpired = () => {
      import('../services/storage/authStorage').then(m => m.authStorage.clearDeliveryAuth())
      navigate('/delivery/signin', { replace: true })
    }
    window.addEventListener('auth-expired', handleAuthExpired)
    return () => window.removeEventListener('auth-expired', handleAuthExpired)
  }, [navigate])
  
  const links = [
    ['dashboard', 'Home', LayoutDashboard],
    ['orders', 'Orders', PackageCheck],
    ['gigs', 'Gigs', Calendar],
    ['wallet', 'Wallet', Wallet],
    ['profile', 'Profile', User],
  ]

  return (
    <div className="mobile-prototype-frame">
      <div className="mobile-app-shell">
        <MobileStatusBar />
        <main className="mobile-route-content">
          <Outlet />
        </main>
        <nav className="bottom-nav">
          {links.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={`/delivery/${to}`}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
