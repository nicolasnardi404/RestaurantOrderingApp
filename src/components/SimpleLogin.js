import React, { useState, useEffect } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';

export default function SimpleLogin() {
  const [users, setUsers] = useState([]);
  const [selectedName, setSelectedName] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
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
        // Transform the data into an array of objects focusing only on nome and idUser
        const transformedUsers = Object.entries(data).map(([key, value]) => ({
          nome: value.nome,
          idUser: value.idUser
        }));
        setUsers(transformedUsers);
      })
      .catch(error => {
        console.error('There was a problem with the fetch operation: ', error);
      });
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (selectedName && selectedUserId) {
      localStorage.setItem('nome', selectedName);
      localStorage.setItem('idUser', selectedUserId.toString());
      console.log(localStorage);
      navigate('/menu');
    } else {
      alert("Please select a user");
    }
  };

  return (
    <form className='pick-user' onSubmit={handleSubmit}>
      <Dropdown 
        className='name-select' 
        options={users} 
        optionLabel="nome" 
        value={selectedName} 
        onChange={(e) => {
          setSelectedName(e.value.nome);
          setSelectedUserId(e.value.idUser);
        }}
        placeholder="--Scegliere il Nome--"
      />
      {/* Conditionally render the button */}
      {selectedName && (
        <Button label={selectedName} type="submit" className="btn-classic" />
      )}
    </form>
  );
}
