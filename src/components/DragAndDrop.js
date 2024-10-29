import React, { useState, useCallback } from "react";
import { read, utils } from "xlsx";
import { useDropzone } from "react-dropzone";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import PiattiTable from "./PiattiTable";
import axios from "axios";

export default function DragAndDrop() {
  const [piattiData, setPiattiData] = useState([]);
  const [fileDropped, setFileDropped] = useState(false);
  const apiUrl = process.env.REACT_APP_API_URL;
  const tipoPiattoOptions = [
    { label: "Primo", value: "Primo" },
    { label: "Secondo", value: "Secondo" },
    { label: "Contorno", value: "Contorno" },
    { label: "Piatto unico", value: "Piatto unico" },
  ];

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
              nome_piatto: row1[j].trim(),
              tipo_piatto: "Primo",
              data: formattedDate,
            });
          }
          if (row2[j]) {
            processedData.push({
              id: idCounter++,
              nome_piatto: row2[j].trim(),
              tipo_piatto: "Primo",
              data: formattedDate,
            });
          }
        }

        // Process Secondo Piatto entries (Columns D and E)
        for (let j = 3; j <= 4; j++) {
          if (row1[j]) {
            processedData.push({
              id: idCounter++,
              nome_piatto: row1[j].trim(),
              tipo_piatto: "Secondo",
              data: formattedDate,
            });
          }
          if (row2[j]) {
            processedData.push({
              id: idCounter++,
              nome_piatto: row2[j].trim(),
              tipo_piatto: "Secondo",
              data: formattedDate,
            });
          }
        }

        // Process Contorno entries (Columns F, G, and H)
        for (let j = 5; j <= 7; j++) {
          if (row1[j]) {
            processedData.push({
              id: idCounter++,
              nome_piatto: row1[j].trim(),
              tipo_piatto: "Contorno",
              data: formattedDate,
            });
          }
          if (row2[j]) {
            processedData.push({
              id: idCounter++,
              nome_piatto: row2[j].trim(),
              tipo_piatto: "Contorno",
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
      return a.tipo_piatto.localeCompare(b.tipo_piatto);
    });

    setPiattiData(processedData);
    setFileDropped(true);
    console.log(processedData);
  };

  const sendDataToServer = async () => {
    try {
      const response = await axios.post(
        `${apiUrl}/piatto/createDishes`,
        piattiData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Data successfully sent:", response.data);
      alert("Data saved successfully!");
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

  return (
    <div className="card p-4">
      {!fileDropped && (
        <div {...getRootProps()}>
          <Card
            className={`text-center cursor-pointer ${isDragActive ? "bg-blue-50" : ""}`}
            style={{
              border: "2px dashed #ccc",
              padding: "2rem",
              marginBottom: "2rem",
            }}
          >
            <input {...getInputProps()} />
            <p className="m-0">
              {isDragActive
                ? "Drop the Excel file here..."
                : "Drag and drop an Excel file here, or click to select"}
            </p>
          </Card>
        </div>
      )}

      {piattiData.length > 0 && (
        <>
          <PiattiTable data={piattiData} setData={setPiattiData} />
          <Button
            label="Save Data"
            onClick={sendDataToServer}
            className="p-button-success mt-3"
          />
        </>
      )}
    </div>
  );
}
