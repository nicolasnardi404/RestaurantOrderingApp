import React, { useState, useEffect } from 'react';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { useNavigate } from 'react-router-dom';
import { locale, addLocale } from 'primereact/api';

function MenuPage() {

  const [dishes, setDishes] = useState([]);
  const [selectedDay, setSelectedDay] = useState('');
  const [dateSelected, setDateSelected] = useState(false); // New state to track if date is selected
  const [cart, setCart] = useState({ Primo: null, Secondo: null, Contorno: null, PiattoUnico: null });
  const [error, setError] = useState('');
  const userName = localStorage.getItem('nome');
  const idUser = localStorage.getItem('idUser');
  const navigate = useNavigate();

  //setting calendar config
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

  //get dishes data
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
    setCart({ Primo: null, Secondo: null, Contorno: null, PiattoUnico: null }); // Reset cart on day change
    setDateSelected(true); // Set date as selected
  };

  // format date

  const formatDateforServer = (date) => {
    const [day, month, year] = date.split('/');
    return `${year}-${month}-${day}`;
  };

  const formatDateForComparison = (date) => {
    if (date instanceof Date) {
      const formattedDate = date.toLocaleDateString('it-IT'); // Use the 'it-IT' locale
      return formattedDate;
    } else if (typeof date === 'string') {
      return new Date(date).toLocaleDateString('it-IT'); // Convert string to locale date
    } else {
      console.error('Invalid date format:', date);
      return '';
    }
  };

  const handleDropdownChange = (type, selectedDish) => {
    setCart((prevCart) => ({
      ...prevCart,
      [type]: selectedDish,  // Store the entire dish object
    }));
  };

  const handleDateChange = () => {
    setDateSelected(false); // Allow user to reselect date
    setSelectedDay(''); // Clear the current selected date
    setCart({ Primo: null, Secondo: null, Contorno: null, PiattoUnico: null }); // Reset the cart
  };

  const validateCart = () => {
    const { Primo, Secondo, Contorno, PiattoUnico } = cart;
    const isValid =
      (Primo && Secondo && Contorno && !PiattoUnico) || // Primo + Secondo + Contorno
      (Primo && PiattoUnico && Contorno && !Secondo) || // Primo + Piatto Unico + Contorno
      (Primo && Contorno && !Secondo && !PiattoUnico) || // Primo + Contorno
      (Secondo && Contorno && !Primo && !PiattoUnico) || // Secondo + Contorno
      (PiattoUnico && Contorno && !Primo && !Secondo) || // Piatto Unico + Contorno
      (PiattoUnico && !Primo && !Secondo && !Contorno); // Piatto Unico only
    return isValid;
  };

  const handleSubmit = () => {
    if (!validateCart()) {
      setError('Selected combination is not valid. Please select a valid combination.');
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

  const getDishesByType = (type) => {
    return dishes
      .filter(dish => dish.idTipoPiatto === type)
      .map(dish => ({
        label: dish.nome,
        value: dish  // Use the entire dish object as the value
      }));
  };

  const DishDropdown = ({ type, initialValue, options, onValueChange }) => {
    return (
      <div className='tipo-container'>
        <h2>{type.charAt(0).toUpperCase() + type.slice(1)}</h2>
        <Dropdown
          value={initialValue}  // Pass the dish object from cart
          options={options}
          onChange={(e) => onValueChange(type, e.value)}
          optionLabel="label"
          placeholder={`Select a ${type} dish`}
          showClear
        />
      </div>
    );
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
          <p>Select date: {selectedDay}</p>
          <Button label="Change Date" onClick={handleDateChange} />
        </div>
      )}
      
      <DishDropdown
        type="Primo"
        initialValue={cart.Primo}
        options={getDishesByType(1)}
        onValueChange={handleDropdownChange}
      />
      <DishDropdown
        type="Secondo"
        initialValue={cart.Secondo}
        options={getDishesByType(2)}
        onValueChange={handleDropdownChange}
      />
      <DishDropdown
        type="Contorno"
        initialValue={cart.Contorno}
        options={getDishesByType(3)}
        onValueChange={handleDropdownChange}
      />
      <DishDropdown
        type="PiattoUnico"
        initialValue={cart.PiattoUnico}
        options={getDishesByType(4)}
        onValueChange={handleDropdownChange}
      />
      {error && <p className="error">{error}</p>}
      <Button label="Submit Order" onClick={handleSubmit} className="mt-3" />
    </div>
  );
}

export default MenuPage;
