import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Package,
  Store,
  Users,
  Truck,
  Plus,
  ToggleLeft,
  ToggleRight,
  Search,
  Eye,
  FileText,
  X,
  Headphones,
  Upload,
  Image as ImageIcon,
  Tag,
  Trash2,
  Calendar,
  Clock,
  Filter,
  XCircle,
  CheckCircle2,
  DollarSign,
  Percent,
  Sparkles,
  Sliders,
  Check,
  RefreshCw,
  Bike,
  ShieldCheck,
  AlertCircle,
  ChevronDown,
  Mail,
  Phone
} from 'lucide-react'
import { usePrototypeContext } from '../../context/PrototypeContext'
import {
  assignDelivery,
  updateOrderStatus,
  addProduct,
  updateProduct,
  toggleProductAvailability,
  deleteProduct,
  addCategory,
  updateCategory,
  deleteCategory,
  updateDeliverySettings,
  updateDeliveryPartnerFee,
  waiveDeliveryPartnerFee,
  updateDeliveryVerification,
  deleteDeliveryPartner,
  addSupportAgent,
  updateSupportAgent,
  toggleSupportAgentStatus,
  deleteSupportAgent,
  addIssue,
  updateIssue
} from '../../services/prototypeStore'
import { NotificationPanel } from '../../components/notifications/NotificationPanel'
import { AdminReports } from './AdminReports'
import { Branches } from './Branches'
import { orderApi } from '../../services/api/orderApi'
import './admin-content.css'

export function AdminPage() {
  const { pathname } = useLocation()
  const path = pathname.replace(/^\/admin\/?/, '').split('/')[0] || 'dashboard'
  
  const [liveOrders, setLiveOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 10000) // Poll every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await orderApi.getOrders()
      const fetched = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.orders) ? res.orders : (Array.isArray(res) ? res : []))
      // Map API response to match UI fields
      const mapped = fetched.map(o => ({
        id: o?.id || '',
        customer: o?.customerName || (o?.customerUser ? o.customerUser.name : 'Guest'),
        branch: o?.branch?.name || o?.branch || '-',
        total: Number(o?.totalAmount || o?.total || 0),
        status: o?.status || 'PENDING',
        createdAt: o?.createdAt || new Date().toISOString(),
        items: o?.items || []
      }))
      setLiveOrders(mapped)
    } catch (err) {
      console.error('Failed to fetch live orders:', err)
    } finally {
      setLoadingOrders(false)
    }
  }

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(path === 'dashboard' || !path || path === 'admin') && <Dashboard orders={liveOrders} loading={loadingOrders} />}
      {path === 'orders' && <Orders orders={liveOrders} loading={loadingOrders} fetchOrders={fetchOrders} />}
      {path === 'products' && <Products />}
      {path === 'categories' && <Categories />}
      {path === 'branches' && <Branches />}
      {path === 'customers' && <Customers liveOrders={liveOrders} />}
      {path === 'delivery' && <Delivery />}
      {path === 'support' && <Support liveOrders={liveOrders} />}
      {path === 'reports' && <AdminReports />}
      {path === 'notifications' && <AdminNotifications />}
    </section>
  )
}

function Dashboard({ orders = [], loading }) {
  const safeOrders = Array.isArray(orders) ? orders : []
  const sales = safeOrders.reduce((s, o) => s + Number(o?.total || 0), 0)
  const activeOrdersCount = safeOrders.filter(o => o?.status !== 'DELIVERED').length
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fffdf7 100%)', border: '1px solid #eee4d2', borderLeft: '4px solid #dfa500', borderRadius: 16, padding: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, color: '#78716c', fontWeight: 700 }}>Gross Sales</span>
          <strong style={{ fontSize: 20, color: '#1c1917', fontWeight: 900 }}>₹{sales.toLocaleString('en-IN')}</strong>
          <small style={{ color: '#16a34a', fontSize: 9.5, fontWeight: 700 }}>+12.8% vs last week</small>
        </div>
        <div style={{ background: '#f0f9ff', border: '1px solid #e2e8f0', borderLeft: '4px solid #0284c7', borderRadius: 16, padding: 14 }}>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Live Orders</span>
          <strong style={{ display: 'block', fontSize: 20, color: '#0f172a', fontWeight: 900 }}>{safeOrders.length}</strong>
          <small style={{ color: '#0284c7', fontSize: 9.5, fontWeight: 700 }}>{activeOrdersCount} active in kitchen</small>
        </div>
        <div style={{ background: '#f0fdf4', border: '1px solid #e2e8f0', borderLeft: '4px solid #16a34a', borderRadius: 16, padding: 14 }}>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Customers</span>
          <strong style={{ display: 'block', fontSize: 20, color: '#0f172a', fontWeight: 900 }}>1,284</strong>
          <small style={{ color: '#16a34a', fontSize: 9.5, fontWeight: 700 }}>+42 signups today</small>
        </div>
        <div style={{ background: '#faf5ff', border: '1px solid #e2e8f0', borderLeft: '4px solid #9333ea', borderRadius: 16, padding: 14 }}>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Delivery Fleet</span>
          <strong style={{ display: 'block', fontSize: 20, color: '#0f172a', fontWeight: 900 }}>32</strong>
          <small style={{ color: '#16a34a', fontSize: 9.5, fontWeight: 700 }}>98.4% On-time rate</small>
        </div>
      </div>
      <div style={{ background: 'linear-gradient(135deg, #1c1208 0%, #3a2610 100%)', color: '#ffffff', borderRadius: 18, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <span style={{ fontSize: 10, color: '#f5c518', fontWeight: 800, letterSpacing: 1 }}>⚡ DAILY PLATFORM GOAL</span>
          <h3 style={{ margin: '4px 0 0', fontSize: 16, color: '#fff', fontWeight: 800 }}>₹25,000 / ₹30,000 Goal Reached</h3>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#e2d8c8' }}>3 active branches serving Indiranagar, Koramangala &amp; MG Road.</p>
        </div>
        <div style={{ minWidth: 160 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#e2d8c8', marginBottom: 4, fontWeight: 700 }}><span>83% Achieved</span><span>₹5,000 Remaining</span></div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 10, overflow: 'hidden' }}><div style={{ width: '83%', height: '100%', background: 'linear-gradient(90deg, #dfa500, #f5c518)', borderRadius: 10 }} /></div>
        </div>
      </div>
      <Orders orders={safeOrders} fetchOrders={() => {}} />
    </>
  )
}

function Orders({ orders = [], loading = false, fetchOrders }) {
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [datePreset, setDatePreset] = useState('ALL')
  const [customDate, setCustomDate] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)

  const formatDateTime = (dateStr) => {
    if (!dateStr) return { date: '30 Aug 2026', time: '07:30 PM', full: '30 Aug 2026, 07:30 PM' }
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return { date: '30 Aug 2026', time: '07:30 PM', full: '30 Aug 2026, 07:30 PM' }
    const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    return { date, time, full: `${date}, ${time}` }
  }

  const safeOrders = Array.isArray(orders) ? orders : []
  const filterLower = (filter || '').toLowerCase()
  const filtered = safeOrders.filter(o => {
    const idStr = String(o?.id || '').toLowerCase()
    const customerStr = String(o?.customer || '').toLowerCase()
    const branchStr = String(o?.branch || '').toLowerCase()
    const matchesSearch = idStr.includes(filterLower) || customerStr.includes(filterLower) || branchStr.includes(filterLower)
    
    const matchesStatus = statusFilter === 'ALL' || o?.status === statusFilter

    let matchesDate = true
    if (o?.createdAt) {
      const orderDate = new Date(o.createdAt)
      const now = new Date()
      
      if (datePreset === 'TODAY') {
        matchesDate = orderDate.toDateString() === now.toDateString()
      } else if (datePreset === 'YESTERDAY') {
        const yesterday = new Date()
        yesterday.setDate(now.getDate() - 1)
        matchesDate = orderDate.toDateString() === yesterday.toDateString()
      } else if (datePreset === 'LAST_7_DAYS') {
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(now.getDate() - 7)
        matchesDate = orderDate >= sevenDaysAgo
      } else if (datePreset === 'CUSTOM' && customDate) {
        const selected = new Date(customDate)
        matchesDate = orderDate.toDateString() === selected.toDateString()
      }
    }

    return matchesSearch && matchesStatus && matchesDate
  })

  const totalAmount = filtered.reduce((acc, o) => acc + Number(o?.total || 0), 0)
  const deliveredCount = filtered.filter(o => o?.status === 'DELIVERED').length
  const cancelledCount = filtered.filter(o => o?.status === 'CANCELLED').length
  const activeCount = filtered.filter(o => o?.status !== 'DELIVERED' && o?.status !== 'CANCELLED').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Date-Wise Tracking Metrics Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <div style={{ background: '#fff', border: '1px solid #e2d8c8', borderLeft: '4px solid #b4811d', borderRadius: 14, padding: 14 }}>
          <span style={{ fontSize: 11, color: '#78716c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Package size={13} color="#b4811d" /> Total Orders
          </span>
          <strong style={{ fontSize: 20, color: '#1c1917', fontWeight: 900, marginTop: 4, display: 'block' }}>{orders.length} Total Orders</strong>
          <small style={{ color: '#78716c', fontSize: 10, fontWeight: 600 }}>{filtered.length} matching current filter • {activeCount} active</small>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2d8c8', borderLeft: '4px solid #16a34a', borderRadius: 14, padding: 14 }}>
          <span style={{ fontSize: 11, color: '#78716c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            <DollarSign size={13} color="#16a34a" /> Filtered Revenue
          </span>
          <strong style={{ fontSize: 20, color: '#16a34a', fontWeight: 900, marginTop: 4, display: 'block' }}>₹{totalAmount.toLocaleString('en-IN')}</strong>
          <small style={{ color: '#16a34a', fontSize: 10, fontWeight: 600 }}>{deliveredCount} delivered successfully</small>
        </div>

        <div style={{ background: '#fff5f5', border: '1px solid #fca5a5', borderLeft: '4px solid #dc2626', borderRadius: 14, padding: 14 }}>
          <span style={{ fontSize: 11, color: '#991b1b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            <XCircle size={13} color="#dc2626" /> Cancelled Orders
          </span>
          <strong style={{ fontSize: 20, color: '#dc2626', fontWeight: 900, marginTop: 4, display: 'block' }}>{cancelledCount} Cancelled</strong>
          <small style={{ color: '#991b1b', fontSize: 10, fontWeight: 600 }}>Date-wise tracking enabled</small>
        </div>
      </div>

      <div className="admin-table-card">
        <div className="table-heading" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Package size={18} style={{ color: '#b4811d' }} /> Live Orders &amp; Date-Wise Tracking
            </h2>
            <span style={{ fontSize: 11, color: '#78716c' }}>Total Orders: <strong>{orders.length}</strong> (Showing {filtered.length} filtered)</span>
          </div>

          {/* Date & Filter Controls Bar */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} style={{ position: 'absolute', left: 8, color: '#988e7d' }} />
              <input placeholder="Search order, customer..." value={filter} onChange={e => setFilter(e.target.value)} style={{ paddingLeft: 28, height: 34, borderRadius: 8, border: '1px solid #e2d8c8', fontSize: 11, background: '#fff' }} />
            </div>

            {/* Date Preset Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fffdf9', border: '1px solid #e2d8c8', borderRadius: 8, padding: '0 8px', height: 34 }}>
              <Calendar size={13} color="#b4811d" />
              <select value={datePreset} onChange={e => setDatePreset(e.target.value)} style={{ border: 0, background: 'transparent', fontSize: 11, fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                <option value="ALL">All Dates</option>
                <option value="TODAY">Today (30 Aug)</option>
                <option value="YESTERDAY">Yesterday (29 Aug)</option>
                <option value="LAST_7_DAYS">Last 7 Days</option>
                <option value="CUSTOM">Custom Date</option>
              </select>
            </div>

            {datePreset === 'CUSTOM' && (
              <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)} style={{ height: 34, padding: '0 8px', borderRadius: 8, border: '1px solid #e2d8c8', fontSize: 11, background: '#fff' }} />
            )}

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fffdf9', border: '1px solid #e2d8c8', borderRadius: 8, padding: '0 8px', height: 34 }}>
              <Filter size={13} color="#b4811d" />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ border: 0, background: 'transparent', fontSize: 11, fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                <option value="ALL">All Statuses</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PREPARING">Preparing</option>
                <option value="READY_FOR_PICKUP">Ready For Pickup</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="PICKED_UP">Picked Up</option>
                <option value="OUT_FOR_DELIVERY">Out For Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled Orders ❌</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date &amp; Time</th>
                <th>Branch</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const dt = formatDateTime(o.createdAt)
                return (
                  <tr key={o.id}>
                    <td><strong>#{o.id}</strong></td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 800, fontSize: 11, color: '#1c1917', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={12} color="#b4811d" /> {dt.date}
                        </span>
                        <span style={{ fontSize: 10, color: '#78716c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} color="#988e7d" /> {dt.time}
                        </span>
                      </div>
                    </td>
                    <td>{o.branch}</td>
                    <td>{o.customer}</td>
                    <td><strong>₹{o.total}</strong></td>
                    <td>
                      <span className={`table-status ${o.status.toLowerCase()}`} style={o.status === 'CANCELLED' ? { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', fontWeight: 800 } : {}}>
                        {o.status === 'CANCELLED' ? '❌ CANCELLED' : o.status.replaceAll('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button type="button" style={{ padding: '4px 8px', border: '1px solid #e2d8c8', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => setSelectedOrder(o)} title="View Details">
                          <Eye size={12} /> Details
                        </button>
                        {o.status === 'CANCELLED' ? (
                          <span style={{ fontSize: 10, color: '#b91c1c', fontWeight: 700 }}>Cancelled</span>
                        ) : o.status !== 'DELIVERED' ? (
                          <button className="admin-action-btn" onClick={async () => {
                            if (o.status === 'READY_FOR_PICKUP') {
                              await orderApi.assignDeliveryPartner(o.id, 'driver-id-placeholder');
                            } else {
                              await orderApi.updateOrderStatus(o.id, nextStatus(o.status));
                            }
                            if (fetchOrders) fetchOrders();
                          }}>
                            {o.status === 'READY_FOR_PICKUP' ? 'Assign Delivery →' : 'Advance →'}
                          </button>
                        ) : (
                          <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 800 }}>✓ Done</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 30, color: '#78716c', fontSize: 12 }}>
                    No orders found matching the selected date range or status filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Enhanced Order Details Modal */}
        {selectedOrder && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'grid', placeItems: 'center', padding: 16 }} onClick={() => setSelectedOrder(null)}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 520, width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0e6d6', pb: 12, marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Order #{selectedOrder.id}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, fontSize: 11, color: '#78716c' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontWeight: 700, color: '#1c1917' }}>
                      <Calendar size={12} color="#b4811d" /> {formatDateTime(selectedOrder.createdAt).full}
                    </span>
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedOrder(null)} style={{ border: 0, background: 'transparent', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: '#fffdf9', padding: 12, borderRadius: 10, border: '1px solid #f0e6d6' }}>
                  <div>
                    <span style={{ color: '#78716c', fontSize: 10 }}>CUSTOMER</span>
                    <div style={{ fontWeight: 800, fontSize: 13, color: '#1c1917', marginTop: 2 }}>{selectedOrder.customer}</div>
                  </div>
                  <div>
                    <span style={{ color: '#78716c', fontSize: 10 }}>BRANCH</span>
                    <div style={{ fontWeight: 800, fontSize: 13, color: '#1c1917', marginTop: 2 }}>{selectedOrder.branch}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcfaf5', padding: 12, borderRadius: 10 }}>
                  <span style={{ fontWeight: 700, color: '#78716c' }}>Order Status:</span>
                  <span className={`table-status ${selectedOrder.status.toLowerCase()}`} style={selectedOrder.status === 'CANCELLED' ? { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' } : {}}>
                    {selectedOrder.status === 'CANCELLED' ? '❌ CANCELLED' : selectedOrder.status.replaceAll('_', ' ')}
                  </span>
                </div>

                {selectedOrder.cancelReason && (
                  <div style={{ background: '#fff5f5', border: '1px solid #fca5a5', padding: 12, borderRadius: 10, color: '#b91c1c' }}>
                    <strong>Cancellation Reason:</strong> {selectedOrder.cancelReason}
                  </div>
                )}

                <div style={{ borderTop: '1px dashed #e2d8c8', pt: 12, marginTop: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, fontWeight: 900 }}>
                    <span>Total Amount Paid</span>
                    <span style={{ color: '#15803d', fontSize: 18 }}>₹{selectedOrder.total}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                <button className="secondary-btn" onClick={() => setSelectedOrder(null)} style={{ padding: '8px 16px', fontWeight: 700 }}>Close Details</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Products() {
  const { products, categories } = usePrototypeContext()
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [toast, setToast] = useState('')
  const [draft, setDraft] = useState({ name: '', category: '', price: '', calories: '', portion: '', description: '', image: '', available: true })

  const filtered = products.filter(p => {
    const matchQuery = p.name.toLowerCase().includes(query.toLowerCase())
    const matchCategory = categoryFilter === 'ALL' || p.category === categoryFilter
    return matchQuery && matchCategory
  })

  const openCreate = () => {
    setEditingId(null)
    setDraft({ name: '', category: categories[0]?.id || '', price: '', calories: '', portion: '', description: '', image: '', available: true })
    setShowForm(true)
  }

  const openEdit = p => {
    setEditingId(p.id)
    setDraft({
      name: p.name || '',
      category: p.category || categories[0]?.id || '',
      price: p.price ?? '',
      calories: p.calories ?? '',
      portion: p.portion || '',
      description: p.description || '',
      image: p.image || '',
      available: p.available !== false
    })
    setShowForm(true)
  }

  const save = async e => {
    e.preventDefault()
    if (!draft.name.trim() || !draft.category || !draft.price) return
    const payload = { ...draft, name: draft.name.trim(), price: Number(draft.price), calories: Number(draft.calories || 0) }
    try {
      if (editingId) {
        await updateProduct(editingId, payload)
        setToast(`Product "${draft.name}" updated in database & live website!`)
      } else {
        await addProduct(payload)
        setToast(`Product "${draft.name}" added to menu & saved to database!`)
      }
      setShowForm(false)
    } catch (err) {
      const msg = err.message || String(err);
      if (err.status === 401 || msg.includes('token') || msg.includes('session') || msg.includes('sign in')) {
        alert(`Authentication Error: ${msg}`);
      } else if (err.status === 403 || msg.includes('authorized') || msg.includes('permission')) {
        alert(`Permission Error: ${msg}`);
      } else {
        alert(`Product Save Error: ${msg}`);
      }
    } finally {
      setTimeout(() => setToast(''), 3000)
    }
  }

  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`Delete product "${name}"?`)) {
      try {
        await deleteProduct(id)
        setToast(`Product deleted successfully from database!`)
      } catch (err) {
        const msg = err.message || String(err);
        if (err.status === 401 || msg.includes('token') || msg.includes('session') || msg.includes('sign in')) {
          alert(`Authentication Error: ${msg}`);
        } else if (err.status === 403 || msg.includes('authorized') || msg.includes('permission')) {
          alert(`Permission Error: ${msg}`);
        } else {
          alert(`Product Delete Error: ${msg}`);
        }
      } finally {
        setTimeout(() => setToast(''), 3000)
      }
    }
  }

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_WIDTH = 800
          const MAX_HEIGHT = 800
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', 0.75))
        }
        img.src = String(e.target.result)
      }
      reader.readAsDataURL(file)
    })
  }

  const chooseImage = async e => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const compressedDataUrl = await compressImage(file)
      setDraft(d => ({ ...d, image: compressedDataUrl, imageUrl: compressedDataUrl, adminImage: compressedDataUrl }))
    } catch {
      const reader = new FileReader()
      reader.onload = () => setDraft(d => ({ ...d, image: String(reader.result), imageUrl: String(reader.result) }))
      reader.readAsDataURL(file)
    }

    try {
      const res = await apiClient('/media/presigned-upload-url', {
        method: 'POST',
        body: { fileName: file.name, fileType: file.type || 'image/jpeg', folder: 'products' },
        fallback: null
      })

      if (res && res.data && res.data.uploadUrl && res.data.publicUrl) {
        const uploadRes = await fetch(res.data.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type || 'image/jpeg' },
          body: file
        })
        if (uploadRes.ok) {
          setDraft(d => ({ ...d, image: res.data.publicUrl, imageUrl: res.data.publicUrl, adminImage: res.data.publicUrl }))
        }
      }
    } catch (err) {
      console.warn('S3 upload fallback to preview URL:', err)
    }
  }

  return (
    <section className="admin-table-card">
      <div className="table-heading" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Package size={18} style={{ color: '#b4811d' }} /> Products &amp; Menu Catalog</h2>
          <span style={{ fontSize: 11, color: '#78716c' }}>{products.length} products total</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{ position: 'absolute', left: 8, color: '#988e7d' }} />
            <input placeholder="Search products..." value={query} onChange={e => setQuery(e.target.value)} style={{ paddingLeft: 28, height: 32, borderRadius: 8, border: '1px solid #e2d8c8', fontSize: 11 }} />
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ height: 32, padding: '0 8px', borderRadius: 8, border: '1px solid #e2d8c8', fontSize: 11, background: '#fffdf9', fontWeight: 700 }}>
            <option value="ALL">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="admin-action-btn" type="button" onClick={openCreate}><Plus size={14} /> Add Product</button>
        </div>
      </div>
      {toast && (
        <div style={{ margin: '10px 14px 0', padding: '8px 14px', background: '#eaf7ed', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
          ✓ {toast}
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: 64 }}>Image</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Details</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td>
                  <div style={{ width: 46, height: 46, borderRadius: 10, overflow: 'hidden', background: '#f7f2e9', display: 'grid', placeItems: 'center' }}>
                    {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={18} color="#9a8c72" />}
                  </div>
                </td>
                <td><strong>{p.name}</strong></td>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 999, background: '#fff8e7', color: '#8a6312', fontSize: 10, fontWeight: 800 }}>
                    <Tag size={11} />{categories.find(c => c.id === p.category)?.name || 'Uncategorized'}
                  </span>
                </td>
                <td><strong>₹{p.price}</strong></td>
                <td>{p.portion || '-'} {p.calories ? `• ${p.calories} kcal` : ''}</td>
                <td>
                  <button type="button" onClick={() => toggleProductAvailability(p.id)} style={{ border: 0, background: 'transparent', display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: p.available ? '#15803d' : '#b91c1c', fontSize: 11, fontWeight: 800 }}>
                    {p.available ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                    {p.available ? 'Active' : 'Hidden'}
                  </button>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" className="secondary-btn" onClick={() => openEdit(p)}>Edit</button>
                    <button type="button" style={{ padding: '4px 8px', border: '1px solid #fca5a5', background: '#fff5f5', color: '#b91c1c', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontWeight: 700 }} onClick={() => handleDeleteProduct(p.id, p.name)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
          <form className="admin-modal-card" onSubmit={save} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18 }}>{editingId ? 'Edit Product' : 'Add Product'}</h2>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#78716c' }}>Update details to sync immediately with the live website.</p>
              </div>
              <button type="button" onClick={() => setShowForm(false)} style={{ border: 0, background: 'transparent', cursor: 'pointer' }}><X /></button>
            </div>
            
            <div className="admin-product-modal-grid">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label className="admin-form-field">
                  <span>Product Name</span>
                  <input required value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Butter Chicken Rice" />
                </label>
                <label className="admin-form-field">
                  <span>Category</span>
                  <select required value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <label className="admin-form-field">
                    <span>Price (₹)</span>
                    <input required type="number" min="0" value={draft.price} onChange={e => setDraft({ ...draft, price: e.target.value })} />
                  </label>
                  <label className="admin-form-field">
                    <span>Calories</span>
                    <input type="number" min="0" value={draft.calories} onChange={e => setDraft({ ...draft, calories: e.target.value })} />
                  </label>
                </div>
                <label className="admin-form-field">
                  <span>Portion Size</span>
                  <input value={draft.portion} onChange={e => setDraft({ ...draft, portion: e.target.value })} placeholder="e.g. 450g / 520g" />
                </label>
                <label className="admin-form-field">
                  <span>Description</span>
                  <textarea rows={3} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} placeholder="Describe ingredients, flavor profile..." />
                </label>
              </div>

              <div>
                <label className="admin-form-field" style={{ display: 'block' }}>
                  <span>Product Image</span>
                  <div style={{ marginTop: 8, border: '1px dashed #d9cdb9', borderRadius: 14, overflow: 'hidden', background: '#f7f2e9' }}>
                    {draft.image ? (
                      <img src={draft.image} alt="Preview" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ aspectRatio: '1', display: 'grid', placeItems: 'center', color: '#8c806c' }}>
                        <div style={{ textAlign: 'center' }}>
                          <ImageIcon size={32} />
                          <div style={{ fontSize: 11, marginTop: 6 }}>Choose a product image</div>
                        </div>
                      </div>
                    )}
                    <div style={{ padding: 10 }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '9px 10px', borderRadius: 9, background: '#1c1208', color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 800 }}>
                        <Upload size={13} /> Upload Image
                        <input type="file" accept="image/*" onChange={chooseImage} style={{ display: 'none' }} />
                      </label>
                    </div>
                  </div>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  <input type="checkbox" checked={draft.available} onChange={e => setDraft({ ...draft, available: e.target.checked })} />
                  Product available for ordering
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button type="button" className="secondary-btn" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="admin-action-btn" style={{ padding: '8px 16px', background: '#b4811d', color: '#fff', border: 0 }}>
                {editingId ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}

function Categories() {
  const { categories, products } = usePrototypeContext()
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('🍲')
  const [toast, setToast] = useState('')
  const [editingCategory, setEditingCategory] = useState(null)

  const handleAdd = async (e) => {
    if (e) e.preventDefault()
    if (!name.trim()) return
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, { name: name.trim(), icon })
        setToast(`Category "${name}" updated in database!`)
        setEditingCategory(null)
      } else {
        await addCategory({ name: name.trim(), icon })
        setToast(`Category "${name}" added to menu & database!`)
      }
      setName('')
    } catch (err) {
      const msg = err.message || String(err);
      if (err.status === 401 || msg.includes('token') || msg.includes('session') || msg.includes('sign in')) {
        alert(`Authentication Error: ${msg}`);
      } else if (err.status === 403 || msg.includes('authorized') || msg.includes('permission')) {
        alert(`Permission Error: ${msg}`);
      } else {
        alert(`Category Save Error: ${msg}`);
      }
    } finally {
      setTimeout(() => setToast(''), 3000)
    }
  }

  const startEdit = (cat) => {
    setEditingCategory(cat)
    setName(cat.name)
    setIcon(cat.icon || '🍲')
  }

  const handleDelete = async (id, catName) => {
    if (window.confirm(`Delete category "${catName}"?`)) {
      try {
        await deleteCategory(id)
        setToast(`Category deleted from database!`)
      } catch (err) {
        const msg = err.message || String(err);
        if (err.status === 401 || msg.includes('token') || msg.includes('session') || msg.includes('sign in')) {
          alert(`Authentication Error: ${msg}`);
        } else if (err.status === 403 || msg.includes('authorized') || msg.includes('permission')) {
          alert(`Permission Error: ${msg}`);
        } else {
          alert(`Category Delete Error: ${msg}`);
        }
      } finally {
        setTimeout(() => setToast(''), 3000)
      }
    }
  }

  return (
    <section className="admin-table-card">
      <div className="table-heading">
        <div>
          <h2><Tag size={18} style={{ color: '#b4811d' }} /> Food Categories</h2>
          <span style={{ fontSize: 11, color: '#78716c' }}>{categories.length} categories active</span>
        </div>
      </div>
      {toast && (
        <div style={{ margin: '10px 14px 0', padding: '8px 14px', background: '#eaf7ed', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
          ✓ {toast}
        </div>
      )}
      <form onSubmit={handleAdd} className="category-add-bar">
        <label className="admin-form-field" style={{ flex: 1, minWidth: 160 }}>
          <span>Category Name</span>
          <input placeholder="e.g. Rice Meals, Drinks..." value={name} onChange={e => setName(e.target.value)} required />
        </label>
        <label className="admin-form-field" style={{ width: 80 }}>
          <span>Icon Emoji</span>
          <input value={icon} onChange={e => setIcon(e.target.value)} style={{ textAlign: 'center' }} />
        </label>
        <button className="admin-action-btn" type="submit" style={{ marginTop: 18, height: 38, padding: '0 16px', background: '#b4811d', color: '#fff', border: 0 }}>
          <Plus size={14} /> {editingCategory ? 'Update Category' : 'Add Category'}
        </button>
        {editingCategory && (
          <button className="secondary-btn" type="button" onClick={() => { setEditingCategory(null); setName('') }} style={{ marginTop: 18, height: 38 }}>
            Cancel
          </button>
        )}
      </form>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Category Name</th>
              <th>Icon</th>
              <th>Total Products</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(c => (
              <tr key={c.id}>
                <td><strong>{c.name}</strong></td>
                <td><span style={{ fontSize: 18 }}>{c.icon || '🍲'}</span></td>
                <td><strong>{products.filter(p => p.category === c.id).length} items</strong></td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" className="secondary-btn" onClick={() => startEdit(c)}>Edit</button>
                    <button type="button" style={{ padding: '4px 8px', border: '1px solid #fca5a5', background: '#fff5f5', color: '#b91c1c', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontWeight: 700 }} onClick={() => handleDelete(c.id, c.name)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}


function nextStatus(status) { const flow = { CONFIRMED: 'PREPARING', PREPARING: 'READY_FOR_PICKUP', READY_FOR_PICKUP: 'ASSIGNED', ASSIGNED: 'PICKED_UP', PICKED_UP: 'OUT_FOR_DELIVERY', OUT_FOR_DELIVERY: 'DELIVERED' }; return flow[status] }
function Customers({ liveOrders = [] }) {
  const { orders = [], users = [] } = usePrototypeContext()
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  // Merge and deduplicate orders
  const allOrdersMap = new Map()
  ;(Array.isArray(liveOrders) ? liveOrders : []).forEach(o => { if (o?.id) allOrdersMap.set(o.id, o) })
  ;(Array.isArray(orders) ? orders : []).forEach(o => { if (o?.id && !allOrdersMap.has(o.id)) allOrdersMap.set(o.id, o) })
  const combinedOrders = Array.from(allOrdersMap.values())

  // Aggregate live customer profiles
  const customerMap = new Map()

  // 1. Registered users
  users.forEach(u => {
    if (u.role === 'customer' || !u.role) {
      const key = (u.mobile || u.email || u.name || '').toLowerCase().trim()
      if (key) {
        customerMap.set(key, {
          id: u.id,
          name: u.name || 'Valued Customer',
          mobile: u.mobile || '-',
          email: u.email || '-',
          ordersCount: 0,
          totalSpent: 0,
          orders: [],
          lastOrderDate: u.createdAt || new Date().toISOString(),
          preferredBranch: 'Bowl Central'
        })
      }
    }
  })

  // 2. Orders customers
  combinedOrders.forEach(o => {
    const custName = o.customer || 'Valued Guest'
    const mobile = o.customerMobile || '-'
    const key = (mobile !== '-' ? mobile : custName).toLowerCase().trim()

    if (!customerMap.has(key)) {
      customerMap.set(key, {
        id: `cust-${customerMap.size + 1}`,
        name: custName,
        mobile: mobile,
        email: '-',
        ordersCount: 0,
        totalSpent: 0,
        orders: [],
        lastOrderDate: o.createdAt || new Date().toISOString(),
        preferredBranch: o.branch || 'Bowl Central'
      })
    }

    const record = customerMap.get(key)
    record.ordersCount += 1
    record.totalSpent += Number(o.total || 0)
    record.orders.push(o)
    if (o.branch) record.preferredBranch = o.branch
    if (o.createdAt && new Date(o.createdAt) > new Date(record.lastOrderDate)) {
      record.lastOrderDate = o.createdAt
    }
  })

  const customerList = Array.from(customerMap.values()).map(c => {
    let customerTier = 'Active Diner'
    if (c.totalSpent >= 1500 || c.ordersCount >= 4) {
      customerTier = 'VIP Member'
    } else if (c.ordersCount >= 2) {
      customerTier = 'Repeat Customer'
    }
    return { ...c, tier: customerTier }
  })

  const filtered = customerList.filter(c => {
    const matchesQuery =
      c.name.toLowerCase().includes(filter.toLowerCase()) ||
      c.mobile.includes(filter) ||
      c.email.toLowerCase().includes(filter.toLowerCase()) ||
      c.preferredBranch.toLowerCase().includes(filter.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || c.tier === statusFilter
    return matchesQuery && matchesStatus
  })

  const totalSpentAll = customerList.reduce((acc, c) => acc + c.totalSpent, 0)
  const totalOrdersPlaced = combinedOrders.length
  const repeatCustomersCount = customerList.filter(c => c.ordersCount > 1).length
  const repeatRate = customerList.length ? Math.round((repeatCustomersCount / customerList.length) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── KPI Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        <div style={{ background: '#fff', border: '1px solid #eee4d2', borderLeft: '4px solid #dfa500', borderRadius: 14, padding: 14 }}>
          <span style={{ fontSize: 11, color: '#78716c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={15} color="#dfa500" /> Total Customers
          </span>
          <strong style={{ fontSize: 20, color: '#1c1917', fontWeight: 900, marginTop: 4, display: 'block' }}>
            {customerList.length} Diners
          </strong>
          <small style={{ color: '#16a34a', fontSize: 10, fontWeight: 700 }}>Live active directory</small>
        </div>

        <div style={{ background: '#fff', border: '1px solid #eee4d2', borderLeft: '4px solid #0284c7', borderRadius: 14, padding: 14 }}>
          <span style={{ fontSize: 11, color: '#78716c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Package size={15} color="#0284c7" /> Orders Placed
          </span>
          <strong style={{ fontSize: 20, color: '#0284c7', fontWeight: 900, marginTop: 4, display: 'block' }}>
            {totalOrdersPlaced} Orders
          </strong>
          <small style={{ color: '#64748b', fontSize: 10, fontWeight: 700 }}>Across all 3 branches</small>
        </div>

        <div style={{ background: '#fff', border: '1px solid #eee4d2', borderLeft: '4px solid #16a34a', borderRadius: 14, padding: 14 }}>
          <span style={{ fontSize: 11, color: '#78716c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <DollarSign size={15} color="#16a34a" /> Lifetime Value
          </span>
          <strong style={{ fontSize: 20, color: '#16a34a', fontWeight: 900, marginTop: 4, display: 'block' }}>
            ₹{totalSpentAll.toLocaleString('en-IN')}
          </strong>
          <small style={{ color: '#16a34a', fontSize: 10, fontWeight: 700 }}>Customer gross purchases</small>
        </div>

        <div style={{ background: '#fff', border: '1px solid #eee4d2', borderLeft: '4px solid #9333ea', borderRadius: 14, padding: 14 }}>
          <span style={{ fontSize: 11, color: '#78716c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={15} color="#9333ea" /> Repeat Diner Rate
          </span>
          <strong style={{ fontSize: 20, color: '#9333ea', fontWeight: 900, marginTop: 4, display: 'block' }}>
            {repeatRate}%
          </strong>
          <small style={{ color: '#9333ea', fontSize: 10, fontWeight: 700 }}>{repeatCustomersCount} returning customers</small>
        </div>
      </div>

      {/* ── Customer Records Table Card ── */}
      <section className="admin-table-card">
        <div className="table-heading" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1c1917' }}>
              <Users size={18} style={{ color: '#dfa500' }} /> Live Customer Base
            </h2>
            <span style={{ fontSize: 11.5, color: '#78716c' }}>
              Real-time customer profiles, order frequencies, and lifetime order histories.
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} style={{ position: 'absolute', left: 8, color: '#94a3b8' }} />
              <input
                placeholder="Search name, phone, branch..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                style={{
                  paddingLeft: 28,
                  height: 32,
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 11.5
                }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                height: 32,
                padding: '0 8px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 11.5,
                background: '#f8fafc',
                fontWeight: 700
              }}
            >
              <option value="ALL">All Diner Tiers</option>
              <option value="VIP Member">VIP Members</option>
              <option value="Repeat Customer">Repeat Diners</option>
              <option value="Active Diner">Active Diners</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Phone &amp; Contact</th>
                <th>Branch Outlet</th>
                <th>Total Orders</th>
                <th>Total Spend</th>
                <th>Diner Tier</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <Users size={30} style={{ opacity: 0.3 }} />
                      <strong style={{ fontSize: 13, color: '#64748b' }}>No customer records found</strong>
                      <span style={{ fontSize: 11 }}>Customer profiles automatically populate as orders are placed.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: '#fef3c7',
                            color: '#b45309',
                            fontWeight: 900,
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: 12
                          }}
                        >
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <strong style={{ color: '#1c1917', fontSize: 12.5 }}>{c.name}</strong>
                          <span style={{ display: 'block', fontSize: 10, color: '#78716c' }}>
                            Last active: {new Date(c.lastOrderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong style={{ fontSize: 11.5, color: '#334155' }}>{c.mobile}</strong>
                        {c.email !== '-' && <span style={{ display: 'block', fontSize: 10, color: '#78716c' }}>{c.email}</span>}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 11.5, color: '#475569' }}>{c.preferredBranch}</span>
                    </td>
                    <td>
                      <strong style={{ color: '#0284c7', fontSize: 12.5 }}>{c.ordersCount} orders</strong>
                    </td>
                    <td>
                      <strong style={{ color: '#16a34a', fontSize: 13 }}>₹{c.totalSpent.toLocaleString('en-IN')}</strong>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 12,
                          fontSize: 10,
                          fontWeight: 800,
                          background:
                            c.tier === 'VIP Member'
                              ? '#fef3c7'
                              : c.tier === 'Repeat Customer'
                              ? '#e0f2fe'
                              : '#f1f5f9',
                          color:
                            c.tier === 'VIP Member'
                              ? '#92400e'
                              : c.tier === 'Repeat Customer'
                              ? '#0369a1'
                              : '#475569',
                          border: `1px solid ${
                            c.tier === 'VIP Member'
                              ? '#fde68a'
                              : c.tier === 'Repeat Customer'
                              ? '#bae6fd'
                              : '#e2e8f0'
                          }`
                        }}
                      >
                        {c.tier === 'VIP Member' ? '👑 VIP' : c.tier === 'Repeat Customer' ? '⭐ Repeat' : '✓ Active'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(c)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: 6,
                          border: '1px solid #cbd5e1',
                          background: '#fff',
                          color: '#334155',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <Eye size={12} /> View Orders ({c.orders.length})
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Customer Orders Modal ── */}
      {selectedCustomer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 100,
            display: 'grid',
            placeItems: 'center',
            padding: 16
          }}
          onClick={() => setSelectedCustomer(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              width: 'min(500px, 100%)',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, color: '#1c1917' }}>{selectedCustomer.name}</h3>
                <span style={{ fontSize: 11, color: '#78716c' }}>
                  {selectedCustomer.mobile} • {selectedCustomer.ordersCount} Total Orders • ₹{selectedCustomer.totalSpent.toLocaleString('en-IN')} Spent
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                style={{ background: 'none', border: 0, fontSize: 18, cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <strong style={{ fontSize: 12, color: '#0f172a' }}>Order History</strong>
              {selectedCustomer.orders.length === 0 ? (
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '8px 0' }}>No placed orders yet.</p>
              ) : (
                selectedCustomer.orders.map(order => (
                  <div
                    key={order.id}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 12, color: '#0f172a' }}>#{order.id}</strong>
                      <span style={{ display: 'block', fontSize: 10.5, color: '#64748b' }}>
                        {order.branch} • {order.items ? `${order.items.length} items` : 'Bowl Meal'}
                      </span>
                      <small style={{ fontSize: 9.5, color: '#94a3b8' }}>
                        {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </small>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ color: '#16a34a', fontSize: 13 }}>₹{order.total}</strong>
                      <span
                        className={`table-status ${order.status.toLowerCase()}`}
                        style={{ display: 'block', marginTop: 4, fontSize: 9.5 }}
                      >
                        {order.status.replaceAll('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedCustomer(null)}
              style={{
                width: '100%',
                marginTop: 20,
                padding: 10,
                borderRadius: 10,
                border: 0,
                background: '#dfa500',
                color: '#1c1208',
                fontWeight: 900,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
function Delivery() {
  const { deliveryPartners = [], deliverySettings = {} } = usePrototypeContext()
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [toast, setToast] = useState('')
  
  // Modal for individual partner fee editing
  const [editingPartner, setEditingPartner] = useState(null)
  const [customPartnerFee, setCustomPartnerFee] = useState('')

  // Delivery Charges & Fee Controller State
  const [onboardingFee, setOnboardingFee] = useState(deliverySettings.onboardingFee ?? 499)
  const [kitFee, setKitFee] = useState(deliverySettings.kitFee ?? 350)
  const [verificationFee, setVerificationFee] = useState(deliverySettings.verificationFee ?? 149)
  const [payoutRate, setPayoutRate] = useState(deliverySettings.partnerDeliveryPayout ?? 45)
  const [customerDeliveryFee, setCustomerDeliveryFee] = useState(deliverySettings.customerDeliveryFee ?? 0)
  const [promoNotice, setPromoNotice] = useState(deliverySettings.promoNotice ?? 'Special Reduced Onboarding Fee Active (₹499 instead of ₹700)')

  const currentFeeNum = Number(onboardingFee)
  const discountPercent = currentFeeNum < 700 ? Math.round(((700 - currentFeeNum) / 700) * 100) : 0

  const handleApplyPreset = (fee, kit, veri, notice) => {
    setOnboardingFee(fee)
    setKitFee(kit)
    setVerificationFee(veri)
    setPromoNotice(notice)
  }

  const handleSaveSettings = (e) => {
    if (e) e.preventDefault()
    const feeNum = Number(onboardingFee)
    const kitNum = Number(kitFee)
    const veriNum = Number(verificationFee)
    const payoutNum = Number(payoutRate)
    const custNum = Number(customerDeliveryFee)
    const discount = feeNum < 700 ? Math.round(((700 - feeNum) / 700) * 100) : 0

    updateDeliverySettings({
      onboardingFee: feeNum,
      kitFee: kitNum,
      verificationFee: veriNum,
      partnerDeliveryPayout: payoutNum,
      customerDeliveryFee: custNum,
      discountPercent: discount,
      promoNotice: promoNotice.trim()
    })
    setToast(`✓ Delivery partner charges updated! Onboarding fee set to ₹${feeNum} (${discount > 0 ? `${discount}% discount applied` : 'Standard rate'}).`)
    setTimeout(() => setToast(''), 4000)
  }

  const handleApprovePartner = (id, name) => {
    updateDeliveryVerification(id, 'VERIFIED', 'PAID')
    setToast(`✓ Partner "${name}" verified and approved for live orders!`)
    setTimeout(() => setToast(''), 3000)
  }

  const handleWaiveFee = (id, name) => {
    waiveDeliveryPartnerFee(id)
    setToast(`✓ 100% Onboarding Fee Waived for "${name}" (Fee set to ₹0)!`)
    setTimeout(() => setToast(''), 3000)
  }

  const openEditFeeModal = (partner) => {
    setEditingPartner(partner)
    setCustomPartnerFee(partner.fee ?? onboardingFee)
  }

  const handleSaveIndividualFee = (e) => {
    e.preventDefault()
    if (!editingPartner) return
    const feeVal = Number(customPartnerFee)
    updateDeliveryPartnerFee(editingPartner.id, feeVal, feeVal === 0 ? 'WAIVED' : 'PAID')
    setToast(`✓ Updated fee for "${editingPartner.name}" to ₹${feeVal}!`)
    setEditingPartner(null)
    setTimeout(() => setToast(''), 3000)
  }

  const handleDeletePartner = (id, name) => {
    if (window.confirm(`Remove delivery partner "${name}" from fleet?`)) {
      deleteDeliveryPartner(id)
      setToast(`Delivery partner "${name}" removed.`)
      setTimeout(() => setToast(''), 3000)
    }
  }

  const filteredPartners = deliveryPartners.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(filter.toLowerCase()) ||
      p.mobile.includes(filter) ||
      (p.vehicle || '').toLowerCase().includes(filter.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || p.verificationStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  const verifiedCount = deliveryPartners.filter(p => p.verificationStatus === 'VERIFIED').length
  const pendingCount = deliveryPartners.filter(p => p.verificationStatus !== 'VERIFIED').length
  const totalEarningsDisbursed = deliveryPartners.reduce((acc, p) => acc + Number(p.earnings || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {toast && (
        <div style={{ padding: '10px 16px', background: '#eaf7ed', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 10, fontSize: 12.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(21,128,61,0.1)' }}>
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      {/* KPI Stats Grid — with Edit & Delete actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        <div style={{ background: '#fff', border: '1px solid #e2d8c8', borderLeft: '4px solid #b4811d', borderRadius: 14, padding: 14 }}>
          <span style={{ fontSize: 11, color: '#78716c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Truck size={14} color="#b4811d" /> Active Fleet
          </span>
          <strong style={{ fontSize: 20, color: '#1c1917', fontWeight: 900, marginTop: 4, display: 'block' }}>
            {deliveryPartners.length} Partners
          </strong>
          <small style={{ color: '#16a34a', fontSize: 10, fontWeight: 700 }}>{verifiedCount} verified • {pendingCount} pending</small>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2d8c8', borderLeft: '4px solid #0284c7', borderRadius: 14, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 11, color: '#78716c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Percent size={14} color="#0284c7" /> Onboarding Fee
            </span>
            <div style={{ display: 'flex', gap: 3 }}>
              <button type="button" title="Edit Onboarding Fee" onClick={() => { const val = prompt('Enter new Onboarding Fee (₹):', deliverySettings.onboardingFee ?? 499); if (val !== null && !isNaN(val)) { setOnboardingFee(Number(val)); setKitFee(Number(val) > 100 ? Math.round(Number(val)*0.7) : Number(val)); setVerificationFee(Number(val) > 100 ? Math.round(Number(val)*0.3) : 0); }}} style={{ border: 0, background: '#e0f2fe', color: '#0284c7', borderRadius: 5, width: 22, height: 22, display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: 11 }}>✏️</button>
              <button type="button" title="Reset to ₹0" onClick={() => { setOnboardingFee(0); setKitFee(0); setVerificationFee(0); setPromoNotice('🎉 100% Free Onboarding Promo Active!'); }} style={{ border: 0, background: '#fff5f5', color: '#dc2626', borderRadius: 5, width: 22, height: 22, display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: 11 }}>🗑️</button>
            </div>
          </div>
          <strong style={{ fontSize: 20, color: '#0284c7', fontWeight: 900, marginTop: 4, display: 'block' }}>
            {Number(deliverySettings.onboardingFee ?? 499) === 0 ? '₹0 FREE' : `₹${deliverySettings.onboardingFee ?? 499}`}
          </strong>
          <small style={{ color: '#0284c7', fontSize: 10, fontWeight: 700 }}>
            {Number(deliverySettings.onboardingFee ?? 499) < 700 ? `Reduced by ${Math.round(((700 - (deliverySettings.onboardingFee ?? 499)) / 700) * 100)}% from ₹700` : 'Standard ₹700 Rate'}
          </small>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2d8c8', borderLeft: '4px solid #16a34a', borderRadius: 14, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 11, color: '#78716c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
              <DollarSign size={14} color="#16a34a" /> Partner Pay / Trip
            </span>
            <div style={{ display: 'flex', gap: 3 }}>
              <button type="button" title="Edit Partner Payout" onClick={() => { const val = prompt('Enter new Partner Payout per Order (₹):', deliverySettings.partnerDeliveryPayout ?? 45); if (val !== null && !isNaN(val)) setPayoutRate(Number(val)); }} style={{ border: 0, background: '#dcfce7', color: '#16a34a', borderRadius: 5, width: 22, height: 22, display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: 11 }}>✏️</button>
              <button type="button" title="Reset to ₹0" onClick={() => setPayoutRate(0)} style={{ border: 0, background: '#fff5f5', color: '#dc2626', borderRadius: 5, width: 22, height: 22, display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: 11 }}>🗑️</button>
            </div>
          </div>
          <strong style={{ fontSize: 20, color: '#16a34a', fontWeight: 900, marginTop: 4, display: 'block' }}>
            ₹{deliverySettings.partnerDeliveryPayout ?? 45} / order
          </strong>
          <small style={{ color: '#16a34a', fontSize: 10, fontWeight: 700 }}>₹{totalEarningsDisbursed.toLocaleString('en-IN')} total paid out</small>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2d8c8', borderLeft: '4px solid #f59e0b', borderRadius: 14, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 11, color: '#78716c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Sparkles size={14} color="#f59e0b" /> Customer Delivery Fee
            </span>
            <div style={{ display: 'flex', gap: 3 }}>
              <button type="button" title="Edit Customer Delivery Fee" onClick={() => { const val = prompt('Enter new Customer Delivery Fee (₹):', deliverySettings.customerDeliveryFee ?? 0); if (val !== null && !isNaN(val)) setCustomerDeliveryFee(Number(val)); }} style={{ border: 0, background: '#fef3c7', color: '#b45309', borderRadius: 5, width: 22, height: 22, display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: 11 }}>✏️</button>
              <button type="button" title="Set to ₹0 (Free Delivery)" onClick={() => setCustomerDeliveryFee(0)} style={{ border: 0, background: '#fff5f5', color: '#dc2626', borderRadius: 5, width: 22, height: 22, display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: 11 }}>🗑️</button>
            </div>
          </div>
          <strong style={{ fontSize: 20, color: Number(deliverySettings.customerDeliveryFee ?? 0) === 0 ? '#16a34a' : '#b45309', fontWeight: 900, marginTop: 4, display: 'block' }}>
            {Number(deliverySettings.customerDeliveryFee ?? 0) === 0 ? '₹0 FREE' : `₹${deliverySettings.customerDeliveryFee ?? 0}`}
          </strong>
          <small style={{ color: '#78716c', fontSize: 10, fontWeight: 700 }}>
            {Number(deliverySettings.customerDeliveryFee ?? 0) === 0 ? '🎉 Free delivery for customers' : 'Charged at checkout'}
          </small>
        </div>
      </div>

      {/* ── DELIVERY CHARGES & REDUCTION CONTROLLER CARD ── */}
      <section className="admin-table-card" style={{ border: '1.5px solid #dfa500', background: 'linear-gradient(180deg, #ffffff 0%, #fffdf8 100%)' }}>
        <div className="table-heading" style={{ background: 'linear-gradient(135deg, #fff7e6 0%, #fffdf5 100%)', borderBottom: '1px solid #fed7aa', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9a3412', fontSize: 17 }}>
              <Sliders size={20} style={{ color: '#dfa500' }} /> Delivery Partner Charges &amp; Onboarding Fee Reducer
            </h2>
            <span style={{ fontSize: 11.5, color: '#78716c' }}>
              Adjust or reduce onboarding fees charged to delivery partners during registration. Changes sync instantly across the entire platform.
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ 
              background: currentFeeNum === 0 ? '#dcfce7' : (currentFeeNum < 700 ? '#fef08a' : '#f1f5f9'), 
              color: currentFeeNum === 0 ? '#15803d' : (currentFeeNum < 700 ? '#854d0e' : '#475569'), 
              padding: '5px 12px', 
              borderRadius: 20, 
              fontSize: 11, 
              fontWeight: 900,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}>
              {currentFeeNum === 0 ? '🎉 100% FEE WAIVER' : (discountPercent > 0 ? `🔥 ${discountPercent}% DISCOUNT ACTIVE` : 'STANDARD RATE')}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Quick Discount Presets */}
          <div>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#78716c', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
              ⚡ 1-Click Reduced Fee Presets
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
              <button
                type="button"
                onClick={() => handleApplyPreset(0, 0, 0, '🎉 100% Free Onboarding Promo Active!')}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: currentFeeNum === 0 ? '2px solid #16a34a' : '1px solid #bbf7d0',
                  background: currentFeeNum === 0 ? '#dcfce7' : '#f0fdf4',
                  color: '#166534',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: 11.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  textAlign: 'left'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <strong>Free (₹0)</strong> {currentFeeNum === 0 && <Check size={14} />}
                </span>
                <small style={{ fontSize: 9.5, opacity: 0.85 }}>100% Free Waiver Promo</small>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset(299, 200, 99, '🔥 Monsoon Flash Discount: Join Bowl Fleet for ₹299!')}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: currentFeeNum === 299 ? '2px solid #dfa500' : '1px solid #fed7aa',
                  background: currentFeeNum === 299 ? '#fef3c7' : '#fffbeb',
                  color: '#92400e',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: 11.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  textAlign: 'left'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <strong>Reduced ₹299</strong> {currentFeeNum === 299 && <Check size={14} />}
                </span>
                <small style={{ fontSize: 9.5, opacity: 0.85 }}>57% Off Flash Discount</small>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset(350, 250, 100, '⚡ Special 50% Off Partner Joining Fee (₹350)!')}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: currentFeeNum === 350 ? '2px solid #ea580c' : '1px solid #fed7aa',
                  background: currentFeeNum === 350 ? '#ffedd5' : '#fff7ed',
                  color: '#9a3412',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: 11.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  textAlign: 'left'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <strong>Reduced ₹350</strong> {currentFeeNum === 350 && <Check size={14} />}
                </span>
                <small style={{ fontSize: 9.5, opacity: 0.85 }}>Flat 50% Off Joining Kit</small>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset(499, 350, 149, 'Special Reduced Onboarding Fee Active (₹499 instead of ₹700)')}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: currentFeeNum === 499 ? '2px solid #0284c7' : '1px solid #bae6fd',
                  background: currentFeeNum === 499 ? '#e0f2fe' : '#f0f9ff',
                  color: '#0369a1',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: 11.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  textAlign: 'left'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <strong>Reduced ₹499</strong> {currentFeeNum === 499 && <Check size={14} />}
                </span>
                <small style={{ fontSize: 9.5, opacity: 0.85 }}>28% Off Standard Reduced</small>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset(700, 500, 200, 'Standard Delivery Partner Kit & Onboarding Fee')}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: currentFeeNum === 700 ? '2px solid #64748b' : '1px solid #e2e8f0',
                  background: currentFeeNum === 700 ? '#f1f5f9' : '#f8fafc',
                  color: '#334155',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: 11.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  textAlign: 'left'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <strong>Original ₹700</strong> {currentFeeNum === 700 && <Check size={14} />}
                </span>
                <small style={{ fontSize: 9.5, opacity: 0.85 }}>Full Regular Rate</small>
              </button>
            </div>
          </div>

          {/* Custom Settings Inputs Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, background: '#fff', border: '1px solid #eee4d2', borderRadius: 14, padding: 16 }}>
            <label className="admin-form-field">
              <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Total Onboarding Fee (₹)</span>
                <strong style={{ color: '#dfa500' }}>₹{onboardingFee}</strong>
              </span>
              <input
                type="number"
                min="0"
                max="2000"
                value={onboardingFee}
                onChange={e => {
                  const val = Number(e.target.value)
                  setOnboardingFee(val)
                  setKitFee(val > 100 ? Math.round(val * 0.7) : val)
                  setVerificationFee(val > 100 ? Math.round(val * 0.3) : 0)
                }}
                required
              />
              <span style={{ fontSize: 9.5, color: '#78716c' }}>Amount charged to new delivery partner via Razorpay</span>
            </label>

            <label className="admin-form-field">
              <span>Kit &amp; Uniform Fee (₹)</span>
              <input
                type="number"
                min="0"
                value={kitFee}
                onChange={e => setKitFee(Number(e.target.value))}
                required
              />
              <span style={{ fontSize: 9.5, color: '#78716c' }}>Delivery bag &amp; branded T-shirt charge</span>
            </label>

            <label className="admin-form-field">
              <span>Document Verification Fee (₹)</span>
              <input
                type="number"
                min="0"
                value={verificationFee}
                onChange={e => setVerificationFee(Number(e.target.value))}
                required
              />
              <span style={{ fontSize: 9.5, color: '#78716c' }}>Aadhaar &amp; driving license check charge</span>
            </label>

            <label className="admin-form-field">
              <span>Partner Pay / Delivery (₹)</span>
              <input
                type="number"
                min="0"
                value={payoutRate}
                onChange={e => setPayoutRate(Number(e.target.value))}
                required
              />
              <span style={{ fontSize: 9.5, color: '#78716c' }}>Amount driver receives per delivered order</span>
            </label>

            <label className="admin-form-field">
              <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Customer Delivery Fee (₹)</span>
                <span style={{ fontSize: 10, fontWeight: 900, color: Number(customerDeliveryFee) === 0 ? '#16a34a' : '#b45309' }}>
                  {Number(customerDeliveryFee) === 0 ? '🎉 Free Delivery Active' : `₹${customerDeliveryFee}`}
                </span>
              </span>
              <input
                type="number"
                min="0"
                value={customerDeliveryFee}
                onChange={e => setCustomerDeliveryFee(Number(e.target.value))}
                required
              />
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setCustomerDeliveryFee(0)}
                  style={{
                    flex: 1,
                    padding: '4px 6px',
                    borderRadius: 6,
                    border: Number(customerDeliveryFee) === 0 ? '1.5px solid #16a34a' : '1px solid #bbf7d0',
                    background: Number(customerDeliveryFee) === 0 ? '#dcfce7' : '#f0fdf4',
                    color: '#166534',
                    fontSize: 10,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  🎉 Set ₹0 (Free)
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerDeliveryFee(20)}
                  style={{
                    flex: 1,
                    padding: '4px 6px',
                    borderRadius: 6,
                    border: Number(customerDeliveryFee) === 20 ? '1.5px solid #dfa500' : '1px solid #fed7aa',
                    background: Number(customerDeliveryFee) === 20 ? '#fef3c7' : '#fffbeb',
                    color: '#92400e',
                    fontSize: 10,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  ⚡ Set ₹20
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerDeliveryFee(40)}
                  style={{
                    flex: 1,
                    padding: '4px 6px',
                    borderRadius: 6,
                    border: Number(customerDeliveryFee) === 40 ? '1.5px solid #64748b' : '1px solid #e2e8f0',
                    background: Number(customerDeliveryFee) === 40 ? '#f1f5f9' : '#f8fafc',
                    color: '#334155',
                    fontSize: 10,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Standard ₹40
                </button>
              </div>
              <span style={{ fontSize: 9.5, color: '#78716c' }}>Fee added to customer checkout (e.g. ₹0 Free Delivery or ₹40)</span>
            </label>

            <label className="admin-form-field" style={{ gridColumn: '1 / -1' }}>
              <span>Promotional Banner Notice</span>
              <input
                value={promoNotice}
                onChange={e => setPromoNotice(e.target.value)}
                placeholder="e.g. Special Discount Active: Join Golden Bowl for ₹299!"
              />
              <span style={{ fontSize: 9.5, color: '#78716c' }}>Displayed on the Delivery Partner Sign-Up and Payment screens</span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Delete all delivery charges? This will set ALL fees to ₹0.')) {
                  setOnboardingFee(0); setKitFee(0); setVerificationFee(0);
                  setPayoutRate(0); setCustomerDeliveryFee(0);
                  setPromoNotice('🎉 All delivery charges removed! Free onboarding & free delivery active.');
                  updateDeliverySettings({
                    onboardingFee: 0, kitFee: 0, verificationFee: 0,
                    partnerDeliveryPayout: 0, customerDeliveryFee: 0,
                    discountPercent: 100,
                    promoNotice: '🎉 All delivery charges removed! Free onboarding & free delivery active.'
                  });
                  setToast('🗑️ All delivery charges deleted & set to ₹0!');
                  setTimeout(() => setToast(''), 4000);
                }
              }}
              style={{ padding: '10px 16px', background: '#fff5f5', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              🗑️ Delete All Charges (Set ₹0)
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => handleApplyPreset(499, 350, 149, 'Special Reduced Onboarding Fee Active (₹499 instead of ₹700)')}
              >
                <RefreshCw size={13} /> Reset to ₹499
              </button>
              <button
                type="submit"
                className="admin-action-btn"
                style={{ padding: '10px 22px', background: '#b4811d', color: '#fff', border: 0, fontSize: 12, fontWeight: 800 }}
              >
                ✓ Save &amp; Apply Delivery Charges
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* ── FLEET PERSONNEL MANAGEMENT TABLE ── */}
      <section className="admin-table-card">
        <div className="table-heading" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Truck size={18} style={{ color: '#b4811d' }} /> Delivery Personnel &amp; Individual Fee Status
            </h2>
            <span style={{ fontSize: 11, color: '#78716c' }}>
              {deliveryPartners.length} registered partners ({verifiedCount} verified, {pendingCount} pending)
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} style={{ position: 'absolute', left: 8, color: '#988e7d' }} />
              <input
                placeholder="Search partner or vehicle..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                style={{ paddingLeft: 28, height: 34, borderRadius: 8, border: '1px solid #e2d8c8', fontSize: 11, background: '#fff' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fffdf9', border: '1px solid #e2d8c8', borderRadius: 8, padding: '0 8px', height: 34 }}>
              <Filter size={13} color="#b4811d" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ border: 0, background: 'transparent', fontSize: 11, fontWeight: 700, cursor: 'pointer', outline: 'none' }}
              >
                <option value="ALL">All Partners</option>
                <option value="VERIFIED">Verified</option>
                <option value="PENDING">Pending Approval</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Partner</th>
                <th>Vehicle</th>
                <th>Verification</th>
                <th>Onboarding Fee</th>
                <th>Trips &amp; Rating</th>
                <th>Earnings</th>
                <th>Fee &amp; Approval Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPartners.map(p => {
                const isWaived = p.fee === 0 || p.feeStatus === 'WAIVED'
                const isPaid = p.feeStatus === 'PAID'
                const isVerified = p.verificationStatus === 'VERIFIED'

                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#fff7df', color: '#9a6813', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 12 }}>
                          {p.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <strong>{p.name}</strong>
                          <span style={{ fontSize: 10, color: '#78716c', display: 'block' }}>+91 {p.mobile}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#44403c' }}>
                        <Bike size={13} color="#b4811d" /> {p.vehicle || 'Bike'}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 8px',
                        borderRadius: 20,
                        fontSize: 9.5,
                        fontWeight: 900,
                        background: isVerified ? '#eaf7ed' : '#fffbeb',
                        color: isVerified ? '#15803d' : '#b45309',
                        border: `1px solid ${isVerified ? '#bbf7d0' : '#fde68a'}`
                      }}>
                        {isVerified ? '✓ VERIFIED' : '⏳ PENDING'}
                      </span>
                    </td>
                    <td>
                      <div>
                        <strong style={{ color: isWaived ? '#16a34a' : '#1c1917', fontSize: 12 }}>
                          {isWaived ? '₹0 (Waived)' : `₹${p.fee ?? onboardingFee}`}
                        </strong>
                        <span style={{ 
                          display: 'block', 
                          fontSize: 9.5, 
                          fontWeight: 800,
                          color: isPaid ? '#16a34a' : (isWaived ? '#0284c7' : '#ea580c')
                        }}>
                          {isWaived ? '100% Admin Waived' : (isPaid ? '✓ Fee Paid' : '⏳ Payment Pending')}
                        </span>
                      </div>
                    </td>
                    <td>
                      <strong>{p.trips || 0} trips</strong>
                      <span style={{ display: 'block', fontSize: 10, color: '#b45309', fontWeight: 700 }}>
                        ★ {p.rating || '5.0'}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#16a34a' }}>₹{(p.earnings || 0).toLocaleString('en-IN')}</strong>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {!isVerified && (
                          <button
                            type="button"
                            onClick={() => handleApprovePartner(p.id, p.name)}
                            style={{ padding: '4px 8px', background: '#eaf7ed', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 6, fontSize: 10.5, fontWeight: 800, cursor: 'pointer' }}
                          >
                            ✓ Approve
                          </button>
                        )}
                        <button
                          type="button"
                          className="secondary-btn"
                          style={{ padding: '4px 8px', fontSize: 10.5 }}
                          onClick={() => openEditFeeModal(p)}
                        >
                          Reduce Fee
                        </button>
                        {!isWaived && (
                          <button
                            type="button"
                            onClick={() => handleWaiveFee(p.id, p.name)}
                            style={{ padding: '4px 8px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', borderRadius: 6, fontSize: 10.5, fontWeight: 800, cursor: 'pointer' }}
                          >
                            Waive (₹0)
                          </button>
                        )}
                        <button
                          type="button"
                          style={{ padding: '4px 8px', background: '#fff5f5', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 6, fontSize: 10.5, fontWeight: 700, cursor: 'pointer' }}
                          onClick={() => handleDeletePartner(p.id, p.name)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── MODAL: INDIVIDUAL PARTNER FEE EDIT / REDUCE ── */}
      {editingPartner && (
        <div className="admin-modal-overlay" onClick={() => setEditingPartner(null)}>
          <form className="admin-modal-card" style={{ maxWidth: 440 }} onSubmit={handleSaveIndividualFee} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 17, color: '#1c1917' }}>Reduce Fee for {editingPartner.name}</h2>
                <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#78716c' }}>
                  Set a custom onboarding fee or grant a 100% waiver.
                </p>
              </div>
              <button type="button" onClick={() => setEditingPartner(null)} style={{ border: 0, background: 'transparent', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label className="admin-form-field">
                <span>Custom Onboarding Fee (₹)</span>
                <input
                  type="number"
                  min="0"
                  value={customPartnerFee}
                  onChange={e => setCustomPartnerFee(e.target.value)}
                  placeholder="Enter reduced amount (e.g. 199, 299, 0)"
                  required
                />
              </label>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setCustomPartnerFee(0)}
                  style={{ flex: 1, padding: '7px 10px', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                >
                  🎁 Set ₹0 (100% Waived)
                </button>
                <button
                  type="button"
                  onClick={() => setCustomPartnerFee(299)}
                  style={{ flex: 1, padding: '7px 10px', background: '#fffbeb', color: '#92400e', border: '1px solid #fed7aa', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                >
                  ⚡ Set ₹299 (Discount)
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
              <button type="button" className="secondary-btn" onClick={() => setEditingPartner(null)}>Cancel</button>
              <button type="submit" className="admin-action-btn" style={{ padding: '8px 16px', background: '#b4811d', color: '#fff', border: 0 }}>
                Save Fee Change
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
function Support({ liveOrders = [] }) {
  const { supportAgents = [], issues = [], orders = [] } = usePrototypeContext()
  const [activeTab, setActiveTab] = useState('agents')
  const [agentSearch, setAgentSearch] = useState('')
  const [showAddAgentModal, setShowAddAgentModal] = useState(false)
  const [toast, setToast] = useState('')

  // Form states for adding agent
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [role, setRole] = useState('Support Specialist')
  const [shift, setShift] = useState('Morning (8 AM - 4 PM)')
  const [status, setStatus] = useState('Online')

  // Live order status update menu
  const [updatingOrderId, setUpdatingOrderId] = useState(null)

  // Merge orders
  const allOrdersMap = new Map()
  ;(Array.isArray(liveOrders) ? liveOrders : []).forEach(o => { if (o?.id) allOrdersMap.set(o.id, o) })
  ;(Array.isArray(orders) ? orders : []).forEach(o => { if (o?.id && !allOrdersMap.has(o.id)) allOrdersMap.set(o.id, o) })
  const combinedOrders = Array.from(allOrdersMap.values())

  const handleAddAgent = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    const newAgent = addSupportAgent({
      name: name.trim(),
      email: email.trim(),
      mobile: mobile.trim(),
      role,
      shift,
      status,
      cases: 0,
      resolved: 0
    })
    setToast(`✓ Agent "${newAgent.name}" added! Visible in Support Panel & Admin Console.`)
    setTimeout(() => setToast(''), 4000)
    setName('')
    setEmail('')
    setMobile('')
    setShowAddAgentModal(false)
  }

  const handleDeleteAgent = (id, agentName) => {
    if (window.confirm(`Are you sure you want to remove support agent "${agentName}"?`)) {
      deleteSupportAgent(id)
      setToast(`Agent "${agentName}" removed.`)
      setTimeout(() => setToast(''), 3000)
    }
  }

  const filteredAgents = supportAgents.filter(a =>
    a.name.toLowerCase().includes(agentSearch.toLowerCase()) ||
    a.role.toLowerCase().includes(agentSearch.toLowerCase()) ||
    (a.email && a.email.toLowerCase().includes(agentSearch.toLowerCase())) ||
    (a.mobile && a.mobile.includes(agentSearch))
  )

  const onlineAgentsCount = supportAgents.filter(a => a.status === 'Online').length
  const openIssuesCount = issues.filter(i => i.status !== 'RESOLVED').length
  const activeOrdersCount = combinedOrders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length

  const statusOptions = [
    { value: 'CONFIRMED', label: 'Confirmed', color: '#0284c7', bg: '#e0f2fe' },
    { value: 'PREPARING', label: 'Preparing', color: '#d97706', bg: '#fef3c7' },
    { value: 'READY_FOR_PICKUP', label: 'Ready for Pickup', color: '#9333ea', bg: '#f3e8ff' },
    { value: 'ASSIGNED', label: 'Partner Assigned', color: '#4f46e5', bg: '#e0e7ff' },
    { value: 'PICKED_UP', label: 'Picked Up', color: '#0891b2', bg: '#cffafe' },
    { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', color: '#ea580c', bg: '#ffedd5' },
    { value: 'DELIVERED', label: 'Delivered', color: '#16a34a', bg: '#dcfce7' },
    { value: 'CANCELLED', label: 'Cancelled', color: '#dc2626', bg: '#fee2e2' }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {toast && (
        <div style={{ padding: '10px 16px', background: '#eaf7ed', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 10, fontSize: 12.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      {/* ── KPI Metrics Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        <div style={{ background: '#fff', border: '1px solid #eee4d2', borderLeft: '4px solid #b4811d', borderRadius: 14, padding: 14 }}>
          <span style={{ fontSize: 11, color: '#78716c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={15} color="#b4811d" /> Total Agents
          </span>
          <strong style={{ fontSize: 20, color: '#1c1917', fontWeight: 900, marginTop: 4, display: 'block' }}>
            {supportAgents.length} Agents
          </strong>
          <small style={{ color: '#16a34a', fontSize: 10, fontWeight: 700 }}>{onlineAgentsCount} online on shift</small>
        </div>

        <div style={{ background: '#fff', border: '1px solid #eee4d2', borderLeft: '4px solid #16a34a', borderRadius: 14, padding: 14 }}>
          <span style={{ fontSize: 11, color: '#78716c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Headphones size={15} color="#16a34a" /> Live Care Desk
          </span>
          <strong style={{ fontSize: 20, color: '#16a34a', fontWeight: 900, marginTop: 4, display: 'block' }}>
            24/7 Active
          </strong>
          <small style={{ color: '#64748b', fontSize: 10, fontWeight: 700 }}>Synchronized with Support Panel</small>
        </div>

        <div style={{ background: '#fff', border: '1px solid #eee4d2', borderLeft: '4px solid #ef4444', borderRadius: 14, padding: 14 }}>
          <span style={{ fontSize: 11, color: '#78716c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertCircle size={15} color="#ef4444" /> Open Tickets
          </span>
          <strong style={{ fontSize: 20, color: '#ef4444', fontWeight: 900, marginTop: 4, display: 'block' }}>
            {openIssuesCount} Tickets
          </strong>
          <small style={{ color: '#64748b', fontSize: 10, fontWeight: 700 }}>Customer complaints</small>
        </div>

        <div style={{ background: '#fff', border: '1px solid #eee4d2', borderLeft: '4px solid #0284c7', borderRadius: 14, padding: 14 }}>
          <span style={{ fontSize: 11, color: '#78716c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Package size={15} color="#0284c7" /> Monitored Orders
          </span>
          <strong style={{ fontSize: 20, color: '#0284c7', fontWeight: 900, marginTop: 4, display: 'block' }}>
            {activeOrdersCount} Active
          </strong>
          <small style={{ color: '#0284c7', fontSize: 10, fontWeight: 700 }}>In kitchen &amp; delivery</small>
        </div>
      </div>

      {/* ── Sub-navigation Tabs ── */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e2d8c8', paddingBottom: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('agents')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: activeTab === 'agents' ? '2px solid #b4811d' : '1px solid #e2d8c8',
            background: activeTab === 'agents' ? '#fffdf5' : '#fff',
            color: activeTab === 'agents' ? '#9a3412' : '#64748b',
            fontWeight: 800,
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <Users size={14} /> Agent Management ({supportAgents.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tickets')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: activeTab === 'tickets' ? '2px solid #b4811d' : '1px solid #e2d8c8',
            background: activeTab === 'tickets' ? '#fffdf5' : '#fff',
            color: activeTab === 'tickets' ? '#9a3412' : '#64748b',
            fontWeight: 800,
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <Headphones size={14} /> Live Customer Tickets ({openIssuesCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('live_orders')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: activeTab === 'live_orders' ? '2px solid #b4811d' : '1px solid #e2d8c8',
            background: activeTab === 'live_orders' ? '#fffdf5' : '#fff',
            color: activeTab === 'live_orders' ? '#9a3412' : '#64748b',
            fontWeight: 800,
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <Package size={14} /> Live Order Queue ({activeOrdersCount})
        </button>
      </div>

      {/* ── TAB 1: AGENT MANAGEMENT ── */}
      {activeTab === 'agents' && (
        <section className="admin-table-card">
          <div className="table-heading" style={{ flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1c1917' }}>
                <Users size={18} style={{ color: '#b4811d' }} /> Support Agent Management
              </h2>
              <span style={{ fontSize: 11.5, color: '#78716c' }}>
                Onboard and manage customer support personnel. Agents added here are instantly available in the Support Panel.
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={14} style={{ position: 'absolute', left: 8, color: '#94a3b8' }} />
                <input
                  placeholder="Search agents..."
                  value={agentSearch}
                  onChange={e => setAgentSearch(e.target.value)}
                  style={{
                    paddingLeft: 28,
                    height: 32,
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 11.5
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => setShowAddAgentModal(true)}
                style={{
                  padding: '7px 14px',
                  background: '#b4811d',
                  color: '#fff',
                  border: 0,
                  borderRadius: 8,
                  fontSize: 11.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Plus size={14} /> Add Support Agent
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Agent Name</th>
                  <th>Contact Info</th>
                  <th>Designation / Role</th>
                  <th>Shift Schedule</th>
                  <th>Cases Handled</th>
                  <th>Live Shift Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgents.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <Users size={32} style={{ opacity: 0.3 }} />
                        <strong style={{ fontSize: 13, color: '#64748b' }}>No support agents found</strong>
                        <span style={{ fontSize: 11 }}>Click "+ Add Support Agent" above to onboard support team members.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAgents.map(a => (
                    <tr key={a.id || a.name}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: '#e0f2fe',
                              color: '#0369a1',
                              fontWeight: 900,
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: 12
                            }}
                          >
                            {a.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <strong style={{ color: '#1c1917', fontSize: 12.5 }}>{a.name}</strong>
                            <small style={{ display: 'block', fontSize: 9.5, color: '#78716c' }}>ID: {a.id}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 11, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Mail size={11} color="#64748b" /> {a.email || 'support@goldenbowl.com'}
                          </span>
                          {a.mobile && (
                            <span style={{ fontSize: 10.5, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Phone size={10} color="#94a3b8" /> {a.mobile}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a', fontSize: 12 }}>{a.role}</strong>
                      </td>
                      <td>
                        <span style={{ fontSize: 11, color: '#475569' }}>{a.shift}</span>
                      </td>
                      <td>
                        <div>
                          <strong style={{ color: '#0284c7', fontSize: 12 }}>{a.cases || 0} active</strong>
                          <span style={{ display: 'block', fontSize: 10, color: '#16a34a', fontWeight: 700 }}>
                            ✓ {a.resolved || 0} resolved
                          </span>
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(a.id)}
                          title="Click to toggle: Online / Busy / Offline"
                          style={{ border: 0, background: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: 12,
                              fontSize: 10,
                              fontWeight: 800,
                              background:
                                a.status === 'Online'
                                  ? '#f0fdf4'
                                  : a.status === 'Busy'
                                  ? '#fff7ed'
                                  : '#f1f5f9',
                              color:
                                a.status === 'Online'
                                  ? '#166534'
                                  : a.status === 'Busy'
                                  ? '#c2410c'
                                  : '#64748b',
                              border: `1px solid ${
                                a.status === 'Online'
                                  ? '#86efac'
                                  : a.status === 'Busy'
                                  ? '#fdba74'
                                  : '#cbd5e1'
                              }`
                            }}
                          >
                            {a.status === 'Online' ? '🟢 Online' : a.status === 'Busy' ? '🟠 Busy' : '⚪ Offline'}
                          </span>
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteAgent(a.id, a.name)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              border: '1px solid #fecaca',
                              background: '#fff5f5',
                              color: '#dc2626',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <Trash2 size={12} /> Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── TAB 2: LIVE CUSTOMER TICKETS ── */}
      {activeTab === 'tickets' && (
        <section className="admin-table-card">
          <div className="table-heading">
            <div>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1c1917' }}>
                <Headphones size={18} style={{ color: '#b4811d' }} /> Live Customer Support Tickets
              </h2>
              <span style={{ fontSize: 11.5, color: '#78716c' }}>
                Incoming customer queries, complaints, and ticket resolution desk.
              </span>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Customer Name</th>
                  <th>Subject / Issue</th>
                  <th>Priority</th>
                  <th>Assigned Agent</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {issues.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <Headphones size={30} style={{ opacity: 0.3 }} />
                        <strong style={{ fontSize: 13, color: '#64748b' }}>No open customer tickets</strong>
                        <span style={{ fontSize: 11 }}>All customer queries are currently answered and resolved.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  issues.map(i => (
                    <tr key={i.id}>
                      <td><strong>#{i.id.slice(-6)}</strong></td>
                      <td><strong>{i.customer}</strong></td>
                      <td><span style={{ fontSize: 11.5, color: '#334155' }}>{i.message || i.subject || 'Order issue'}</span></td>
                      <td>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 10,
                            fontSize: 10,
                            fontWeight: 800,
                            background: i.priority === 'Urgent' ? '#fee2e2' : i.priority === 'High' ? '#ffedd5' : '#f0fdf4',
                            color: i.priority === 'Urgent' ? '#dc2626' : i.priority === 'High' ? '#c2410c' : '#166534'
                          }}
                        >
                          {i.priority || 'Normal'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 11, color: '#475569', fontWeight: 700 }}>
                          {i.assignedAgent || 'Unassigned'}
                        </span>
                      </td>
                      <td>
                        <span className={`table-status ${i.status.toLowerCase()}`}>
                          {i.status}
                        </span>
                      </td>
                      <td>
                        {i.status !== 'RESOLVED' ? (
                          <button
                            type="button"
                            onClick={() => updateIssue(i.id, 'RESOLVED')}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 6,
                              border: 0,
                              background: '#16a34a',
                              color: '#fff',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            ✓ Resolve
                          </button>
                        ) : (
                          <span style={{ color: '#16a34a', fontWeight: 800, fontSize: 11 }}>✓ Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── TAB 3: LIVE ORDER QUEUE OVERSIGHT ── */}
      {activeTab === 'live_orders' && (
        <section className="admin-table-card">
          <div className="table-heading">
            <div>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1c1917' }}>
                <Package size={18} style={{ color: '#b4811d' }} /> Support Order Monitoring Queue
              </h2>
              <span style={{ fontSize: 11.5, color: '#78716c' }}>
                Live active order pipeline with instant status change controls.
              </span>
            </div>
          </div>

          <div style={{ overflowX: 'auto', overflowY: 'visible', minHeight: 220 }}>
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Branch</th>
                  <th>Total</th>
                  <th>Current Status</th>
                  <th>Change Status</th>
                </tr>
              </thead>
              <tbody>
                {combinedOrders.map(o => (
                  <tr key={o.id}>
                    <td><strong>#{o.id}</strong></td>
                    <td>
                      <div>
                        <strong>{o.customer}</strong>
                        <small style={{ display: 'block', fontSize: 10, color: '#78716c' }}>{o.customerMobile || '-'}</small>
                      </div>
                    </td>
                    <td>{o.branch}</td>
                    <td><strong>₹{o.total}</strong></td>
                    <td>
                      <span className={`table-status ${o.status.toLowerCase()}`}>
                        {o.status.replaceAll('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <button
                          type="button"
                          onClick={() => setUpdatingOrderId(updatingOrderId === o.id ? null : o.id)}
                          style={{
                            padding: '4px 10px',
                            border: '1px solid #b4811d',
                            borderRadius: 6,
                            background: updatingOrderId === o.id ? '#9a3412' : '#b4811d',
                            color: '#ffffff',
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <span>Update</span>
                          <ChevronDown size={12} />
                        </button>

                        {/* Status Options Menu */}
                        {updatingOrderId === o.id && (
                          <div
                            style={{
                              position: 'absolute',
                              right: 0,
                              top: '100%',
                              marginTop: 4,
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: 10,
                              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
                              zIndex: 100,
                              minWidth: 195,
                              padding: '6px 0'
                            }}
                          >
                            <div style={{ padding: '4px 12px 6px', borderBottom: '1px solid #f1f5f9', fontSize: 10, fontWeight: 800, color: '#64748b' }}>
                              SELECT STATUS
                            </div>
                            {statusOptions.map(opt => {
                              const isCurrent = o.status === opt.value
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={async () => {
                                    await updateOrderStatus(o.id, opt.value)
                                    setUpdatingOrderId(null)
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '7px 12px',
                                    border: 0,
                                    background: isCurrent ? opt.bg : 'transparent',
                                    color: isCurrent ? opt.color : '#1e293b',
                                    fontWeight: isCurrent ? 800 : 600,
                                    fontSize: 11,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    textAlign: 'left'
                                  }}
                                >
                                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: opt.color }} />
                                    {opt.label}
                                  </span>
                                  {isCurrent && <Check size={13} color={opt.color} />}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── MODAL: ADD SUPPORT AGENT ── */}
      {showAddAgentModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 100,
            display: 'grid',
            placeItems: 'center',
            padding: 16
          }}
          onClick={() => setShowAddAgentModal(false)}
        >
          <form
            className="admin-modal-card"
            style={{ maxWidth: 460 }}
            onSubmit={handleAddAgent}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 17, color: '#1c1917' }}>Add Support Agent</h2>
                <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#78716c' }}>
                  New agent will be synced across the Admin Console and Support Operations Desk.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAgentModal(false)}
                style={{ border: 0, background: 'transparent', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label className="admin-form-field">
                <span>Agent Full Name *</span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label className="admin-form-field">
                  <span>Official Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="rahul@goldenbowl.com"
                  />
                </label>

                <label className="admin-form-field">
                  <span>Mobile Contact</span>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label className="admin-form-field">
                  <span>Designation / Role</span>
                  <select value={role} onChange={e => setRole(e.target.value)}>
                    <option value="Support Specialist">Support Specialist</option>
                    <option value="Senior Care Specialist">Senior Care Specialist</option>
                    <option value="Escalation Lead">Escalation Lead</option>
                    <option value="Order Dispatch Liaison">Order Dispatch Liaison</option>
                  </select>
                </label>

                <label className="admin-form-field">
                  <span>Shift Schedule</span>
                  <select value={shift} onChange={e => setShift(e.target.value)}>
                    <option value="Morning (8 AM - 4 PM)">Morning (8 AM - 4 PM)</option>
                    <option value="Evening (4 PM - 12 AM)">Evening (4 PM - 12 AM)</option>
                    <option value="Night (12 AM - 8 AM)">Night (12 AM - 8 AM)</option>
                    <option value="General (9 AM - 6 PM)">General (9 AM - 6 PM)</option>
                  </select>
                </label>
              </div>

              <label className="admin-form-field">
                <span>Initial Shift Status</span>
                <select value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="Online">Online</option>
                  <option value="Busy">Busy</option>
                  <option value="Offline">Offline</option>
                </select>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
              <button type="button" className="secondary-btn" onClick={() => setShowAddAgentModal(false)}>
                Cancel
              </button>
              <button
                type="submit"
                className="admin-action-btn"
                style={{ padding: '8px 18px', background: '#b4811d', color: '#fff', border: 0 }}
              >
                Save &amp; Onboard Agent
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
function AdminNotifications() { return <section className="admin-table-card"><div className="table-heading"><h2><FileText size={18} style={{ color: '#b4811d' }} /> Notifications</h2></div><NotificationPanel role="admin" /></section> }

export default AdminPage
