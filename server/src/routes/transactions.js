const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = require("../controllers/transactionController");

router.get("/transactions", auth, getTransactions);
router.post("/transactions", auth, createTransaction);
router.put("/transactions/:id", auth, updateTransaction);
router.delete("/transactions/:id", auth, deleteTransaction);

module.exports = router;
