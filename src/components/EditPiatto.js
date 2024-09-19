import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/EditPiatto.css';
import Delete from '../assets/icons8-delete-25.png';
import Edit from '../assets/icons8-edit-24.png';

function ManagePiatti() {
  const [weeklyPiatti, setWeeklyPiatti] = useState([]);
  const [editingPiatto, setEditingPiatto] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isNewPiatto, setIsNewPiatto] = useState(false);
  const toast = useRef(null);
  const { getToken } = useAuth();
  const token = getToken();

  const tipoPiattoOptions = [
    { label: 'Primo', value: 'Primo' },
    { label: 'Secondo', value: 'Secondo' },
    { label: 'Contorno', value: 'Contorno' },
    { label: 'Piatto unico', value: 'Piatto unico' }
  ];

  const api = useCallback(axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);

  useEffect(() => {
    fetchWeeklyPiatti();
  }, [api]);

  const fetchWeeklyPiatti = async () => {
    try {
      const response = await api.get('/piatto/piattoSettimana');
      setWeeklyPiatti(response.data);
    } catch (error) {
      console.error('Error fetching weekly piatti:', error);
      showToast('error', 'Error', 'Failed to fetch weekly piatti');
    }
  };

  const editPiatto = (piatto) => {
    setEditingPiatto({
      ...piatto,
    });
    setIsNewPiatto(false);
    setShowDialog(true);
  };

  const addNewPiatto = () => {
    setEditingPiatto({
      nome_piatto: '',
      data: new Date().toISOString().split('T')[0],
      idTipoPiatto: 1,
      nome_tipo: 'Primo',
      disponibile: 1
    });
    setIsNewPiatto(true);
    setShowDialog(true);
  };

  const savePiatto = async () => {
    try {
      const piattoToSave = {
        nome: editingPiatto.nome_piatto,
        data: editingPiatto.data,
        idTipoPiatto: editingPiatto.idTipoPiatto,
        disponibile: editingPiatto.sempreDisponibile
      };


      let response;
      if (isNewPiatto) {
        response = await axios.post('http://localhost:8080/api/piatto/create', piattoToSave, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
        });
      } else {
        response = await axios.put(`http://localhost:8080/api/piatto/update/${editingPiatto.id_piatto}`, piattoToSave, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
        });
      }

      setShowDialog(false);
      fetchWeeklyPiatti();
      showToast('success', 'Success', isNewPiatto ? 'Piatto created successfully' : 'Piatto updated successfully');
    } catch (error) {
      console.error('Error saving piatto:', error);
      showToast('error', 'Error', 'Failed to save piatto');
    }
  };

  const deletePiatto = async (id) => {
    if (window.confirm('Are you sure you want to delete this piatto?')) {
      try {

        await axios.delete(`http://localhost:8080/api/piatto/delete/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchWeeklyPiatti();
        showToast('success', 'Success', 'Piatto deleted successfully');
      } catch (error) {
        console.error('Error deleting piatto:', error);
        showToast('error', 'Error', 'Failed to delete piatto');
      }
    }
  };

  const showToast = (severity, summary, detail) => {
    toast.current.show({ severity, summary, detail });
  };

  const actionTemplate = (rowData) => {
    return (
      <div className="action-buttons">
        <button
          className="btn-edit"
          onClick={() => editPiatto(rowData)}
        >
          <img src={Edit} alt="Edit" className="action-icon" />
        </button>
        <button
          className="btn-delete"
          onClick={() => deletePiatto(rowData.id_piatto)}
        >
          <img src={Delete} alt="Delete" className="action-icon" />
        </button>
      </div>
    );
  };

  return (
    <div className="manage-piatti">
      <Toast ref={toast} />
      <h1>Manage Weekly Piatti</h1>
      <DataTable value={weeklyPiatti} paginator rows={10}>
        <Column field="id_piatto" header="ID" />
        <Column field="nome_piatto" header="Nome Piatto" />
        <Column field="nome_tipo" header="Tipo Piatto" />
        <Column field="data" header="Data" />
        <Column field="dayOfWeek" header="Day of Week" />
        <Column field="sempreDisponibile" header="Disponibile" body={(rowData) => rowData.sempreDisponibile ? 'Yes' : 'No'} />
        <Column body={actionTemplate} header="Actions" style={{ width: '150px' }} />
      </DataTable>

      <Dialog header={isNewPiatto ? "Add New Piatto" : "Edit Piatto"} visible={showDialog} style={{ width: '50vw' }} modal onHide={() => setShowDialog(false)}>
        {editingPiatto && (
          <div>
            <div className="p-field">
              <label htmlFor="nome_piatto">Nome Piatto</label>
              <InputText id="nome_piatto" value={editingPiatto.nome_piatto} onChange={(e) => setEditingPiatto({ ...editingPiatto, nome_piatto: e.target.value })} />
            </div>
            <div className="p-field">
              <label htmlFor="nome_tipo">Tipo Piatto</label>
              <Dropdown
                id="nome_tipo"
                value={editingPiatto.nome_tipo}
                options={tipoPiattoOptions}
                onChange={(e) => setEditingPiatto({ ...editingPiatto, nome_tipo: e.value, idTipoPiatto: tipoPiattoOptions.findIndex(option => option.value === e.value) + 1 })}
                placeholder="Select a type"
                optionLabel="label"
              />
            </div>
            <div className="p-field">
              <label htmlFor="data">Data</label>
              <Calendar id="data" value={new Date(editingPiatto.data)} onChange={(e) => setEditingPiatto({ ...editingPiatto, data: e.value.toISOString().split('T')[0] })} dateFormat="yy-mm-dd" />
            </div>
            <div className="p-field">
              <label htmlFor="sempreDisponibile">Disponibile</label>
              <Dropdown id="sempreDisponibile" value={editingPiatto.sempreDisponibile} options={[{ label: 'Yes', value: 1 }, { label: 'No', value: 0 }]} onChange={(e) => setEditingPiatto({ ...editingPiatto, sempreDisponibile: e.value })} optionLabel="label" />
            </div>
            <Button label="Save" icon="pi pi-check" onClick={savePiatto} />
          </div>
        )}
      </Dialog>
      <Button label="Add New Piatto" icon="pi pi-plus" onClick={addNewPiatto} className="p-button-primary add-piatto-button" />
    </div>
  );
}

export default ManagePiatti;