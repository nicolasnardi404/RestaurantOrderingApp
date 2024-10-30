import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Import useAuth
import Logo from "../assets/logoNetSurf.png";
import "../styles/UserMenu.css";

export default function UserMenu() {
  const [visibleLeft, setVisibleLeft] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false); // Novo state para controlar a visibilidade do dropdown
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getMenuItems = () => {
    const commonItems = [
      { label: "Ordini Aperti", icon: "list", path: "/ordini-aperti" },
      { label: "Prenota Pasto", icon: "shopping-cart", path: "/prenota-pasto" },
      {
        label: "Controllo Consegna",
        icon: "book",
        path: "/controllo-consegna",
      },
      { label: "Storico", icon: "calendar", path: "/storico" },
    ];

    const amministratoreItems = [];

    return user && user.ruolo === "Amministratore"
      ? [...commonItems, ...amministratoreItems]
      : commonItems;
  };

  const items = getMenuItems();

  // Novo render para o dropdown de perfil e logout
  const renderProfileDropdown = () => (
    <div className="profile-dropdown">
      <button
        className="profile-button"
        onClick={() => setDropdownVisible(!dropdownVisible)}
      >
        <i className="pi pi-user"></i> {user.nome}
      </button>
      {dropdownVisible && (
        <div className="dropdown-menu">
          <button
            className="dropdown-item"
            onClick={() => navigate("/profilo")}
          >
            <i className="pi pi-user"></i> Profilo
          </button>
          {user.ruolo === "Amministratore" && (
            <>
              <hr></hr>
              <button
                className="dropdown-item"
                onClick={() => navigate("/gestione-menu")}
              >
                <i className="pi pi-bars"></i> Gestione Menu
              </button>
              <button
                className="dropdown-item"
                onClick={() => navigate("/gestione-utente")}
              >
                <i className="pi pi-user-edit"></i> Gestione Utente
              </button>
              <hr></hr>
            </>
          )}
          <button className="dropdown-item" onClick={handleLogout}>
            <i className="pi pi-power-off"></i> Logout
          </button>
        </div>
      )}
    </div>
  );

  const renderMobileMenu = () => (
    <div className="user-menu-wrapper">
      <button
        className="menu-toggle"
        onClick={() => setVisibleLeft(!visibleLeft)}
      >
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
          {renderProfileDropdown()}
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
      {renderProfileDropdown()}
    </div>
  );

  if (!user) return null;

  return (
    <header className="user-menu-header">
      <div className="logo-container">
        <a href="/ordini-aperti">
          <img src={Logo} alt="Logo" className="logo" />
        </a>
      </div>
      <div className="menu-container">
        {isMobile ? renderMobileMenu() : renderDesktopMenu()}
      </div>
    </header>
  );
}
