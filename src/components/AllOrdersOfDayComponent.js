import React, { useState, useEffect } from 'react';
import { Calendar } from 'primereact/calendar';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { UseDataLocal } from '../util/UseDataLocal';
import { ITALIAN_LOCALE_CONFIG } from '../util/ItalianLocaleConfigData';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import '../styles/AllOrderOfDayComponent.css';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import { formatCalendarData } from '../util/FormatCalendarData';

UseDataLocal(ITALIAN_LOCALE_CONFIG);

const AllOrderOfDayComponent = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyOrders, setDailyOrders] = useState([]);
  const [dailySummary, setDailySummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, getToken } = useAuth(); // Use the useAuth hook to get the getToken function
  const role = user.ruolo;

  useEffect(() => {
    fetchDailyOrders(selectedDate);
    fetchDailySummary(selectedDate);
  }, [selectedDate]);

  const fetchDailyOrders = async (date) => {
    setLoading(true);
    try {
      const dateString = formatCalendarData(date);
      const token = getToken(); // Get the token
      const response = await axios.get(`http://localhost:8080/api/ordine/ordineByDay/${dateString}`, {
        headers: {
          Authorization: `Bearer ${token}` // Add the token to the request headers
        }
      });
      setDailyOrders(response.data);
    } catch (error) {
      console.error('Error fetching daily orders:', error);
      setDailyOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailySummary = async (date) => {
    setLoading(true);
    if (role === 'Amministratore') {
      try {
        const dateString = formatCalendarData(date);
        const token = getToken();
        const response = await axios.get(`http://localhost:8080/api/ordine/totalPiattoByDay/${dateString}`, {
          headers: {
            Authorization: `Bearer ${token}` // Add the token to the request headers
          }
        });
        setDailySummary(response.data);
      } catch (error) {
        console.error('Error fetching daily summary:', error);
        setDailySummary([]);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.value);
  };

  const formatDateForDisplay = (date) => {
    return date.toLocaleDateString('it-IT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Daily Order Report', 14, 20);

    // Add report info
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Date: ${formatDateForDisplay(selectedDate)}`, 14, 30);
    doc.text(`Total Orders: ${dailyOrders.length}`, 14, 37);

    // Add detailed orders table
    const detailedOrdersBody = dailyOrders.map(order => [order.username, order.piatti, order.observazioni]);

    doc.autoTable({
      startY: 45,
      head: [['User', 'Dishes Ordered', 'Observazioni']],
      body: detailedOrdersBody,
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [52, 152, 219], textColor: 255 }, // Use #3498db
      alternateRowStyles: { fillColor: [220, 220, 220] },
    });

    // Update startY for summary table
    const summaryTableStartY = doc.autoTable.previous.finalY + 10; // Adding space after detailed orders

    // Add summary table
    const summaryTableBody = [];

    dailySummary.forEach(entry => {
      entry.piatti.forEach((piatto, piattoIndex) => {
        if (piattoIndex === 0) {
          // Adding the "tipo_piatto" and "quantita_totale" row
          summaryTableBody.push([entry.tipo_piatto, entry.tipo_quantita, '', '']);
          // Adding the dish and quantity for the first piatto
          summaryTableBody.push(['', '', piatto.nome, piatto.quantita]);
        } else {
          // Adding subsequent piatti rows without the tipo_piatto and quantita_totale
          summaryTableBody.push(['', '', piatto.nome, piatto.quantita]);
        }
      });
    });

    // Draw the summary table with conditional row styles
    doc.autoTable({
      startY: summaryTableStartY,
      head: [['Tipo di Piatto', 'Quantità Totale', 'Nome del Piatto', 'Quantità']],
      body: summaryTableBody,
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [52, 152, 219], textColor: 255 }, // Use #3498db
      rowStyles: (row, data) => {
        // Check if it's a "tipo_piatto" row (not empty in first column)
        if (row.data[0] !== '') {
          return { fillColor: [220, 220, 220] }; // Changed to (220, 220, 220)
        }
        return { fillColor: [255, 255, 255] }; // White for the piatto rows
      },
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

    // Save the PDF with the date in the filename
    const fileName = `DailyOrderReport_${formatCalendarData(selectedDate)}.pdf`;
    doc.save(fileName);
  };

  const DisplayData = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // getMonth() returns 0 for January
    const day = String(date.getDate()).padStart(2, "0");
    return `${day}-${month}-${year}`;
  }

  return (
    <div className="all-order-of-day">
      <h1>Elenco degli ordini del giorno</h1>
      <div className="date-selector">
        <Calendar
          value={selectedDate}
          onChange={handleDateChange}
          dateFormat="dd/mm/yy"
          showIcon
        />
      </div>

      <Card title={`Ordini Dettagliati per ${DisplayData(selectedDate)}`} className="details-card">
        <DataTable
          value={dailyOrders}
          paginator
          rows={10}
          loading={loading}
          emptyMessage="No orders for this day."
          className="p-datatable-responsive"
        >
          <Column field="username" header="User" sortable />
          <Column field="piatti" header="Dishes Ordered" sortable />
          <Column field="observazioni" header="Observazioni" sortable />
        </DataTable>
      </Card>

      {role === 'Amministratore' && (
        <Card title={`Riepilogo per ${DisplayData(selectedDate)}`} className="summary-card">
          <div>
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Tipo di Piatto</th>
                  <th>Quantità Totale</th>
                  <th>Nome del Piatto</th>
                  <th>Quantità</th>
                </tr>
              </thead>
              <tbody>
                {dailySummary.map((entry, index) => (
                  entry.piatti.map((piatto, piattoIndex) => (
                    <tr key={`${index}-${piattoIndex}`}>
                      {piattoIndex === 0 && (
                        <>
                          <td rowSpan={entry.piatti.length}>{entry.tipo_piatto}</td>
                          <td rowSpan={entry.piatti.length}>{entry.tipo_quantita}</td>
                        </>
                      )}
                      <td>{piatto.nome}</td>
                      <td>{piatto.quantita}</td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {role === 'Amministratore' && (
        <div className="pdf-button-section">
          <Button
            label="Generate PDF"
            icon="pi pi-file-pdf"
            onClick={generatePDF}
            className="p-button-lg btn"
          />
        </div>
      )}
    </div>
  );
};

export default AllOrderOfDayComponent;