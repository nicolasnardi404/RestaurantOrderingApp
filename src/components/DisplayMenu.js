import React, { useState, useEffect } from 'react';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { useNavigate } from 'react-router-dom';
import { locale, addLocale } from 'primereact/api';
import formatDateforServer from '../util/formatDateForServer';
import { ITALIAN_LOCALE_CONFIG } from '../util/ItalianLocaleConfigData';
import { UseDataLocal } from '../util/UseDataLocal';
import '../App.css';
// Set locale for Calendar


UseDataLocal(ITALIAN_LOCALE_CONFIG);

function MenuPage() {
  const [dishes, setDishes] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dateSelected, setDateSelected] = useState(false);
  const [cart, setCart] = useState({});
  const [error, setError] = useState('');
  const [combinationStatus, setCombinationStatus] = useState('');
  const userName = localStorage.getItem('nome');
  const idUser = localStorage.getItem('idUser');
  const navigate = useNavigate();

  // Fetch dishes data
  useEffect(() => {
    if (selectedDay) {
      const formDateForServer = formatDateforServer(selectedDay);
      fetch(`http://localhost:8080/api/piatto/readByData/${formDateForServer}`)
        .then(response => response.json())
        .then(data => {
          setDishes(data);
          // Remove the line that extracts unique meal types
        })
        .catch(error => console.error('Error fetching dishes:', error));
    }
  }, [selectedDay]);

  useEffect(() => {
    updateError();
  }, [cart]);

  const handleDayChange = (event) => {
    const selectedDate = event.value;
    setSelectedDay(selectedDate);
    setCart({});
    setError('');
    setDateSelected(true);
  };

  const formatDateForComparison = (date) => {
    return date instanceof Date ? date.toLocaleDateString('it-IT') : new Date(date).toLocaleDateString('it-IT');
  };

  const handleDropdownChange = (type, value) => {
    setCart(prevCart => {
      const newCart = { ...prevCart, [type]: value };
      checkCombination(newCart);
      return newCart;
    });
  };

  const checkCombination = (currentCart) => {
    const { Primo, Secondo, Contorno, 'Piatto unico': PiattoUnico } = currentCart;
    
    if (PiattoUnico) {
      setCombinationStatus('Valid combination: Piatto unico');
    } else if (Primo && Secondo && Contorno) {
      setCombinationStatus('Valid combination: Primo + Secondo + Contorno');
    } else {
      let missingItems = [];
      if (!Primo) missingItems.push('Primo');
      if (!Secondo) missingItems.push('Secondo');
      if (!Contorno) missingItems.push('Contorno');
      
      if (missingItems.length === 3) {
        setCombinationStatus('Please select dishes to create a valid combination');
      } else {
        setCombinationStatus(`Add ${missingItems.join(' or ')} to complete the combination`);
      }
    }
  };

  const handleDateChange = () => {
    setDateSelected(false);
    setSelectedDay(null);
    setCart({});
    setError('');
  };

  const handleSubmit = () => {
    const orderData = {
      username: userName,
      idUser: idUser,
      piatti: {
        Primo: cart.Primo?.nome || null,
        Secondo: cart.Secondo?.nome || null,
        Contorno: cart.Contorno?.nome || null,
        "Piatto unico": cart["Piatto unico"]?.nome || null,
      },
      data: formatDateforServer(selectedDay),
    };

    console.log(orderData);
    fetch('http://localhost:8080/api/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    })
      .then(response => response.json())
      .then(() => navigate('/success-page'))
      .catch(error => {
        console.error('Error submitting order:', error);
        setError('Failed to submit your order. Please try again.');
      });
  };

  const getFilteredDishes = (mealType) => {
    return dishes.filter(dish => dish.tipo_piatto === mealType);
  };

  const updateError = () => {
    const validCombinations = [
      ['Primo', 'Secondo', 'Contorno'],
      ['Primo', 'Piatto unico', 'Contorno'],
      ['Primo', 'Contorno'],
      ['Secondo', 'Contorno'],
      ['Piatto unico', 'Contorno'],
      ['Piatto unico']
    ];

    const selectedTypes = Object.keys(cart).filter(type => cart[type] !== null);
    const isValidCombination = validCombinations.some(combination => 
      combination.length === selectedTypes.length && 
      combination.every(type => selectedTypes.includes(type))
    );

  };

  useEffect(() => {
    updateError();
  }, [cart]);

  const isAnyDishSelected = () => {
    return Object.values(cart).some(dish => dish && dish.nome);
  };

  return (
    <div className='container-menu'>
      <h1>Welcome, {userName}</h1>
      
      {!dateSelected ? (
        <div>
          <label htmlFor="daySelect">Choose a day:</label>
          <Calendar
            id="daySelect"
            value={selectedDay}
            onChange={handleDayChange}
            dateFormat="dd/mm/yy"
          />
        </div>
      ) : (
        <div>
          <p>Selected date: {formatDateForComparison(selectedDay)}</p>
          <Button label="Change Date" onClick={handleDateChange} />
        </div>
      )}

      {/* Remove the checkbox section and replace with this: */}
      {['Primo', 'Secondo', 'Contorno', 'Piatto unico'].map(mealType => (
        <DishDropdown
          key={mealType}
          type={mealType}
          initialValue={cart[mealType]}
          options={getFilteredDishes(mealType)}
          onValueChange={handleDropdownChange}
        />
      ))}

      {/* Display combination status */}
      <div className="combination-status">
        {combinationStatus}
      </div>

      {/* Error or validation message */}
      {error && <p className="error">{error}</p>}

      <Button 
        label="Submit Order" 
        onClick={handleSubmit} 
        className="mt-3" 
        disabled={error !== '' || !isAnyDishSelected()}
      />
      
      {/* For debugging */}
      {/* <p>Error: {error}</p>
      <p>Cart: {JSON.stringify(cart)}</p>
      <p>Is any dish selected: {isAnyDishSelected() ? 'Yes' : 'No'}</p> */}
    </div>
  );
}

const DishDropdown = ({ type, initialValue, options, onValueChange }) => {
  return (
    <div className="tipo-container">
      <h2>{type.charAt(0).toUpperCase() + type.slice(1)}</h2>
      <Dropdown
        className="drop-menu"
        value={initialValue}
        options={options}
        onChange={(e) => onValueChange(type, e.value)}
        optionLabel="nome" 
        placeholder={`Select a ${type} dish`}
        showClear
        emptyFilterMessage="No dishes available"
        emptyMessage="No dishes available"
        onClear={() => onValueChange(type, null)}
      />
    </div>
  );
};

export default MenuPage;
