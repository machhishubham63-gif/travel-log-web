import { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function Settings({ user }) {
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchSettings = async () => {
      const docSnap = await getDoc(doc(db, "settings", user.uid));
      if (docSnap.exists()) {
        setPinEnabled(docSnap.data().pinEnabled || false);
        setPin(docSnap.data().pin || "");
      }
    };
    fetchSettings();
  }, [user]);

  const saveSettings = async () => {
    if (pinEnabled && (!pin || pin.length !== 4)) {
      setStatus("❌ PIN must be exactly 4 digits");
      return;
    }
    try {
      await setDoc(doc(db, "settings", user.uid), {
        pinEnabled,
        pin: pinEnabled ? pin : ""
      }, { merge: true });
      setStatus("✅ Settings saved!");
      setTimeout(() => setStatus(""), 3000);
    } catch (error) {
      setStatus("❌ Error saving settings");
    }
  };

  return (
    <div style={{ paddingBottom: "20px", color: "white" }}>
      <h2 style={{ margin: "0 0 20px 0", fontSize: "22px", paddingLeft: "4px" }}>Settings & Security</h2>

      <div style={{ backgroundColor: "#111111", padding: "20px", borderRadius: "20px" }}>
        <h3 style={{ marginTop: 0, fontSize: "18px", color: "#a8c7fa" }}>App Lock (PIN)</h3>
        <p style={{ fontSize: "14px", color: "#aaa", marginBottom: "20px" }}>
          Require a 4-digit PIN to finalize months and undo payments.
        </p>

        <label style={{ display: "flex", alignItems: "center", marginBottom: "20px", fontSize: "16px", cursor: "pointer", backgroundColor: "#222222", padding: "12px", borderRadius: "12px" }}>
          <input
            type="checkbox"
            checked={pinEnabled}
            onChange={(e) => setPinEnabled(e.target.checked)}
            style={{ marginRight: "12px", width: "20px", height: "20px", accentColor: "#a8c7fa" }}
          />
          Enable PIN Security
        </label>

        {pinEnabled && (
          <input
            type="number"
            placeholder="Enter 4-digit PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value.slice(0, 4))} // Forces max 4 chars
            style={{ width: "100%", padding: "16px", borderRadius: "12px", border: "none", backgroundColor: "#222222", color: "white", fontSize: "24px", marginBottom: "20px", boxSizing: "border-box", letterSpacing: "8px", textAlign: "center", fontWeight: "bold" }}
          />
        )}

        <button
          onClick={saveSettings}
          style={{ width: "100%", padding: "16px", backgroundColor: "#a8c7fa", color: "#000000", border: "none", borderRadius: "24px", fontSize: "16px", fontWeight: "bold", cursor: "pointer" }}
        >
          Save Settings
        </button>

        {status && <p style={{ textAlign: "center", marginTop: "16px", fontWeight: "bold", color: status.includes("✅") ? "#34d399" : "#f87171" }}>{status}</p>}
      </div>
    </div>
  );
}
