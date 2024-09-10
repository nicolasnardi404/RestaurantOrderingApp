import React, { useState, useEffect } from 'react';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
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

  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedMonth, viewMode]);

  useEffect(() => {
    filterData();
  }, [data, selectedUsername]);

  useEffect(() => {
    setTotalOrders(filteredData.length);
  }, [filteredData]);

  const fetchData = async () => {
    let url;
    if (viewMode === 'month' && selectedMonth) {
      url = `http://localhost:8080/api/ordine/readByMese/${formatDateforServer(selectedMonth).slice(0, 7)}`;
    } else if (viewMode === 'day' && selectedDate) {
      url = `http://localhost:8080/api/ordine/ordineByDay/${formatDateforServer(selectedDate)}`;
    } else {
      return;
    }

    try {
      const response = await fetch(url);
      const fetchedData = await response.json();
      setData(fetchedData);

      const uniqueUsernames = [...new Set(fetchedData.map(item => item.username))];
      setUsernames(uniqueUsernames.map(username => ({ label: username, value: username })));
    } catch (error) {
      console.error('Error fetching data:', error);
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

  const generatePDF = () => {
    if (!selectedMonth || !selectedUsername) {
      alert('Please select both a month and a user to generate the PDF.');
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
    doc.autoTable({
      startY: 70,
      head: [['Date', 'Type of Dishes']],
      body: filteredData.map(order => [
        formatDateForDisplay(order.reservation_date),
        order.tipo_piatti
      ]),
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [66, 139, 202], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

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
            {viewMode === 'month' ? (
              <Calendar 
                id="datePicker"
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.value)} 
                view="month" 
                dateFormat="mm/yy" 
                showIcon
              />
            ) : (
              <Calendar 
                id="datePicker"
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.value)} 
                dateFormat="dd/mm/yy" 
                showIcon
              />
            )}
          </div>
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
        </Card>

        <Card className="data-card">
          <DataTable 
            value={filteredData} 
            paginator 
            rows={10} 
            className="p-datatable-responsive"
            emptyMessage="Nessun ordine trovato"
          >
            <Column field="username" header="Nome Utente" sortable style={{width:'30%'}}/>
            <Column 
              field="reservation_date" 
              header="Data Prenotazione" 
              body={(rowData) => formatDateForDisplay(rowData.reservation_date)}
              sortable
              style={{width:'30%'}}
            />
            <Column field="tipo_piatti" header="Tipo di Piatti" sortable style={{width:'40%'}}/>
          </DataTable>
        </Card>
      </div>

      <Card className="total-pdf-card">
        <div className="total-orders-section">
          <h3>Total Orders</h3>
          <p className="total-orders">{totalOrders}</p>
        </div>
        <div className="pdf-button-section">
          <Button 
            label="Generate PDF" 
            icon="pi pi-file-pdf" 
            onClick={generatePDF} 
            disabled={!(selectedMonth && selectedUsername)}
            className="p-button-lg btn"
          />
        </div>
        <p>La generazione del PDF è possibile solo quando sono selezionati sia il mese che l'utente</p>
      </Card>
    </div>
  );
};

export default HistoricComponent;
