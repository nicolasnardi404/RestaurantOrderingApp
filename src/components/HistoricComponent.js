import React, { useState, useEffect } from 'react';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { InputSwitch } from 'primereact/inputswitch';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import formatDateforServer from '../util/formatDateForServer';
import { ITALIAN_LOCALE_CONFIG } from '../util/ItalianLocaleConfigData';
import { UseDataLocal } from '../util/UseDataLocal';
import '../HistoricComponent.css';

// Set locale for Calendar
UseDataLocal(ITALIAN_LOCALE_CONFIG);

const HistoricComponent = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedUsername, setSelectedUsername] = useState('');
  const [usernames, setUsernames] = useState([]);
  const [viewMode, setViewMode] = useState('month');
  const [totalOrders, setTotalOrders] = useState(0);
  const [showTotalPerDay, setShowTotalPerDay] = useState(false);
  const [totalPerDayData, setTotalPerDayData] = useState([]);

  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedMonth, viewMode]);

  useEffect(() => {
    filterData();
  }, [data, selectedUsername]);

  useEffect(() => {
    setTotalOrders(filteredData.length);
  }, [filteredData]);

  useEffect(() => {
    if (showTotalPerDay && data.length > 0) {
      calculateTotalPerDayData();
    }
  }, [showTotalPerDay, data]);

  const fetchData = async () => {
    let url;
    if (viewMode === 'month' && selectedMonth) {
      const monthString = formatDateforServer(selectedMonth).slice(0, 7);
      url = `http://localhost:8080/api/ordine/readByMese/${monthString}`;
    } else if (viewMode === 'day' && selectedDate) {
      const dateString = formatDateforServer(selectedDate);
      url = `http://localhost:8080/api/ordine/ordineByDay/${dateString}`;
    } else {
      return; // Don't fetch if no date is selected
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const fetchedData = await response.json();
      setData(fetchedData);

      const uniqueUsernames = [...new Set(fetchedData.map(item => item.username))];
      setUsernames(uniqueUsernames.map(username => ({ label: username, value: username })));
    } catch (error) {
      console.error('Error fetching data:', error);
      // Handle error (e.g., show an error message to the user)
    }
  };

  const filterData = () => {
    if (selectedUsername) {
      setFilteredData(data.filter(item => item.username === selectedUsername));
    } else {
      setFilteredData(data);
    }
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setSelectedDate(null);
    setSelectedMonth(null);
    setSelectedUsername('');
  };

  const formatDateForDisplay = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleString('it-IT', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateTotalPerDayData = () => {
    const totals = data.reduce((acc, order) => {
      const date = order.reservation_date.split('T')[0]; // Get only the date part
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date]++;
      return acc;
    }, {});

    const totalPerDayArray = Object.entries(totals).map(([date, totalOrders]) => ({
      date,
      totalOrders
    }));

    setTotalPerDayData(totalPerDayArray.sort((a, b) => a.date.localeCompare(b.date)));
  };

  const generatePDF = () => {
    if (!selectedMonth) {
      alert('Please select a month to generate the PDF.');
      return;
    }

    const doc = new jsPDF();

    // Add logo (replace with your actual logo)
    // doc.addImage(logoUrl, 'PNG', 14, 10, 50, 25);

    // Set font
    doc.setFont('helvetica');

    // Add title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Monthly Order Report', 14, 30);

    // Add report info
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`User: ${selectedUsername}`, 14, 45);
    doc.text(`Month: ${selectedMonth.toLocaleString('it-IT', { month: 'long', year: 'numeric' })}`, 14, 52);
    doc.text(`Total Orders: ${totalOrders}`, 14, 59);

    // Add table
    if (showTotalPerDay) {
      doc.autoTable({
        startY: 70,
        head: [['Date', 'Total Orders']],
        body: totalPerDayData.map(item => [
          formatDateForDisplay(item.date).split(',')[0], // Only date part
          item.totalOrders
        ]),
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });
    } else {
      doc.autoTable({
        startY: 70,
        head: [['Date', 'Type of Dishes']],
        body: filteredData.map(order => [
          formatDateForDisplay(order.reservation_date),
          order.piatti
        ]),
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });
    }

    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    // Save the PDF
    doc.save(`${selectedUsername}_${selectedMonth.getFullYear()}_${selectedMonth.getMonth() + 1}_orders.pdf`);
  };

  // Add this console log to check the data
  console.log('showTotalPerDay:', showTotalPerDay);
  console.log('totalPerDayData:', totalPerDayData);
  console.log('filteredData:', filteredData);

  return (
    <div className="historic-container">
      <div className="card-row">
        <Card className="filter-card">
          <h2>Storico Ordini</h2>
          <div className="p-field">
            <label>Visualizzazione</label>
            <div className="p-buttonset">
              <Button 
                label="Mese" 
                onClick={() => handleViewModeChange('month')} 
                className={viewMode === 'month' ? 'p-button-primary' : 'p-button-secondary'}
              />
              <Button 
                label="Giorno" 
                onClick={() => handleViewModeChange('day')} 
                className={viewMode === 'day' ? 'p-button-primary' : 'p-button-secondary'}
              />
            </div>
          </div>
          <div className="p-field">
            <label htmlFor="datePicker">{viewMode === 'month' ? 'Seleziona Mese' : 'Seleziona Giorno'}</label>
            <Calendar 
              id="datePicker"
              value={viewMode === 'month' ? selectedMonth : selectedDate} 
              onChange={(e) => viewMode === 'month' ? setSelectedMonth(e.value) : setSelectedDate(e.value)} 
              view={viewMode === 'month' ? "month" : "date"}
              dateFormat={viewMode === 'month' ? "mm/yy" : "dd/mm/yy"}
              showIcon
            />
          </div>
          <div className="p-field">
            <label htmlFor="totalPerDaySwitch">Mostra totale per giorno</label>
            <InputSwitch
              id="totalPerDaySwitch"
              checked={showTotalPerDay}
              onChange={(e) => setShowTotalPerDay(e.value)}
            />
          </div>
          {!showTotalPerDay && (
            <div className="p-field">
              <label htmlFor="userDropdown">Seleziona Utente</label>
              <Dropdown
                id="userDropdown"
                value={selectedUsername}
                options={usernames}
                onChange={(e) => setSelectedUsername(e.value)}
                placeholder="Tutti gli utenti"
              />
            </div>
          )}
        </Card>

        <Card className="data-card">
        {showTotalPerDay ? (
          <DataTable 
            value={totalPerDayData} 
            paginator 
            rows={10} 
            className="p-datatable-responsive"
            emptyMessage="Nessun ordine trovato"
          >
            <Column 
              field="date" 
              header="Data" 
              body={(rowData) => formatDateForDisplay(rowData.date)}
              sortable 
            />
            <Column 
              field="totalOrders" 
              header="Totale Ordini" 
              sortable 
            />
          </DataTable>
           ) : (
            <DataTable 
              value={filteredData} 
              paginator 
              rows={10} 
              className="p-datatable-responsive"
              emptyMessage="Nessun ordine trovato"
            >
              <Column 
                field="username" 
                header="Nome Utente" 
                sortable 
              />
              <Column 
                field="reservation_date" 
                header="Data Prenotazione" 
                body={(rowData) => formatDateForDisplay(rowData.reservation_date)}
                sortable
              />
              <Column 
                field="piatti" 
                header="Tipo di Piatti" 
                sortable 
              />
            </DataTable>
          )}
        </Card>
      </div>

      <Card className="total-pdf-card">
        <div className="total-orders-section">
          <h3>Total Orders</h3>
          <p className="total-orders">{showTotalPerDay ? totalPerDayData.reduce((sum, item) => sum + item.totalOrders, 0) : totalOrders}</p>
        </div>
        <div className="pdf-button-section">
          <Button 
            label="Generate PDF" 
            icon="pi pi-file-pdf" 
            onClick={generatePDF} 
            disabled={!selectedMonth || (!showTotalPerDay && !selectedUsername)}
            className="p-button-lg btn"
          />
        </div>
        <p>
          {showTotalPerDay 
            ? "La generazione del PDF è possibile solo quando è selezionato il mese" 
            : "La generazione del PDF è possibile solo quando sono selezionati sia il mese che l'utente"}
        </p>
      </Card>
    </div>
  );
};

export default HistoricComponent;
