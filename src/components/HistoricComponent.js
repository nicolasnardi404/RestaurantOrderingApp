import React, { useState, useEffect } from 'react';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import '../util/addLocale';
import { InputSwitch } from 'primereact/inputswitch';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import formatDateforServer from '../util/formatDateForServer';
import { ITALIAN_LOCALE_CONFIG } from '../util/ItalianLocaleConfigData';
import { UseDataLocal } from '../util/UseDataLocal';
import { useAuth } from '../context/AuthContext';
import '../styles/HistoricComponent.css';

// Set locale for Calendar
UseDataLocal(ITALIAN_LOCALE_CONFIG);

const HistoricComponent = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedUsername, setSelectedUsername] = useState('');
  const [usernames, setUsernames] = useState([]);
  const [viewMode, setViewMode] = useState('month');
  const [totalOrders, setTotalOrders] = useState(0);
  const [showTotalPerDay, setShowTotalPerDay] = useState(false);
  const [totalPerDayData, setTotalPerDayData] = useState([]);
  const [isAdmin, setAdmin] = useState(false);
  const { user, getToken } = useAuth();
  const ruolo = user.ruolo;

  useEffect(() => {
    if (ruolo === "Amministratore") {
      setAdmin(true);
    }
  }, [ruolo]);

  const fetchData = async () => {
    let url;
    const token = getToken();

    if (ruolo === "Amministratore") {
      if (viewMode === 'month' && selectedMonth) {
        const monthString = formatDateforServer(selectedMonth).slice(0, 7);
        url = `http://localhost:8080/api/ordine/readByMese/${monthString}`;
        console.log(monthString)
      } else if (viewMode === 'day' && selectedDate) {
        const dateString = formatDateforServer(selectedDate);
        url = `http://localhost:8080/api/ordine/ordineByDay/${dateString}`;
      } else {
        return; // Do not fetch if no date is selected
      }
    } else {
      if (viewMode === 'month' && selectedMonth) {
        const monthString = formatDateforServer(selectedMonth).slice(0, 7);
        url = `http://localhost:8080/api/ordine/readByIdAndMese/${monthString}/${user.userId}`;
      } else {
        return; // Do not fetch if no date is selected
      }
    }

    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
      const uniqueUsernames = [...new Set(response.data.map(item => item.username))];
      setUsernames(uniqueUsernames.map(username => ({ label: username, value: username })));
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedMonth, viewMode]);

  useEffect(() => {
    if (data) {
      setTotalOrders(data.length);
    }
  }, [data]);

  const filterData = () => {
    if (selectedUsername) {
      setFilteredData(data.filter(item => item.username === selectedUsername));
    } else {
      setFilteredData(data);
    }
  };

  useEffect(() => {
    filterData();
  }, [data, selectedUsername]);

  useEffect(() => {
    if (filteredData) {
      setTotalOrders(filteredData.length);
    }
  }, [filteredData]);

  const formatDateForDisplay = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('it-IT', options);
  };

  const handleViewModeChange = (mode) => {
    setFilteredData(null);
    setData(null);
    setUsernames(null);
    setViewMode(mode);
    setSelectedDate(null); // Reset selected date
    setSelectedMonth(null); // Reset selected month
  };

  // Calculate total orders per day
  const calculateTotalPerDayData = () => {
    const totals = data.reduce((acc, order) => {
      const date = order.reservation_date.split('T')[0]; // Get only the date
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

  useEffect(() => {
    if (showTotalPerDay && data.length > 0) {
      calculateTotalPerDayData();
    }
  }, [showTotalPerDay, data]);

  // Generate PDF
  const generatePDF = () => {
    if (!selectedMonth) {
      alert('Per favore, seleziona un mese per generare il PDF.');
      return;
    }

    const doc = new jsPDF();
    doc.setFont('helvetica');
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Relazione Mensile degli Ordini', 14, 30); // Changed to Italian

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Utente: ${selectedUsername || 'Tutti'}`, 14, 45); // Changed to Italian
    doc.text(`Mese: ${selectedMonth.toLocaleString('it-IT', { month: 'long', year: 'numeric' })}`, 14, 52);
    doc.text(`Totale Ordini: ${totalOrders}`, 14, 59); // Changed to Italian

    if (showTotalPerDay) {
      doc.autoTable({
        startY: 70,
        head: [['Data', 'Totale Ordini']], // Changed to Italian
        body: totalPerDayData.map(item => [
          formatDateForDisplay(item.date).split(',')[0],
          item.totalOrders
        ]),
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });
    } else {
      doc.autoTable({
        startY: 70,
        head: [['Data', 'Tipo di Piatti']], // Changed to Italian
        body: filteredData.map(order => [
          formatDateForDisplay(order.reservation_date),
          order.piatti
        ]),
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });
    }

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(`Pagina ${i} di ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' }); // Changed to Italian
    }

    doc.save(`${selectedUsername || 'tutti'}_${selectedMonth.getFullYear()}_${selectedMonth.getMonth() + 1}_ordini.pdf`); // Changed to Italian
  };

  return (
    <div className="historic-container">
      <div className="card-row">
        <Card className="filter-card">
          {isAdmin ? (
            // Admin view - keep it as is
            <>
            <h2>Storico Ordini</h2>
              <div className="view-mode-section">
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
                    locale="it"
                    dateFormat={viewMode === 'month' ? "M. mm/yy" : "D. dd/mm/y"}
                  />
                </div>
              </div>
              <div className="input-switch-section">
                <div className="p-field">
                  <label htmlFor="totalPerDaySwitch">Mostra totale per giorno</label>
                  <InputSwitch
                    id="totalPerDaySwitch"
                    checked={showTotalPerDay}
                    onChange={(e) => setShowTotalPerDay(e.value)}
                  />
                </div>
                {usernames && isAdmin && (
                  <div className="p-field">
                    <label htmlFor="userDropdown">Seleziona Utente</label>
                    <Dropdown
                      id="userDropdown"
                      value={selectedUsername}
                      options={usernames}
                      onChange={(e) => setSelectedUsername(e.value)}
                      placeholder="Tutti gli utenti"
                      showClear
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            // User view - only calendar
            <div className="user-view-section">
              <h2>Storico Ordini</h2>
              <div className="p-field">
                <label htmlFor="datePicker">Seleziona Mese</label>
                <Calendar
                  id="datePicker"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.value)}
                  view="month"
                  locale="it"
                  dateFormat="mm/yy"
                />
              </div>
            </div>
          )}
        </Card>

        {/* Display of data: different tables for total per day or filtered data */}
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
                header="Data" // Changed to Italian
                body={(rowData) => formatDateForDisplay(rowData.date)}
                sortable
              />
              <Column
                field="totalOrders"
                header="Totale Ordini" // Changed to Italian
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
              {/* Display of data different for admin and employee */}
              {isAdmin && (
                <Column
                  field="username"
                  header="Nome Utente" // Changed to Italian
                  sortable
                />
              )}
              <Column
                field="reservation_date"
                header="Data Prenotazione" // Changed to Italian
                body={(rowData) => rowData.reservation_date}
                sortable
              />
              <Column
                field="piatti"
                header="Tipo di Piatti" // Changed to Italian
                sortable
              />
            </DataTable>
          )}
        </Card>
      </div >

      {/* The card with the total and the PDF generation button will be visible only for the administrator */}
      {
        isAdmin && (
          <Card className="total-pdf-card">
            <div className="total-orders-section">
              <h3>Totale Ordini</h3> {/* Changed to Italian */}
              <p className="total-orders">{showTotalPerDay ? totalPerDayData.reduce((sum, item) => sum + item.totalOrders, 0) : totalOrders}</p>
            </div>
            <div className="pdf-button-section">
              <Button
                label="Genera PDF" // Changed to Italian
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
        )
      }
    </div >
  );
}

export default HistoricComponent;