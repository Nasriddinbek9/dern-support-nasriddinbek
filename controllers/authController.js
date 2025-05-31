const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const fs = require("fs").promises
const path = require("path")

const JWT_SECRET = "dern-support-secret-key-2025"
const USERS_FILE = path.join(__dirname, "../data/users.json")

// Ensure data directory exists
const ensureDataDir = async () => {
  const dataDir = path.join(__dirname, "../data")
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// Read users from JSON file
const readUsers = async () => {
  try {
    await ensureDataDir()
    const data = await fs.readFile(USERS_FILE, "utf8")
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

// Write users to JSON file
const writeUsers = async (users) => {
  await ensureDataDir()
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2))
}

// Register controller
const register = async (req, res) => {
  try {
    const { name, email, password, phone, userType = "individual" } = req.body

    if (!name || !email || !password) {
      return res.status(400).render("auth/register", {
        error: "Please fill in all required fields",
        formData: req.body,
      })
    }

    const users = await readUsers()

    // Check if user already exists
    const existingUser = users.find((user) => user.email === email)
    if (existingUser) {
      return res.status(400).render("auth/register", {
        error: "User with this email already exists",
        formData: req.body,
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      phone: phone || "",
      userType,
      registrationDate: new Date().toISOString().split("T")[0],
      status: "active",
    }

    users.push(newUser)
    await writeUsers(users)

    // Create JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, name: newUser.name, userType: newUser.userType },
      JWT_SECRET,
      { expiresIn: "24h" },
    )

    res.cookie("token", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
    res.redirect("/user/dashboard")
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).render("auth/register", {
      error: "Registration failed. Please try again.",
      formData: req.body,
    })
  }
}

// Login controller
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).render("auth/login", {
        error: "Please provide email and password",
        formData: req.body,
      })
    }

    // Check for admin login
    if (email === "admin@gmail.com" && password === "1234") {
      const adminToken = jwt.sign(
        { id: "admin", email: "admin@gmail.com", name: "Admin", userType: "admin" },
        JWT_SECRET,
        { expiresIn: "24h" },
      )
      res.cookie("token", adminToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
      return res.redirect("/admin/dashboard")
    }

    // Check for master login
    const masters = [
      { email: "master1@gmail.com", password: "master1", name: "Master Smith", id: "master1" },
      { email: "master2@gmail.com", password: "master2", name: "Master Johnson", id: "master2" },
      { email: "master3@gmail.com", password: "master3", name: "Master Brown", id: "master3" },
      { email: "master4@gmail.com", password: "master4", name: "Master Davis", id: "master4" },
    ]

    const master = masters.find((m) => m.email === email && m.password === password)
    if (master) {
      const masterToken = jwt.sign(
        { id: master.id, email: master.email, name: master.name, userType: "master" },
        JWT_SECRET,
        { expiresIn: "24h" },
      )
      res.cookie("token", masterToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
      return res.redirect("/master/dashboard")
    }

    const users = await readUsers()
    const user = users.find((u) => u.email === email)

    if (!user) {
      return res.status(400).render("auth/login", {
        error: "Invalid email or password",
        formData: req.body,
      })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(400).render("auth/login", {
        error: "Invalid email or password",
        formData: req.body,
      })
    }

    // Create JWT token
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, userType: user.userType }, JWT_SECRET, {
      expiresIn: "24h",
    })

    res.cookie("token", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
    res.redirect("/user/dashboard")
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).render("auth/login", {
      error: "Login failed. Please try again.",
      formData: req.body,
    })
  }
}

// Logout controller
const logout = (req, res) => {
  res.clearCookie("token")
  res.redirect("/")
}

// Show register page
const showRegister = (req, res) => {
  res.render("auth/register", { error: null, formData: {} })
}

// Show login page
const showLogin = (req, res) => {
  res.render("auth/login", { error: null, formData: {} })
}

module.exports = {
  register,
  login,
  logout,
  showRegister,
  showLogin,
  readUsers,
}
