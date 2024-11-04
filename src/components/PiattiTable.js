import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import "../styles/DragAndDrop.css";

const getCurrentWeekWeekdays = () => {
  const currentDate = new Date();
  const dayOfWeek = currentDate.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(currentDate);
  monday.setDate(currentDate.getDate() + mondayOffset);

  const weekWeekdays = [];
  const dayNames = [
    "Domenica",
    "Lunedì",
    "Martedì",
    "Mercoledì",
    "Giovedì",
    "Venerdì",
    "Sabato",
  ];

  for (let i = 0; i < 5; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dayName = dayNames[date.getDay()];
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const formattedDate = `${dayName} ${day}/${month}/${year}`;
    const isoDate = date.toISOString().split("T")[0];
    weekWeekdays.push({ label: formattedDate, value: isoDate });
  }

  return weekWeekdays;
};

export default function PiattiTable({ data, setData, getRowClassName }) {
  const tipoPiattoOptions = [
    { label: "Primo", value: 1 },
    { label: "Secondo", value: 2 },
    { label: "Contorno", value: 3 },
  ];

  const [editingRows, setEditingRows] = useState({});
  const [clonedData, setClonedData] = useState({});
  const [weekDateOptions, setWeekDateOptions] = useState([]);
  const [displayDialog, setDisplayDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const toast = useRef(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPiatto, setEditingPiatto] = useState(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newPiatto, setNewPiatto] = useState(null);

  const tipoPiattoHeaders = {
    1: "Primo",
    2: "Secondo",
    3: "Contorno",
  };

  useEffect(() => {
    const options = getCurrentWeekWeekdays();
    setWeekDateOptions(options);
  }, []);

  const formatDateForPiattiTable = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    const date = new Date(year, month - 1, day);
    const dayNames = [
      "Domenica",
      "Lunedì",
      "Martedì",
      "Mercoledì",
      "Giovedì",
      "Venerdì",
      "Sabato",
    ];
    const weekday = dayNames[date.getDay()];

    return `${weekday} ${day.padStart(2, "0")}/${month.padStart(
      2,
      "0"
    )}/${year}`;
  };

  const dateBodyTemplate = (rowData) => (
    <div className="date-cell" onClick={() => handleAddClick(rowData.date)}>
      <span className="date-text">
        <div className="weekday">
          <strong>
            {new Date(rowData.date)
              .toLocaleDateString("it-IT", {
                weekday: "long",
              })
              .toUpperCase()}
          </strong>
        </div>
        <div className="date">
          {new Date(rowData.date).toLocaleDateString("it-IT", {
            day: "numeric",
            month: "long",
          })}
        </div>
      </span>
      <span className="add-icon">
        <i className="pi pi-plus" />
      </span>
    </div>
  );

  const nomePiattoEditor = (options) => (
    <InputText
      value={options.value}
      onChange={(e) => options.editorCallback(e.target.value)}
      className="p-inputtext p-component"
    />
  );

  const tipoPiattoEditor = (options) => (
    <Dropdown
      value={options.value}
      options={tipoPiattoOptions}
      onChange={(e) => options.editorCallback(e.value)}
      className="dropdown-user"
    />
  );

  const dataEditor = (options) => (
    <Dropdown
      value={options.value}
      options={weekDateOptions}
      onChange={(e) => options.editorCallback(e.value)}
      placeholder="Seleziona una data"
      className="dropdown-user"
    />
  );

  const onRowEditInit = (event) => {
    const rowData = event.data;
    setClonedData((prev) => ({
      ...prev,
      [rowData.id]: { ...rowData },
    }));
    setEditingRows((prev) => ({ ...prev, [rowData.id]: true }));
  };

  const onRowEditCancel = (event) => {
    const rowData = event.data;
    const clonedRow = clonedData[rowData.id];
    const updatedData = data.map((item) =>
      item.id === rowData.id ? clonedRow : item
    );
    setData(updatedData);

    setClonedData((prev) => {
      const newClonedData = { ...prev };
      delete newClonedData[rowData.id];
      return newClonedData;
    });

    setEditingRows((prev) => {
      const newEditingRows = { ...prev };
      delete newEditingRows[rowData.id];
      return newEditingRows;
    });
  };

  const onRowEditSave = (event) => {
    const rowData = event.data;

    // Update the data array with the edited row
    const updatedData = data.map((item) =>
      item.id === rowData.id ? rowData : item
    );
    setData(updatedData);

    // Clear editing states
    setClonedData((prev) => {
      const newClonedData = { ...prev };
      delete newClonedData[rowData.id];
      return newClonedData;
    });

    setEditingRows((prev) => {
      const newEditingRows = { ...prev };
      delete newEditingRows[rowData.id];
      return newEditingRows;
    });
  };

  const handleDelete = (piatto) => {
    const updatedData = data.filter((p) => p.id !== piatto.id);
    setData(updatedData);
    toast.current.show({
      severity: "success",
      summary: "Success",
      detail: "Piatto eliminato con successo",
      life: 3000,
    });
  };

  const confirmDelete = (rowData) => {
    setDeleteId(rowData.id);
    setDisplayDialog(true);
  };

  const cancelDialog = () => {
    setDisplayDialog(false);
    setDeleteId(null);
  };

  const confirmDeleteAction = () => {
    handleDelete(deleteId);
    setDisplayDialog(false);
    setDeleteId(null);
  };

  const actionBodyTemplate = (rowData) => {
    const isEditing = editingRows[rowData.id];
    return (
      <div className="action-buttons">
        {isEditing ? (
          <>
            <Button
              icon="pi pi-check"
              className="btn-edit"
              onClick={() => onRowEditSave({ data: rowData })}
              tooltip="Salva modifiche"
            />
            <Button
              icon="pi pi-times"
              className="btn-delete"
              onClick={() => onRowEditCancel({ data: rowData })}
              tooltip="Annulla modifiche"
            />
          </>
        ) : (
          <>
            <Button
              icon="pi pi-pencil"
              className="btn-edit"
              onClick={() => onRowEditInit({ data: rowData })}
              tooltip="Modifica piatto"
            />
            <Button
              icon="pi pi-trash"
              className="btn-delete"
              onClick={() => confirmDelete(rowData)}
              tooltip="Elimina piatto"
            />
          </>
        )}
      </div>
    );
  };

  const onRowEditComplete = (e) => {
    let { newData, index } = e;
    let _data = [...data];
    _data[index] = newData;
    setData(_data);
  };

  const handlePiattoClick = (piatto) => {
    setEditingPiatto(piatto);
    setEditModalVisible(true);
  };

  const handleEditSave = (editedPiatto) => {
    const updatedData = data.map((item) =>
      item.id === editedPiatto.id ? editedPiatto : item
    );
    setData(updatedData);
    setEditModalVisible(false);
    setEditingPiatto(null);
    toast.current.show({
      severity: "success",
      summary: "Success",
      detail: "Piatto modificato con successo",
      life: 3000,
    });
  };

  // Group piatti by date and type
  const groupPiattiByDate = (data) => {
    // Sort data by date first
    const sortedData = [...data].sort(
      (a, b) => new Date(a.data) - new Date(b.data)
    );

    return sortedData.reduce((acc, piatto) => {
      const dateExists = acc.find((group) => group.date === piatto.data);

      if (!dateExists) {
        acc.push({
          date: piatto.data,
          primo: [],
          secondo: [],
          contorno: [],
        });
      }

      const group = acc.find((group) => group.date === piatto.data);

      switch (piatto.tipo_piatto) {
        case 1:
          group.primo.push(piatto);
          break;
        case 2:
          group.secondo.push(piatto);
          break;
        case 3:
          group.contorno.push(piatto);
          break;
        default:
          break;
      }

      return acc;
    }, []);
  };

  const PiattoCell = ({ piatto, onEdit, onDelete }) => {
    return (
      <div className="piatto-name-cell">
        <span className="piatto-name" onClick={() => onEdit(piatto)}>
          {piatto.nome}
        </span>
        <button
          className="delete-button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(piatto);
          }}
        >
          <i className="pi pi-times" />
        </button>
      </div>
    );
  };

  const PiattoColumn = ({ title, piatti, onEdit, onDelete }) => {
    return (
      <div className="piatti-column">
        <div className="piatti-cell">
          {piatti?.map((piatto) => (
            <PiattoCell
              key={piatto.id}
              piatto={piatto}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>
    );
  };

  const handleAddClick = (date) => {
    setNewPiatto({
      data: date,
      tipo_piatto: 1, // Default value, can be changed in modal
      nome: "",
    });
    setAddModalVisible(true);
  };

  const handleAddSave = () => {
    if (!newPiatto.nome.trim()) {
      toast.current.show({
        severity: "error",
        summary: "Errore",
        detail: "Il nome del piatto è obbligatorio",
        life: 3000,
      });
      return;
    }

    const updatedData = [...data, { ...newPiatto, id: Date.now() }];
    setData(updatedData);
    setAddModalVisible(false);
    setNewPiatto(null);
    toast.current.show({
      severity: "success",
      summary: "Success",
      detail: "Piatto aggiunto con successo",
      life: 3000,
    });
  };

  return (
    <div className="piatti-table-container">
      <Toast ref={toast} />
      <DataTable
        value={groupPiattiByDate(data)}
        dataKey="date"
        responsiveLayout="scroll"
        showGridlines
      >
        <Column field="date" header="Data" body={dateBodyTemplate} />
        <Column
          header="Primo"
          body={(rowData) => (
            <PiattoColumn
              title="Primo"
              piatti={rowData.primo}
              onEdit={handlePiattoClick}
              onDelete={handleDelete}
            />
          )}
        />
        <Column
          header="Secondo"
          body={(rowData) => (
            <PiattoColumn
              title="Secondo"
              piatti={rowData.secondo}
              onEdit={handlePiattoClick}
              onDelete={handleDelete}
            />
          )}
        />
        <Column
          header="Contorno"
          body={(rowData) => (
            <PiattoColumn
              title="Contorno"
              piatti={rowData.contorno}
              onEdit={handlePiattoClick}
              onDelete={handleDelete}
            />
          )}
        />
      </DataTable>

      {/* Edit Modal */}
      <Dialog
        visible={editModalVisible}
        style={{ width: "450px" }}
        header="Modifica Piatto"
        modal
        onHide={() => setEditModalVisible(false)}
      >
        {editingPiatto && (
          <div className="edit-piatto-form">
            <div className="field">
              <label htmlFor="data">Data</label>
              <Dropdown
                id="data"
                value={editingPiatto.data}
                options={weekDateOptions}
                onChange={(e) =>
                  setEditingPiatto({ ...editingPiatto, data: e.value })
                }
                className="w-full"
              />
            </div>
            <div className="field">
              <label htmlFor="nome">Nome Piatto</label>
              <InputText
                id="nome"
                value={editingPiatto.nome}
                onChange={(e) =>
                  setEditingPiatto({ ...editingPiatto, nome: e.target.value })
                }
                className="w-full"
              />
            </div>
            <div className="field">
              <label htmlFor="tipo">Tipo Piatto</label>
              <Dropdown
                id="tipo"
                value={editingPiatto.tipo_piatto}
                options={tipoPiattoOptions}
                onChange={(e) =>
                  setEditingPiatto({ ...editingPiatto, tipo_piatto: e.value })
                }
                className="w-full"
              />
            </div>
            <div className="edit-modal-footer">
              <Button
                label="Annulla"
                icon="pi pi-times"
                onClick={() => setEditModalVisible(false)}
                className="p-button-text"
              />
              <Button
                label="Salva"
                icon="pi pi-check"
                onClick={() => handleEditSave(editingPiatto)}
                autoFocus
              />
            </div>
          </div>
        )}
      </Dialog>

      {/* Add Modal */}
      <Dialog
        visible={addModalVisible}
        style={{ width: "450px" }}
        header={`Aggiungi piatto`}
        modal
        onHide={() => setAddModalVisible(false)}
      >
        {newPiatto && (
          <div className="add-piatto-form">
            <h4>
              {new Date(newPiatto.data)
                .toLocaleDateString("it-IT", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })
                .trim()
                .toUpperCase()}
            </h4>
            <div className="field">
              <label htmlFor="tipo">Tipo Piatto</label>
              <Dropdown
                id="tipo"
                value={newPiatto.tipo_piatto}
                options={tipoPiattoOptions}
                onChange={(e) =>
                  setNewPiatto({ ...newPiatto, tipo_piatto: e.value })
                }
                className="w-full"
              />
            </div>
            <div className="field">
              <label htmlFor="nome">Nome Piatto*</label>
              <InputText
                id="nome"
                value={newPiatto.nome}
                onChange={(e) =>
                  setNewPiatto({ ...newPiatto, nome: e.target.value })
                }
                className="w-full"
                autoFocus
              />
            </div>
            <div className="edit-modal-footer">
              <Button
                label="Annulla"
                icon="pi pi-times"
                onClick={() => setAddModalVisible(false)}
                className="p-button-text"
              />
              <Button
                label="Salva"
                icon="pi pi-check"
                onClick={handleAddSave}
                disabled={!newPiatto.nome.trim()}
              />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
