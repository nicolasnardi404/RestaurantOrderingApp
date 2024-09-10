import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { UseDataLocal } from "../util/UseDataLocal";
import { ITALIAN_LOCALE_CONFIG } from "../util/ItalianLocaleConfigData";
import { Card } from "primereact/card";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

export default function HistoricComponent() {
  UseDataLocal(ITALIAN_LOCALE_CONFIG);

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date()); // Start with the current month
  const [selectedUsername, setSelectedUsername] = useState(''); // State for selected username
  const [data, setData] = useState([]);
  const [showDayCalendar, setShowDayCalendar] = useState(false); // Start with month calendar
  const [usernames, setUsernames] = useState([]); // State to store all unique usernames
  const navigate = useNavigate();
  const [allowPDF, setAllowPDF] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Define the columns array
  const columns = [
    { field: 'username', header: 'Nome' },
    { field:'reservation_date', header: 'Giorno dell Ordine' },
    { field: 'tipo_piatti', header: 'Ordine' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedMonth) return; // Ensure we have a valid month before fetching

      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:8080/api/ordine/readByMese/${formatURL(selectedMonth)}`);
        const data = await response.json();

        console.log('Raw fetched data:', data);

        const formattedData = data.map(item => ({
          username: item.username,
          reservation_date: formatDate(item.reservation_date),
          tipo_piatti: item.tipo_piatti
        }));

        console.log('Formatted data:', formattedData);
        setData(formattedData);
        console.log('Current data:', data);

        // Extract unique usernames for the dropdown
        const uniqueUsernames = [...new Set(formattedData.map(item => item.username))];
        setUsernames(uniqueUsernames);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData(); // Call the fetch function immediately
  }, [selectedMonth]);

  function formatURL(inputDate) {
    if (!inputDate) {
      return ''; // Return empty string if no date is selected
    }

    const dateObj = new Date(inputDate);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');

    return `${year}-${month}`;
  }

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
      console.log(formatDateFromCalendar(date))
      console.log(filteredData)
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

    setData(filteredData);
  }

  function formatDateForMonth(dateString) {
    const dateObj = new Date(dateString);
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${month}/${year}`;
  }

  function formatDate(dateString) {
    const dateObj = new Date(dateString);
    return new Intl.DateTimeFormat('it-IT').format(dateObj);
  }

  function generatePDF() {
    const doc = new jsPDF();

    // Add title
    doc.text("Filtered Data Report", 20, 10);

    // Add month and username
    const formattedMonth = selectedMonth ? formatDateForMonth(selectedMonth) : "N/A";
    doc.text(`Month: ${formattedMonth}`, 20, 20);
    doc.text(`Username: ${selectedUsername}`, 20, 30);

    // Define table columns
    const tableColumn = ["Nome", "Giorno dell Ordine", "Ordine"];

    // Map the data to table rows
    const tableRows = data.map(item => [
      item.username,
      item.reservation_date,
      item.tipo_piatti,
    ]);

    // Add the table to the PDF
    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 40 });

    // Add total count
    doc.text(`Total Records: ${data.length}`, 20, doc.internal.pageSize.height - 20);

    // Save the PDF
    doc.save(`filtered_data_${selectedUsername}.pdf`);
  }

  const DataTableComponent = ({ data, columns }) => {
    console.log('Rendering DataTableComponent with data:', data);
    return (
      <DataTable className="historic-table" value={data} paginator rows={5} rowsPerPageOptions={[5, 10, 25, 50]}>
        {columns.map((column, index) => (
          <Column key={index} field={column.field} sortable header={column.header} body={column.body}></Column>
        ))}
      </DataTable>
    );
  };

  const handleToggleCalendar = () => {
    setShowDayCalendar(!showDayCalendar);

    if (!showDayCalendar) {
      // Switching to day view, reset month filter
      setSelectedMonth(new Date());
      handleDayChange({value:selectedDate});
      setAllowPDF(false);
    } else {
      // Switching to month view, reset day filter and apply month filter
      setSelectedDate(new Date());
      handleMonthChange({ value: selectedMonth });
      setAllowPDF(true);
    }
  };

  return (
    <div>
      <div className="calendar-view">
        {/* Conditionally render the calendars */}
        {showDayCalendar? (
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

        {/* Toggle Button to switch between calendars */}
        <Button onClick={handleToggleCalendar}>
          {showDayCalendar? 'Switch to Month View' : 'Switch to Day View'}
        </Button>

        {/* Dropdown for username selection */}
        <Dropdown
          value={selectedUsername}
          options={usernames.map(username => ({ label: username, value: username }))}
          onChange={handleUsernameChange}
          placeholder="Select a Username"
          showClear
        />

      </div>

      {isLoading? (
        <p>Loading data...</p>
      ) : (
        <>
          <DataTableComponent data={data} columns={columns}></DataTableComponent>
          
          <Card className="card-total">
            TOTAL: {data.length}
          </Card>

          {/* PDF Generation Button */}
          <Button 
            className="generate-pdf"
            label="Download PDF" 
            icon="pi pi-file-pdf" 
            onClick={generatePDF} 
            disabled={(!selectedUsername && !allowPDF)}
          />
        </>
      )}
    </div>
  );
}
