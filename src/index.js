import React from "react";
import { AuthProvider } from "./context/AuthContext";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Outlet,
} from "react-router-dom";
import { createRoot } from "react-dom/client";
import UserMenu from "./components/UserMenu";

// Import pages
import Login from "./components/Login";

import Register from "./components/Register";
import OpenOrders from "./pages/OpenOrders";
import MyApp from "./_app";
import UserManagement from "./components/UserManagement";
import ManagePiatti from "./components/ManagePiatti";
import DisplayMenu from "./components/DisplayMenu";
import AddMultiplePiatti from "./components/AddMultiplePiatti";
import AllOrdersOfDayComponent from "./components/AllOrdersOfDayComponent";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./components/NotFound";
import MultiplePiatti from "./pages/MultiplePiatti";
import ViewOpenOrders from "./components/ViewOpenOrders";
import ProfileComponent from "./components/ProfileComponent";
import HistoricComponent from "./components/HistoricComponent";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute allowedRoles={["Amministratore", "Dipendente"]} />
            }
          >
            <Route
              element={
                <>
                  <UserMenu />
                  <Outlet />
                </>
              }
            >
              <Route path="/menu" element={<DisplayMenu />} />
              <Route path="/open-orders" element={<ViewOpenOrders />} />
              <Route path="/day-order" element={<AllOrdersOfDayComponent />} />
              <Route path="/historic" element={<HistoricComponent />} />
              <Route path="/profile" element={<ProfileComponent />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["Amministratore"]} />}>
            <Route
              element={
                <>
                  <UserMenu />
                  <Outlet />
                </>
              }
            >
              <Route path="/users" element={<UserManagement />} />
              <Route path="/register" element={<Register />} />
              <Route path="/managepiatti" element={<ManagePiatti />} />
              <Route
                path="/add-multiple-piatti"
                element={<AddMultiplePiatti />}
              />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

// Create root
const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

export default App;
