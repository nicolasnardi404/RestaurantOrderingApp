import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Certifique-se de importar o jwt-decode
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

      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      const decodedToken = jwtDecode(token);
      const userId = decodedToken.data.userId;

      const response = await axios.get(`http://localhost:8080/api/ordine/ordineByUserId/${userId}`);
      console.log(response.data); // Verifique os dados retornados aqui
      setOrders(response.data); // Certifique-se de que estamos definindo corretamente os pedidos no estado
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
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
        onClick={() => handleCancelOrder(rowData.idOrdine)}
      />
    );
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await axios.delete(`http://localhost:8080/api/ordine/delete/${orderId}`);
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
          <Column field="idPrenotazione" header="Order ID" />
          <Column field="piatti" header="Dish Name" />
          <Column field="tipo_piatti" header="Dish Type" />
          <Column body={actionTemplate} header="Actions" style={{ width: '100px' }} />
        </DataTable>
      </Card>
    </div>
  );
};

export default ViewOpenOrders;
