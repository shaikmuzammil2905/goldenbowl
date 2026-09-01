import { apiClient } from './apiClient';
import { getState, addCategory as storeAddCategory } from '../prototypeStore';

export const categoryApi = {
  async getCategories() {
    return apiClient('/categories', {
      method: 'GET',
      fallback: () => getState().categories || [],
    });
  },

  async createCategory(categoryData) {
    return apiClient('/categories', {
      method: 'POST',
      body: categoryData,
      fallback: () => {
        const id = storeAddCategory(categoryData);
        return { id, ...categoryData };
      },
    });
  },

  async updateCategory(id, categoryData) {
    return apiClient(`/categories/${id}`, {
      method: 'PUT',
      body: categoryData,
      fallback: () => ({ id, ...categoryData }),
    });
  },

  async deleteCategory(id) {
    return apiClient(`/categories/${id}`, {
      method: 'DELETE',
      fallback: () => ({ success: true, id }),
    });
  },
};
