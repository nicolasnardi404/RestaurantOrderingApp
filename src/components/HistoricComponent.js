import React, { useState, useEffect } from 'react';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import jsPDF from 'jspdf';
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
    return date.toLocaleDateString('it-IT', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  const generatePDF = () => {
    if (!selectedMonth || !selectedUsername) {
      alert('Please select both a month and a user to generate the PDF.');
      return;
    }

    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Monthly Order Report', 20, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`User: ${selectedUsername}`, 20, 30);
    doc.text(`Month: ${selectedMonth.toLocaleString('it-IT', { month: 'long', year: 'numeric' })}`, 20, 40);
    doc.text(`Total Orders: ${totalOrders}`, 20, 50);

    doc.setFontSize(10);
    let yPos = 70;
    filteredData.forEach((order, index) => {
      doc.text(`${index + 1}. Date: ${formatDateForDisplay(order.reservation_date)}`, 20, yPos);
      yPos += 10;
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
    });

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
            />
            <Column field="tipo_piatti" header="Tipo di Piatti" sortable style={{width:'40%'}}/>
          </DataTable>
        </Card>
        <Card className="total-orders-card">
          <h3>Total Orders</h3>
          <p className="total-orders">{totalOrders}</p>
          <Button 
            label="Generate PDF" 
            icon="pi pi-file-pdf" 
            onClick={generatePDF} 
            disabled={!(selectedMonth && selectedUsername)}
          />
        </Card>
      </div>
    </div>
  );
};

export default HistoricComponent;
