import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import Logo from '../assets/logoNetSurf.png';
import '../styles/UserMenu.css';

export default function UserMenu() {
  const [visibleLeft, setVisibleLeft] = useState(false);
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getMenuItems = () => {
    const commonItems = [
      { label: 'Storico', icon: 'calendar', path: '/historic' }, // Changed to Italian
      { label: 'Fai un Ordine', icon: 'shopping-cart', path: '/menu' }, // Changed to Italian
      { label: 'Visualizza Ordini Aperti', icon: 'list', path: '/open-orders' }, // Changed to Italian
      { label: 'Tutti gli Ordini del Giorno', icon: 'book', path: '/day-order' }, // Changed to Italian
      { label: 'Logout', icon: 'power-off', action: handleLogout }, // Unchanged
    ];

    const amministratoreItems = [
      { label: 'Modifica Piatti', icon: 'pencil', path: '/managepiatti' } // Unchanged
    ];

    return user && user.ruolo === 'Amministratore'
      ? [...amministratoreItems, ...commonItems]
      : commonItems;
  };

  const items = getMenuItems();

  const renderMobileMenu = () => (
    <div className="user-menu-wrapper">
      <button className="menu-toggle" onClick={() => setVisibleLeft(!visibleLeft)}>
        <i className="pi pi-bars"></i> Menu
      </button>
      {visibleLeft && (
        <div className="mobile-menu">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={item.action || (() => navigate(item.path))}
              className="menu-item"
            >
              <i className={`pi pi-${item.icon}`}></i> {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderDesktopMenu = () => (
    <div className="user-menu-desktop">
      {items.map((item, index) => (
        <button
          key={index}
          onClick={item.action || (() => navigate(item.path))}
          className="menu-item"
        >
          <i className={`pi pi-${item.icon}`}></i> {item.label}
        </button>
      ))}
    </div>
  );

  if (!user) return null;

  return (
    <header className="user-menu-header">
      <div className="logo-container">
        <a href="/open-orders">
          <img src={Logo} alt="Logo" className="logo" />
        </a>
      </div>
      <div className="menu-container">
        {isMobile ? renderMobileMenu() : renderDesktopMenu()}
      </div>
    </header>
  );
}
