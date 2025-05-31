
const express = require("express")
const router = express.Router()
const userController = require("../controllers/userController")
const requestController = require("../controllers/requestController")
const quoteController = require("../controllers/quoteController")
const { requireAuth } = require("../middleware/auth")

// Public routes (no authentication required)
router.get("/knowledge", userController.showKnowledge)
router.get("/individual-support", userController.showIndividualSupport)
router.get("/business-support", userController.showBusinessSupport)
router.get("/submit-request", userController.showSubmitRequest)

// Protected routes (authentication required)
router.get("/dashboard", requireAuth, userController.showDashboard)
router.post("/submit-request", requireAuth, requestController.submitRequest)
router.post("/book-service", requireAuth, quoteController.bookService)

module.exports = router
