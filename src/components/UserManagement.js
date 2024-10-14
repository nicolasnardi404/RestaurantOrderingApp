import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/UserManagement.css';

const GestioneUtenti = () => {
  const [utenti, setUtenti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getToken } = useAuth();

  useEffect(() => {
    fetchUtenti();
  }, []);

  const fetchUtenti = async () => {
    try {
      const token = getToken();
      const response = await axios.get('http://localhost:8080/api/user/read', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUtenti(response.data);
    } catch (err) {
      setError('Errore nel caricamento degli utenti');
    } finally {
      setLoading(false);
    }
  };

  const updateUtente = async (idUtente) => {
    try {
      const userDetails = await getUserDetails(idUtente);

      // Obtendo novos valores para todos os campos necessários
      const nuovoNome = prompt('Inserisci il nuovo nome:', userDetails.nome);
      const nuovoEmail = prompt('Inserisci il nuovo email:', userDetails.email);
      const nuovaPassword = prompt('Inserisci la nuova password:', ''); // Pode deixar vazio por segurança
      const nuovoIdRuolo = prompt('Inserisci il nuovo ID Ruolo:', userDetails.idRuolo); // Novo campo
      const nuovoAttivo = prompt('L\'utente è attivo? (true/false):', userDetails.attivo); // Novo campo

      // Verificando se todos os dados necessários foram preenchidos
      if (nuovoNome && nuovoEmail && nuovaPassword && nuovoIdRuolo && nuovoAttivo) {
        const token = getToken();
        await axios.put(`http://localhost:8080/api/user/update/${idUtente}`, {
          nome: nuovoNome,
          email: nuovoEmail,
          password: nuovaPassword,
          idRuolo: nuovoIdRuolo, // Enviando o novo idRuolo
          attivo: nuovoAttivo === 'true', // Convertendo para boolean
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchUtenti(); // Atualiza a lista de usuários
      } else {
        alert('Todos os campos devem ser preenchidos.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Errore nell\'aggiornamento dell\'utente');
    }
  };

  const getUserDetails = async (idUtente) => {
    const token = getToken();
    const response = await axios.get(`http://localhost:8080/api/user/readById/${idUtente}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  };

  const deleteUtente = async (idUtente) => {
    if (window.confirm('Sei sicuro di voler eliminare questo utente?')) {
      try {
        const token = getToken();
        await axios.delete(`http://localhost:8080/api/user/delete/${idUtente}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchUtenti(); // Ricarica la lista dopo l'eliminazione
      } catch (err) {
        setError('Errore nell\'eliminazione dell\'utente');
      }
    }
  };

  if (loading) return <div className="loading">Caricamento...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="container">
      <h1 className="title">Gestione Utenti</h1>
      <ul className="user-list">
        {utenti.map(utente => (
          <li className="user-item" key={utente.id}>
            {utente.nome} ({utente.email})
            <div className="button-group">
              <button className="button" onClick={() => updateUtente(utente.id)}>Modifica</button>
              <button className="button" onClick={() => deleteUtente(utente.id)}>Elimina</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GestioneUtenti;