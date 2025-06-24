const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    period: {
      type: String,
      required: true,
      enum: ["daily", "weekly", "monthly", "yearly"],
    },
    alertThreshold: {
      type: Number,
      default: 0.8,
      min: 0,
      max: 1,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    // Analytics and tracking
    analytics: {
      createdAt: {
        type: Date,
        default: Date.now,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
      editHistory: [
        {
          date: { type: Date, default: Date.now },
          changes: { type: mongoose.Schema.Types.Mixed },
          previousValues: { type: mongoose.Schema.Types.Mixed },
        },
      ],
      notifications: [
        {
          date: { type: Date, default: Date.now },
          type: {
            type: String,
            enum: ["threshold", "overspend", "created", "updated"],
          },
          message: String,
          acknowledged: { type: Boolean, default: false },
        },
      ],
      spendingHistory: [
        {
          date: { type: Date, default: Date.now },
          amount: Number,
          transactionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Transaction",
          },
        },
      ],
    },
    // Status tracking
    status: {
      type: String,
      enum: ["active", "paused", "archived"],
      default: "active",
    },
    // Auto-adjustment settings
    autoAdjust: {
      enabled: { type: Boolean, default: false },
      adjustmentType: {
        type: String,
        enum: ["percentage", "fixed"],
        default: "percentage",
      },
      adjustmentValue: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
budgetSchema.index({ userId: 1, category: 1, period: 1 });
budgetSchema.index({ userId: 1, status: 1 });

// Pre-save middleware to update analytics
budgetSchema.pre("save", function (next) {
  if (!this.isNew) {
    this.analytics.lastUpdated = new Date();
  }
  next();
});

// Virtual for calculating current spending (if needed)
budgetSchema.virtual("currentSpending").get(function () {
  // This would be calculated based on related transactions
  return 0; // Placeholder
});

// Method to add notification
budgetSchema.methods.addNotification = function (type, message) {
  this.analytics.notifications.push({
    type,
    message,
    date: new Date(),
    acknowledged: false,
  });
  return this.save();
};

// Method to acknowledge notifications
budgetSchema.methods.acknowledgeNotifications = function () {
  this.analytics.notifications.forEach((notification) => {
    notification.acknowledged = true;
  });
  return this.save();
};

// Static method to find budgets by period
budgetSchema.statics.findByPeriod = function (userId, period) {
  return this.find({ userId, period, status: "active" });
};

// Static method to find budgets needing alerts
budgetSchema.statics.findNeedingAlerts = function (userId) {
  return this.find({
    userId,
    status: "active",
    "analytics.notifications": {
      $not: {
        $elemMatch: {
          acknowledged: false,
          date: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
        },
      },
    },
  });
};

module.exports = mongoose.model("Budget", budgetSchema);
