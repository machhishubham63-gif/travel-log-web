import { useEffect, useState } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

import Login from "./Login";
import TravelForm from "./TravelForm";
import TravelList from "./TravelList";

function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h1>My Travel Log</h1>

      <button onClick={() => signOut(auth)}>Logout</button>

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
