import { useState, useEffect } from 'react'
import { apiClient } from '../../services/api/apiClient'
import { Bell, CheckCircle2, Truck, AlertTriangle, Check } from 'lucide-react'

const roleLabels = {
  customer: 'Customer Alerts & Updates',
  admin: 'Admin System Notifications',
  support: 'Support Team Alerts',
  delivery: 'Delivery Partner Dispatch Alerts'
}

export function NotificationPanel({ notifications: propNotifications = [], role = 'customer' }) {
  const [filter, setFilter] = useState('ALL')
  const [readIds, setReadIds] = useState(new Set())
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // If not using API or passing mock notifications from context, we just use props
    // But let's always fetch from API
    const fetchNotifications = async () => {
      setLoading(true)
      try {
        const res = await apiClient(`/notifications`)
        if (res.success && Array.isArray(res.data)) {
          setItems(res.data)
          setReadIds(new Set(res.data.filter(n => n.read).map(n => n.id)))
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err)
        // Fallback to props
        setItems(propNotifications.filter(item => item.role.toLowerCase() === role.toLowerCase()))
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
  }, [role, propNotifications])

  const filteredItems = items.filter(item => {
    if (filter === 'UNREAD') return !readIds.has(item.id)
    return true
  })

  const markAllRead = async () => {
    const unread = items.filter(i => !readIds.has(i.id))
    for (const item of unread) {
      try {
        await apiClient(`/notifications/${item.id}/read`, { method: 'PUT' })
      } catch (err) {}
    }
    setReadIds(new Set(items.map(i => i.id)))
  }

  return (
    <section className="notification-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Header Card ── */}
      <div
        className="admin-table-card"
        style={{
          padding: 18,
          background: 'linear-gradient(135deg, #ffffff 0%, #faf8f5 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: '#fff9ec',
              border: '1px solid #fce7b2',
              display: 'grid',
              placeItems: 'center',
              color: '#dfa500'
            }}
          >
            <Bell size={20} />
          </div>
          <div>
            <span style={{ fontSize: 9.5, color: '#dfa500', fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase' }}>
              {roleLabels[role] || 'Notifications'}
            </span>
            <h2 style={{ margin: '2px 0 0', fontSize: 18, color: '#1c1917', fontWeight: 900 }}>System Notifications</h2>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setFilter(f => (f === 'ALL' ? 'UNREAD' : 'ALL'))}
            style={{
              height: 32,
              padding: '0 10px',
              borderRadius: 8,
              border: '1px solid #e2d8c8',
              fontSize: 11,
              fontWeight: 700,
              background: filter === 'UNREAD' ? '#1c1917' : '#fff',
              color: filter === 'UNREAD' ? '#f5c518' : '#44403c',
              cursor: 'pointer'
            }}
          >
            {filter === 'UNREAD' ? 'Showing Unread' : 'All Alerts'}
          </button>

          <button
            type="button"
            onClick={markAllRead}
            style={{
              height: 32,
              padding: '0 10px',
              borderRadius: 8,
              border: '1px solid #e2d8c8',
              fontSize: 11,
              fontWeight: 700,
              background: '#fff',
              color: '#16a34a',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Check size={14} /> Mark All Read
          </button>
        </div>
      </div>

      {/* ── Alerts List ── */}
      {!filteredItems.length ? (
        <div
          className="admin-table-card"
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10
          }}
        >
          <Bell size={40} style={{ color: '#cbd5e1' }} />
          <strong style={{ fontSize: 16, color: '#1c1917' }}>{loading ? 'Loading...' : 'No new notifications'}</strong>
          <span style={{ fontSize: 12, color: '#78716c' }}>{loading ? 'Please wait' : 'You are completely caught up!'}</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredItems.map(item => {
            const isRead = readIds.has(item.id)
            return (
              <article
                key={item.id}
                style={{
                  background: isRead ? '#faf8f5' : '#ffffff',
                  border: `1px solid ${isRead ? '#f0e9dc' : '#dfa500'}`,
                  borderRadius: 16,
                  padding: 16,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  boxShadow: isRead ? 'none' : '0 2px 10px rgba(223,165,0,0.08)',
                  transition: 'all 0.15s ease'
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: item.role.toLowerCase() === 'delivery' ? '#ffedd5' : item.title.includes('Surge') ? '#fee2e2' : '#f0fdf4',
                    color: item.role.toLowerCase() === 'delivery' ? '#c2410c' : item.title.includes('Surge') ? '#dc2626' : '#166534',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0
                  }}
                >
                  {item.role.toLowerCase() === 'delivery' ? (
                    <Truck size={18} />
                  ) : item.title.includes('Surge') ? (
                    <AlertTriangle size={18} />
                  ) : (
                    <CheckCircle2 size={18} />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <strong style={{ fontSize: 13, color: '#1c1917', fontWeight: 800 }}>{item.title}</strong>
                    <span style={{ fontSize: 10, color: '#78716c', fontWeight: 600 }}>
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Just now'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: '#57534e', lineHeight: 1.4 }}>{item.message}</p>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
