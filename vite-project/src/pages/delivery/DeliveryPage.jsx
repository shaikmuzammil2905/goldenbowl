import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  MapPin,
  PackageCheck,
  Navigation,
  Bell,
  UserRound,
  Mail,
  Phone,
  Car,
  FileText,
  CreditCard,
  Store,
  Power,
  LogOut
} from 'lucide-react'
import { useState } from 'react'
import { usePrototypeContext } from '../../context/PrototypeContext'
import { updateOrderStatus } from '../../services/prototypeStore'
import { NotificationPanel } from '../../components/notifications/NotificationPanel'
import './delivery.css'

export function DeliveryPage() {
  const { pathname } = useLocation()
  const path = pathname.replace('/delivery/', '') || 'dashboard'
  const { orders, notifications } = usePrototypeContext()

  // Find active orders assigned to current partner
  const assigned = orders.filter(
    o => o.driver === 'Rahul Kumar' && o.status !== 'DELIVERED'
  )
  const current = assigned[0] || orders[0]
  const [duty, setDuty] = useState(true)

  return (
    <div className="dp-portal">
      {/* ── STICKY TOP HEADER ── */}
      <header className="dp-header">
        <div className="dp-header-top">
          <div className="dp-driver-info">
            <div className="dp-avatar-wrap">
              <div className="dp-avatar">RK</div>
              <div className={`dp-online-dot ${duty ? '' : 'offline'}`} />
            </div>
            <div className="dp-driver-meta">
              <strong>Rahul Kumar</strong>
              <span>Partner • 4.9 ★</span>
            </div>
          </div>

          <div className="dp-header-actions">
            <button
              type="button"
              className={`dp-duty-toggle ${duty ? 'online' : 'offline'}`}
              onClick={() => setDuty(!duty)}
            >
              <Power size={13} />
              {duty ? 'ONLINE' : 'OFFLINE'}
            </button>
            <Link to="/delivery/notifications" className="dp-notif-btn" aria-label="Notifications">
              <Bell size={18} />
              {notifications.length > 0 && <span className="dp-notif-badge" />}
            </Link>
          </div>
        </div>

        {/* ── METRICS GRID ── */}
        <div className="dp-stats-grid">
          <div className="dp-stat-item">
            <span>Today's Pay</span>
            <strong>₹1,420</strong>
            <small>+₹150 Tip</small>
          </div>
          <div className="dp-stat-item">
            <span>Trips</span>
            <strong>{assigned.length + 8}</strong>
            <small>Completed</small>
          </div>
          <div className="dp-stat-item">
            <span>On-Time</span>
            <strong>100%</strong>
            <small>Target 95%</small>
          </div>
          <div className="dp-stat-item">
            <span>Acceptance</span>
            <strong>98%</strong>
            <small>High Priority</small>
          </div>
        </div>
      </header>

      {/* ── ROUTE PAGES ── */}
      <div className="dp-body">
        {path === 'dashboard' && (
          <DashboardView current={current} assigned={assigned} duty={duty} setDuty={setDuty} />
        )}
        {path === 'orders' && <OrdersView assigned={assigned} allOrders={orders} />}
        {path.startsWith('orders/') && <OrderDetailsView id={path.split('/')[1]} />}
        {path.startsWith('navigation/') && <NavigationView id={path.split('/')[1]} />}
        {path === 'gigs' && <GigsView />}
        {path === 'wallet' && <WalletView />}
        {path === 'profile' && <DeliveryProfile />}
        {path === 'notifications' && (
          <NotificationPanel notifications={notifications} role="delivery" />
        )}
      </div>
    </div>
  )
}

/* ── DASHBOARD VIEW ──────────────────────────────────────────── */
function DashboardView({ current, assigned, duty, setDuty }) {
  const advanceStatus = (order) => {
    const statusMap = {
      ASSIGNED: 'PICKED_UP',
      PICKED_UP: 'OUT_FOR_DELIVERY',
      OUT_FOR_DELIVERY: 'DELIVERED',
    }
    const next = statusMap[order.status]
    if (next) updateOrderStatus(order.id, next)
  }

  const getButtonText = (status) => {
    switch (status) {
      case 'ASSIGNED': return 'Accept & Head to Restaurant →'
      case 'PICKED_UP': return 'Order Picked Up • Start Delivery →'
      case 'OUT_FOR_DELIVERY': return 'Arrived at Customer • Mark Delivered ✓'
      case 'DELIVERED': return '✓ Delivery Completed!'
      default: return 'Advance Delivery Status →'
    }
  }

  return (
    <>
      {/* Duty Banner */}
      <div className={`dp-duty-banner ${duty ? 'online' : 'offline'}`}>
        <div className="dp-duty-banner-left">
          <div className={duty ? 'dp-pulse-dot' : ''} />
          <span>
            {duty ? 'You are Online • Receiving orders in Indiranagar' : 'You are Offline • Turn on duty to accept orders'}
          </span>
        </div>
        <button
          type="button"
          style={{ background: 'none', border: 0, fontWeight: 800, color: 'inherit', cursor: 'pointer', fontSize: 11 }}
          onClick={() => setDuty(!duty)}
        >
          {duty ? 'Pause Duty' : 'Go Online'}
        </button>
      </div>

      {/* Active Assignment Section */}
      <div className="dp-section-title">
        <h2>Active Assignment</h2>
        <span>{assigned.length} Active Task</span>
      </div>

      {current ? (
        <div className="dp-order-card">
          {/* Order Header */}
          <div className="dp-order-head">
            <div className="dp-order-id">
              <strong>#{current.id}</strong>
              <span>• {current.type || 'Standard Delivery'}</span>
            </div>
            <span className={`dp-status-pill ${current.status.toLowerCase()}`}>
              {current.status.replaceAll('_', ' ')}
            </span>
          </div>

          {/* Status Timeline */}
          <div className="dp-timeline">
            {[
              { id: 'ASSIGNED', label: 'Assigned' },
              { id: 'PICKED_UP', label: 'Picked Up' },
              { id: 'OUT_FOR_DELIVERY', label: 'On Way' },
              { id: 'DELIVERED', label: 'Delivered' },
            ].map((step, idx) => {
              const orderSteps = ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED']
              const currentIdx = orderSteps.indexOf(current.status)
              const isDone = currentIdx > idx
              const isActive = currentIdx === idx
              return (
                <div key={step.id} className={`dp-timeline-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
                  <div className="dp-timeline-bar" />
                  <span>{step.label}</span>
                </div>
              )
            })}
          </div>

          {/* Restaurant Pickup Block */}
          <div className="dp-loc-block">
            <div className="dp-loc-icon store">
              <Store size={18} />
            </div>
            <div className="dp-loc-info">
              <span className="dp-loc-tag store">Pickup Location</span>
              <strong>{current.branch || 'Golden Food Bowl - Indiranagar'}</strong>
              <p>100ft Road, 12th Main, Indiranagar • 1.2 km away</p>
            </div>
            <div className="dp-loc-actions">
              <a href="tel:9876543210" className="dp-icon-btn" title="Call Store">
                <Phone size={15} />
              </a>
            </div>
          </div>

          {/* Customer Drop Block */}
          <div className="dp-loc-block">
            <div className="dp-loc-icon customer">
              <MapPin size={18} />
            </div>
            <div className="dp-loc-info">
              <span className="dp-loc-tag customer">Drop-off Location</span>
              <strong>{current.customer || 'Priya Sharma'}</strong>
              <p>42, 5th Main Road, Indiranagar • 2.3 km from store</p>
            </div>
            <div className="dp-loc-actions">
              <a href="tel:9876543210" className="dp-icon-btn" title="Call Customer">
                <Phone size={15} />
              </a>
            </div>
          </div>

          {/* Trip Meta Grid */}
          <div className="dp-order-meta-grid">
            <div className="dp-meta-cell">
              <span>Estimated Payout</span>
              <strong>₹120 <small style={{ color: '#16a34a' }}>(Base ₹85 + Surge ₹35)</small></strong>
            </div>
            <div className="dp-meta-cell">
              <span>Order Value</span>
              <strong>₹{current.total} • Prepaid</strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="dp-action-stack">
            {current.status !== 'DELIVERED' ? (
              <button
                type="button"
                className="dp-advance-btn"
                onClick={() => advanceStatus(current)}
              >
                {getButtonText(current.status)}
              </button>
            ) : (
              <div style={{ textAlign: 'center', padding: '10px', color: '#16a34a', fontWeight: 800 }}>
                ✓ Order Completed! Great job.
              </div>
            )}

            <Link to={`/delivery/navigation/${current.id}`} className="dp-nav-btn">
              <Navigation size={16} /> Open GPS Navigation Map
            </Link>
          </div>
        </div>
      ) : (
        <div className="dp-order-card" style={{ textAlign: 'center', padding: '30px' }}>
          <PackageCheck size={40} style={{ color: '#ca8a04', margin: 'auto' }} />
          <h3 style={{ margin: '10px 0 4px', fontSize: 16 }}>No Active Order</h3>
          <p style={{ margin: 0, fontSize: 11, color: '#78716c' }}>
            You are online and in high-demand zone. New orders will appear here automatically.
          </p>
        </div>
      )}
    </>
  )
}

/* ── ORDERS HUB VIEW ─────────────────────────────────────────── */
function OrdersView({ allOrders }) {
  const [tab, setTab] = useState('active') // 'active' | 'completed'

  const activeOrders = allOrders.filter(o => o.status !== 'DELIVERED')
  const completedOrders = allOrders.filter(o => o.status === 'DELIVERED')
  const displayed = tab === 'active' ? activeOrders : completedOrders

  return (
    <>
      <div className="dp-section-title">
        <h2>Assigned Orders</h2>
        <span>{allOrders.length} Total</span>
      </div>

      <div className="dp-orders-tabs">
        <button
          type="button"
          className={`dp-orders-tab ${tab === 'active' ? 'active' : ''}`}
          onClick={() => setTab('active')}
        >
          Active Orders ({activeOrders.length})
        </button>
        <button
          type="button"
          className={`dp-orders-tab ${tab === 'completed' ? 'active' : ''}`}
          onClick={() => setTab('completed')}
        >
          Completed Today ({completedOrders.length})
        </button>
      </div>

      <div className="dp-orders-list">
        {displayed.length > 0 ? (
          displayed.map(o => (
            <Link key={o.id} to={`/delivery/orders/${o.id}`} className="dp-list-order-card">
              <div className="dp-list-order-row">
                <span className="dp-list-order-id">#{o.id}</span>
                <span className={`dp-status-pill ${o.status.toLowerCase()}`}>
                  {o.status.replaceAll('_', ' ')}
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#78716c', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div><strong>Store:</strong> {o.branch}</div>
                <div><strong>Customer:</strong> {o.customer} • ₹{o.total}</div>
              </div>
              <div className="dp-list-order-row" style={{ paddingTop: 6, borderTop: '1px dashed #eee4d2' }}>
                <span style={{ fontSize: 10, color: '#78716c' }}>Payout</span>
                <span className="dp-list-order-pay">₹120</span>
              </div>
            </Link>
          ))
        ) : (
          <p style={{ textAlign: 'center', color: '#78716c', padding: 20 }}>
            No {tab} orders to display.
          </p>
        )}
      </div>
    </>
  )
}

/* ── ORDER DETAILS VIEW ──────────────────────────────────────── */
function OrderDetailsView({ id }) {
  const { orders } = usePrototypeContext()
  const order = orders.find(o => o.id === id) || orders[0]
  const navigate = useNavigate()

  if (!order) return <p>Order not found.</p>

  const advanceStatus = () => {
    const statusMap = {
      ASSIGNED: 'PICKED_UP',
      PICKED_UP: 'OUT_FOR_DELIVERY',
      OUT_FOR_DELIVERY: 'DELIVERED',
    }
    const next = statusMap[order.status]
    if (next) updateOrderStatus(order.id, next)
  }

  return (
    <>
      <button
        type="button"
        style={{ background: 'none', border: 0, color: '#ca8a04', fontWeight: 800, cursor: 'pointer', fontSize: 12 }}
        onClick={() => navigate('/delivery/dashboard')}
      >
        ← Back to Dashboard
      </button>

      <div className="dp-order-card">
        <div className="dp-order-head">
          <div className="dp-order-id">
            <strong>Order #{order.id}</strong>
          </div>
          <span className={`dp-status-pill ${order.status.toLowerCase()}`}>
            {order.status.replaceAll('_', ' ')}
          </span>
        </div>

        <div className="dp-loc-block">
          <div className="dp-loc-icon store"><Store size={18} /></div>
          <div className="dp-loc-info">
            <span className="dp-loc-tag store">Pickup</span>
            <strong>{order.branch}</strong>
            <p>12th Main Road, Indiranagar</p>
          </div>
        </div>

        <div className="dp-loc-block">
          <div className="dp-loc-icon customer"><MapPin size={18} /></div>
          <div className="dp-loc-info">
            <span className="dp-loc-tag customer">Drop-off</span>
            <strong>{order.customer}</strong>
            <p>42, 5th Main Road, Bengaluru</p>
          </div>
        </div>

        <div className="dp-action-stack">
          {order.status !== 'DELIVERED' && (
            <button type="button" className="dp-advance-btn" onClick={advanceStatus}>
              Advance Order Status →
            </button>
          )}
          <Link to={`/delivery/navigation/${order.id}`} className="dp-nav-btn">
            <Navigation size={16} /> Open Navigation
          </Link>
        </div>
      </div>
    </>
  )
}

/* ── NAVIGATION MAP VIEW ─────────────────────────────────────── */
function NavigationView() {
  const navigate = useNavigate()

  return (
    <div className="dp-nav-container">
      <button
        type="button"
        style={{ background: 'none', border: 0, color: '#ca8a04', fontWeight: 800, cursor: 'pointer', fontSize: 12, width: 'fit-content' }}
        onClick={() => navigate('/delivery/dashboard')}
      >
        ← Back to Dashboard
      </button>

      <div className="dp-nav-hero-banner">
        <div>
          <h1>GPS Navigation</h1>
          <p>Live route tracking & turn-by-turn guidance</p>
        </div>
        <Navigation size={28} style={{ color: '#f5c518' }} />
      </div>

      <div className="dp-map-card">
        <div className="dp-map-turn-instruction">
          <span className="dp-turn-icon">↪</span>
          <div className="dp-turn-text">
            <strong>In 150m, turn right onto 100ft Road</strong>
            <span>Then head straight for 1.2 km</span>
          </div>
        </div>

        <div className="dp-map-track">
          <div className="dp-map-pin">
            <span>📍</span>
            <small>Store</small>
          </div>
          <span className="dp-scooter-anim">🛵 ─── 💨</span>
          <div className="dp-map-pin">
            <span>🏠</span>
            <small>Customer</small>
          </div>
        </div>
      </div>

      <div className="dp-quick-contacts">
        <a href="tel:9876543210" className="dp-contact-btn">
          <Phone size={14} /> Call Customer
        </a>
        <a href="tel:9876543210" className="dp-contact-btn">
          <Store size={14} /> Call Restaurant
        </a>
      </div>
    </div>
  )
}

/* ── PARTNER PROFILE VIEW ────────────────────────────────────── */
function DeliveryProfile() {
  const navigate = useNavigate()
  const saved = JSON.parse(localStorage.getItem('bowlDeliveryOnboarding') || '{}')
  const [editing, setEditing] = useState(false)
  const [data, setData] = useState({
    name: saved.name || 'Rahul Kumar',
    email: saved.email || 'partner@example.com',
    mobile: saved.mobile || '9876543210',
    vehicle: saved.vehicle || 'Bike',
    vehicleNumber: saved.vehicleNumber || 'KA01AB1234',
    licence: saved.licence || 'DL-XXXX-1234',
    idProof: saved.idProof || 'ID-XXXX',
    bank: saved.bank || 'Account details',
    upi: saved.upi || 'rahul@upi'
  })

  const set = (k, v) => setData(d => ({ ...d, [k]: v }))
  const save = () => {
    localStorage.setItem('bowlDeliveryOnboarding', JSON.stringify({ ...saved, ...data }))
    setEditing(false)
  }

  const signOut = () => {
    localStorage.removeItem('bowlDeliveryOnboarding')
    localStorage.removeItem('bowlDeliveryLocation')
    sessionStorage.removeItem('bowlDeliveryMobile')
    sessionStorage.removeItem('bowlDeliveryAuth')
    navigate('/delivery/signin', { replace: true })
  }

  return (
    <div className="dp-profile-card">
      <div className="dp-profile-top">
        <div className="dp-profile-avatar">RK</div>
        <div className="dp-profile-info">
          <h1>{data.name}</h1>
          <p>Verified Bowl Delivery Partner</p>
          <div className="dp-badge-row">
            <span className="dp-badge-chip">✓ Verified Partner</span>
            <span className="dp-badge-chip" style={{ background: '#fffdf0', color: '#854d0e', borderColor: '#fde047' }}>
              ★ 4.9 Rating
            </span>
          </div>
        </div>
      </div>

      <div className="dp-section-title" style={{ marginTop: 4 }}>
        <h2 style={{ fontSize: 13 }}>Partner Documents & Details</h2>
        <button
          type="button"
          style={{ background: 'none', border: 0, color: '#ca8a04', fontWeight: 800, cursor: 'pointer', fontSize: 11 }}
          onClick={() => setEditing(!editing)}
        >
          {editing ? 'Cancel' : 'Edit Info'}
        </button>
      </div>

      <div className="dp-profile-grid">
        <ProfileField icon={UserRound} label="Full Name" value={data.name} edit={editing} onChange={v => set('name', v)} />
        <ProfileField icon={Mail} label="Email Address" value={data.email} edit={editing} onChange={v => set('email', v)} />
        <ProfileField icon={Phone} label="Mobile Number" value={data.mobile} edit={editing} onChange={v => set('mobile', v)} />
        <ProfileField icon={Car} label="Vehicle Details" value={`${data.vehicle} • ${data.vehicleNumber}`} edit={editing} onChange={v => set('vehicleNumber', v)} />
        <ProfileField icon={FileText} label="Driving Licence" value={data.licence} edit={editing} onChange={v => set('licence', v)} />
        <ProfileField icon={FileText} label="Identity Proof (Aadhaar)" value={data.idProof} edit={editing} onChange={v => set('idProof', v)} />
        <ProfileField icon={CreditCard} label="Bank Account" value={data.bank} edit={editing} onChange={v => set('bank', v)} />
        <ProfileField icon={CreditCard} label="UPI Payout ID" value={data.upi} edit={editing} onChange={v => set('upi', v)} />
      </div>

      {editing ? (
        <button type="button" className="dp-advance-btn" onClick={save}>
          Save Profile Changes
        </button>
      ) : (
        <button
          type="button"
          className="dp-nav-btn"
          style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#dc2626', marginTop: 8 }}
          onClick={signOut}
        >
          <LogOut size={16} /> Sign Out of Partner Portal
        </button>
      )}
    </div>
  )
}

function ProfileField({ icon: Icon, label, value, edit, onChange }) {
  return (
    <div className="dp-field-row">
      <Icon size={16} />
      <div>
        <span>{label}</span>
        {edit ? (
          <input value={value} onChange={e => onChange(e.target.value)} />
        ) : (
          <strong>{value}</strong>
        )}
      </div>
    </div>
  )
}

/* ── GIGS / SHIFTS & INCENTIVES VIEW ─────────────────────────── */
function GigsView() {
  const [reserved, setReserved] = useState({ 1: true, 2: true, 3: false, 4: false })

  const toggleGig = id => {
    setReserved(r => ({ ...r, [id]: !r[id] }))
  }

  const shifts = [
    { id: 1, title: 'Lunch Peak Shift', time: '12:00 PM – 03:30 PM', bonus: '+₹250 Peak Bonus', area: 'Indiranagar Zone' },
    { id: 2, title: 'Dinner Peak Shift', time: '07:00 PM – 11:00 PM', bonus: '+₹350 Peak Bonus', area: 'Koramangala Zone' },
    { id: 3, title: 'Late Night Surge', time: '11:00 PM – 02:00 AM', bonus: '+₹50 Extra / Order', area: 'Central Bengaluru' },
    { id: 4, title: 'Breakfast Shift (Tomorrow)', time: '08:00 AM – 11:30 AM', bonus: '+₹180 Morning Bonus', area: 'HSR Layout Zone' }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="dp-section-title">
        <h2>Gigs &amp; Shift Slots</h2>
        <span>Indiranagar Zone</span>
      </div>

      {/* Incentive Meter */}
      <div className="dp-incentive-meter">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#f5c518', fontWeight: 800, textTransform: 'uppercase' }}>
            ⚡ Daily Incentive Target
          </span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>
            8 / 12 Orders Done
          </span>
        </div>
        <strong style={{ fontSize: 16, fontWeight: 900, color: '#ffffff' }}>
          Complete 4 more orders for ₹400 Bonus!
        </strong>
        <div className="dp-incentive-track">
          <div className="dp-incentive-fill" style={{ width: '66%' }} />
        </div>
      </div>

      <div className="dp-section-title">
        <h2 style={{ fontSize: 14 }}>Available Shift Slots</h2>
      </div>

      {shifts.map(s => {
        const isBooked = reserved[s.id]
        return (
          <div key={s.id} className="dp-gig-card">
            <div className="dp-gig-head">
              <div>
                <strong style={{ display: 'block', fontSize: 14, fontWeight: 900, color: '#1c1917' }}>{s.title}</strong>
                <span className="dp-gig-time">{s.time}</span>
              </div>
              <span className="dp-gig-bonus">{s.bonus}</span>
            </div>
            <div style={{ fontSize: 11, color: '#78716c' }}>
              📍 {s.area} • Guaranteed minimum 1.5x surge rate
            </div>
            <button
              type="button"
              className={`dp-gig-reserve-btn ${isBooked ? 'reserved' : ''}`}
              onClick={() => toggleGig(s.id)}
            >
              {isBooked ? '✓ Shift Slot Reserved' : 'Book Gig Slot →'}
            </button>
          </div>
        )
      })}
    </div>
  )
}

/* ── WALLET & EARNINGS VIEW ─────────────────────────────────── */
function WalletView() {
  const [balance, setBalance] = useState(2840.50)
  const [withdrawn, setWithdrawn] = useState(false)

  const handleWithdraw = () => {
    setBalance(0)
    setWithdrawn(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="dp-section-title">
        <h2>Partner Wallet</h2>
        <span>Instant Payouts</span>
      </div>

      {/* Balance Card */}
      <div className="dp-wallet-balance-card">
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Available Balance
        </span>
        <div className="dp-wallet-amount">
          ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
        <button
          type="button"
          className="dp-withdraw-btn"
          disabled={balance === 0}
          onClick={handleWithdraw}
        >
          {withdrawn ? '✓ Transferred to HDFC Bank (****4829)' : '💸 Instant Payout to Bank →'}
        </button>
      </div>

      {/* Linked Bank & Payout Info */}
      <div className="dp-order-card" style={{ gap: 8 }}>
        <span className="dp-loc-tag store">Linked Payout Account</span>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong style={{ fontSize: 13, display: 'block', color: '#1c1917' }}>HDFC Bank •••• 4829</strong>
            <span style={{ fontSize: 10, color: '#78716c' }}>UPI ID: rahul@upi</span>
          </div>
          <span className="dp-badge-chip">✓ Active Account</span>
        </div>
      </div>

      {/* Earnings Breakdown */}
      <div className="dp-section-title">
        <h2 style={{ fontSize: 14 }}>Weekly Earnings Breakdown</h2>
      </div>

      <div className="dp-order-meta-grid">
        <div className="dp-meta-cell">
          <span>Trip Earnings</span>
          <strong>₹2,240.00</strong>
        </div>
        <div className="dp-meta-cell">
          <span>Surge &amp; Bonuses</span>
          <strong>₹450.00</strong>
        </div>
        <div className="dp-meta-cell">
          <span>Customer Tips</span>
          <strong>₹150.50</strong>
        </div>
        <div className="dp-meta-cell">
          <span>Onboarding Fee</span>
          <strong style={{ color: '#16a34a' }}>✓ Paid ₹499</strong>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="dp-section-title">
        <h2 style={{ fontSize: 14 }}>Recent Transactions</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {withdrawn && (
          <div className="dp-tx-item">
            <div>
              <strong style={{ display: 'block', fontSize: 12 }}>Instant Withdrawal to HDFC Bank</strong>
              <span style={{ fontSize: 9.5, color: '#78716c' }}>Just now • Account ****4829</span>
            </div>
            <span className="dp-tx-minus">-₹2,840.50</span>
          </div>
        )}
        <div className="dp-tx-item">
          <div>
            <strong style={{ display: 'block', fontSize: 12 }}>Order #BWL10301 Trip Pay</strong>
            <span style={{ fontSize: 9.5, color: '#78716c' }}>Today 8:15 PM • Base + Surge</span>
          </div>
          <span className="dp-tx-plus">+₹120.00</span>
        </div>
        <div className="dp-tx-item">
          <div>
            <strong style={{ display: 'block', fontSize: 12 }}>Customer Tip (Priya S.)</strong>
            <span style={{ fontSize: 9.5, color: '#78716c' }}>Today 7:22 PM • Tip Bonus</span>
          </div>
          <span className="dp-tx-plus">+₹50.00</span>
        </div>
        <div className="dp-tx-item">
          <div>
            <strong style={{ display: 'block', fontSize: 12 }}>Dinner Peak Shift Bonus</strong>
            <span style={{ fontSize: 9.5, color: '#78716c' }}>Today 7:00 PM • Peak Surge</span>
          </div>
          <span className="dp-tx-plus">+₹350.00</span>
        </div>
        <div className="dp-tx-item">
          <div>
            <strong style={{ display: 'block', fontSize: 12 }}>Order #BWL10300 Trip Pay</strong>
            <span style={{ fontSize: 9.5, color: '#78716c' }}>Today 6:40 PM • Base Pay</span>
          </div>
          <span className="dp-tx-plus">+₹85.00</span>
        </div>
      </div>
    </div>
  )
}


