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

export default function PiattiTable({ data, setData }) {
  const tipoPiattoOptions = [
    { label: "Primo", value: 1 },
    { label: "Secondo", value: 2 },
    { label: "Contorno", value: 3 },
    { label: "Piatto unico", value: 4 },
  ];

  const [editingRows, setEditingRows] = useState({});
  const [clonedData, setClonedData] = useState({});
  const [weekDateOptions, setWeekDateOptions] = useState([]);
  const [displayDialog, setDisplayDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const toast = useRef(null);

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

  const dateBodyTemplate = (rowData) => formatDateForPiattiTable(rowData.data);

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

  const handleDelete = (id) => {
    setData((prevData) => prevData.filter((item) => item.id !== id));
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

  return (
    <div className="piatti-table-container">
      <Toast ref={toast} />
      <DataTable
        value={data}
        dataKey="id"
        editMode="row"
        responsiveLayout="scroll"
        showGridlines
        editingRows={editingRows}
        onRowEditInit={onRowEditInit}
        onRowEditCancel={onRowEditCancel}
        onRowEditSave={onRowEditSave}
        onRowEditComplete={onRowEditComplete}
      >
        <Column
          field="nome"
          header="Nome Piatto"
          style={{ width: "25%" }}
          body={(rowData) => {
            if (editingRows[rowData.id]) {
              return (
                <InputText
                  value={rowData.nome}
                  onChange={(e) => {
                    const updatedData = [...data];
                    const index = updatedData.findIndex(
                      (item) => item.id === rowData.id
                    );
                    updatedData[index] = {
                      ...updatedData[index],
                      nome: e.target.value,
                    };
                    setData(updatedData);
                  }}
                  className="p-inputtext p-component"
                />
              );
            }
            return rowData.nome;
          }}
        />
        <Column
          field="tipo_piatto"
          header="Tipo Piatto"
          style={{ width: "25%" }}
          body={(rowData) => {
            if (editingRows[rowData.id]) {
              return (
                <Dropdown
                  value={rowData.tipo_piatto}
                  options={tipoPiattoOptions}
                  onChange={(e) => {
                    const updatedData = [...data];
                    const index = updatedData.findIndex(
                      (item) => item.id === rowData.id
                    );
                    updatedData[index] = {
                      ...updatedData[index],
                      tipo_piatto: e.value,
                    };
                    setData(updatedData);
                  }}
                  className="dropdown-user"
                  optionLabel="label"
                />
              );
            }
            const tipo = tipoPiattoOptions.find(
              (option) => option.value === rowData.tipo_piatto
            );
            return tipo ? tipo.label : rowData.tipo_piatto;
          }}
        />
        <Column
          field="data"
          header="Data"
          style={{ width: "35%" }}
          body={(rowData) => {
            if (editingRows[rowData.id]) {
              return (
                <Dropdown
                  value={rowData.data}
                  options={weekDateOptions}
                  onChange={(e) => {
                    const updatedData = [...data];
                    const index = updatedData.findIndex(
                      (item) => item.id === rowData.id
                    );
                    updatedData[index] = {
                      ...updatedData[index],
                      data: e.value,
                    };
                    setData(updatedData);
                  }}
                  placeholder="Seleziona una data"
                  className="dropdown-user"
                  optionLabel="label"
                />
              );
            }
            return dateBodyTemplate(rowData);
          }}
        />
        <Column
          headerStyle={{ width: "15%", textAlign: "center" }}
          bodyStyle={{ textAlign: "center" }}
          body={actionBodyTemplate}
        />
      </DataTable>

      <Dialog
        visible={displayDialog}
        style={{ width: "450px" }}
        header="Conferma eliminazione"
        modal
        footer={
          <div className="delete-modal">
            <Button
              label="No"
              icon="pi pi-times"
              onClick={cancelDialog}
              className="p-button-text"
            />
            <Button
              label="Sì"
              icon="pi pi-check"
              onClick={confirmDeleteAction}
              className="p-button-text"
            />
          </div>
        }
        onHide={cancelDialog}
      >
        <p>Sei sicuro di voler eliminare questo piatto?</p>
      </Dialog>
    </div>
  );
}
