import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SimpleLogin() {
  const [names, setNames] = useState([]);
  const [selectedName, setSelectedName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost/project/users')
      .then(response => response.json())
      .then(data => setNames(data.data))
      .catch(error => console.error('Error fetching names:', error));
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    localStorage.setItem('nome', selectedName);
    alert(`Selected name saved: ${selectedName}`);
    navigate('/menu');
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="nameSelect">Choose a name:</label>
      <select id="nameSelect" value={selectedName} onChange={(e) => setSelectedName(e.target.value)}>
        <option value="">--Please choose a name--</option>
        {names.map((item, index) => (
          <option key={index} value={item.nome}>{item.nome}</option>
        ))}
      </select>
      <button type="submit">Submit</button> 
    </form>
  );
}
