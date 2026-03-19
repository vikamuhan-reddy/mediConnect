const express    = require("express");
const router     = express.Router();
const { getDoctors, getDoctorById } = require("../controllers/doctorController");
const verifyToken = require("../middleware/authMiddleware");

router.get("/",   verifyToken, getDoctors);
router.get("/:id", verifyToken, getDoctorById);

module.exports = router;