const express = require("express")
const router = express.Router()
const masterController = require("../controllers/masterController")
const { requireMaster } = require("../middleware/masterAuth")

// Apply master middleware to all routes
router.use(requireMaster)

// Tasks page (all assigned requests)
router.get("/tasks", masterController.showTasks)

// Redirect dashboard to tasks
router.get("/dashboard", (req, res) => {
  res.redirect("/master/tasks")
})

// Update request/quote status
router.put("/:type/:requestId/status", masterController.updateRequestStatus)

module.exports = router
