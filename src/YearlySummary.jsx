import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import * as XLSX from "xlsx";

// NEW: Accepts the navigateTo prop
export default function YearlySummary({ user, navigateTo }) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [travels, setTravels] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "travels"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allData = snapshot.docs.map(d => d.data());
      const yearlyData = allData.filter(d => d.date && d.date.startsWith(selectedYear));
      setTravels(yearlyData);
    }, (error) => console.error(error));
    return () => unsubscribe();
  }, [user, selectedYear]);

  const handleExport = () => {
    if (travels.length === 0) { alert("No data to export."); return; }
    const excelData = travels.map(t => ({
      "Date": t.date, "Status": t.isNotGoing ? "Not Going" : "Traveled",
      "Morning Method": t.morning?.method || "-", "Morning Amount (₹)": t.morning?.amount || 0,
      "Evening Method": t.evening?.method || "-", "Evening Amount (₹)": t.evening?.amount || 0,
      "Total Amount (₹)": t.totalAmount || 0
    }));
    excelData.sort((a, b) => new Date(a.Date) - new Date(b.Date));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Travels_${selectedYear}`);
    XLSX.writeFile(workbook, `TravelLog_${selectedYear}.xlsx`);
  };

  let totalSpent = 0; let totalDays = 0;
  const monthlyBreakdown = {}; const personBreakdown = {};

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  monthNames.forEach((month, index) => {
    const monthNum = (index + 1).toString().padStart(2, '0');
    monthlyBreakdown[`${selectedYear}-${monthNum}`] = { name: month, amount: 0 };
  });

  travels.forEach(t => {
    totalSpent += t.totalAmount || 0;
    if (!t.isNotGoing) {
      totalDays += 1;
      if (t.monthKey && monthlyBreakdown[t.monthKey]) monthlyBreakdown[t.monthKey].amount += t.totalAmount || 0;
      if (t.morning?.method) personBreakdown[t.morning.method] = (personBreakdown[t.morning.method] || 0) + (Number(t.morning.amount) || 0);
      if (t.evening?.method) personBreakdown[t.evening.method] = (personBreakdown[t.evening.method] || 0) + (Number(t.evening.amount) || 0);
    }
  });

  return (
    <div style={{ paddingBottom: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0, color: "white", paddingLeft: "4px" }}>Yearly Summary</h2>
        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ padding: "8px 12px", borderRadius: "12px", border: "none", background: "#222222", color: "white", fontSize: "16px" }}>
          {[...Array(5)].map((_, i) => { const year = (new Date().getFullYear() - 2 + i).toString(); return <option key={year} value={year}>{year}</option>; })}
        </select>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <div style={{ flex: 1, backgroundColor: "#111111", padding: "16px", borderRadius: "20px", textAlign: "center" }}>
          <p style={{ margin: "0 0 5px 0", color: "#aaa", fontSize: "14px" }}>Yearly Total</p>
          <h3 style={{ margin: 0, fontSize: "24px", color: "#fca5a5" }}>₹{totalSpent}</h3>
        </div>
        <div style={{ flex: 1, backgroundColor: "#111111", padding: "16px", borderRadius: "20px", textAlign: "center" }}>
          <p style={{ margin: "0 0 5px 0", color: "#aaa", fontSize: "14px" }}>Total Days</p>
          <h3 style={{ margin: 0, fontSize: "24px", color: "#a8c7fa" }}>{totalDays}</h3>
        </div>
      </div>

      <h3 style={{ color: "white", fontSize: "16px", marginBottom: "12px", paddingLeft: "4px" }}>Person Breakdown</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
        {Object.entries(personBreakdown).sort((a, b) => b[1] - a[1]).map(([method, amount]) => (
          <div key={method} style={{ display: "flex", justifyContent: "space-between", backgroundColor: "#111111", padding: "14px", borderRadius: "16px", color: "white" }}>
            <span>{method}</span><strong style={{ color: "#a8c7fa" }}>₹{amount}</strong>
          </div>
        ))}
      </div>

      <h3 style={{ color: "white", fontSize: "16px", marginBottom: "12px", paddingLeft: "4px" }}>Monthly Breakdown</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "30px" }}>
        {Object.entries(monthlyBreakdown).map(([key, data]) => (
          // NEW: Added onClick and pointer cursor to navigate!
          <div 
            key={key} 
            onClick={() => navigateTo("dashboard", key)}
            style={{ display: "flex", justifyContent: "space-between", backgroundColor: "#111111", padding: "14px", borderRadius: "16px", color: "white", borderLeft: data.amount > 0 ? "4px solid #34d399" : "4px solid #333", cursor: "pointer", transition: "background-color 0.2s" }}
            onActive={(e) => e.currentTarget.style.backgroundColor = "#222"}
          >
            <span>{data.name} <span style={{fontSize: "12px", color: "#666"}}>→ View</span></span>
            <strong style={{ color: data.amount > 0 ? "white" : "#666" }}>₹{data.amount}</strong>
          </div>
        ))}
      </div>

      <button onClick={handleExport} style={{ width: "100%", padding: "16px", backgroundColor: "#34d399", color: "#000000", border: "none", borderRadius: "24px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
        <span>📊</span> Download Excel Data
      </button>
    </div>
  );
}
