import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { MultiSelect } from 'primereact/multiselect';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Certifique-se de importar o jwt-decode
import '../ViewOpenOrders.css';

const ViewOpenOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [availableDishes, setAvailableDishes] = useState([]);
  const [error, setError] = useState('');
  const [combinationStatus, setCombinationStatus] = useState('');
  const [availableDishesForOrder, setAvailableDishesForOrder] = useState({});

  useEffect(() => {
    fetchOrders();
    fetchAvailableDishes();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
<<<<<<< HEAD

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
=======
      const userId = localStorage.getItem('id');
      console.log('Fetching orders for user ID:', userId);
      const response = await axios.get(`http://localhost:8080/api/ordine/ordineByUserId/${userId}`);
      console.log('Fetched orders:', response.data);
      setOrders(response.data);
      setError('');
>>>>>>> 06cb2ba6ab1bb526d56a0389e17a159a98b5f652
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to fetch orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
=======
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

>>>>>>> 06cb2ba6ab1bb526d56a0389e17a159a98b5f652
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
<<<<<<< HEAD
      <Button 
        icon="pi pi-times" 
        className="p-button-rounded p-button-danger" 
        onClick={() => handleCancelOrder(rowData.idOrdine)}
      />
=======
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
>>>>>>> 06cb2ba6ab1bb526d56a0389e17a159a98b5f652
    );
  };

  const fetchDishesForOrder = async (date) => {
    try {
      const formattedDate = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      console.log('Fetching dishes for date:', formattedDate);
      const response = await axios.get(`http://localhost:8080/api/piatto/readByData/${formattedDate}`);
      console.log('Fetched dishes for date:', response.data);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching dishes for date:', error);
      setError('Failed to fetch dishes for the order date. Some features may be limited.');
      return [];
    }
  };

  const handleEditOrder = async (order) => {
    console.log('Editing order:', order);
    const selectedDishes = order.idPiatti.split(', ').map(id => parseInt(id));
    console.log('Selected dishes:', selectedDishes);
    const orderDate = new Date(order.datePiatti.split(', ')[0]);
    console.log('Order date:', orderDate);
    
    const dishesForOrder = await fetchDishesForOrder(orderDate);
    console.log('Dishes for order:', dishesForOrder);
    
    if (!Array.isArray(dishesForOrder)) {
      console.error('Dishes for order is not an array:', dishesForOrder);
      setError('Failed to fetch dishes for the order date. Please try again.');
      return;
    }

    const dishesById = dishesForOrder.reduce((acc, dish) => {
      acc[dish.id] = dish;
      return acc;
    }, {});

    const editingOrderData = {
      ...order,
      selectedDishes: {
        Primo: dishesById[selectedDishes.find(id => dishesById[id]?.tipo_piatto === 'Primo')] || null,
        Secondo: dishesById[selectedDishes.find(id => dishesById[id]?.tipo_piatto === 'Secondo')] || null,
        Contorno: dishesById[selectedDishes.find(id => dishesById[id]?.tipo_piatto === 'Contorno')] || null,
        'Piatto unico': dishesById[selectedDishes.find(id => dishesById[id]?.tipo_piatto === 'Piatto unico')] || null,
      },
      reservationDate: orderDate,
      availableDishes: dishesForOrder,
      idOrdine: order.idOrdine,
      idPrenotazione: order.idPrenotazione // Ensure this is included
    };

    console.log('Initial selected dishes:', JSON.stringify({
      Primo: editingOrderData.selectedDishes.Primo?.nome || 'None',
      Secondo: editingOrderData.selectedDishes.Secondo?.nome || 'None',
      Contorno: editingOrderData.selectedDishes.Contorno?.nome || 'None',
      'Piatto unico': editingOrderData.selectedDishes['Piatto unico']?.nome || 'None'
    }, null, 2));

    console.log('Available dishes:', JSON.stringify(editingOrderData.availableDishes.map(dish => ({
      id: dish.id,
      nome: dish.nome,
      tipo_piatto: dish.tipo_piatto
    })), null, 2));

    console.log('Editing order data:', editingOrderData);
    setEditingOrder(editingOrderData);
    checkCombination(editingOrderData.selectedDishes);
    setShowEditDialog(true);
  };

  const handleDropdownChange = (mealType, selectedDish) => {
    console.log(`Dropdown change for ${mealType}:`, selectedDish ? selectedDish.nome : 'None');
    setEditingOrder(prevOrder => {
      const newSelectedDishes = { ...prevOrder.selectedDishes, [mealType]: selectedDish || null };
      
      console.log('Current selected dishes:', JSON.stringify({
        Primo: newSelectedDishes.Primo?.id || 'None',
        Secondo: newSelectedDishes.Secondo?.id || 'None',
        Contorno: newSelectedDishes.Contorno?.id || 'None',
        'Piatto unico': newSelectedDishes['Piatto unico']?.id || 'None'
      }, null, 2));
      
      checkCombination(newSelectedDishes);
      return { ...prevOrder, selectedDishes: newSelectedDishes };
    });
  };

  const isValidCombination = (selectedDishes) => {
    const validCombinations = [
      ['Primo', 'Secondo', 'Contorno'],
      ['Primo', 'Piatto unico', 'Contorno'],
      ['Primo', 'Contorno'],
      ['Secondo', 'Contorno'],
      ['Piatto unico', 'Contorno'],
      ['Piatto unico']
    ];

    const selectedTypes = Object.keys(selectedDishes).filter(type => 
      selectedDishes[type] !== null && selectedDishes[type] !== undefined
    );

    console.log('Selected types:', selectedTypes);

    const isValid = validCombinations.some(combination => {
      const matchesLength = combination.length === selectedTypes.length;
      const includesAll = combination.every(type => selectedTypes.includes(type));
      console.log(`Checking combination: ${combination}, Length match: ${matchesLength}, Includes all: ${includesAll}`);
      return matchesLength && includesAll;
    });

    console.log('Is valid combination:', isValid);
    return isValid;
  };

  const checkCombination = (currentSelection) => {
    if (isValidCombination(currentSelection)) {
      setCombinationStatus('');
    } else {
      const selectedTypes = Object.keys(currentSelection).filter(type => currentSelection[type] !== null);
      let missingItems = [];
      if (!selectedTypes.includes('Primo') && !selectedTypes.includes('Piatto unico')) missingItems.push('Primo or Piatto unico');
      if (!selectedTypes.includes('Secondo') && !selectedTypes.includes('Piatto unico')) missingItems.push('Secondo or Piatto unico');
      if (!selectedTypes.includes('Contorno') && !selectedTypes.includes('Piatto unico')) missingItems.push('Contorno');
      
      if (missingItems.length === 0) {
        setCombinationStatus('Invalid combination. Please adjust your selection.');
      } else {
        setCombinationStatus(`Add ${missingItems.join(' or ')} to complete a valid combination`);
      }
    }
  };

  const handleCancelOrder = async (idPrenotazione) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
<<<<<<< HEAD
        await axios.delete(`http://localhost:8080/api/ordine/delete/${orderId}`);
        fetchOrders(); // Refresh the orders list
=======
        console.log('Cancelling order:', idPrenotazione);
        await axios.delete(`http://localhost:8080/api/prenotazione/delete/${idPrenotazione}`);
        setOrders(prevOrders => prevOrders.filter(order => order.idPrenotazione !== idPrenotazione));
        alert('Order cancelled successfully');
>>>>>>> 06cb2ba6ab1bb526d56a0389e17a159a98b5f652
      } catch (error) {
        console.error('Error cancelling order:', error);
        alert('Failed to cancel the order. Please try again.');
      }
    }
  };

  const handleUpdateOrder = async () => {
    if (isValidCombination(editingOrder.selectedDishes)) {
      try {
        console.log('Updating order:', editingOrder);
        
        // Filter out null or undefined dishes and get their IDs
        const selectedDishIds = Object.values(editingOrder.selectedDishes)
          .filter(dish => dish !== null && dish !== undefined)
          .map(dish => dish.id);

        // Get all idOrdine values
        const idOrdineArray = editingOrder.idOrdine.split(', ').map(id => parseInt(id));

        const updateData = {
          idPrenotazione: editingOrder.idPrenotazione, // Use idPrenotazione instead of idUser
          dataPrenotazione: editingOrder.reservationDate.toISOString().split('T')[0], // Format: YYYY-MM-DD
          idPiatto: selectedDishIds,
          idOrdine: idOrdineArray
        };

        console.log('Update data:', JSON.stringify(updateData, null, 2));

        const response = await axios.put(`http://localhost:8080/api/ordine/update/${editingOrder.idPrenotazione}`, updateData);
        console.log('Update response:', response.data);
        
        setShowEditDialog(false);
        await fetchOrders(); // Refresh the orders after update
        alert('Order updated successfully');
      } catch (error) {
        console.error('Error updating order:', error);
        setError('Failed to update order. Please try again.');
      }
    } else {
      setError('Invalid combination. Please select a valid combination of dishes.');
    }
  };

  return (
    <div className="view-open-orders">
      <Card title="Your Open Orders">
        {error && <div className="error-message">{error}</div>}
        <DataTable value={orders} loading={loading} responsiveLayout="scroll">
          <Column field="idPrenotazione" header="Order ID" />
<<<<<<< HEAD
          <Column field="piatti" header="Dish Name" />
          <Column field="tipo_piatti" header="Dish Type" />
          <Column body={actionTemplate} header="Actions" style={{ width: '100px' }} />
=======
          <Column field="datePiatti" header="Reservation Date" body={(rowData) => formatDate(rowData.datePiatti.split(', ')[0])} />
          <Column field="piatti" header="Dishes" />
          <Column field="tipo_piatti" header="Dish Types" />
          <Column body={actionTemplate} header="Actions" style={{width: '150px'}} />
>>>>>>> 06cb2ba6ab1bb526d56a0389e17a159a98b5f652
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
              <label>Reservation Date:</label>
              <span>{formatDate(editingOrder.reservationDate)}</span>
            </div>
            {['Primo', 'Secondo', 'Contorno', 'Piatto unico'].map(mealType => (
              <div key={mealType} className="p-field">
                <label htmlFor={mealType}>{mealType}</label>
                <Dropdown
                  id={mealType}
                  value={editingOrder.selectedDishes[mealType]}
                  options={editingOrder.availableDishes.filter(dish => dish.tipo_piatto === mealType)}
                  onChange={(e) => handleDropdownChange(mealType, e.value)}
                  optionLabel="nome"
                  placeholder={`Select ${mealType}`}
                  className="w-full md:w-14rem"
                  showClear
                />
              </div>
            ))}
            {combinationStatus && <div className="combination-status">{combinationStatus}</div>}
            {error && <div className="error-message">{error}</div>}
            <Button 
              label="Update Order" 
              onClick={handleUpdateOrder} 
              disabled={!isValidCombination(editingOrder.selectedDishes)} 
            />
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default ViewOpenOrders;
