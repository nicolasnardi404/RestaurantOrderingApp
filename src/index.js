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
import MyApp from "./_app";
import GestioneUtente from "./pages/GestioneUtente";
import GestioneMenu from "./pages/GestioneMenu";
import PrenotaPasto from "./pages/PrenotaPasto";
import AggiungiMenuPerGiorno from "./pages/AggiungiMenuPerGiorno";
import ControlloConsegna from "./pages/ControlloConsegna";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./components/NotFound";
import OrdiniAperti from "./pages/OrdiniAperti";
import Profilo from "./pages/Profilo";
import Storico from "./pages/Storico";
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
              <Route path="/prenota-pasto" element={<PrenotaPasto />} />
              <Route path="/ordini-aperti" element={<OrdiniAperti />} />
              <Route
                path="/controllo-consegna"
                element={<ControlloConsegna />}
              />
              <Route path="/storico" element={<Storico />} />
              <Route path="/profilo" element={<Profilo />} />
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
              <Route path="/gestione-utente" element={<GestioneUtente />} />
              <Route path="/gestione-menu" element={<GestioneMenu />} />
              <Route
                path="/aggiungi-menu-per-giorno"
                element={<AggiungiMenuPerGiorno />}
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
