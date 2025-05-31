const fs = require("fs").promises
const path = require("path")

const REQUESTS_FILE = path.join(__dirname, "../data/support-requests.json")

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

// Submit new request
const submitRequest = async (req, res) => {
  try {
    const { requestType, priority, description, serviceLocation } = req.body

    if (!requestType || !priority || !description) {
      return res.status(400).render("user/submit-request", {
        user: req.user,
        error: "Please fill in all required fields",
        formData: req.body,
        requests: [],
        quotes: [],
      })
    }

    const requests = await readRequests()

    const newRequest = {
      id: Date.now().toString(),
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      requestType,
      priority,
      description,
      serviceLocation: serviceLocation || "dropoff",
      status: "pending",
      createdDate: new Date().toISOString().split("T")[0],
      updatedDate: new Date().toISOString().split("T")[0],
      assignedTo: null,
      comments: [],
    }

    requests.push(newRequest)
    await writeRequests(requests)

    res.redirect("/user/dashboard?success=Request submitted successfully!")
  } catch (error) {
    console.error("Submit request error:", error)
    res.status(500).render("user/submit-request", {
      user: req.user,
      error: "Failed to submit request. Please try again.",
      formData: req.body,
      requests: [],
      quotes: [],
    })
  }
}

// Get user requests
const getUserRequests = async (userId) => {
  try {
    const requests = await readRequests()
    return requests.filter((request) => request.userId === userId)
  } catch (error) {
    console.error("Get user requests error:", error)
    return []
  }
}

// Get all requests (admin)
const getAllRequests = async () => {
  try {
    return await readRequests()
  } catch (error) {
    console.error("Get all requests error:", error)
    return []
  }
}

// Update request status
const updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params
    const { status, assignedTo, comment } = req.body

    const requests = await readRequests()
    const requestIndex = requests.findIndex((r) => r.id === requestId)

    if (requestIndex === -1) {
      return res.status(404).json({ success: false, message: "Request not found" })
    }

    requests[requestIndex].status = status
    requests[requestIndex].updatedDate = new Date().toISOString().split("T")[0]

    if (assignedTo !== undefined) {
      requests[requestIndex].assignedTo = assignedTo
    }

    if (comment) {
      if (!requests[requestIndex].comments) {
        requests[requestIndex].comments = []
      }
      requests[requestIndex].comments.push({
        id: Date.now().toString(),
        author: req.user.name,
        comment,
        date: new Date().toISOString().split("T")[0],
      })
    }

    await writeRequests(requests)
    res.json({ success: true, message: "Request updated successfully" })
  } catch (error) {
    console.error("Update request error:", error)
    res.status(500).json({ success: false, message: "Failed to update request" })
  }
}

// Delete request
const deleteRequest = async (req, res) => {
  try {
    const { requestId } = req.params
    const requests = await readRequests()
    const updatedRequests = requests.filter((request) => request.id !== requestId)

    await writeRequests(updatedRequests)
    res.json({ success: true, message: "Request deleted successfully" })
  } catch (error) {
    console.error("Delete request error:", error)
    res.status(500).json({ success: false, message: "Failed to delete request" })
  }
}

module.exports = {
  submitRequest,
  getUserRequests,
  getAllRequests,
  updateRequestStatus,
  deleteRequest,
  readRequests,
}
