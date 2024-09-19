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
    navigate('/login');
  };

  const getMenuItems = () => {
    const commonItems = [
      { label: 'Make an Order', icon: 'shopping-cart', path: '/menu' },
      { label: 'View Open Orders', icon: 'list', path: '/open-orders' },
      { label: 'All Orders of the Day', icon: 'book', path: '/day-order' },
      { label: 'Logout', icon: 'power-off', action: handleLogout }
    ];

    const amministratoreItems = [
      { label: 'Historic', icon: 'calendar', path: '/historic' },
      { label: 'Edit Piatti', icon: 'pencil', path: '/managepiatti' }
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
        <a href="/menu">
          <img src={Logo} alt="Logo" className="logo" />
        </a>
      </div>
      <div className="menu-container">
        {isMobile ? renderMobileMenu() : renderDesktopMenu()}
      </div>
    </header>
  );
}
