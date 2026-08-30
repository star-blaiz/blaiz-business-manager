const express = require("express");

const {
  addWorker,
  getWorkers,
  updateWorker,
  deleteWorker,
} = require("../controllers/workerController");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);
router.use(allowRoles("owner"));

router.post("/", addWorker);

router.get("/", getWorkers);

router.put("/:workerId", updateWorker);

router.delete("/:workerId", deleteWorker);

module.exports = router;