import React, { useState } from 'react';
import axios from 'axios';

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
            const data = row["Giorno"] || "";
            ["Primi", "Secondi", "Contorni"].forEach((tipo) => {
                const nomesString = row[tipo] || "";
                nomesString.split("\n")
                    .map((nome) => nome.trim())
                    .filter(Boolean)
                    .forEach((nome) => {
                        nomes.push({ nome: nome, data: data, tipo: tipo });
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
        updatedItems[index][fieldName] = event.target.value;
        setEditableData(updatedItems);
    };

    return (
        <div>
            {!fileDropped && (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className='drag-drop'
                    style={{
                        backgroundColor: isOver ? "lightgray" : "white",
                    }}
                >
                    Drag and drop some files here
                </div>
            )}
            {fileDropped && (
                <div>
                    <table className='container-table'>
                        <thead>
                            <tr>
                                <th>Piatto</th>
                                <th>Giorno</th>
                                <th>Tipo</th>
                                <th>Remove</th>
                            </tr>
                        </thead>
                        <tbody className='container-body'>
                            {editableData.map((item, index) => (
                                <tr className="container-row" key={index}>
                                    <td className='nome-item'>
                                        <input
                                            type="text"
                                            value={item.nome}
                                            onChange={handleInputChange(index, 'nome')}
                                        />
                                    </td>
                                    <td className='data-item'>
                                        <select value={item.data} onChange={(e) => handleInputChange(index, 'data')(e)}>
                                            <option value="Lunedì">Lunedì</option>
                                            <option value="Martedì">Martedì</option>
                                            <option value="Mercoledì">Mercoledì</option>
                                            <option value="Giovedì">Giovedì</option>
                                            <option value="Venerdì">Venerdì</option>
                                        </select>
                                    </td>
                                    <td className='tipo-item'>
                                        <select value={item.tipo} onChange={(e) => handleInputChange(index, 'tipo')(e)}>
                                            <option value="Primi">Primi</option>
                                            <option value="Secondi">Secondi</option>
                                            <option value="Contorni">Contorni</option>
                                        </select>
                                    </td>
                                    <td>
                                        <button onClick={() => removeItem(index)}>X</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            addItem();
                        }}>
                            <button className='btn-classic' type="submit">Add Item</button>
                        </form>
                        <button className='btn-classic' onClick={sendDataToServer}>Submit All Data</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CsvUpload;
