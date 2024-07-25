    import React, { useState } from 'react';
    import axios from 'axios';

    const CsvUpload = () => {
    const [isOver, setIsOver] = useState(false);
    const [files, setFiles] = useState([]);
    const [editableData, setEditableData] = useState([]);
    const [newItem, setNewItem] = useState({
        dish: '',
        date: '',
        type: '',
    });
    const [fileDropped, setFileDropped] = useState(false);

    const sendDataToServer = async () => {
        try {
          const response = await axios.post("http://localhost:80/project/draganddrop", editableData);
          console.log(response.data);
          // Reset state after successful send
          setEditableData([]); // Clear the editable data
          setNewItem({ dish: '', date: '', type: '' }); // Reset the new item state
          setFiles([]); // Clear the files array
          setFileDropped(false); // Re-enable the drag-and-drop area
        } catch (error) {
          console.error(error.response.data); 
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
            obj[headers[j]] = currentLine[j];
        }

        data.push(obj);
        }


        return data;
    };

    const organizeData = (data) => {
        const dishes = [];

        data.forEach((row) => {
        const day = row["Giorno"] || "";
        ["Primi", "Secondi", "Contorni"].forEach((type) => {
            const dishesString = row[type] || "";
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

            const editableFormat = organizedData.map(item => ({
            dish: item.dish,
            date: item.date,
            type: item.type,
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
        setNewItem({ dish: '', date: '', type: '' });
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
                      <td className='dish-item'>
                        <input
                          type="text"
                          value={item.dish}
                          onChange={handleInputChange(index, 'dish')}
                        />
                      </td>
                      <td className='day-item'>
                        <select value={item.type} onChange={(e) => handleInputChange(index, 'type')(e)}>
                          <option value="Lunedì">Lunedì</option>
                          <option value="Martedì">Martedì</option>
                          <option value="Mercoledì">Mercoledì</option>
                          <option value="Giovedì">Giovedì</option>
                          <option value="Venerdì">Venerdì</option>
                        </select>
                      </td>
                      <td className='type-item'>
                        <select value={item.type} onChange={(e) => handleInputChange(index, 'tipo')(e)}>
                          <option value="Primi">Primi</option>
                          <option value="Secondi">Secondi</option>
                          <option value="Contorni">Contorni</option>
                        </select>
                      </td>
                      <td>
                        <label>
                          <button onClick={() => removeItem(index)}>X</button>
                        </label>
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
