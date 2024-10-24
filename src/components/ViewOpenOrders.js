import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { UseDataLocal } from "../util/UseDataLocal";
import { ITALIAN_LOCALE_CONFIG } from "../util/ItalianLocaleConfigData";
import { Dropdown } from "primereact/dropdown";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "../styles/ViewOpenOrders.css";
import "primeicons/primeicons.css";
import formatDateforServer from "../util/formatDateForServer";
import { formatCalendarData } from "../util/FormatCalendarData";
import { formatDateForDisplay } from "../util/FormatDateForDisplay";

UseDataLocal(ITALIAN_LOCALE_CONFIG);

const ViewOpenOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [availableDishes, setAvailableDishes] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [usernameFilter, setUsernameFilter] = useState("");
  const { user, getToken } = useAuth();
  const toast = useRef(null);
  const [combinationStatus, setCombinationStatus] = useState("");
  const [displayDialog, setDisplayDialog] = useState(false);
  const [idPrenotazione, setIdPrenotazione] = useState(null);
  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    fetchOrders();
    fetchAvailableDishes();
  }, []);

  useEffect(() => {
    if (user && user.ruolo === "Amministratore" && orders.length > 0) {
      setUsernameFilter(user.nome || "");
    }
  }, [orders, user]);

  useEffect(() => {
    if (user && user.ruolo === "Amministratore") {
      filterOrders();
    }
  }, [usernameFilter, orders, user]);

  const filterOrders = () => {
    if (user && user.ruolo === "Amministratore") {
      const lowercasedFilter = usernameFilter.toLowerCase();
      const filtered = orders.filter(
        (order) =>
          order &&
          order.username &&
          order.username.toLowerCase().includes(lowercasedFilter)
      );
      setFilteredOrders(filtered);
    }
  };

  const getNames = (users) => {
    let listNames = new Set();
    for (let i = 0; i < users.length; i++) {
      if (user.ruolo === "Amministratore") {
        listNames.add(users[i]["username"]);
      }
    }

    return Array.from(listNames);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        setError(
          "Nessun token di autenticazione valido trovato. Effettua nuovamente il login."
        );
        setLoading(false);
        return;
      }

      let url =
        user && user.ruolo === "Amministratore"
          ? `${apiUrl}/ordine/ordineByUserIdAdmin`
          : `${apiUrl}/ordine/ordineByUserId/${user?.userId}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Fetched orders:", response.data);

      if (Array.isArray(response.data)) {
        setOrders(response.data);
        setUsers(getNames(response.data));
        if (user && user.ruolo !== "Amministratore") {
          setFilteredOrders(response.data);
        }
      } else {
        console.error("Unexpected response format:", response.data);
        setError("Formato di dati imprevisto ricevuto dal server.");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Impossibile recuperare gli ordini. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDishes = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${apiUrl}/piatto/read`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAvailableDishes(response.data);
    } catch (error) {
      console.error("Error fetching available dishes:", error);
      setError(
        "Impossibile recuperare i piatti disponibili. Alcune funzionalità potrebbero essere limitate."
      );
    }
  };

  const formatDate = (value) => {
    if (!value) return "";

    // If value is already a Date object
    if (value instanceof Date) {
      return value.toLocaleString("it-IT", {
        weekday: "short",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    }

    // If value is a string
    if (typeof value === "string") {
      const dates = value.split(", ");
      return dates
        .map((date) =>
          new Date(date).toLocaleString("it-IT", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
        )
        .join(", ");
    }

    // If value is an array
    if (Array.isArray(value)) {
      return value
        .map((date) =>
          new Date(date).toLocaleString("it-IT", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
        )
        .join(", ");
    }

    // If value is of unexpected type, return it as is
    console.warn("Unexpected date format:", value);
    return String(value);
  };

  const actionTemplate = (rowData) => {
    return (
      <div className="action-buttons">
        <Button
          icon="pi pi-pencil"
          className="btn-edit"
          onClick={() => handleEditOrder(rowData)}
          tooltip="Modifica ordine"
        />
        <Button
          icon="pi pi-trash"
          className="btn-delete"
          onClick={() => handleCancelOrder(rowData.idPrenotazione)}
          tooltip="Annulla ordine"
        />
      </div>
    );
  };

  const fetchDishesForOrder = async (date) => {
    try {
      const token = getToken();
      const response = await axios.get(
        `${apiUrl}/piatto/readByData/${formatDateforServer(date)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Error fetching dishes for date:", error);
      setError(
        "Impossibile recuperare i piatti per la data dell'ordine. Alcune funzionalità potrebbero essere limitate"
      );
      return [];
    }
  };

  const handleEditOrder = async (order) => {
    const selectedDishes = order.idPiatti
      ? order.idPiatti.split(", ").map((id) => parseInt(id))
      : [];

    const dishesForOrder = await fetchDishesForOrder(order.datePiatti);
    if (!Array.isArray(dishesForOrder)) {
      console.error("Dishes for order is not an array:", dishesForOrder);
      setError(
        "Impossibile recuperare i piatti per la data dell'ordine. Riprova."
      );
      return;
    }

    const dishesById = dishesForOrder.reduce((acc, dish) => {
      acc[dish.id] = dish;
      return acc;
    }, {});

    const editingOrderData = {
      ...order,
      selectedDishes: {
        Primo:
          dishesById[
            selectedDishes.find((id) => dishesById[id]?.tipo_piatto === "Primo")
          ] || null,
        Secondo:
          dishesById[
            selectedDishes.find(
              (id) => dishesById[id]?.tipo_piatto === "Secondo"
            )
          ] || null,
        Contorno:
          dishesById[
            selectedDishes.find(
              (id) => dishesById[id]?.tipo_piatto === "Contorno"
            )
          ] || null,
        "Piatto unico":
          dishesById[
            selectedDishes.find(
              (id) => dishesById[id]?.tipo_piatto === "Piatto unico"
            )
          ] || null,
        Complement:
          dishesById[
            selectedDishes.find(
              (id) => dishesById[id]?.tipo_piatto === "Dessert"
            )
          ] || null,
        "Pane/Grissini":
          dishesById[
            selectedDishes.find(
              (id) => dishesById[id]?.tipo_piatto === "Pane/Grissini"
            )
          ] || null,
        Observazioni:
          dishesById[
            selectedDishes.find(
              (id) => dishesById[id]?.tipo_piatto === "Observazioni"
            )
          ] || null,
      },
      reservationDate: order.datePiatti,
      availableDishes: dishesForOrder,
      idOrdine: order.idOrdine || "",
      idPrenotazione: order.idPrenotazione,
    };

    setEditingOrder(editingOrderData);
    checkCombination(editingOrderData.selectedDishes);
    setShowEditDialog(true);
  };

  const handleDropdownChange = (mealType, selectedDish) => {
    setEditingOrder((prevOrder) => {
      const newSelectedDishes = {
        ...prevOrder.selectedDishes,
        [mealType]: selectedDish || null,
      };
      checkCombination(newSelectedDishes);
      return { ...prevOrder, selectedDishes: newSelectedDishes };
    });
  };

  const validCombinations = [
    ["Primo", "Secondo", "Contorno"],
    ["Primo", "Piatto unico", "Contorno"],
    ["Primo", "Secondo"],
    ["Primo", "Piatto unico"],
    ["Primo", "Contorno"],
    ["Primo", "Contorno", "Dessert"],
    ["Secondo", "Contorno"],
    ["Piatto unico", "Contorno"],
    ["Piatto unico"],
  ];

  const isValidCombination = (selectedDishes) => {
    console.log("selected dishes" + JSON.stringify(selectedDishes));
    const selectedTypes = Object.keys(selectedDishes).filter(
      (type) =>
        selectedDishes[type] !== null &&
        type !== "Pane/Grissini" &&
        type !== "Observazioni"
    );

    const isValid = validCombinations.some(
      (combination) =>
        combination.length === selectedTypes.length &&
        combination.every((type) => selectedTypes.includes(type))
    );

    return isValid;
  };

  const checkCombination = (currentCart) => {
    const {
      Primo,
      Secondo,
      Contorno,
      PiattoUnico,
      Altri,
      Dessert,
      Observazioni,
    } = currentCart;

    const selectedItems = new Set();
    if (Primo) selectedItems.add("Primo");
    if (Secondo) selectedItems.add("Secondo");
    if (Contorno) selectedItems.add("Contorno");
    if (PiattoUnico) selectedItems.add("Piatto unico");
    if (Altri) selectedItems.add("Pane/Grissini");
    if (Dessert) selectedItems.add("Dessert");
    if (Observazioni) selectedItems.add("Observazioni");

    const combinations = validCombinations.some((combination) => {
      return combination.every((item) => selectedItems.has(item));
    });

    if (combinations) {
      setCombinationStatus("");
    }
  };

  const handleCancelOrder = (id) => {
    setIdPrenotazione(id);
    setDisplayDialog(true);
  };

  const confirmCancelOrder = async () => {
    try {
      const token = getToken();
      await axios.delete(`${apiUrl}/prenotazione/delete/${idPrenotazione}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders((prevOrders) =>
        prevOrders.filter((order) => order.idPrenotazione !== idPrenotazione)
      );
      toast.current.show({
        severity: "success",
        summary: "Success",
        detail: "Ordine cancellato con successo.",
        life: 3000,
      });
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Impossibile annullare l'ordine. Riprova.",
        life: 3000,
      });
    } finally {
      setDisplayDialog(false);
      setIdPrenotazione(null);
    }
  };

  const cancelDialog = () => {
    setDisplayDialog(false);
    setIdPrenotazione(null);
  };

  const handleUpdateOrder = async () => {
    if (isValidCombination(editingOrder.selectedDishes)) {
      try {
        const selectedDishIds = Object.values(editingOrder.selectedDishes)
          .filter(
            (dish) =>
              dish !== null &&
              dish !== undefined &&
              dish !== editingOrder.selectedDishes.Observazioni
          ) // Exclude Observazioni
          .map((dish) => dish.id);

        const idOrdineArray = editingOrder.idOrdine
          .split(", ")
          .map((id) => parseInt(id));

        const updateData = {
          idPrenotazione: editingOrder.idPrenotazione,
          dataPrenotazione: formatDateforServer(editingOrder.reservationDate),
          idPiatto: selectedDishIds,
          idOrdine: idOrdineArray,
          Observazioni: editingOrder.selectedDishes.Observazioni, // Adicione Observazioni aqui
        };

        const token = getToken();
        await axios.put(`${apiUrl}/ordine/update`, updateData, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        setShowEditDialog(false);
        await fetchOrders();
        toast.current.show({
          severity: "success",
          summary: "Success",
          detail: "Ordine modificada com sucesso.",
          life: 3000,
        });
      } catch (error) {
        console.error("Error updating order:", error);
        setError("Impossibile aggiornare l'ordine. Riprova.");
      }
    } else {
      setError(
        "La combinazione selezionata non è valida. Assicurati di scegliere uma combinação correta de piatti."
      );
    }
  };

  const rowClassName = (rowData) => {
    return isDateInPast(rowData.datePiatti) ? "" : "future-date";
  };

  const renderAdminTable = () => (
    <div>
      <div className="p-inputgroup mb-3">
        <Dropdown
          value={usernameFilter}
          options={users}
          onChange={(e) => setUsernameFilter(e.value)}
          optionLabel="nome"
          placeholder="Seleziona utente"
          className="w-full md:w-14rem"
        />
      </div>
      <DataTable
        value={filteredOrders}
        loading={loading}
        responsiveLayout="scroll"
        rowClassName={rowClassName}
      >
        <Column field="username" header="Username" />
        <Column
          field="datePiatti"
          header="Data Prenotazione"
          body={(rowData) =>
            formatDateForDisplay({ reservation_date: rowData.datePiatti })
          }
        />
        <Column field="piatti" header="Piatti" />
        <Column field="tipo_piatti" header="Combinazione" />
        <Column field="Observazioni" header="Osservazioni" />
        <Column
          className="action-column"
          body={actionTemplate}
          header="Azioni"
          style={{ width: "150px" }}
        />
      </DataTable>
    </div>
  );

  const renderUserTable = () => (
    <DataTable
      value={orders}
      loading={loading}
      responsiveLayout="scroll"
      rowClassName={rowClassName}
    >
      <Column field="idPrenotazione" header="ID" />
      <Column field="datePiatti" header="Data Prenotazione" />
      <Column field="piatti" header="Piatti" />
      <Column field="tipo_piatti" header="Combinazione" />
      <Column field="Observazioni" header="Osservazioni" />
      <Column
        body={actionTemplate}
        header="Azioni"
        style={{ width: "150px" }}
      />
    </DataTable>
  );

  const renderEditDialog = () => {
    if (!editingOrder) return null;

    const mealTypes = [
      "Primo",
      "Secondo",
      "Contorno",
      "Piatto unico",
      "Dessert",
      "Pane/Grissini",
      "Observazioni",
    ];

    const tableData = mealTypes.map((mealType) => {
      if (mealType === "Observazioni") {
        return {
          mealType,
          dropdown: (
            <input
              type="text"
              value={editingOrder.selectedDishes.Observazioni}
              onChange={(e) => handleDropdownChange(mealType, e.target.value)}
              placeholder="Scrive le tue Osservazione"
              className="w-full"
            />
          ),
        };
      } else {
        return {
          mealType,
          dropdown: (
            <Dropdown
              value={editingOrder.selectedDishes[mealType]}
              options={editingOrder.availableDishes.filter(
                (dish) => dish.tipo_piatto === mealType
              )}
              onChange={(e) => handleDropdownChange(mealType, e.value)}
              optionLabel="nome"
              placeholder="= SELEZIONA ="
              showClear
              className="w-full"
            />
          ),
        };
      }
    });

    return (
      <div>
        <div className="p-field mb-4">
          {user.ruolo === "Amministratore" && (
            <label className="font-bold">Utente: {usernameFilter}</label>
          )}
          <label className="font-bold">
            Data Prenotazione: {formatDate(editingOrder.reservationDate)}
          </label>
        </div>
        <DataTable value={tableData} className="p-datatable-sm">
          <Column field="mealType" header="Tipo Pasto" />
          <Column
            field="dropdown"
            header="Selezione"
            body={(rowData) => rowData.dropdown}
          />
        </DataTable>
        {combinationStatus && (
          <div className="combination-status mt-3">{combinationStatus}</div>
        )}
        {error && <div className="error-message mt-3">{error}</div>}
        {!isValidCombination(editingOrder.selectedDishes) && (
          <p className="error-combination">Combinazione Invalida</p>
        )}
        <div className="flex justify-content-end mt-4">
          <Button
            label="Aggiorna ordine"
            onClick={handleUpdateOrder}
            disabled={!isValidCombination(editingOrder.selectedDishes)}
            className="edit-button"
          />
        </div>
      </div>
    );
  };

  const isDateInPast = (dateString) => {
    const now = new Date();
    const [year, month, day] = dateString.split("-");

    const reservationDate = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day)
    );

    if (isNaN(reservationDate.getTime())) {
      console.error("Invalid date:", dateString);
      return false; // Treat invalid dates as future dates
    }

    // If the reservation date is in the future, it's not in the past
    if (reservationDate > now) {
      return false;
    }

    // If it's today, check if it's before 10:30
    if (reservationDate.toDateString() === now.toDateString()) {
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const cutoffTime = 10 * 60 + 30; // 10:30
      return currentTime >= cutoffTime;
    }

    // If it's before today, it's in the past
    return true;
  };

  return (
    <div className="view-open-orders">
      <Toast ref={toast} />
      <ConfirmDialog />
      <Card>
        <div className="header-container">
          <h2>I tuoi ordini aperti</h2>
        </div>
        {error && <div className="error-message">{error}</div>}
        {user && user.ruolo === "Amministratore"
          ? renderAdminTable()
          : renderUserTable()}
      </Card>

      <Dialog
        header="Modifica ordine"
        visible={showEditDialog}
        style={{ width: "80vw" }}
        onHide={() => setShowEditDialog(false)}
      >
        {renderEditDialog()}
      </Dialog>

      <Dialog
        visible={displayDialog}
        style={{ width: "450px" }}
        header="Conferma eliminazione"
        modal
        footer={
          <div>
            <Button label="No" icon="pi pi-times" onClick={cancelDialog} />
            <Button
              label="Sì"
              icon="pi pi-check"
              onClick={confirmCancelOrder}
            />
          </div>
        }
        onHide={cancelDialog}
      >
        <p>Sei sicuro di voler eliminare questa prenotazione?</p>
      </Dialog>
    </div>
  );
};

export default ViewOpenOrders;
