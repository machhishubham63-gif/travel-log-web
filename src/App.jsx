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

  if (loading) return <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "var(--bg-main)", color: "var(--accent-blue)", fontSize: "18px", fontWeight: "800" }}>Loading...</div>;
  if (!user) return <Login />;

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard": return <MonthlyDashboard user={user} globalMonth={globalMonth} setGlobalMonth={setGlobalMonth} userSettings={userSettings} />;
      case "add": return <TravelForm user={user} />;
      case "calendar": return <CalendarView user={user} globalMonth={globalMonth} setGlobalMonth={setGlobalMonth} navigateTo={navigateTo} />;
      case "history": return <><h2 style={{ margin: "0 0 24px 0", color: "var(--text-main)", fontSize: "28px", fontWeight: "800", letterSpacing: "-0.5px", paddingLeft: "8px" }}>History</h2><TravelList user={user} /></>;
      case "yearly": return <YearlySummary user={user} navigateTo={navigateTo} />;
      case "pay": return <Settlements user={user} globalMonth={globalMonth} setGlobalMonth={setGlobalMonth} userSettings={userSettings} />;
      case "persons": return <PersonsManager user={user} />;
      case "settings": return <Settings user={user} />;
      default: return <MonthlyDashboard user={user} globalMonth={globalMonth} setGlobalMonth={setGlobalMonth} userSettings={userSettings} />;
    }
  };

  const icons = {
    dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>,
    add: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
    calendar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    history: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="2
