import { useMemo, useState } from 'react'
import {
  BarChart3,
  TrendingUp,
  ShoppingBag,
  IndianRupee,
  Download,
} from 'lucide-react'
import { usePrototypeContext } from '../../context/PrototypeContext'

export function AdminReports() {
  const { orders, branches } = usePrototypeContext()
  const [range, setRange] = useState('This week')
  const [downloadMsg, setDownloadMsg] = useState('')

  const completed = orders.filter(o => o.status === 'DELIVERED')
  const revenue = completed.reduce((sum, o) => sum + Number(o.total || 0), 0)
  const gross = orders.reduce((sum, o) => sum + Number(o.total || 0), 0)
  const avg = orders.length ? Math.round(gross / orders.length) : 0

  const branchRows = useMemo(
    () =>
      branches.map(branch => {
        const branchOrders = orders.filter(o => o.branch === branch.name)
        const branchRevenue = branchOrders.reduce((sum, o) => sum + Number(o.total || 0), 0)
        return { ...branch, count: branchOrders.length, revenue: branchRevenue }
      }),
    [branches, orders]
  )
  const maxRevenue = Math.max(...branchRows.map(b => b.revenue), 1)

  const handleExport = () => {
    setDownloadMsg('⚡ Sales Report CSV exported successfully!')
    setTimeout(() => setDownloadMsg(''), 3000)
  }

  return (
    <section className="admin-reports" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Toolbar ── */}
      <div
        className="report-toolbar"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          background: '#ffffff',
          padding: 16,
          borderRadius: 16,
          border: '1px solid #eee4d2'
        }}
      >
        <div>
          <span style={{ fontSize: 9.5, color: '#dfa500', fontWeight: 800, letterSpacing: 1.2, textTransform: 'uppercase' }}>
            BUSINESS INTELLIGENCE &amp; REVENUE ANALYTICS
          </span>
          <h2 style={{ margin: '2px 0 0', fontSize: 18, color: '#1c1917', fontWeight: 900 }}>Sales &amp; Analytics Dashboard</h2>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={range}
            onChange={e => setRange(e.target.value)}
            style={{
              height: 36,
              padding: '0 12px',
              borderRadius: 10,
              border: '1px solid #e2d8c8',
              fontSize: 11,
              fontWeight: 700,
              background: '#faf8f5',
              cursor: 'pointer'
            }}
          >
            <option>Today</option>
            <option>This week</option>
            <option>This month</option>
            <option>All time</option>
          </select>

          <button
            onClick={handleExport}
            style={{
              height: 36,
              padding: '0 14px',
              borderRadius: 10,
              border: 0,
              background: '#1c1917',
              color: '#f5c518',
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Download size={14} /> Export Report
          </button>
        </div>
      </div>

      {downloadMsg && (
        <div style={{ padding: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>
          {downloadMsg}
        </div>
      )}

      {/* ── Metric Cards Grid ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12
        }}
      >
        <article
          style={{
            background: '#ffffff',
            border: '1px solid #eee4d2',
            borderRadius: 16,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#dfa500' }}>
            <span style={{ fontSize: 11, color: '#78716c', fontWeight: 700 }}>Delivered Revenue</span>
            <IndianRupee size={16} />
          </div>
          <strong style={{ fontSize: 20, color: '#1c1917', fontWeight: 900 }}>₹{revenue.toLocaleString('en-IN')}</strong>
          <small style={{ color: '#16a34a', fontSize: 9.5, fontWeight: 700 }}>100% Verified Payouts</small>
        </article>

        <article
          style={{
            background: '#ffffff',
            border: '1px solid #eee4d2',
            borderRadius: 16,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#0284c7' }}>
            <span style={{ fontSize: 11, color: '#78716c', fontWeight: 700 }}>Total Orders</span>
            <ShoppingBag size={16} />
          </div>
          <strong style={{ fontSize: 20, color: '#1c1917', fontWeight: 900 }}>{orders.length}</strong>
          <small style={{ color: '#0284c7', fontSize: 9.5, fontWeight: 700 }}>{completed.length} Delivered</small>
        </article>

        <article
          style={{
            background: '#ffffff',
            border: '1px solid #eee4d2',
            borderRadius: 16,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#16a34a' }}>
            <span style={{ fontSize: 11, color: '#78716c', fontWeight: 700 }}>Avg Order Value</span>
            <TrendingUp size={16} />
          </div>
          <strong style={{ fontSize: 20, color: '#1c1917', fontWeight: 900 }}>₹{avg.toLocaleString('en-IN')}</strong>
          <small style={{ color: '#16a34a', fontSize: 9.5, fontWeight: 700 }}>+8.4% Basket size</small>
        </article>

        <article
          style={{
            background: '#ffffff',
            border: '1px solid #eee4d2',
            borderRadius: 16,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#9333ea' }}>
            <span style={{ fontSize: 11, color: '#78716c', fontWeight: 700 }}>Fulfillment Rate</span>
            <BarChart3 size={16} />
          </div>
          <strong style={{ fontSize: 20, color: '#1c1917', fontWeight: 900 }}>98.6%</strong>
          <small style={{ color: '#16a34a', fontSize: 9.5, fontWeight: 700 }}>Low cancellations</small>
        </article>
      </div>

      {/* ── Visual Analytics Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {/* Branch Performance Bars */}
        <article className="admin-table-card" style={{ padding: 18 }}>
          <div className="table-heading" style={{ padding: 0, marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>Branch Revenue Distribution</h3>
            <span style={{ fontSize: 10, color: '#78716c' }}>{range}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {branchRows.map(b => (
              <div key={b.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
                  <strong>{b.name}</strong>
                  <span style={{ fontWeight: 800, color: '#1c1917' }}>
                    ₹{b.revenue.toLocaleString('en-IN')} <small style={{ color: '#78716c', fontWeight: 500 }}>({b.count} orders)</small>
                  </span>
                </div>
                <div style={{ height: 10, background: '#f5efe2', borderRadius: 10, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.max(8, (b.revenue / maxRevenue) * 100)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #dfa500, #f5c518)',
                      borderRadius: 10,
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* Order Status Funnel */}
        <article className="admin-table-card" style={{ padding: 18 }}>
          <div className="table-heading" style={{ padding: 0, marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>Order Pipeline Breakup</h3>
            <span style={{ fontSize: 10, color: '#78716c' }}>Live Status</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].map(status => {
              const count = orders.filter(o => o.status === status).length
              return (
                <div
                  key={status}
                  style={{
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: '#faf8f5',
                    borderRadius: 10,
                    border: '1px solid #f0e9dc',
                    fontSize: 11
                  }}
                >
                  <span style={{ fontWeight: 700, color: '#44403c' }}>{status.replaceAll('_', ' ')}</span>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 10,
                      background: count > 0 ? '#1c1917' : '#e2d8c8',
                      color: count > 0 ? '#f5c518' : '#78716c',
                      fontWeight: 800,
                      fontSize: 10
                    }}
                  >
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </article>
      </div>

      {/* ── Payment Method Breakdown ── */}
      <div className="admin-table-card" style={{ padding: 18 }}>
        <div className="table-heading" style={{ padding: 0, marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>Payment Method Split</h3>
          <span style={{ fontSize: 10, color: '#78716c' }}>UPI / Cards / Wallets</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
          {[
            { mode: 'UPI (GPay / PhonePe)', share: '68%', total: '₹57,290', icon: '📱' },
            { mode: 'Credit / Debit Card', share: '22%', total: '₹18,530', icon: '💳' },
            { mode: 'Digital Wallets', share: '7%', total: '₹5,900', icon: '👛' },
            { mode: 'Net Banking', share: '3%', total: '₹2,530', icon: '🏦' }
          ].map(p => (
            <div
              key={p.mode}
              style={{
                padding: 12,
                borderRadius: 12,
                border: '1px solid #f0e9dc',
                background: '#faf8f5',
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}
            >
              <span style={{ fontSize: 16 }}>{p.icon}</span>
              <strong style={{ fontSize: 11, color: '#1c1917' }}>{p.mode}</strong>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#dfa500' }}>{p.share}</div>
              <small style={{ fontSize: 9.5, color: '#78716c' }}>{p.total}</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
