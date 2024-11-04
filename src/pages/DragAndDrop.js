import React, { useState, useCallback } from "react";
import { read, utils } from "xlsx";
import { useDropzone } from "react-dropzone";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import PiattiTable from "../components/PiattiTable";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Import useNavigate for React Router v6
import "../styles/DragAndDrop.css"; // Import the CSS file

export default function DragAndDrop() {
  const [piattiData, setPiattiData] = useState([]);
  const [fileDropped, setFileDropped] = useState(false);
  const apiUrl = process.env.REACT_APP_API_URL;
  const { getToken } = useAuth();
  const navigate = useNavigate(); // Initialize the navigate function

  const tipoPiattoMapping = {
    Primo: 1,
    Secondo: 2,
    Contorno: 3,
  };

  const processExcelData = (data) => {
    const worksheet = data.Sheets[data.SheetNames[0]];
    const rawData = utils.sheet_to_json(worksheet, { header: 1 });

    const processedData = [];
    let idCounter = 0;

    // Calculate the current week's Monday
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const baseDate = new Date(now.setDate(now.getDate() + mondayOffset));

    const weekDays = {
      LUNEDI: 0,
      MARTEDI: 1,
      MERCOLEDI: 2,
      GIOVEDI: 3,
      VENERDI: 4,
    };

    for (let i = 0; i < rawData.length; i += 2) {
      const row1 = rawData[i];
      const row2 = rawData[i + 1];

      if (row1 && row1[0]) {
        const dayName = row1[0].toUpperCase().trim();
        const currentDate = new Date(baseDate);
        currentDate.setDate(baseDate.getDate() + (weekDays[dayName] || 0));
        const formattedDate = currentDate.toISOString().split("T")[0];

        // Process Primo Piatto entries (Columns B and C)
        for (let j = 1; j <= 2; j++) {
          if (row1[j]) {
            processedData.push({
              id: idCounter++,
              nome: row1[j].trim(),
              tipo_piatto: tipoPiattoMapping["Primo"],
              data: formattedDate,
            });
          }
          if (row2[j]) {
            processedData.push({
              id: idCounter++,
              nome: row2[j].trim(),
              tipo_piatto: tipoPiattoMapping["Primo"],
              data: formattedDate,
            });
          }
        }

        // Process Secondo Piatto entries (Columns D and E)
        for (let j = 3; j <= 4; j++) {
          if (row1[j]) {
            processedData.push({
              id: idCounter++,
              nome: row1[j].trim(),
              tipo_piatto: tipoPiattoMapping["Secondo"],
              data: formattedDate,
            });
          }
          if (row2[j]) {
            processedData.push({
              id: idCounter++,
              nome: row2[j].trim(),
              tipo_piatto: tipoPiattoMapping["Secondo"],
              data: formattedDate,
            });
          }
        }

        // Process Contorno entries (Columns F, G, and H)
        for (let j = 5; j <= 7; j++) {
          if (row1[j]) {
            processedData.push({
              id: idCounter++,
              nome: row1[j].trim(),
              tipo_piatto: tipoPiattoMapping["Contorno"],
              data: formattedDate,
            });
          }
          if (row2[j]) {
            processedData.push({
              id: idCounter++,
              nome: row2[j].trim(),
              tipo_piatto: tipoPiattoMapping["Contorno"],
              data: formattedDate,
            });
          }
        }
      }
    }

    // Sort the data by date and tipo
    processedData.sort((a, b) => {
      if (a.data !== b.data) {
        return a.data.localeCompare(b.data);
      }
      return a.tipo_piatto - b.tipo_piatto;
    });

    setPiattiData(processedData);
    setFileDropped(true);
    console.log(processedData);
  };

  const hasEmptyFields = useCallback(() => {
    return piattiData.some(
      (piatto) => !piatto.nome || !piatto.tipo_piatto || !piatto.data
    );
  }, [piattiData]);

  const sendDataToServer = async () => {
    if (hasEmptyFields()) {
      alert("Compilare tutti i campi prima di inviare il menu.");
      return;
    }

    const token = getToken();
    try {
      console.log(piattiData);
      const response = await axios.post(
        `${apiUrl}/piatto/createDishes`,
        piattiData,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Add the token to the headers
          },
        }
      );

      console.log("Data successfully sent:", response.data);
      alert("Data saved successfully!");
      navigate("/gestione-menu"); // Navigate to the "Manage Piatti" page
    } catch (error) {
      console.error("Error sending data:", error);
      alert("Error saving data. Please try again.");
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = read(data, { type: "array" });
      processExcelData(workbook);
    };

    reader.readAsArrayBuffer(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
  });

  // Add this style to pass to PiattiTable
  const getRowClassName = (rowData) => {
    return !rowData.nome || !rowData.tipo_piatto || !rowData.data
      ? "invalid-row"
      : "";
  };

  // Add this new function to process data for grouped display
  const processDataForDisplay = (data) => {
    const groupedData = [];
    let currentDate = null;
    let dishesInCurrentDay = 0;

    // First pass to count dishes per day
    const dishesPerDay = data.reduce((acc, piatto) => {
      acc[piatto.data] = (acc[piatto.data] || 0) + 1;
      return acc;
    }, {});

    data.forEach((piatto) => {
      if (currentDate !== piatto.data) {
        // Reset counter and update current date
        dishesInCurrentDay = 0;
        currentDate = piatto.data;
        // Add the spanning information to the first dish of the day
        groupedData.push({
          ...piatto,
          isFirstOfDay: true,
          dishesInDay: dishesPerDay[piatto.data],
        });
      } else {
        // Regular dish row
        groupedData.push({
          ...piatto,
          isFirstOfDay: false,
        });
      }
      dishesInCurrentDay++;
    });
    return groupedData;
  };

  return (
    <div className="drag-and-drop-container">
      {!fileDropped && (
        <div
          {...getRootProps()}
          className={`drop-zone ${isDragActive ? "active" : ""}`}
        >
          <Card>
            <input {...getInputProps()} />
            <p>
              {isDragActive
                ? "Rilascia il file Excel qui..."
                : "Trascina e rilascia un file Excel qui, o clicca per selezionare"}
            </p>
          </Card>
        </div>
      )}

      {piattiData.length > 0 && (
        <>
          <PiattiTable
            data={processDataForDisplay(piattiData)}
            setData={setPiattiData}
            getRowClassName={getRowClassName}
          />
          {hasEmptyFields() && (
            <div>
              <h2 className="error-message-add-piatto">
                Attenzione: Compilare tutti i campi prima di inviare il menu
              </h2>
            </div>
          )}
          <div
            className="button-container"
            style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}
          >
            <Button
              label="Invia menu"
              onClick={sendDataToServer}
              disabled={hasEmptyFields()}
              style={{ backgroundColor: "green" }}
            />
          </div>
        </>
      )}
    </div>
  );
}
