import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setOnUnauthorized } from '../services/api';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  const handleUnauthorized = useCallback(() => {
    setUser(null);
    setDashboardData(null);
  }, []);

  useEffect(() => {
    setOnUnauthorized(handleUnauthorized);
  }, [handleUnauthorized]);

  useEffect(() => {
    let isCancelled = false;

    const bootstrapSession = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token && !isTokenExpired(token)) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (!isCancelled) {
              setUser({
                token,
                retailerId: payload.retailerId || payload.sub,
                email: payload.email || payload.sub,
              });
              await loadDashboard();
            }
            return;
          } catch {
            localStorage.removeItem('authToken');
          }
        } else if (token) {
          localStorage.removeItem('authToken');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    bootstrapSession();

    return () => {
      isCancelled = true;
    };
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await api.getDashboard();
      setDashboardData(data.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
  };

  const login = async ({ email, password }) => {
    const data = await api.login({ email, password });
    if (!data.success) {
      throw new Error(data.error?.message || data.message || 'Invalid credentials');
    }
    const d = data.data;
    localStorage.setItem('authToken', d.token);
    setUser({
      token: d.token,
      retailerId: d.retailer_id,
      businessName: d.business_name,
      ownerName: d.owner_name,
      email: d.email,
    });
    loadDashboard();
  };

  const register = async (formData) => {
    const payload = {
      email: formData.email,
      password: formData.password,
      owner_name: formData.ownerName,
      business_name: formData.businessName,
      phone_number: formData.phoneNumber,
      address: formData.address,
      gst_number: formData.gstNumber,
      business_type: formData.businessType,
    };
    const data = await api.register(payload);
    if (!data.success) {
      throw new Error(data.error?.message || data.message || 'Registration failed');
    }
    const d = data.data;
    localStorage.setItem('authToken', d.token);
    setUser({
      token: d.token,
      retailerId: d.retailer_id,
      businessName: d.business_name,
      ownerName: d.owner_name,
      email: d.email,
    });
    loadDashboard();
  };

  const googleLogin = async (idToken) => {
    const data = await api.googleAuth(idToken);
    if (!data.success) {
      throw new Error(data.error?.message || data.message || 'Google login failed');
    }
    const d = data.data;
    localStorage.setItem('authToken', d.token);
    setUser({
      token: d.token,
      retailerId: d.retailer_id,
      businessName: d.business_name,
      ownerName: d.owner_name,
      email: d.email,
    });
    loadDashboard();
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setDashboardData(null);
  };

  const value = {
    user,
    loading,
    dashboardData,
    login,
    register,
    googleLogin,
    logout,
    refreshDashboard: loadDashboard,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
