import React, { useState, useEffect } from "react";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import "../util/addLocale";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import formatDateforServer from "../util/formatDateForServer";
import { ITALIAN_LOCALE_CONFIG } from "../util/ItalianLocaleConfigData";
import { UseDataLocal } from "../util/UseDataLocal";
import { useAuth } from "../context/AuthContext";
import "../styles/Storico.css";
import * as XLSX from "xlsx";
import { ScrollTop } from "primereact/scrolltop";

// Set locale for Calendar
UseDataLocal(ITALIAN_LOCALE_CONFIG);

const isDayInPast = (day, currentMonth, currentYear) => {
  const now = new Date();
  const today = now.getDate();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();

  if (now.getMonth() !== currentMonth || now.getFullYear() !== currentYear) {
    return now > new Date(currentYear, currentMonth, day);
  }

  if (day < today) return true;
  if (day > today) return false;
  // If it's today, return true (past) if it's 10:30 or later
  return currentHour > 10 || (currentHour === 10 && currentMinutes >= 30);
};

const processMonthlyOverviewData = (data) => {
  const monthData = {};
  const usernames = new Set();
  let year, month;

  data.forEach((item) => {
    const [yearStr, monthStr, dayStr] = item.reservation_date.split("-");
    const date = new Date(
      parseInt(yearStr),
      parseInt(monthStr) - 1,
      parseInt(dayStr)
    );

    year = date.getFullYear();
    month = date.getMonth();
    const dayOfMonth = date.getDate();
    usernames.add(item.username);

    if (!monthData[dayOfMonth]) {
      monthData[dayOfMonth] = {};
    }
    monthData[dayOfMonth][item.username] = "X";
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    isPast: isDayInPast(i + 1, month, year),
  }));

  return {
    days: days,
    users: Array.from(usernames),
    data: monthData,
    month: new Date(year, month).toLocaleString("it-IT", { month: "long" }),
    year: year,
  };
};

export default function Storico() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedUsername, setSelectedUsername] = useState("");
  const [usernames, setUsernames] = useState([]);
  const [viewMode, setViewMode] = useState("month");
  const [totalOrders, setTotalOrders] = useState(0);
  const [showTotalPerDay, setShowTotalPerDay] = useState(false);
  const [totalPerDayData, setTotalPerDayData] = useState([]);
  const [isAdmin, setAdmin] = useState(false);
  const { user, getToken } = useAuth();
  const ruolo = user.ruolo;
  const [processedData, setProcessedData] = useState(null);
  const [monthlyOverviewData, setMonthlyOverviewData] = useState(null);
  const apiUrl = process.env.REACT_APP_API_URL;

  // Add new state variables for temporary filter values
  const [tempSelectedDate, setTempSelectedDate] = useState(null);
  const [tempSelectedMonth, setTempSelectedMonth] = useState(new Date());
  const [tempSelectedUsername, setTempSelectedUsername] = useState("");
  const [tempViewMode, setTempViewMode] = useState("month");

  // Add new state variable for temporary total/detail view
  const [tempShowTotalPerDay, setTempShowTotalPerDay] = useState(false);

  useEffect(() => {
    if (ruolo === "Amministratore") {
      setAdmin(true);
    }
  }, [ruolo]);

  const fetchData = async () => {
    let url;
    const token = getToken();

    if (ruolo === "Amministratore") {
      if (viewMode === "month" && selectedMonth) {
        const monthString = formatDateforServer(selectedMonth).slice(0, 7);
        url = `${apiUrl}/ordine/readByMese/${monthString}`;
      } else if (viewMode === "day" && selectedDate) {
        const dateString = formatDateforServer(selectedDate);
        url = `${apiUrl}/ordine/ordineByDay/${dateString}`;
      } else {
        return; // Do not fetch if no date is selected
      }
    } else {
      if (viewMode === "month" && selectedMonth) {
        const monthString = formatDateforServer(selectedMonth).slice(0, 7);
        url = `${apiUrl}/ordine/readByIdAndMese/${monthString}/${user.userId}`;
      } else {
        return; // Do not fetch if no date is selected
      }
    }

    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(response.data);
      const uniqueUsernames = [
        ...new Set(response.data.map((item) => item.username)),
      ];
      setUsernames(
        uniqueUsernames.map((username) => ({
          label: username,
          value: username,
        }))
      );
      processData(response.data);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedMonth, viewMode]);

  useEffect(() => {
    if (data) {
      setTotalOrders(data.length);
    }
  }, [data]);

  const filterData = () => {
    if (selectedUsername) {
      setFilteredData(
        data.filter((item) => item.username === selectedUsername)
      );
    } else {
      setFilteredData(data);
    }
  };

  useEffect(() => {
    filterData();
  }, [data, selectedUsername]);

  useEffect(() => {
    if (filteredData) {
      setTotalOrders(filteredData.length);
    }
  }, [filteredData]);

  const formatDateForDisplay = (dateString) => {
    const [year, month, day] = dateString.reservation_date
      ? dateString.reservation_date.split("-")
      : dateString.date.split("-");
    const date = new Date(year, month - 1, day);
    const dayNames = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
    const weekday = dayNames[date.getDay()];

    const formattedDate = `${weekday}. ${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year.slice(-2)}`;
    return formattedDate;
  };

  const handleViewModeChange = (mode) => {
    setTempViewMode(mode);
    setTempSelectedDate(null);
    setTempSelectedMonth(null);
  };

  // Calculate total orders per day
  const calculateTotalPerDayData = () => {
    const totals = (selectedUsername ? filteredData : data).reduce(
      (acc, order) => {
        const date = order.reservation_date.split("T")[0]; // Get only the date
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date]++;
        return acc;
      },
      {}
    );

    const totalPerDayArray = Object.entries(totals).map(
      ([date, totalOrders]) => ({
        date,
        totalOrders,
      })
    );

    setTotalPerDayData(
      totalPerDayArray.sort((a, b) => a.date.localeCompare(b.date))
    );
  };

  useEffect(() => {
    if (showTotalPerDay && (data.length > 0 || filteredData.length > 0)) {
      calculateTotalPerDayData();
    }
  }, [showTotalPerDay, data, filteredData, selectedUsername]);

  // // Modify the generatePDF function to accept a parameter
  // const generatePDF = (type) => {
  //   if (!selectedMonth) {
  //     alert("Per favore, seleziona un mese per generare il PDF.");
  //     return;
  //   }

  // Creazione di un nuovo documento PDF
  // const doc = new jsPDF();
  // Impostazione del font e della dimensione del testo per il titolo
  // doc.setFont("helvetica");
  // doc.setFontSize(20);
  // Impostazione del colore del testo per il titolo
  // doc.setTextColor(40, 40, 40);
  // Inserimento del titolo nel documento
  // doc.text("Relazione Mensile degli Ordini", 14, 30);

  // Impostazione del font e della dimensione del testo per le informazioni
  // doc.setFontSize(12);
  // Impostazione del colore del testo per le informazioni
  // doc.setTextColor(100, 100, 100);
  // Inserimento delle informazioni dell'utente nel documento
  // doc.text(`Utente: ${selectedUsername || "Tutti"}`, 14, 45);
  // Inserimento delle informazioni del mese nel documento
  // doc.text(
  //   `Mese: ${selectedMonth.toLocaleString("it-IT", { month: "long", year: "numeric" })}`,
  //   14,
  //   52
  // );
  // Inserimento del totale degli ordini nel documento
  // doc.text(`Totale Ordini: ${totalOrders}`, 14, 59);

  // Creazione di una tabella automatica per i dati giornalieri
  // doc.autoTable({
  //   startY: 70,
  //   // Definizione delle intestazioni della tabella
  //   head: [["Data", "Totale Ordini"]],
  //   // Preparazione dei dati per la tabella
  //   body: totalPerDayData.map((item) => [
  //     // Formattazione della data per la visualizzazione
  //     formatDateForDisplay(item.date),
  //     item.totalOrders,
  //   ]),
  //   // Stili per la tabella
  //   styles: { fontSize: 10, cellPadding: 5 },
  //   // Stili per le intestazioni della tabella
  //   headStyles: { fillColor: [66, 139, 202], textColor: 255 },
  //   // Stili per le righe alternate della tabella
  //   alternateRowStyles: { fillColor: [245, 245, 245] },
  // });
  // const pageCount = doc.internal.getNumberOfPages();
  // for (let i = 1; i <= pageCount; i++) {
  //   doc.setPage(i);
  //   doc.setFontSize(10);
  //   doc.setTextColor(150);
  //   doc.text(
  //     `Pagina ${i} di ${pageCount}`,
  //     doc.internal.pageSize.width / 2,
  //     doc.internal.pageSize.height - 10,
  //     { align: "center" }
  //   );
  // }

  //  doc.save(
  //     `${selectedUsername || "tutti"}_${selectedMonth.getFullYear()}_${selectedMonth.getMonth() + 1}_ordini.pdf`
  //   );
  // };

  const processData = (data) => {
    const monthData = {};
    const usernames = new Set();
    let year, month;

    data.forEach((item) => {
      const date = new Date(item.reservation_date.split(" ")[1]);
      year = date.getFullYear();
      month = date.getMonth();
      const day = date.getDate();
      usernames.add(item.username);

      if (!monthData[day]) {
        monthData[day] = {};
      }
      monthData[day][item.username] = "X";
    });

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const processedData = {
      days: days,
      users: Array.from(usernames),
      data: monthData,
      month: new Date(year, month).toLocaleString("default", { month: "long" }),
      year: year,
    };

    setProcessedData(processedData);
  };

  useEffect(() => {
    if (data) {
      // Existing data processing
      processData(data);

      // New monthly overview data processing
      const overviewData = processMonthlyOverviewData(data);

      // Filter the users in the monthly overview data if a username is selected
      if (selectedUsername) {
        overviewData.users = overviewData.users.filter(
          (user) => user === selectedUsername
        );
      }

      setMonthlyOverviewData(overviewData);
    }
  }, [data, selectedUsername]);

  const generateExcel = () => {
    if (!monthlyOverviewData) return;

    // Create a complete data set that includes all users
    const completeOverviewData = processMonthlyOverviewData(data);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([]);

    const headerRow = [
      "Utente",
      ...completeOverviewData.days.map((d) => d.day),
      "Totale",
    ];
    XLSX.utils.sheet_add_aoa(ws, [headerRow], { origin: "A1" });

    // Apply styles to header row
    for (let i = 0; i < headerRow.length; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
      ws[cellRef].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "CCCCCC" } },
      };
    }

    // Add data rows for ALL users
    completeOverviewData.users.forEach((user, index) => {
      const rowData = [user];
      let userTotal = 0;
      completeOverviewData.days.forEach(({ day }) => {
        if (
          completeOverviewData.data[day] &&
          completeOverviewData.data[day][user]
        ) {
          rowData.push(1);
          userTotal++;
        } else {
          rowData.push("");
        }
      });
      rowData.push(userTotal); // Add user total
      XLSX.utils.sheet_add_aoa(ws, [rowData], { origin: `A${index + 2}` });
    });

    const monthlyTotalRow = ["Totale del mese"];
    let grandTotal = 0;
    completeOverviewData.days.forEach(({ day }) => {
      const dayTotal = completeOverviewData.data[day]
        ? Object.keys(completeOverviewData.data[day]).length
        : 0;
      grandTotal += dayTotal;
      monthlyTotalRow.push(dayTotal);
    });
    monthlyTotalRow.push(grandTotal); // Add grand total
    XLSX.utils.sheet_add_aoa(ws, [monthlyTotalRow], {
      origin: `A${completeOverviewData.users.length + 2}`,
    });

    // Set column widths
    const colWidths = [{ wch: 20 }]; // Width for the "Utente" column
    for (let i = 1; i <= completeOverviewData.days.length; i++) {
      colWidths.push({ wch: 5 }); // Width for day columns
    }
    colWidths.push({ wch: 10 }); // Width for the "Totale" column
    ws["!cols"] = colWidths;

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Monthly Overview");

    // Generate Excel file
    XLSX.writeFile(
      wb,
      `panoramica_mensile_${monthlyOverviewData.month}_${monthlyOverviewData.year}.xlsx`
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

  const rowClassName = (rowData) => {
    return isDateInPast(rowData.reservation_date) ? "" : "future-date";
  };

  // New function to handle search button click
  const handleSearch = () => {
    setSelectedDate(tempSelectedDate);
    setSelectedMonth(tempSelectedMonth);
    setSelectedUsername(tempSelectedUsername);
    setViewMode(tempViewMode);
    setShowTotalPerDay(tempShowTotalPerDay);
    // This will trigger the useEffect that calls fetchData
  };

  const viewModeOptions = [
    { label: "Mese", value: "month" },
    { label: "Giorno", value: "day" },
  ];

  const detailLevelOptions = [
    { label: "Dettaglio", value: false },
    { label: "Totale", value: true },
  ];

  return (
    <div className="historic-container">
      <div className="card-row">
        <Card className="filter-card">
          <h2>Storico Ordini</h2>
          {isAdmin ? (
            <div className="search-section">
              <div className="p-col-12 p-md-3"></div>
              <div>
                <label htmlFor="viewModeDropdown">Visualizzazione</label>
                <Dropdown
                  id="viewModeDropdown"
                  value={tempViewMode}
                  options={viewModeOptions}
                  onChange={(e) => {
                    setTempViewMode(e.value);
                    setTempSelectedDate(null);
                    setTempSelectedMonth(null);
                  }}
                  placeholder="Seleziona visualizzazione"
                  className="dropdown-user"
                />
              </div>
              <div className="p-col-12 p-md-3">
                <div className="p-field">
                  <label htmlFor="datePicker">
                    {tempViewMode === "month"
                      ? "Seleziona Mese"
                      : "Seleziona Giorno"}
                  </label>
                  <Calendar
                    id="datePicker"
                    value={
                      tempViewMode === "month"
                        ? tempSelectedMonth
                        : tempSelectedDate
                    }
                    onChange={(e) =>
                      tempViewMode === "month"
                        ? setTempSelectedMonth(e.value)
                        : setTempSelectedDate(e.value)
                    }
                    view={tempViewMode === "month" ? "month" : "date"}
                    locale="it"
                    dateFormat={
                      tempViewMode === "month" ? "M. mm/yy" : "D. dd/mm/y"
                    }
                  />
                </div>
              </div>
              <div className="p-col-12 p-md-3">
                <div className="p-field">
                  <label htmlFor="userDropdown">Seleziona Utente</label>
                  <Dropdown
                    id="userDropdown"
                    value={tempSelectedUsername}
                    options={usernames}
                    onChange={(e) => setTempSelectedUsername(e.value)}
                    placeholder="Tutti gli utenti"
                    showClear
                    className="dropdown-user"
                  />
                </div>
              </div>
              <div className="p-col-12 p-md-3">
                <div className="p-field">
                  <label htmlFor="detailLevelDropdown">
                    Livello di Dettaglio
                  </label>
                  <Dropdown
                    id="detailLevelDropdown"
                    value={tempShowTotalPerDay}
                    options={detailLevelOptions}
                    onChange={(e) => setTempShowTotalPerDay(e.value)}
                    placeholder="Seleziona livello di dettaglio"
                    className="dropdown-user"
                  />
                </div>
              </div>
              <div className="search-button-container">
                <Button
                  label="Cerca"
                  icon="pi pi-search"
                  onClick={handleSearch}
                  className="search-button"
                />
              </div>
            </div>
          ) : (
            <div className="search-section-user">
              <div className="p-col-12 p-md-6">
                <div className="p-field">
                  <label htmlFor="datePicker">Seleziona Mese</label>
                  <Calendar
                    id="datePicker"
                    value={tempSelectedMonth}
                    onChange={(e) => setTempSelectedMonth(e.value)}
                    view="month"
                    locale="it"
                    dateFormat="M. mm/yy"
                  />
                </div>
              </div>
            </div>
          )}

          {isAdmin && monthlyOverviewData && (
            <div className="total-pdf-card" id="rapporto-amministrazione">
              <div className="pdf-button-section">
                {/* PDF generation button remains commented out
                <Button
                  label={
                    tempSelectedUsername
                      ? `Genera PDF totali del mese di ${tempSelectedUsername}`
                      : "Genera PDF totali del mese per tutti "
                  }
                  icon="pi pi-file-pdf"
                  onClick={() => generatePDF("daily")}
                />
                */}

                <Button
                  label={`Panoramica Mensile di ${monthlyOverviewData.month} ${monthlyOverviewData.year}`}
                  icon="pi pi-download"
                  onClick={generateExcel}
                  className="p-mt-3"
                />
              </div>
            </div>
          )}
        </Card>

        {/* Display of data: different tables for total per day or filtered data */}
        <Card className="data-card">
          {showTotalPerDay ? (
            <DataTable
              value={totalPerDayData}
              className="p-datatable-responsive"
              emptyMessage="Nessun ordine trovato"
            >
              <Column
                field="date"
                header="Data" // Changed to Italian
                body={(rowData) => formatDateForDisplay(rowData)}
              />
              <Column
                field="totalOrders"
                header="Totale Ordini" // Changed to Italian
              />
            </DataTable>
          ) : (
            <DataTable
              value={filteredData}
              className="p-datatable-responsive"
              emptyMessage="Nessun ordine trovato"
              rowClassName={rowClassName}
            >
              {isAdmin && <Column field="username" header="Nome Utente" />}
              <Column
                field="reservation_date"
                header="Data Prenotazione" // Changed to Italian
                body={(rowData) => formatDateForDisplay(rowData)}
              />
              <Column field="piatti" header="Tipo di Piatti" />
            </DataTable>
          )}
        </Card>
      </div>

      {monthlyOverviewData && (
        <Card className="data-card">
          <h3>
            Panoramica Mensile - {monthlyOverviewData.month}{" "}
            {monthlyOverviewData.year}
            {selectedUsername && ` - ${selectedUsername}`}
          </h3>
          <table className="monthly-table">
            <thead>
              <tr>
                <th>Utente</th>
                {monthlyOverviewData.days.map(({ day }) => (
                  <th key={day}>{day}</th>
                ))}
                <th>Totale</th>
              </tr>
            </thead>
            <tbody>
              {monthlyOverviewData.users.map((user) => (
                <tr key={user}>
                  <td>{user}</td>
                  {monthlyOverviewData.days.map(({ day, isPast }) => (
                    <td
                      key={day}
                      style={
                        !isPast &&
                        monthlyOverviewData.data[day] &&
                        monthlyOverviewData.data[day][user]
                          ? {
                              backgroundColor: "green",
                              color: "white",
                              fontWeight: "bold",
                            }
                          : {}
                      }
                    >
                      {monthlyOverviewData.data[day] &&
                      monthlyOverviewData.data[day][user]
                        ? "1"
                        : ""}
                    </td>
                  ))}
                  <td>
                    {
                      monthlyOverviewData.days.filter(
                        ({ day }) =>
                          monthlyOverviewData.data[day] &&
                          monthlyOverviewData.data[day][user]
                      ).length
                    }
                  </td>
                </tr>
              ))}
              <tr>
                <td>Totale per giorno</td>
                {monthlyOverviewData.days.map(({ day }) => (
                  <td key={day}>
                    {monthlyOverviewData.data[day]
                      ? selectedUsername
                        ? monthlyOverviewData.data[day][selectedUsername]
                          ? 1
                          : 0
                        : Object.keys(monthlyOverviewData.data[day]).length
                      : 0}
                  </td>
                ))}
                <td className="grand-total total-orders">
                  {monthlyOverviewData.days.reduce(
                    (total, { day }) =>
                      total +
                      (monthlyOverviewData.data[day]
                        ? selectedUsername
                          ? monthlyOverviewData.data[day][selectedUsername]
                            ? 1
                            : 0
                          : Object.keys(monthlyOverviewData.data[day]).length
                        : 0),
                    0
                  )}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="total-orders-section">
            <h3>&nbsp;Totale Ordini:&nbsp;</h3>
            <h3 className="total-orders">
              {showTotalPerDay
                ? totalPerDayData.reduce(
                    (sum, item) => sum + item.totalOrders,
                    0
                  )
                : totalOrders}
            </h3>
          </div>
        </Card>
      )}
      <ScrollTop />
    </div>
  );
}

// Add this CSS to your stylesheet (e.g., HistoricComponent.css)
/*
.future-date {
  color: green;
  font-weight: bold;
}
*/
