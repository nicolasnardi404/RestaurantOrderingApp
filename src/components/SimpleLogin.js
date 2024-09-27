import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from '../context/AuthContext';
import Logo from '../assets/logoNetSurf.png';
import "../styles/LoginStyle.css";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [rememberMe, setRememberMe] = useState(false); // Novo estado para manter-se conectado
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:8080/api/login', {
        email,
        password
      });

      const token = response.data.token;

      // Passar o valor de rememberMe para a função de login
      login(token, rememberMe);

      navigate('/open-orders');
    } catch (error) {
      setErrorMessage("Login failed. Please check your credentials.");
      console.error("There was an error logging in!", error);
    }
  };

  return (
    <div className="container">
      <header>
        <img src={Logo} alt="Logo" className="logo" />
        <Link to="/register">
          <button className="register-btn-inLog">Register</button>
        </Link>
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

          <label>
            Rimani connesso
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
          </label>

          <Link to="/register">
            <p className="register-msg">Bisogna ancora fare il registro</p>
          </Link>

          <button type="submit" className="login-btn">Accedi</button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;