import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import Login from "./Login";

function Dashboard() {
import TravelForm from "./TravelForm";
import TravelList from "./TravelList";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";

function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h1>My Travel Log</h1>

      <button onClick={() => signOut(auth)}>Logout</button>

      <TravelForm refresh={() => setRefreshKey(old => old + 1)} />
      <TravelList key={refreshKey} />
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return null;

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={user ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
