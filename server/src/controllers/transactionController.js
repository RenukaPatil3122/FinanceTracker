const Transaction = require("../models/Transaction");
const axios = require("axios");
const { scheduleRecurringTransaction } = require("./scheduler");

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id }).sort({
      date: -1,
    });
    const preferredCurrency = req.user.preferences?.currency || "USD";

    const convertedTransactions = await Promise.all(
      transactions.map(async (t) => {
        if (t.currency !== preferredCurrency) {
          try {
            // Fixed: Corrected API URL format
            const response = await axios.get(
              `https://api.exchangerate-api.com/v4/latest/${t.currency}`
            );
            const rate = response.data.rates[preferredCurrency];
            if (rate) {
              return {
                ...t._doc,
                amount: t.amount * rate,
                tax: (t.tax || 0) * rate,
                currency: preferredCurrency,
                originalAmount: t.amount, // Keep original for reference
                originalCurrency: t.currency,
              };
            }
          } catch (error) {
            console.error("Currency conversion error:", error);
            // Return original transaction if conversion fails
          }
        }
        return t;
      })
    );
    res.json(convertedTransactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const {
      type,
      category,
      amount,
      date,
      description,
      goalId,
      currency,
      isRecurring,
      recurrenceFrequency,
      recurrenceEndDate,
      recurrenceCount,
      tags,
      tax, // Added tax field
    } = req.body;

    // Improved validation
    if (
      !type ||
      !category ||
      amount === undefined ||
      amount === null ||
      !date
    ) {
      return res.status(400).json({
        message:
          "Missing required fields: type, category, amount, and date are required",
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than 0",
      });
    }

    // Validate recurring transaction fields
    if (isRecurring) {
      if (!recurrenceFrequency) {
        return res.status(400).json({
          message:
            "Recurrence frequency is required for recurring transactions",
        });
      }
      if (!["daily", "weekly", "monthly"].includes(recurrenceFrequency)) {
        return res.status(400).json({
          message: "Invalid recurrence frequency",
        });
      }
    }

    const transaction = new Transaction({
      userId: req.user.id,
      type,
      category,
      amount: parseFloat(amount),
      date: new Date(date),
      description: description || "",
      goalId: goalId || null,
      currency: currency || "USD",
      tags: tags || [],
      tax: tax || 0,
      isRecurring: Boolean(isRecurring),
      recurrenceFrequency: isRecurring ? recurrenceFrequency : null,
      recurrenceEndDate:
        isRecurring && recurrenceEndDate ? new Date(recurrenceEndDate) : null,
      recurrenceCount:
        isRecurring && recurrenceCount ? parseInt(recurrenceCount) : null,
    });

    await transaction.save();

    // Schedule recurring transaction if needed
    if (isRecurring) {
      try {
        scheduleRecurringTransaction(
          transaction,
          recurrenceFrequency,
          recurrenceEndDate,
          recurrenceCount
        );
      } catch (scheduleError) {
        console.error("Error scheduling recurring transaction:", scheduleError);
        // Don't fail the creation, just log the error
      }
    }

    res.status(201).json(transaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: Object.keys(error.errors).map(
          (key) => error.errors[key].message
        ),
      });
    }
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the update data
    if (req.body.amount !== undefined && req.body.amount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than 0",
      });
    }

    // Convert date if provided
    if (req.body.date) {
      req.body.date = new Date(req.body.date);
    }

    // Convert amount to number if provided
    if (req.body.amount !== undefined) {
      req.body.amount = parseFloat(req.body.amount);
    }

    // Convert tax to number if provided
    if (req.body.tax !== undefined) {
      req.body.tax = parseFloat(req.body.tax);
    }

    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { $set: req.body },
      { new: true, runValidators: true } // Added runValidators
    );

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json(transaction);
  } catch (error) {
    console.error("Error updating transaction:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: Object.keys(error.errors).map(
          (key) => error.errors[key].message
        ),
      });
    }
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findOneAndDelete({
      _id: id,
      userId: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }
    res.status(500).json({ message: "Server error" });
  }
};
