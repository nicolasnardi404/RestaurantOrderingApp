import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminPage.css';

const AdminPage = () => {
    const navigate = useNavigate();

    const handleRedirect = (path) => {
        navigate(path);
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Pagina di Amministrazione</h1>
            <button onClick={() => handleRedirect('/register')} className="button-admin">
                Registrazione
            </button>
            <button onClick={() => handleRedirect('/managepiatti')} className="button-admin">
                Menu
            </button>
            <button onClick={() => handleRedirect('/users')} className="button-admin">
                Gestione Utenti
            </button>
            <button onClick={() => handleRedirect('/ordiniAdmin')} className="button-admin">
                Ordine Admin
            </button>
        </div>
    );
};

export default AdminPage;
