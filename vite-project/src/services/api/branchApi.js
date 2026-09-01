import { apiClient } from './apiClient';
import { getState, createBranch as storeCreateBranch, duplicateBranch as storeDuplicateBranch } from '../prototypeStore';

export const branchApi = {
  async getBranches() {
    return apiClient('/branches', {
      method: 'GET',
      fallback: () => getState().branches || [],
    });
  },

  async getBranch(id) {
    return apiClient(`/branches/${id}`, {
      method: 'GET',
      fallback: () => {
        const branches = getState().branches || [];
        return branches.find((b) => Number(b.id) === Number(id)) || branches[0] || null;
      },
    });
  },

  async createBranch(branchData) {
    return apiClient('/branches', {
      method: 'POST',
      body: branchData,
      fallback: () => storeCreateBranch(branchData),
    });
  },

  async updateBranch(id, branchData) {
    return apiClient(`/branches/${id}`, {
      method: 'PUT',
      body: branchData,
      fallback: () => ({ id, ...branchData }),
    });
  },

  async deleteBranch(id) {
    return apiClient(`/branches/${id}`, {
      method: 'DELETE',
      fallback: () => ({ success: true, id }),
    });
  },

  async duplicateBranchMenu(sourceId, newBranchData) {
    return apiClient(`/branches/${sourceId}/duplicate`, {
      method: 'POST',
      body: newBranchData,
      fallback: () => storeDuplicateBranch(sourceId, newBranchData),
    });
  },
};
