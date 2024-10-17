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
import * as XLSX from 'xlsx';
import { ScrollTop } from 'primereact/scrolltop';

// Set locale for Calendar
UseDataLocal(ITALIAN_LOCALE_CONFIG);

const isDayInPast = (day, currentMonth, currentYear) => {
  const now = new Date();
  const today = now.getDate();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();

  if (now.getMonth() !== currentMonth || now.getFullYear() !== currentYear) {
    return now > new Date(currentYear, currentMonth, day);
  }

  if (day < today) return true;
  if (day > today) return false;
  // If it's today, return true (past) if it's 10:30 or later
  return currentHour > 10 || (currentHour === 10 && currentMinutes >= 30);
};

const processMonthlyOverviewData = (data) => {
  const monthData = {};
  const usernames = new Set();
  let year, month;

  data.forEach(item => {
    const [, day, monthStr, yearStr] = item.reservation_date.match(/(\d{2})\/(\d{2})\/(\d{2})/);
    const date = new Date(2000 + parseInt(yearStr), parseInt(monthStr) - 1, parseInt(day));
    year = date.getFullYear();
    month = date.getMonth();
    const dayOfMonth = date.getDate();
    usernames.add(item.username);

    if (!monthData[dayOfMonth]) {
      monthData[dayOfMonth] = {};
    }
    monthData[dayOfMonth] = { ...monthData[dayOfMonth], [item.username]: 'X' };
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    isPast: isDayInPast(i + 1, month, year)
  }));

  return {
    days: days,
    users: Array.from(usernames),
    data: monthData,
    month: new Date(year, month).toLocaleString('it-IT', { month: 'long' }),
    year: year
  };
};

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
  const [processedData, setProcessedData] = useState(null);
  const [monthlyOverviewData, setMonthlyOverviewData] = useState(null);
  const apiUrl = process.env.REACT_APP_API_URL;

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
        url = `${apiUrl}/ordine/readByMese/${monthString}`;
      } else if (viewMode === 'day' && selectedDate) {
        const dateString = formatDateforServer(selectedDate);
        url = `${apiUrl}/ordine/ordineByDay/${dateString}`;
      } else {
        return; // Do not fetch if no date is selected
      }
    } else {
      if (viewMode === 'month' && selectedMonth) {
        const monthString = formatDateforServer(selectedMonth).slice(0, 7);
        url = `${apiUrl}/ordine/readByIdAndMese/${monthString}/${user.userId}`;
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
      processData(response.data);
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
    setSelectedUsername(null);
    setShowTotalPerDay(null);
    setFilteredData(null);
    setData(null);
    setUsernames(null);
    setMonthlyOverviewData(false);
    setViewMode(mode);
    setSelectedDate(null); // Reset selected date
    setSelectedMonth(null); // Reset selected month
  };

  // Calculate total orders per day
  const calculateTotalPerDayData = () => {
    const totals = (selectedUsername ? filteredData : data).reduce((acc, order) => {
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
    if (showTotalPerDay && (data.length > 0 || filteredData.length > 0)) {
      calculateTotalPerDayData();
    }
  }, [showTotalPerDay, data, filteredData, selectedUsername]);

  // Modify the generatePDF function to accept a parameter
  const generatePDF = (type) => {
    if (!selectedMonth) {
      alert('Per favore, seleziona un mese per generare il PDF.');
      return;
    }

    const doc = new jsPDF();
    doc.setFont('helvetica');
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Relazione Mensile degli Ordini', 14, 30);

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Utente: ${selectedUsername || 'Tutti'}`, 14, 45);
    doc.text(`Mese: ${selectedMonth.toLocaleString('it-IT', { month: 'long', year: 'numeric' })}`, 14, 52);
    doc.text(`Totale Ordini: ${totalOrders}`, 14, 59);


      doc.autoTable({
        startY: 70,
        head: [['Data', 'Totale Ordini']],
        body: totalPerDayData.map(item => [
          formatDateForDisplay(item.date),
          item.totalOrders
        ]),
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(`Pagina ${i} di ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    doc.save(`${selectedUsername || 'tutti'}_${selectedMonth.getFullYear()}_${selectedMonth.getMonth() + 1}_ordini.pdf`);
  };

  const processData = (data) => {
    const monthData = {};
    const usernames = new Set();
    let year, month;

    data.forEach(item => {
      const date = new Date(item.reservation_date.split(' ')[1]);
      year = date.getFullYear();
      month = date.getMonth();
      const day = date.getDate();
      usernames.add(item.username);

      if (!monthData[day]) {
        monthData[day] = {};
      }
      monthData[day][item.username] = 'X';
    });

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const processedData = {
      days: days,
      users: Array.from(usernames),
      data: monthData,
      month: new Date(year, month).toLocaleString('default', { month: 'long' }),
      year: year
    };

    setProcessedData(processedData);
  };

  useEffect(() => {
    if (data) {
      // Existing data processing
      processData(data);

      // New monthly overview data processing
      const overviewData = processMonthlyOverviewData(data);
      setMonthlyOverviewData(overviewData);
    }
  }, [data]);

  const generateExcel = () => {
    if (!monthlyOverviewData) return;

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([]);

    // Add header row
    XLSX.utils.sheet_add_aoa(ws, [['Utente', ...monthlyOverviewData.days.map(d => d.day), 'Totale']], { origin: 'A1' });

    // Add data rows
    monthlyOverviewData.users.forEach((user, index) => {
      const rowData = [user];
      let userTotal = 0;
      monthlyOverviewData.days.forEach(({ day }) => {
        if (monthlyOverviewData.data[day] && monthlyOverviewData.data[day][user]) {
          rowData.push('X');
          userTotal++;
        } else {
          rowData.push('');
        }
      });
      rowData.push(userTotal); // Add user total
      XLSX.utils.sheet_add_aoa(ws, [rowData], { origin: `A${index + 2}` });
    });

    const monthlyTotalRow = ['Totale del mese'];
    let grandTotal = 0;
    monthlyOverviewData.days.forEach(({ day }) => {
      const dayTotal = monthlyOverviewData.data[day] ? Object.keys(monthlyOverviewData.data[day]).length : 0;
      grandTotal += dayTotal;
      monthlyTotalRow.push(dayTotal);
    });
    monthlyTotalRow.push(grandTotal); // Add grand total
    XLSX.utils.sheet_add_aoa(ws, [monthlyTotalRow], { origin: `A${monthlyOverviewData.users.length + 2}` });

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Overview');

    // Generate Excel file
    XLSX.writeFile(wb, `panoramica_mensile_${monthlyOverviewData.month}_${monthlyOverviewData.year}.xlsx`);
  };


  const isDateInPast = (dateString) => {
    const now = new Date();
    const [, datePart] = dateString.split(' ');
    const [day, month, year] = datePart.split('/');
    
    // Create date using the full year (assuming 20xx for the year)
    const reservationDate = new Date(2000 + parseInt(year), parseInt(month) - 1, parseInt(day));
    
    if (isNaN(reservationDate.getTime())) {
      console.error('Invalid date:', dateString);
      return false; // Treat invalid dates as future dates
    }

    if (reservationDate.toDateString() === now.toDateString()) {
      // For the current day, check if it's before or after 10:30
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const cutoffTime = 10 * 60 + 30; // 10:30
      return currentTime >= cutoffTime;
    }

    return reservationDate < now;
  };

  const rowClassName = (rowData) => {
    return isDateInPast(rowData.reservation_date) ? '' : 'future-date';
  };

  return (
    <div className="historic-container">
      <div className="card-row">
        <Card className="filter-card">
          {isAdmin && (
            <>
              <h2>Storico Ordini</h2>
            </>
          )}
          {isAdmin ? (
            // Admin view - keep it as is
            <>
              <div className="p-field">
                <div className="p-buttonset">
                  <label>Visualizzazione</label>
                  <div className='mesi-giorni'>
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
                <div className='data-picker'>
                  <label className='label-data-picker' htmlFor="datePicker">{viewMode === 'month' ? 'Seleziona Mese' : 'Seleziona Giorno'}</label>
                  <Calendar
                    id="datePicker"
                    value={viewMode === 'month' ? selectedMonth : selectedDate}
                    onChange={(e) => viewMode === 'month' ? setSelectedMonth(e.value) : setSelectedDate(e.value)}
                    view={viewMode === 'month' ? "month" : "date"}
                    locale="it"
                    dateFormat={viewMode === 'month' ? "M. mm/yy" : "D. dd/mm/y"}
                  />
                </div>
              
                {(selectedDate || selectedMonth) && (
                  <div className='total-per-day'>
                    <Button
                      label={showTotalPerDay ? 'Cambia per dettaglio' : 'Cambia per totale'}
                      onClick={() => setShowTotalPerDay(!showTotalPerDay)}
                      className="p-button-primary"
                    />
                  </div>
                )}
                {usernames && isAdmin && (
                  <div className="total-per-day">
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
           {isAdmin && monthlyOverviewData && (
        <div className="total-pdf-card" id="rapporto-amministrazione">
          <div className="pdf-button-section">
            <Button
              label={selectedUsername ? `Genera PDF totali del mese di ${selectedUsername}` : 'Genera PDF totali del mese per tutti '}
              icon="pi pi-file-pdf"
              onClick={() => generatePDF('daily')}
            />

            <Button label={`Panoramica Mensile di ${monthlyOverviewData.month} ${monthlyOverviewData.year}`} icon="pi pi-download" onClick={generateExcel} className="p-mt-3" />
          </div>
        </div>
      )
      }
        </Card>

        {/* Display of data: different tables for total per day or filtered data */}
        <Card className="data-card">
          {showTotalPerDay ? (
            <DataTable
              value={totalPerDayData}
              className="p-datatable-responsive"
              emptyMessage="Nessun ordine trovato"
            >
              <Column
                field="date"
                header="Data" // Changed to Italian
                body={(rowData) => rowData.date}
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
            
              className="p-datatable-responsive"
              emptyMessage="Nessun ordine trovato"
              rowClassName={rowClassName}
            >
              {isAdmin && (
                <Column
                  field="username"
                  header="Nome Utente"
                  sortable
                />
              )}
              <Column
                field="reservation_date"
                header="Data Prenotazione"
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
      </div >

      {monthlyOverviewData && (
        <Card className="data-card">
          <h3>Panoramica Mensile - {monthlyOverviewData.month} {monthlyOverviewData.year}</h3>
          <table className="monthly-table">
            <thead>
              <tr>
                <th>Utente</th>
                {monthlyOverviewData.days.map(({ day }) => (
                  <th key={day}>
                    {day}
                  </th>
                ))}
                <th>Totale</th>
              </tr>
            </thead>
            <tbody>
              {monthlyOverviewData.users.map(user => (
                <tr key={user}>
                  <td>{user}</td>
                  {monthlyOverviewData.days.map(({ day, isPast }) => (
                    <td key={day}>
                      {monthlyOverviewData.data[day] && monthlyOverviewData.data[day][user] ? (
                        <span style={!isPast ? { color: 'red', fontWeight: 'bold' } : { fontWeight: 'bold' }}>X</span>
                      ) : ''}
                    </td>
                  ))}
                  <td>
                    {monthlyOverviewData.days.filter(({ day }) =>
                      monthlyOverviewData.data[day] && monthlyOverviewData.data[day][user]
                    ).length}
                  </td>
                </tr>
              ))}
              <tr>
                <td>Totale per giorno</td>
                {monthlyOverviewData.days.map(({ day }) => (
                  <td key={day}>
                    {monthlyOverviewData.data[day] ? Object.keys(monthlyOverviewData.data[day]).length : 0}
                  </td>
                ))}
                <td className="grand-total total-orders">
                  {monthlyOverviewData.days.reduce((total, { day }) =>
                    total + (monthlyOverviewData.data[day] ? Object.keys(monthlyOverviewData.data[day]).length : 0), 0
                  )}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="total-orders-section">
            <h3>&nbsp;Totale Ordini:&nbsp;</h3>
            <h3 className="total-orders">{showTotalPerDay ? totalPerDayData.reduce((sum, item) => sum + item.totalOrders, 0) : totalOrders}</h3>
          </div>
        </Card>
      )}
      <ScrollTop />
    </div >
  );
}

export default HistoricComponent;

// Add this CSS to your stylesheet (e.g., HistoricComponent.css)
/*
.future-date {
  color: green;
  font-weight: bold;
}
*/
