  import ReactDOM from "react-dom/client";
  import { BrowserRouter, Routes, Route } from "react-router-dom";
  import Home from "./pages/Home";
  import LogIn from "./pages/LogIn";
  import Menu from "./pages/Menu";
  import Apps from "./Apps"

  export default function App() {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LogIn />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/app" element={<Apps />} />
        </Routes>
      </BrowserRouter>
    );
  }

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);