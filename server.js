const express = require("express")
const path = require("path")
const cookieParser = require("cookie-parser")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const fs = require("fs").promises

const app = express()
const PORT = process.env.PORT || 3000
const JWT_SECRET = "dern-support-secret-key-2025"

// Middleware
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))
app.use(express.static(path.join(__dirname, "public")))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser())

// Import routes
const authRoutes = require("./routes/auth")
const adminRoutes = require("./routes/admin")
const userRoutes = require("./routes/user")
const masterRoutes = require("./routes/master")

// Routes
app.use("/auth", authRoutes)
app.use("/admin", adminRoutes)
app.use("/user", userRoutes)
app.use("/master", masterRoutes)

// Home route
app.get("/", (req, res) => {
  res.render("index", { user: req.user || null })
})

// Middleware to check authentication
app.use((req, res, next) => {
  const token = req.cookies.token
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      req.user = decoded
    } catch (error) {
      req.user = null
    }
  }
  next()
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).render("error", { message: "Something went wrong!" })
})

// 404 handler
app.use((req, res) => {
  res.status(404).render("error", { message: "Page not found!" })
})

app.listen(PORT, () => {
  console.log(`Dern-Support server running on http://localhost:${PORT}`)
})

module.exports = app
