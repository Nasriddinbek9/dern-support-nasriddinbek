const fs = require("fs").promises
const path = require("path")

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

// Book service
const bookService = async (req, res) => {
  try {
    const { serviceType, serviceName, urgency, urgencyName, serviceFee, urgencyFee, totalCost } = req.body

    if (!serviceType || !urgency) {
      return res.status(400).json({ success: false, message: "Please fill in all required fields" })
    }

    const quotes = await readQuotes()

    const newQuote = {
      id: Date.now().toString(),
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      serviceType,
      serviceName,
      urgency,
      urgencyName,
      serviceFee,
      urgencyFee,
      totalCost,
      status: "pending",
      assignedTo: null,
      createdDate: new Date().toISOString().split("T")[0],
      updatedDate: new Date().toISOString().split("T")[0],
    }

    quotes.push(newQuote)
    await writeQuotes(quotes)

    res.json({ success: true, message: "Service booked successfully!" })
  } catch (error) {
    console.error("Book service error:", error)
    res.status(500).json({ success: false, message: "Failed to book service. Please try again." })
  }
}

// Get user quotes
const getUserQuotes = async (userId) => {
  try {
    const quotes = await readQuotes()
    return quotes.filter((quote) => quote.userId === userId)
  } catch (error) {
    console.error("Get user quotes error:", error)
    return []
  }
}

// Get all quotes (admin)
const getAllQuotes = async () => {
  try {
    return await readQuotes()
  } catch (error) {
    console.error("Get all quotes error:", error)
    return []
  }
}

// Update quote status
const updateQuoteStatus = async (req, res) => {
  try {
    const { quoteId } = req.params
    const { status, assignedTo, comment } = req.body

    const quotes = await readQuotes()
    const quoteIndex = quotes.findIndex((q) => q.id === quoteId)

    if (quoteIndex === -1) {
      return res.status(404).json({ success: false, message: "Quote not found" })
    }

    // If a master is being assigned and no status is provided, set to in-progress
    if (assignedTo && !status) {
      quotes[quoteIndex].status = "in-progress"
    } else {
      quotes[quoteIndex].status = status
    }

    quotes[quoteIndex].updatedDate = new Date().toISOString().split("T")[0]

    if (assignedTo !== undefined) {
      quotes[quoteIndex].assignedTo = assignedTo
    }

    if (comment) {
      if (!quotes[quoteIndex].comments) {
        quotes[quoteIndex].comments = []
      }
      quotes[quoteIndex].comments.push({
        id: Date.now().toString(),
        author: req.user.name,
        comment,
        date: new Date().toISOString().split("T")[0],
      })
    }

    await writeQuotes(quotes)
    res.json({ success: true, message: "Quote updated successfully" })
  } catch (error) {
    console.error("Update quote error:", error)
    res.status(500).json({ success: false, message: "Failed to update quote" })
  }
}

// Delete quote
const deleteQuote = async (req, res) => {
  try {
    const { quoteId } = req.params
    const quotes = await readQuotes()
    const updatedQuotes = quotes.filter((quote) => quote.id !== quoteId)

    await writeQuotes(updatedQuotes)
    res.json({ success: true, message: "Quote deleted successfully" })
  } catch (error) {
    console.error("Delete quote error:", error)
    res.status(500).json({ success: false, message: "Failed to delete quote" })
  }
}

module.exports = {
  bookService,
  getUserQuotes,
  getAllQuotes,
  updateQuoteStatus,
  deleteQuote,
  readQuotes,
}
