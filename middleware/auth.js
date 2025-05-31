const jwt = require("jsonwebtoken")
const JWT_SECRET = "dern-support-secret-key-2025"

// Middleware to require authentication
const requireAuth = (req, res, next) => {
  const token = req.cookies.token

  if (!token) {
    return res.redirect("/auth/login")
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    res.clearCookie("token")
    res.redirect("/auth/login")
  }
}

// Middleware to require admin authentication
const requireAdmin = (req, res, next) => {
  const token = req.cookies.token

  if (!token) {
    return res.redirect("/auth/login")
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (decoded.userType !== "admin") {
      return res.status(403).render("error", { message: "Access denied. Admin only." })
    }
    req.user = decoded
    next()
  } catch (error) {
    res.clearCookie("token")
    res.redirect("/auth/login")
  }
}

module.exports = {
  requireAuth,
  requireAdmin,
}
