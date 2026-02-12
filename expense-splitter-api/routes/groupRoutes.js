const express = require("express");
const router = express.Router();

const {
  createGroup,
  getGroups,
  addExpense,
  getExpenses,
  getBalances,
  getSettlements,
  deleteExpense,
  deleteGroup
} = require("../controllers/groupController");

router.post("/", createGroup);
router.get("/", getGroups);

router.post("/add-expense", addExpense);
router.get("/expenses/:group_id", getExpenses);
router.delete("/expense/:expense_id", deleteExpense);

router.get("/:group_id/balances", getBalances);
router.get("/:group_id/settlements", getSettlements);
router.delete("/:group_id", deleteGroup);

module.exports = router;
