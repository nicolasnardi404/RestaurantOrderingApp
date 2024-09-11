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
  const [showEditDialog, setShowEditDialog] = useState(false);
  const toast = useRef(null);

  const tipoPiattoOptions = [
    { label: 'Primo', value: 1 },
    { label: 'Secondo', value: 2 },
    { label: 'Contorno', value: 3 },
    { label: 'Piatto unico', value: 4 }
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
      idTipoPiatto: tipoPiattoOptions.find(option => option.label === piatto.tipo_piatto)?.value
    });
    setShowEditDialog(true);
  };

  const savePiatto = async () => {
    try {
      const piattoToUpdate = {
        nome: editingPiatto.nome,
        data: editingPiatto.data,
        idTipoPiatto: editingPiatto.idTipoPiatto,
        disponibile: editingPiatto.disponibile === 1
      };
      console.log(piattoToUpdate)
      const response = await fetch(`http://localhost:8080/api/piatto/update/${editingPiatto.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(piattoToUpdate),
      });
      if (!response.ok) {
        throw new Error('Failed to update piatto');
      }
      setShowEditDialog(false);
      fetchWeeklyPiatti();
      showToast('success', 'Success', 'Piatto updated successfully');
    } catch (error) {
      console.error('Error updating piatto:', error);
      showToast('error', 'Error', 'Failed to update piatto');
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
        <Column field="nome" header="Nome" />
        <Column field="tipo_piatto" header="Tipo Piatto" />
        <Column field="data" header="Data" />
        <Column field="disponibile" header="Disponibile" body={(rowData) => rowData.disponibile ? 'Yes' : 'No'} />
        <Column body={actionTemplate} header="Actions" />
      </DataTable>

      <Dialog header="Edit Piatto" visible={showEditDialog} style={{ width: '50vw' }} modal onHide={() => setShowEditDialog(false)}>
        {editingPiatto && (
          <div>
            <div className="p-field">
              <label htmlFor="nome">Nome</label>
              <InputText id="nome" value={editingPiatto.nome} onChange={(e) => setEditingPiatto({ ...editingPiatto, nome: e.target.value })} />
            </div>
            <div className="p-field">
              <label htmlFor="idTipoPiatto">Tipo Piatto</label>
              <Dropdown id="idTipoPiatto" value={editingPiatto.idTipoPiatto} options={tipoPiattoOptions} onChange={(e) => setEditingPiatto({ ...editingPiatto, idTipoPiatto: e.value })} placeholder="Select a type" optionLabel="label" />
            </div>
            <div className="p-field">
              <label htmlFor="data">Data</label>
              <Calendar id="data" value={new Date(editingPiatto.data)} onChange={(e) => setEditingPiatto({ ...editingPiatto, data: e.value.toISOString().split('T')[0] })} dateFormat="yy-mm-dd" />
            </div>
            <div className="p-field">
              <label htmlFor="disponibile">Disponibile</label>
              <Dropdown id="disponibile" value={editingPiatto.disponibile} options={[{ label: 'Yes', value: 1 }, { label: 'No', value: 0 }]} onChange={(e) => setEditingPiatto({ ...editingPiatto, disponibile: e.value })} optionLabel="label" />
            </div>
            <Button label="Save" icon="pi pi-check" onClick={savePiatto} />
          </div>
        )}
      </Dialog>
    </div>
  );
}

export default ManagePiatti;