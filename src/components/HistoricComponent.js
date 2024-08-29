import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";


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
        order_data: item.reservation_date,
        order: `${item.tipo_piatti}`
      }))} paginator rows={5} rowsPerPageOptions={[5, 10, 25, 50]} tableStyle={{ minWidth: '50rem' }}>
        <Column field="nome" sortable header="Nome" style={{ width: '25%' }}></Column>
        <Column field="order-data" sortable header="Giorno dell'Ordine" style={{ width: '25%' }} body={(rowData) => formatDate(rowData.order_data)}></Column>
        <Column field="order" sortable header="Ordine" style={{ width: '25%' }}></Column>
      </DataTable>
      <Button>Prenotazione per persona</Button>
    </div>
  );
}
