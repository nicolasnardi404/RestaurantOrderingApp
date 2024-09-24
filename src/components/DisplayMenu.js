import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import formatDateforServer from '../util/formatDateForServer';
import { ITALIAN_LOCALE_CONFIG } from '../util/ItalianLocaleConfigData';
import { UseDataLocal } from '../util/UseDataLocal';
import { useAuth } from '../context/AuthContext';
import '../styles/DisplayMenu.css';
import { InputTextarea } from 'primereact/inputtextarea';

function MenuPage() {
  const [selectedDay, setSelectedDay] = useState(new Date()); // Set default to current date
  const [showMenu, setShowMenu] = useState(false);
  const [dishes, setDishes] = useState([]);
  const [altri, setAltri] = useState(null); // Campo para "Altri"
  const [observazioni, setObservazioni] = useState(''); // Campo para observações
  const [sempreDisponibileDishes, setSempreDisponibileDishes] = useState([]);
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
    if (selectedDay) {
      fetchDishes();
      setCart({});
      setCombinationStatus('');
    }
  }, [selectedDay]);

  const fetchDishes = async () => {
    const formDateForServer = formatDateforServer(selectedDay);
    console.log('Fetching dishes for date:', formDateForServer);

    try {
      const token = getToken();
      const response = await axios.get(`http://localhost:8080/api/piatto/readByData/${formDateForServer}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Response data:', response.data);

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

      console.log('Weekly menu response data:', response.data);
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
    const { Primo, Secondo, Contorno, 'Piatto unico': PiattoUnico, Altri, Complement } = currentCart;

    const selectedItems = new Set();
    if (Primo) selectedItems.add('Primo');
    if (Secondo) selectedItems.add('Secondo');
    if (Contorno) selectedItems.add('Contorno');
    if (PiattoUnico) selectedItems.add('Piatto unico');
    if (Altri) selectedItems.add('Altri');
    if (Complement) selectedItems.add('Complement');

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

      // Define a mensagem com base nos itens faltantes
      if (missingItems.length === 4) {
        setCombinationStatus('Please select dishes to create a valid combination');
      } else {
        setCombinationStatus(`Add ${missingItems.join(' or ')} to complete the combination`);
      }
    }
  };

  let validCombinations = [
    ['Primo', 'Secondo', 'Contorno'],
    ['Primo', 'Piatto unico', 'Contorno'],
    ['Primo', 'Contorno'],
    ['Primo', 'Contorno', 'Complement'],
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

    return isValid; // Retorna se a combinação é válida
  };

  const renderOrderMenu = () => (
    <div className="order-menu">
      {['Primo', 'Secondo', 'Contorno', 'Piatto unico', 'Altri', 'Complement'].map((mealType) => (
        <div key={mealType} className="menu-category">
          <h3>{mealType}</h3>
          <Dropdown
            value={cart[mealType]}
            options={getFilteredDishes(mealType)}
            onChange={(e) => handleDropdownChange(mealType, e.value)}
            optionLabel="nome"
            placeholder={`Select ${mealType}`}
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
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
    ];

    const getDishesByDay = (day) => {
      return weeklyMenu.filter((dish) => dish.dayOfWeek === day);
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
        <h2>Weekly Menu</h2>
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

    // Função para verificar se já existe uma prenotazione para o dia selecionado
    const checkExistingReservation = async () => {
      try {
        const token = getToken();
        const response = await axios.post(
          'http://localhost:8080/api/prenotazione/readByIdAndData',
          {
            idUser: user.userId,
            dataPrenotazione: `${dataPrenotazione}`,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Se a resposta retornar alguma prenotazione, significa que já existe uma reserva
        if (response.data == false) {
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error checking existing reservation:', error);
        setError('Errore durante la verifica della prenotazione esistente. Riprova.');
        return true; // Considera como existente em caso de erro
      }
    };

    // Verifique se o usuário já tem uma reserva para o dia
    const hasExistingReservation = await checkExistingReservation();

    if (hasExistingReservation) {
      setError('Hai già una prenotazione per questo giorno');
      return; // Impede que o pedido seja enviado
    }

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

      console.log(orderData);

      console.log('Submitting order:', JSON.stringify(orderData));
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
          console.log('Order submitted successfully');
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

  return (
    <div className='container-menu'>
      <h1>Menu</h1>
      <div className="date-selection">
        <Calendar
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.value)}
          dateFormat="dd/mm/yy"
          showIcon
          placeholder="Select a date"
        />
      </div>

      <div className="menu-button-container">
        <Button label="View Full Menu" onClick={handleViewFullMenu} className="menu-button" />
      </div>

      {selectedDay && (
        <>
          {renderOrderMenu()}
          {combinationStatus && <div className="combination-status">{combinationStatus}</div>}
          {error && <div className="error-message">{error}</div>}
          <Button
            label="Submit Order"
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