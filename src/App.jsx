import MonthlyDashboard from "./MonthlyDashboard";
import { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import TravelForm from "./TravelForm";
import TravelList from "./TravelList";
import Login from "./Login";
import PersonsManager from "./PersonsManager"; // <-- 1. Imported the new component

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for login/logout events
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  if (loading) return <div style={{ textAlign: "center", marginTop: "50px" }}>Loading...</div>;

  // If the user is NOT logged in, just show the Login screen
  if (!user) {
    return <Login />;
  }

  // If the user IS logged in, show the main App
  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ margin: 0 }}>Travel Log</h1>
        <button 
          onClick={handleLogout}
          style={{
            padding: "8px 16px",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Logout
        </button>
      </div>
      
      <p style={{ color: "#666", marginBottom: "20px" }}>Logged in as: <strong>{user.email}</strong></p>
      <p style={{ color: "#666", marginBottom: "20px" }}>Logged in as: <strong>{user.email}</strong></p>

      {/* NEW DASHBOARD PLACED HERE */}
      <MonthlyDashboard user={user} />

      <TravelForm user={user} />
      
      <hr style={{ margin: "30px 0", border: "1px solid #eee" }} />
      
      <h2>Your Travel History</h2>
      <TravelList user={user} />

      {/* --- 2. Added the Persons Manager Section Here --- */}
      <hr style={{ margin: "30px 0", border: "1px solid #eee" }} />
      
      <h2>Step 1: Setup Persons</h2>
      <p style={{ color: "#666", marginBottom: "15px", fontSize: "14px" }}>
        Add Prashant and Unnat here first, so we can use them in the new Travel Form.
      </p>
      <PersonsManager user={user} />
      
    </div>
  );
}
