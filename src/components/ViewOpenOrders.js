import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { UseDataLocal } from '../util/UseDataLocal';
import { ITALIAN_LOCALE_CONFIG } from '../util/ItalianLocaleConfigData';
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
      const filtered = orders.filter(order =>
        order && order.username && order.username.toLowerCase().includes(lowercasedFilter)
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
  }

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        setError("Nessun token di autenticazione valido trovato. Effettua nuovamente il login.");
        setLoading(false);
        return;
      }

      let url = user && user.ruolo === "Amministratore"
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
      const response = await axios.get(
        `${apiUrl}/piatto/read`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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

    let orderDate;
    if (order.datePiatti) {
      const dateParts = order.datePiatti.split(" ");
      const dateString = dateParts.slice(1).join(" ");

      const [day, month, year] = dateString.split("/").map(part => parseInt(part));
      const fullYear = year < 100 ? 2000 + year : year;

      orderDate = new Date(fullYear, month - 1, day);
    } else {
      orderDate = new Date();
    }

    console.log(orderDate);

    const dishesForOrder = await fetchDishesForOrder(orderDate);

    if (!Array.isArray(dishesForOrder)) {
      console.error("Dishes for order is not an array:", dishesForOrder);
      setError("Impossibile recuperare i piatti per la data dell'ordine. Riprova.");
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
        "Complement":
          dishesById[
          selectedDishes.find(
            (id) => dishesById[id]?.tipo_piatto === "Dessert"
          )
          ] || null,
        "Altri":
          dishesById[
          selectedDishes.find(
            (id) => dishesById[id]?.tipo_piatto === "Altri"
          )
          ] || null,
      },
      reservationDate: orderDate,
      availableDishes: dishesForOrder,
      idOrdine: order.idOrdine || "",
      idPrenotazione: order.idPrenotazione, // Ensure this is included
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
    ['Primo', 'Secondo', 'Contorno'],
    ['Primo', 'Piatto unico', 'Contorno'],
    ['Primo', 'Contorno'],
    ['Primo', 'Contorno', 'Complement'],
    ['Secondo', 'Contorno'],
    ['Piatto unico', 'Contorno'],
    ['Piatto unico'],
  ];

  const isValidCombination = (selectedDishes) => {
    // Filtra os tipos de pratos selecionados, exceto "Altri"
    const selectedTypes = Object.keys(selectedDishes)
      .filter((type) => selectedDishes[type] !== null && type !== 'Altri');

    // Verifica se a combinação é válida sem considerar "Altri"
    const isValid = validCombinations.some(
      (combination) =>
        combination.length === selectedTypes.length &&
        combination.every((type) => selectedTypes.includes(type))
    );

    return isValid;
  };

  const checkCombination = (currentSelection) => {
    if (isValidCombination(currentSelection)) {
      setCombinationStatus("");
    } else {
      const selectedTypes = Object.keys(currentSelection).filter(
        (type) => currentSelection[type] !== null
      );
      let missingItems = [];
      if (
        !selectedTypes.includes("Primo") &&
        !selectedTypes.includes("Piatto unico")
      )
        missingItems.push("Primo or Piatto unico");
      if (
        !selectedTypes.includes("Secondo") &&
        !selectedTypes.includes("Piatto unico")
      )
        missingItems.push("Secondo or Piatto unico");
      if (
        !selectedTypes.includes("Contorno") &&
        !selectedTypes.includes("Piatto unico")
      )
        missingItems.push("Contorno");

      if (missingItems.length === 0) {
        setCombinationStatus(
          "Combinazione non valida. Seleziona una combinazione valida di piatti."
        );
      } else {
        setCombinationStatus(
          `Add ${missingItems.join(" or ")} to complete a valid combination`
        );
      }
    }
  };

  const handleCancelOrder = async (idPrenotazione) => {
    confirmDialog({
      message: "Sei sicuro di voler eliminare questo piatto?",
      header: "Conferma eliminazione",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        try {
          const token = getToken();
          await axios.delete(
            `${apiUrl}/prenotazione/delete/${idPrenotazione}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setOrders((prevOrders) =>
            prevOrders.filter(
              (order) => order.idPrenotazione !== idPrenotazione
            )
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
        }
      },
      reject: () => {
        // Optional: Add any logic for when the user rejects the cancellation
      },
    });
  };

  const handleUpdateOrder = async () => {
    if (isValidCombination(editingOrder.selectedDishes)) {
      try {
        // Filter out null or undefined dishes and get their IDs
        const selectedDishIds = Object.values(editingOrder.selectedDishes)
          .filter((dish) => dish !== null && dish !== undefined)
          .map((dish) => dish.id);

        // Get all idOrdine values
        const idOrdineArray = editingOrder.idOrdine
          .split(", ")
          .map((id) => parseInt(id));

        const updateData = {
          idPrenotazione: editingOrder.idPrenotazione,
          dataPrenotazione: formatCalendarData(editingOrder.reservationDate),
          idPiatto: selectedDishIds,
          idOrdine: idOrdineArray,
        };

        const token = getToken();
        const response = await axios.put(
          `${apiUrl}/ordine/update`,
          updateData,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setShowEditDialog(false);
        await fetchOrders(); // Refresh the orders after update
        alert("Ordine aggiornato con successo.");
      } catch (error) {
        console.error("Error updating order:", error);
        setError("Impossibile aggiornare l'ordine. Riprova.");
      }
    } else {
      setError(
        "La combinazione selezionata non è valida. Assicurati di scegliere una combinazione corretta di piatti."
      );
    }
  };

  const renderAdminTable = () => (
    <div>
      <div className="p-inputgroup mb-3">
        <Dropdown
          value={usernameFilter}
          options={users}
          onChange={(e) => setUsernameFilter(e.value)}
          optionLabel="nome" // Assuming 'nome' is the key for display
          placeholder="Seleziona utente"
          className="w-full md:w-14rem"
        />
      </div>
      <DataTable value={filteredOrders} loading={loading} responsiveLayout="scroll">
        <Column field="idPrenotazione" header="ID" />
        <Column field="username" header="Username" />
        <Column field="datePiatti" header="Data Prenotazione" />
        <Column field="piatti" header="Piatti" />
        <Column field="tipo_piatti" header="Combinazione" />
        <Column body={actionTemplate} header="Azioni" style={{ width: "150px" }} />
      </DataTable>
    </div>
  );

  const renderUserTable = () => (
    <DataTable value={orders} loading={loading} responsiveLayout="scroll">
      <Column field="idPrenotazione" header="ID" />
      <Column field="datePiatti" header="Data Prenotazione" />
      <Column field="piatti" header="Piatti" />
      <Column field="tipo_piatti" header="Combinazione" />
      <Column body={actionTemplate} header="Azioni" style={{ width: "150px" }} />
    </DataTable>
  );

  return (
    <div className="view-open-orders">
      <Toast ref={toast} />
      <ConfirmDialog />
      <Card>
        <div className="header-container">
          <h2>I tuoi ordini aperti</h2>
        </div>
        {error && <div className="error-message">{error}</div>}
        {user && user.ruolo === "Amministratore" ? renderAdminTable() : renderUserTable()}
      </Card>

      <Dialog
        header="Modifica ordine"
        visible={showEditDialog}
        style={{ width: "50vw" }}
        onHide={() => setShowEditDialog(false)}
      >
        {editingOrder && (
          <div>
            <div className="p-field">
              <label>Data Prenotazione: <span>{formatDate(editingOrder.reservationDate)}</span></label>
            </div>
            {["Primo", "Secondo", "Contorno", "Piatto unico", "Dessert", "Altri"].map(
              (mealType) => (
                <div key={mealType} className="p-field">
                  <label htmlFor={mealType}>{mealType}</label>
                  <Dropdown
                    id={mealType}
                    value={editingOrder.selectedDishes[mealType]}
                    options={editingOrder.availableDishes.filter(
                      (dish) => dish.tipo_piatto === mealType
                    )}
                    onChange={(e) => handleDropdownChange(mealType, e.value)}
                    optionLabel="nome"
                    placeholder={`=== SELEZIONA ===`}
                    className="w-full md:w-14rem"
                    showClear
                  />
                </div>
              )
            )}
            {combinationStatus && (
              <div className="combination-status">{combinationStatus}</div>
            )}
            {error && <div className="error-message">{error}</div>}
            <Button
              label="Aggiorna ordine"
              onClick={handleUpdateOrder}
              disabled={!isValidCombination(editingOrder.selectedDishes)}
            />
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default ViewOpenOrders;