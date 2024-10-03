import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ReactDOM from 'react-dom/client'; // Import atualizado

// Importação das páginas
import LogIn from "./pages/LogIn";
import Menu from "./pages/Menu";
import Historic from "./pages/Historic";
import RegisterPage from './pages/Register';
import OpenOrders from "./pages/OpenOrders";
import MyApp from "./_app";
import CRUDPiatti from "./pages/CRUDPiatti";
import AllOrderOfDay from "./pages/AllOrderOfDay";
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from "./components/NotFound";
import MultiplePiatti from './pages/MultiplePiatti';
import ProfilePage from './pages/ProfilePage';

// Componente principal App
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LogIn />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute allowedRoles={['Amministratore', 'Dipendente']} />}>
            <Route path="/menu" element={<Menu />} />
            <Route path="/open-orders" element={<OpenOrders />} />
            <Route path="/day-order" element={<AllOrderOfDay />} />
            <Route path="/historic" element={<Historic />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['Amministratore']} />}>
            <Route path="/managepiatti" element={<CRUDPiatti />} />
            <Route path="/add-multiple-piatti" element={<MultiplePiatti />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);