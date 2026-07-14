const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const validate = require("../middleware/validationMiddleware");
const {
  createTimetableItem,
  updateTimetableItem,
  deleteTimetableItem,
  getTimetable,
} = require("../controllers/timetableController");
const { createTimetableSchema } = require("../utils/timetableSchemas");

const router = express.Router();

// Apply protect to all routes
router.use(protect);

// CRUD operations
router.post(
  "/",
  authorizeRoles("faculty", "admin"),
  validate(createTimetableSchema),
  createTimetableItem,
);
router.put("/:id", authorizeRoles("faculty", "admin"), updateTimetableItem);
router.delete("/:id", authorizeRoles("faculty", "admin"), deleteTimetableItem);
router.get("/", getTimetable);

module.exports = router;
