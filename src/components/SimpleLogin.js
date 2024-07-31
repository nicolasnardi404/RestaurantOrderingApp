import React, { useState, useEffect } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';

export default function SimpleLogin() {
  const [names, setNames] = useState([]);
  const [selectedName, setSelectedName] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:8080/api/users')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json(); // Convert the response to JSON
      })
      .then(data => {
        // Directly set the names in the state by mapping over the fetched data
        const namesFromData = data.map(item => item.nome);
        setNames(namesFromData); // Set the state with the extracted names
      })
      .catch(error => {
        console.error('There was a problem with the fetch operation: ', error);
      });
  }, []);
  

  const handleSubmit = (event) => {
    event.preventDefault();
    localStorage.setItem('nome', selectedName ? selectedName : '');
    console.log(localStorage)
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
      {/* Conditionally render the button */}
      {selectedName && (
        <Button label={selectedName} type="submit" className="btn-classic" />
      )}
    </form>
  );
}
