import { BrowserRouter, Routes, Route } from "react-router-dom";

function Dashboard() {
  return <h1 style={{color:"white",textAlign:"center"}}>Travel Log Dashboard</h1>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
