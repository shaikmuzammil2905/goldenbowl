import { initialOrders, branches, products, categories } from '../data/mockData'
import { apiClient } from './api/apiClient'

const STORAGE_KEY = 'goldbowl-prototype-state'
const makeId = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`)

const defaultState = {
  orders: initialOrders,
  branches,
  products,
  categories,
  notifications: [
    { id: 'n1', role: 'customer', title: '🎉 Welcome to Golden Food Bowl', message: 'Your favourite food bowls are ready for order with 50% OFF promo code GOLDEN50.', createdAt: new Date().toISOString() },
    { id: 'n2', role: 'admin', title: '📈 High Demand Surge Alert', message: 'Koramangala branch volume increased +34% in the last hour.', createdAt: new Date().toISOString() },
    { id: 'n3', role: 'support', title: '🎧 Priority Ticket Logged', message: 'Customer Priya Sharma requested order status update for #BWL10245.', createdAt: new Date().toISOString() },
    { id: 'n4', role: 'delivery', title: '🛵 Instant Payout Available', message: 'Your daily earnings of ₹1,450 are ready for instant UPI transfer.', createdAt: new Date().toISOString() },
    { id: 'n5', role: 'admin', title: '🛵 New Delivery Partner Application', message: 'Suresh Patel applied for EV Scooter delivery onboarding.', createdAt: new Date().toISOString() }
  ],
  issues: [
    { id: 'TKT-901', orderId: 'BWL10245', customer: 'Priya Sharma', subject: 'Delivery status query during rain surge', priority: 'High', status: 'OPEN' },
    { id: 'TKT-902', orderId: 'BWL10244', customer: 'Arjun Rao', subject: 'Packaging seal verification request', priority: 'Normal', status: 'IN_PROGRESS' },
    { id: 'TKT-903', orderId: 'BWL10243', customer: 'Meera Nair', subject: 'Cutlery addition request', priority: 'Low', status: 'RESOLVED' }
  ],
  users: [
    { id: 'u1', name: 'Priya Sharma', mobile: '9876543210', email: 'priya@example.com', provider: 'Mobile OTP', createdAt: '2026-08-20', ordersCount: 12, spent: 3840 },
    { id: 'u2', name: 'Rahul Verma', mobile: '9812345678', email: 'rahul.v@gmail.com', provider: 'Google', createdAt: '2026-08-19', ordersCount: 8, spent: 2450 },
    { id: 'u3', name: 'Ananya Roy', mobile: '9765432109', email: 'ananya@outlook.com', provider: 'Mobile OTP', createdAt: '2026-08-18', ordersCount: 5, spent: 1620 },
    { id: 'u4', name: 'Karan Patel', mobile: '9988776655', email: 'karan.p@yahoo.com', provider: 'Email', createdAt: '2026-08-17', ordersCount: 3, spent: 980 }
  ],
  deliveryPartners: [
    { id: 'dp1', name: 'Rahul Kumar', mobile: '9876543210', vehicle: 'Bike', verificationStatus: 'VERIFIED', documentsVerified: true, fee: 499, feeStatus: 'PAID', trips: 142, rating: 4.9, earnings: 1450 },
    { id: 'dp2', name: 'Vikram Singh', mobile: '9812345678', vehicle: 'Scooter', verificationStatus: 'VERIFIED', documentsVerified: true, fee: 499, feeStatus: 'PAID', trips: 98, rating: 4.8, earnings: 1120 },
    { id: 'dp3', name: 'Suresh Patel', mobile: '9765432109', vehicle: 'Electric Vehicle', verificationStatus: 'PENDING', documentsVerified: false, fee: 499, feeStatus: 'PENDING', trips: 0, rating: 5.0, earnings: 0 }
  ],
  deliverySettings: {
    onboardingFee: 499,
    kitFee: 350,
    verificationFee: 149,
    partnerDeliveryPayout: 45,
    customerDeliveryFee: 0,
    discountPercent: 28,
    promoNotice: 'Special Reduced Onboarding Fee Active (₹499 instead of ₹700)'
  }
}

function clone(value) { return JSON.parse(JSON.stringify(value)) }
function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : {};
    const mergedDeliverySettings = {
      ...defaultState.deliverySettings,
      ...(parsed?.deliverySettings || {})
    };
    // Migration: force customerDeliveryFee to 0 (Free Delivery) if it was the old default of 40
    if (mergedDeliverySettings.customerDeliveryFee === 40) {
      mergedDeliverySettings.customerDeliveryFee = 0;
    }
    return {
      ...clone(defaultState),
      ...parsed,
      deliverySettings: mergedDeliverySettings,
      products: defaultState.products,
      categories: defaultState.categories
    };
  } catch {
    return clone(defaultState);
  }
}
let state = loadState();
const listeners = new Set();

function persist() {
  const { products: _p, categories: _c, ...persistable } = state;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
  } catch {}
  listeners.forEach((listener) => listener(state));
}

// Live API Sync Function (AWS RDS PostgreSQL is Single Source of Truth)
export async function syncWithBackend() {
  try {
    const categoriesRes = await apiClient('/categories', { fallback: null })
    const productsRes = await apiClient('/products', { fallback: null })

    let updated = false

    if (categoriesRes && Array.isArray(categoriesRes.data) && categoriesRes.data.length > 0) {
      state = { ...state, categories: categoriesRes.data }
      updated = true
    }

    if (productsRes && Array.isArray(productsRes.data) && productsRes.data.length > 0) {
      const mappedProducts = productsRes.data.map(p => {
        const img = p.imageUrl || p.image || p.adminImage || 'https://res.cloudinary.com/dwmjz9csc/image/upload/v1787120716/image-removebg-preview_e1wfil.png';
        return {
          id: p.id,
          name: p.name,
          category: p.categoryId || p.category?.id || p.category || '',
          price: Number(p.price),
          calories: p.calories || 0,
          portion: p.portion || '',
          description: p.description || '',
          image: img,
          imageUrl: img,
          adminImage: img,
          available: p.available !== false,
          veg: p.veg !== false
        };
      })
      state = { ...state, products: mappedProducts }
      updated = true
    }

    if (updated) {
      listeners.forEach((listener) => listener(state))
    }
  } catch (err) {
    console.warn('Backend live sync:', err.message)
  }
}

// Automatically sync on load, focus, and every 30 seconds for real-time multi-device sync
// NOTE: 3s polling was exhausting the backend rate limit (300 req/15min). 30s keeps us well under.
syncWithBackend()
if (typeof window !== 'undefined') {
  window.addEventListener('focus', () => syncWithBackend())
  window.addEventListener('online', () => syncWithBackend())
  window.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncWithBackend() })
  setInterval(() => { syncWithBackend() }, 30000)
}

export const orderStatuses = ['CONFIRMED','PREPARING','READY_FOR_PICKUP','ASSIGNED','PICKED_UP','OUT_FOR_DELIVERY','DELIVERED']
export const deliveryStatusFlow = {
  CONFIRMED: 'PREPARING',
  PREPARING: 'READY_FOR_PICKUP',
  READY_FOR_PICKUP: 'ASSIGNED',
  ASSIGNED: 'PICKED_UP',
  PICKED_UP: 'OUT_FOR_DELIVERY',
  OUT_FOR_DELIVERY: 'DELIVERED',
  DELIVERED: null,
}
export function getNextOrderStatus(status) { return deliveryStatusFlow[status] ?? null }
export function getState() { return state }
export function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) }
export function createOrder(order) { const id = `BWL${Math.floor(10000 + Math.random() * 90000)}`; const newOrder = { id, status: 'CONFIRMED', createdAt: new Date().toISOString(), ...order }; state = { ...state, orders: [newOrder, ...state.orders] }; addNotification('admin','New order received',`${id} has been placed.`); addNotification('support','New order to monitor',`${id} needs monitoring.`); persist(); return newOrder }
export function updateOrderStatus(orderId, status) {
  if (!orderId || !orderStatuses.includes(status)) return false
  const order = state.orders.find((item) => item.id === orderId)
  if (!order || order.status === status) return false
  state = { ...state, orders: state.orders.map((item) => item.id === orderId ? { ...item, status } : item) }
  addNotification('customer','Order updated',`${orderId} is now ${status.replaceAll('_',' ').toLowerCase()}.`)
  persist()
  return true
}
export function advanceOrderStatus(orderId) {
  const order = state.orders.find((item) => item.id === orderId)
  if (!order) return null
  const next = getNextOrderStatus(order.status)
  if (!next) return order
  updateOrderStatus(orderId, next)
  return { ...order, status: next }
}
export function assignDelivery(orderId, driver) { state = { ...state, orders: state.orders.map((order) => order.id === orderId ? { ...order, driver, status: 'ASSIGNED' } : order) }; addNotification('delivery','New delivery assigned',`Order ${orderId} is ready for pickup.`); persist() }
export function addNotification(role, title, message) { state = { ...state, notifications: [{ id: makeId(), role, title, message, createdAt: new Date().toISOString() }, ...state.notifications] } }
export function duplicateBranch(sourceId, newBranch) { const source = state.branches.find((branch) => branch.id === Number(sourceId)); const id = Math.max(...state.branches.map((branch) => Number(branch.id)), 0) + 1; const branch = { id, ...newBranch, menuCopiedFrom: source?.name }; state = { ...state, branches: [...state.branches, branch] }; addNotification('admin','Branch duplicated',`${branch.name} copied the menu from ${source?.name ?? 'the selected branch'}.`); persist(); return branch }

export async function addProduct(product) {
  const imgUrl = product.imageUrl || product.image || product.adminImage || 'https://res.cloudinary.com/dwmjz9csc/image/upload/v1787120716/image-removebg-preview_e1wfil.png';
  const apiPayload = {
    categoryId: product.category || product.categoryId || 'signature-bowls',
    name: product.name,
    price: Number(product.price),
    imageUrl: imgUrl,
    description: product.description || '',
    portion: product.portion || '1 portion',
    calories: Number(product.calories || 0),
    available: product.available !== false,
    veg: product.veg !== false,
    vegan: !!product.vegan,
    sugarFree: !!product.sugarFree
  };

  try {
    const res = await apiClient('/products', { method: 'POST', body: apiPayload });
    await syncWithBackend();
    addNotification('support', 'Product added', `${product.name} was added to the database & menu.`);
    return res?.data || res;
  } catch (err) {
    console.error('[Product API Error - addProduct]:', err.message);
    throw err;
  }
}

export async function updateProduct(productId, changes) {
  const imgUrl = changes.imageUrl || changes.image || changes.adminImage;
  const apiPayload = { ...changes };
  if (imgUrl) apiPayload.imageUrl = imgUrl;
  if (changes.category) apiPayload.categoryId = changes.category;
  if (changes.price !== undefined) apiPayload.price = Number(changes.price);

  try {
    const res = await apiClient(`/products/${productId}`, { method: 'PUT', body: apiPayload });
    await syncWithBackend();
    return res?.data || res;
  } catch (err) {
    console.error('[Product API Error - updateProduct]:', err.message);
    throw err;
  }
}

export async function toggleProductAvailability(productId) {
  const item = state.products.find((product) => Number(product.id) === Number(productId));
  if (!item) return;

  try {
    await apiClient(`/products/${productId}/toggle-availability`, { method: 'PATCH' });
    await syncWithBackend();
  } catch (err) {
    console.error('[Product API Error - toggleProductAvailability]:', err.message);
    throw err;
  }
}

export async function deleteProduct(productId) {
  try {
    await apiClient(`/products/${productId}`, { method: 'DELETE' });
    await syncWithBackend();
  } catch (err) {
    console.error('[Product API Error - deleteProduct]:', err.message);
    throw err;
  }
}

export async function addCategory(category) {
  const id = category.id || category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const newCat = { icon: '🍲', ...category, id };

  try {
    const res = await apiClient('/categories', { method: 'POST', body: newCat });
    await syncWithBackend();
    return id;
  } catch (err) {
    console.error('[Category API Error - addCategory]:', err.message);
    throw err;
  }
}

export async function updateCategory(categoryId, changes) {
  try {
    await apiClient(`/categories/${categoryId}`, { method: 'PUT', body: changes, fallback: null });
  } catch (err) {
    console.warn('Category update fallback on backend:', err);
  }
  await syncWithBackend();
}

export async function deleteCategory(categoryId) {
  try {
    await apiClient(`/categories/${categoryId}`, { method: 'DELETE', fallback: null });
  } catch (err) {
    console.warn('Category delete fallback on backend:', err);
  }
  await syncWithBackend();
}

export function addIssue(issue) { state = { ...state, issues: [{ id: makeId(), status: 'OPEN', createdAt: new Date().toISOString(), ...issue }, ...state.issues] }; persist() }
export function updateIssue(issueId, status) { state = { ...state, issues: state.issues.map((issue) => issue.id === issueId ? { ...issue, status } : issue) }; persist() }
export function registerCustomer({ name, mobile, email = '', provider = 'mobile' }) { const user = { id: makeId(), role: 'customer', name, mobile, email, provider, createdAt: new Date().toISOString() }; state = { ...state, users: [user, ...state.users] }; persist(); return user }
export function registerDeliveryPartner(profile) { 
  const partnerFee = state.deliverySettings?.onboardingFee ?? 499;
  const partner = { 
    id: makeId(), 
    role: 'delivery', 
    verificationStatus: 'PENDING', 
    fee: partnerFee, 
    feeStatus: partnerFee === 0 ? 'WAIVED' : 'PENDING', 
    trips: 0,
    rating: 5.0,
    earnings: 0,
    documentsVerified: false,
    createdAt: new Date().toISOString(), 
    ...profile 
  }; 
  state = { ...state, deliveryPartners: [partner, ...state.deliveryPartners] }; 
  addNotification('admin', '🛵 New Delivery Partner Application', `${partner.name} applied for delivery onboarding (Fee: ₹${partnerFee}).`); 
  persist(); 
  return partner;
}

export function updateDeliverySettings(newSettings) {
  state = {
    ...state,
    deliverySettings: {
      ...state.deliverySettings,
      ...newSettings
    }
  };
  addNotification('admin', '⚙️ Delivery Charges Updated', `Onboarding fee set to ₹${state.deliverySettings.onboardingFee}. Partner payout rate: ₹${state.deliverySettings.partnerDeliveryPayout || 45}/trip.`);
  persist();
  return state.deliverySettings;
}

export function updateDeliveryPartnerFee(id, newFee, feeStatus = 'PAID') {
  state = {
    ...state,
    deliveryPartners: state.deliveryPartners.map((p) =>
      p.id === id ? { ...p, fee: Number(newFee), feeStatus } : p
    )
  };
  addNotification('admin', '💰 Partner Fee Adjusted', `Delivery partner fee updated to ₹${newFee} (${feeStatus}).`);
  persist();
}

export function waiveDeliveryPartnerFee(id) {
  state = {
    ...state,
    deliveryPartners: state.deliveryPartners.map((p) =>
      p.id === id ? { ...p, fee: 0, feeStatus: 'WAIVED' } : p
    )
  };
  addNotification('admin', '🎁 Partner Fee Waived', `Delivery onboarding fee waived 100% for partner ID ${id}.`);
  persist();
}

export function deleteDeliveryPartner(id) {
  state = {
    ...state,
    deliveryPartners: state.deliveryPartners.filter((p) => p.id !== id)
  };
  persist();
}

export function updateDeliveryVerification(id, verificationStatus, feeStatus = 'PAID') { 
  state = { 
    ...state, 
    deliveryPartners: state.deliveryPartners.map((p) => 
      p.id === id ? { ...p, verificationStatus, feeStatus, documentsVerified: verificationStatus === 'VERIFIED' } : p
    ) 
  }; 
  persist(); 
}

export function createBranch(newBranch) { const id = Math.max(...state.branches.map((branch) => Number(branch.id)), 0) + 1; const branch = { id, ...newBranch }; state = { ...state, branches: [...state.branches, branch] }; addNotification('admin','Branch created',`${branch.name} was added.`); persist(); return branch }
export function resetPrototypeState() { state = clone(defaultState); persist() }

