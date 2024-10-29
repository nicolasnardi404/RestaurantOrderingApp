import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { formatDateForDisplay } from "../util/FormatDateForDisplay";
import { Calendar } from "primereact/calendar";

export default function PiattiTable({ data, setData }) {
  const tipoPiattoOptions = [
    { label: "Primo", value: 1 },
    { label: "Secondo", value: 2 },
    { label: "Contorno", value: 3 },
    { label: "Piatto unico", value: 4 },
  ];

  const onEditorValueChange = (props, value) => {
    let updatedData = [...data];
    updatedData[props.rowIndex][props.field] = value;
  };

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

  return (
    <div className="card">
      <DataTable value={data} responsiveLayout="scroll">
        <Column
          field="nome_piatto"
          header="Nome Piatto"
          style={{ width: "33%" }}
          bodyEditor={(props) => (
            <InputText
              value={props.data[props.field]}
              onChange={(e) => onEditorValueChange(props, e.target.value)}
            />
          )}
        />
        <Column
          field="tipo_piatto"
          header="Tipo Piatto"
          style={{ width: "33%" }}
          bodyEditor={(props) => (
            <Dropdown
              options={tipoPiattoOptions}
              value={props.data[props.field]}
              onChange={(e) => onEditorValueChange(props, e.value)}
            />
          )}
        />
        <Column
          field="data"
          header="Data"
          style={{ width: "33%" }}
          body={dateBodyTemplate}
        />
      </DataTable>
    </div>
  );
}
