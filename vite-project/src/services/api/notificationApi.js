import { apiClient } from './apiClient';
import { getState } from '../prototypeStore';

export const notificationApi = {
  async getNotifications(role = null) {
    return apiClient('/notifications', {
      method: 'GET',
      fallback: () => {
        const notifications = getState().notifications || [];
        if (role) {
          return notifications.filter((n) => n.role === role || n.role === 'all');
        }
        return notifications;
      },
    });
  },

  async markNotificationRead(id) {
    return apiClient(`/notifications/${id}/read`, {
      method: 'PATCH',
      fallback: () => ({ success: true, id }),
    });
  },

  async markAllNotificationsRead(role = null) {
    return apiClient('/notifications/read-all', {
      method: 'PATCH',
      body: { role },
      fallback: () => ({ success: true, role }),
    });
  },
};
