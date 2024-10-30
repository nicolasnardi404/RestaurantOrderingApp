import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Logo from "../assets/logoNetSurf.png";
import "../styles/LoginStyle.css";
import "../App.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [rememberMe, setRememberMe] = useState(false); // Novo estado para manter-se conectado
  const navigate = useNavigate();
  const { login } = useAuth();
  const apiUrl = process.env.REACT_APP_API_URL;

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${apiUrl}/login`, {
        email,
        password,
      });

      const token = response.data.token;

      // Passar o valor de rememberMe para a função de login
      login(token, rememberMe);

      navigate("/ordini-aperti");
    } catch (error) {
      setErrorMessage("Accesso non riuscito. Controlla le tue credenziali.");
      console.error("There was an error logging in!", error);
    }
  };

  return (
    <div className="container">
      <header>
        <img src={Logo} alt="Logo" className="logo" />
      </header>
      <div className="login-box">
        <form onSubmit={handleLogin}>
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

          <div className="rimani-line">
            <label>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Rimani connesso
            </label>
          </div>

          <button type="submit" className="login-btn">
            Accedi
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
