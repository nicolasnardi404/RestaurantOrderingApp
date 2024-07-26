import React, { useState, useEffect } from 'react';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';

function MenuPage() {
  const [dishes, setDishes] = useState([]);
  const [selectedDay, setSelectedDay] = useState('');
  const [filteredDishes, setFilteredDishes] = useState([]);
  const [cart, setCart] = useState({ Primo: null, Secondo: null, Contorno: null });
  const userName = localStorage.getItem('nome'); // Retrieve user name from localStorage

  useEffect(() => {
    fetch('http://localhost/project/menu')
      .then(response => response.json())
      .then(data => {
        setDishes(data.data);
        setFilteredDishes(data.data);
        console.log(data);
      })
      .catch(error => console.error('Error fetching dishes:', error));
  }, []);

  const formatDateForComparison = (date) => {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0]; // Convert Date to yyyy-mm-dd format
    } else if (typeof date === 'string') {
      return new Date(date).toISOString().split('T')[0]; // Convert string to yyyy-mm-dd
    } else {
      console.error('Invalid date format:', date);
      return '';
    }
  };

  const handleDayChange = (event) => {
    const selectedDate = formatDateForComparison(event.value);
    setSelectedDay(selectedDate);
    setCart({ Primo: null, Secondo: null, Contorno: null });
    
    // Filter dishes for the selected day
    const filtered = dishes.filter(dish => formatDateForComparison(dish.data) === selectedDate);
    setFilteredDishes(filtered);
  };

  const handleAddToCart = (type, dish) => {
    setCart(prevCart => ({ ...prevCart, [type]: dish }));
  };

  const handleRemoveFromCart = (type) => {
    setCart(prevCart => ({ ...prevCart, [type]: null }));
  };

  const getDropdownOptions = (type) => {
    return filteredDishes
      .filter(dish => convertidTipoPiatto(dish.idTipoPiatto) === type)
      .map(dish => ({ label: dish.nome, value: dish }));
  };

  const handleSubmit = () => {

    //##TODO HANGE ENDPOINT THAT WILL RECEIVE DATA

    fetch('http://localhost/project/???', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cart),
    })
    .then(response => response.json())
    .then(data => console.log('Submit success:', data))
    .catch(error => console.error('Error submitting cart:', error));
  };

  const getWeekday = (date) => {
    const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    const day = new Date(date).getDay();
    return days[day];
};

  const renderDishesByType = (type) => {
    return filteredDishes
      .filter(dish => convertidTipoPiatto(dish.idTipoPiatto) === type)
      .map((dish, index) => (
        <li key={index}>
          {dish.nome}
          <button onClick={() => handleAddToCart(type, dish)}>Add to Cart</button>
        </li>
      ));
  };

  return (
    <div>
      <h1>Welcome, {userName}</h1>
      
      <label htmlFor="daySelect">Choose a day:</label>
      <Calendar id="daySelect" value={selectedDay} onChange={(e) => handleDayChange(e)} dateFormat='dd/mm/yy'/>
      
      {selectedDay && (
        <>
          <p>Selected Day: {getWeekday(selectedDay)}</p>
  
          <h2>Primi</h2>
          <Dropdown
            value={cart.Primo}
            options={getDropdownOptions('Primo')}
            onChange={(e) => handleAddToCart('Primo', e.value)}
            placeholder="Select a dish"
          />
          
          <h2>Secondi</h2>
          <Dropdown
            value={cart.Secondo}
            options={getDropdownOptions('Secondo')}
            onChange={(e) => handleAddToCart('Secondo', e.value)}
            placeholder="Select a dish"
          />
  
          <h2>Contorni</h2>
          <Dropdown
            value={cart.Contorno}
            options={getDropdownOptions('Contorno')}
            onChange={(e) => handleAddToCart('Contorno', e.value)}
            placeholder="Select a dish"
          />
  
          <h2>Shopping Cart</h2>
          <ul>
            {Object.keys(cart).map((type, index) => (
              cart[type] && (
                <li className="cart-items" key={index}>
                  {type}: {cart[type].nome}
                  <Button icon="pi pi-times" className="remove-btn p-button-rounded p-button-danger" onClick={() => handleRemoveFromCart(type)} />
                </li>
              )
            ))}
          </ul>
  
          <Button label="Submit" icon="pi pi-check" className="p-button-outlined" onClick={handleSubmit}/>
        </>
      )}
    </div>
  );
  


  // Function to convert idTipoPiatto values to dish types
  function convertidTipoPiatto(id) {
    switch (id) {
      case 1:
        return 'Primo';
      case 2:
        return 'Secondo';
      case 3:
        return 'Contorno';
      default:
        return 'Unknown';
    }
  }
}

export default MenuPage;
