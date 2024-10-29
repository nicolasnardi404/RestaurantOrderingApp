import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { formatDateForDisplay } from "../util/FormatDateForDisplay";

// Utility function to generate the current week's weekdays (Monday to Friday)
const getCurrentWeekWeekdays = () => {
  const currentDate = new Date();
  const dayOfWeek = currentDate.getDay(); // 0 (Sun) to 6 (Sat)

  // Calculate how many days to subtract to get Monday
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

  // Generate dates for Monday to Friday
  for (let i = 0; i < 5; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dayName = dayNames[date.getDay()];
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const formattedDate = `${dayName} ${day}/${month}/${year}`;
    const isoDate = date.toISOString().split("T")[0]; // 'YYYY-MM-DD'

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

  // Generate weekly date options (Monday to Friday) on component mount
  useEffect(() => {
    const options = getCurrentWeekWeekdays();
    setWeekDateOptions(options);
  }, []);

  // Formatter for the 'data' field
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

  // Body template for 'data' column
  const dateBodyTemplate = (rowData) => {
    return formatDateForPiattiTable(rowData.data);
  };

  // Editor for 'nome_piatto' column
  const nomePiattoEditor = (options) => {
    return (
      <InputText
        value={options.value}
        onChange={(e) => options.editorCallback(e.target.value)}
        className="p-inputtext p-component"
      />
    );
  };

  // Editor for 'tipo_piatto' column
  const tipoPiattoEditor = (options) => {
    return (
      <Dropdown
        value={options.value}
        options={tipoPiattoOptions}
        onChange={(e) => options.editorCallback(e.value)}
        className="w-full"
      />
    );
  };

  // Editor for 'data' column (Dropdown with weekdays only)
  const dataEditor = (options) => {
    return (
      <Dropdown
        value={options.value}
        options={weekDateOptions}
        onChange={(e) => options.editorCallback(e.value)}
        placeholder="Seleziona una data"
        className="w-full"
      />
    );
  };

  // Handle row edit initiation
  const onRowEditInit = (event) => {
    const { data: rowData } = event;
    setClonedData((prev) => ({
      ...prev,
      [rowData.id]: { ...rowData },
    }));
    setEditingRows((prev) => ({ ...prev, [rowData.id]: true }));
  };

  // Handle row edit cancellation
  const onRowEditCancel = (event) => {
    const { data: rowData } = event;
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

  // Handle row edit completion
  const onRowEditSave = (event) => {
    const updatedRow = event.data;

    // Debugging: Check the updatedRow
    console.log("Saving updated row:", updatedRow);

    // Validate updatedRow if necessary
    if (
      !updatedRow.nome_piatto ||
      !updatedRow.tipo_piatto ||
      !updatedRow.data
    ) {
      alert("Tutti i campi sono obbligatori.");
      return;
    }

    // Update the main data state
    const updatedData = data.map((item) =>
      item.id === updatedRow.id ? updatedRow : item
    );
    setData(updatedData);

    // Clear cloned data and editing state
    setClonedData((prev) => {
      const newClonedData = { ...prev };
      delete newClonedData[updatedRow.id];
      return newClonedData;
    });

    setEditingRows((prev) => {
      const newEditingRows = { ...prev };
      delete newEditingRows[updatedRow.id];
      return newEditingRows;
    });
  };

  const onRowEditComplete = (e) => {
    let _data = [...data];
    let { newData, index } = e;

    _data[index] = newData;
    setData(_data);
  };

  const textEditor = (options) => {
    return (
      <InputText
        type="text"
        value={options.value}
        onChange={(e) => options.editorCallback(e.target.value)}
      />
    );
  };

  return (
    <div className="card">
      <DataTable
        value={data}
        dataKey="id"
        editMode="row"
        responsiveLayout="scroll"
        showGridlines
        onRowEditInit={onRowEditInit}
        onRowEditCancel={onRowEditCancel}
        onRowEditSave={onRowEditSave}
        editingRows={editingRows}
        onRowEditComplete={onRowEditComplete}
      >
        <Column
          field="nome_piatto"
          header="Nome Piatto"
          style={{ width: "25%" }}
          editor={(options) => textEditor(options)}
        />
        <Column
          field="tipo_piatto"
          header="Tipo Piatto"
          style={{ width: "25%" }}
          editor={tipoPiattoEditor}
          body={(rowData) => {
            const tipo = tipoPiattoOptions.find(
              (option) => option.value === rowData.tipo_piatto
            );
            return tipo ? tipo.label : rowData.tipo_piatto;
          }}
        />
        <Column
          field="data"
          header="Data"
          style={{ width: "25%" }}
          body={dateBodyTemplate}
          editor={dataEditor}
        />
        <Column
          rowEditor
          headerStyle={{ width: "10%", textAlign: "center" }}
          bodyStyle={{ textAlign: "center" }}
        />
      </DataTable>
    </div>
  );
}
