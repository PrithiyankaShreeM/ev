import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('wattstop_token') || null);
  const [activeRole, setActiveRole] = useState(() => localStorage.getItem('wattstop_role') || 'driver');
  const [accentTheme, setAccentTheme] = useState(() => localStorage.getItem('wattstop_theme') || 'lime');
  const [loading, setLoading] = useState(true);

  // Sync token to localStorage and load user
  useEffect(() => {
    async function loadUser() {
      if (token) {
        localStorage.setItem('wattstop_token', token);
        try {
          const res = await authApi.getMe();
          setUser(res.user);
          if (res.user.role) {
            setActiveRole(res.user.role);
            localStorage.setItem('wattstop_role', res.user.role);
          }
        } catch (err) {
          console.warn('Failed to load user session, logging out', err);
          logout();
        }
      } else {
        localStorage.removeItem('wattstop_token');
        setUser(null);
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  // Sync theme
  useEffect(() => {
    localStorage.setItem('wattstop_theme', accentTheme);
    document.documentElement.setAttribute('data-accent', accentTheme);
  }, [accentTheme]);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    setToken(res.token);
    setUser(res.user);
    if (res.user.role) {
      setActiveRole(res.user.role);
      localStorage.setItem('wattstop_role', res.user.role);
    }
    return res.user;
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    setToken(res.token);
    setUser(res.user);
    if (res.user.role) {
      setActiveRole(res.user.role);
      localStorage.setItem('wattstop_role', res.user.role);
    }
    return res.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('wattstop_token');
  };

  const switchRole = (role) => {
    setActiveRole(role);
    localStorage.setItem('wattstop_role', role);
  };

  const toggleTheme = () => {
    setAccentTheme((prev) => (prev === 'lime' ? 'orange' : 'lime'));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        activeRole,
        accentTheme,
        loading,
        login,
        register,
        logout,
        switchRole,
        toggleTheme,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
