const jwt = require("jsonwebtoken")
const JWT_SECRET = "dern-support-secret-key-2025"

// Middleware to require master authentication
const requireMaster = (req, res, next) => {
  const token = req.cookies.token

  if (!token) {
    return res.redirect("/auth/login")
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (decoded.userType !== "master") {
      return res.status(403).render("error", { message: "Access denied. Master only." })
    }
    req.user = decoded
    next()
  } catch (error) {
    res.clearCookie("token")
    res.redirect("/auth/login")
  }
}

module.exports = {
  requireMaster,
}
