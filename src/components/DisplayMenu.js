import React, { useState, useEffect } from 'react';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { useNavigate } from 'react-router-dom';
import { locale, addLocale } from 'primereact/api';

// Set locale for Calendar
locale('it');
addLocale('it', {
  firstDayOfWeek: 1,
  dayNames: ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'],
  dayNamesShort: ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'],
  dayNamesMin: ['D', 'L', 'M', 'M', 'G', 'V', 'S'],
  monthNames: ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'],
  monthNamesShort: ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'],
  today: 'Oggi',
  clear: 'Cancella',
});

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
      fetch(`http://localhost:8080/api/piatto/data/${formDateForServer}`)
        .then(response => response.json())
        .then(data => {
          setDishes(data);
        })
        .catch(error => console.error('Error fetching dishes:', error));
    }
  }, [selectedDay]);

  useEffect(() => {
    // Validate meal types and update error message in real-time
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

  const formatDateforServer = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const formatDateForComparison = (date) => {
    if (date instanceof Date) {
      return date.toLocaleDateString('it-IT');
    } else {
      return new Date(date).toLocaleDateString('it-IT');
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

  // Handle checkbox changes
  const handleCheckboxChange = (mealType) => {
    setSelectedMealTypes((prevSelected) => {
      if (prevSelected.includes(mealType)) {
        return prevSelected.filter(type => type !== mealType);
      } else {
        return [...prevSelected, mealType];
      }
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

  // Update error message based on missing meal types
  const updateError = () => {
    console.log(cart)
    const validCombinations = [
      ['Primo', 'Secondo', 'Contorno'],
      ['Primo', 'PiattoUnico', 'Contorno'],
      ['Primo', 'Contorno'],
      ['Secondo', 'Contorno'],
      ['PiattoUnico', 'Contorno'],
      ['PiattoUnico']
    ];

    const selectedSet = new Set(selectedMealTypes);

    // Find matching valid combinations
    const matchingCombinations = validCombinations.filter(combination => 
      combination.every(type => selectedSet.has(type))
    );

    // Determine missing items based on the best matching combination
    if (matchingCombinations.length > 0) {
      const bestMatch = matchingCombinations[0]; // You can refine this logic if needed
      const missingItems = bestMatch.filter(type => !selectedSet.has(type));
      if (missingItems.length > 0) {
        setError(`You still need to select: ${[...new Set(missingItems)].join(', ')}.`);
      } else {
        setError(''); // Clear error if valid combination is met
      }
    } else {
      // If no valid combination is met, list all possible items to select
      const allPossibleItems = validCombinations.flat();
      const missingItems = allPossibleItems.filter(type => !selectedSet.has(type));
      if (missingItems.length > 0) {
        setError(`Please select at least one dish for: ${[...new Set(missingItems)].join(', ')}.`);
      } else {
        setError(''); // Clear error if no items are missing
      }
    }
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
        {['Primo', 'Secondo', 'Contorno', 'PiattoUnico'].map(mealType => (
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
          options={getFilteredDishes(mealType)}
          onValueChange={handleDropdownChange}
        />
      ))}

      {/* Error or validation message */}
      {error && <p className="error">{error}</p>}

      <Button 
        label="Submit Order" 
        onClick={handleSubmit} 
        className="mt-3" 
        disabled={!!error} // Disable if there is any error
      />
    </div>
  );
}

const DishDropdown = ({ type, initialValue, options, onValueChange }) => {
  return (
    <div className="tipo-container">
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
