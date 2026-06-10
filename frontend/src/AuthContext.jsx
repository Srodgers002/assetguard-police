import { createContext, useContext, useState } from 'react';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (username, password) => {
    const form = new FormData();
    form.append('username', username);
    form.append('password', password);
    const res = await api.post('/login', form);
    localStorage.setItem('token', res.data.access_token);
    const signedInUser = { username: res.data.username, role: res.data.role, employee_id: res.data.employee_id };
    localStorage.setItem('user', JSON.stringify(signedInUser));
    setUser(signedInUser);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
