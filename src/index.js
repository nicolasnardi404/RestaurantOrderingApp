import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LogIn from "./pages/LogIn";
import Menu from "./pages/Menu";
import Historic from "./pages/Historic";
import RegisterPage from './pages/Register';
import './App.css';
import OpenOrders from "./pages/OpenOrders";
import MyApp from "./_app";
import CRUDPiatti from "./pages/CRUDPiatti";
import AllOrderOfDay from "./pages/AllOrderOfDay";
import ProtectedRoute from './components/ProtectedRoute';
import ReactDOM from 'react-dom/client'; // Updated import
import MultiplePiatti from './pages/MultiplePiatti';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LogIn />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes for both Amministratore and Dipendente */}
          <Route element={<ProtectedRoute allowedRoles={['Amministratore', 'Dipendente']} />}>
            <Route path="/menu" element={<Menu />} />
            <Route path="/open-orders" element={<OpenOrders />} />
            <Route path="/day-order" element={<AllOrderOfDay />} />
            <Route path="/historic" element={<Historic />} />
            <Route path="/add-multiple-piatti" element={<MultiplePiatti />} />
          </Route>

          {/* Protected routes for Amministratore only */}
          <Route element={<ProtectedRoute allowedRoles={['Amministratore']} />}>
            <Route path="/managepiatti" element={<CRUDPiatti />} />
          </Route>

          {/* Keep this route if you still need it, or remove if not used */}
          <Route path="/test" element={<MyApp />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);