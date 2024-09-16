import React, { useState, useRef } from 'react';
import { Menu } from 'primereact/menu';
import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';
import '../UserMenu.css';

export default function UserMenu() {
  const [visibleLeft, setVisibleLeft] = useState(false);
  const navigate = useNavigate();
  const menu = useRef(null);

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
      icon: 'pi pi-list',
      command: () => navigate('/managepiatti')
    },
    {
      separator: true
    },
    {
      label: 'All Orders of the Day',
      icon: 'pi pi-power-off',
      command: () => {
        // Add logout logic here
        navigate('/day-order');
      }
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

  return (
    <div className="user-menu-wrapper">
      <Button 
        label="Menu" 
        icon="pi pi-bars" 
        className="p-button-text" 
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
}