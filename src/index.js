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
import Login from "./pages/Login";
import Register from "./components/Register";
import MyApp from "./_app";
import UserManagement from "./pages/UserManagement";
import ManagePiatti from "./pages/ManagePiatti";
import DisplayMenu from "./pages/DisplayMenu";
import AddMultiplePiatti from "./pages/AddMultiplePiatti";
import AllOrdersOfDayComponent from "./pages/AllOrdersOfDayComponent";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./components/NotFound";
import ViewOpenOrders from "./pages/ViewOpenOrders";
import ProfileComponent from "./pages/ProfileComponent";
import HistoricComponent from "./pages/HistoricComponent";
import DragAndDrop from "./pages/DragAndDrop";

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
              {/* <Route path="/register" element={<Register />} /> */}
              <Route path="/managepiatti" element={<ManagePiatti />} />
              <Route
                path="/add-multiple-piatti"
                element={<AddMultiplePiatti />}
              />

              <Route path="/drag-and-drop" element={<DragAndDrop />} />
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
