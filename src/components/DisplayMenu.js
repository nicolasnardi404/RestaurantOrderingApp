import React, { useState, useEffect } from 'react';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { useNavigate } from 'react-router-dom';
import { locale, addLocale } from 'primereact/api';
import formatDateforServer from '../util/formatDateForServer';
import { ITALIAN_LOCALE_CONFIG } from '../util/ItalianLocaleConfigData';
import { UseDataLocal } from '../util/UseDataLocal';
// Set locale for Calendar


UseDataLocal(ITALIAN_LOCALE_CONFIG);

function MenuPage() {
  const [dishes, setDishes] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dateSelected, setDateSelected] = useState(false);
  const [cart, setCart] = useState({});
  const [error, setError] = useState('');
  const [selectedMealTypes, setSelectedMealTypes] = useState([]);
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
          // Extract unique meal types from the data
          const uniqueMealTypes = [...new Set(data.map(dish => dish.tipo_piatto))];
          
        })
        .catch(error => console.error('Error fetching dishes:', error));
    }
  }, [selectedDay]);

  useEffect(() => {
    updateError();
  }, [selectedMealTypes, cart]);

  const handleDayChange = (event) => {
    const selectedDate = event.value;
    setSelectedDay(selectedDate);
    setCart({});
    setSelectedMealTypes([]);
    setError('');
    setDateSelected(true);
  };


  const formatDateForComparison = (date) => {
    return date instanceof Date ? date.toLocaleDateString('it-IT') : new Date(date).toLocaleDateString('it-IT');
  };

  const handleDropdownChange = (type, selectedDish) => {
    setCart(prevCart => {
      const newCart = { ...prevCart };
      if (selectedDish) {
        newCart[type] = selectedDish;
      } else {
        delete newCart[type];
      }
      return newCart;
    });
  };

  const handleDateChange = () => {
    setDateSelected(false);
    setSelectedDay(null);
    setCart({});
    setSelectedMealTypes([]);
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

  const handleCheckboxChange = (mealType) => {
    setSelectedMealTypes(prevSelected => {
      const newSelected = prevSelected.includes(mealType)
        ? prevSelected.filter(type => type !== mealType)
        : [...prevSelected, mealType];
      
      // If unchecked, remove the dish from the cart
      if (!newSelected.includes(mealType)) {
        setCart(prevCart => {
          const newCart = { ...prevCart };
          delete newCart[mealType];
          return newCart;
        });
      }
      
      return newSelected;
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

    if (isValidCombination) {
      setError('');
    } else {
      setError('Please select a valid combination of dishes.');
    }
  };

  useEffect(() => {
    updateError();
  }, [cart]);

  const isAnyDishSelected = () => {
    return Object.values(cart).some(dish => dish && dish.nome);
  };

  return (
    <div>
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

      {/* Checkbox for each meal type */}
      <div className="meal-type-checkboxes">
        {[...new Set(dishes.map(dish => dish.tipo_piatto))].map(mealType => (
          <div key={mealType}>
            <input
              type="checkbox"
              checked={selectedMealTypes.includes(mealType)}
              onChange={() => handleCheckboxChange(mealType)}
            />
            <label>{mealType}</label><br />
          </div>
        ))}
      </div>

      {/* Display dropdowns based on selected checkboxes */}
      {selectedMealTypes.map(mealType => (
        <DishDropdown
          key={mealType}
          type={mealType}
          initialValue={cart[mealType]}
          options={getFilteredDishes(mealType)} // Use filtered dishes here
          onValueChange={handleDropdownChange}
        />
      ))}

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
