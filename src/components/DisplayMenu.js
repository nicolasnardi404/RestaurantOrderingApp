import React, { useState, useEffect } from 'react';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { useNavigate } from 'react-router-dom';
import { locale, addLocale, updateLocaleOption, updateLocaleOptions, localeOption, localeOptions } from 'primereact/api';
        

function MenuPage() {
  const [dishes, setDishes] = useState([]);
  const [selectedDay, setSelectedDay] = useState('');
  const [cart, setCart] = useState({ Primo: null, Secondo: null, Contorno: null, PiattoUnico: null });
  const [error, setError] = useState('');
  const userName = localStorage.getItem('nome'); 
  const idUser = localStorage.getItem('idUser')
  const navigate = useNavigate();

  locale('it')

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

const formatDateforServer = (date) => {
  const [day, month, year] = date.split('/');
  return `${year}-${month}-${day}`;
}


  useEffect(() => {
    console.log(selectedDay)
    const formDateForServer = formatDateforServer(selectedDay);
    console.log(formDateForServer)
    if (formDateForServer) {
      fetch(`http://localhost:8080/api/piatto/data/${(formDateForServer)}`)
        .then(response => response.json())
        .then(data => {
          console.log(data.map((piatto)=>piatto.nome));
          setDishes(data)
        }).catch(error => console.error('Error fetching dishes:', error));
    }
  }, [selectedDay]);

  

  const handleDayChange = (event) => {
    const selectedDateFormatted = formatDateForComparison(event.value);
    setSelectedDay(selectedDateFormatted);
    setCart({ Primo: null, Secondo: null, Contorno: null, PiattoUnico: null }); // Reset cart on day change
  };

  const formatDateForComparison = (date) => {
    if (date instanceof Date) {
      const formatDate = date.toLocaleString('IT', {timeZone:'Europe/Rome'}).split(',')
      return formatDate[0]
        }else if (typeof date === 'string') {
      return new Date(date).toISOString().split('T')[0]; // Convert string to yyyy-mm-dd
    } else {
      console.error('Invalid date format:', date);
      return '';
    }
  };

  const handleDropdownChange = (type, selectedDish) => {
    setCart(prevCart => ({
      ...prevCart,
      [type]: selectedDish // Use null to clear the dropdown if "None" is selected
    }));
  };

  const validateCart = () => {
    const { Primo, Secondo, Contorno, PiattoUnico } = cart;


    // Check if the selection is "None" which should be treated as null
    const pratoPrimo = Primo === null ? null : Primo;
    const pratoSecondo = Secondo === null ? null : Secondo;
    const pratoContorno = Contorno === null ? null : Contorno;
    const pratoPiattoUnico = PiattoUnico === null ? null : PiattoUnico;
    
    // Allowed combinations
    const isValid =
      (pratoPrimo && pratoSecondo && pratoContorno && !pratoPiattoUnico) || // Primo + Secondo + Contorno
      (pratoPrimo && pratoPiattoUnico && pratoContorno && !pratoSecondo) || // Primo + Piatto Unico + Contorno
      (pratoPrimo && pratoContorno && !pratoSecondo && !pratoPiattoUnico) || // Primo + Contorno
      (pratoSecondo && pratoContorno && !pratoPrimo && !pratoPiattoUnico) || // Secondo + Contorno
      (pratoPiattoUnico && pratoContorno && !pratoPrimo && !pratoSecondo) || // Piatto Unico + Contorno
      (pratoPiattoUnico  && !pratoPrimo && !pratoSecondo && !pratoContorno);      // Piatto Unico only
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
        Primo: cart.Primo?.value || null,
        Secondo: cart.Secondo?.value || null,
        Contorno: cart.Contorno?.value || null,
        PiattoUnico: cart.PiattoUnico?.value || null,
      },
      data: formatDateforServer(selectedDay),
    };
    
    console.log(orderData); // Just for verification
    
    // Serialize the object to a JSON string
    const jsonString = JSON.stringify(orderData);
    
    console.log(jsonString); // Log the JSON string to verify
    // Send the data to the server
    fetch('http://localhost:8080/api/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    })
      .then(response => response.json())
      .then(data => {
        console.log('Order submitted successfully:', data);
        // Optionally, redirect the user or display a success message
        navigate('/success-page'); // Example redirection
      })
      .catch(error => {
        console.error('Error submitting order:', error);
        setError('Failed to submit your order. Please try again.');
      });
  };
  

  const getDishesByType = (type) => {
    return [
      ...dishes.filter(dish => dish.idTipoPiatto === type).map(dish => ({
        label: dish.nome,
        value: dish
      }))
    ];
  };
  

  const DishDropdown = ({ type, initialValue, options, onValueChange }) => {
    return (
      <div className='tipo-container'>
        <h2>{type.charAt(0).toUpperCase() + type.slice(1)}</h2>
        <Dropdown
          value={initialValue}
          options={[ ...options]} // Prepend "None" option
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
      
      <label htmlFor="daySelect">Choose a day:</label>
      <Calendar id="daySelect" value={selectedDay} onChange={(e) => handleDayChange(e)} dateFormat='dd/mm/yy' locale='it' />
      
        <div>
            {selectedDay && (
              <div>
                <p>Selected Day: {selectedDay}</p>
                <div className='menu'>
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
                  <br />
                </div>
                <div className='tipo-container'>
                  {error && <p className="error-message">{error}</p>}
                  <Button label="Submit" icon="pi pi-check" className="btn-classic" onClick={handleSubmit}/>
                </div>        
              </div>
            )}
            <br />     
        </div>
    </div>
  );
}

export default MenuPage;
