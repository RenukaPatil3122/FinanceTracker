const mongoose = require("mongoose");

const milestoneSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  date: {
    type: Date,
    required: true,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
});

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    deadline: {
      type: Date,
      required: true,
      validate: {
        validator: function (v) {
          return v > new Date();
        },
        message: "Deadline must be in the future",
      },
    },
    currency: {
      type: String,
      default: "USD",
      enum: ["USD", "EUR", "INR"],
    },
    milestones: [milestoneSchema],
    progressNotifications: [
      {
        date: Date,
        message: String,
      },
    ],
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
goalSchema.index({ userId: 1, deadline: 1 });

// ADD COMPOUND INDEX TO PREVENT DUPLICATES
// This prevents users from creating goals with the same name, target amount, and deadline
goalSchema.index(
  {
    userId: 1,
    name: 1,
    targetAmount: 1,
    deadline: 1,
  },
  {
    unique: true,
    background: true,
  }
);

// Pre-save middleware to trim name and ensure no duplicate goals
goalSchema.pre("save", async function (next) {
  if (this.isNew) {
    // Trim the name
    this.name = this.name.trim();

    // Check for existing goal with same details
    const existingGoal = await this.constructor.findOne({
      userId: this.userId,
      name: this.name,
      targetAmount: this.targetAmount,
      deadline: this.deadline,
      _id: { $ne: this._id },
    });

    if (existingGoal) {
      const error = new Error(
        "A goal with the same name, amount, and deadline already exists"
      );
      error.code = 11000;
      return next(error);
    }
  }
  next();
});

// Virtual field to calculate progress percentage
goalSchema.virtual("progressPercentage").get(function () {
  if (this.targetAmount === 0) return 0;
  return Math.min(100, (this.currentAmount / this.targetAmount) * 100);
});

// Virtual field to calculate days remaining
goalSchema.virtual("daysRemaining").get(function () {
  const today = new Date();
  const deadline = new Date(this.deadline);
  const diffTime = deadline - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Ensure virtuals are included when converting to JSON
goalSchema.set("toJSON", { virtuals: true });
goalSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Goal", goalSchema);
