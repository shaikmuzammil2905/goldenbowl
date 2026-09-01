import { useState, useEffect } from 'react';
import { orderApi } from '../services/api/orderApi';

export function useOrders(params = {}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const status = params.status;
  const customer = params.customer;

  useEffect(() => {
    let active = true;
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await orderApi.getOrders({ status, customer });
        if (active) setOrders(data);
      } catch (err) {
        if (active) setError(err.message || 'Failed to load orders');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchOrders();
    return () => {
      active = false;
    };
  }, [status, customer]);

  const updateStatus = async (id, newStatus) => {
    try {
      const updated = await orderApi.updateOrderStatus(id, newStatus);
      setOrders((prev) => prev.map((o) => (String(o.id) === String(id) ? updated : o)));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const createNewOrder = async (orderPayload) => {
    try {
      const created = await orderApi.createOrder(orderPayload);
      setOrders((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return { orders, loading, error, updateStatus, createNewOrder };
}
