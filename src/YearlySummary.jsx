import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function YearlySummary({ user }) {
  // Default to the current year
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [travels, setTravels] = useState([]);

  // Fetch all travels for the user and filter by year in JavaScript
  // This completely avoids the Firebase "Composite Index" error!
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "travels"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allData = snapshot.docs.map(d => d.data());
      
      // Filter out only the trips that match the selected year (e.g., starts with "2026")
      const yearlyData = allData.filter(d => d.date && d.date.startsWith(selectedYear));
      setTravels(yearlyData);
      
    }, (error) => {
      console.error("Error fetching yearly data:", error);
    });

    return () => unsubscribe();
  }, [user, selectedYear]);

  // --- CALCULATIONS ---
  let totalSpent = 0;
  let totalDays = 0;
  const monthlyBreakdown = {};
  const personBreakdown = {};

  // Initialize all 12 months so they show up even if empty
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  monthNames.forEach((month, index) => {
    // Format to match monthKey ending (e.g., "-01", "-02")
    const monthNum = (index + 1).toString().padStart(2, '0');
    monthlyBreakdown[`${selectedYear}-${monthNum}`] = { name: month, amount: 0 };
  });

  travels.forEach(t => {
    totalSpent += t.totalAmount || 0;
    
    if (!t.isNotGoing) {
      totalDays += 1;
      
      // Add to monthly breakdown
      if (t.monthKey && monthlyBreakdown[t.monthKey]) {
        monthlyBreakdown[t.monthKey].amount += t.totalAmount || 0;
      }

      // Add to person breakdown
      if (t.morning?.method) {
        personBreakdown[t.morning.method] = (personBreakdown[t.morning.method] || 0) + (Number(t.morning.amount) || 0);
      }
      if (t.evening?.method) {
        personBreakdown[t.evening.method] = (personBreakdown[t.evening.method] || 0) + (Number(t.evening.amount) || 0);
      }
    }
  });

  // Find the most expensive month
  let highestMonthName = "-";
  let highestMonthAmount = 0;
  Object.values(monthlyBreakdown).forEach(m => {
    if (m.amount > highestMonthAmount) {
      highestMonthAmount = m.amount;
      highestMonthName = m.name;
    }
  });

  return (
    <div style={{ paddingBottom: "20px" }}>
      
      {/* Header & Year Selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0, color: "white" }}>Yearly Summary</h2>
        <select 
          value={selectedYear} 
          onChange={(e) => setSelectedYear(e.target.value)}
          style={{ padding: "8px", borderRadius: "6px", border: "none", background: "#333", color: "white", fontSize: "16px" }}
        >
          {/* Add a few years back and forward dynamically */}
          {[...Array(5)].map((_, i) => {
            const year = (new Date().getFullYear() - 2 + i).toString();
            return <option key={year} value={year}>{year}</option>;
          })}
        </select>
      </div>

      {/* Main Stats Cards */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <div style={{ flex: 1, backgroundColor: "#2d2d2d", padding: "15px", borderRadius: "8px", textAlign: "center" }}>
          <p style={{ margin: "0 0 5px 0", color: "#aaa", fontSize: "14px" }}>Yearly Total</p>
          <h3 style={{ margin: 0, fontSize: "24px", color: "#ef4444" }}>₹{totalSpent}</h3>
        </div>
        <div style={{ flex: 1, backgroundColor: "#2d2d2d", padding: "15px", borderRadius: "8px", textAlign: "center" }}>
          <p style={{ margin: "0 0 5px 0", color: "#aaa", fontSize: "14px" }}>Total Days</p>
          <h3 style={{ margin: 0, fontSize: "24px", color: "#3b82f6" }}>{totalDays}</h3>
        </div>
      </div>

      <div style={{ backgroundColor: "#2d2d2d", padding: "15px", borderRadius: "8px", marginBottom: "20px", textAlign: "center" }}>
        <p style={{ margin: "0 0 5px 0", color: "#aaa", fontSize: "14px" }}>Most Expensive Month</p>
        <h3 style={{ margin: 0, fontSize: "18px", color: "#f59e0b" }}>{highestMonthName} (₹{highestMonthAmount})</h3>
      </div>

      {/* Person Breakdown */}
      <h3 style={{ color: "white", borderBottom: "1px solid #333", paddingBottom: "8px", marginBottom: "12px" }}>Person & Method Breakdown</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
        {Object.keys(personBreakdown).length === 0 ? (
          <p style={{ color: "#888", fontSize: "14px", margin: 0 }}>No travel data found for {selectedYear}.</p>
        ) : (
          Object.entries(personBreakdown)
            .sort((a, b) => b[1] - a[1]) // Sort highest to lowest
            .map(([method, amount]) => (
            <div key={method} style={{ display: "flex", justifyContent: "space-between", backgroundColor: "#333", padding: "10px", borderRadius: "6px", color: "white" }}>
              <span>{method}</span>
              <strong style={{ color: "#60a5fa" }}>₹{amount}</strong>
            </div>
          ))
        )}
      </div>

      {/* Monthly Breakdown List */}
      <h3 style={{ color: "white", borderBottom: "1px solid #333", paddingBottom: "8px", marginBottom: "12px" }}>Monthly Breakdown</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {Object.entries(monthlyBreakdown).map(([key, data]) => (
          <div key={key} style={{ display: "flex", justifyContent: "space-between", backgroundColor: "#1e1e1e", padding: "10px", borderRadius: "6px", color: "white", borderLeft: data.amount > 0 ? "4px solid #4caf50" : "4px solid #444" }}>
            <span>{data.name}</span>
            <strong style={{ color: data.amount > 0 ? "white" : "#666" }}>
              ₹{data.amount}
            </strong>
          </div>
        ))}
      </div>

    </div>
  );
}
