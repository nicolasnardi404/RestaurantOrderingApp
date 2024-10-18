export default function formatDateforServer(date) {
  const d = date instanceof Date ? date : new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
}
