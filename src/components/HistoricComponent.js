import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";


export default function HistoricComponent() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8080/api/ordine-element')
      .then(response => response.json())
      .then(data => setData(data));
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${new Intl.DateTimeFormat('it-IT').format(date)}`;
  };

  return (
    <div>
      <DataTable value={data.map(item => ({
        nome: item.username,
        order_data: item.dataPrenotazione,
        order: `${item.idPiatto} (${item.nome})`
      }))} paginator rows={5} rowsPerPageOptions={[5, 10, 25, 50]} tableStyle={{ minWidth: '50rem' }}>
        <Column field="nome" header="Nome" style={{ width: '25%' }}></Column>
        <Column field="order-data" header="Giorno dell'Ordine" style={{ width: '25%' }} body={(rowData) => formatDate(rowData.order_data)}></Column>
        <Column field="order" header="Ordine" style={{ width: '25%' }}></Column>
      </DataTable>
    </div>
  );
}
