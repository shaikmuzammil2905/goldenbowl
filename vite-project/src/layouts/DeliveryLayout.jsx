import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, PackageCheck, Calendar, Wallet, User } from 'lucide-react'
import { MobileStatusBar } from '../layouts/CustomerLayout'

export function DeliveryLayout() {
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
