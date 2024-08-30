import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { UseDataLocal } from "../util/UseDataLocal";
import { ITALIAN_LOCALE_CONFIG } from "../util/ItalianLocaleConfigData";
import { Calendar } from "primereact/calendar";

export default function HistoricComponent() {
  UseDataLocal(ITALIAN_LOCALE_CONFIG);

  const [selectedDate, setSelectedDate] = useState('');
  const [data, setData] = useState([]);
  const [dataFiltered, setDataFiltered] = useState('')
  const navigate = useNavigate();
  const [isFiltered, setIsFiltered] = useState(false);

  useEffect(() => {
    fetch('http://localhost:8080/api/ordine-element')
      .then(response => response.json())
      .then(data => {
        const formattedData = data.map(item => ({
          username: item.username,
          reservation_date: formatDate(item.reservation_date),
          tipo_piatti: item.tipo_piatti
        }));
        setData(formattedData);
        console.log(formattedData)
      });
  }, []);
  
  function formatDateFromCalendar(dateString) {
    const dateObj = new Date(dateString);
    
    // Ensure the date is valid
    if (isNaN(dateObj.getTime())) {
      console.error('Invalid date:', dateString);
      return '';
    }
  
    // Extract day, month, year
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = dateObj.getFullYear();
  
    // Return the formatted date string
    return `${day}/${month}/${year}`;
  }

  function handleDayChange(selectedDate){
    setSelectedDate(selectedDate.value);
    const filterData = data.filter(item => (item.reservation_date) === formatDateFromCalendar(selectedDate.value));
    setDataFiltered(filterData);
    setIsFiltered(true);
  }
  function handleClick() {
    navigate("/prenotazione-per-persona");
  }

  const formatDate = (dateString) => {
    const dateToString = String(dateString)
    const dateSplit = dateToString.split(' ');
    const date = new Date(dateSplit[0]);
    return `${new Intl.DateTimeFormat('it-IT').format(date)}`;
  };

  const columns = [
    { field: 'username', header: 'Nome', style: { width: '25%' }, body: (rowData) => rowData.username },
    { field: 'reservation_date', header: 'Giorno dell Ordine', style: { width: '25%' }, body: (rowData) => rowData.reservation_date},
    { field: 'tipo_piatti', header: 'Ordine', style: { width: '25%' }, body: (rowData) => rowData.tipo_piatti }
  ];

  const DataTableComponent = ({ data, columns }) => {
    return (
      <DataTable value={data} paginator rows={5} rowsPerPageOptions={[5, 10, 25, 50]} tableStyle={{ minWidth: '50rem' }}>
        {columns.map((column, index) => (
          <Column key={index} field={column.field} sortable header={column.header} style={column.style} body={column.body}></Column>
        ))}
      </DataTable>
    );
  };

  return (
    <div>
      <Calendar
            id="daySelect"
            value={selectedDate}
            onChange={handleDayChange}
            dateFormat="dd/mm/yy"
            showIcon
          />
       {isFiltered && (
        <p>Visualizza ordini per il giorno selezionato:</p>
      )}
      <DataTableComponent data={isFiltered ? dataFiltered : data} columns={columns}></DataTableComponent>
      <Button onClick={handleClick}>Prenotazione per persona</Button>
    </div>
  );
}
