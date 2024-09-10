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
    fetch('http://localhost:8080/api/user/read')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json(); // Convert the response to JSON
      })
      .then(data => {
        console.log(data)
        const transformedUsers = Object.entries(data).map(([key, value]) => ({
          nome: value.nome,
          id: value.id
        }));
        setUsers(transformedUsers);
      })
      .catch(error => {
        console.error('There was a problem with the fetch operation: ', error);
      });
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (selectedName) {
      localStorage.setItem('nome', selectedName);
      localStorage.setItem('id', selectedUserId);
      console.log(localStorage);
      navigate('/menu');
    } else {
      alert("Please select a user");
    }
  };

  // Function to update the placeholder based on the selected name
  const updatePlaceholder = () => {
    if (selectedName) {
      return `${selectedName}`;
    }
    return "--Scegliere il Nome--";
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
          setSelectedUserId(e.value.id);
        }}
        placeholder={updatePlaceholder()}
      />
      {/* Conditionally render the button */}
      {selectedName && (
        <Button label={selectedName} type="submit" className="btn-classic" />
      )}
    </form>
  );
}
