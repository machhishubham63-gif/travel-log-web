import { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import TravelForm from "./TravelForm";
import TravelList from "./TravelList";
import Login from "./Login";
import PersonsManager from "./PersonsManager";
import MonthlyDashboard from "./MonthlyDashboard";
import Settlements from "./Settlements";
import YearlySummary from "./YearlySummary";
import CalendarView from "./CalendarView";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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
  if (!user) return <Login />;

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard": return <MonthlyDashboard user={user} />;
      case "add": return <TravelForm user={user} />;
      case "calendar": return <CalendarView user={user} />;
      case "history": return (
        <>
          <h2 style={{ color: "white", marginTop: 0, paddingLeft: "4px" }}>History</h2>
          <TravelList user={user} />
        </>
      );
      case "yearly": return <YearlySummary user={user} />;
      case "pay": return <Settlements user={user} />;
      case "persons": return <PersonsManager user={user} />;
      default: return <MonthlyDashboard user={user} />;
    }
  };

  return (
    <div style={{ 
      maxWidth: "600px", margin: "0 auto", fontFamily: "system-ui, -apple-system, sans-serif",
      backgroundColor: "#000000", // AMOLED Pure Black
      minHeight: "100vh", display: "flex", flexDirection: "column"
    }}>
      
      {/* --- TOP HEADER --- */}
      <div style={{ 
        display: "flex", justifyContent: "space-between", alignItems: "center", 
        padding: "16px 20px", backgroundColor: "#000000", position: "sticky", top: 0, zIndex: 100
      }}>
        <h1 style={{ margin: 0, color: "white", fontSize: "22px", fontWeight: "700" }}>Travel Log</h1>
        <button onClick={handleLogout} style={{ padding: "6px 14px", backgroundColor: "#1e1e1e", color: "#fca5a5", border: "none", borderRadius: "16px", fontSize: "14px", fontWeight: "600" }}>
          Logout
        </button>
      </div>
      
      {/* --- MAIN CONTENT AREA --- */}
      <div style={{ padding: "16px", paddingBottom: "100px", flex: 1 }}>
        {renderTabContent()}
      </div>

      {/* --- MODERN BOTTOM NAVIGATION BAR --- */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, width: "100%",
        backgroundColor: "#111111", // Slightly elevated dark container
        display: "flex", justifyContent: "space-around",
        padding: "12px 0", paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        zIndex: 1000,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.5)"
      }}>
        <NavButton label="Dash" icon="📊" isActive={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
        <NavButton label="Add" icon="➕" isActive={activeTab === "add"} onClick={() => setActiveTab("add")} />
        <NavButton label="Cal" icon="📅" isActive={activeTab === "calendar"} onClick={() => setActiveTab("calendar")} />
        <NavButton label="List" icon="📜" isActive={activeTab === "history"} onClick={() => setActiveTab("history")} />
        <NavButton label="Year" icon="📈" isActive={activeTab === "yearly"} onClick={() => setActiveTab("yearly")} />
        <NavButton label="Pay" icon="💸" isActive={activeTab === "pay"} onClick={() => setActiveTab("pay")} />
      </div>

    </div>
  );
}

// Material 3 Style Navigation Button
function NavButton({ label, icon, isActive, onClick }) {
  return (
    <button 
      onClick={onClick}
      style={{
        background: "none", border: "none", color: isActive ? "white" : "#888",
        display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", flex: 1, padding: 0
      }}
    >
      <div style={{
        backgroundColor: isActive ? "#a8c7fa40" : "transparent", // Highlight Pill
        padding: "4px 16px", borderRadius: "16px", marginBottom: "4px", transition: "background-color 0.2s"
      }}>
        <span style={{ fontSize: "20px" }}>{icon}</span>
      </div>
      <span style={{ fontSize: "11px", fontWeight: isActive ? "700" : "500" }}>{label}</span>
    </button>
  );
}
