import { apiClient } from './apiClient';
import { getState, addIssue as storeAddIssue, updateIssue as storeUpdateIssue } from '../prototypeStore';

export const supportApi = {
  async getTickets(params = {}) {
    return apiClient('/support/tickets', {
      method: 'GET',
      fallback: () => {
        let issues = getState().issues || [];
        if (params.status) {
          issues = issues.filter((i) => i.status === params.status);
        }
        return issues;
      },
    });
  },

  async getTicket(id) {
    return apiClient(`/support/tickets/${id}`, {
      method: 'GET',
      fallback: () => {
        const issues = getState().issues || [];
        return issues.find((i) => String(i.id) === String(id)) || null;
      },
    });
  },

  async createTicket(ticketData) {
    return apiClient('/support/tickets', {
      method: 'POST',
      body: ticketData,
      fallback: () => storeAddIssue(ticketData),
    });
  },

  async updateTicket(id, status) {
    return apiClient(`/support/tickets/${id}`, {
      method: 'PUT',
      body: { status },
      fallback: () => {
        storeUpdateIssue(id, status);
        const issues = getState().issues || [];
        return issues.find((i) => String(i.id) === String(id));
      },
    });
  },

  async assignTicket(id, agentName) {
    return apiClient(`/support/tickets/${id}/assign`, {
      method: 'POST',
      body: { agentName },
      fallback: () => {
        storeUpdateIssue(id, 'IN_PROGRESS');
        const issues = getState().issues || [];
        return issues.find((i) => String(i.id) === String(id));
      },
    });
  },

  async resolveTicket(id) {
    return apiClient(`/support/tickets/${id}/resolve`, {
      method: 'POST',
      fallback: () => {
        storeUpdateIssue(id, 'RESOLVED');
        const issues = getState().issues || [];
        return issues.find((i) => String(i.id) === String(id));
      },
    });
  },
};
