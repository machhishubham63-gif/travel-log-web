import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import TravelForm from "./TravelForm";
import TravelList from "./TravelList";
import Login from "./Login";
import PersonsManager from "./PersonsManager";
import MonthlyDashboard from "./MonthlyDashboard";
import Settlements from "./Settlements";
import YearlySummary from "./YearlySummary";
import CalendarView from "./CalendarView";
import Settings from "./Settings"; // NEW Import

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // NEW: Global state so tabs can talk to each other
  const [globalMonth, setGlobalMonth] = useState(new Date().toISOString().substring(0, 7));
  const [userSettings, setUserSettings] = useState({ pinEnabled: false, pin: "" });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // NEW: Listen to PIN settings in the background
  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, "settings", user.uid), (docSnap) => {
      if (docSnap.exists()) setUserSettings(docSnap.data());
    });
    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Error signing out: ", error);
      }
    }
  };

  // NEW: Traffic controller function
  const navigateTo = (tabName, specificMonthKey = null) => {
    if (specificMonthKey) setGlobalMonth(specificMonthKey);
    setActiveTab(tabName);
  };

  if (loading) return <div style={{ textAlign: "center", marginTop: "50px", color: "white" }}>Loading...</div>;
  if (!user) return <Login />;

  const renderTabContent = () => {
    switch (activeTab) {
      // Pass the global functions down to the components
      case "dashboard": return <MonthlyDashboard user={user} globalMonth={globalMonth} setGlobalMonth={setGlobalMonth} userSettings={userSettings} />;
      case "add": return <TravelForm user={user} />;
      case "calendar": return <CalendarView user={user} globalMonth={globalMonth} setGlobalMonth={setGlobalMonth} navigateTo={navigateTo} />;
      case "history": return <><h2 style={{ color: "white", marginTop: 0, paddingLeft: "4px" }}>History</h2><TravelList user={user} /></>;
      case "yearly": return <YearlySummary user={user} navigateTo={navigateTo} />;
      case "pay": return <Settlements user={user} globalMonth={globalMonth} setGlobalMonth={setGlobalMonth} userSettings={userSettings} />;
      case "persons": return <PersonsManager user={user} />;
      case "settings": return <Settings user={user} />;
      default: return <MonthlyDashboard user={user} globalMonth={globalMonth} setGlobalMonth={setGlobalMonth} userSettings={userSettings} />;
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#000000", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", backgroundColor: "#000000", position: "sticky", top: 0, zIndex: 100 }}>
        <h1 style={{ margin: 0, color: "white", fontSize: "22px", fontWeight: "700" }}>Travel Log</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          {/* NEW: Settings Button */}
          <button onClick={() => setActiveTab("settings")} style={{ padding: "6px 10px", backgroundColor: "#1e1e1e", color: "white", border: "none", borderRadius: "16px", fontSize: "16px", cursor: "pointer" }}>⚙️</button>
          <button onClick={handleLogout} style={{ padding: "6px 14px", backgroundColor: "#1e1e1e", color: "#fca5a5", border: "none", borderRadius: "16px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>Logout</button>
        </div>
      </div>
      
      <div style={{ padding: "16px", paddingBottom: "100px", flex: 1 }}>
        {renderTabContent()}
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, width: "100%", backgroundColor: "#111111", display: "flex", justifyContent: "space-around", padding: "12px 0", paddingBottom: "max(12px, env(safe-area-inset-bottom))", zIndex: 1000, boxShadow: "0 -4px 20px rgba(0,0,0,0.5)" }}>
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

function NavButton({ label, icon, isActive, onClick }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", color: isActive ? "white" : "#888", display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", flex: 1, padding: 0 }}>
      <div style={{ backgroundColor: isActive ? "#a8c7fa40" : "transparent", padding: "4px 16px", borderRadius: "16px", marginBottom: "4px", transition: "background-color 0.2s" }}>
        <span style={{ fontSize: "20px" }}>{icon}</span>
      </div>
      <span style={{ fontSize: "11px", fontWeight: isActive ? "700" : "500" }}>{label}</span>
    </button>
  );
}
