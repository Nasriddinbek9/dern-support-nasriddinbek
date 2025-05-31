const { readUsers } = require("./authController")
const { getAllRequests } = require("./requestController")
const fs = require("fs").promises
const path = require("path")

// Show admin dashboard
const showDashboard = async (req, res) => {
  try {
    const users = await readUsers()
    const requests = await getAllRequests()

    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.status === "active").length,
      inactiveUsers: users.filter((u) => u.status === "inactive").length,
      individualUsers: users.filter((u) => u.userType === "individual").length,
      businessUsers: users.filter((u) => u.userType === "business").length,
      totalRequests: requests.length,
      pendingRequests: requests.filter((r) => r.status === "pending").length,
      inProgressRequests: requests.filter((r) => r.status === "in-progress").length,
      resolvedRequests: requests.filter((r) => r.status === "resolved").length,
    }

    res.render("admin/dashboard", {
      user: req.user,
      stats,
      recentUsers: users.slice(-5).reverse(),
      recentRequests: requests.slice(-5).reverse(),
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    res.status(500).render("error", { message: "Failed to load dashboard" })
  }
}

// Show users page
const showUsers = async (req, res) => {
  try {
    const users = await readUsers()
    res.render("admin/users", {
      user: req.user,
      users: users,
    })
  } catch (error) {
    console.error("Users page error:", error)
    res.status(500).render("error", { message: "Failed to load users" })
  }
}

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params
    const users = await readUsers()
    const updatedUsers = users.filter((user) => user.id !== userId)

    const usersFile = path.join(__dirname, "../data/users.json")
    await fs.writeFile(usersFile, JSON.stringify(updatedUsers, null, 2))

    res.json({ success: true, message: "User deleted successfully" })
  } catch (error) {
    console.error("Delete user error:", error)
    res.status(500).json({ success: false, message: "Failed to delete user" })
  }
}

// Show support requests
const showSupportRequests = async (req, res) => {
  try {
    const requests = await getAllRequests()
    res.render("admin/support-requests", {
      user: req.user,
      requests: requests,
    })
  } catch (error) {
    console.error("Support requests error:", error)
    res.status(500).render("error", { message: "Failed to load support requests" })
  }
}

// Show quote requests
const showQuoteRequests = async (req, res) => {
  try {
    const { getAllQuotes } = require("./quoteController")
    const quotes = await getAllQuotes()
    res.render("admin/quote-requests", {
      user: req.user,
      quotes: quotes,
    })
  } catch (error) {
    console.error("Quote requests error:", error)
    res.status(500).render("error", { message: "Failed to load quote requests" })
  }
}

// Update showMasters to show actual masters
const showMasters = (req, res) => {
  const masters = [
    {
      id: "master1",
      name: "Master Smith",
      email: "master1@gmail.com",
      specialization: "Network Specialist",
      status: "active",
    },
    {
      id: "master2",
      name: "Master Johnson",
      email: "master2@gmail.com",
      specialization: "Hardware Expert",
      status: "active",
    },
    {
      id: "master3",
      name: "Master Brown",
      email: "master3@gmail.com",
      specialization: "Software Technician",
      status: "active",
    },
    {
      id: "master4",
      name: "Master Davis",
      email: "master4@gmail.com",
      specialization: "System Administrator",
      status: "active",
    },
  ]

  res.render("admin/masters", {
    user: req.user,
    masters: masters,
  })
}

// Stock management functions
const readStock = async () => {
  try {
    const stockFile = path.join(__dirname, "../data/stock.json")
    const data = await fs.readFile(stockFile, "utf8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Error reading stock:", error)
    return []
  }
}

const writeStock = async (stock) => {
  try {
    const stockFile = path.join(__dirname, "../data/stock.json")
    await fs.writeFile(stockFile, JSON.stringify(stock, null, 2))
    return true
  } catch (error) {
    console.error("Error writing stock:", error)
    return false
  }
}

const generateStockId = (stock) => {
  const maxId = stock.reduce((max, item) => {
    const num = Number.parseInt(item.id.split("-")[1])
    return num > max ? num : max
  }, 0)
  return `ITM-${String(maxId + 1).padStart(3, "0")}`
}

const getStockStatus = (quantity) => {
  if (quantity === 0) return "out-of-stock"
  if (quantity <= 10) return "low-stock"
  return "in-stock"
}

// Show stock with actual data
const showStock = async (req, res) => {
  try {
    const stock = await readStock()
    res.render("admin/stock", {
      user: req.user,
      stock: stock,
    })
  } catch (error) {
    console.error("Stock page error:", error)
    res.status(500).render("error", { message: "Failed to load stock" })
  }
}

// Add new stock item
const addStockItem = async (req, res) => {
  try {
    const { name, category, quantity, price } = req.body

    if (!name || !category || quantity === undefined || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      })
    }

    const stock = await readStock()
    const newItem = {
      id: generateStockId(stock),
      name: name.trim(),
      category,
      quantity: Number.parseInt(quantity),
      price: Number.parseFloat(price),
      status: getStockStatus(Number.parseInt(quantity)),
      dateAdded: new Date().toISOString().split("T")[0],
    }

    stock.push(newItem)
    const success = await writeStock(stock)

    if (success) {
      res.json({
        success: true,
        message: "Item added successfully",
        item: newItem,
      })
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to save item",
      })
    }
  } catch (error) {
    console.error("Add stock item error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to add item",
    })
  }
}

// Update stock item
const updateStockItem = async (req, res) => {
  try {
    const { itemId } = req.params
    const { name, category, quantity, price } = req.body

    if (!name || !category || quantity === undefined || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      })
    }

    const stock = await readStock()
    const itemIndex = stock.findIndex((item) => item.id === itemId)

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      })
    }

    stock[itemIndex] = {
      ...stock[itemIndex],
      name: name.trim(),
      category,
      quantity: Number.parseInt(quantity),
      price: Number.parseFloat(price),
      status: getStockStatus(Number.parseInt(quantity)),
    }

    const success = await writeStock(stock)

    if (success) {
      res.json({
        success: true,
        message: "Item updated successfully",
        item: stock[itemIndex],
      })
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to update item",
      })
    }
  } catch (error) {
    console.error("Update stock item error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update item",
    })
  }
}

// Delete stock item
const deleteStockItem = async (req, res) => {
  try {
    const { itemId } = req.params
    const stock = await readStock()
    const itemIndex = stock.findIndex((item) => item.id === itemId)

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      })
    }

    const deletedItem = stock.splice(itemIndex, 1)[0]
    const success = await writeStock(stock)

    if (success) {
      res.json({
        success: true,
        message: "Item deleted successfully",
        item: deletedItem,
      })
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to delete item",
      })
    }
  } catch (error) {
    console.error("Delete stock item error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete item",
    })
  }
}

// Get single stock item
const getStockItem = async (req, res) => {
  try {
    const { itemId } = req.params
    const stock = await readStock()
    const item = stock.find((item) => item.id === itemId)

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      })
    }

    res.json({
      success: true,
      item: item,
    })
  } catch (error) {
    console.error("Get stock item error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get item",
    })
  }
}

module.exports = {
  showDashboard,
  showUsers,
  deleteUser,
  showSupportRequests,
  showQuoteRequests,
  showMasters,
  showStock,
  addStockItem,
  updateStockItem,
  deleteStockItem,
  getStockItem,
}
