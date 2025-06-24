const CategoryPrediction = require("../models/CategoryPrediction");

exports.predictCategory = async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ message: "Description is required" });
    }
    const predictions = await CategoryPrediction.find({ userId: req.user.id });
    const keywords = {
      coffee: "Food",
      lunch: "Food",
      uber: "Transportation",
      rent: "Housing",
      electricity: "Utilities",
      movie: "Entertainment",
      doctor: "Healthcare",
    };
    let predictedCategory = "Other";
    const lowerDesc = description.toLowerCase();
    for (const [key, category] of Object.entries(keywords)) {
      if (lowerDesc.includes(key)) {
        predictedCategory = category;
        break;
      }
    }
    const existingPrediction = predictions.find(
      (p) => p.description.toLowerCase() === lowerDesc
    );
    if (existingPrediction && existingPrediction.frequency > 2) {
      predictedCategory = existingPrediction.category;
    }
    res.json({ category: predictedCategory });
  } catch (error) {
    console.error("Error predicting category:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.savePrediction = async (req, res) => {
  try {
    const { description, category } = req.body;
    if (!description || !category) {
      return res
        .status(400)
        .json({ message: "Description and category are required" });
    }
    const existing = await CategoryPrediction.findOne({
      userId: req.user.id,
      description: description.toLowerCase(),
    });
    if (existing) {
      existing.category = category;
      existing.frequency += 1;
      await existing.save();
      res.json(existing);
    } else {
      const prediction = new CategoryPrediction({
        userId: req.user.id,
        description: description.toLowerCase(),
        category,
      });
      await prediction.save();
      res.json(prediction);
    }
  } catch (error) {
    console.error("Error saving prediction:", error);
    res.status(500).json({ message: "Server error" });
  }
};
