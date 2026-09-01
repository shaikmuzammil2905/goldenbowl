import { useMemo, useRef, useState } from 'react'
import { Image as ImageIcon, Package, Plus, Search, Tag, Upload, X } from 'lucide-react'
import { usePrototypeContext } from '../../context/PrototypeContext'
import { addProduct, updateProduct, toggleProductAvailability } from '../../services/prototypeStore'
import { apiClient } from '../../services/api/apiClient'
import './admin-content.css'

const BATCHES = [
  { key: 'veg', label: 'Veg', icon: '🥬' },
  { key: 'vegan', label: 'Vegan', icon: '🌱' },
  { key: 'sugarFree', label: 'Sugar Free', icon: '🚫🍬' },
]

const emptyDraft = (category = '') => ({
  name: '', category, price: '', calories: '', portion: '', description: '', image: '', available: true,
  veg: false, vegan: false, sugarFree: false,
})

const badgeStyle = key => ({
  display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 6px', borderRadius: 999,
  background: key === 'veg' ? '#e9f8ee' : key === 'vegan' ? '#edf9e9' : '#fff3e0',
  color: key === 'sugarFree' ? '#9a5b00' : '#16733a', fontSize: 9, fontWeight: 900, whiteSpace: 'nowrap',
})

export function ProductsPage() {
  const { products, categories } = usePrototypeContext()
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState(emptyDraft(categories[0]?.id || ''))
  const fileRef = useRef(null)

  const filtered = useMemo(() => products.filter(p => {
    const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase())
    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter
    return matchesQuery && matchesCategory
  }), [products, query, categoryFilter])

  const openCreate = () => {
    setEditingId(null); setDraft(emptyDraft(categories[0]?.id || '')); setShowForm(true)
  }

  const openEdit = product => {
    setEditingId(product.id)
    setDraft({
      name: product.name || '', category: product.category || categories[0]?.id || '', price: product.price ?? '',
      calories: product.calories ?? '', portion: product.portion || '', description: product.description || '',
      image: product.adminImage || product.image || product.imageUrl || '', available: product.available !== false,
      veg: !!product.veg, vegan: !!product.vegan, sugarFree: !!product.sugarFree,
    })
    setShowForm(true)
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

  const chooseImage = async event => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const compressedDataUrl = await compressImage(file)
      setDraft(current => ({ ...current, image: compressedDataUrl, imageUrl: compressedDataUrl, adminImage: compressedDataUrl }))
    } catch {
      const reader = new FileReader()
      reader.onload = () => setDraft(current => ({ ...current, image: String(reader.result), imageUrl: String(reader.result) }))
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
      console.warn('S3 upload fallback:', err)
    }

    event.target.value = ''
  }

  const save = async event => {
    event.preventDefault()
    if (!draft.name.trim() || !draft.category || !draft.price) return
    const img = draft.image || draft.imageUrl || draft.adminImage || ''
    const changes = {
      name: draft.name.trim(), category: draft.category, price: Number(draft.price), calories: Number(draft.calories || 0),
      portion: draft.portion, description: draft.description, available: draft.available,
      image: img, imageUrl: img, adminImage: img,
      veg: draft.veg, vegan: draft.vegan, sugarFree: draft.sugarFree,
    }
    try {
      if (editingId) await updateProduct(editingId, changes)
      else await addProduct(changes)
      setShowForm(false)
    } catch (err) {
      alert(`Database Error: ${err.message}`)
    }
  }

  const renderBatches = product => {
    const active = BATCHES.filter(batch => product[batch.key])
    return active.length ? <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{active.map(batch => <span key={batch.key} style={badgeStyle(batch.key)}>{batch.icon} {batch.label}</span>)}</div> : <span style={{ color: '#a39a8b', fontSize: 10 }}>—</span>
  }

  return (
    <section className="admin-table-card">
      <div className="table-heading" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div><h2 style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Package size={18} style={{ color: '#b4811d' }} /> Products &amp; Menu Catalog</h2><span style={{ fontSize: 11, color: '#78716c' }}>{products.length} products</span></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}><Search size={14} style={{ position: 'absolute', left: 8, color: '#988e7d' }} /><input placeholder="Search products..." value={query} onChange={e => setQuery(e.target.value)} style={{ paddingLeft: 28, height: 32, borderRadius: 8, border: '1px solid #e2d8c8', fontSize: 11 }} /></div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ height: 32, padding: '0 8px', borderRadius: 8, border: '1px solid #e2d8c8', fontSize: 11, background: '#fffdf9', fontWeight: 700 }}><option value="ALL">All Categories</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
          <button className="admin-action-btn" type="button" onClick={openCreate}><Plus size={14} /> Add Product</button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}><table>
        <thead><tr><th style={{ width: 64 }}>Image</th><th>Product</th><th>Category</th><th>Price</th><th>Batches</th><th>Details</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{filtered.map(product => {
          const displayImage = product.adminImage || product.image
          return <tr key={product.id}>
            <td><div style={{ width: 46, height: 46, borderRadius: 10, overflow: 'hidden', background: '#f7f2e9', display: 'grid', placeItems: 'center' }}>{displayImage ? <img src={displayImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={18} color="#9a8c72" />}</div></td>
            <td><strong>{product.name}</strong></td>
            <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 999, background: '#fff8e7', color: '#8a6312', fontSize: 10, fontWeight: 800 }}><Tag size={11} />{categories.find(category => category.id === product.category)?.name || 'Uncategorized'}</span></td>
            <td><strong>₹{product.price}</strong></td><td>{renderBatches(product)}</td>
            <td>{product.portion || '-'} {product.calories ? `• ${product.calories} kcal` : ''}</td>
            <td><button type="button" onClick={() => toggleProductAvailability(product.id)} style={{ border: 0, background: 'transparent', display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: product.available ? '#15803d' : '#b91c1c', fontSize: 11, fontWeight: 800 }}>{product.available ? '● Active' : '○ Hidden'}</button></td>
            <td><button type="button" className="secondary-btn" onClick={() => openEdit(product)}>Edit</button></td>
          </tr>
        })}</tbody>
      </table></div>
      {!filtered.length && <div style={{ padding: 30, textAlign: 'center', color: '#78716c', fontSize: 12 }}>No products found.</div>}

      {showForm && <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
        <form className="admin-modal-card" onSubmit={save} onClick={event => event.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}><div><h2 style={{ margin: 0, fontSize: 18 }}>{editingId ? 'Edit Product' : 'Add Product'}</h2><p style={{ margin: '4px 0 0', fontSize: 12, color: '#78716c' }}>Add product details, dietary batches and an admin-only image.</p></div><button type="button" onClick={() => setShowForm(false)} style={{ border: 0, background: 'transparent', cursor: 'pointer' }}><X /></button></div>
          <div className="admin-product-modal-grid">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label className="admin-form-field"><span>Product name</span><input required value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label>
              <label className="admin-form-field"><span>Category</span><select required value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })}>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}><label className="admin-form-field"><span>Price (₹)</span><input required type="number" min="0" value={draft.price} onChange={e => setDraft({ ...draft, price: e.target.value })} /></label><label className="admin-form-field"><span>Calories</span><input type="number" min="0" value={draft.calories} onChange={e => setDraft({ ...draft, calories: e.target.value })} /></label></div>
              <label className="admin-form-field"><span>Portion</span><input value={draft.portion} onChange={e => setDraft({ ...draft, portion: e.target.value })} placeholder="450g" /></label>
              <label className="admin-form-field"><span>Description</span><textarea rows="3" value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} /></label>
              <div><span style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 8, color: '#44403c' }}>Product batches / dietary labels</span><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{BATCHES.map(batch => <label key={batch.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderRadius: 10, border: `1px solid ${draft[batch.key] ? '#b4811d' : '#e2d8c8'}`, background: draft[batch.key] ? '#fff7df' : '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}><input type="checkbox" checked={draft[batch.key]} onChange={e => setDraft({ ...draft, [batch.key]: e.target.checked })} />{batch.icon} {batch.label}</label>)}</div></div>
            </div>
            <div><span style={{ fontSize: 11, fontWeight: 800, color: '#44403c' }}>Product image</span><div style={{ marginTop: 8, border: '1px dashed #d9cdb9', borderRadius: 14, overflow: 'hidden', background: '#f7f2e9' }}>{draft.image ? <img src={draft.image} alt="Product preview" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} /> : <div style={{ aspectRatio: '1', display: 'grid', placeItems: 'center', color: '#8c806c' }}><div style={{ textAlign: 'center' }}><ImageIcon size={32} /><div style={{ fontSize: 11, marginTop: 6 }}>Choose a product image</div></div></div>}<div style={{ padding: 10 }}><button type="button" onClick={() => fileRef.current?.click()} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '9px 10px', borderRadius: 9, background: '#1c1208', color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 800 }}><Upload size={13} /> Choose Image</button><input ref={fileRef} type="file" accept="image/*" onChange={chooseImage} style={{ display: 'none' }} /></div></div><p style={{ fontSize: 10, color: '#8c806c', lineHeight: 1.4, marginTop: 8 }}>The uploaded image is stored as <strong>adminImage</strong> and stays admin-only.</p></div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}><input type="checkbox" checked={draft.available} onChange={e => setDraft({ ...draft, available: e.target.checked })} /> Product available for ordering</label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}><button type="button" className="secondary-btn" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="admin-action-btn" style={{ padding: '8px 16px', background: '#b4811d', color: '#fff', border: 0 }}>{editingId ? 'Save Changes' : 'Create Product'}</button></div>
        </form>
      </div>}

    </section>
  )
}

export default ProductsPage
