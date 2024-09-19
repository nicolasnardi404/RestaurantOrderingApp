import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setUser({
          userId: decodedToken.data.userId,
          nome: decodedToken.data.nome,
          ruolo: decodedToken.data.ruolo
        });
      } catch (error) {
        console.error("Invalid token", error);
        setUser(null);
      }
    }
    setLoading(false); // Finaliza o estado de carregamento
  }, []);

  const login = (token) => {
    try {
      const decodedToken = jwtDecode(token);
      setUser({
        userId: decodedToken.data.userId,
        nome: decodedToken.data.nome,
        ruolo: decodedToken.data.ruolo
      });
      localStorage.setItem('token', token);
      localStorage.setItem('userId', decodedToken.data.userId);
      localStorage.setItem('nome', decodedToken.data.nome);
      localStorage.setItem('ruolo', decodedToken.data.ruolo);
    } catch (error) {
      console.error("Failed to decode token", error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('nome');
    localStorage.removeItem('ruolo');
    setUser(null);
  };

  // Reintroduzindo o método getToken
  const getToken = () => localStorage.getItem('token');

  if (loading) {
    return <div>Loading...</div>; // Renderiza enquanto o estado está sendo carregado
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
