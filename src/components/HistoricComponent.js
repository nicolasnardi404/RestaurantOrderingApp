import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";  // Import Dropdown component
import { UseDataLocal } from "../util/UseDataLocal";
import { ITALIAN_LOCALE_CONFIG } from "../util/ItalianLocaleConfigData";

export default function HistoricComponent() {
  UseDataLocal(ITALIAN_LOCALE_CONFIG);

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date()); // Start with the current month
  const [selectedUsername, setSelectedUsername] = useState('');  // State for selected username
  const [data, setData] = useState([]);
  const [dataFiltered, setDataFiltered] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [showDayCalendar, setShowDayCalendar] = useState(false); // Start with month calendar
  const [usernames, setUsernames] = useState([]);  // State to store all unique usernames
  const navigate = useNavigate();

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

        // Extract unique usernames for the dropdown
        const uniqueUsernames = [...new Set(formattedData.map(item => item.username))];
        setUsernames(uniqueUsernames);

        console.log(formattedData);
      });
  }, []);

  function formatDateFromCalendar(dateString) {
    const dateObj = new Date(dateString);

    if (isNaN(dateObj.getTime())) {
      console.error('Invalid date:', dateString);
      return '';
    }

    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();

    return `${day}/${month}/${year}`;
  }

  function handleDayChange(event) {
    setSelectedDate(event.value);
    applyFilters(event.value, selectedMonth, selectedUsername);
  }

  function handleMonthChange(event) {
    setSelectedMonth(event.value);
    applyFilters(selectedDate, event.value, selectedUsername);
  }

  function handleUsernameChange(event) {
    setSelectedUsername(event.value);
    applyFilters(selectedDate, selectedMonth, event.value);
  }

  function applyFilters(date, month, username) {
    let filteredData = data;

    // Filter by date if day calendar is shown
    if (showDayCalendar && date) {
      filteredData = filteredData.filter(item => item.reservation_date === formatDateFromCalendar(date));
    }

    // Filter by month if month calendar is shown
    if (!showDayCalendar && month) {
      const formattedMonth = formatDateForMonth(month);
      filteredData = filteredData.filter(item => {
        const itemDate = new Date(item.reservation_date.split('/').reverse().join('-'));
        const itemMonthYear = `${String(itemDate.getMonth() + 1).padStart(2, '0')}/${itemDate.getFullYear()}`;
        return itemMonthYear === formattedMonth;
      });
    }

    // Filter by username if selected
    if (username) {
      filteredData = filteredData.filter(item => item.username === username);
    }

    setDataFiltered(filteredData);
    setIsFiltered(true);
  }

  function formatDateForMonth(dateString) {
    const dateObj = new Date(dateString);
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${month}/${year}`;
  }

  function handleClick() {
    navigate("/prenotazione-per-persona");
  }

  const formatDate = (dateString) => {
    const dateToString = String(dateString);
    const dateSplit = dateToString.split(' ');
    const date = new Date(dateSplit[0]);
    return `${new Intl.DateTimeFormat('it-IT').format(date)}`;
  };

  const columns = [
    { field: 'username', header: 'Nome', style: { width: '25%' }, body: (rowData) => rowData.username },
    { field: 'reservation_date', header: 'Giorno dell Ordine', style: { width: '25%' }, body: (rowData) => rowData.reservation_date },
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

  const handleToggleCalendar = () => {
    setShowDayCalendar(!showDayCalendar);
    setIsFiltered(false); // Reset filter state when switching calendars

    if (!showDayCalendar) {
      // Switching to day view, reset month filter
      setSelectedMonth(new Date());
    } else {
      // Switching to month view, reset day filter and apply month filter
      setSelectedDate('');
      handleMonthChange({ value: selectedMonth });
    }
  };

  return (
    <div>
      {/* Toggle Button to switch between calendars */}
      <Button onClick={handleToggleCalendar}>
        {showDayCalendar ? 'Switch to Month View' : 'Switch to Day View'}
      </Button>

      {/* Conditionally render the calendars */}
      {showDayCalendar ? (
        <Calendar
          id="daySelect"
          value={selectedDate}
          onChange={handleDayChange}
          dateFormat="dd/mm/yy"
          showIcon
        />
      ) : (
        <Calendar
          id="monthSelect"
          value={selectedMonth}
          onChange={handleMonthChange}
          view="month"
          dateFormat="mm/yy"
          showIcon
        />
      )}

      {/* Dropdown for username selection */}
      <Dropdown
        value={selectedUsername}
        options={usernames.map(username => ({ label: username, value: username }))}
        onChange={handleUsernameChange}
        placeholder="Select a Username"
        style={{ marginTop: '1rem', width: '200px' }}
        showClear
      />

      {isFiltered && (
        <p>Visualizza ordini per il giorno, il mese o il nome utente selezionato:</p>
      )}

      <DataTableComponent data={isFiltered ? dataFiltered : data} columns={columns}></DataTableComponent>
      <Button onClick={handleClick}>Prenotazione per persona</Button>
    </div>
  );
}
