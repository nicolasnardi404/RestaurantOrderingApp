import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/ProfilePage.css';

export default function ProfilePage() {
  const { user, getToken } = useAuth();
  const [selectedDays, setSelectedDays] = useState([]);
  const [hasWarnings, setHasWarnings] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const token = await getToken();
        const response = await axios.get(`http://localhost:8080/api/avviso/readById/${user.userId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        // Processa a resposta para definir os dias selecionados
        if (response.data && Array.isArray(response.data)) {
          const alerts = response.data.filter(alert => alert.idUser === user.userId);
          const days = alerts.map(alert => alert.giorno);
          setSelectedDays(days);
          setHasWarnings(days.length > 0);
        }
      } catch (error) {
        console.error('Errore nel recupero degli giorni prenotazione:', error);
      }
    };

    fetchAlerts();
  }, [getToken, user.userId]);

  const daysOfWeek = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì'];

  const handleChange = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = await getToken();
    const data = {
      idUser: user.userId,
      alerts: selectedDays
    };

    try {
      await axios.post('http://localhost:8080/api/avviso/create', data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setHasWarnings(true);
    } catch (error) {
      console.error('Errore nella creazione degli giorni prenotazione:', error);
    }
  };

  const handleDelete = async () => {
    const token = await getToken();
    try {
      await axios.delete(`http://localhost:8080/api/avviso/delete/${user.userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSelectedDays([]);
      setHasWarnings(false);
    } catch (error) {
      console.error('Errore nella cancellazione giorni prenotazione:', error);
    }
  };

  return (
    <div className="profile-page">
      <h1 className="profile-title">Profilo Utente</h1>
      <div className="profile-details">
        <p className="profile-detail"><strong>Nome:</strong> {user.nome}</p>
        <p className="profile-detail"><strong>Ruolo:</strong> {user.ruolo}</p>
        <p className="profile-detail"><strong>Giorni di Prenotazione:</strong> {selectedDays.join(', ') || 'Nessuno'}</p>
      </div>

      {!hasWarnings ? (
        <form onSubmit={handleSubmit} className="warning-form">
          <h2 className="form-title">Selezionare Giorni di Prenotazione</h2>
          {daysOfWeek.map((day) => (
            <div key={day} className="day-checkbox">
              <label className="day-label">
                <input
                  type="checkbox"
                  className="day-input"
                  checked={selectedDays.includes(day)}
                  onChange={() => handleChange(day)}
                />
                {day}
              </label>
            </div>
          ))}
          <button type="submit" className="save-button">Salva</button>
        </form>
      ) : (
        <div className="update-section">
          <h2 className="update-title">Aggiornare Giorni di Prenotazione</h2>
          <button onClick={handleDelete} className="delete-button">Elimina Prenotazione Precedenti</button>
          <p className="update-message">Hai già fatto giorni di prenotazione. Se desideri aggiornare, elimina prima i precedenti.</p>
        </div>
      )}
    </div>
  );
}