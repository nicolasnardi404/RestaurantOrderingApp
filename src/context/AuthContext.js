import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkTokenValidity = (token) => {
    if (!token) {
      return false;
    }

    try {
      const decodedToken = jwtDecode(token);
      const isExpired = decodedToken.exp * 1000 < Date.now();
      return !isExpired;
    } catch (error) {
      console.error("Failed to decode token", error);
      return false;
    }
  };

  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (checkTokenValidity(token)) {
      const decodedToken = jwtDecode(token);
      setUser({
        userId: decodedToken.data.userId,
        nome: decodedToken.data.nome,
        ruolo: decodedToken.data.ruolo,
      });
    } else {
      console.error("Token expired");
      logout();
    }
    setLoading(false);
  }, []);

  const login = (token, rememberMe) => {
    if (checkTokenValidity(token)) {
      const decodedToken = jwtDecode(token);
      setUser({
        userId: decodedToken.data.userId,
        nome: decodedToken.data.nome,
        ruolo: decodedToken.data.ruolo,
      });

      if (rememberMe) {
        localStorage.setItem('token', token);
      } else {
        sessionStorage.setItem('token', token);
      }
    } else {
      console.error("Token expired or invalid");
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setUser(null);
  };

  const getToken = () => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    return checkTokenValidity(token) ? token : null;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

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