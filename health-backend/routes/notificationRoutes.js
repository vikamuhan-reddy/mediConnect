const express = require("express");
const router  = express.Router();
const verifyToken = require("../middleware/authMiddleware");

// GET /api/notifications
// Stub — returns empty array until you build real notification logic
router.get("/", verifyToken, (req, res) => {
  res.json([]);
});

module.exports = router;