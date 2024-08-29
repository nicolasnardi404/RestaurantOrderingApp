import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext"; // Import InputText component

export default function HistoricComponent() {
  const [data, setData] = useState([]);
  const navigate = useNavigate();
  const [filteredData, setFilteredData] = useState([]); // New state variable for filtered data
  const [filterUsername, setFilterUsername] = useState(""); // State for username filter input

  useEffect(() => {
    fetch('http://localhost:8080/api/ordine-element')
      .then(response => response.json())
      .then(data => {
        setData(data);
        setFilteredData(data.map(item => ({
          nome: item.username,
          order_data: item.reservation_date,
          order: `${item.tipo_piatti}`
        })));
      });
  }, []);

  function handleClick() {
    navigate("/prenotazione-per-persona");
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${new Intl.DateTimeFormat('it-IT').format(date)}`;
  };

  const handleFilterChange = (event) => {
    const filterValue = event.target.value.toLowerCase();
    setFilterUsername(filterValue);
    const filteredItems = data.filter(item => 
      item.username.toLowerCase().includes(filterValue)
    );
    setFilteredData(filteredItems.map(item => ({
      nome: item.username,
      order_data: item.reservation_date,
      order: `${item.tipo_piatti}`
    })));
  };

  return (
    <div>
      <InputText placeholder="Filter by Username" onChange={handleFilterChange} />
      <DataTable value={filteredData} paginator rows={5} rowsPerPageOptions={[5, 10, 25, 50]} tableStyle={{ minWidth: '50rem' }}>
        <Column field="nome" sortable header="Nome" style={{ width: '25%' }}></Column>
        <Column field="order_data" sortable header="Giorno dell'Ordine" style={{ width: '25%' }} body={(rowData) => formatDate(rowData.order_data)}></Column>
        <Column field="order" sortable header="Ordine" style={{ width: '25%' }}></Column>
      </DataTable>
      <Button onClick={handleClick}>Prenotazione per persona</Button>
    </div>
  );
}
