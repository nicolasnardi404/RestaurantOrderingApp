  import ReactDOM from "react-dom/client";
  import { BrowserRouter, Routes, Route } from "react-router-dom";
  import Home from "./pages/Home";
  import LogIn from "./pages/LogIn";
  import Menu from "./pages/Menu";
  import Historic from "./pages/Historic"
  import './App.css'
  import OpenOrders from "./pages/OpenOrders";
  // import PrenotazionePerPersona from "./pages/PrenotazionePerPersona"
  
  import MyApp from "./_app";

  export default function App() {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LogIn />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/historic" element={<Historic />} />
          {/* <Route path="/prenotazione-per-persona" element={<PrenotazionePerPersona />}/> */}
          <Route path="/test" element={<MyApp />} />
          <Route path="/open-orders" element={<OpenOrders />} />
        </Routes>
      </BrowserRouter>
    );
  }

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);