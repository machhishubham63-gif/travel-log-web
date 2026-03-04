import { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function Settings({ user }) {
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState("");
  
  // NEW: State to hold the PWA install prompt
  const [installPrompt, setInstallPrompt] = useState(null);

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

  // NEW: Listen for the browser's "Ready to Install" signal
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); // Stop Chrome from showing the default mini-infobar
      setInstallPrompt(e); // Save the event so we can trigger it with our button
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const saveSettings = async () => {
    if (pinEnabled && (!pin || pin.length !== 4)) {
      setStatus("❌ PIN must be exactly 4 digits");
      return;
    }
    try {
      await setDoc(doc(db, "settings", user.uid), {
        pinEnabled, pin: pinEnabled ? pin : ""
      }, { merge: true });
      setStatus("✅ Settings saved!");
      setTimeout(() => setStatus(""), 3000);
    } catch (error) {
      setStatus("❌ Error saving settings");
    }
  };

  // NEW: Function to trigger the actual installation popup
  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt(); // Show the native browser install popup
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null); // Hide the button if they installed it
    }
  };

  return (
    <div style={{ paddingBottom: "30px", fontFamily: "system-ui, sans-serif", color: "white" }}>
      <h2 style={{ margin: "0 0 24px 0", fontSize: "28px", fontWeight: "800", letterSpacing: "-0.5px", paddingLeft: "8px" }}>Settings</h2>

      {/* NEW: Dynamic Install Banner */}
      {installPrompt && (
        <div style={{ backgroundColor: "#448aff15", padding: "20px", borderRadius: "32px", marginBottom: "24px", border: "1px solid #448aff50", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <span style={{ fontSize: "40px", marginBottom: "12px" }}>📲</span>
          <h3 style={{ margin: "0 0 8px 0", color: "#448aff", fontSize: "18px", fontWeight: "800" }}>Install Travel Log</h3>
          <p style={{ margin: "0 0 16px 0", color: "#aaa", fontSize: "14px", fontWeight: "500" }}>Install this app to your home screen for full-screen offline access.</p>
          <button 
            onClick={handleInstallClick} 
            style={{ width: "100%", padding: "16px", backgroundColor: "#448aff", color: "white", border: "none", borderRadius: "24px", fontSize: "16px", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 15px rgba(68, 138, 255, 0.3)" }}
          >
            Install App Now
          </button>
        </div>
      )}

      <div style={{ backgroundColor: "#111111", padding: "24px", borderRadius: "32px", border: "1px solid #222" }}>
        <h3 style={{ marginTop: 0, fontSize: "16px", color: "#69f0ae", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "800", marginBottom: "16px" }}>App Lock (PIN)</h3>
        <p style={{ fontSize: "14px", color: "#888", marginBottom: "24px", fontWeight: "600", lineHeight: "1.5" }}>
          Require a 4-digit PIN to finalize months and undo payments.
        </p>

        <label style={{ display: "flex", alignItems: "center", marginBottom: "24px", fontSize: "16px", cursor: "pointer", backgroundColor: "#1A1A1A", padding: "16px", borderRadius: "20px", border: "1px solid #333", fontWeight: "700" }}>
          <input
            type="checkbox"
            checked={pinEnabled}
            onChange={(e) => setPinEnabled(e.target.checked)}
            style={{ marginRight: "16px", width: "22px", height: "22px", accentColor: "#69f0ae" }}
          />
          Enable PIN Security
        </label>

        {pinEnabled && (
          <input
            type="number"
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.slice(0, 4))} 
            style={{ width: "100%", padding: "20px", borderRadius: "24px", border: "1px solid #333", backgroundColor: "#0A0A0A", color: "white", fontSize: "32px", marginBottom: "24px", boxSizing: "border-box", letterSpacing: "16px", textAlign: "center", fontWeight: "800" }}
          />
        )}

        <button
          onClick={saveSettings}
          style={{ width: "100%", padding: "16px", backgroundColor: "#69f0ae", color: "#000", border: "none", borderRadius: "24px", fontSize: "16px", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 15px rgba(105, 240, 174, 0.3)" }}
        >
          Save Settings
        </button>

        {status && <p style={{ textAlign: "center", marginTop: "20px", fontWeight: "800", fontSize: "15px", color: status.includes("✅") ? "#69f0ae" : "#ff5252" }}>{status}</p>}
      </div>
    </div>
  );
}
