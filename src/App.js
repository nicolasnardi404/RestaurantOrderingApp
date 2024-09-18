import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LogIn from './pages/LogIn';
import UserMenu from './components/UserMenu';
import Historic from './pages/Historic';
import MenuPage from './pages/Menu';
import OpenOrders from './pages/OpenOrders';
import ManagePiatti from './pages/CRUDPiatti';
import DayOrder from './pages/AllOrderOfDay';
import ForbiddenPage from './components/ForbiddenPage';
import "./styles/Global.css"
import "./App.css"

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LogIn />} />
          <Route path="/forbidden" element={<ForbiddenPage />} />
          
          {/* Protected routes for both Amministratore and Dipendente */}
          <Route element={<ProtectedRoute allowedRoles={['Amministratore', 'Dipendente']} />}>
            <Route path="/" element={<MenuPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/open-orders" element={<OpenOrders />} />
            <Route path="/day-order" element={<DayOrder />} />
          </Route>
          
          {/* Protected routes for Amministratore only */}
          <Route element={<ProtectedRoute allowedRoles={['Amministratore']} />}>
            <Route path="/managepiatti" element={<ManagePiatti />} />
            <Route path="/historic" element={<Historic />} />
          </Route>

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;