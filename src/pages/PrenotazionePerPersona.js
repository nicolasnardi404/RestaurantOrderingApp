import { Dropdown } from "primereact/dropdown";
import PrenotazionePerPersonaComponent from "../components/PrenotazionePerPersonaComponent";
import UserMenu from "../components/UserMenu";
import { useEffect, useState } from "react";

export default function PrenotazionePerPersona(){
    [data, setData] = useState('')

    useEffect(()=>{
        fetch("http://localhost:8080/api/users")
        .then(response=>response.json)
        .then()
    })

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
    return(
    <div>
        <UserMenu/>
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
        <PrenotazionePerPersonaComponent idUser={idUser} />
    </div>
    )
}