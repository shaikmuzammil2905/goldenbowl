import { apiClient } from './apiClient';
import { getState, addProduct as storeAddProduct, updateProduct as storeUpdateProduct, toggleProductAvailability as storeToggleProduct } from '../prototypeStore';

export const productApi = {
  async getProducts(params = {}) {
    return apiClient('/products', {
      method: 'GET',
      fallback: () => {
        let list = getState().products || [];
        if (params.category && params.category !== 'all') {
          list = list.filter((p) => p.category === params.category);
        }
        if (params.search) {
          const s = params.search.toLowerCase();
          list = list.filter((p) => p.name.toLowerCase().includes(s) || (p.description && p.description.toLowerCase().includes(s)));
        }
        if (params.vegOnly) {
          list = list.filter((p) => p.veg);
        }
        return list;
      },
    });
  },

  async getProduct(id) {
    return apiClient(`/products/${id}`, {
      method: 'GET',
      fallback: () => {
        const list = getState().products || [];
        return list.find((p) => String(p.id) === String(id)) || null;
      },
    });
  },

  async createProduct(productData) {
    return apiClient('/products', {
      method: 'POST',
      body: productData,
      fallback: () => storeAddProduct(productData),
    });
  },

  async updateProduct(id, productData) {
    return apiClient(`/products/${id}`, {
      method: 'PUT',
      body: productData,
      fallback: () => {
        storeUpdateProduct(id, productData);
        return { success: true, id, ...productData };
      },
    });
  },

  async deleteProduct(id) {
    return apiClient(`/products/${id}`, {
      method: 'DELETE',
      fallback: () => {
        storeUpdateProduct(id, { available: false });
        return { success: true, id };
      },
    });
  },

  async toggleProductAvailability(id) {
    return apiClient(`/products/${id}/toggle-availability`, {
      method: 'PATCH',
      fallback: () => {
        storeToggleProduct(id);
        const list = getState().products || [];
        return list.find((p) => String(p.id) === String(id));
      },
    });
  },
};
