import React, { useState } from 'react';
import axios from 'axios';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
        

const CsvUpload = () => {
    const [isOver, setIsOver] = useState(false);
    const [files, setFiles] = useState([]);
    const [editableData, setEditableData] = useState([]);
    const [newItem, setNewItem] = useState({
        nome: '',
        data: '',
        tipo: '',
    });
    const [fileDropped, setFileDropped] = useState(false);

   const giorniSettimanaOptions = [
    { label: 'Lunedì', value: 'Lunedì' },
    { label: 'Martedì', value: 'Martedì' },
    { label: 'Mercoledì', value: 'Mercoledì' },
    { label: 'Giovedì', value: 'Giovedì' },
    { label: 'Venerdì', value: 'Venerdì' },
];

const tipoOptions = [
    { label: 'Primi', value: 'Primi' },
    { label: 'Secondi', value: 'Secondi' },
    { label: 'Contorni', value: 'Contorni' },
];

    const tipoMapping = {
        "Primi": 1,
        "Secondi": 2,
        "Contorni": 3,
    };

    const sendDataToServer = async () => {
        // Convert tipo to ID before sending
        const dataToSend = editableData.map(item => ({
            ...item,
            tipo: tipoMapping[item.tipo] || item.tipo
        }));

        try {
            const response = await axios.post("http://localhost:80/project/draganddrop", dataToSend, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            console.log(response.data);
            // Reset state after successful send
            setEditableData([]);
            setNewItem({ nome: '', data: '', tipo: '' });
            setFiles([]);
            setFileDropped(false);
        } catch (error) {
            console.error(error.response ? error.response.data : error.message); 
        }
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        setIsOver(true);
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        setIsOver(false);
    };

    const parseCSV = (csvContent) => {
        const lines = csvContent.split("\r\n");
        const headers = lines[0].split(",");
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const currentLine = lines[i].split(/,(?=(?:[^\"]*"[^"]*")*(?![^\"]*"[^"]*$))/);
            const obj = {};

            for (let j = 0; j < headers.length; j++) {
                obj[headers[j]] = currentLine[j] ? currentLine[j].replace(/[\r\n]+/g, ' ').trim() : '';
            }

            data.push(obj);
        }

        return data;
    };

    const organizeData = (data) => {
        const nomes = [];
    
        data.forEach((row) => {
            const inputData = row["Giorno"] || "";
            let matchedDay;
    
            // Normalize the input day name by removing accents and other non-alphanumeric characters
            const normalizedInput = inputData.toLowerCase().replace(/[^\w\s]/gi, '')
            .replace('lunedi', 'lunedì')
            .replace('martedi', 'martedì')
            .replace('mercoledi', 'mercoledì')
            .replace('giovedi', 'giovedì')
            .replace('venerdi', 'venerdì');
    
            // Find the closest match for the "Giorno" value
            giorniSettimanaOptions.forEach(option => {
                if (normalizedInput.includes(option.value.toLowerCase())) {
                    matchedDay = option;
                }
            });
    
            if (!matchedDay) {
                matchedDay = { label: inputData, value: inputData }; // Fallback to raw input if no match found
            }
    
            ["Primi", "Secondi", "Contorni"].forEach((tipo) => {
                const nomesString = row[tipo] || "";
                nomesString.split("\n")
                  .map((nome) => nome.trim())
                  .filter(Boolean)
                  .forEach((nome) => {
                        nomes.push({ nome: nome, data: matchedDay.value, tipo: tipo });
                    });
            });
        });
    
        return nomes;
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

                const editableFormat = organizedData.map(item => ({
                    nome: item.nome,
                    data: item.data,
                    tipo: item.tipo,
                }));

                setEditableData(editableFormat);
            };

            reader.onerror = () => {
                console.error("There was an issue reading the file.");
            };

            reader.readAsText(file);
        }
        setFileDropped(true); 
    };

    const removeItem = (index) => {
        const newData = [...editableData];
        newData.splice(index, 1);
        setEditableData(newData);
    };

    const addItem = () => {
        setEditableData([...editableData, newItem]);
        setNewItem({ nome: '', data: '', tipo: '' });
    };

    const handleInputChange = (index, fieldName) => (event) => {
        const updatedItems = [...editableData];
        updatedItems[index][fieldName] = event.value; // Note: Use event.value for Dropdown
        setEditableData(updatedItems);
    };

    const renderNome = (rowData, { rowIndex }) => (
        <InputText
            className="input-text"
            type="text"
            value={rowData.nome}
            onChange={(e) => handleInputChange(rowIndex, 'nome')(e)}
        />
    );

    const renderData = (rowData, { rowIndex }) => (
        <Dropdown
            value={rowData.data}
            options={giorniSettimanaOptions}
            onChange={(e) => handleInputChange(rowIndex, 'data')(e)}
            placeholder="Select a Day"
        />
    );

    const renderTipo = (rowData, { rowIndex }) => (
        <Dropdown
            value={rowData.tipo}
            options={tipoOptions}
            onChange={(e) => handleInputChange(rowIndex, 'tipo')(e)}
            placeholder="Select a Type"
        />
    );

    const renderRemove = (rowData, { rowIndex }) => (
        <Button icon="pi pi-times" className="p-button-rounded p-button-outlined" onClick={() => removeItem(rowIndex)} />
    );

    return (
        <div>
            {!fileDropped && (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className='drag-drop'
                    style={{ backgroundColor: isOver ? "lightgray" : "white" }}
                >
                    Drag and drop some files here
                </div>
            )}
            {fileDropped && (
                <div>
                    <DataTable className='data-table' stripedRows value={editableData}>
                        <Column className='data-piatto' body={renderNome} header="Piatto" />
                        <Column body={renderData} header="Giorno" />
                        <Column body={renderTipo} header="Tipo" />
                        <Column body={renderRemove} header="Remove" />
                    </DataTable>
                    <div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            addItem();
                        }}>
                            <Button className='btn-classic' type="submit">Aggiungere Piatto</Button>
                        </form>
                        <Button className='btn-test btn-classic' onClick={sendDataToServer}>Inviare il Menu</Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CsvUpload;