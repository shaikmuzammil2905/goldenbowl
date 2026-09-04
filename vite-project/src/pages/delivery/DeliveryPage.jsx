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
  LogOut,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../../services/api/apiClient'
import { authStorage } from '../../services/storage/authStorage'
import { NotificationPanel } from '../../components/notifications/NotificationPanel'
import './delivery.css'

export function DeliveryPage() {
  const { pathname } = useLocation()
  const path = pathname.replace('/delivery/', '') || 'dashboard'
  const navigate = useNavigate()

  const [partnerData, setPartnerData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [duty, setDuty] = useState(true)
  const [notifications, setNotifications] = useState([])

  const deliveryUser = authStorage.getDeliveryUser()

  const loadDashboard = useCallback(async () => {
    try {
      const res = await apiClient('/delivery/me')
      if (res && res.success && res.data) {
        setPartnerData(res.data)
      }
    } catch (err) {
      console.error('Failed to load delivery partner dashboard:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Check if delivery partner is logged in
    if (!authStorage.getDeliveryAuth()) {
      navigate('/delivery/signin', { replace: true })
      return
    }
    loadDashboard()
  }, [loadDashboard, navigate, pathname])

  // Derive authenticated partner attributes
  const partner = partnerData?.partner || {}
  const name = partner.name || deliveryUser?.name || 'Delivery Partner'
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'DP'

  const stats = partnerData?.stats || {}
  const todayPay = stats.todayPay !== undefined ? stats.todayPay : Number(partner.earnings || 0)
  const trips = stats.trips !== undefined ? stats.trips : Number(partner.trips || 0)
  const onTimeRate = stats.onTimeRate !== undefined ? stats.onTimeRate : (trips > 0 ? 100 : 0)
  const acceptanceRate = stats.acceptanceRate !== undefined ? stats.acceptanceRate : (trips > 0 ? 100 : 0)
  const rating = partner.rating ? Number(partner.rating).toFixed(1) : '5.0'

  // Orders scoping
  const assigned = partnerData?.activeOrders || []
  const completed = partnerData?.completedOrders || []
  const allOrders = partnerData?.assignedOrders || []
  const current = assigned[0] || null

  return (
    <div className="dp-portal">
      {/* ── STICKY TOP HEADER ── */}
      <header className="dp-header">
        <div className="dp-header-top">
          <div className="dp-driver-info">
            <div className="dp-avatar-wrap">
              <div className="dp-avatar">{initials}</div>
              <div className={`dp-online-dot ${duty ? '' : 'offline'}`} />
            </div>
            <div className="dp-driver-meta">
              <strong>{name}</strong>
              <span>Partner • {rating} ★</span>
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
            <button
              type="button"
              className="dp-notif-btn"
              onClick={loadDashboard}
              title="Refresh Dashboard Data"
              style={{ background: 'none', border: 'none', color: '#78716c', cursor: 'pointer' }}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <Link to="/delivery/notifications" className="dp-notif-btn" aria-label="Notifications">
              <Bell size={18} />
              {notifications.length > 0 && <span className="dp-notif-badge" />}
            </Link>
          </div>
        </div>

        {/* ── METRICS GRID (DYNAMICALLY SCOPED) ── */}
        <div className="dp-stats-grid">
          <div className="dp-stat-item">
            <span>Today's Pay</span>
            <strong>₹{todayPay.toLocaleString('en-IN')}</strong>
            <small>{todayPay > 0 ? '+ Tips Included' : 'No Trips Yet'}</small>
          </div>
          <div className="dp-stat-item">
            <span>Trips</span>
            <strong>{trips}</strong>
            <small>{trips > 0 ? `${completed.length} Completed` : '0 Completed'}</small>
          </div>
          <div className="dp-stat-item">
            <span>On-Time</span>
            <strong>{onTimeRate}%</strong>
            <small>{trips > 0 ? 'Target 95%' : 'No Trips Yet'}</small>
          </div>
          <div className="dp-stat-item">
            <span>Acceptance</span>
            <strong>{acceptanceRate}%</strong>
            <small>{duty ? 'Active Duty' : 'On Break'}</small>
          </div>
        </div>
      </header>

      {/* ── ROUTE PAGES ── */}
      <div className="dp-body">
        {loading && !partnerData ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#78716c' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: '#ca8a04' }} />
            <p style={{ fontSize: 13, fontWeight: 600 }}>Loading partner account...</p>
          </div>
        ) : (
          <>
            {path === 'dashboard' && (
              <DashboardView
                current={current}
                assigned={assigned}
                duty={duty}
                setDuty={setDuty}
                onRefresh={loadDashboard}
              />
            )}
            {path === 'orders' && (
              <OrdersView
                assigned={assigned}
                completed={completed}
                allOrders={allOrders}
                onRefresh={loadDashboard}
              />
            )}
            {path.startsWith('orders/') && (
              <OrderDetailsView
                id={path.split('/')[1]}
                allOrders={allOrders}
                onRefresh={loadDashboard}
              />
            )}
            {path.startsWith('navigation/') && (
              <NavigationView
                id={path.split('/')[1]}
                allOrders={allOrders}
              />
            )}
            {path === 'gigs' && <GigsView trips={trips} completedCount={completed.length} />}
            {path === 'wallet' && (
              <WalletView
                partner={partner}
                completed={completed}
                todayPay={todayPay}
              />
            )}
            {path === 'profile' && (
              <DeliveryProfile
                partner={partner}
                deliveryUser={deliveryUser}
                onRefresh={loadDashboard}
              />
            )}
            {path === 'notifications' && (
              <NotificationPanel notifications={notifications} role="delivery" />
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* ── DASHBOARD VIEW ──────────────────────────────────────────── */
function DashboardView({ current, assigned, duty, setDuty, onRefresh }) {
  const [advancing, setAdvancing] = useState(false)

  const advanceStatus = async (order) => {
    const statusMap = {
      CONFIRMED: 'ASSIGNED',
      ASSIGNED: 'PICKED_UP',
      PICKED_UP: 'OUT_FOR_DELIVERY',
      OUT_FOR_DELIVERY: 'DELIVERED',
    }
    const next = statusMap[order.status]
    if (!next) return

    setAdvancing(true)
    try {
      const res = await apiClient(`/orders/${order.id}/status`, {
        method: 'PATCH',
        body: { status: next },
      })
      if (res && res.success) {
        await onRefresh()
      }
    } catch (err) {
      console.error('Failed to advance order status:', err)
    } finally {
      setAdvancing(false)
    }
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
            {duty
              ? 'You are Online • Ready to accept orders in your zone'
              : 'You are Offline • Turn on duty to accept orders'}
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
        <span>{assigned.length} Active Task{assigned.length === 1 ? '' : 's'}</span>
      </div>

      {current ? (
        <div className="dp-order-card">
          {/* Order Header */}
          <div className="dp-order-head">
            <div className="dp-order-id">
              <strong>#{current.id}</strong>
              <span>• {current.orderType || 'Delivery'}</span>
            </div>
            <span className={`dp-status-pill ${current.status?.toLowerCase() || 'assigned'}`}>
              {current.status?.replaceAll('_', ' ') || 'ASSIGNED'}
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
              <strong>{current.branch || 'Golden Food Bowl Store'}</strong>
              <p>{current.branchAddress || 'Store Location'}</p>
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
              <strong>{current.customer || 'Customer'}</strong>
              <p>{current.customerPhone ? `Mobile: ${current.customerPhone}` : 'Customer Address'}</p>
            </div>
            <div className="dp-loc-actions">
              {current.customerPhone && (
                <a href={`tel:${current.customerPhone}`} className="dp-icon-btn" title="Call Customer">
                  <Phone size={15} />
                </a>
              )}
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
                disabled={advancing}
                onClick={() => advanceStatus(current)}
              >
                {advancing ? 'Updating Status...' : getButtonText(current.status)}
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
        <div className="dp-order-card" style={{ textAlign: 'center', padding: '36px 20px' }}>
          <PackageCheck size={44} style={{ color: '#ca8a04', margin: '0 auto 12px' }} />
          <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800 }}>No Active Order</h3>
          <p style={{ margin: 0, fontSize: 12, color: '#78716c', lineHeight: 1.5 }}>
            You are online and on active duty. New delivery orders assigned to your route will appear here automatically.
          </p>
        </div>
      )}
    </>
  )
}

/* ── ORDERS HUB VIEW ─────────────────────────────────────────── */
function OrdersView({ assigned, completed, allOrders, onRefresh }) {
  const [tab, setTab] = useState('active') // 'active' | 'completed'

  const displayed = tab === 'active' ? assigned : completed

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
          Active Orders ({assigned.length})
        </button>
        <button
          type="button"
          className={`dp-orders-tab ${tab === 'completed' ? 'active' : ''}`}
          onClick={() => setTab('completed')}
        >
          Completed ({completed.length})
        </button>
      </div>

      <div className="dp-orders-list">
        {displayed.length > 0 ? (
          displayed.map(o => (
            <Link key={o.id} to={`/delivery/orders/${o.id}`} className="dp-list-order-card">
              <div className="dp-list-order-row">
                <span className="dp-list-order-id">#{o.id}</span>
                <span className={`dp-status-pill ${o.status?.toLowerCase() || 'assigned'}`}>
                  {o.status?.replaceAll('_', ' ') || 'ASSIGNED'}
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#78716c', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div><strong>Store:</strong> {o.branch || 'Golden Food Bowl'}</div>
                <div><strong>Customer:</strong> {o.customer} • ₹{o.total}</div>
              </div>
              <div className="dp-list-order-row" style={{ paddingTop: 6, borderTop: '1px dashed #eee4d2' }}>
                <span style={{ fontSize: 10, color: '#78716c' }}>Payout</span>
                <span className="dp-list-order-pay">₹120</span>
              </div>
            </Link>
          ))
        ) : (
          <div style={{ textAlign: 'center', color: '#78716c', padding: '36px 20px' }}>
            <p style={{ margin: 0, fontSize: 13 }}>
              No {tab} orders found for your account.
            </p>
          </div>
        )}
      </div>
    </>
  )
}

/* ── ORDER DETAILS VIEW ──────────────────────────────────────── */
function OrderDetailsView({ id, allOrders, onRefresh }) {
  const navigate = useNavigate()
  const [advancing, setAdvancing] = useState(false)

  const order = allOrders.find(o => o.id === id)

  if (!order) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <p style={{ color: '#78716c', marginBottom: 12 }}>Order not found or not assigned to your account.</p>
        <button
          type="button"
          className="dp-advance-btn"
          style={{ width: 'fit-content', margin: '0 auto' }}
          onClick={() => navigate('/delivery/dashboard')}
        >
          ← Back to Dashboard
        </button>
      </div>
    )
  }

  const advanceStatus = async () => {
    const statusMap = {
      CONFIRMED: 'ASSIGNED',
      ASSIGNED: 'PICKED_UP',
      PICKED_UP: 'OUT_FOR_DELIVERY',
      OUT_FOR_DELIVERY: 'DELIVERED',
    }
    const next = statusMap[order.status]
    if (!next) return

    setAdvancing(true)
    try {
      const res = await apiClient(`/orders/${order.id}/status`, {
        method: 'PATCH',
        body: { status: next },
      })
      if (res && res.success) {
        await onRefresh()
      }
    } catch (err) {
      console.error('Failed to advance order status:', err)
    } finally {
      setAdvancing(false)
    }
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
          <span className={`dp-status-pill ${order.status?.toLowerCase() || 'assigned'}`}>
            {order.status?.replaceAll('_', ' ') || 'ASSIGNED'}
          </span>
        </div>

        <div className="dp-loc-block">
          <div className="dp-loc-icon store"><Store size={18} /></div>
          <div className="dp-loc-info">
            <span className="dp-loc-tag store">Pickup</span>
            <strong>{order.branch || 'Golden Food Bowl'}</strong>
            <p>{order.branchAddress || 'Store Location'}</p>
          </div>
        </div>

        <div className="dp-loc-block">
          <div className="dp-loc-icon customer"><MapPin size={18} /></div>
          <div className="dp-loc-info">
            <span className="dp-loc-tag customer">Drop-off</span>
            <strong>{order.customer || 'Customer'}</strong>
            <p>{order.customerPhone ? `Mobile: ${order.customerPhone}` : 'Customer Delivery Address'}</p>
          </div>
        </div>

        <div className="dp-action-stack">
          {order.status !== 'DELIVERED' && (
            <button type="button" className="dp-advance-btn" disabled={advancing} onClick={advanceStatus}>
              {advancing ? 'Updating...' : 'Advance Order Status →'}
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
function NavigationView({ id, allOrders }) {
  const navigate = useNavigate()
  const order = allOrders.find(o => o.id === id)

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
          <p>{order ? `Route for Order #${order.id}` : 'Live route tracking & turn-by-turn guidance'}</p>
        </div>
        <Navigation size={28} style={{ color: '#f5c518' }} />
      </div>

      <div className="dp-map-card">
        <div className="dp-map-turn-instruction">
          <span className="dp-turn-icon">↪</span>
          <div className="dp-turn-text">
            <strong>Heading to destination</strong>
            <span>Follow live GPS route on your mobile</span>
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

      {order?.customerPhone && (
        <div className="dp-quick-contacts">
          <a href={`tel:${order.customerPhone}`} className="dp-contact-btn">
            <Phone size={14} /> Call Customer
          </a>
        </div>
      )}
    </div>
  )
}

/* ── PARTNER PROFILE VIEW ────────────────────────────────────── */
function DeliveryProfile({ partner, deliveryUser, onRefresh }) {
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const currentName = partner.name || deliveryUser?.name || ''
  const currentEmail = partner.email || deliveryUser?.email || ''
  const currentMobile = partner.mobile || deliveryUser?.mobile || ''
  const currentVehicle = partner.vehicle || 'Bike'

  const [data, setData] = useState({
    name: currentName,
    email: currentEmail,
    mobile: currentMobile,
    vehicle: currentVehicle,
    vehicleNumber: 'KA-01-AB-1234',
    licence: 'Verified on Signup',
    idProof: 'Verified Aadhaar',
    bank: 'Bank Account Linked',
    upi: '',
  })

  useEffect(() => {
    setData(prev => ({
      ...prev,
      name: currentName,
      email: currentEmail,
      mobile: currentMobile,
      vehicle: currentVehicle,
    }))
  }, [currentName, currentEmail, currentMobile, currentVehicle])

  const set = (k, v) => setData(d => ({ ...d, [k]: v }))

  const save = async () => {
    setSaving(true)
    try {
      if (partner.id) {
        await apiClient(`/delivery/partners/${partner.id}`, {
          method: 'PUT',
          body: {
            name: data.name,
            mobile: data.mobile,
            vehicle: data.vehicle,
          },
        })
        await onRefresh()
      }
      setEditing(false)
    } catch (err) {
      console.error('Failed to update partner profile:', err)
    } finally {
      setSaving(false)
    }
  }

  const signOut = () => {
    authStorage.clearDeliveryAuth()
    navigate('/delivery/signin', { replace: true })
  }

  const initials = (data.name || 'DP')
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="dp-profile-card">
      <div className="dp-profile-top">
        <div className="dp-profile-avatar">{initials}</div>
        <div className="dp-profile-info">
          <h1>{data.name || 'Delivery Partner'}</h1>
          <p>Verified Bowl Delivery Partner</p>
          <div className="dp-badge-row">
            <span className="dp-badge-chip">✓ {partner.verificationStatus === 'VERIFIED' ? 'Verified Partner' : 'Partner Account'}</span>
            <span className="dp-badge-chip" style={{ background: '#fffdf0', color: '#854d0e', borderColor: '#fde047' }}>
              ★ {partner.rating ? Number(partner.rating).toFixed(1) : '5.0'} Rating
            </span>
          </div>
        </div>
      </div>

      <div className="dp-section-title" style={{ marginTop: 4 }}>
        <h2 style={{ fontSize: 13 }}>Partner Account &amp; Details</h2>
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
        <ProfileField icon={Mail} label="Email Address" value={data.email} edit={false} />
        <ProfileField icon={Phone} label="Mobile Number" value={data.mobile} edit={editing} onChange={v => set('mobile', v)} />
        <ProfileField icon={Car} label="Vehicle Details" value={data.vehicle} edit={editing} onChange={v => set('vehicle', v)} />
        <ProfileField icon={FileText} label="Verification Status" value={partner.verificationStatus || 'ACTIVE'} edit={false} />
        <ProfileField icon={CreditCard} label="Fee Status" value={partner.feeStatus || 'PAID'} edit={false} />
      </div>

      {editing ? (
        <button type="button" className="dp-advance-btn" disabled={saving} onClick={save}>
          {saving ? 'Saving...' : 'Save Profile Changes'}
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
          <input value={value || ''} onChange={e => onChange(e.target.value)} />
        ) : (
          <strong>{value || 'Not set'}</strong>
        )}
      </div>
    </div>
  )
}

/* ── GIGS / SHIFTS & INCENTIVES VIEW ─────────────────────────── */
function GigsView({ trips = 0, completedCount = 0 }) {
  const [reserved, setReserved] = useState({ 1: true, 2: false, 3: false, 4: false })

  const toggleGig = id => {
    setReserved(r => ({ ...r, [id]: !r[id] }))
  }

  const shifts = [
    { id: 1, title: 'Lunch Peak Shift', time: '12:00 PM – 03:30 PM', bonus: '+₹250 Peak Bonus', area: 'Central Zone' },
    { id: 2, title: 'Dinner Peak Shift', time: '07:00 PM – 11:00 PM', bonus: '+₹350 Peak Bonus', area: 'South Zone' },
    { id: 3, title: 'Late Night Surge', time: '11:00 PM – 02:00 AM', bonus: '+₹50 Extra / Order', area: 'High Demand Zone' },
    { id: 4, title: 'Breakfast Shift (Tomorrow)', time: '08:00 AM – 11:30 AM', bonus: '+₹180 Morning Bonus', area: 'City Center' },
  ]

  const incentiveTarget = 12
  const progressPercent = Math.min(100, Math.round((completedCount / incentiveTarget) * 100))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="dp-section-title">
        <h2>Gigs &amp; Shift Slots</h2>
        <span>Active Shifts</span>
      </div>

      {/* Incentive Meter */}
      <div className="dp-incentive-meter">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#f5c518', fontWeight: 800, textTransform: 'uppercase' }}>
            ⚡ Daily Incentive Target
          </span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>
            {completedCount} / {incentiveTarget} Orders Done
          </span>
        </div>
        <strong style={{ fontSize: 15, fontWeight: 900, color: '#ffffff' }}>
          {completedCount >= incentiveTarget
            ? '🎉 Daily Incentive Completed! Bonus Unlocked!'
            : `Complete ${incentiveTarget - completedCount} more orders for ₹400 Bonus!`}
        </strong>
        <div className="dp-incentive-track">
          <div className="dp-incentive-fill" style={{ width: `${progressPercent}%` }} />
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
              📍 {s.area} • Guaranteed surge rate
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
function WalletView({ partner, completed, todayPay }) {
  const [withdrawn, setWithdrawn] = useState(false)
  const earnings = Number(partner.earnings || 0)
  const currentBalance = withdrawn ? 0 : earnings

  const handleWithdraw = () => {
    if (currentBalance > 0) {
      setWithdrawn(true)
    }
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
          ₹{currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
        <button
          type="button"
          className="dp-withdraw-btn"
          disabled={currentBalance === 0}
          onClick={handleWithdraw}
        >
          {withdrawn ? '✓ Payout Request Submitted' : '💸 Instant Payout to Bank →'}
        </button>
      </div>

      {/* Earnings Breakdown */}
      <div className="dp-section-title">
        <h2 style={{ fontSize: 14 }}>Earnings Breakdown</h2>
      </div>

      <div className="dp-order-meta-grid">
        <div className="dp-meta-cell">
          <span>Today's Pay</span>
          <strong>₹{todayPay.toFixed(2)}</strong>
        </div>
        <div className="dp-meta-cell">
          <span>Completed Trips</span>
          <strong>{completed.length}</strong>
        </div>
        <div className="dp-meta-cell">
          <span>Fee Status</span>
          <strong style={{ color: '#16a34a' }}>✓ {partner.feeStatus || 'PAID'}</strong>
        </div>
        <div className="dp-meta-cell">
          <span>Rating</span>
          <strong>★ {partner.rating ? Number(partner.rating).toFixed(1) : '5.0'}</strong>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="dp-section-title">
        <h2 style={{ fontSize: 14 }}>Recent Completed Deliveries</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {completed.length > 0 ? (
          completed.slice(0, 5).map(order => (
            <div key={order.id} className="dp-tx-item">
              <div>
                <strong style={{ display: 'block', fontSize: 12 }}>Order #{order.id} Trip Pay</strong>
                <span style={{ fontSize: 9.5, color: '#78716c' }}>Store: {order.branch}</span>
              </div>
              <span className="dp-tx-plus">+₹120.00</span>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', color: '#78716c', padding: '24px 12px' }}>
            <p style={{ margin: 0, fontSize: 12 }}>No completed trip payouts yet. Complete delivery assignments to earn.</p>
          </div>
        )}
      </div>
    </div>
  )
}
