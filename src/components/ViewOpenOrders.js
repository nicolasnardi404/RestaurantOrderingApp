import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import axios from 'axios';
import '../ViewOpenOrders.css';

const ViewOpenOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Assuming you have a user ID stored in localStorage or in a context
      const userId = localStorage.getItem('userId');
      const response = await axios.get(`http://localhost:8080/ordine/ordineByUserId/${userId}`);
      const filteredOrders = filterOpenOrders(response.data);
      setOrders(filteredOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOpenOrders = (allOrders) => {
    const now = new Date();
    const today10AM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0);
    
    return allOrders.filter(order => {
      const orderDate = new Date(order.reservation_date);
      return orderDate > now || (orderDate.toDateString() === now.toDateString() && now < today10AM);
    });
  };

  const formatDate = (value) => {
    return new Date(value).toLocaleString('it-IT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const actionTemplate = (rowData) => {
    return (
      <Button 
        icon="pi pi-times" 
        className="p-button-rounded p-button-danger" 
        onClick={() => handleCancelOrder(rowData.id)}
      />
    );
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await axios.delete(`http://localhost:8080/ordine/delete/${orderId}`);
        fetchOrders(); // Refresh the orders list
      } catch (error) {
        console.error('Error cancelling order:', error);
      }
    }
  };

  return (
    <div className="view-open-orders">
      <Card title="Your Open Orders">
        <DataTable value={orders} loading={loading} responsiveLayout="scroll">
          <Column field="id" header="Order ID" />
          <Column field="reservation_date" header="Reservation Date" body={(rowData) => formatDate(rowData.reservation_date)} />
          <Column field="tipo_piatti" header="Dish Type" />
          <Column body={actionTemplate} header="Actions" style={{width: '100px'}} />
        </DataTable>
      </Card>
    </div>
  );
};

export default ViewOpenOrders;
