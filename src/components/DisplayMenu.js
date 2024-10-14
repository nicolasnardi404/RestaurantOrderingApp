import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { useNavigate } from 'react-router-dom';
import '../util/addLocale';
import axios from 'axios';
import formatDateforServer from '../util/formatDateForServer';
import { ITALIAN_LOCALE_CONFIG } from '../util/ItalianLocaleConfigData';
import { UseDataLocal } from '../util/UseDataLocal';
import { useAuth } from '../context/AuthContext';
import '../styles/DisplayMenu.css';
import { InputTextarea } from 'primereact/inputtextarea';
import { Card } from 'primereact/card';

function MenuPage() {
  const [selectedDay, setSelectedDay] = useState(null);
  const [availableDates, setAvailableDates] = useState([]); // Set default to current date
  const [showMenu, setShowMenu] = useState(false);
  const [dishes, setDishes] = useState([]);
  const [observazioni, setObservazioni] = useState(''); // Campo para observações
  const [sempreDisponibileDishes, setSempreDisponibileDishes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState({});
  const [error, setError] = useState('');
  const [combinationStatus, setCombinationStatus] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weeklyMenu, setWeeklyMenu] = useState([]);
  const navigate = useNavigate();
  const { user, getToken } = useAuth();

  UseDataLocal(ITALIAN_LOCALE_CONFIG);

  useEffect(() => {
    fetchAvailableDates();
    if (selectedDay) {
      fetchDishes();
      setCart({});
      setCombinationStatus('');
    }
  }, [selectedDay]);

  const fetchAvailableDates = async () => {
    try {
      const token = getToken();
      const response = await axios.get(
        `http://localhost:8080/api/prenotazione/readByIdAndData/${user.userId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const dates = response.data;
      const availableDates = dates.map(date => new Date(date));
      setAvailableDates(availableDates);

      if (!selectedDay) {
        setSelectedDay(availableDates[0]);
      }
    } catch (error) {
      console.error('Error fetching available dates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDishes = async () => {
    const formDateForServer = formatDateforServer(selectedDay);

    try {
      const token = getToken();
      const response = await axios.get(`http://localhost:8080/api/piatto/readByData/${formDateForServer}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Preencha dishes com todos os pratos retornados pela API
      const allDishes = response.data;

      setDishes(allDishes);
      setSempreDisponibileDishes(allDishes.filter((dish) => dish.sempreDisponibile === 1));
      setError('');
    } catch (error) {
      console.error('Error fetching dishes:', error);
      setError('Failed to fetch dishes. Please try again.');
    }
  };

  const fetchWeeklyMenu = async () => {
    try {
      const token = getToken();
      const response = await axios.get('http://localhost:8080/api/piatto/piattoSettimana', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setWeeklyMenu(response.data);
    } catch (error) {
      console.error('Error fetching weekly menu:', error);
      setError('Failed to fetch weekly menu. Please try again.');
    }
  };

  const getFilteredDishes = (mealType) => {
    return dishes.filter((dish) => dish.tipo_piatto === mealType);
  };

  const handleDropdownChange = (mealType, selectedDish) => {
    setCart((prevCart) => {
      let newCart;
      if (selectedDish) {
        newCart = { ...prevCart, [mealType]: selectedDish };
      } else {
        newCart = { ...prevCart };
        delete newCart[mealType];
      }
      checkCombination(newCart);
      return newCart;
    });
  };

  const checkCombination = (currentCart) => {
    const { Primo, Secondo, Contorno, PiattoUnico, Altri, Dessert } = currentCart;

    const selectedItems = new Set();
    if (Primo) selectedItems.add('Primo');
    if (Secondo) selectedItems.add('Secondo');
    if (Contorno) selectedItems.add('Contorno');
    if (PiattoUnico) selectedItems.add('Piatto unico');
    if (Altri) selectedItems.add('Altri');
    if (Dessert) selectedItems.add('Dessert');

    const combinations = validCombinations.find(combination => {
      return combination.every(item => selectedItems.has(item));
    });

    if (combinations) {
      setCombinationStatus('');
    } else {
      // Identifica os itens faltantes
      let missingItems = [];
      if (!Primo) missingItems.push('Primo');
      if (!Secondo) missingItems.push('Secondo');
      if (!Contorno) missingItems.push('Contorno');
      if (!PiattoUnico) missingItems.push('Piatto unico');

      console.log(selectedItems.size)
      console.log(!validCombinations)
      //Define a mensagem com base nos itens faltantes
      if (validCombinations && selectedItems.size >= 2) {
        setCombinationStatus(`Combinazione non valida.`);
      }
    }
  };

  const validCombinations = [
    ['Primo', 'Secondo', 'Contorno'],
    ['Primo', 'Piatto unico', 'Contorno'],
    ['Primo', 'Secondo'],
    ['Primo', 'Piatto unico'],
    ['Primo', 'Contorno'],
    ['Primo', 'Contorno', 'Dessert'],
    ['Secondo', 'Contorno'],
    ['Piatto unico', 'Contorno'],
    ['Piatto unico'],
  ];

  const isValidCombination = () => {
    // Filtra os tipos de pratos selecionados, exceto "Altri"
    const selectedTypes = Object.keys(cart)
      .filter((type) => cart[type] !== null && type !== 'Altri');

    // Verifica se a combinação é válida sem considerar "Altri"
    const isValid = validCombinations.some(
      (combination) =>
        combination.length === selectedTypes.length &&
        combination.every((type) => selectedTypes.includes(type))
    );

    return isValid;
  };

  const renderOrderMenu = () => (
    <div className="order-menu">
      {['Primo', 'Secondo', 'Contorno', 'Piatto unico', 'Altri', 'Dessert'].map((mealType) => (
        <div key={mealType} className="menu-category">
          <h3>{mealType === 'Altri' ? 'Pane/Grissini' : mealType}</h3>
          <Dropdown
            value={cart[mealType]}
            options={getFilteredDishes(mealType)}
            onChange={(e) => handleDropdownChange(mealType, e.value)}
            optionLabel="nome"
            placeholder={`=== SELEZIONA ===`}
            className="w-full md:w-14rem"
            showClear
          />
        </div>
      ))}

      <div className="observazioni">
        <h3>Observazioni</h3>
        <InputTextarea
          value={observazioni}
          onChange={(e) => setObservazioni(e.target.value)}
          rows={3}
          placeholder="Scrivi le tue osservazioni..."
        />
      </div>
    </div>
  );

  const renderFullMenuList = () => {
    const daysOfWeek = [
      'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì'
    ];

    const getDishesByDay = (day) => {
      return weeklyMenu.filter(
        (dish) => dish.dayOfWeek === day && dish.sempreDisponibile === 0
      );
    };

    const getSempreDisponibileDishesByType = (mealType) => {
      return weeklyMenu.filter(
        (dish) => dish.nome_tipo === mealType && dish.sempreDisponibile === 1
      );
    };

    const getSempreDisponibilePiattoUnico = () => {
      return weeklyMenu.filter(
        (dish) => dish.nome_tipo === 'Piatto unico' && dish.sempreDisponibile === 1
      );
    };

    return (
      <div className="full-menu-list">
        <h2>Menù settimanale</h2>
        <table className="styled-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Primo</th>
              <th>Secondo</th>
              <th>Contorno</th>
            </tr>
          </thead>
          <tbody>
            {daysOfWeek.map((day) => {
              const dishesForDay = getDishesByDay(day);
              return (
                <tr key={day}>
                  <td>{day}</td>
                  <td>{dishesForDay.filter(dish => dish.nome_tipo === 'Primo').map(dish => dish.nome_piatto).join(', ')}</td>
                  <td>{dishesForDay.filter(dish => dish.nome_tipo === 'Secondo').map(dish => dish.nome_piatto).join(', ')}</td>
                  <td>{dishesForDay.filter(dish => dish.nome_tipo === 'Contorno').map(dish => dish.nome_piatto).join(', ')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <h2>Sempre Disponibile</h2>
        <table className="styled-table">
          <thead>
            <tr>
              <th>Primo</th>
              <th>Secondo</th>
              <th>Contorno</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{getSempreDisponibileDishesByType('Primo').map(dish => dish.nome_piatto).join(', ')}</td>
              <td>{getSempreDisponibileDishesByType('Secondo').map(dish => dish.nome_piatto).join(', ')}</td>
              <td>{getSempreDisponibileDishesByType('Contorno').map(dish => dish.nome_piatto).join(', ')}</td>
            </tr>
          </tbody>
        </table>

        <h2>Piatto Unico</h2>
        <table className="styled-table">
          <thead>
            <tr>
              <th>Piatto Unico</th>
            </tr>
          </thead>
          <tbody>
            {getSempreDisponibilePiattoUnico().map((dish) => (
              <tr key={dish.id}>
                <td>{dish.nome_piatto}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const handleSubmit = async () => {
    const dataPrenotazione = formatDateforServer(selectedDay);
    // Verifique se a combinação de pratos é válida
    if (isValidCombination()) {
      setIsSubmitting(true);
      const idPiatto = Object.values(cart).map((dish) => dish.id);

      const orderData = {
        idUser: user.userId,
        dataPrenotazione: `${dataPrenotazione}`,
        idPiatto: idPiatto,
        observazioni: observazioni,
      };

      try {
        const token = getToken();
        const response = await axios.post(
          'http://localhost:8080/api/prenotazione/createWithOrdine',
          orderData,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 200 || response.status === 201) {
          setShowSuccessModal(true);
        } else {
          throw new Error('Failed to submit order');
        }
      } catch (error) {
        console.error('Error submitting order:', error);
        setError('Errore durante l\'invio dell\'ordine. Riprova.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setError('Combinazione non valida. Seleziona una combinazione valida di piatti.');
    }
  };

  const handleGoToOpenOrders = () => {
    setShowSuccessModal(false);
    navigate('/open-orders');
  };

  const handleBackToMenu = () => {
    setShowSuccessModal(false);
    setSelectedDay(null);
    setCart({});
    setCombinationStatus('');
    setError('');
  };

  const handleViewFullMenu = async () => {
    await fetchWeeklyMenu();
    setShowMenu(true);
  };

  const renderSuccessModal = () => (
    <Dialog
      visible={showSuccessModal}
      onHide={() => setShowSuccessModal(false)}
      header="Ordine Confermato"
      modal
      footer={
        <div>
          <Button label="Vai agli Ordini Aperti" onClick={handleGoToOpenOrders} className="p-button-primary" />
          <Button label="Torna al Menu" onClick={handleBackToMenu} className="p-button-secondary" />
        </div>
      }
    >
      <p>Il tuo ordine è stato inviato con successo!</p>
    </Dialog>
  );

  const getMinDate = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();

    // Se já passou de 10:30, define a data mínima para o próximo dia
    if (currentHour > 10 || (currentHour === 10 && currentMinutes > 30)) {
      now.setDate(now.getDate() + 1);
    }

    // Ajusta para o próximo dia se cair em fim de semana
    while (now.getDay() === 0 || now.getDay() === 6) { // 0 = Domingo, 6 = Sábado
      now.setDate(now.getDate() + 1);
    }

    return now;
  };

  const getDisabledDates = () => {
    const disabledDates = [];
    const startDate = getMinDate();

    for (let i = 0; i < 30; i++) { // Ajuste o número conforme necessário
      const dateToCheck = new Date(startDate);
      dateToCheck.setDate(startDate.getDate() + i);

      // Adiciona datas de sábado e domingo ao array
      if (dateToCheck.getDay() === 0 || dateToCheck.getDay() === 6) {
        disabledDates.push(new Date(dateToCheck)); // Adiciona a data como um objeto Date
      }
    }

    return disabledDates;
  };

  return (
    <div className='container-menu'>
      <h1>Ordina Pasto</h1>
      <div className="date-selection">
        <Calendar
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.value)}
          placeholder="Seleziona la data"
          locale="it"
          minDate={getMinDate()}
          disabledDates={getDisabledDates()}
        />
        <div className="menu-button-container">
          <Button label="Visualizza il menu della settimana" onClick={handleViewFullMenu} className="menu-button" />
        </div>
      </div>

      {/* Show error message if orders are closed */}
      {!selectedDay && !isLoading && (
        <div className="error-message">
          <h1>Avviso</h1>
          <p>avete già fatto tutti gli ordini della settimana</p>
        </div>
      )}

      {/* Only render the order form if orders are open */}
      {selectedDay && (
        <>
          <Card className='combinazioni-card'>
            <h4> <span className='text-bold'>Opzione 1</span> - Primo / Secondo o Piatto Unico/ Contorno; <span className='text-bold'>Opzione 2</span> - Primo/ Contorno/ Yogurt o Frutta; <span className='text-bold'>Opzione 3</span> - Secondo o Piatto Unico / Contorno; <span className='text-bold'>Opzione 4</span> - Piatto unico;</h4>
          </Card>

          {renderOrderMenu()}
          {combinationStatus && <div className="combination-status">{combinationStatus}</div>}
          {error && <div className="error-message">{error}</div>}
          <Button
            label="Invia Ordine"
            onClick={handleSubmit}
            disabled={!isValidCombination() || isSubmitting}
            className="submit-button"
          />
        </>
      )}

      <Dialog
        visible={showMenu}
        style={{ width: '80vw' }}
        onHide={() => setShowMenu(false)}
      >
        {renderFullMenuList()}
      </Dialog>

      {renderSuccessModal()}
    </div>
  );
}

export default MenuPage;