import React, { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "../styles/AllOrderOfDayComponent.css";
import { useAuth } from "../context/AuthContext";
import formatDateForServer from "../util/formatDateForServer";

const AllOrderOfDayComponent = () => {
  const [dailyOrders, setDailyOrders] = useState([]);
  const [dailySummary, setDailySummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState(null);
  const { getToken } = useAuth();
  const [userRole, setUserRole] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchDailyOrders(currentDate);
    fetchDailySummary();
    // Retrieve user role from localStorage
    const role = localStorage.getItem("ruolo") || "";
    setUserRole(role);
  }, [currentDate]);

  const fetchDailyOrders = async (date) => {
    setLoading(true);
    try {
      const dateString = formatDateForServer(date); // Provide a default value
      const token = getToken();
      const response = await axios.get(
        `http://localhost:8080/api/ordine/ordineByDay/${dateString}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setDailyOrders(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching daily orders:", error);
      setDailyOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailySummary = async () => {
    setLoading(true);
    try {
      const dateString = formatDateForServer(new Date());
      const token = getToken();
      const response = await axios.get(
        `http://localhost:8080/api/ordine/totalPiattoByDay/${dateString}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setDailySummary(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching daily summary:", error);
      setDailySummary([]);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    // Format the date as day/month/year
    const today = new Date();
    const formattedDate = `${today.getDate().toString().padStart(2, "0")}/${(
      today.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${today.getFullYear()}`;

    // Add title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("Daily Order Report", 14, 20);

    // Add report info
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Date: ${formattedDate}`, 14, 30);
    doc.text(`Total Orders: ${dailyOrders.length}`, 14, 37);

    // Add summary table
    doc.autoTable({
      startY: 45,
      head: [["Dish Name", "Quantity"]],
      body: dailySummary.map((item) => [item.nome, item.quantita]),
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [66, 139, 202], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: "center" }
      );
    }

    // Save the PDF
    const fileName = `DailyOrderReport_${formattedDate.replace(
      /\//g,
      "-"
    )}.pdf`;
    doc.save(fileName);
  };

  const formatDisplayDate = (date) => {
    return `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  };

  const header = (
    <div className="table-header">
      <h5 className="mx-0 my-1">Today's Orders</h5>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          type="search"
          onInput={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search orders..."
        />
      </span>
    </div>
  );

  return (
    <div className="all-order-of-day">
      <h2>Daily Order Summary</h2>
      <h3>{formatDisplayDate(currentDate)}</h3>
      {userRole === "Amministratore" && (
        <Card title="All Orders" className="summary-card">
          <DataTable
            value={dailySummary}
            paginator
            rows={10}
            loading={loading}
            emptyMessage="No orders for today."
            className="p-datatable-responsive"
          >
            <Column field="nome" header="Dish Name" sortable />
            <Column field="quantita" header="Quantity" sortable />
          </DataTable>
        </Card>
      )}
      <Card title="Order by User" className="details-card">
        <DataTable
          value={dailyOrders}
          paginator
          rows={10}
          loading={loading}
          emptyMessage="No orders for today."
          className="p-datatable-responsive"
          globalFilter={globalFilter}
        >
          <Column field="username" header="User" sortable />
          <Column field="piatti" header="Dishes Ordered" sortable />
        </DataTable>
      </Card>
      {userRole === "Amministratore" && (
        <div className="pdf-button-section">
          <Button
            label="Generate PDF"
            icon="pi pi-file-pdf"
            onClick={generatePDF}
            className="p-button-lg btn"
          />
        </div>
      )}
    </div>
  );
};

export default AllOrderOfDayComponent;
