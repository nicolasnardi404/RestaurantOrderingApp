
export const formatCalendarData = (date) => {
    if (!(date instanceof Date)) {
      throw new Error("Invalid date object");
    }
  
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // getMonth() returns 0 for January
    const day = String(date.getDate()).padStart(2, "0");
  
    return `${year}-${month}-${day}`;
  };