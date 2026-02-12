const db = require("../config/db");

// Get all users
exports.getUsers = (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) return res.status(500).json([]);
    res.json(results);
  });
};

// Add user
exports.addUser = (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Name required" });
  }

  db.query(
    "INSERT INTO users (name) VALUES (?)",
    [name],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Create failed" });
      res.json({ id: result.insertId, name });
    }
  );
};

// Delete user
exports.deleteUser = (req, res) => {
  const { id } = req.params;

  const queries = [
    "DELETE FROM expense_splits WHERE user_id = ?",
    "DELETE FROM expenses WHERE paid_by = ?",
    "DELETE FROM group_members WHERE user_id = ?",
    "DELETE FROM users WHERE id = ?"
  ];

  const run = (i) => {
    if (i === queries.length) {
      return res.json({ message: "User deleted" });
    }

    db.query(queries[i], [id], (err) => {
      if (err) return res.status(500).json({ message: "Delete failed" });
      run(i + 1);
    });
  };

  run(0);
};

