import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/ProfilePage.css';

export default function ProfilePage() {
  const { user } = useAuth();
  const [selectedDays, setSelectedDays] = useState([]);
  const [hasWarnings, setHasWarnings] = useState(false);

  useEffect(() => {
    const storedWarnings = localStorage.getItem(user.userId);
    if (storedWarnings) {
      setSelectedDays(JSON.parse(storedWarnings));
      setHasWarnings(true);
    }
  }, [user.userId]);

  const daysOfWeek = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì'];

  const handleChange = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (hasWarnings) {
      localStorage.removeItem(user.userId); // Elimina avvisi precedenti
    }
    const data = {
      idUser: user.userId,
      alerts: selectedDays
    };

    localStorage.setItem("alerts", JSON.stringify(data));
    setHasWarnings(true);
  };

  const handleDelete = () => {
    localStorage.removeItem(user.userId);
    setSelectedDays([]);
    setHasWarnings(false);
  };

  return (
    <div className="profile-page">
      <h1 className="profile-title">Profilo Utente</h1>
      <div className="profile-details">
        <p className="profile-detail"><strong>Nome:</strong> {user.nome}</p>
        <p className="profile-detail"><strong>Ruolo:</strong> {user.ruolo}</p>
        <p className="profile-detail"><strong>Giorni di Avviso:</strong> {selectedDays.join(', ') || 'Nessuno'}</p>
      </div>

      {!hasWarnings ? (
        <form onSubmit={handleSubmit} className="warning-form">
          <h2 className="form-title">Selezionare Giorni di Avviso</h2>
          {daysOfWeek.map((day) => (
            <div key={day} className="day-checkbox">
              <label className="day-label">
                {day}
                <input
                  type="checkbox"
                  className="day-input"
                  checked={selectedDays.includes(day)}
                  onChange={() => handleChange(day)}
                />
              </label>
            </div>
          ))}
          <button type="submit" className="save-button">Salva</button>
        </form>
      ) : (
        <div className="update-section">
          <h2 className="update-title">Aggiornare Giorni di Avviso</h2>
          <button onClick={handleDelete} className="delete-button">Elimina Avvisi Precedenti</button>
          <p className="update-message">Hai già fatto avvisi. Se desideri aggiornare, elimina prima i precedenti.</p>
        </div>
      )}
    </div>
  );
}