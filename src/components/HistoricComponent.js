import React, { useState, useEffect } from 'react';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
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

  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedMonth, viewMode]);

  useEffect(() => {
    filterData();
  }, [data, selectedUsername]);

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

  return (
    <div className="historic-container">
      <Card className="filter-card">
        <div className="p-grid p-fluid">
          <div className="p-col-12">
            <h2>Storico Ordini</h2>
          </div>
          <div className="p-col-12 p-md-3">
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
          </div>
          <div className="p-col-12 p-md-9">
            <div className="p-grid p-fluid">
              <div className="p-col-12 p-md-6">
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
              </div>
              <div className="p-col-12 p-md-6">
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
              </div>
            </div>
          </div>
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
          <Column field="username" header="Nome Utente" sortable />
          <Column 
            field="reservation_date" 
            header="Data Prenotazione" 
            body={(rowData) => formatDateForDisplay(rowData.reservation_date)}
            sortable
          />
          {/* Add more columns as needed */}
        </DataTable>
      </Card>
    </div>
  );
};

export default HistoricComponent;
