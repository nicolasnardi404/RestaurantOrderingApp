import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = jwtDecode(token);
      setUser({
        userId: decodedToken.data.userId,
        nome: decodedToken.data.nome,
        ruolo: decodedToken.data.ruolo
      });
    }
  }, []);

  const login = (token) => {
    localStorage.setItem('token', token);
    const decodedToken = jwtDecode(token);
    setUser({
      userId: decodedToken.data.userId,
      nome: decodedToken.data.nome,
      ruolo: decodedToken.data.ruolo
    });
    localStorage.setItem('userId', decodedToken.data.userId);
    localStorage.setItem('nome', decodedToken.data.nome);
    localStorage.setItem('ruolo', decodedToken.data.ruolo);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('nome');
    localStorage.removeItem('ruolo');
    setUser(null);
  };

  const getToken = () => localStorage.getItem('token');

  return (
    <AuthContext.Provider value={{ user, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
