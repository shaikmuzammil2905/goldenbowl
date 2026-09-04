import { useState, useEffect } from 'react'
import { Store, Plus, Search, Edit, Trash2 } from 'lucide-react'
import { branchApi } from '../../services/api/branchApi'

export function Branches() {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingBranch, setEditingBranch] = useState(null)
  const [toast, setToast] = useState('')
  
  const [draft, setDraft] = useState({ name: '', area: '', distance: '0 km', open: true })

  useEffect(() => {
    fetchBranches()
  }, [])

  const fetchBranches = async () => {
    try {
      setLoading(true)
      const res = await branchApi.getBranches()
      setBranches(res.data || res || [])
      setError(null)
    } catch (err) {
      setError('Failed to fetch branches. ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const filtered = branches.filter(b => b.name.toLowerCase().includes(query.toLowerCase()) || b.area.toLowerCase().includes(query.toLowerCase()))

  const openCreate = () => {
    setEditingBranch(null)
    setDraft({ name: '', area: '', distance: '0 km', open: true })
    setShowForm(true)
  }

  const openEdit = (b) => {
    setEditingBranch(b)
    setDraft({ name: b.name, area: b.area, distance: b.distance || '0 km', open: b.open ?? true })
    setShowForm(true)
  }

  const save = async (e) => {
    e.preventDefault()
    if (!draft.name.trim() || !draft.area.trim()) return

    try {
      if (editingBranch) {
        await branchApi.updateBranch(editingBranch.id, draft)
        setToast(`Branch "${draft.name}" updated successfully!`)
      } else {
        await branchApi.createBranch(draft)
        setToast(`Branch "${draft.name}" created successfully!`)
      }
      setShowForm(false)
      fetchBranches() // Refresh live data
    } catch (err) {
      alert(`Error saving branch: ${err.message}`)
    } finally {
      setTimeout(() => setToast(''), 3000)
    }
  }

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete branch "${name}"? This action cannot be undone.`)) {
      try {
        await branchApi.deleteBranch(id)
        setToast(`Branch "${name}" deleted!`)
        fetchBranches() // Refresh live data
      } catch (err) {
        alert(`Error deleting branch: ${err.message}`)
      } finally {
        setTimeout(() => setToast(''), 3000)
      }
    }
  }

  return (
    <section className="admin-table-card">
      <div className="table-heading" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Store size={18} style={{ color: '#b4811d' }} /> Restaurant Branches</h2>
          <span style={{ fontSize: 11, color: '#78716c' }}>{branches.length} branches total</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{ position: 'absolute', left: 8, color: '#988e7d' }} />
            <input placeholder="Search branches..." value={query} onChange={e => setQuery(e.target.value)} style={{ paddingLeft: 28, height: 32, borderRadius: 8, border: '1px solid #e2d8c8', fontSize: 11 }} />
          </div>
          <button className="admin-action-btn" type="button" onClick={openCreate}><Plus size={14} /> Add Branch</button>
        </div>
      </div>

      {toast && (
        <div style={{ margin: '10px 14px 0', padding: '8px 14px', background: '#eaf7ed', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
          ✓ {toast}
        </div>
      )}

      {error && (
        <div style={{ margin: '10px 14px 0', padding: '8px 14px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
          {error}
        </div>
      )}

      <div style={{ overflowX: 'auto', marginTop: 10 }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: '#78716c' }}>Loading branches...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Branch Name</th>
                <th>Area</th>
                <th>Distance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id}>
                  <td><strong>{b.name}</strong></td>
                  <td>{b.area}</td>
                  <td>{b.distance}</td>
                  <td>
                    <span style={{ padding: '4px 8px', borderRadius: 6, background: b.open ? '#eaf7ed' : '#fee2e2', color: b.open ? '#15803d' : '#b91c1c', fontSize: 11, fontWeight: 700 }}>
                      {b.open ? 'Open' : 'Closed'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" className="secondary-btn" onClick={() => openEdit(b)}><Edit size={12} style={{ marginRight: 4 }}/> Edit</button>
                      <button type="button" style={{ padding: '4px 8px', border: '1px solid #fca5a5', background: '#fff5f5', color: '#b91c1c', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center' }} onClick={() => handleDelete(b.id, b.name)}>
                        <Trash2 size={12} style={{ marginRight: 4 }}/> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 30, color: '#78716c' }}>No branches found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="admin-modal-overlay" onClick={() => setShowForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'grid', placeItems: 'center' }}>
          <form className="admin-modal-card" onSubmit={save} onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: 24, borderRadius: 12, width: '100%', maxWidth: 400 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18 }}>{editingBranch ? 'Edit Branch' : 'Add Branch'}</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 700 }}>
                Branch Name
                <input required value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} style={{ padding: '8px 12px', border: '1px solid #e2d8c8', borderRadius: 8 }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 700 }}>
                Area / City
                <input required value={draft.area} onChange={e => setDraft({ ...draft, area: e.target.value })} style={{ padding: '8px 12px', border: '1px solid #e2d8c8', borderRadius: 8 }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 700 }}>
                Distance (approx)
                <input value={draft.distance} onChange={e => setDraft({ ...draft, distance: e.target.value })} style={{ padding: '8px 12px', border: '1px solid #e2d8c8', borderRadius: 8 }} />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, marginTop: 8 }}>
                <input type="checkbox" checked={draft.open} onChange={e => setDraft({ ...draft, open: e.target.checked })} />
                Branch is Open
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '8px 16px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>Cancel</button>
              <button type="submit" style={{ padding: '8px 16px', background: '#b4811d', color: '#fff', border: 0, borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
                {editingBranch ? 'Save Changes' : 'Create Branch'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
