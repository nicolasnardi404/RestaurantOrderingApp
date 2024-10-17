import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Logo from '../assets/logoNetSurf.png';
import "../styles/RegisterStyle.css";

const RegisterPage = () => {
  const [nome, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const idRuolo = 2;
  const attivo = true;
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL;

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${apiUrl}/register`, {
        nome,
        email,
        password,
        idRuolo,
        attivo
      });
      navigate('/open-orders');
    } catch (error) {
      setErrorMessage("Registrazione fallita. Riprova.");
      console.error("Errore durante la registrazione:", error);
    }
  };

  return (
    <div className="container">
      <header>
        <img src={Logo} alt="Logo" className="logo" />
      </header>
      <div className="register-box">
        <form onSubmit={handleRegister}>
          <label htmlFor="name">Nome:</label>
          <input
            type="text"
            id="name"
            name="nome"
            value={nome}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {errorMessage && <p className="error-message">{errorMessage}</p>}

          <button type="submit" className="register-btn">Registrati</button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
