const fs = require("fs").promises
const path = require("path")

// Import the file paths and functions directly
const REQUESTS_FILE = path.join(__dirname, "../data/support-requests.json")
const QUOTES_FILE = path.join(__dirname, "../data/quotes.json")

// Ensure data directory exists
const ensureDataDir = async () => {
  const dataDir = path.join(__dirname, "../data")
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// Read requests from JSON file
const readRequests = async () => {
  try {
    await ensureDataDir()
    const data = await fs.readFile(REQUESTS_FILE, "utf8")
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

// Write requests to JSON file
const writeRequests = async (requests) => {
  await ensureDataDir()
  await fs.writeFile(REQUESTS_FILE, JSON.stringify(requests, null, 2))
}

// Read quotes from JSON file
const readQuotes = async () => {
  try {
    await ensureDataDir()
    const data = await fs.readFile(QUOTES_FILE, "utf8")
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

// Write quotes to JSON file
const writeQuotes = async (quotes) => {
  await ensureDataDir()
  await fs.writeFile(QUOTES_FILE, JSON.stringify(quotes, null, 2))
}

// Get master tasks page with all assigned requests
const showTasks = async (req, res) => {
  try {
    const requests = await readRequests()
    const quotes = await readQuotes()

    // Filter all requests assigned to this master (regardless of status)
    const masterRequests = requests.filter((request) => request.assignedTo === req.user.name)
    const masterQuotes = quotes.filter((quote) => quote.assignedTo === req.user.name)

    res.render("master/tasks", {
      user: req.user,
      requests: masterRequests,
      quotes: masterQuotes,
    })
  } catch (error) {
    console.error("Master tasks error:", error)
    res.status(500).render("error", { message: "Failed to load tasks" })
  }
}

// Update request status (master can only change to in-progress, done, or delay)
const updateRequestStatus = async (req, res) => {
  try {
    const { requestId, type } = req.params
    const { status, notes } = req.body

    console.log("Update request:", { requestId, type, status, notes }) // Debug log

    // Validate status - masters can only set these statuses
    if (!["in-progress", "done", "delay"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" })
    }

    let data, writeFunction

    if (type === "request") {
      data = await readRequests()
      writeFunction = writeRequests
    } else if (type === "quote") {
      data = await readQuotes()
      writeFunction = writeQuotes
    } else {
      return res.status(400).json({ success: false, message: "Invalid type" })
    }

    const itemIndex = data.findIndex((item) => item.id === requestId)

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: "Item not found" })
    }

    // Check if this master is assigned to this request
    if (data[itemIndex].assignedTo !== req.user.name) {
      return res.status(403).json({ success: false, message: "Not authorized to update this request" })
    }

    // Update the status
    data[itemIndex].status = status
    data[itemIndex].updatedDate = new Date().toISOString().split("T")[0]

    // Add notes if provided
    if (notes && notes.trim()) {
      if (!data[itemIndex].comments) {
        data[itemIndex].comments = []
      }
      data[itemIndex].comments.push({
        id: Date.now().toString(),
        author: req.user.name,
        comment: notes.trim(),
        date: new Date().toISOString().split("T")[0],
      })
    }

    // Save the updated data
    await writeFunction(data)

    console.log("Status updated successfully for:", requestId) // Debug log
    res.json({ success: true, message: "Status updated successfully" })
  } catch (error) {
    console.error("Update status error:", error)
    res.status(500).json({ success: false, message: "Server error: " + error.message })
  }
}

module.exports = {
  showTasks,
  updateRequestStatus,
}
