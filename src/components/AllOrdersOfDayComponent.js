import React, { useState, useEffect } from 'react';
import { Calendar } from 'primereact/calendar';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import '../styles/AllOrderOfDayComponent.css';
import { useAuth } from '../context/AuthContext'; // Import useAuth

const AllOrderOfDayComponent = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyOrders, setDailyOrders] = useState([]);
  const [dailySummary, setDailySummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user , getToken } = useAuth(); // Use the useAuth hook to get the getToken function
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    fetchDailyOrders(selectedDate);
    fetchDailySummary(selectedDate);
    const role = user.ruolo;
    setUserRole(role);
  }, [selectedDate]);

  const fetchDailyOrders = async (date) => {
    setLoading(true);
    try {
      const dateString = formatDateForServer(date);
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
    try {
      const dateString = formatDateForServer(date);
      const token = getToken(); // Get the token
      const response = await axios.get(`http://localhost:8080/api/ordine/totalPiattoByDay/${dateString}`, {
        headers: {
          Authorization: `Bearer ${token}` // Add the token to the request headers
        }
      });
      console.log('Daily summary:', response.data);
      setDailySummary(response.data);
    } catch (error) {
      console.error('Error fetching daily summary:', error);
      setDailySummary([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.value);
  };

  const formatDateForServer = (date) => {
    return date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
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

    // Add summary table
    doc.autoTable({
      startY: 45,
      head: [['Dish Name', 'Quantity']],
      body: dailySummary.map(item => [item.nome, item.quantita]),
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

    // Save the PDF with the date in the filename
    const fileName = `DailyOrderReport_${formatDateForServer(selectedDate)}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="all-order-of-day">
      <h2>Daily Order Summary</h2>
      <div className="date-selector">
        <Calendar
          value={selectedDate}
          onChange={handleDateChange}
          dateFormat="dd/mm/yy"
          showIcon
        />
      </div>
      {userRole === 'Amministratore' && (
        <Card title={`Summary for ${selectedDate.toLocaleDateString()}`} className="summary-card">
          <DataTable
            value={dailySummary}
            paginator
            rows={10}
            loading={loading}
            emptyMessage="No orders for this day."
            className="p-datatable-responsive"
          >
            <Column field="nome" header="Dish Name" sortable />
            <Column field="quantita" header="Quantity" sortable />
          </DataTable>
        </Card>
      )}
      <Card title={`Detailed Orders for ${selectedDate.toLocaleDateString()}`} className="details-card">
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
        </DataTable>
      </Card>
      {userRole === 'Amministratore' && (
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