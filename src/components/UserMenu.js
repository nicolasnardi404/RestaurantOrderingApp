import React, { useState, useRef, useEffect } from 'react';
import { Menu } from 'primereact/menu';
import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';
import '../styles/UserMenu.css';

export default function UserMenu() {
  const [visibleLeft, setVisibleLeft] = useState(false);
  const navigate = useNavigate();
  const menu = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const items = [
    {
      label: 'Historic',
      icon: 'pi pi-calendar',
      command: () => navigate('/historic')
    },
    {
      label: 'Make an Order',
      icon: 'pi pi-shopping-cart',
      command: () => navigate('/menu')
    },
    {
      label: 'View Open Orders',
      icon: 'pi pi-list',
      command: () => navigate('/open-orders')
    },
    {
      label: 'Edit Piatti',
      icon: 'pi pi-pencil',
      command: () => navigate('/managepiatti')
    },
    {
      label: 'All Orders of the Day',
      icon: 'pi pi-book',
      command: () => navigate('/day-order')
    },
    {
      label: 'Logout',
      icon: 'pi pi-power-off',
      command: () => {
        // Add logout logic here
        navigate('/login');
      }
    }
  ];

  const toggleMenuLeft = (event) => {
    menu.current.toggle(event);
  };

  const renderMobileMenu = () => (
    <div className="user-menu-wrapper">
      <Button 
        label="Menu" 
        icon="pi pi-bars" 
        onClick={toggleMenuLeft} 
        aria-controls="popup_menu_left" 
        aria-haspopup 
      />
      <Menu 
        model={items} 
        popup 
        ref={menu}
        id="popup_menu_left" 
        popupAlignment="left"
      />
    </div>
  );

  const renderDesktopMenu = () => (
    <div className="user-menu-desktop">
      {items.map((item, index) => (
        <Button
          key={index}
          label={item.label}
          icon={item.icon}
          onClick={item.command}
          className="p-button-text"
        />
      ))}
    </div>
  );

  return (
    <div className="user-menu-container">
      {isMobile ? renderMobileMenu() : renderDesktopMenu()}
    </div>
  );
}