import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setStats(null);
      setLoading(false);
      return null;
    }
    try {
      const data = await api('/me');
      setUser(data.user);
      setStats(data.stats);
      return data;
    } catch (err) {
      if (err.status === 401) {
        setToken(null);
        setUser(null);
        setStats(null);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (username, password) => {
    const data = await api('/auth/login', { method: 'POST', body: { username, password } });
    setToken(data.token);
    setUser(data.user);
    await refresh();
  };

  const register = async (form) => {
    const data = await api('/auth/register', { method: 'POST', body: form });
    setToken(data.token);
    setUser(data.user);
    await refresh();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setStats(null);
  };

  return (
    <AuthContext.Provider value={{ user, stats, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
