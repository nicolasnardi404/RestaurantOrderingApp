export const formatDateForDisplay = (dateString) => {
  const [year, month, day] = dateString.reservation_date.split("-");
  const date = new Date(year, month - 1, day);
  const dayNames = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
  const weekday = dayNames[date.getDay()];

  const formattedDate = `${weekday}. ${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year.slice(-2)}`;
  return formattedDate;
};
