import React, { useState } from 'react';
import axios from 'axios';

const CsvUpload = () => {
  const [isOver, setIsOver] = useState(false);
  const [files, setFiles] = useState([]);

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsOver(false);
  };

  const parseCSV = (csvContent) => {
    const lines = csvContent.split("\r\n"); // Use "\r\n" for Windows line endings
    const headers = lines[0].split(",");
    const data = [];
  
    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i].split(/,(?=(?:[^\"]*"[^"]*")*(?![^\"]*"[^"]*$))/); // Split by comma, allowing quoted fields
      const obj = {};
  
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentLine[j];
      }
  
      data.push(obj);
    }
  
    return data;
  };
  
  const organizeData = (data) => {
    const dishes = [];
  
    data.forEach((row) => {
      const day = row["Giorno"] || ""; // Ensure day is a string to avoid errors
  
      ["Primi", "Secondi", "Contorni"].forEach((type) => {
        const dishesString = row[type] || ""; // Ensure there's a string to split
        dishesString.split("\n")
          .map((dish) => dish.trim())
          .filter(Boolean)
          .forEach((dish) => {
            dishes.push({ dish: dish, date: day, type: type });
          });
      });
    });
  
    return dishes;
  };
  
  

  const handleDrop = async (event) => {
    event.preventDefault();
    setIsOver(false);

    const droppedFiles = Array.from(event.dataTransfer.files);
    setFiles(droppedFiles);

    for (let file of droppedFiles) {
      const reader = new FileReader();

      reader.onloadend = async () => {
        const csvContent = reader.result;
        const parsedData = parseCSV(csvContent);
        const organizedData = organizeData(parsedData);

        // Sending JSON data to the server
        try {
          await axios.post('http://localhost:80/draganddrop', organizedData, {
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          console.log('Organized CSV data sent successfully');
        } catch (error) {
          console.error('Error sending organized CSV data:', error);
        }
      };

      reader.onerror = () => {
        console.error("There was an issue reading the file.");
      };

      reader.readAsText(file);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "50px",
        width: "300px",
        border: "1px dotted",
        backgroundColor: isOver ? "lightgray" : "white",
      }}
    >
      Drag and drop some files here
    </div>
  );
};

export default CsvUpload;
