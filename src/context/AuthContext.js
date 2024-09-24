import React, { createContext, useState, useContext, useEffect } from 'react';
import Cookies from 'js-cookie';
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const isExpired = decodedToken.exp * 1000 < Date.now();
        if (!isExpired) {
          setUser({
            userId: decodedToken.data.userId,
            nome: decodedToken.data.nome,
            ruolo: decodedToken.data.ruolo
          });
        } else {
          console.error("Token expired");
          setUser(null);
        }
      } catch (error) {
        console.error("Invalid token", error);
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = (token) => {
    try {
      const decodedToken = jwtDecode(token);
      const isExpired = decodedToken.exp * 1000 < Date.now();
      if (!isExpired) {
        setUser({
          userId: decodedToken.data.userId,
          nome: decodedToken.data.nome,
          ruolo: decodedToken.data.ruolo
        });
        Cookies.set('token', token, { expires: 7 });
      } else {
        console.error("Token expired");
      }
    } catch (error) {
      console.error("Failed to decode token", error);
    }
  };

  const logout = () => {
    Cookies.remove('token');
    setUser(null);
  };

  const getToken = () => Cookies.get('token');

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
