import React, { useState, useEffect } from 'react';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
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
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedUsername, setSelectedUsername] = useState('');
  const [usernames, setUsernames] = useState([]);
  const [viewMode, setViewMode] = useState('month');
  const [totalOrders, setTotalOrders] = useState(0);
  const [showTotalPerDay, setShowTotalPerDay] = useState(false);
  const [totalPerDayData, setTotalPerDayData] = useState([]);
  const ruolo = localStorage.getItem('ruolo');
  const [isAdmin, setAdmin] = useState(false);
  const { getToken } = useAuth();

  // Corrige para definir `isAdmin` corretamente
  useEffect(() => {
    if (ruolo === "Amministratore") {
      setAdmin(true);
    }
  }, [ruolo]);

  const fetchData = async () => {
    let url;
    const token = getToken();
    const currentUsername = localStorage.getItem('nome');

    if (ruolo === "Amministratore") {
      if (viewMode === 'month' && selectedMonth) {
        const monthString = formatDateforServer(selectedMonth).slice(0, 7);
        url = `http://localhost:8080/api/ordine/readByMese/${monthString}`;
      } else if (viewMode === 'day' && selectedDate) {
        const dateString = formatDateforServer(selectedDate);
        url = `http://localhost:8080/api/ordine/ordineByDay/${dateString}`;
      } else {
        return; // Não busca se nenhuma data for selecionada
      }
    } else {
      if (viewMode === 'month' && selectedMonth) {
        const monthString = formatDateforServer(selectedMonth).slice(0, 7);
        url = `http://localhost:8080/api/ordine/readByMese/${monthString}`;
      } else {
        return; // Não busca se nenhuma data for selecionada
      }
    }

    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!isAdmin) {
        setFilteredData(response.data.filter(item => item.username === currentUsername));
        console.log(filteredData);
        setData(filteredData);
      }
      if (isAdmin) {
        setData(filteredData);
        const uniqueUsernames = [...new Set(filteredData.map(item => item.username))];
        setUsernames(uniqueUsernames.map(username => ({ label: username, value: username })));
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  };


  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedMonth, viewMode]);

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
    setViewMode(mode);
    setSelectedDate(null); // Reseta a data selecionada
    setSelectedMonth(null); // Reseta o mês selecionado
  };

  // Calcula total de pedidos por dia
  const calculateTotalPerDayData = () => {
    const totals = data.reduce((acc, order) => {
      const date = order.reservation_date.split('T')[0]; // Obtém apenas a data
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

  // Gera o PDF
  const generatePDF = () => {
    if (!selectedMonth) {
      alert('Por favor, selecione um mês para gerar o PDF.');
      return;
    }

    const doc = new jsPDF();
    doc.setFont('helvetica');
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Relatório Mensal de Pedidos', 14, 30);

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Usuário: ${selectedUsername || 'Todos'}`, 14, 45);
    doc.text(`Mês: ${selectedMonth.toLocaleString('it-IT', { month: 'long', year: 'numeric' })}`, 14, 52);
    doc.text(`Total de Pedidos: ${totalOrders}`, 14, 59);

    if (showTotalPerDay) {
      doc.autoTable({
        startY: 70,
        head: [['Data', 'Total de Pedidos']],
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
        head: [['Data', 'Tipo de Pratos']],
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
      doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    doc.save(`${selectedUsername || 'todos'}_${selectedMonth.getFullYear()}_${selectedMonth.getMonth() + 1}_pedidos.pdf`);
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
              {/* O botão "Giorno" só aparece para o administrador */}
              {isAdmin && (
                <Button
                  label="Giorno"
                  onClick={() => handleViewModeChange('day')}
                  className={viewMode === 'day' ? 'p-button-primary' : 'p-button-secondary'}
                />
              )}
            </div>
          </div>

          {/* O Dipendente só pode selecionar o mês, o admin pode selecionar o mês ou dia */}
          <div className="p-field">
            <label htmlFor="datePicker">{viewMode === 'month' ? 'Seleziona Mese' : 'Seleziona Giorno'}</label>
            <Calendar
              id="datePicker"
              value={viewMode === 'month' ? selectedMonth : selectedDate}
              onChange={(e) => viewMode === 'month' ? setSelectedMonth(e.value) : setSelectedDate(e.value)}
              view={viewMode === 'month' ? "month" : "date"}
              dateFormat={viewMode === 'month' ? "mm/yy" : "dd/mm/yy"}
              showIcon
              disabled={!isAdmin && viewMode === 'day'} // Desabilita o campo de dia para o Dipendente
            />
          </div>

          {/* O botão de InputSwitch é visível para ambos */}
          {isAdmin && (
            < div className="p-field">
              <label htmlFor="totalPerDaySwitch">Mostra totale per giorno</label>
              <InputSwitch
                id="totalPerDaySwitch"
                checked={showTotalPerDay}
                onChange={(e) => setShowTotalPerDay(e.value)}
              />
            </div>
          )}

          {/* O dropdown de usuários é exibido apenas para o administrador */}
          {!showTotalPerDay && isAdmin && (
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

        {/* Exibição dos dados: tabelas diferentes para total por dia ou dados filtrados */}
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
              {/* Exibição de dados diferente para admin e dipendente */}
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
      </div >

      {/* O card com o total e o botão de gerar PDF será visível apenas para o administrador */}
      {
        isAdmin && (
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
        )
      }
    </div >
  );
}

export default HistoricComponent;
