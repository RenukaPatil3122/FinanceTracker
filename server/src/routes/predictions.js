const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  predictCategory,
  savePrediction,
} = require("../controllers/categoryPredictor");

router.post("/predict-category", auth, predictCategory);
router.post("/save-prediction", auth, savePrediction);

module.exports = router;
