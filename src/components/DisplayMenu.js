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
  const userName = localStorage.getItem('nome'); // Retrieve user name from localStorage
  const navigate = useNavigate(); // Initialize useNavigate for redirection

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
    // Add any other necessary translations here...
});


  useEffect(() => {
    console.log(selectedDay)
    if (selectedDay) {
      fetch(`http://localhost/project/menu?date=${(selectedDay)}`)
        .then(response => response.json())
        .then(data => {

          setDishes(data.data);
          console.log(data);
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
      (pratoPiattoUnico && !pratoPrimo && !pratoSecondo && !pratoContorno); // Piatto Unico only

      console.log(isValid)
    return isValid;
  };

  const handleSubmit = () => {
    if (!validateCart()) {
      setError('Selected combination is not valid. Please select a valid combination.');
      return;
    }

    // Redirect to /order page
    navigate('/order');
  };

  const getDishesByType = (type) => {
    // Add a "None" option to allow clearing the selection
    return [
      { label: 'None', value: null }, // Option to clear selection
      ...dishes.filter(dish => dish.idTipoPiatto === type).map(dish => ({
        label: dish.nome,
        value: dish
      }))
    ];
  };

  return (
    <div>
      <h1>Welcome, {userName}</h1>
      
      <label htmlFor="daySelect">Choose a day:</label>
      <Calendar id="daySelect" value={selectedDay} onChange={(e) => handleDayChange(e)} dateFormat='dd/mm/yy' locale='it' />
      
      {selectedDay && (
        <div>
          <p>Selected Day: {selectedDay}</p>
          <div className='menu'>
            <div className='tipo-container'>
              <h2>Primi</h2>
              <Dropdown
                value={cart.Primo}
                options={getDishesByType(1)}
                onChange={(e) => handleDropdownChange('Primo', e.value)}
                optionLabel="label"
                placeholder="Select a Primo dish"
              />
            </div>
            <div className='tipo-container'>
              <h2>Secondi</h2>
              <Dropdown
                value={cart.Secondo}
                options={getDishesByType(2)}
                onChange={(e) => handleDropdownChange('Secondo', e.value)}
                optionLabel="label"
                placeholder="Select a Secondo dish"
              />
            </div>
            <div className='tipo-container'>
              <h2>Contorni</h2>
              <Dropdown
                value={cart.Contorno}
                options={getDishesByType(3)}
                onChange={(e) => handleDropdownChange('Contorno', e.value)}
                optionLabel="label"
                placeholder="Select a Contorno dish"
              />
            </div>
            <div className='tipo-container'>
              <h2>Piatto Unico</h2>
              <Dropdown
                value={cart.PiattoUnico}
                options={getDishesByType(4)}
                onChange={(e) => handleDropdownChange('PiattoUnico', e.value)}
                optionLabel="label"
                placeholder="Select a Piatto Unico dish"
              />
            </div>
            <br />
          </div>
          <div className='tipo-container'>
            {error && <p className="error-message">{error}</p>}
            <Button label="Submit" icon="pi pi-check" className="btn-classic" onClick={handleSubmit}/>
          </div>        
        </div>
      )}
    </div>
  );
}

export default MenuPage;
