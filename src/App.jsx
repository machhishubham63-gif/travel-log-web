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
import Settings from "./Settings";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const [globalMonth, setGlobalMonth] = useState(new Date().toISOString().substring(0, 7));
  const [userSettings, setUserSettings] = useState({ pinEnabled: false, pin: "" });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, "settings", user.uid), (docSnap) => {
      if (docSnap.exists()) setUserSettings(docSnap.data());
    });
    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      try { await signOut(auth); } 
      catch (error) { console.error("Error signing out: ", error); }
    }
  };

  const navigateTo = (tabName, specificMonthKey = null) => {
    if (specificMonthKey) setGlobalMonth(specificMonthKey);
    setActiveTab(tabName);
  };

  if (loading) return <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#000", color: "#448aff", fontSize: "18px", fontWeight: "700" }}>Loading...</div>;
  if (!user) return <Login />;

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard": return <MonthlyDashboard user={user} globalMonth={globalMonth} setGlobalMonth={setGlobalMonth} userSettings={userSettings} />;
      case "add": return <TravelForm user={user} />;
      case "calendar": return <CalendarView user={user} globalMonth={globalMonth} setGlobalMonth={setGlobalMonth} navigateTo={navigateTo} />;
      case "history": return <><h2 style={{ margin: "0 0 24px 0", color: "white", fontSize: "28px", fontWeight: "800", letterSpacing: "-0.5px", paddingLeft: "8px" }}>History</h2><TravelList user={user} /></>;
      case "yearly": return <YearlySummary user={user} navigateTo={navigateTo} />;
      case "pay": return <Settlements user={user} globalMonth={globalMonth} setGlobalMonth={setGlobalMonth} userSettings={userSettings} />;
      case "persons": return <PersonsManager user={user} />;
      case "settings": return <Settings user={user} />;
      default: return <MonthlyDashboard user={user} globalMonth={globalMonth} setGlobalMonth={setGlobalMonth} userSettings={userSettings} />;
    }
  };

  // --- NATIVE SVG ICONS ---
  const icons = {
    dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>,
    add: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
    calendar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    history: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    yearly: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    pay: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
    settings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#000000", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      
      {/* PREMIUM HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 100 }}>
        <h1 style={{ margin: 0, color: "white", fontSize: "22px", fontWeight: "800", letterSpacing: "-0.5px" }}>Travel Log</h1>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={() => setActiveTab("settings")} style={{ padding: "8px", backgroundColor: "#111111", color: activeTab === "settings" ? "#448aff" : "#888", border: "1px solid #222", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
            {icons.settings}
          </button>
          <button onClick={handleLogout} style={{ padding: "8px 16px", backgroundColor: "#ff525215", color: "#ff8a80", border: "1px solid #ff525230", borderRadius: "20px", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}>
            Logout
          </button>
        </div>
      </div>
      
      {/* MAIN CONTENT AREA */}
      <div style={{ padding: "16px", paddingBottom: "110px", flex: 1 }}>
        {renderTabContent()}
      </div>

      {/* MODERN SVG NAVIGATION BAR */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, width: "100%",
        backgroundColor: "#0A0A0A", 
        borderTop: "1px solid #1A1A1A",
        display: "flex", justifyContent: "space-around",
        padding: "10px 4px", paddingBottom: "calc(10px + env(safe-area-inset-bottom))",
        zIndex: 1000
      }}>
        <NavButton label="Dash" icon={icons.dashboard} isActive={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
        <NavButton label="Add" icon={icons.add} isActive={activeTab === "add"} onClick={() => setActiveTab("add")} />
        <NavButton label="Cal" icon={icons.calendar} isActive={activeTab === "calendar"} onClick={() => setActiveTab("calendar")} />
        <NavButton label="List" icon={icons.history} isActive={activeTab === "history"} onClick={() => setActiveTab("history")} />
        <NavButton label="Year" icon={icons.yearly} isActive={activeTab === "yearly"} onClick={() => setActiveTab("yearly")} />
        <NavButton label="Pay" icon={icons.pay} isActive={activeTab === "pay"} onClick={() => setActiveTab("pay")} />
      </div>

    </div>
  );
}

// SLEEK INDICATOR PILL COMPONENT
function NavButton({ label, icon, isActive, onClick }) {
  return (
    <button 
      onClick={onClick}
      style={{
        background: "none", border: "none", color: isActive ? "#448aff" : "#666666",
        display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", flex: 1, padding: 0
      }}
    >
      <div style={{
        backgroundColor: isActive ? "#448aff15" : "transparent",
        padding: "6px 16px", borderRadius: "20px", marginBottom: "4px", transition: "all 0.2s ease",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        {icon}
      </div>
      <span style={{ fontSize: "11px", fontWeight: isActive ? "800" : "600", letterSpacing: "0.2px", transition: "all 0.2s ease" }}>{label}</span>
    </button>
  );
}
