import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { MultiSelect } from 'primereact/multiselect';
import { Calendar } from 'primereact/calendar';
import axios from 'axios';
import '../ViewOpenOrders.css';

const ViewOpenOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [availableDishes, setAvailableDishes] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
    fetchAvailableDishes();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('id');
      console.log('Fetching orders for user ID:', userId);
      const response = await axios.get(`http://localhost:8080/api/ordine/ordineByUserId/${userId}`);
      console.log('Fetched orders:', response.data);
      setOrders(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to fetch orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDishes = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/piatto/read');
      console.log('Fetched available dishes:', response.data);
      setAvailableDishes(response.data);
    } catch (error) {
      console.error('Error fetching available dishes:', error);
      setError('Failed to fetch available dishes. Some features may be limited.');
    }
  };

  const formatDate = (value) => {
    if (!value) return '';
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
      <>
        <Button 
          icon="pi pi-pencil" 
          className="p-button-rounded p-button-success mr-2" 
          onClick={() => handleEditOrder(rowData)}
        />
        <Button 
          icon="pi pi-times" 
          className="p-button-rounded p-button-danger" 
          onClick={() => handleCancelOrder(rowData.idPrenotazione)}
        />
      </>
    );
  };

  const handleEditOrder = (order) => {
    console.log('Editing order:', order);
    setEditingOrder({
      ...order,
      selectedDishes: order.idPiatti.split(', ').map(id => parseInt(id)),
      reservationDate: new Date(order.datePiatti.split(', ')[0])
    });
    setShowEditDialog(true);
  };

  const handleCancelOrder = async (idPrenotazione) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        console.log('Cancelling order:', idPrenotazione);
        await axios.delete(`http://localhost:8080/api/prenotazione/delete/${idPrenotazione}`);
        setOrders(prevOrders => prevOrders.filter(order => order.idPrenotazione !== idPrenotazione));
        alert('Order cancelled successfully');
      } catch (error) {
        console.error('Error cancelling order:', error);
        alert('Failed to cancel the order. Please try again.');
      }
    }
  };

  const handleUpdateOrder = async () => {
    try {
      console.log('Updating order:', editingOrder);
      const updateData = {
        idPiatti: editingOrder.selectedDishes,
        dataPrenotazione: formatDate(editingOrder.reservationDate)
      };
      console.log('Update data:', updateData);
      
      const response = await axios.put(`http://localhost:8080/api/ordine/update/${editingOrder.idPrenotazione}`, updateData);
      console.log('Update response:', response.data);
      
      setShowEditDialog(false);
      await fetchOrders(); // Refresh the orders after update
      alert('Order updated successfully');
    } catch (error) {
      console.error('Error updating order:', error);
      setError('Failed to update order. Please try again.');
    }
  };

  return (
    <div className="view-open-orders">
      <Card title="Your Open Orders">
        {error && <div className="error-message">{error}</div>}
        <DataTable value={orders} loading={loading} responsiveLayout="scroll">
          <Column field="idPrenotazione" header="Order ID" />
          <Column field="datePiatti" header="Reservation Date" body={(rowData) => formatDate(rowData.datePiatti.split(', ')[0])} />
          <Column field="piatti" header="Dishes" />
          <Column field="tipo_piatti" header="Dish Types" />
          <Column body={actionTemplate} header="Actions" style={{width: '150px'}} />
        </DataTable>
      </Card>

      <Dialog 
        header="Edit Order" 
        visible={showEditDialog} 
        style={{ width: '50vw' }} 
        onHide={() => setShowEditDialog(false)}
      >
        {editingOrder && (
          <div>
            <div className="p-field">
              <label htmlFor="dishes">Dishes</label>
              <MultiSelect
                id="dishes"
                value={editingOrder.selectedDishes}
                options={availableDishes}
                onChange={(e) => setEditingOrder({...editingOrder, selectedDishes: e.value})}
                optionLabel="nome"
                optionValue="id"
                placeholder="Select dishes"
              />
            </div>
            <div className="p-field">
              <label htmlFor="reservationDate">Reservation Date</label>
              <Calendar
                id="reservationDate"
                value={editingOrder.reservationDate}
                onChange={(e) => setEditingOrder({...editingOrder, reservationDate: e.value})}
                dateFormat="dd/mm/yy"
                showIcon
              />
            </div>
            <Button label="Update Order" onClick={handleUpdateOrder} />
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default ViewOpenOrders;
