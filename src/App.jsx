import { useEffect, useState } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

import Login from "./Login";
import TravelForm from "./TravelForm";
import TravelList from "./TravelList";

function Dashboard() {
  <TravelList user={auth.currentUser} 
  key={refreshKey} />
  return (
    <div
      style={{
        maxWidth: "500px",
        margin: "auto",
        padding: "20px",
        fontFamily: "sans-serif"
      }}
    >
      <h1 style={{ textAlign: "center" }}>My Travel Log</h1>

      <button
        onClick={() => signOut(auth)}
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "20px"
        }}
      >
        Logout
      </button>

      <TravelForm refresh={() => setRefreshKey(old => old + 1)} />
      <TravelList key={refreshKey} />
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      {user ? <Dashboard /> : <Login />}
    </div>
  );
}

export default App;
