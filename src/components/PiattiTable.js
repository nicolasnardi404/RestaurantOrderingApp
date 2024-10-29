import React, { useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { formatDateForDisplay } from "../util/FormatDateForDisplay";

export default function PiattiTable({ data, setData }) {
  const tipoPiattoOptions = [
    { label: "Primo", value: 1 },
    { label: "Secondo", value: 2 },
    { label: "Contorno", value: 3 },
    { label: "Piatto unico", value: 4 },
  ];

  const formatDateForPiattiTable = (dateString) => {
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

    return `${weekday} ${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
  };

  const dateBodyTemplate = (rowData) => {
    return formatDateForPiattiTable(rowData.data);
  };

  const onEditorValueChange = (rowData, field, value) => {
    const updatedData = data.map((item) =>
      // Ensure 'id' is unique for each item
      item.id === rowData.id ? { ...item, [field]: value } : item
    );
    setData(updatedData);
  };

  // **TextEditor Component with Local State**
  const TextEditor = ({ rowData, field }) => {
    const [value, setValue] = useState(rowData[field] || "");

    const handleChange = (e) => {
      setValue(e.target.value);
    };

    const handleBlur = () => {
      onEditorValueChange(rowData, field, value);
    };

    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        onEditorValueChange(rowData, field, value);
      }
    };

    return (
      <InputText
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        onFocus={(e) => e.target.select()}
        className="p-inputtext p-component"
      />
    );
  };

  // **Dropdown Editor (No Changes Needed)**
  const dropdownEditor = (props) => {
    return (
      <Dropdown
        value={props.value}
        options={tipoPiattoOptions}
        onChange={(e) =>
          onEditorValueChange(props.rowData, props.field, e.value)
        }
        className="w-full"
      />
    );
  };

  const [menuItems, setMenuItems] = useState([]);

  const handleEdit = (itemToEdit) => {
    setMenuItems((prevItems) =>
      prevItems.map((item) => {
        // Match the specific item using multiple fields to ensure uniqueness
        if (
          item.data === itemToEdit.data &&
          item.nome_piatto === itemToEdit.nome_piatto &&
          item.tipo_piatto === itemToEdit.tipo_piatto
        ) {
          return { ...item, isEditing: true };
        }
        return item;
      })
    );
  };

  const handleSave = (updatedItem) => {
    setMenuItems((prevItems) =>
      prevItems.map((item) => {
        if (
          item.data === updatedItem.data &&
          item.nome_piatto === updatedItem.nome_piatto &&
          item.tipo_piatto === updatedItem.tipo_piatto
        ) {
          return { ...updatedItem, isEditing: false };
        }
        return item;
      })
    );
  };

  // **Calendar Editor Component**
  const CalendarEditor = ({ rowData, field }) => {
    const [value, setValue] = useState(new Date(rowData[field]));

    const handleChange = (e) => {
      const newDate = e.value;
      setValue(newDate);
      const formattedDate = newDate.toISOString().split("T")[0]; // Format date as 'YYYY-MM-DD'
      onEditorValueChange(rowData, field, formattedDate);
    };

    const handleClick = (e) => {
      e.stopPropagation(); // Prevents the click from bubbling up to the DataTable
    };

    return (
      <Calendar
        value={value}
        onChange={handleChange}
        dateFormat="yy-mm-dd"
        showIcon
        appendTo="self" // Ensures the popup is positioned correctly within the cell
        onClick={handleClick} // Add this line to stop event propagation
        onFocus={(e) => e.target.select()} // Optional: Select the input on focus
      />
    );
  };

  const dt = useRef(null); // Reference to the DataTable

  const handleCellClick = (e) => {
    dt.current.initCellEditMode(e.originalEvent, e.index, e.field);
  };

  const [editingRow, setEditingRow] = useState(null);

  const handleEditClick = (rowData) => {
    setEditingRow(rowData.id);
  };

  const handleSaveClick = () => {
    setEditingRow(null);
  };

  return (
    <div className="card">
      <DataTable
        ref={dt}
        value={data}
        dataKey="id"
        responsiveLayout="scroll"
        editMode="cell"
        showGridlines
      >
        <Column
          field="nome_piatto"
          header="Nome Piatto"
          style={{ width: "25%" }}
          editor={(props) =>
            editingRow === props.rowData.id ? (
              <TextEditor rowData={props.rowData} field={props.field} />
            ) : null
          }
        />
        <Column
          field="tipo_piatto"
          header="Tipo Piatto"
          style={{ width: "25%" }}
          editor={(props) =>
            editingRow === props.rowData.id ? dropdownEditor(props) : null
          }
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
          editor={(props) =>
            editingRow === props.rowData.id ? (
              <CalendarEditor rowData={props.rowData} field={props.field} />
            ) : null
          }
        />
        <Column
          header="Actions"
          style={{ width: "25%" }}
          body={(rowData) => (
            <button
              onClick={() =>
                editingRow === rowData.id
                  ? handleSaveClick()
                  : handleEditClick(rowData)
              }
            >
              {editingRow === rowData.id ? "Save" : "Edit"}
            </button>
          )}
        />
      </DataTable>
    </div>
  );
}
