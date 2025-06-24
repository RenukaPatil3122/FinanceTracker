const Goal = require("../models/Goal");

exports.getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id })
      .sort({ deadline: 1 })
      .lean(); // Add lean() for better performance

    res.json(goals);
  } catch (error) {
    console.error("Error fetching goals:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.createGoal = async (req, res) => {
  try {
    const { name, targetAmount, deadline, currency, milestones } = req.body;

    // Validation
    if (!name || !targetAmount || !deadline) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (targetAmount <= 0) {
      return res
        .status(400)
        .json({ message: "Target amount must be positive" });
    }

    if (new Date(deadline) <= new Date()) {
      return res
        .status(400)
        .json({ message: "Deadline must be in the future" });
    }

    // CHECK FOR DUPLICATE GOALS - Add this validation
    const existingGoal = await Goal.findOne({
      userId: req.user.id,
      name: name.trim(),
      targetAmount: parseFloat(targetAmount),
      deadline: new Date(deadline),
    });

    if (existingGoal) {
      return res.status(409).json({
        message:
          "A goal with the same name, amount, and deadline already exists",
      });
    }

    // Validate milestones if provided
    if (milestones && milestones.length > 0) {
      for (const milestone of milestones) {
        if (milestone.amount > targetAmount) {
          return res.status(400).json({
            message: "Milestone amount cannot exceed target amount",
          });
        }
        if (new Date(milestone.date) > new Date(deadline)) {
          return res.status(400).json({
            message: "Milestone date cannot be after deadline",
          });
        }
      }
    }

    const goal = new Goal({
      userId: req.user.id,
      name: name.trim(),
      targetAmount: parseFloat(targetAmount),
      currentAmount: 0,
      deadline: new Date(deadline),
      currency: currency || "USD",
      milestones: milestones || [],
      isCompleted: false,
    });

    await goal.save();
    res.status(201).json(goal);
  } catch (error) {
    console.error("Error creating goal:", error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A goal with similar details already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        details: Object.values(error.errors).map((e) => e.message),
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Validation for updates
    if (updateData.targetAmount && updateData.targetAmount <= 0) {
      return res
        .status(400)
        .json({ message: "Target amount must be positive" });
    }

    if (updateData.deadline && new Date(updateData.deadline) <= new Date()) {
      return res
        .status(400)
        .json({ message: "Deadline must be in the future" });
    }

    // Get the current goal to check for duplicates
    const currentGoal = await Goal.findOne({ _id: id, userId: req.user.id });
    if (!currentGoal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    // Check for duplicate goals when updating
    if (updateData.name || updateData.targetAmount || updateData.deadline) {
      const duplicateCheck = await Goal.findOne({
        _id: { $ne: id }, // Exclude current goal
        userId: req.user.id,
        name: updateData.name || currentGoal.name,
        targetAmount: updateData.targetAmount || currentGoal.targetAmount,
        deadline: updateData.deadline
          ? new Date(updateData.deadline)
          : currentGoal.deadline,
      });

      if (duplicateCheck) {
        return res.status(409).json({
          message:
            "A goal with the same name, amount, and deadline already exists",
        });
      }
    }

    // Validate milestones if being updated
    if (updateData.milestones && updateData.milestones.length > 0) {
      const targetAmount = updateData.targetAmount || currentGoal.targetAmount;
      const deadline = updateData.deadline
        ? new Date(updateData.deadline)
        : currentGoal.deadline;

      for (const milestone of updateData.milestones) {
        if (milestone.amount > targetAmount) {
          return res.status(400).json({
            message: "Milestone amount cannot exceed target amount",
          });
        }
        if (new Date(milestone.date) > deadline) {
          return res.status(400).json({
            message: "Milestone date cannot be after deadline",
          });
        }
      }
    }

    // Handle currentAmount updates
    if (updateData.currentAmount !== undefined) {
      updateData.currentAmount = Math.max(
        0,
        parseFloat(updateData.currentAmount) || 0
      );
    }

    // Handle completion status
    if (updateData.isCompleted !== undefined) {
      updateData.isCompleted = Boolean(updateData.isCompleted);
    }

    const goal = await Goal.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json(goal);
  } catch (error) {
    console.error("Error updating goal:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "A goal with similar details already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        details: Object.values(error.errors).map((e) => e.message),
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateGoalAmount = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, operation } = req.body; // operation: 'add', 'subtract', or 'set'

    const goal = await Goal.findOne({ _id: id, userId: req.user.id });
    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    let newCurrentAmount = goal.currentAmount || 0;

    if (operation === "add") {
      newCurrentAmount += parseFloat(amount) || 0;
    } else if (operation === "subtract") {
      newCurrentAmount -= parseFloat(amount) || 0;
    } else {
      newCurrentAmount = parseFloat(amount) || 0;
    }

    // Ensure currentAmount is not negative
    newCurrentAmount = Math.max(0, newCurrentAmount);

    const updatedGoal = await Goal.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      {
        $set: {
          currentAmount: newCurrentAmount,
        },
      },
      { new: true, runValidators: true }
    );

    res.json(updatedGoal);
  } catch (error) {
    console.error("Error updating goal amount:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.toggleGoalCompletion = async (req, res) => {
  try {
    const { id } = req.params;

    const goal = await Goal.findOne({ _id: id, userId: req.user.id });
    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    const updatedGoal = await Goal.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      {
        $set: {
          isCompleted: !goal.isCompleted,
        },
      },
      { new: true, runValidators: true }
    );

    res.json(updatedGoal);
  } catch (error) {
    console.error("Error toggling goal completion:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const goal = await Goal.findOneAndDelete({
      _id: id,
      userId: req.user.id,
    });

    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    res.json({ message: "Goal deleted successfully", deletedGoal: goal });
  } catch (error) {
    console.error("Error deleting goal:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
