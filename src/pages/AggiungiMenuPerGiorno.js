import React, { useState, useRef } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { UseDataLocal } from "../util/UseDataLocal";
import { ITALIAN_LOCALE_CONFIG } from "../util/ItalianLocaleConfigData";
import { formatCalendarData } from "../util/FormatCalendarData";
import { Calendar } from "primereact/calendar";
import "../util/addLocale";
import "../styles/AggiungiMenuPerGiorno.css";

UseDataLocal(ITALIAN_LOCALE_CONFIG);

export default function AggiungiMenuPerGiorno() {
  const [piatti, setPiatti] = useState([
    { nome_piatto: "", idTipoPiatto: 1, nome_tipo: "Primo" },
  ]);
  const [commonDate, setCommonDate] = useState(new Date());
  const toast = useRef(null);
  const { getToken } = useAuth();
  const token = getToken();
  const apiUrl = process.env.REACT_APP_API_URL;

  const tipoPiattoOptions = [
    { label: "Primo", value: "Primo" },
    { label: "Secondo", value: "Secondo" },
    { label: "Contorno", value: "Contorno" },
    { label: "Piatto unico", value: "Piatto unico" },
  ];

  const addPiatto = () => {
    setPiatti([
      ...piatti,
      { nome_piatto: "", idTipoPiatto: 1, nome_tipo: "Primo" },
    ]);
  };

  const removePiatto = (index) => {
    const updatedPiatti = piatti.filter((_, i) => i !== index);
    setPiatti(updatedPiatti);
  };

  const validatePiatti = () => {
    for (let i = 0; i < piatti.length; i++) {
      if (!piatti[i].nome_piatto) {
        showToast(
          "error",
          "Errore di validazione",
          `Il nome del piatto è obbligatorio per la riga ${i + 1}`
        );
        return false;
      }
    }
    return true;
  };

  const savePiatti = async () => {
    if (!validatePiatti()) return; // Stop if validation fails

    try {
      const api = axios.create({
        baseURL: `${apiUrl}`,
        headers: { Authorization: `Bearer ${token}` },
      });

      const piattiToSave = piatti.map((piatto) => ({
        nome: piatto.nome_piatto,
        tipo_piatto: piatto.idTipoPiatto,
        data: formatCalendarData(commonDate),
      }));

      const formattedDate = formatCalendarData(commonDate); // Format to YYYY-MM-DD
      console.log(piatti);
      await api.post(`/piatto/createDishes`, piattiToSave);

      showToast("success", "Successo", "Piatti aggiunti con successo");
      setPiatti([{ nome_piatto: "", idTipoPiatto: 1, nome_tipo: "Primo" }]); // Reset the form
      setCommonDate(new Date()); // Reset the common date
    } catch (error) {
      console.error("Error saving piatti:", error);
      showToast("error", "Errore", "Impossibile salvare i piatti");
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
      <h2>Aggiungi Piatti del giorno</h2>
      <Toast ref={toast} />
      <div className="content-wrapper">
        <div className="date-picker">
          <div className="p-field">
            <Calendar
              id="commonDate"
              value={commonDate}
              onChange={(e) => setCommonDate(e.value)}
              locale="it"
              dateFormat="D. dd/mm/y"
              className="w-full"
            />
          </div>
        </div>
        <div className="p-datatable p-component">
          <div className="p-datatable-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nome Piatto</th>
                  <th>Tipo Piatto</th>
                  <th>Azione</th>
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
                        className="input-nome-piatto"
                      />
                    </td>
                    <td>
                      <Dropdown
                        value={piatto.nome_tipo}
                        options={tipoPiattoOptions}
                        onChange={(e) => {
                          const updatedPiatti = [...piatti];
                          updatedPiatti[index].nome_tipo = e.value;
                          updatedPiatti[index].idTipoPiatto =
                            tipoPiattoOptions.findIndex(
                              (option) => option.value === e.value
                            ) + 1;
                          setPiatti(updatedPiatti);
                        }}
                        placeholder="Seleziona un tipo"
                        optionLabel="label"
                        className="dropdown-tipo-piatto"
                      />
                    </td>
                    <td>
                      <Button
                        icon="pi pi-trash"
                        className="button-danger-delete"
                        onClick={() => removePiatto(index)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="button-container">
          <Button
            label="Aggiungi un altro piatto"
            icon="pi pi-plus"
            onClick={addPiatto}
            className="p-button-primary"
          />
          <Button
            label="Salva tutto"
            icon="pi pi-check"
            onClick={savePiatti}
            className="p-button-primary"
          />
        </div>
      </div>
    </div>
  );
}
