import React, { useState, useEffect } from 'react';

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

  const handleDayChange = (event) => {
    const selectedDate = event.target.value;
    setSelectedDay(selectedDate);
    setCart({ Primo: null, Secondo: null, Contorno: null }); 
    const filtered = dishes.filter(dish => dish.data === selectedDate);
    setFilteredDishes(filtered);
  };

  const handleAddToCart = (type, dish) => {
    setCart(prevCart => ({ ...prevCart, [type]: dish }));
  };

  const handleRemoveFromCart = (type) => {
    setCart(prevCart => ({ ...prevCart, [type]: null }));
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
      <input type="date" id="daySelect" value={selectedDay} onChange={handleDayChange} />
      
      {selectedDay && (
        <>
          <p>Selected Day: {getWeekday(selectedDay)}</p>

          <h2>Primi</h2>
          <ul>{renderDishesByType('Primo')}</ul>

          <h2>Secondi</h2>
          <ul>{renderDishesByType('Secondo')}</ul>

          <h2>Contorni</h2>
          <ul>{renderDishesByType('Contorno')}</ul>

          <h2>Shopping Cart</h2>
          <ul>
            {Object.keys(cart).map((type, index) => (
              cart[type] && (
                <li key={index}>
                  {type}: {cart[type].nome}
                  <button onClick={() => handleRemoveFromCart(type)}>Remove</button>
                </li>
              )
            ))}
          </ul>

          <button onClick={handleSubmit}>Submit</button>
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
