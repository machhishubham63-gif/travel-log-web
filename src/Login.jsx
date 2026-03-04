import { useState } from "react";
import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Added loading state

  // Pass the event 'e' to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevents the page from refreshing on submit
    
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setError("");
      setIsLoading(true); // Start loading
      
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      // Make Firebase errors look a little cleaner
      const friendlyError = err.message.replace("Firebase: ", "");
      setError(friendlyError);
    } finally {
      setIsLoading(false); // Stop loading regardless of success or failure
    }
  };

  return (
    <div
      style={{
        background: "#0f172a",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "white"
      }}
    >
      <div style={{ width: "300px" }}>
        <h2>{isRegister ? "Register" : "Login"}</h2>

        {/* Changed from <div> to <form> */}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "10px",
              boxSizing: "border-box" // Ensures padding doesn't break width
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "10px",
              boxSizing: "border-box"
            }}
          />

          <button
            type="submit" // Changed to type="submit"
            disabled={isLoading} // Disable while loading
            style={{
              width: "100%",
              padding: "10px",
              background: isLoading ? "#64748b" : "#2563eb", // Gray out if loading
              color: "white",
              border: "none",
              cursor: isLoading ? "not-allowed" : "pointer"
            }}
          >
            {isLoading 
              ? "Please wait..." 
              : isRegister ? "Create Account" : "Login"}
          </button>
        </form>

        <p
          style={{ marginTop: "15px", cursor: "pointer", textAlign: "center" }}
          onClick={() => {
            setIsRegister(!isRegister);
            setError(""); // Clear errors when toggling modes
          }}
        >
          {isRegister
            ? "Already have an account? Login"
            : "Create new account"}
        </p>

        {error && (
          <div style={{ 
            background: "#fef2f2", 
            color: "#ef4444", 
            padding: "10px", 
            marginTop: "10px", 
            borderRadius: "4px",
            fontSize: "14px"
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
