import React, { useRef, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import "../styles/GestioneEmail.css";
import { Toast } from "primereact/toast";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function GestioneEmail() {
  const toast = useRef(null);
  const [showDialog, setShowDialog] = useState(false);
  const [emailType, setEmailType] = useState(null);
  const [loading, setLoading] = useState(false);
  const apiUrl = process.env.REACT_APP_API_URL;
  const { getToken } = useAuth();

  const openDialog = (type) => {
    setEmailType(type);
    setShowDialog(true);
  };

  const handleSendEmail = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const endpoint =
        emailType === "restaurant"
          ? "/email/pasti"
          : "/email/prenotazioneMancante";

      const response = await axios.post(
        `${apiUrl}${endpoint}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        toast.current.show({
          severity: "success",
          summary: "Success",
          detail:
            emailType === "restaurant"
              ? "Email inviata al ristorante con successo"
              : "Promemoria inviato ai lavoratori con successo",
          life: 3000,
        });
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast.current.show({
        severity: "error",
        summary: "Errore",
        detail: "Errore durante l'invio dell'email. Riprova più tardi.",
        life: 3000,
      });
    } finally {
      setLoading(false);
      setShowDialog(false);
    }
  };

  const dialogFooter = (
    <div className="dialog-footer">
      <Button
        label="No"
        onClick={() => setShowDialog(false)}
        className="p-button-text"
        disabled={loading}
      />
      <Button
        label="Sì"
        onClick={handleSendEmail}
        className="p-button-text"
        loading={loading}
      />
    </div>
  );

  return (
    <div className="email-container">
      <Toast ref={toast} />
      <h2>Gestione Email</h2>
      <div className="button-container">
        <Button
          label="Invia Email al Ristorante"
          onClick={() => openDialog("restaurant")}
          disabled={loading}
        />
        <Button
          label="Ricorda ai lavoratori di ordinare"
          onClick={() => openDialog("workers")}
          disabled={loading}
        />
      </div>

      <Dialog
        visible={showDialog}
        style={{ width: "450px" }}
        header="Conferma invio email"
        modal
        footer={dialogFooter}
        onHide={() => !loading && setShowDialog(false)}
        closable={!loading}
      >
        <div className="confirmation-content">
          <p className="text-center">
            {emailType === "restaurant"
              ? "Sei sicuro di voler inviare l'email al ristorante?"
              : "Sei sicuro di voler inviare il promemoria ai lavoratori?"}
          </p>
        </div>
      </Dialog>
    </div>
  );
}
