import React, { useState, useEffect, useRef, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { ConfirmDialog } from "primereact/confirmdialog";
import { UseDataLocal } from "../util/UseDataLocal";
import { ITALIAN_LOCALE_CONFIG } from "../util/ItalianLocaleConfigData";
import { InputSwitch } from "primereact/inputswitch";
import { Toast } from "primereact/toast"; // Import Toast component
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "../styles/EditPiatto.css";
import "../util/addLocale";
import { useNavigate } from "react-router-dom"; // Import useNavigate from react-router-dom
import { formatCalendarData } from "../util/FormatCalendarData";
import formatDateforServer from "../util/formatDateForServer";
import { Checkbox } from "primereact/checkbox";

UseDataLocal(ITALIAN_LOCALE_CONFIG);

function ManagePiatti() {
  const [weeklyPiatti, setWeeklyPiatti] = useState([]);
  const [editingPiatto, setEditingPiatto] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isNewPiatto, setIsNewPiatto] = useState(false);
  const [globalFilter, setGlobalFilter] = useState(null);
  const [disponibileFilter, setDisponibileFilter] = useState(0); // Start with showing unavailable (0)
  const [selectedDay, setSelectedDay] = useState(null); // State for selected day
  const toast = useRef(null); // Initialize toast reference
  const { getToken } = useAuth();
  const token = getToken();
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate(); // Initialize useNavigate
  const apiUrl = process.env.REACT_APP_API_URL;

  const tipoPiattoOptions = [
    { label: "Primo", value: "Primo" },
    { label: "Secondo", value: "Secondo" },
    { label: "Contorno", value: "Contorno" },
    { label: "Piatto unico", value: "Piatto unico" },
    { label: "Dessert", value: "Dessert" },
    { label: "Pane/Grissini", value: "Pane/Grissini" },
  ];

  const dayOptions = [
    { label: "Lunedì", value: "Lunedì" },
    { label: "Martedì", value: "Martedì" },
    { label: "Mercoledì", value: "Mercoledì" },
    { label: "Giovedì", value: "Giovedì" },
    { label: "Venerdì", value: "Venerdì" },
  ];

  const api = useCallback(
    axios.create({
      baseURL: `${apiUrl}`,
      headers: { Authorization: `Bearer ${token}` },
    }),
    [token]
  );

  useEffect(() => {
    fetchWeeklyPiatti();
  }, [api]);

  const fetchWeeklyPiatti = async () => {
    try {
      const response = await api.get("/piatto/piattoSettimana");
      if (Array.isArray(response.data)) {
        setWeeklyPiatti(response.data);
      } else {
        console.error("API did not return an array:", response.data);
        setWeeklyPiatti([]);
      }
    } catch (error) {
      console.error("Error fetching weekly piatti:", error);
      showToast("error", "Error", "Failed to fetch weekly piatti");
      setWeeklyPiatti([]);
    }
  };

  const filteredPiatti = weeklyPiatti.filter((piatto) => {
    const matchesDay = selectedDay ? piatto.dayOfWeek === selectedDay : true;
    const matchesDisponibile = piatto.sempreDisponibile === disponibileFilter;
    return matchesDay && matchesDisponibile;
  });

  const editPiatto = (piatto) => {
    setEditingPiatto({
      ...piatto,
      sempreDisponibile: piatto.sempreDisponibile === 1,
    });
    setIsNewPiatto(false);
    setShowDialog(true);
  };

  const addNewPiatto = () => {
    setEditingPiatto({
      nome_piatto: "",
      data: formatCalendarData(new Date()),
      idTipoPiatto: 1,
      nome_tipo: "Primo",
      sempreDisponibile: false,
    });
    setIsNewPiatto(true);
    setShowDialog(true);
  };

  const savePiatto = async () => {
    try {
      const piattoToSave = {
        nome: editingPiatto.nome_piatto,
        data: editingPiatto.data,
        idTipoPiatto: editingPiatto.idTipoPiatto,
        disponibile: editingPiatto.sempreDisponibile ? 1 : 0,
      };

      let response;
      if (isNewPiatto) {
        response = await api.post("/piatto/create", piattoToSave);
      } else {
        response = await api.put(
          `/piatto/update/${editingPiatto.id_piatto}`,
          piattoToSave
        );
      }

      setShowDialog(false);
      fetchWeeklyPiatti();
      showToast(
        "success",
        "Success",
        isNewPiatto
          ? "Piatto created successfully"
          : "Piatto updated successfully"
      );
    } catch (error) {
      console.error("Error saving piatto:", error);
      showToast("error", "Error", "Failed to save piatto");
    }
  };

  const deletePiatto = (id) => {
    setDeleteId(id); // Set the ID to delete
    setConfirmDeleteVisible(true); // Show the confirmation dialog
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/piatto/delete/${deleteId}`);
      fetchWeeklyPiatti();
      setWeeklyPiatti((prevPiatti) =>
        prevPiatti.filter((piatto) => piatto.id_piatto !== deleteId)
      );
      showToast("success", "Success", "Piatto deleted successfully");
    } catch (error) {
      console.error("Error deleting piatto:", error);
      showToast("error", "Error", "Failed to delete piatto");
    } finally {
      setConfirmDeleteVisible(false); // Close the dialog
    }
  };

  const rejectDelete = () => {
    setConfirmDeleteVisible(false); // Close the dialog
  };

  const showToast = (severity, summary, detail) => {
    if (toast.current) {
      toast.current.show({ severity, summary, detail });
    } else {
      console.error("Toast component is not initialized.");
    }
  };

  const actionTemplate = (rowData) => {
    return (
      <div className="action-buttons">
        <Button
          className="btn-edit"
          onClick={() => editPiatto(rowData)}
          icon="pi pi-pencil"
          tooltip="Modifica Piattoo"
        />
        <Button
          className="btn-delete"
          onClick={() => deletePiatto(rowData.id_piatto)}
          icon="pi pi-trash"
          tooltip="Annulla Piatto"
        />
      </div>
    );
  };

  const header = (
    <div className="table-header">
      <div className="filter-container">
        <span className="p-input-icon-left">
          <i />
          <InputText
            type="search"
            onInput={(e) => setGlobalFilter(e.target.value)}
            placeholder="Cerca per Nome..."
          />
        </span>
        <div className="disponibile-filter">
          <label htmlFor="disponibileFilter">Sempre Disponibile: </label>
          <InputSwitch
            id="disponibileFilter"
            checked={disponibileFilter === 1}
            onChange={(e) => setDisponibileFilter(e.value ? 1 : 0)}
          />
        </div>
        <div className="day-filter">
          <label htmlFor="dayFilter">Filtrare per Giorno:</label>
          <Dropdown
            id="dayFilter"
            value={selectedDay}
            options={dayOptions}
            onChange={(e) => setSelectedDay(e.value)}
            placeholder="Giorno"
            showClear
          />
        </div>
      </div>
    </div>
  );

  const disponibileBodyTemplate = (rowData) => {
    return <span>{rowData.sempreDisponibile === 1 ? "Yes" : "No"}</span>;
  };

  return (
    <div className="manage-piatti">
      {/* Add the Toast component */}
      <Toast ref={toast} />
      <ConfirmDialog
        visible={confirmDeleteVisible}
        message="Sei sicuro di voler eliminare questo piatto?"
        header="Conferma Eliminazione"
        accept={confirmDelete}
        reject={rejectDelete}
        onHide={() => setConfirmDeleteVisible(false)}
      />

      <h1>Organizzare il Menu della Settimana</h1>
      <Button
        label="Aggiungi Singolo Piatto"
        icon="pi pi-plus"
        onClick={addNewPiatto}
        className="p-button-primary add-piatto-button"
      />
      <Button
        label="Aggiungi il Menu per Giorno"
        icon="pi pi-plus"
        onClick={() => navigate("/add-multiple-piatti")} // Navigate to the new page
        className="p-button-primary add-piatto-button"
      />
      <DataTable
        value={filteredPiatti}
        globalFilter={globalFilter}
        header={header}
      >
        <Column field="id_piatto" header="ID" />
        <Column field="nome_piatto" header="Piatto" />
        <Column field="nome_tipo" header="Tipo Piatto" />
        <Column field="dayOfWeek" header="Giorno Della Settimana" />
        <Column field="data" header="Data" />
        <Column
          field="sempreDisponibile"
          header="Sempre Disponibile"
          body={disponibileBodyTemplate}
        />
        <Column
          body={actionTemplate}
          header="Azioni"
          style={{ width: "150px" }}
        />
      </DataTable>
      <Dialog
        header={isNewPiatto ? "Aggiungi un nuovo piatto" : "Modifica piatto"}
        visible={showDialog}
        style={{ width: "80vw" }}
        modal
        onHide={() => setShowDialog(false)}
      >
        {editingPiatto && (
          <div className="edit-piatto-form">
            <div className="p-grid">
              <div className="p-col">
                <div className="p-field">
                  <label htmlFor="nome_piatto">Nome Piatto</label>
                  <InputText
                    id="nome_piatto"
                    value={editingPiatto.nome_piatto}
                    onChange={(e) =>
                      setEditingPiatto({
                        ...editingPiatto,
                        nome_piatto: e.target.value,
                      })
                    }
                    placeholder="Inserisci il nome del piatto"
                  />
                </div>
              </div>
              <div className="p-col">
                <div className="p-field">
                  <label htmlFor="nome_tipo">Tipo Piatto</label>
                  <Dropdown
                    id="nome_tipo"
                    className="dropdown-tipo-piatto"
                    value={editingPiatto.nome_tipo}
                    options={tipoPiattoOptions}
                    onChange={(e) =>
                      setEditingPiatto({
                        ...editingPiatto,
                        nome_tipo: e.value,
                        idTipoPiatto:
                          tipoPiattoOptions.findIndex(
                            (option) => option.value === e.value
                          ) + 1,
                      })
                    }
                    placeholder="Seleziona un tipo"
                    optionLabel="label"
                  />
                </div>
              </div>
              <div className="p-col">
                <div className="p-field">
                  <label htmlFor="data">Data</label>
                  <Calendar
                    className="calendar-data"
                    id="data"
                    locale="it"
                    value={
                      editingPiatto.data ? new Date(editingPiatto.data) : null
                    }
                    onChange={(e) => {
                      const selectedDate = e.value ?? null;
                      const formatCalendar = DisplayData(selectedDate);

                      setEditingPiatto({
                        ...editingPiatto,
                        data: formatCalendar,
                      });
                    }}
                    dateFormat="D. dd/mm/y"
                    placeholder="Seleziona una data"
                  />
                </div>
              </div>
              <div className="p-col">
                <div className="sempre-disponibile">
                  <label>Sempre Disponibile</label>
                  <div className="p-field-checkbox">
                    <Checkbox
                      inputId="sempreDisponibile"
                      checked={editingPiatto.sempreDisponibile}
                      onChange={(e) =>
                        setEditingPiatto({
                          ...editingPiatto,
                          sempreDisponibile: e.checked,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-dialog-footer">
              <Button label="Salva" icon="pi pi-check" onClick={savePiatto} />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

export default ManagePiatti;
