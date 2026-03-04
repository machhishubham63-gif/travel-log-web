import { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import TravelForm from "./TravelForm";
import TravelList from "./TravelList";
import Login from "./Login";
import PersonsManager from "./PersonsManager";
import MonthlyDashboard from "./MonthlyDashboard";
import Settlements from "./Settlements";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // New State to track which tab is currently open
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Error signing out: ", error);
      }
    }
  };

  if (loading) return <div style={{ textAlign: "center", marginTop: "50px", color: "white" }}>Loading...</div>;

  if (!user) {
    return <Login />;
  }

  // Helper function to render the correct component based on the active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <MonthlyDashboard user={user} />;
      case "add":
        return <TravelForm user={user} />;
      case "history":
        return (
          <>
            <h2 style={{ color: "white", marginTop: 0 }}>Travel History</h2>
            <TravelList user={user} />
          </>
        );
      case "persons":
        return <PersonsManager user={user} />;
      case "pay": // <--- ADD THIS CASE
        return <Settlements user={user} />;
      default:
    }
  };

  return (
    <div style={{ 
      maxWidth: "600px", 
      margin: "0 auto", 
      fontFamily: "sans-serif",
      backgroundColor: "#0f172a", // Dark background for the whole app
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column"
    }}>
      
      {/* --- TOP HEADER --- */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        padding: "15px 20px",
        backgroundColor: "#1e1e1e",
        borderBottom: "1px solid #333",
        position: "sticky",
        top: 0,
        zIndex: 100
      }}>
        <h1 style={{ margin: 0, color: "white", fontSize: "20px" }}>Travel Log</h1>
        <button 
          onClick={handleLogout}
          style={{
            padding: "6px 12px",
            backgroundColor: "transparent",
            color: "#ef4444",
            border: "1px solid #ef4444",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          Logout
        </button>
      </div>
      
      {/* --- MAIN CONTENT AREA --- */}
      {/* Added bottom padding so the fixed nav bar doesn't cover content */}
      <div style={{ padding: "20px", paddingBottom: "80px", flex: 1 }}>
        {renderTabContent()}
      </div>

      {/* --- BOTTOM NAVIGATION BAR --- */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        backgroundColor: "#1e1e1e",
        borderTop: "1px solid #333",
        display: "flex",
        justifyContent: "space-around",
        padding: "10px 0",
        paddingBottom: "max(10px, env(safe-area-inset-bottom))", // iPhone/Modern Android safe area
        zIndex: 1000
      }}>
        <NavButton 
          label="Dashboard" 
          icon="📊" 
          isActive={activeTab === "dashboard"} 
          onClick={() => setActiveTab("dashboard")} 
        />
        <NavButton 
          label="Add" 
          icon="➕" 
          isActive={activeTab === "add"} 
          onClick={() => setActiveTab("add")} 
        />
        <NavButton 
          label="History" 
          icon="📜" 
          isActive={activeTab === "history"} 
          onClick={() => setActiveTab("history")} 
        />
        <NavButton 
          label="History" 
          icon="📜" 
          isActive={activeTab === "history"} 
          onClick={() => setActiveTab("history")} 
        />
        <NavButton 
          label="Pay" 
          icon="💸" 
          isActive={activeTab === "pay"} 
          onClick={() => setActiveTab("pay")} 
        />
        <NavButton 
          label="Persons" 
          icon="👥" 
          
        <NavButton 
          label="Persons" 
          icon="👥" 
          isActive={activeTab === "persons"} 
          onClick={() => setActiveTab("persons")} 
        />
      </div>

    </div>
  );
}

// A small helper component just for the navigation buttons to keep code clean
function NavButton({ label, icon, isActive, onClick }) {
  return (
    <button 
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        color: isActive ? "#3b82f6" : "#888", // Blue if active, gray if not
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        cursor: "pointer",
        flex: 1,
        padding: "5px"
      }}
    >
      <span style={{ fontSize: "20px", marginBottom: "4px" }}>{icon}</span>
      <span style={{ fontSize: "12px", fontWeight: isActive ? "bold" : "normal" }}>{label}</span>
    </button>
  );
}
