import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";
 
const AuthContext = createContext(null);
 
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
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
 
  const login = (token, rememberMe) => {
    try {
      const decodedToken = jwtDecode(token);
      const isExpired = decodedToken.exp * 1000 < Date.now();
      if (!isExpired) {
        setUser({
          userId: decodedToken.data.userId,
          nome: decodedToken.data.nome,
          ruolo: decodedToken.data.ruolo
        });
 
        if (rememberMe) {
          localStorage.setItem('token', token);
        } else {
          sessionStorage.setItem('token', token);
        }
      } else {
        console.error("Token expired");
      }
    } catch (error) {
      console.error("Failed to decode token", error);
    }
  };
 
  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setUser(null);
  };
 
  const getToken = () => sessionStorage.getItem('token') || localStorage.getItem('token');
 
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