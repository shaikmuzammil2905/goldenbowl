import { useState, useEffect } from 'react';
import { notificationApi } from '../services/api/notificationApi';

export function useNotifications(role = null) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await notificationApi.getNotifications(role);
        if (active) setNotifications(data);
      } catch (err) {
        if (active) setError(err.message || 'Failed to load notifications');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchNotifications();
    return () => {
      active = false;
    };
  }, [role]);

  const markAsRead = async (id) => {
    try {
      await notificationApi.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      setError(err.message);
    }
  };

  return { notifications, loading, error, markAsRead };
}
