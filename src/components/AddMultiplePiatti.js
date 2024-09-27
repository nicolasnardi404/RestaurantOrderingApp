import React, { useState, useRef } from 'react';
import { Button, Dropdown, Calendar } from 'primereact';
import { Toast } from 'primereact/toast';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { UseDataLocal } from '../util/UseDataLocal';
import { ITALIAN_LOCALE_CONFIG } from '../util/ItalianLocaleConfigData';
import '../styles/AddMultiplePiatti.css';

UseDataLocal(ITALIAN_LOCALE_CONFIG);

const AddMultiplePiatti = () => {
    const [piatti, setPiatti] = useState([{ nome_piatto: '', idTipoPiatto: 1, nome_tipo: 'Primo' }]);
    const [commonDate, setCommonDate] = useState(new Date());
    const toast = useRef(null);
    const { getToken } = useAuth();
    const token = getToken();

    const tipoPiattoOptions = [
        { label: "Primo", value: "Primo" },
        { label: "Secondo", value: "Secondo" },
        { label: "Contorno", value: "Contorno" },
        { label: "Piatto unico", value: "Piatto unico" },
    ];

    const addPiatto = () => {
        setPiatti([...piatti, { nome_piatto: '', idTipoPiatto: 1, nome_tipo: 'Primo' }]);
    };

    const removePiatto = (index) => {
        const updatedPiatti = piatti.filter((_, i) => i !== index);
        setPiatti(updatedPiatti);
    };

    const validatePiatti = () => {
        for (let i = 0; i < piatti.length; i++) {
            if (!piatti[i].nome_piatto) {
                showToast("error", "Validation Error", `Nome piatto is required for row ${i + 1}`);
                return false;
            }
        }
        return true;
    };

    const savePiatti = async () => {
        if (!validatePiatti()) return; // Stop if validation fails

        try {
            const api = axios.create({
                baseURL: "http://localhost:8080/api",
                headers: { Authorization: `Bearer ${token}` },
            });

            const piattiToSave = piatti.map(piatto => ({
                nome: piatto.nome_piatto,
                tipo_piatto: piatto.idTipoPiatto,
            }));

            const formattedDate = commonDate.toISOString().split("T")[0]; // Format to YYYY-MM-DD

            await api.post(`/piatto/createDishes/${formattedDate}`, piattiToSave);

            showToast("success", "Success", "Piatti added successfully");
            setPiatti([{ nome_piatto: '', idTipoPiatto: 1, nome_tipo: 'Primo' }]); // Reset the form
            setCommonDate(new Date()); // Reset the common date
        } catch (error) {
            console.error("Error saving piatti:", error);
            showToast("error", "Error", "Failed to save piatti");
        }
    };

    const showToast = (severity, summary, detail) => {
        if (toast.current) {
            toast.current.show({ severity, summary, detail });
        } else {
            console.error("Toast component is not initialized.");
        }
    };

    return (
        <div className="add-multiple-piatti">
            <Toast ref={toast} />
            <h1>Aggiungi Piatti del giorno</h1>
            <div className="p-field">
                <label htmlFor="commonDate">Data</label>
                <Calendar
                    id="commonDate"
                    value={commonDate}
                    onChange={(e) => setCommonDate(e.value)}
                    dateFormat="dd-mm-yy" // Set the date format to day-month-year
                    className="custom-calendar" // Add a custom class for styling
                />
            </div>
            <table className="p-table">
                <thead>
                    <tr>
                        <th>Nome Piatto</th>
                        <th>Tipo Piatto</th>
                        <th>Actions</th> {/* Added Actions column */}
                    </tr>
                </thead>
                <tbody>
                    {piatti.map((piatto, index) => (
                        <tr key={index}>
                            <td>
                                <input
                                    type="text"
                                    value={piatto.nome_piatto}
                                    onChange={(e) => {
                                        const updatedPiatti = [...piatti];
                                        updatedPiatti[index].nome_piatto = e.target.value;
                                        setPiatti(updatedPiatti);
                                    }}
                                />
                            </td>
                            <td>
                                <Dropdown
                                    className="weekday-selection"
                                    value={piatto.nome_tipo}
                                    options={tipoPiattoOptions}
                                    onChange={(e) => {
                                        const updatedPiatti = [...piatti];
                                        updatedPiatti[index].nome_tipo = e.value;
                                        updatedPiatti[index].idTipoPiatto = tipoPiattoOptions.findIndex(option => option.value === e.value) + 1;
                                        setPiatti(updatedPiatti);
                                    }}
                                    placeholder="Select a type"
                                    optionLabel="label"
                                />
                            </td>
                            <td>
                                <Button
                                    icon="pi pi-times"
                                    className="p-button-text custom-remove-btn" // Apply custom class
                                    onClick={() => removePiatto(index)} // Remove button for each row
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <Button label="Add Another Piatto" icon="pi pi-plus" onClick={addPiatto} />
            <Button label="Save All" icon="pi pi-check" onClick={savePiatti} />
        </div>
    );
};

export default AddMultiplePiatti;