const express = require("express")
const router = express.Router()
const authController = require("../controllers/authController")

// Show register page
router.get("/register", authController.showRegister)

// Handle registration
router.post("/register", authController.register)

// Show login page
router.get("/login", authController.showLogin)

// Handle login
router.post("/login", authController.login)

// Handle logout
router.get("/logout", authController.logout)

module.exports = router
