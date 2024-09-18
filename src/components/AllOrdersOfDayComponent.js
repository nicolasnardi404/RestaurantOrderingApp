import React, { useState, useEffect } from 'react';
import { Calendar } from 'primereact/calendar';
import { Card } from 'primereact/card';
import axios from 'axios';
import '../AllOrderOfDayComponent.css';

const AllOrderOfDayComponent = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyOrderSummary, setDailyOrderSummary] = useState([]);

  useEffect(() => {
    fetchDailyOrderSummary(selectedDate);
  }, [selectedDate]);

  const fetchDailyOrderSummary = async (date) => {
    try {
      const formattedDate = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      const response = await axios.get(`http://localhost:8080/api/ordine/totalPiattoByDay/${formattedDate}`);
      console.log('Daily order summary:', response.data);
      setDailyOrderSummary(response.data);
    } catch (error) {
      console.error('Error fetching daily order summary:', error);
      setDailyOrderSummary([]);
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.value);
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
      <Card title={`Order Summary for ${selectedDate.toLocaleDateString()}`} className="summary-card">
        {dailyOrderSummary.length === 0 ? (
          <p>No orders for this day.</p>
        ) : (
          <ul>
            {dailyOrderSummary.map((item, index) => (
              <li key={index}>
                {item.nome}: {item.quantita}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default AllOrderOfDayComponent;
