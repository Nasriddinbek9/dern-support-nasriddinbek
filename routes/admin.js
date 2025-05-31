const express = require("express")
const router = express.Router()
const adminController = require("../controllers/adminController")
const requestController = require("../controllers/requestController")
const quoteController = require("../controllers/quoteController")
const { requireAdmin } = require("../middleware/auth")

// Apply admin middleware to all routes
router.use(requireAdmin)

// Dashboard
router.get("/dashboard", adminController.showDashboard)

// Users management
router.get("/users", adminController.showUsers)
router.delete("/users/:userId", adminController.deleteUser)

// Support requests
router.get("/support-requests", adminController.showSupportRequests)
router.put("/support-requests/:requestId", requestController.updateRequestStatus)
router.delete("/support-requests/:requestId", requestController.deleteRequest)

// Quote requests
router.get("/quote-requests", adminController.showQuoteRequests)
router.put("/quote-requests/:quoteId", quoteController.updateQuoteStatus)
router.delete("/quote-requests/:quoteId", quoteController.deleteQuote)

// Masters
router.get("/masters", adminController.showMasters)

// Stock management routes
router.get("/stock", adminController.showStock)
router.post("/stock/add", adminController.addStockItem)
router.get("/stock/:itemId", adminController.getStockItem)
router.put("/stock/:itemId", adminController.updateStockItem)
router.delete("/stock/:itemId", adminController.deleteStockItem)

module.exports = router
