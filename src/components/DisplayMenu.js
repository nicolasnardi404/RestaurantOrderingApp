import React, { useState, useEffect } from 'react';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { useNavigate } from 'react-router-dom';

function MenuPage() {
  const [dishes, setDishes] = useState([]);
  const [selectedDay, setSelectedDay] = useState('');
  const [dateSelected, setDateSelected] = useState(false);
  const [cart, setCart] = useState({ Primo: null, Secondo: null, Contorno: null, PiattoUnico: null });
  const [error, setError] = useState('');
  const [selectedMealCombination, setSelectedMealCombination] = useState(null); // Store the selected combination ID
  const userName = localStorage.getItem('nome');
  const idUser = localStorage.getItem('idUser');
  const navigate = useNavigate();

  // Fetch dishes data
  useEffect(() => {
    if (selectedDay) {
      const formDateForServer = formatDateforServer(selectedDay);
      fetch(`http://localhost:8080/api/piatto/data/${formDateForServer}`)
        .then(response => response.json())
        .then(data => {
          setDishes(data);
        })
        .catch(error => console.error('Error fetching dishes:', error));
    }
  }, [selectedDay]);

  const handleDayChange = (event) => {
    const selectedDateFormatted = formatDateForComparison(event.value);
    setSelectedDay(selectedDateFormatted);
    setCart({ Primo: null, Secondo: null, Contorno: null, PiattoUnico: null });
    setDateSelected(true);
  };

  // Format date for server
  const formatDateforServer = (date) => {
    const [day, month, year] = date.split('/');
    return `${year}-${month}-${day}`;
  };

  const formatDateForComparison = (date) => {
    if (date instanceof Date) {
      const formattedDate = date.toLocaleDateString('it-IT');
      return formattedDate;
    } else if (typeof date === 'string') {
      return new Date(date).toLocaleDateString('it-IT');
    } else {
      console.error('Invalid date format:', date);
      return '';
    }
  };

  const handleDropdownChange = (type, selectedDish) => {
    setCart((prevCart) => ({
      ...prevCart,
      [type]: selectedDish,
    }));
  };

  const handleDateChange = () => {
    setDateSelected(false);
    setSelectedDay('');
    setCart({ Primo: null, Secondo: null, Contorno: null, PiattoUnico: null });
    setSelectedMealCombination(null); // Reset selected combination on date change
  };

  const handleSubmit = () => {
    if (!validateCart()) {
      setError('Please select a valid dish.');
      return;
    }

    const orderData = {
      username: userName,
      idUser: idUser,
      piatti: {
        Primo: cart.Primo?.idPiatto || null,
        Secondo: cart.Secondo?.idPiatto || null,
        Contorno: cart.Contorno?.idPiatto || null,
        PiattoUnico: cart.PiattoUnico?.idPiatto || null,
      },
      data: formatDateforServer(selectedDay),
    };

    fetch('http://localhost:8080/api/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    })
      .then(response => response.json())
      .then(data => {
        navigate('/success-page');
      })
      .catch(error => {
        console.error('Error submitting order:', error);
        setError('Failed to submit your order. Please try again.');
      });
  };

  // Filter dishes by meal type
  const getFilteredDishes = (mealType) => {
    const typeMapping = {
      Primo: 1,
      Secondo: 2,
      Contorno: 3,
      PiattoUnico: 4
    };

    return dishes.filter(dish => dish.idTipoPiatto === typeMapping[mealType]);
  };

  const handleCheckboxChange = (mealId, mealTypes) => {
    const newMealTypes = getMealTypesByCombination(mealId);

    // Update the cart, preserving previously selected dishes if they still apply
    setCart(prevCart => {
      const newCart = { ...prevCart };
      Object.keys(newCart).forEach(type => {
        if (!newMealTypes.includes(type)) {
          newCart[type] = null;  // Reset dish selection if it's not in the new meal types
        }
      });
      return newCart;
    });

    setSelectedMealCombination(mealId); // Set the selected combination ID
  };

  const validateCart = () => {
    // Ensure that each required meal type in the selected combination has a selected dish
    const selectedMealTypes = getMealTypesByCombination(selectedMealCombination);
    return dateSelected && selectedMealTypes.every(mealType => cart[mealType]);
  };

  const getMealTypesByCombination = (combinationId) => {
    // Define meal types for each combination
    const mealCombinations = {
      1: ['Primo', 'Secondo', 'Contorno'],
      2: ['Primo', 'PiattoUnico', 'Contorno'],
      3: ['Primo', 'Contorno'],
      4: ['Secondo', 'Contorno'],
      5: ['PiattoUnico', 'Contorno'],
      6: ['PiattoUnico']
    };
    return mealCombinations[combinationId] || [];
  };

  return (
    <div>
      <h1>Welcome, {userName}</h1>
      
      {!dateSelected ? (
        <div>
          <label htmlFor="daySelect">Choose a day:</label>
          <Calendar id="daySelect" value={selectedDay} onChange={handleDayChange} dateFormat='dd/mm/yy' />
        </div>
      ) : (
        <div>
          <p>Selected date: {selectedDay}</p>
          <Button label="Change Date" onClick={handleDateChange} />
        </div>
      )}
      
      <div className="checkbox-container">
        {[
          { id: 1, name: 'Primo + Secondo + Contorno', types: ['Primo', 'Secondo', 'Contorno'] },
          { id: 2, name: 'Primo + Piatto Unico + Contorno', types: ['Primo', 'PiattoUnico', 'Contorno'] },
          { id: 3, name: 'Primo + Contorno', types: ['Primo', 'Contorno'] },
          { id: 4, name: 'Secondo + Contorno', types: ['Secondo', 'Contorno'] },
          { id: 5, name: 'Piatto Unico + Contorno', types: ['PiattoUnico', 'Contorno'] },
          { id: 6, name: 'Piatto Unico', types: ['PiattoUnico'] },
        ].map(meal => (
          <div key={meal.id}>
            <input
              type="radio"
              checked={selectedMealCombination === meal.id} // Check if this radio button is selected
              onChange={() => handleCheckboxChange(meal.id, meal.types)}
            />
            <label>{meal.name}</label><br />
          </div>
        ))}
      </div>

      {dateSelected && !validateCart() && (
        <p className="error">Please select a valid meal combination.</p>
      )}

      {getMealTypesByCombination(selectedMealCombination).map(mealType => (
        <DishDropdown
          key={mealType}
          type={mealType}
          initialValue={cart[mealType]}
          options={getFilteredDishes(mealType)}
          onValueChange={handleDropdownChange}
        />
      ))}

      {error && <p className="error">{error}</p>}
      <Button 
        label="Submit Order" 
        onClick={handleSubmit} 
        className="mt-3" 
        disabled={!validateCart()}
      />
    </div>
  );
}

const DishDropdown = ({ type, initialValue, options, onValueChange }) => {
  return (
    <div className='tipo-container'>
      <h2>{type.charAt(0).toUpperCase() + type.slice(1)}</h2>
      <Dropdown
        value={initialValue}
        options={options}
        onChange={(e) => onValueChange(type, e.value)}
        optionLabel="nome"  // Ensure this matches your actual data structure for dish name
        placeholder={`Select a ${type} dish`}
        showClear
      />
    </div>
  );
};

export default MenuPage;
