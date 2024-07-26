import React, { useState, useEffect } from 'react';
import { Dropdown } from 'primereact/dropdown'; // Import Dropdown for more complex scenarios
import { Button } from 'primereact/button'; // Import Button for consistent styling
import { useNavigate } from 'react-router-dom';

export default function SimpleLogin() {
  const [names, setNames] = useState([]);
  const [selectedName, setSelectedName] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost/project/users')
      .then(response => response.json())
      .then(data => setNames(data.data))
      .catch(error => console.error('Error fetching names:', error));
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    localStorage.setItem('nome', selectedName ? selectedName.nome : '');
    alert(`Selected name saved: ${selectedName ? selectedName.nome : ''}`);
    navigate('/menu');
  };

  return (
    <form className='pick-user' onSubmit={handleSubmit}>
      <Dropdown 
        className='name-select' 
        options={names} 
        optionLabel="nome" 
        value={selectedName} 
        onChange={(e) => setSelectedName(e.value)}
        placeholder="--Scegliere il Nome--"
      />
      <Button label="Submit" type="submit" className="p-button-outlined" /> 
    </form>
  );
}
