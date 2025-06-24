const schedule = require("node-schedule");
const Transaction = require("../models/Transaction");

const scheduleRecurringTransaction = (
  transaction,
  frequency,
  endDate,
  count
) => {
  try {
    const { userId, type, category, amount, description, currency, tags } =
      transaction;
    let rule = new schedule.RecurrenceRule();

    // Set timezone to avoid issues
    rule.tz = "UTC";

    // Configure recurrence based on frequency
    if (frequency === "daily") {
      rule.hour = 9; // Run at 9 AM UTC
      rule.minute = 0;
    } else if (frequency === "weekly") {
      rule.dayOfWeek = new Date(transaction.date).getDay();
      rule.hour = 9;
      rule.minute = 0;
    } else if (frequency === "monthly") {
      rule.date = new Date(transaction.date).getDate();
      rule.hour = 9;
      rule.minute = 0;
    } else {
      console.error("Invalid frequency:", frequency);
      return;
    }

    // Calculate start date (next occurrence after the original date)
    const startDate = new Date(transaction.date);
    if (frequency === "daily") {
      startDate.setDate(startDate.getDate() + 1);
    } else if (frequency === "weekly") {
      startDate.setDate(startDate.getDate() + 7);
    } else if (frequency === "monthly") {
      startDate.setMonth(startDate.getMonth() + 1);
    }

    const jobOptions = {
      start: startDate,
      rule: rule,
    };

    // Add end date if specified
    if (endDate) {
      jobOptions.end = new Date(endDate);
    }

    let executionCount = 0;

    const job = schedule.scheduleJob(jobOptions, async () => {
      try {
        // Check if we've reached the execution limit
        if (count && executionCount >= count) {
          console.log(
            `Recurring transaction completed after ${count} executions`
          );
          job.cancel();
          return;
        }

        // Create new transaction
        const newTransaction = new Transaction({
          userId,
          type,
          category,
          amount,
          date: new Date(),
          description: description
            ? `${description} (Recurring)`
            : "Recurring transaction",
          currency: currency || "USD",
          tags: tags || [],
          tax: amount * 0.1, // Default 10% tax
          isRecurring: false, // Mark as non-recurring to avoid infinite loops
        });

        await newTransaction.save();
        executionCount++;

        console.log(`Created recurring transaction: ${newTransaction._id}`);

        // Cancel job if we've reached the count
        if (count && executionCount >= count) {
          job.cancel();
        }
      } catch (error) {
        console.error("Error creating recurring transaction:", error);
        // Cancel job on persistent errors
        if (error.name === "ValidationError") {
          console.error("Canceling recurring job due to validation error");
          job.cancel();
        }
      }
    });

    // Handle job events
    job.on("scheduled", (scheduledDate) => {
      console.log(`Recurring transaction scheduled for: ${scheduledDate}`);
    });

    job.on("canceled", () => {
      console.log(
        `Recurring transaction job canceled for transaction: ${transaction._id}`
      );
    });

    console.log(
      `Scheduled recurring ${frequency} transaction starting from: ${startDate}`
    );

    return job;
  } catch (error) {
    console.error("Error scheduling recurring transaction:", error);
    throw error;
  }
};

module.exports = { scheduleRecurringTransaction };
