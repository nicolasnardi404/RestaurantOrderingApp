import React, { useState } from 'react';
import { Menu } from 'primereact/menu';
import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';

export default function UserMenu() {
  const [visibleLeft, setVisibleLeft] = useState(false);
  const navigate = useNavigate();

  const items = [
    {
      label: 'Historic',
      command: () => navigate('/historic')
    },
    {
      label: 'Make an Order',
      command: () => navigate('/menu')
    },
    {
      label: 'View Open Orders',
      command: () => navigate('/open-orders')
    },
  ];



  const toggleMenuLeft = (event) => {
    setVisibleLeft(!visibleLeft);
  };


  return (
    <div className="menu-wrapper">
      <Button label="Menu" icon="pi pi-align-justify" className="mr-2" onClick={toggleMenuLeft} aria-controls="popup_menu_left" aria-haspopup />
      {visibleLeft && (
        <Menu model={items} id="popup_menu_left"  style={{ zIndex: 1 }}/>
      )}
    </div>
  );
}
