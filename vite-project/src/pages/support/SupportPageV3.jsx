import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Package,
  Boxes,
  Headphones,
  BarChart3,
  Plus,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  Search,
  Users,
  Eye,
  ChevronDown,
  Check,
  Phone,
  Mail,
  Clock,
  Trash2,
  X
} from 'lucide-react'
import { usePrototypeContext } from '../../context/PrototypeContext'
import {
  updateOrderStatus,
  addProduct,
  toggleProductAvailability,
  addIssue,
  updateIssue,
  addSupportAgent,
  toggleSupportAgentStatus,
  deleteSupportAgent,
  orderStatuses
} from '../../services/prototypeStore'
import { NotificationPanel } from '../../components/notifications/NotificationPanel'
import './support-content.css'

const nextStatus = {
  CONFIRMED: 'PREPARING',
  PREPARING: 'READY_FOR_PICKUP',
  READY_FOR_PICKUP: 'ASSIGNED',
  ASSIGNED: 'PICKED_UP',
  PICKED_UP: 'OUT_FOR_DELIVERY',
  OUT_FOR_DELIVERY: 'DELIVERED'
}

export function SupportPageV3() {
  const { pathname } = useLocation()
  const path = pathname.replace('/support/', '') || 'dashboard'
  const state = usePrototypeContext()

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {path === 'dashboard' && <Dashboard state={state} />}
      {path === 'orders' && <Orders orders={state.orders} />}
      {path === 'products' && <Products products={state.products} />}
      {path === 'issues' && <Issues issues={state.issues} orders={state.orders} />}
      {path === 'agents' && <Agents />}
      {path === 'notifications' && (
        <NotificationPanel notifications={state.notifications} role="support" />
      )}
    </section>
  )
}

function Dashboard({ state }) {
  const openOrders = state.orders.filter(o => o.status !== 'DELIVERED').length
  const openIssues = state.issues ? state.issues.filter(i => i.status !== 'RESOLVED').length : 0

  return (
    <>
      {/* ── KPI Metric Cards ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 12
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #0284c7',
            borderRadius: 16,
            padding: 14,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Live Orders</span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#e0f2fe', display: 'grid', placeItems: 'center', color: '#0284c7' }}>
              <Package size={15} />
            </div>
          </div>
          <strong style={{ fontSize: 20, color: '#0f172a', fontWeight: 900 }}>{openOrders}</strong>
          <small style={{ color: '#0284c7', fontSize: 9.5, fontWeight: 700 }}>Active in delivery</small>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)',
            border: '1px solid #fee2e2',
            borderLeft: '4px solid #ef4444',
            borderRadius: 16,
            padding: 14,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Open Tickets</span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#fee2e2', display: 'grid', placeItems: 'center', color: '#ef4444' }}>
              <Headphones size={15} />
            </div>
          </div>
          <strong style={{ fontSize: 20, color: '#0f172a', fontWeight: 900 }}>{openIssues}</strong>
          <small style={{ color: '#ef4444', fontSize: 9.5, fontWeight: 700 }}>Require agent reply</small>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #16a34a',
            borderRadius: 16,
            padding: 14,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Agents Online</span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#dcfce7', display: 'grid', placeItems: 'center', color: '#16a34a' }}>
              <Users size={15} />
            </div>
          </div>
          <strong style={{ fontSize: 20, color: '#0f172a', fontWeight: 900 }}>
            {(state.supportAgents || []).filter(a => a.status === 'Online').length}
          </strong>
          <small style={{ color: '#16a34a', fontSize: 9.5, fontWeight: 700 }}>
            {(state.supportAgents || []).length} Total Agents Active
          </small>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fefce8 100%)',
            border: '1px solid #fef08a',
            borderLeft: '4px solid #ca8a04',
            borderRadius: 16,
            padding: 14,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>CSAT Score</span>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#fef9c3', display: 'grid', placeItems: 'center', color: '#ca8a04' }}>
              <BarChart3 size={15} />
            </div>
          </div>
          <strong style={{ fontSize: 20, color: '#0f172a', fontWeight: 900 }}>96.8%</strong>
          <small style={{ color: '#16a34a', fontSize: 9.5, fontWeight: 700 }}>Target 95%+</small>
        </div>
      </div>

      {/* ── Support SLA Target Banner ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          borderRadius: 18,
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          <span style={{ fontSize: 10, color: '#38bdf8', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>
            ⚡ SUPPORT RESPONSE SLA TARGET
          </span>
          <h3 style={{ margin: '4px 0 0', fontSize: 16, color: '#fff', fontWeight: 800 }}>
            38s Average Response Time (Goal: &lt; 45s)
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8' }}>
            98.4% of customer order queries resolved on first contact.
          </p>
        </div>
        <div style={{ minWidth: 160, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginBottom: 4, fontWeight: 700 }}>
            <span>98.4% SLA Met</span>
            <span>Target Achieved</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ width: '98%', height: '100%', background: 'linear-gradient(90deg, #0284c7, #38bdf8)', borderRadius: 10 }} />
          </div>
        </div>
      </div>

      <Orders orders={state.orders.slice(0, 5)} />
    </>
  )
}

const statusOptionsList = [
  { value: 'CONFIRMED', label: 'Confirmed', color: '#0284c7', bg: '#e0f2fe' },
  { value: 'PREPARING', label: 'Preparing in Kitchen', color: '#d97706', bg: '#fef3c7' },
  { value: 'READY_FOR_PICKUP', label: 'Ready for Pickup', color: '#9333ea', bg: '#f3e8ff' },
  { value: 'ASSIGNED', label: 'Partner Assigned', color: '#4f46e5', bg: '#e0e7ff' },
  { value: 'PICKED_UP', label: 'Picked Up', color: '#0891b2', bg: '#cffafe' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', color: '#ea580c', bg: '#ffedd5' },
  { value: 'DELIVERED', label: 'Delivered', color: '#16a34a', bg: '#dcfce7' },
  { value: 'CANCELLED', label: 'Cancelled', color: '#dc2626', bg: '#fee2e2' }
]

function Orders({ orders }) {
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [updatingOrderId, setUpdatingOrderId] = useState(null)

  const filtered = orders.filter(o => {
    const matchesSearch =
      o.id.toLowerCase().includes(filter.toLowerCase()) ||
      o.customer.toLowerCase().includes(filter.toLowerCase()) ||
      o.branch.toLowerCase().includes(filter.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="admin-table-card">
      <div className="table-heading" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Package size={18} style={{ color: '#0284c7' }} /> Live Orders Queue
          </h2>
          <span style={{ fontSize: 11, color: '#64748b' }}>{orders.length} Active Orders Monitored</span>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{ position: 'absolute', left: 8, color: '#94a3b8' }} />
            <input
              placeholder="Search order ID or customer..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{
                paddingLeft: 28,
                height: 32,
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 11
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
              fontSize: 11,
              background: '#f8fafc',
              fontWeight: 700
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PREPARING">Preparing</option>
            <option value="READY_FOR_PICKUP">Ready For Pickup</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="PICKED_UP">Picked Up</option>
            <option value="OUT_FOR_DELIVERY">Out For Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <div style={{ overflowX: 'auto', overflowY: 'visible', minHeight: 220 }}>
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer Details</th>
              <th>Branch</th>
              <th>Total</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id}>
                <td>
                  <strong>#{o.id}</strong>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <strong>{o.customer}</strong>
                    <small style={{ fontSize: 9.5, color: '#64748b' }}>{o.customerMobile || '+91 98765 43210'}</small>
                  </div>
                </td>
                <td>{o.branch}</td>
                <td>
                  <strong>₹{o.total}</strong>
                </td>
                <td>
                  <span className={`table-status ${o.status.toLowerCase()}`}>
                    {o.status.replaceAll('_', ' ')}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', position: 'relative' }}>
                    <button
                      type="button"
                      style={{
                        padding: '4px 8px',
                        border: '1px solid #cbd5e1',
                        borderRadius: 6,
                        background: '#fff',
                        cursor: 'pointer',
                        fontSize: 11,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                      onClick={() => setSelectedOrder(o)}
                    >
                      <Eye size={12} /> Details
                    </button>

                    <div style={{ position: 'relative' }}>
                      <button
                        type="button"
                        onClick={() => setUpdatingOrderId(updatingOrderId === o.id ? null : o.id)}
                        style={{
                          padding: '4px 10px',
                          border: '1px solid #0284c7',
                          borderRadius: 6,
                          background: updatingOrderId === o.id ? '#0369a1' : '#0284c7',
                          color: '#ffffff',
                          cursor: 'pointer',
                          fontSize: 11,
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          boxShadow: '0 1px 4px rgba(2,132,199,0.2)'
                        }}
                      >
                        <span>Update</span>
                        <ChevronDown size={12} />
                      </button>

                      {/* Dropdown Options Menu */}
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
                            SELECT LIVE STATUS
                          </div>
                          {statusOptionsList.map(opt => {
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
                                onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = '#f8fafc' }}
                                onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = 'transparent' }}
                              >
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: opt.color, display: 'inline-block' }} />
                                  {opt.label}
                                </span>
                                {isCurrent && <Check size={13} color={opt.color} />}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Order Detail Modal ── */}
      {selectedOrder && (
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
          onClick={() => setSelectedOrder(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 18,
              padding: 24,
              width: 'min(460px, 100%)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16 }}>Order #{selectedOrder.id} Details</h3>
                <span className={`table-status ${selectedOrder.status.toLowerCase()}`}>
                  {selectedOrder.status.replaceAll('_', ' ')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'none', border: 0, fontSize: 18, cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, color: '#334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
                <span>Customer Name</span>
                <strong>{selectedOrder.customer}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
                <span>Branch Outlet</span>
                <strong>{selectedOrder.branch}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
                <span>Order Total</span>
                <strong style={{ color: '#0f172a', fontSize: 14 }}>₹{selectedOrder.total}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
                <span>Assigned Partner</span>
                <strong>{selectedOrder.driver || 'Unassigned'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
                <span>Payment Mode</span>
                <strong>{selectedOrder.paymentMethod || 'UPI / Online'}</strong>
              </div>
            </div>

            {/* Quick Status Update Section inside Modal */}
            <div style={{ marginTop: 16, padding: 12, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong style={{ fontSize: 11.5, color: '#0f172a' }}>⚡ Update Status Live</strong>
                <small style={{ fontSize: 10, color: '#64748b' }}>Click option to update</small>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                {statusOptionsList.map(opt => {
                  const isCurrent = selectedOrder.status === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={async () => {
                        await updateOrderStatus(selectedOrder.id, opt.value)
                        setSelectedOrder(prev => ({ ...prev, status: opt.value }))
                      }}
                      style={{
                        padding: '6px 8px',
                        borderRadius: 8,
                        border: isCurrent ? `2px solid ${opt.color}` : '1px solid #cbd5e1',
                        background: isCurrent ? opt.bg : '#fff',
                        color: isCurrent ? opt.color : '#334155',
                        fontSize: 10.5,
                        fontWeight: isCurrent ? 800 : 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt.label}</span>
                      {isCurrent && <Check size={12} color={opt.color} />}
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              style={{
                width: '100%',
                marginTop: 16,
                padding: 10,
                borderRadius: 10,
                border: 0,
                background: '#0284c7',
                color: '#ffffff',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Products({ products }) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('bowls')

  const add = () => {
    if (name.trim() && price) {
      addProduct({
        name: name.trim(),
        price: Number(price),
        category: category,
        portion: '1 bowl',
        calories: 450,
        image: '🍲'
      })
      setName('')
      setPrice('')
    }
  }

  return (
    <div className="admin-table-card">
      <div className="table-heading" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Boxes size={18} style={{ color: '#0284c7' }} /> Menu &amp; Stock Control
          </h2>
          <span style={{ fontSize: 11, color: '#64748b' }}>Live Stock Controls for Support Agents</span>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            placeholder="Product name"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ height: 32, padding: '0 8px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 11 }}
          />
          <input
            placeholder="Price"
            type="number"
            value={price}
            onChange={e => setPrice(e.target.value)}
            style={{ height: 32, width: 70, padding: '0 8px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 11 }}
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            style={{ height: 32, padding: '0 6px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 11 }}
          >
            <option value="bowls">Bowls</option>
            <option value="salads">Salads</option>
            <option value="desserts">Desserts</option>
            <option value="drinks">Drinks</option>
          </select>
          <button
            onClick={add}
            className="admin-primary-btn"
            style={{ background: '#0284c7', color: '#fff', border: 0 }}
          >
            <Plus size={14} /> Add Item
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Dish</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock Status</th>
              <th>Toggle Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td>
                  <strong>{p.name}</strong>
                </td>
                <td>
                  <span style={{ textTransform: 'capitalize' }}>{p.category}</span>
                </td>
                <td>
                  <strong>₹{p.price}</strong>
                </td>
                <td>
                  <span className={`table-status ${p.available !== false ? 'active' : 'inactive'}`}>
                    {p.available !== false ? 'In Stock' : 'Out of Stock'}
                  </span>
                </td>
                <td>
                  <button
                    style={{ background: 'none', border: 0, cursor: 'pointer', color: p.available !== false ? '#16a34a' : '#94a3b8' }}
                    onClick={() => toggleProductAvailability(p.id)}
                    title="Toggle stock availability"
                  >
                    {p.available !== false ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Issues({ issues }) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [issueSubject, setIssueSubject] = useState('')
  const [priority, setPriority] = useState('Normal')
  const [filterPriority, setFilterPriority] = useState('ALL')

  const rows = issues && issues.length ? issues : []

  const filteredRows = rows.filter(r => filterPriority === 'ALL' || r.priority.toUpperCase() === filterPriority.toUpperCase())

  const handleCreate = (e) => {
    e.preventDefault()
    if (customerName.trim() && issueSubject.trim()) {
      addIssue({
        id: `TKT-${Math.floor(100 + Math.random() * 900)}`,
        customer: customerName.trim(),
        subject: issueSubject.trim(),
        priority: priority,
        status: 'OPEN'
      })
      setCustomerName('')
      setIssueSubject('')
      setShowCreateModal(false)
    }
  }

  return (
    <div className="admin-table-card">
      <div className="table-heading" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Headphones size={18} style={{ color: '#ef4444' }} /> Customer Support Tickets
          </h2>
          <span style={{ fontSize: 11, color: '#64748b' }}>{filteredRows.length} Active Complaints</span>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            style={{ height: 32, padding: '0 8px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 11 }}
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>

          <button
            onClick={() => setShowCreateModal(true)}
            className="admin-primary-btn"
            style={{ background: '#0284c7', color: '#fff', border: 0 }}
          >
            <Plus size={14} /> New Ticket
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Customer</th>
              <th>Subject / Complaint</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px 16px', color: '#94a3b8' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <Headphones size={32} style={{ opacity: 0.3 }} />
                    <span style={{ fontSize: 13, fontWeight: 700 }}>No support tickets</span>
                    <span style={{ fontSize: 11 }}>Customer tickets will appear here in real time.</span>
                  </div>
                </td>
              </tr>
            ) : filteredRows.map(i => (
              <tr key={i.id}>
                <td>
                  <strong>#{i.id}</strong>
                </td>
                <td>{i.customer}</td>
                <td>{i.subject}</td>
                <td>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: 12,
                      fontSize: 9.5,
                      fontWeight: 800,
                      background:
                        i.priority === 'Urgent'
                          ? '#fef2f2'
                          : i.priority === 'High'
                          ? '#fff7ed'
                          : '#f0fdf4',
                      color:
                        i.priority === 'Urgent'
                          ? '#dc2626'
                          : i.priority === 'High'
                          ? '#c2410c'
                          : '#166534',
                      border: `1px solid ${
                        i.priority === 'Urgent'
                          ? '#fca5a5'
                          : i.priority === 'High'
                          ? '#fdba74'
                          : '#86efac'
                      }`
                    }}
                  >
                    {i.priority}
                  </span>
                </td>
                <td>
                  <span className={`table-status ${i.status.toLowerCase()}`}>{i.status}</span>
                </td>
                <td>
                  {i.status !== 'RESOLVED' ? (
                    <button
                      className="admin-action-btn"
                      onClick={() => updateIssue(i.id, 'RESOLVED')}
                      style={{ background: '#16a34a', color: '#fff', border: 0 }}
                    >
                      <CheckCircle2 size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} /> Resolve
                    </button>
                  ) : (
                    <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 800 }}>✓ Resolved</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for creating ticket */}
      {showCreateModal && (
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
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              width: 'min(420px, 100%)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Create Support Ticket</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 4 }}>
                Customer Name
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}
                />
              </label>

              <label style={{ fontSize: 11, fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 4 }}>
                Issue Description
                <input
                  type="text"
                  required
                  value={issueSubject}
                  onChange={e => setIssueSubject(e.target.value)}
                  placeholder="Describe the complaint..."
                  style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}
                />
              </label>

              <label style={{ fontSize: 11, fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 4 }}>
                Priority Level
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}
                >
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </label>

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: 10, borderRadius: 8, border: 0, background: '#0284c7', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Agents() {
  const state = usePrototypeContext()
  const agents = state.supportAgents || []
  const [showAddModal, setShowAddModal] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [role, setRole] = useState('Support Specialist')
  const [shift, setShift] = useState('Morning (8 AM - 4 PM)')
  const [status, setStatus] = useState('Online')

  const handleAddAgent = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    addSupportAgent({
      name: name.trim(),
      email: email.trim(),
      mobile: mobile.trim(),
      role,
      shift,
      status,
      cases: 0,
      resolved: 0
    })
    setName('')
    setEmail('')
    setMobile('')
    setShowAddModal(false)
  }

  return (
    <div className="admin-table-card">
      <div className="table-heading" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={18} style={{ color: '#0284c7' }} /> Support Agent Roster
          </h2>
          <span style={{ fontSize: 11, color: '#64748b' }}>
            {agents.length} Total Agents • Real-time Shift &amp; Workload Monitoring
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '7px 14px',
            background: '#0284c7',
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
          <Plus size={14} /> Add Agent
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Agent Name &amp; Contact</th>
              <th>Role</th>
              <th>Shift</th>
              <th>Active Cases</th>
              <th>Resolved</th>
              <th>Live Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {agents.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px 16px', color: '#94a3b8' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <Users size={32} style={{ opacity: 0.3 }} />
                    <span style={{ fontSize: 13, fontWeight: 700 }}>No support agents registered</span>
                    <span style={{ fontSize: 11 }}>Agents added in Admin Panel or here will appear in this live roster.</span>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(true)}
                      style={{
                        marginTop: 6,
                        padding: '6px 12px',
                        background: '#0284c7',
                        color: '#fff',
                        border: 0,
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      + Add First Agent
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              agents.map((a) => (
                <tr key={a.id || a.name}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ color: '#0f172a' }}>{a.name}</strong>
                      <small style={{ fontSize: 10, color: '#64748b' }}>{a.email || a.mobile || 'support@goldenbowl.com'}</small>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>{a.role}</span>
                  </td>
                  <td>
                    <small style={{ color: '#64748b', fontSize: 10.5 }}>{a.shift}</small>
                  </td>
                  <td>
                    <strong style={{ color: '#0284c7' }}>{a.cases || 0}</strong>
                  </td>
                  <td>
                    <strong style={{ color: '#16a34a' }}>{a.resolved || 0}</strong>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleSupportAgentStatus(a.id)}
                      title="Click to toggle status: Online / Busy / Offline"
                      style={{
                        border: 0,
                        background: 'none',
                        cursor: 'pointer',
                        padding: 0
                      }}
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
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Remove support agent "${a.name}"?`)) {
                          deleteSupportAgent(a.id)
                        }
                      }}
                      style={{
                        border: '1px solid #fecaca',
                        background: '#fff5f5',
                        color: '#dc2626',
                        borderRadius: 6,
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: 11,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for adding agent */}
      {showAddModal && (
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
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              width: 'min(440px, 100%)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users size={18} style={{ color: '#0284c7' }} /> Add Support Agent
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 0, cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddAgent} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 4 }}>
                Agent Full Name *
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Ananya Sharma"
                  style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Official Email
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="agent@goldenbowl.com"
                    style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}
                  />
                </label>

                <label style={{ fontSize: 11, fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Mobile Number
                  <input
                    type="tel"
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    placeholder="+91 98765 43210"
                    style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Designation / Role
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}
                  >
                    <option value="Support Specialist">Support Specialist</option>
                    <option value="Senior Care Specialist">Senior Care Specialist</option>
                    <option value="Escalation Lead">Escalation Lead</option>
                    <option value="Order Dispatch Liaison">Order Dispatch Liaison</option>
                  </select>
                </label>

                <label style={{ fontSize: 11, fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  Shift
                  <select
                    value={shift}
                    onChange={e => setShift(e.target.value)}
                    style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}
                  >
                    <option value="Morning (8 AM - 4 PM)">Morning (8 AM - 4 PM)</option>
                    <option value="Evening (4 PM - 12 AM)">Evening (4 PM - 12 AM)</option>
                    <option value="Night (12 AM - 8 AM)">Night (12 AM - 8 AM)</option>
                    <option value="General (9 AM - 6 PM)">General (9 AM - 6 PM)</option>
                  </select>
                </label>
              </div>

              <label style={{ fontSize: 11, fontWeight: 700, display: 'flex', flexDirection: 'column', gap: 4 }}>
                Initial Status
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}
                >
                  <option value="Online">Online</option>
                  <option value="Busy">Busy</option>
                  <option value="Offline">Offline</option>
                </select>
              </label>

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: 10, borderRadius: 8, border: 0, background: '#0284c7', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
