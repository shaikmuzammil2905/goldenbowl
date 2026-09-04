import { apiClient } from './apiClient';
import { getState, createBranch as storeCreateBranch, duplicateBranch as storeDuplicateBranch } from '../prototypeStore';

export const branchApi = {
  async getBranches() {
    return apiClient('/admin/branches', {
      method: 'GET',
      fallback: () => ({ data: getState().branches || [] })
    });
  },

  async getBranch(id) {
    return apiClient(`/admin/branches/${id}`, {
      method: 'GET',
    });
  },

  async createBranch(branchData) {
    return apiClient('/admin/branches', {
      method: 'POST',
      body: branchData,
    });
  },

  async updateBranch(id, branchData) {
    return apiClient(`/admin/branches/${id}`, {
      method: 'PUT',
      body: branchData,
    });
  },

  async deleteBranch(id) {
    return apiClient(`/admin/branches/${id}`, {
      method: 'DELETE',
    });
  },

  async duplicateBranchMenu(sourceId, newBranchData) {
    return apiClient(`/admin/branches/${sourceId}/duplicate`, {
      method: 'POST',
      body: newBranchData,
    });
  },
};
