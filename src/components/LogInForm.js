import React, { useState } from "react";
import axios from 'axios'; // Ensure axios is installed via npm or yarn
import '../App.css';

UseDataLocal(ITALIAN_LOCALE_CONFIG);

export default function LogInForm() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const sendData = async (event) => {
        event.preventDefault(); // Prevent default form submission behavior

        const dataToSend = { name, email };

        try {
            const response = await axios.post("http://localhost:80/project/login", dataToSend, {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('Error submitting login data:', error); // Handle errors
        }
    }

    return (
        <div>
            <form className="login" onSubmit={sendData}>
                <label className="item-login" htmlFor="name">Name:</label>
                <input className="item-login" type="text" id="name" name="name" value={name} onChange={(e) => setName(e.target.value)}></input>
                <label className="item-login" htmlFor="email">Email:</label>
                <input className="item-login" type="email" id="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)}></input>
                <button className="item-login" type="submit">Log in</button>
            </form>
        </div>
    );
}
