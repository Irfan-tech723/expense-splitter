const db = require("../config/db");

// Create group
exports.createGroup = (req, res) => {
  const { name, created_by } = req.body;

  db.query(
    "INSERT INTO grups (name, created_by) VALUES (?, ?)",
    [name, created_by],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Create failed" });
      res.json({ groupId: result.insertId });
    }
  );
};

// Get groups
exports.getGroups = (req, res) => {
  db.query("SELECT * FROM grups", (err, results) => {
    if (err) return res.json([]);
    res.json(results);
  });
};

// Add expense
exports.addExpense = (req, res) => {
  const { group_id, amount, description, paid_by, split_between } = req.body;

  db.query(
    "INSERT INTO expenses (group_id, amount, description, paid_by) VALUES (?, ?, ?, ?)",
    [group_id, amount, description, paid_by],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Expense failed" });

      const expenseId = result.insertId;
      const splitAmount = amount / split_between.length;

      const values = split_between.map(u => [expenseId, u, splitAmount]);

      db.query(
        "INSERT INTO expense_splits (expense_id, user_id, amount) VALUES ?",
        [values],
        err => {
          if (err) return res.status(500).json({ message: "Split failed" });
          res.json({ message: "Expense added" });
        }
      );
    }
  );
};

// Get expenses
exports.getExpenses = (req, res) => {
  const { group_id } = req.params;

  db.query(
    `SELECT e.id AS expense_id, e.description, e.amount, u.name AS payer_name
     FROM expenses e
     JOIN users u ON e.paid_by = u.id
     WHERE e.group_id = ?`,
    [group_id],
    (err, results) => {
      if (err) return res.json([]);
      res.json(results);
    }
  );
};

// Balances
exports.getBalances = (req, res) => {
  const { group_id } = req.params;

  db.query(
    `SELECT u.id, u.name,
     SUM(es.amount) AS share,
     SUM(CASE WHEN e.paid_by = u.id THEN e.amount ELSE 0 END) AS paid
     FROM users u
     JOIN expense_splits es ON u.id = es.user_id
     JOIN expenses e ON es.expense_id = e.id
     WHERE e.group_id = ?
     GROUP BY u.id`,
    [group_id],
    (err, rows) => {
      if (err) return res.json([]);

      res.json(
        rows.map(r => ({
          user_id: r.id,
          name: r.name,
          balance: (r.paid || 0) - (r.share || 0)
        }))
      );
    }
  );
};

// Settlements
exports.getSettlements = (req, res) => {
  const { group_id } = req.params;

  db.query(
    `SELECT u.name,
     SUM(es.amount) AS share,
     SUM(CASE WHEN e.paid_by = u.id THEN e.amount ELSE 0 END) AS paid
     FROM users u
     JOIN expense_splits es ON u.id = es.user_id
     JOIN expenses e ON es.expense_id = e.id
     WHERE e.group_id = ?
     GROUP BY u.id`,
    [group_id],
    (err, rows) => {
      if (err) return res.json([]);

      let debtors = [];
      let creditors = [];

      rows.forEach(r => {
        const bal = (r.paid || 0) - (r.share || 0);
        if (bal > 0) creditors.push({ name: r.name, bal });
        if (bal < 0) debtors.push({ name: r.name, bal: -bal });
      });

      let settlements = [];

      debtors.forEach(d => {
        creditors.forEach(c => {
          if (d.bal > 0 && c.bal > 0) {
            const amt = Math.min(d.bal, c.bal);
            settlements.push({ from: d.name, to: c.name, amount: amt });
            d.bal -= amt;
            c.bal -= amt;
          }
        });
      });

      res.json(settlements);
    }
  );
};

// Delete expense
exports.deleteExpense = (req, res) => {
  const { expense_id } = req.params;

  db.query("DELETE FROM expense_splits WHERE expense_id = ?", [expense_id]);
  db.query("DELETE FROM expenses WHERE id = ?", [expense_id]);

  res.json({ message: "Deleted" });
};

// Delete group
exports.deleteGroup = (req, res) => {
  const { group_id } = req.params;

  const queries = [
    "DELETE es FROM expense_splits es JOIN expenses e ON es.expense_id = e.id WHERE e.group_id = ?",
    "DELETE FROM expenses WHERE group_id = ?",
    "DELETE FROM group_members WHERE group_id = ?",
    "DELETE FROM grups WHERE id = ?"
  ];

  const run = (i) => {
    if (i === queries.length) {
      return res.json({ message: "Group deleted" });
    }

    db.query(queries[i], [group_id], (err) => {
      if (err) return res.status(500).json({ message: "Delete failed" });
      run(i + 1);
    });
  };

  run(0);
};
