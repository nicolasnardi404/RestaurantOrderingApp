import React from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";

const TIPO_OPTIONS = [
  { label: "Primo piatto", value: "Primo piatto" },
  { label: "Secondo piatto", value: "Secondo piatto" },
  { label: "Contorno", value: "Contorno" },
];

export default function PiattiTable({ data, setData }) {
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

  const tipoEditor = (options) => {
    return (
      <Dropdown
        value={options.value}
        options={TIPO_OPTIONS}
        onChange={(e) => options.editorCallback(e.value)}
        placeholder="Select a Type"
      />
    );
  };

  const dateEditor = (options) => {
    return (
      <Calendar
        value={new Date(options.value)}
        onChange={(e) =>
          options.editorCallback(e.value.toISOString().split("T")[0])
        }
        dateFormat="yy-mm-dd"
      />
    );
  };

  return (
    <div className="card">
      <DataTable
        value={data}
        editMode="row"
        dataKey="id"
        onRowEditComplete={onRowEditComplete}
        responsiveLayout="scroll"
      >
        <Column
          field="nome"
          header="Nome Piatto"
          editor={(options) => textEditor(options)}
          style={{ width: "25%" }}
        />
        <Column
          field="tipo"
          header="Tipo"
          editor={(options) => tipoEditor(options)}
          style={{ width: "25%" }}
        />
        <Column
          field="giorno"
          header="Giorno"
          editor={(options) => textEditor(options)}
          style={{ width: "25%" }}
        />
        <Column
          field="data"
          header="Data"
          editor={(options) => dateEditor(options)}
          style={{ width: "25%" }}
        />
        <Column
          rowEditor
          headerStyle={{ width: "10%", minWidth: "8rem" }}
          bodyStyle={{ textAlign: "center" }}
        />
      </DataTable>
    </div>
  );
}
