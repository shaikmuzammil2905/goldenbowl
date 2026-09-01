import { apiClient } from './apiClient';
import { dashboardStats, initialOrders } from '../../data/mockData';

export const reportApi = {
  async getDashboardStats() {
    return apiClient('/reports/dashboard', {
      method: 'GET',
      fallback: () => dashboardStats,
    });
  },

  async getSalesReport() {
    return apiClient('/reports/sales', {
      method: 'GET',
      fallback: () => ({
        grossSales: 842500,
        ordersCount: 1842,
        newCustomers: 428,
        weeklyTrend: [44, 68, 52, 78, 62, 91, 74],
      }),
    });
  },

  async getOrderReport() {
    return apiClient('/reports/orders', {
      method: 'GET',
      fallback: () => initialOrders,
    });
  },

  async getCustomerReport() {
    return apiClient('/reports/customers', {
      method: 'GET',
      fallback: () => ({
        totalCustomers: 3840,
        activeThisMonth: 1240,
        repeatRate: '68%',
      }),
    });
  },
};
