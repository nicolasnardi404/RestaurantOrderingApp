import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="profile-page">
      <h1>Profilo Utente</h1>
      <div className="profile-details">
        <p><strong>Nome:</strong> {user.nome}</p>
        <p><strong>Ruolo:</strong> {user.ruolo}</p>
      </div>
    </div>
  );
}
