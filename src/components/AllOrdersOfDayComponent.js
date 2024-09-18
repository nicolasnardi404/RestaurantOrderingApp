import React, { useState, useEffect } from 'react';
import { Calendar } from 'primereact/calendar';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import axios from 'axios';
import '../styles/AllOrderOfDayComponent.css';

const AllOrderOfDayComponent = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyOrders, setDailyOrders] = useState([]);
  const [dailySummary, setDailySummary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDailyOrders(selectedDate);
    fetchDailySummary(selectedDate);
  }, [selectedDate]);

  const fetchDailyOrders = async (date) => {
    setLoading(true);
    try {
      const dateString = formatDateForServer(date);
      const response = await axios.get(`http://localhost:8080/api/ordine/ordineByDay/${dateString}`);
      console.log('Daily orders:', response.data);
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
      const response = await axios.get(`http://localhost:8080/api/ordine/totalPiattoByDay/${dateString}`);
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
    </div>
  );
};

export default AllOrderOfDayComponent;
