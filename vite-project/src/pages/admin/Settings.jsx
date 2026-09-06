import { useState } from 'react'
import { Settings as SettingsIcon, Truck, Save, Check } from 'lucide-react'
import { updateDeliverySettings } from '../../services/prototypeStore'
import { usePrototypeContext } from '../../context/PrototypeContext'

export function Settings() {
  const { deliverySettings = {} } = usePrototypeContext()
  const [activeTab, setActiveTab] = useState('delivery')
  const [toast, setToast] = useState('')

  // Delivery Settings State
  const [deliveryEnabled, setDeliveryEnabled] = useState(deliverySettings.deliveryEnabled ?? true)
  const [defaultMethod, setDefaultMethod] = useState(deliverySettings.defaultMethod || 'DIRECT')
  const [autoAssignment, setAutoAssignment] = useState(deliverySettings.autoAssignment ?? false)

  const handleSave = (e) => {
    e.preventDefault()
    updateDeliverySettings({
      deliveryEnabled,
      defaultMethod,
      autoAssignment
    })
    setToast('Delivery Settings Saved!')
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #dfa500 0%, #b4811d 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <SettingsIcon size={20} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, color: '#1c1917', fontWeight: 900 }}>System Settings</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#78716c' }}>Manage global platform configuration</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={() => setActiveTab('delivery')}
            style={{
              padding: '12px 16px',
              textAlign: 'left',
              background: activeTab === 'delivery' ? '#fff' : 'transparent',
              border: 'none',
              borderRadius: 12,
              color: activeTab === 'delivery' ? '#dfa500' : '#78716c',
              fontWeight: activeTab === 'delivery' ? 800 : 600,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
              boxShadow: activeTab === 'delivery' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            <Truck size={18} /> Delivery Settings
          </button>
        </div>

        <div style={{ flex: 1, background: '#fff', borderRadius: 16, border: '1px solid #e2d8c8', padding: 24 }}>
          {activeTab === 'delivery' && (
            <form onSubmit={handleSave}>
              <h3 style={{ margin: '0 0 20px', fontSize: 16, color: '#1c1917', fontWeight: 800 }}>Delivery & Logistics</h3>
              
              <div style={{ display: 'grid', gap: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#fafaf9', borderRadius: 12, border: '1px solid #f5f5f4' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, color: '#1c1917', fontWeight: 700 }}>Enable Delivery</h4>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#78716c' }}>Allow customers to place delivery orders.</p>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" checked={deliveryEnabled} onChange={e => setDeliveryEnabled(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#dfa500' }} />
                  </label>
                </div>

                <div style={{ padding: '16px', background: '#fafaf9', borderRadius: 12, border: '1px solid #f5f5f4' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#1c1917', fontWeight: 700 }}>Default Delivery Method</h4>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input type="radio" name="defaultMethod" value="DIRECT" checked={defaultMethod === 'DIRECT'} onChange={e => setDefaultMethod(e.target.value)} style={{ accentColor: '#dfa500' }} />
                      <span style={{ fontSize: 13, color: '#444' }}>Direct Delivery (In-house)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input type="radio" name="defaultMethod" value="PARTNER" checked={defaultMethod === 'PARTNER'} onChange={e => setDefaultMethod(e.target.value)} style={{ accentColor: '#dfa500' }} />
                      <span style={{ fontSize: 13, color: '#444' }}>Delivery Partner Network</span>
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#fafaf9', borderRadius: 12, border: '1px solid #f5f5f4' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, color: '#1c1917', fontWeight: 700 }}>Auto-Assign Delivery Partners</h4>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#78716c' }}>Automatically broadcast requests to eligible partners.</p>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" checked={autoAssignment} onChange={e => setAutoAssignment(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#dfa500' }} />
                  </label>
                </div>
              </div>

              <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16 }}>
                {toast && <span style={{ color: '#16a34a', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><Check size={16} /> {toast}</span>}
                <button type="submit" style={{ padding: '12px 24px', background: '#dfa500', color: '#1c1208', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Save size={16} /> Save Changes
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
