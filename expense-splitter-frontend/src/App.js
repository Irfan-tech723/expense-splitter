import "./App.css";
import { useEffect, useState } from "react";

function App() {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [settlements, setSettlements] = useState([]);

  const [newUserName, setNewUserName] = useState("");
  const [newGroupName, setNewGroupName] = useState("");

  const [selectedGroup, setSelectedGroup] = useState(null);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");

  const API = process.env.REACT_APP_API_URL;

  /* ================= FETCH ================= */

  const fetchUsers = () =>
    fetch(`${API}/users`)
      .then(res => res.json())
      .then(setUsers);

  const fetchGroups = () =>
    fetch(`${API}/groups`)
      .then(res => res.json())
      .then(setGroups);

  const fetchGroupData = (groupId) => {
    setSelectedGroup(groupId);

    fetch(`${API}/groups/expenses/${groupId}`)
      .then(res => res.json())
      .then(setExpenses);

    fetch(`${API}/groups/${groupId}/balances`)
      .then(res => res.json())
      .then(setBalances);

    fetch(`${API}/groups/${groupId}/settlements`)
      .then(res => res.json())
      .then(setSettlements);
  };

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, []);

  /* ================= USERS ================= */

  const addUser = () => {
    if (!newUserName) return;

    fetch(`${API}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newUserName })
    }).then(() => {
      setNewUserName("");
      fetchUsers();
    });
  };

  const deleteUser = (id) => {
    fetch(`${API}/users/${id}`, {
      method: "DELETE"
    }).then(fetchUsers);
  };

  /* ================= GROUPS ================= */

  const addGroup = () => {
    if (!newGroupName) return;

    fetch(`${API}/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newGroupName, created_by: 1 })
    }).then(() => {
      setNewGroupName("");
      fetchGroups();
    });
  };

  const deleteGroup = (id) => {
    fetch(`${API}/groups/${id}`, {
      method: "DELETE"
    }).then(() => {
      if (selectedGroup === id) {
        setSelectedGroup(null);
        setExpenses([]);
        setBalances([]);
        setSettlements([]);
      }
      fetchGroups();
    });
  };

  /* ================= EXPENSE ================= */

  const addExpense = () => {
    if (!description || !amount || !paidBy || !selectedGroup) return;

    fetch(`${API}/groups/add-expense`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        group_id: selectedGroup,
        description,
        amount: Number(amount),
        paid_by: Number(paidBy),
        split_between: users.map(u => u.id)
      })
    }).then(() => {
      setDescription("");
      setAmount("");
      setPaidBy("");
      fetchGroupData(selectedGroup);
    });
  };

  const deleteExpense = (expenseId) => {
    fetch(`${API}/groups/expense/${expenseId}`, {
      method: "DELETE"
    }).then(() => fetchGroupData(selectedGroup));
  };

  /* ================= RENDER ================= */

  return (
    <div className="app">
      <h1>Expense Splitter</h1>

      {/* USERS */}
      <div className="card">
        <h2>Users</h2>
        <input
          placeholder="User name"
          value={newUserName}
          onChange={e => setNewUserName(e.target.value)}
        />
        <button onClick={addUser}>Add</button>

        <ul>
          {users.map(u => (
            <li key={u.id} className="row">
              {u.name}
              <button className="danger" onClick={() => deleteUser(u.id)}>✕</button>
            </li>
          ))}
        </ul>
      </div>

      {/* GROUPS */}
      <div className="card">
        <h2>Groups</h2>
        <input
          placeholder="Group name"
          value={newGroupName}
          onChange={e => setNewGroupName(e.target.value)}
        />
        <button onClick={addGroup}>Create</button>

        <ul>
          {groups.map(g => (
            <li
              key={g.id}
              className={`group-item ${selectedGroup === g.id ? "selected" : ""}`}
              onClick={() => fetchGroupData(g.id)}
            >
              {g.name}
              <button
                className="danger"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteGroup(g.id);
                }}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </div>

      {selectedGroup && (
        <>
          {/* ADD EXPENSE */}
          <div className="card">
            <h2>Add Expense</h2>

            <label>Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)} />

            <label>Amount</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} />

            <label>Who paid?</label>
            <select value={paidBy} onChange={e => setPaidBy(e.target.value)}>
              <option value="">Select user</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>

            <button onClick={addExpense}>Add Expense</button>
          </div>

          {/* EXPENSE HISTORY */}
          <div className="card">
            <h2>Expense History</h2>
            <ul>
              {expenses.map(exp => (
                <li key={exp.expense_id} className="expense">
                  <strong>{exp.description}</strong>
                  <div>₹{exp.amount} — Paid by {exp.payer_name}</div>
                  <button className="danger" onClick={() => deleteExpense(exp.expense_id)}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* BALANCES */}
          <div className="card">
            <h2>Balances</h2>
            <ul>
              {balances.map(b => (
                <li key={b.user_id}>
                  {b.name}: {b.balance > 0 ? `Gets ₹${b.balance}` :
                  b.balance < 0 ? `Owes ₹${-b.balance}` : "Settled"}
                </li>
              ))}
            </ul>
          </div>

          {/* SETTLEMENTS */}
          <div className="card">
            <h2>Settlements</h2>
            <ul>
              {settlements.map((s, i) => (
                <li key={i} className="settlement">
                  {s.from} pays {s.to} ₹{s.amount}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
