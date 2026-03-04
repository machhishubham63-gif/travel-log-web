import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";

export default function PersonsManager({ user }) {
  const [persons, setPersons] = useState([]);
  const [name, setName] = useState("");
  const [defaultAmount, setDefaultAmount] = useState("");
  const [isStarred, setIsStarred] = useState(false);

  // Fetch all persons for the logged-in user
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "persons"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPersons(data);
    });

    return () => unsubscribe();
  }, [user]);

  // Add a new person to Firestore
    const handleAddPerson = async (e) => {
    e.preventDefault();
    if (!name || !defaultAmount) {
      alert("Please enter both a name and an amount.");
      return;
    }

    try {
      // Generate Indian Date Format (DD/MM/YYYY)
      const today = new Date();
      const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

      await addDoc(collection(db, "persons"), {
        userId: user.uid,
        name: name,
        defaultAmount: Number(defaultAmount),
        isStarred: isStarred, 
        createdAtDate: formattedDate,
        createdAtTimestamp: new Date(),
      });

      // Reset form fields
      setName("");
      setDefaultAmount("");
      setIsStarred(false);
      
    } catch (error) {
      console.error("Error adding person: ", error);
      alert("Failed to add person. Check your Firebase rules!");
    }
  };

    // Generate Indian Date Format (DD/MM/YYYY)
    const today = new Date();
    const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

    await addDoc(collection(db, "persons"), {
      userId: user.uid,
      name: name,
      defaultAmount: Number(defaultAmount),
      isStarred: isStarred, // True = Settlement enabled
      createdAtDate: formattedDate,
      createdAtTimestamp: new Date(),
    });

    // Reset form fields
    setName("");
    setDefaultAmount("");
    setIsStarred(false);
  };

  // Toggle the settlement star tracking
  const toggleStar = async (id, currentStatus) => {
    await updateDoc(doc(db, "persons", id), {
      isStarred: !currentStatus,
    });
  };

  // Delete a person
  const handleDelete = async (id) => {
    // In the future, we might want to prevent deletion if they have pending settlements
    await deleteDoc(doc(db, "persons", id));
  };

  return (
    <div style={{ padding: "15px", backgroundColor: "#1e1e1e", color: "white", borderRadius: "8px" }}>
      <h2>Manage Persons</h2>
      
      {/* Form to Add a Person */}
      <form onSubmit={handleAddPerson} style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Person Name (e.g. Prashant Surve)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: "10px", boxSizing: "border-box" }}
        />
        
        <input
          type="number"
          placeholder="Default Amount (₹) (e.g. 55)"
          value={defaultAmount}
          onChange={(e) => setDefaultAmount(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: "10px", boxSizing: "border-box" }}
        />

        <label style={{ display: "flex", alignItems: "center", marginBottom: "10px", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={isStarred}
            onChange={(e) => setIsStarred(e.target.checked)}
            style={{ marginRight: "10px", width: "18px", height: "18px" }}
          />
          Enable Settlement Tracking (Star)
        </label>

        <button 
          type="submit" 
          style={{ width: "100%", padding: "10px", backgroundColor: "#4caf50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          Add Person
        </button>
      </form>

      <hr style={{ border: "1px solid #333", marginBottom: "20px" }} />

      {/* List of Existing Persons */}
      <div>
        <h3>Your Saved Persons</h3>
        {persons.length === 0 ? (
          <p style={{ color: "#888" }}>No persons added yet.</p>
        ) : (
          persons.map((person) => (
            <div key={person.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#2d2d2d", padding: "10px", marginBottom: "10px", borderRadius: "6px" }}>
              <div>
                <strong style={{ display: "block", fontSize: "16px" }}>
                  {person.name} {person.isStarred ? "⭐" : ""}
                </strong>
                <span style={{ color: "#aaa", fontSize: "14px" }}>
                  Default: ₹{person.defaultAmount} | Added: {person.createdAtDate}
                </span>
              </div>
              
              <div style={{ display: "flex", gap: "10px" }}>
                <button 
                  onClick={() => toggleStar(person.id, person.isStarred)}
                  style={{ padding: "6px 12px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "4px" }}
                >
                  {person.isStarred ? "Unstar" : "Star"}
                </button>
                <button 
                  onClick={() => handleDelete(person.id)}
                  style={{ padding: "6px 12px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "4px" }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
