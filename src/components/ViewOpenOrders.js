import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { confirmDialog, ConfirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "../styles/ViewOpenOrders.css";
import "primeicons/primeicons.css";
import Delete from "../assets/icons8-delete-25.png";
import Edit from "../assets/icons8-edit-24.png";

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
      console.log("Fetching orders for user ID:", user.userId);
      const response = await axios.get(
        `http://localhost:8080/api/ordine/ordineByUserId/${user.userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Fetched orders:", response.data);
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
      console.log("Fetched available dishes:", response.data);
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
        <button className="btn-edit" onClick={() => handleEditOrder(rowData)}>
          <img src={Edit} alt="Edit" className="action-icon" />
        </button>
        <button
          className="btn-delete"
          onClick={() => handleCancelOrder(rowData.idPrenotazione)}
        >
          <img src={Delete} alt="Delete" className="action-icon" />
        </button>
      </div>
    );
  };

  const fetchDishesForOrder = async (date) => {
    try {
      const formattedDate = date.toISOString().split("T")[0]; // Format: YYYY-MM-DD
      console.log("Fetching dishes for date:", formattedDate);
      const token = getToken();
      const response = await axios.get(
        `http://localhost:8080/api/piatto/readByData/${formattedDate}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Fetched dishes for date:", response.data);
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
    console.log("Editing order:", order);
    const selectedDishes = order.idPiatti
      ? order.idPiatti.split(", ").map((id) => parseInt(id))
      : [];
    console.log("Selected dishes:", selectedDishes);

    let orderDate;
    if (order.datePiatti && order.datePiatti.includes(",")) {
      orderDate = new Date(order.datePiatti.split(", ")[0]);
    } else if (order.datePiatti) {
      orderDate = new Date(order.datePiatti);
    } else {
      orderDate = new Date(); // Default to current date if datePiatti is undefined
    }
    console.log("Order date:", orderDate);

    const dishesForOrder = await fetchDishesForOrder(orderDate);
    console.log("Dishes for order:", dishesForOrder);

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
      },
      reservationDate: orderDate,
      availableDishes: dishesForOrder,
      idOrdine: order.idOrdine || "",
      idPrenotazione: order.idPrenotazione, // Ensure this is included
    };

    console.log("Editing order data:", editingOrderData);
    setEditingOrder(editingOrderData);
    checkCombination(editingOrderData.selectedDishes);
    setShowEditDialog(true);
  };

  const handleDropdownChange = (mealType, selectedDish) => {
    console.log(
      `Dropdown change for ${mealType}:`,
      selectedDish ? selectedDish.nome : "None"
    );
    setEditingOrder((prevOrder) => {
      const newSelectedDishes = {
        ...prevOrder.selectedDishes,
        [mealType]: selectedDish || null,
      };
      checkCombination(newSelectedDishes);
      return { ...prevOrder, selectedDishes: newSelectedDishes };
    });
  };

  const isValidCombination = (selectedDishes) => {
    const validCombinations = [
      ["Primo", "Secondo", "Contorno"],
      ["Primo", "Piatto unico", "Contorno"],
      ["Primo", "Contorno"],
      ["Secondo", "Contorno"],
      ["Piatto unico", "Contorno"],
      ["Piatto unico"],
    ];

    const selectedTypes = Object.keys(selectedDishes).filter(
      (type) =>
        selectedDishes[type] !== null && selectedDishes[type] !== undefined
    );

    console.log("Selected types:", selectedTypes);

    const isValid = validCombinations.some((combination) => {
      const matchesLength = combination.length === selectedTypes.length;
      const includesAll = combination.every((type) =>
        selectedTypes.includes(type)
      );
      console.log(
        `Checking combination: ${combination}, Length match: ${matchesLength}, Includes all: ${includesAll}`
      );
      return matchesLength && includesAll;
    });

    console.log("Is valid combination:", isValid);
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
      message: "Are you sure you want to cancel this order?",
      header: "Confirm Cancellation",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        try {
          console.log("Cancelling order:", idPrenotazione);
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
        console.log("Updating order:", editingOrder);

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
          dataPrenotazione: editingOrder.reservationDate
            .toISOString()
            .split("T")[0], // Format: YYYY-MM-DD
          idPiatto: selectedDishIds,
          idOrdine: idOrdineArray,
        };

        console.log("Update data:", JSON.stringify(updateData, null, 2));

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
        console.log("Update response:", response.data);

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
      <div className="header-container">
        <h1>I tuoi ordini aperti</h1>
        <Button
          label="Go to Menu"
          onClick={() => window.location.href = '/menu'}
          className="new-button"
        />
      </div>
      <Card>
        {error && <div className="error-message">{error}</div>}
        <DataTable value={orders} loading={loading} responsiveLayout="scroll">
          <Column field="idPrenotazione" header="Order ID" />
          <Column
            field="datePiatti"
            header="Reservation Date"
            body={(rowData) => {
              if (rowData.datePiatti) {
                return formatDate(rowData.datePiatti);
              }
              return "N/A"; // or any default value you prefer
            }}
          />
          <Column field="piatti" header="Dishes" />
          <Column field="tipo_piatti" header="Dish Types" />
          <Column
            body={actionTemplate}
            header="Actions"
            style={{ width: "150px" }}
          />
        </DataTable>
      </Card>

      <Dialog
        header="Edit Order"
        visible={showEditDialog}
        style={{ width: "50vw" }}
        onHide={() => setShowEditDialog(false)}
      >
        {/* Dialog content */}
      </Dialog>
    </div>
  );
};

export default ViewOpenOrders;
