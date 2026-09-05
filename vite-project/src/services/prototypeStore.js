import { initialOrders, branches, products, categories } from '../data/mockData'
import { apiClient } from './api/apiClient'

const STORAGE_KEY = 'goldbowl-prototype-state'
const makeId = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`)

const mockOrderIds = new Set([
  'BWL10245', 'BWL10244', 'BWL10243', 'BWL96462', 'BWL96461',
  'BWL96460', 'BWL96450', 'BWL96449', 'BWL96448'
]);
const mockCustomerNames = new Set([
  'Priya Sharma', 'Arjun Rao', 'Meera Nair', 'Rohan Gupta', 'Siddharth Rao'
]);

const defaultState = {
  orders: [],
  branches,
  products,
  categories,
  notifications: [
    { id: 'n1', role: 'customer', title: '🎉 Welcome to Golden Food Bowl', message: 'Your favourite food bowls are ready for order with 50% OFF promo code GOLDEN50.', createdAt: new Date().toISOString() },
    { id: 'n2', role: 'admin', title: '📈 High Demand Surge Alert', message: 'Live monitoring active across all branches.', createdAt: new Date().toISOString() },
    { id: 'n3', role: 'support', title: '🎧 Support Desk Active', message: '24/7 Customer Care and Order Assistance monitoring live orders.', createdAt: new Date().toISOString() },
    { id: 'n4', role: 'delivery', title: '🛵 Delivery Network Active', message: 'Live delivery partner tracking active.', createdAt: new Date().toISOString() }
  ],
  issues: [],
  users: [],
  deliveryPartners: [],
  supportAgents: [
    {
      id: 'ag-1',
      name: 'Ananya Sharma',
      email: 'ananya.s@goldenbowl.com',
      mobile: '+91 98451 23456',
      role: 'Senior Care Specialist',
      shift: 'Morning (8 AM - 4 PM)',
      status: 'Online',
      cases: 2,
      resolved: 14,
      createdAt: new Date().toISOString()
    },
    {
      id: 'ag-2',
      name: 'Vikram Patel',
      email: 'vikram.p@goldenbowl.com',
      mobile: '+91 97312 34567',
      role: 'Support Executive',
      shift: 'Evening (4 PM - 12 AM)',
      status: 'Online',
      cases: 1,
      resolved: 9,
      createdAt: new Date().toISOString()
    }
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

    // Clean mock orders and deduplicate by id
    const cleanOrders = (Array.isArray(parsed?.orders) ? parsed.orders : [])
      .filter(o => o && !mockOrderIds.has(o.id) && !mockCustomerNames.has(o.customer))
      .filter((o, idx, arr) => arr.findIndex(t => t.id === o.id) === idx);

    const cleanAgents = Array.isArray(parsed?.supportAgents) && parsed.supportAgents.length > 0
      ? parsed.supportAgents
      : defaultState.supportAgents;

    return {
      ...clone(defaultState),
      ...parsed,
      orders: cleanOrders,
      issues: [],
      supportAgents: cleanAgents,
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

    // Live Orders Sync from AWS RDS PostgreSQL Database
    try {
      const ordersRes = await apiClient('/orders', { fallback: null })
      if (ordersRes && Array.isArray(ordersRes.data)) {
        const liveOrders = ordersRes.data
          .filter(o => o && !mockOrderIds.has(o.id) && !mockCustomerNames.has(o.customerName))
          .map(o => ({
            id: o.id,
            items: o.items || [],
            total: Number(o.totalAmount || o.total || 0),
            status: o.status || 'CONFIRMED',
            type: o.orderType || o.type || 'Delivery',
            branch: o.branch?.name || o.branch || 'Bowl Central',
            customer: o.customerName || (o.customerUser ? o.customerUser.name : 'Valued Customer'),
            customerMobile: o.customerUser?.mobile || o.customerMobile || '',
            deliveryAddress: o.deliveryAddress || '',
            driver: o.driver?.name || o.driver || null,
            driverMobile: o.driver?.mobile || o.driverMobile || null,
            eta: o.etaMinutes || o.eta || 25,
            createdAt: o.createdAt || new Date().toISOString()
          }))

        const orderMap = new Map()
        liveOrders.forEach(o => orderMap.set(o.id, o))
        ;(state.orders || []).forEach(o => {
          if (!orderMap.has(o.id) && !mockOrderIds.has(o.id) && !mockCustomerNames.has(o.customer)) {
            orderMap.set(o.id, o)
          }
        })
        state = { ...state, orders: Array.from(orderMap.values()) }
        updated = true
      }
    } catch (orderErr) {
      console.warn('Orders sync error:', orderErr.message)
    }

    if (updated) {
      persist()
      listeners.forEach((listener) => listener(state))
    }
  } catch (err) {
    console.warn('Backend live sync:', err.message)
  }
}

// Automatically sync on load, focus, and every 10 seconds for real-time multi-device sync
syncWithBackend()
if (typeof window !== 'undefined') {
  window.addEventListener('focus', () => syncWithBackend())
  window.addEventListener('online', () => syncWithBackend())
  window.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncWithBackend() })
  setInterval(() => { syncWithBackend() }, 10000)
}

export const orderStatuses = ['CONFIRMED','PREPARING','READY_FOR_PICKUP','ASSIGNED','PICKED_UP','OUT_FOR_DELIVERY','DELIVERED','CANCELLED']
export const deliveryStatusFlow = {
  CONFIRMED: 'PREPARING',
  PREPARING: 'READY_FOR_PICKUP',
  READY_FOR_PICKUP: 'ASSIGNED',
  ASSIGNED: 'PICKED_UP',
  PICKED_UP: 'OUT_FOR_DELIVERY',
  OUT_FOR_DELIVERY: 'DELIVERED',
  DELIVERED: null,
  CANCELLED: null,
}
export function getNextOrderStatus(status) { return deliveryStatusFlow[status] ?? null }
export function getState() { return state }
export function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) }
export function createOrder(order) { const id = `BWL${Math.floor(10000 + Math.random() * 90000)}`; const newOrder = { id, status: 'CONFIRMED', createdAt: new Date().toISOString(), ...order }; state = { ...state, orders: [newOrder, ...state.orders.filter(o => o.id !== id)] }; addNotification('admin','New order received',`${id} has been placed.`); addNotification('support','New order to monitor',`${id} needs monitoring.`); persist(); return newOrder }
export async function updateOrderStatus(orderId, status) {
  if (!orderId || !orderStatuses.includes(status)) return false
  const order = state.orders.find((item) => item.id === orderId)
  if (!order || order.status === status) return false
  state = { ...state, orders: state.orders.map((item) => item.id === orderId ? { ...item, status } : item) }
  addNotification('customer','Order updated',`${orderId} is now ${status.replaceAll('_',' ').toLowerCase()}.`)
  persist()
  try {
    await apiClient(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: { status }
    })
  } catch (err) {
    console.warn('Backend order status update:', err.message)
  }
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

// Support Agent Management Functions
export function addSupportAgent(agentData) {
  const id = `ag-${Math.floor(1000 + Math.random() * 9000)}`;
  const newAgent = {
    id,
    name: agentData.name || 'Support Agent',
    email: agentData.email || '',
    mobile: agentData.mobile || '',
    role: agentData.role || 'Support Specialist',
    shift: agentData.shift || 'General (9 AM - 6 PM)',
    status: agentData.status || 'Online',
    cases: Number(agentData.cases || 0),
    resolved: Number(agentData.resolved || 0),
    createdAt: new Date().toISOString(),
    ...agentData
  };
  state = {
    ...state,
    supportAgents: [newAgent, ...(state.supportAgents || [])]
  };
  addNotification('admin', '🎧 Support Agent Added', `${newAgent.name} (${newAgent.role}) was added to support staff.`);
  addNotification('support', '🎧 New Agent Onboarded', `${newAgent.name} joined the Support Roster.`);
  persist();
  return newAgent;
}

export function updateSupportAgent(id, changes) {
  state = {
    ...state,
    supportAgents: (state.supportAgents || []).map(a => a.id === id ? { ...a, ...changes } : a)
  };
  persist();
}

export function toggleSupportAgentStatus(id) {
  state = {
    ...state,
    supportAgents: (state.supportAgents || []).map(a => {
      if (a.id === id) {
        const next = a.status === 'Online' ? 'Busy' : a.status === 'Busy' ? 'Offline' : 'Online';
        return { ...a, status: next };
      }
      return a;
    })
  };
  persist();
}

export function deleteSupportAgent(id) {
  state = {
    ...state,
    supportAgents: (state.supportAgents || []).filter(a => a.id !== id)
  };
  addNotification('admin', '🗑️ Support Agent Removed', `Support agent ID ${id} was removed.`);
  persist();
}

