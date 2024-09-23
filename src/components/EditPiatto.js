import React, { useState, useEffect, useRef, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";
import { InputSwitch } from "primereact/inputswitch";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "../styles/EditPiatto.css";
import Delete from "../assets/icons8-delete-25.png";
import Edit from "../assets/icons8-edit-24.png";

function ManagePiatti() {
  const [weeklyPiatti, setWeeklyPiatti] = useState([]);
  const [editingPiatto, setEditingPiatto] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isNewPiatto, setIsNewPiatto] = useState(false);
  const [globalFilter, setGlobalFilter] = useState(null);
  const [disponibileFilter, setDisponibileFilter] = useState(0); // Start with showing unavailable (0)
  const [selectedDay, setSelectedDay] = useState(null); // State for selected day
  const toast = useRef(null);
  const { getToken } = useAuth();
  const token = getToken();

  const tipoPiattoOptions = [
    { label: "Primo", value: "Primo" },
    { label: "Secondo", value: "Secondo" },
    { label: "Contorno", value: "Contorno" },
    { label: "Piatto unico", value: "Piatto unico" },
  ];

  const dayOptions = [
    { label: "Monday", value: "Monday" },
    { label: "Tuesday", value: "Tuesday" },
    { label: "Wednesday", value: "Wednesday" },
    { label: "Thursday", value: "Thursday" },
    { label: "Friday", value: "Friday" },
  ];

  const api = useCallback(
    axios.create({
      baseURL: "http://localhost:8080/api",
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
      console.log("API response:", response.data);
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

  const filteredPiatti = weeklyPiatti.filter(piatto => {
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
      data: new Date().toISOString().split("T")[0],
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

  const deletePiatto = async (id) => {
    confirmDialog({
      message: "Are you sure you want to delete this piatto?",
      header: "Confirm Deletion",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        try {
          await api.delete(`/piatto/delete/${id}`);
          fetchWeeklyPiatti();
          showToast("success", "Success", "Piatto deleted successfully");
        } catch (error) {
          console.error("Error deleting piatto:", error);
          showToast("error", "Error", "Failed to delete piatto");
        }
      },
      reject: () => {
        // Optional: Add any logic for when the user rejects the deletion
      },
    });
  };

  const showToast = (severity, summary, detail) => {
    toast.current.show({ severity, summary, detail });
  };

  const actionTemplate = (rowData) => {
    return (
      <div className="action-buttons">
        <button className="btn-edit" onClick={() => editPiatto(rowData)}>
          <img src={Edit} alt="Edit" className="action-icon" />
        </button>
        <button
          className="btn-delete"
          onClick={() => deletePiatto(rowData.id_piatto)}
        >
          <img src={Delete} alt="Delete" className="action-icon" />
        </button>
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
            placeholder="Search by name..."
          />
        </span>
        <div className="disponibile-filter">
          <label htmlFor="disponibileFilter">Show available: </label>
          <InputSwitch
            id="disponibileFilter"
            checked={disponibileFilter === 1}
            onChange={(e) => setDisponibileFilter(e.value ? 1 : 0)}
          />
        </div>
        <div className="day-filter">
          <label htmlFor="dayFilter">Filter by Day:</label>
          <Dropdown
            id="dayFilter"
            value={selectedDay}
            options={dayOptions}
            onChange={(e) => setSelectedDay(e.value)}
            placeholder="Select a day"
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

      <h1>Manage Weekly Piatti</h1>
      <DataTable
        value={filteredPiatti}
        paginator
        rows={10}
        globalFilter={globalFilter}
        header={header}
      >
        <Column field="id_piatto" header="ID" />
        <Column field="nome_piatto" header="Nome Piatto" />
        <Column field="nome_tipo" header="Tipo Piatto" />
        <Column field="data" header="Data" />
        <Column field="dayOfWeek" header="Day of Week" />
        <Column
          field="sempreDisponibile"
          header="Disponibile"
          body={disponibileBodyTemplate}
        />
        <Column
          body={actionTemplate}
          header="Actions"
          style={{ width: "150px" }}
        />
      </DataTable>
      <Dialog
        header={isNewPiatto ? "Add New Piatto" : "Edit Piatto"}
        visible={showDialog}
        style={{ width: "50vw" }}
        modal
        onHide={() => setShowDialog(false)}
      >
        {editingPiatto && (
          <div>
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
              />
            </div>
            <div className="p-field">
              <label htmlFor="nome_tipo">Tipo Piatto</label>
              <Dropdown
                id="nome_tipo"
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
                placeholder="Select a type"
                optionLabel="label"
              />
            </div>
          
            <div className="p-field">
              <label htmlFor="data">Data</label>
              <Calendar
                id="data"
                value={new Date(editingPiatto.data)}
                onChange={(e) =>
                  setEditingPiatto({
                    ...editingPiatto,
                    data: e.value.toISOString().split("T")[0],
                  })
                }
                dateFormat="yy-mm-dd"
              />
            </div>
            <div className="p-field">
              <label htmlFor="sempreDisponibile">Disponibile</label>
              <InputSwitch
                id="sempreDisponibile"
                checked={editingPiatto.sempreDisponibile}
                onChange={(e) =>
                  setEditingPiatto({
                    ...editingPiatto,
                    sempreDisponibile: e.value,
                  })
                }
              />
            </div>
            <Button label="Save" icon="pi pi-check" onClick={savePiatto} />
          </div>
        )}
      </Dialog>
      <Button
        label="Add New Piatto"
        icon="pi pi-plus"
        onClick={addNewPiatto}
        className="p-button-primary add-piatto-button"
      />
    </div>
  );
}

export default ManagePiatti;
