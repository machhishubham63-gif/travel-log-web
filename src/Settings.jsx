import { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function Settings({ user }) {
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState("");
  const [installPrompt, setInstallPrompt] = useState(null);
  
  // NEW: Theme State
  const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'dark');

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

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
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

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  // NEW: Theme Toggle Function
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('app-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    // Update the Android status bar color to match
    document.querySelector('meta[name="theme-color"]').setAttribute('content', newTheme === 'light' ? '#f3f4f6' : '#000000');
  };

  return (
    <div style={{ paddingBottom: "30px", fontFamily: "system-ui, sans-serif", color: "var(--text-main)" }}>
      <h2 style={{ margin: "0 0 24px 0", fontSize: "28px", fontWeight: "800", letterSpacing: "-0.5px", paddingLeft: "8px" }}>Settings</h2>

      {/* THEME TOGGLE */}
      <div style={{ backgroundColor: "var(--bg-card)", padding: "24px", borderRadius: "32px", border: "1px solid var(--border-light)", marginBottom: "24px" }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", color: "var(--accent-blue)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "800" }}>Appearance</h3>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "var(--bg-surface)", padding: "8px", borderRadius: "24px", border: "1px solid var(--border-light)" }}>
          <button onClick={() => theme !== 'light' && toggleTheme()} style={{ flex: 1, padding: "12px", borderRadius: "16px", border: "none", backgroundColor: theme === 'light' ? "var(--bg-card)" : "transparent", color: theme === 'light' ? "var(--accent-blue)" : "var(--text-muted)", fontWeight: "800", fontSize: "15px", cursor: "pointer", transition: "all 0.2s", boxShadow: theme === 'light' ? "0 4px 10px rgba(0,0,0,0.05)" : "none" }}>
            ☀️ Light
          </button>
          <button onClick={() => theme !== 'dark' && toggleTheme()} style={{ flex: 1, padding: "12px", borderRadius: "16px", border: "none", backgroundColor: theme === 'dark' ? "var(--bg-input)" : "transparent", color: theme === 'dark' ? "var(--accent-blue)" : "var(--text-muted)", fontWeight: "800", fontSize: "15px", cursor: "pointer", transition: "all 0.2s", boxShadow: theme === 'dark' ? "0 4px 10px rgba(0,0,0,0.2)" : "none" }}>
            🌙 Dark
          </button>
        </div>
      </div>

      {installPrompt && (
        <div style={{ backgroundColor: "var(--accent-blue-bg)", padding: "20px", borderRadius: "32px", marginBottom: "24px", border: "1px solid var(--accent-blue)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <span style={{ fontSize: "40px", marginBottom: "12px" }}>📲</span>
          <h3 style={{ margin: "0 0 8px 0", color: "var(--accent-blue)", fontSize: "18px", fontWeight: "800" }}>Install Travel Log</h3>
          <p style={{ margin: "0 0 16px 0", color: "var(--text-muted)", fontSize: "14px", fontWeight: "500" }}>Install this app to your home screen for full-screen offline access.</p>
          <button onClick={handleInstallClick} style={{ width: "100%", padding: "16px", backgroundColor: "var(--accent-blue)", color: "#fff", border: "none", borderRadius: "24px", fontSize: "16px", fontWeight: "800", cursor: "pointer" }}>
            Install App Now
          </button>
        </div>
      )}

      <div style={{ backgroundColor: "var(--bg-card)", padding: "24px", borderRadius: "32px", border: "1px solid var(--border-light)" }}>
        <h3 style={{ marginTop: 0, fontSize: "16px", color: "var(--accent-green)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "800", marginBottom: "16px" }}>App Lock (PIN)</h3>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "24px", fontWeight: "600", lineHeight: "1.5" }}>
          Require a 4-digit PIN to finalize months and undo payments.
        </p>

        <label style={{ display: "flex", alignItems: "center", marginBottom: "24px", fontSize: "16px", cursor: "pointer", backgroundColor: "var(--bg-surface)", padding: "16px", borderRadius: "20px", border: "1px solid var(--border-strong)", fontWeight: "700" }}>
          <input type="checkbox" checked={pinEnabled} onChange={(e) => setPinEnabled(e.target.checked)} style={{ marginRight: "16px", width: "22px", height: "22px", accentColor: "var(--accent-green)" }} />
          Enable PIN Security
        </label>

        {pinEnabled && (
          <input type="number" placeholder="••••" value={pin} onChange={(e) => setPin(e.target.value.slice(0, 4))} style={{ width: "100%", padding: "20px", borderRadius: "24px", border: "1px solid var(--border-strong)", backgroundColor: "var(--bg-input)", color: "var(--text-main)", fontSize: "32px", marginBottom: "24px", boxSizing: "border-box", letterSpacing: "16px", textAlign: "center", fontWeight: "800" }} />
        )}

        <button onClick={saveSettings} style={{ width: "100%", padding: "16px", backgroundColor: "var(--accent-green)", color: "#fff", border: "none", borderRadius: "24px", fontSize: "16px", fontWeight: "800", cursor: "pointer" }}>
          Save Settings
        </button>

        {status && <p style={{ textAlign: "center", marginTop: "20px", fontWeight: "800", fontSize: "15px", color: status.includes("✅") ? "var(--accent-green)" : "var(--accent-red)" }}>{status}</p>}
      </div>
    </div>
  );
}
