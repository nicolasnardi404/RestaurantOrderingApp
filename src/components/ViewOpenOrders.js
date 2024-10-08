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
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "../styles/ViewOpenOrders.css";
import "primeicons/primeicons.css";
import formatDateforServer from "../util/formatDateForServer";
import { formatCalendarData } from "../util/FormatCalendarData";

UseDataLocal(ITALIAN_LOCALE_CONFIG);

const ViewOpenOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [availableDishes, setAvailableDishes] = useState([]);
  const [error, setError] = useState("");
  const [combinationStatus, setCombinationStatus] = useState("");
  const { user, getToken } = useAuth();
  const toast = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
    fetchAvailableDishes();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await axios.get(
        `http://localhost:8080/api/ordine/ordineByUserId/${user.userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOrders(response.data);
      setError("");
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to fetch orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDishes = async () => {
    try {
      const token = getToken();
      const response = await axios.get(
        "http://localhost:8080/api/piatto/read",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAvailableDishes(response.data);
    } catch (error) {
      console.error("Error fetching available dishes:", error);
      setError(
        "Failed to fetch available dishes. Some features may be limited."
      );
    }
  };

  const formatDate = (value) => {
    if (!value) return "";

    // If value is already a Date object
    if (value instanceof Date) {
      return value.toLocaleString("it-IT", {
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
        `http://localhost:8080/api/piatto/readByData/${formatDateforServer(date)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Error fetching dishes for date:", error);
      setError(
        "Failed to fetch dishes for the order date. Some features may be limited."
      );
      return [];
    }
  };

  const handleEditOrder = async (order) => {
    const selectedDishes = order.idPiatti
      ? order.idPiatti.split(", ").map((id) => parseInt(id))
      : [];

    let orderDate;
    if (order.datePiatti && order.datePiatti.includes(",")) {
      orderDate = new Date(order.datePiatti.split(", ")[0]);
    } else if (order.datePiatti) {
      orderDate = new Date(order.datePiatti);
    } else {
      orderDate = new Date(); // Default to current date if datePiatti is undefined
    }

    const dishesForOrder = await fetchDishesForOrder(orderDate);

    if (!Array.isArray(dishesForOrder)) {
      console.error("Dishes for order is not an array:", dishesForOrder);
      setError("Failed to fetch dishes for the order date. Please try again.");
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
            (id) => dishesById[id]?.tipo_piatto === "Complement"
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
          "Invalid combination. Please adjust your selection."
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
      header: "Confermare l'eliminazione",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        try {
          const token = getToken();
          await axios.delete(
            `http://localhost:8080/api/prenotazione/delete/${idPrenotazione}`,
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
            detail: "Order cancelled successfully",
            life: 3000,
          });
        } catch (error) {
          console.error("Error cancelling order:", error);
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: "Failed to cancel the order. Please try again.",
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
          `http://localhost:8080/api/ordine/update`,
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
        alert("Order updated successfully");
      } catch (error) {
        console.error("Error updating order:", error);
        setError("Failed to update order. Please try again.");
      }
    } else {
      setError(
        "Invalid combination. Please select a valid combination of dishes."
      );
    }
  };

  return (
    <div className="view-open-orders">
      <Toast ref={toast} />
      <ConfirmDialog />
      <Card>
        <div className="header-container">
          <h2>I tuoi ordini aperti</h2>
          {/* <Button
            label="Go to Menu"
            onClick={() => window.location.href = '/menu'}
            className="new-button"
          /> */}
        </div>
        {error && <div className="error-message">{error}</div>}
        <DataTable value={orders} loading={loading} responsiveLayout="scroll">
          <Column field="idPrenotazione" header="ID" />
          <Column
            field="datePiatti"
            header="Data Prenotazione"
            body={(rowData) => {
              if (rowData.datePiatti) {
                return formatDate(rowData.datePiatti);
              }
              return "N/A"; // or any default value you prefer
            }}
          />
          <Column field="piatti" header="Piatti" />
          <Column field="tipo_piatti" header="Combinazione" />
          <Column
            body={actionTemplate}
            header="Azioni"
            style={{ width: "150px" }}
          />
        </DataTable>
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
              <label>Reservation Date:</label>
              <span>{formatDate(editingOrder.reservationDate)}</span>
            </div>
            {["Primo", "Secondo", "Contorno", "Piatto unico", "Complement", "Altri"].map(
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
                    placeholder={`Select ${mealType}`}
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
              label="Update Order"
              onClick={handleUpdateOrder}
              disabled={!isValidCombination(editingOrder.selectedDishes)}
            />
          </div>
        )}
      </Dialog>
    </div >
  );
};

export default ViewOpenOrders;