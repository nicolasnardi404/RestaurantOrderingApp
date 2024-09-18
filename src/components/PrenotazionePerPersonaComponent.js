export default function PrenotazionePerPersonaComponent({idUser}) {
    const [data, setData] = useState([]);
    const navigate = useNavigate();
  
    useEffect(() => {
      fetch('http://localhost:8080/api/prenotazione/readById/${idUser}')
        .then(response => response.json())
        .then(data => setData(data));
    }, []);
  
    function handleClick() {
      navigate("/prenotazione-per-persona");
    }
  
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return `${new Intl.DateTimeFormat('it-IT').format(date)}`;
    };
  
    return (
      <div>
        <DataTable value={data.map(item => ({
          nome: data.username,
          data: data.dataPrenotazione,
          order: `${item.tipo_piatti}`
        }))} paginator rows={5} rowsPerPageOptions={[5, 10, 25, 50]} tableStyle={{ minWidth: '50rem' }}>
          <Column field="nome" sortable header="Nome" style={{ width: '25%' }}></Column>
          <Column field="data" sortable header="Giorno dell'Ordine" style={{ width: '25%' }} body={(rowData) => formatDate(rowData.order_data)}></Column>
          <Column field="order" sortable header="Ordine" style={{ width: '25%' }}></Column>
        </DataTable>
        <Button onClick={handleClick}>Prenotazione per persona</Button>
      </div>
    );
}