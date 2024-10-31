<div align="center">
  <h1>🍽️ Mensa Management System</h1>
  <p>
    <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react" alt="React">
    <img src="https://img.shields.io/badge/PrimeReact-UI-6366F1?style=for-the-badge&logo=react" alt="PrimeReact">
    <img src="https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens" alt="JWT">
    <img src="https://img.shields.io/badge/Axios-HTTP-5A29E4?style=for-the-badge&logo=axios" alt="Axios">
  </p>
</div>

<div align="center">
  <p>A comprehensive React-based platform for managing cafeteria meals, orders, and user management with role-based access control.</p>
</div>

---

## ✨ Features

<div align="center">
  <table>
    <tr>
      <td align="center">🔐</td>
      <td><strong>Authentication</strong><br/>Secure JWT-based login with remember me functionality</td>
      <td align="center">👥</td>
      <td><strong>User Management</strong><br/>Complete user profile and role management</td>
    </tr>
    <tr>
      <td align="center">🍽️</td>
      <td><strong>Menu Management</strong><br/>Weekly menu planning and special items</td>
      <td align="center">📊</td>
      <td><strong>Order Management</strong><br/>Order tracking and delivery control</td>
    </tr>
    <tr>
      <td align="center">📅</td>
      <td><strong>Scheduling</strong><br/>Advanced calendar integration</td>
      <td align="center">📈</td>
      <td><strong>Reports</strong><br/>Historical data and statistics</td>
    </tr>
  </table>
</div>

---

## 🛠️ Technical Stack

<div align="center">
  <table>
    <tr>
      <td align="center">⚛️</td>
      <td><strong>Frontend</strong><br/>React 18 with Hooks</td>
      <td align="center">🎨</td>
      <td><strong>UI Framework</strong><br/>PrimeReact Components</td>
    </tr>
    <tr>
      <td align="center">🔒</td>
      <td><strong>Authentication</strong><br/>JWT with Context API</td>
      <td align="center">🌐</td>
      <td><strong>HTTP Client</strong><br/>Axios with Interceptors</td>
    </tr>
  </table>
</div>

---

## 💻 Core Components

### 🔑 Authentication System
- Secure JWT-based authentication
- Remember me functionality
- Role-based access control
- Protected routes for different user types

### 👤 User Management
- Profile management with nickname and password updates
- Role-based permissions (Administrator/Employee)
- User registration and management (Admin only)

### 🍽️ Menu Management
- Weekly menu planning
- Special items management
- Drag and drop interface
- Daily menu assignments

### 📊 Order System
- Meal reservation system
- Order tracking
- Delivery confirmation
- Historical order data

---

## 🚀 Routes Structure

### Public Routes
- `/login` - Authentication page
- `/` - Redirects to login

### Protected Routes (Administrator & Employee)
- `/prenota-pasto` - Meal reservation
- `/ordini-aperti` - Open orders
- `/controllo-consegna` - Delivery control
- `/storico` - Order history
- `/profilo` - User profile

### Admin-Only Routes
- `/gestione-utente` - User management
- `/gestione-menu` - Menu management
- `/aggiungi-menu-per-giorno` - Daily menu addition
- `/drag-and-drop` - Menu organization

---
