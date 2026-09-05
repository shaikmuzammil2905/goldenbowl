import { useState, useEffect, useMemo, useCallback } from 'react'
import { apiClient } from '../../services/api/apiClient'
import { getState, subscribe } from '../../services/prototypeStore'
import {
  Bell,
  CheckCircle2,
  Truck,
  AlertTriangle,
  Check,
  Package,
  Headphones,
  RefreshCw,
  Clock,
  Sparkles,
  Layers,
  CheckCheck
} from 'lucide-react'

const roleLabels = {
  customer: 'Customer Alerts & Updates',
  admin: 'Admin System Notifications & Live Alerts',
  support: 'Support Team Alerts',
  delivery: 'Delivery Partner Dispatch Alerts'
}

const READ_STORAGE_KEY = 'bowl_notifications_read_ids'

function getStoredReadIds() {
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function storeReadIds(readSet) {
  try {
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(readSet)))
  } catch {}
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return 'Just now'
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return 'Recently'
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000)
    if (diffSec < 60) return 'Just now'
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return 'Recently'
  }
}

export function NotificationPanel({
  notifications: propNotifications = [],
  role = 'customer',
  liveOrders = []
}) {
  const [filter, setFilter] = useState('ALL')
  const [readIds, setReadIds] = useState(() => getStoredReadIds())
  const [apiNotifications, setApiNotifications] = useState([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [storeVersion, setStoreVersion] = useState(0)

  // Listen to live store updates (orders placed, tickets filed, agents added, etc.)
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setStoreVersion(v => v + 1)
    })
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [])

  // Asynchronously attempt to fetch backend notifications without blocking UI
  const fetchBackendNotifications = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      const res = await apiClient('/notifications', {
        headers: { 'signal': controller.signal }
      }).catch(() => null)
      clearTimeout(timeoutId)

      if (res && res.success && Array.isArray(res.data)) {
        setApiNotifications(res.data)
        const serverRead = res.data.filter(n => n.read).map(n => n.id)
        if (serverRead.length > 0) {
          setReadIds(prev => {
            const next = new Set(prev)
            serverRead.forEach(id => next.add(id))
            storeReadIds(next)
            return next
          })
        }
      }
    } catch {
      // Gracefully continue with live client data
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchBackendNotifications()
  }, [fetchBackendNotifications])

  // Combine live orders, store notifications, and API data
  const allNotifications = useMemo(() => {
    const store = getState()
    const storeNotifs = Array.isArray(store?.notifications) ? store.notifications : []
    const storeOrders = Array.isArray(store?.orders) ? store.orders : []
    const storeIssues = Array.isArray(store?.issues) ? store.issues : []

    // 1. Live Orders Map
    const orderMap = new Map()
    if (Array.isArray(liveOrders)) {
      liveOrders.forEach(o => {
        if (o && o.id) orderMap.set(String(o.id), o)
      })
    }
    storeOrders.forEach(o => {
      if (o && o.id && !orderMap.has(String(o.id))) {
        orderMap.set(String(o.id), o)
      }
    })
    const combinedOrders = Array.from(orderMap.values())

    const list = []

    // 2. Prop notifications (if any passed)
    if (Array.isArray(propNotifications) && propNotifications.length > 0) {
      list.push(...propNotifications)
    }

    // 3. API notifications (if available)
    if (Array.isArray(apiNotifications) && apiNotifications.length > 0) {
      apiNotifications.forEach(n => {
        if (!n) return
        const nRole = String(n.role || 'all').toLowerCase()
        const targetRole = String(role || 'customer').toLowerCase()
        if (nRole === targetRole || nRole === 'all' || targetRole === 'admin') {
          list.push(n)
        }
      })
    }

    // 4. Store notifications
    storeNotifs.forEach(n => {
      if (!n) return
      const nRole = String(n.role || 'all').toLowerCase()
      const targetRole = String(role || 'customer').toLowerCase()
      if (nRole === targetRole || nRole === 'all' || targetRole === 'admin') {
        list.push({
          ...n,
          type: n.type || (n.title?.includes('Surge') ? 'surge' : nRole === 'delivery' ? 'delivery' : nRole === 'support' ? 'support' : 'system')
        })
      }
    })

    // 5. If Admin or Support: Generate real-time live order alerts for each live order
    if (role === 'admin' || role === 'support') {
      combinedOrders.forEach(o => {
        const statusClean = String(o.status || 'CONFIRMED').replace(/_/g, ' ')
        list.push({
          id: `live-order-${o.id}`,
          role: 'admin',
          type: 'order',
          title: `📦 Live Order #${o.id} • ${statusClean}`,
          message: `${o.customer || 'Customer'} placed order for ₹${Number(o.total || 0).toLocaleString('en-IN')} (${o.branch || 'Kitchen'}). Status is currently ${statusClean}.`,
          createdAt: o.createdAt || new Date().toISOString(),
          orderStatus: o.status,
          orderId: o.id,
          total: o.total
        })
      })

      // Support issues
      storeIssues.forEach(issue => {
        list.push({
          id: `live-issue-${issue.id}`,
          role: 'admin',
          type: 'support',
          title: `🎧 Support Ticket #${issue.id} • ${issue.status || 'OPEN'}`,
          message: `${issue.customer || 'Customer'}: ${issue.subject || issue.message || 'Assistance requested'}`,
          createdAt: issue.createdAt || new Date().toISOString()
        })
      })
    }

    // 6. Deduplicate by unique id
    const seen = new Set()
    const result = []
    list.forEach(item => {
      if (!item || !item.id || seen.has(item.id)) return
      seen.add(item.id)
      result.push(item)
    })

    // 7. Sort newest first
    result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    return result
  }, [propNotifications, apiNotifications, liveOrders, role, storeVersion])

  const filteredItems = useMemo(() => {
    return allNotifications.filter(item => {
      const isUnread = !readIds.has(item.id)
      if (filter === 'UNREAD') return isUnread
      if (filter === 'ORDERS') return item.type === 'order' || item.title?.includes('Order')
      if (filter === 'SYSTEM') return item.type !== 'order' && !item.title?.includes('Order')
      return true
    })
  }, [allNotifications, filter, readIds])

  const unreadCount = useMemo(() => {
    return allNotifications.filter(i => !readIds.has(i.id)).length
  }, [allNotifications, readIds])

  const toggleRead = (id) => {
    setReadIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      storeReadIds(next)
      return next
    })
  }

  const markAllRead = () => {
    const next = new Set(readIds)
    allNotifications.forEach(i => next.add(i.id))
    setReadIds(next)
    storeReadIds(next)
  }

  return (
    <section className="notification-panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* ── Top Summary Header Card ── */}
      <div
        className="admin-table-card"
        style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #ffffff 0%, #fffdf8 100%)',
          border: '1px solid #eadecb',
          borderRadius: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #dfa500 0%, #b8860b 100%)',
              display: 'grid',
              placeItems: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(223, 165, 0, 0.28)',
              flexShrink: 0
            }}
          >
            <Bell size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: '#b4811d', fontWeight: 800, letterSpacing: 1.1, textTransform: 'uppercase' }}>
                {roleLabels[role] || 'Notifications'}
              </span>
              {unreadCount > 0 ? (
                <span
                  style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    border: '1px solid #fde68a',
                    padding: '2px 8px',
                    borderRadius: 20,
                    fontSize: 10.5,
                    fontWeight: 800
                  }}
                >
                  {unreadCount} Unread
                </span>
              ) : (
                <span
                  style={{
                    background: '#f0fdf4',
                    color: '#166534',
                    border: '1px solid #bbf7d0',
                    padding: '2px 8px',
                    borderRadius: 20,
                    fontSize: 10.5,
                    fontWeight: 800
                  }}
                >
                  All Caught Up
                </span>
              )}
            </div>
            <h2 style={{ margin: '2px 0 0', fontSize: 19, color: '#1c1917', fontWeight: 900 }}>
              Live System Notifications & Alerts
            </h2>
          </div>
        </div>

        {/* ── Filter Buttons & Actions ── */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', background: '#f5f0e6', padding: 3, borderRadius: 10, border: '1px solid #e2d8c8' }}>
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              style={{
                border: 'none',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 11.5,
                fontWeight: 800,
                background: filter === 'ALL' ? '#1c1917' : 'transparent',
                color: filter === 'ALL' ? '#dfa500' : '#57534e',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              All ({allNotifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('UNREAD')}
              style={{
                border: 'none',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 11.5,
                fontWeight: 800,
                background: filter === 'UNREAD' ? '#1c1917' : 'transparent',
                color: filter === 'UNREAD' ? '#dfa500' : '#57534e',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Unread ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('ORDERS')}
              style={{
                border: 'none',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 11.5,
                fontWeight: 800,
                background: filter === 'ORDERS' ? '#1c1917' : 'transparent',
                color: filter === 'ORDERS' ? '#dfa500' : '#57534e',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Orders
            </button>
            <button
              type="button"
              onClick={() => setFilter('SYSTEM')}
              style={{
                border: 'none',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 11.5,
                fontWeight: 800,
                background: filter === 'SYSTEM' ? '#1c1917' : 'transparent',
                color: filter === 'SYSTEM' ? '#dfa500' : '#57534e',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              System
            </button>
          </div>

          <button
            type="button"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            style={{
              height: 34,
              padding: '0 12px',
              borderRadius: 10,
              border: '1px solid #d1fae5',
              fontSize: 11.5,
              fontWeight: 800,
              background: unreadCount === 0 ? '#f9fafb' : '#ecfdf5',
              color: unreadCount === 0 ? '#9ca3af' : '#059669',
              cursor: unreadCount === 0 ? 'default' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              transition: 'all 0.15s ease'
            }}
          >
            <CheckCheck size={15} /> Mark All Read
          </button>

          <button
            type="button"
            onClick={fetchBackendNotifications}
            title="Refresh alerts"
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              border: '1px solid #e2d8c8',
              background: '#ffffff',
              color: '#57534e',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center'
            }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin-icon' : ''} />
          </button>
        </div>
      </div>

      {/* ── Alerts Feed ── */}
      {filteredItems.length === 0 ? (
        <div
          className="admin-table-card"
          style={{
            textAlign: 'center',
            padding: '50px 20px',
            background: '#ffffff',
            borderRadius: 16,
            border: '1px dashed #d6ccbe',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: '#fef3c7',
              display: 'grid',
              placeItems: 'center',
              color: '#d97706'
            }}
          >
            <Sparkles size={24} />
          </div>
          <strong style={{ fontSize: 16, color: '#1c1917', fontWeight: 800 }}>No alerts in this view</strong>
          <span style={{ fontSize: 12.5, color: '#78716c', maxWidth: 360 }}>
            {filter === 'UNREAD'
              ? 'Great job! You have addressed all unread alerts.'
              : 'All notifications are up to date and live operations are normal.'}
          </span>
          {filter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              style={{
                marginTop: 6,
                padding: '6px 14px',
                borderRadius: 8,
                border: '1px solid #dfa500',
                background: '#fff9ec',
                color: '#b4811d',
                fontSize: 11.5,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              View All Alerts
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredItems.map(item => {
            const isRead = readIds.has(item.id)
            const isOrder = item.type === 'order' || item.title?.includes('Order')
            const isDelivery = item.type === 'delivery' || item.role?.toLowerCase() === 'delivery'
            const isSupport = item.type === 'support' || item.role?.toLowerCase() === 'support'
            const isSurge = item.type === 'surge' || item.title?.includes('Surge')

            // Visual theme per type
            const theme = isOrder
              ? { bg: '#fffbeb', border: '#fde68a', iconBg: '#fef3c7', iconColor: '#b45309', Icon: Package, badge: 'Live Order', badgeColor: '#92400e', badgeBg: '#fef3c7' }
              : isDelivery
              ? { bg: '#fff7ed', border: '#fed7aa', iconBg: '#ffedd5', iconColor: '#c2410c', Icon: Truck, badge: 'Delivery', badgeColor: '#9a3412', badgeBg: '#ffedd5' }
              : isSupport
              ? { bg: '#eff6ff', border: '#bfdbfe', iconBg: '#dbeafe', iconColor: '#1d4ed8', Icon: Headphones, badge: 'Support Desk', badgeColor: '#1e40af', badgeBg: '#dbeafe' }
              : isSurge
              ? { bg: '#fef2f2', border: '#fecaca', iconBg: '#fee2e2', iconColor: '#dc2626', Icon: AlertTriangle, badge: 'High Demand Alert', badgeColor: '#991b1b', badgeBg: '#fee2e2' }
              : { bg: '#f0fdf4', border: '#bbf7d0', iconBg: '#dcfce7', iconColor: '#166534', Icon: Bell, badge: 'System Notice', badgeColor: '#166534', badgeBg: '#dcfce7' }

            const IconComponent = theme.Icon

            return (
              <article
                key={item.id}
                onClick={() => toggleRead(item.id)}
                style={{
                  background: isRead ? '#faf8f5' : '#ffffff',
                  border: isRead ? '1px solid #e7dfd3' : '1px solid #dfa500',
                  borderLeft: isRead ? '4px solid #d6ccbe' : '4px solid #dfa500',
                  borderRadius: 14,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  boxShadow: isRead ? 'none' : '0 3px 12px rgba(223, 165, 0, 0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* ── Type Icon ── */}
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: theme.iconBg,
                    color: theme.iconColor,
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    marginTop: 2
                  }}
                >
                  <IconComponent size={19} />
                </div>

                {/* ── Content ── */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          background: theme.badgeBg,
                          color: theme.badgeColor,
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 6,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5
                        }}
                      >
                        {theme.badge}
                      </span>

                      {item.orderStatus && (
                        <span
                          style={{
                            background: item.orderStatus === 'DELIVERED' ? '#dcfce7' : item.orderStatus === 'CANCELLED' ? '#fee2e2' : '#fef3c7',
                            color: item.orderStatus === 'DELIVERED' ? '#15803d' : item.orderStatus === 'CANCELLED' ? '#b91c1c' : '#b45309',
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: 6
                          }}
                        >
                          {item.orderStatus}
                        </span>
                      )}

                      <strong style={{ fontSize: 13.5, color: '#1c1917', fontWeight: 800 }}>
                        {item.title}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, color: '#78716c', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <Clock size={12} /> {formatRelativeTime(item.createdAt)}
                      </span>

                      {!isRead ? (
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: '#dfa500',
                            display: 'inline-block',
                            boxShadow: '0 0 6px #dfa500'
                          }}
                          title="Unread notification"
                        />
                      ) : (
                        <span style={{ fontSize: 10, color: '#a8a29e', fontWeight: 600 }}>Read</span>
                      )}
                    </div>
                  </div>

                  <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#44403c', lineHeight: 1.45 }}>
                    {item.message}
                  </p>
                </div>

                {/* ── Quick Read Toggle ── */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleRead(item.id)
                  }}
                  title={isRead ? 'Mark unread' : 'Mark as read'}
                  style={{
                    border: 'none',
                    background: isRead ? '#f5f0e6' : '#fff9ec',
                    color: isRead ? '#a8a29e' : '#dfa500',
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0
                  }}
                >
                  <Check size={14} />
                </button>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
