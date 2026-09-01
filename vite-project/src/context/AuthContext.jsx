import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authStorage } from '../services/storage/authStorage';
import { authApi } from '../services/api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [role, setRoleState] = useState(() => authStorage.getAnyActiveRole() || 'customer');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const activeRole = authStorage.getAnyActiveRole();
      if (activeRole) {
        setRoleState(activeRole);
        const currentUser = await authApi.getCurrentUser(activeRole);
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const initUser = async () => {
      try {
        const activeRole = authStorage.getAnyActiveRole();
        if (activeRole) {
          if (active) setRoleState(activeRole);
          const currentUser = await authApi.getCurrentUser(activeRole);
          if (active) setUser(currentUser);
        } else {
          if (active) setUser(null);
        }
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    initUser();
    return () => {
      active = false;
    };
  }, []);

  const login = async (identifier, password, targetRole = 'customer') => {
    setLoading(true);
    try {
      const response = await authApi.login({ identifier, password, role: targetRole });
      if (response.success) {
        setRoleState(targetRole);
        setUser(response.user);
      }
      return response;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (targetRole = role) => {
    setLoading(true);
    try {
      await authApi.logout(targetRole);
      setUser(null);
      setRoleState('customer');
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = Boolean(
    (role === 'customer' && authStorage.getCustomerAuth()) ||
    (role === 'admin' && authStorage.getAdminAuth()) ||
    (role === 'delivery' && authStorage.getDeliveryAuth()) ||
    (role === 'support' && authStorage.getSupportAuth())
  );

  const value = {
    user,
    role,
    isAuthenticated,
    loading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
