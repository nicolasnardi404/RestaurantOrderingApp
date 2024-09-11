import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';

function ManagePiatti() {
  const [weeklyPiatti, setWeeklyPiatti] = useState([]);
  const [editingPiatto, setEditingPiatto] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isNewPiatto, setIsNewPiatto] = useState(false);
  const toast = useRef(null);

  const tipoPiattoOptions = [
    { label: 'Primo', value: 'Primo' },
    { label: 'Secondo', value: 'Secondo' },
    { label: 'Contorno', value: 'Contorno' },
    { label: 'Piatto unico', value: 'Piatto unico' }
  ];

  useEffect(() => {
    fetchWeeklyPiatti();
  }, []);

  const fetchWeeklyPiatti = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/piatto/piattoSettimana');
      if (!response.ok) {
        throw new Error('Failed to fetch weekly piatti');
      }
      const data = await response.json();
      setWeeklyPiatti(data);
    } catch (error) {
      console.error('Error fetching weekly piatti:', error);
      showToast('error', 'Error', 'Failed to fetch weekly piatti');
    }
  };

  const editPiatto = (piatto) => {
    setEditingPiatto({
      ...piatto,
      // nome_tipo is already in the piatto object, so we don't need to modify it
    });
    setIsNewPiatto(false);
    setShowDialog(true);
  };

  const addNewPiatto = () => {
    setEditingPiatto({
      nome: '',
      data: new Date().toISOString().split('T')[0],
      idTipoPiatto: 1,
      disponibile: 1
    });
    setIsNewPiatto(true);
    setShowDialog(true);
  };

  const savePiatto = async () => {
    try {
      const piattoToSave = {
        nome: editingPiatto.nome,
        data: editingPiatto.data,
        idTipoPiatto: editingPiatto.idTipoPiatto,
        sempreDisponibile: editingPiatto.sempreDisponibile === 1
      };
      
      let response;
      if (isNewPiatto) {
        response = await fetch('http://localhost:8080/api/piatto/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(piattoToSave),
        });
      } else {
        response = await fetch(`http://localhost:8080/api/piatto/update/${editingPiatto.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(piattoToSave),
        });
      }

      if (!response.ok) {
        throw new Error(isNewPiatto ? 'Failed to create piatto' : 'Failed to update piatto');
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
        const response = await fetch(`http://localhost:8080/api/piatto/delete/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('Failed to delete piatto');
        }
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
      <>
        <Button icon="pi pi-pencil" className="p-button-rounded p-button-success p-mr-2" onClick={() => editPiatto(rowData)} />
        <Button icon="pi pi-trash" className="p-button-rounded p-button-danger" onClick={() => deletePiatto(rowData.id)} />
      </>
    );
  };

  return (
    <div>
      <Toast ref={toast} />
      <h1>Manage Weekly Piatti</h1>
      <DataTable value={weeklyPiatti} paginator rows={10}>
        <Column field="id" header="ID" />
        <Column field="nome_piatto" header="Nome" />
        <Column field="nome_tipo" header="Tipo Piatto" />
        <Column field="data" header="Data" />
        <Column field="dayOfWeek" header="Day of Week" />
        <Column field="sempreDisponibile" header="Disponibile" body={(rowData) => rowData.sempreDisponibile ? 'Yes' : 'No'} />
        <Column body={actionTemplate} header="Actions" />
      </DataTable>

      <Dialog header={isNewPiatto ? "Add New Piatto" : "Edit Piatto"} visible={showDialog} style={{ width: '50vw' }} modal onHide={() => setShowDialog(false)}>
        {editingPiatto && (
          <div>
            <div className="p-field">
              <label htmlFor="nome">Nome</label>
              <InputText id="nome" value={editingPiatto.nome_piatto} onChange={(e) => setEditingPiatto({ ...editingPiatto, nome_piatto: e.target.value })} />
            </div>
            <div className="p-field">
              <label htmlFor="nome_tipo">Tipo Piatto</label>
              <Dropdown 
                id="nome_tipo" 
                value={editingPiatto.nome_tipo} 
                options={tipoPiattoOptions} 
                onChange={(e) => setEditingPiatto({ ...editingPiatto, nome_tipo: e.value })} 
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
      <Button label="Add New Piatto" icon="pi pi-plus" onClick={addNewPiatto} className="p-mb-3" />
    </div>
  );
}

export default ManagePiatti;