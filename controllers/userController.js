const { getUserRequests } = require("./requestController")
const { getUserQuotes } = require("./quoteController")

// Show user dashboard
const showDashboard = async (req, res) => {
  try {
    const userRequests = await getUserRequests(req.user.id)
    const recentRequests = userRequests.slice(-5).reverse()

    res.render("user/dashboard", {
      user: req.user,
      requests: recentRequests,
      success: req.query.success || null,
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    res.render("user/dashboard", {
      user: req.user,
      requests: [],
      success: null,
    })
  }
}

// Show knowledge base
const showKnowledge = (req, res) => {
  res.render("user/knowledge", { user: req.user || null })
}

// Show individual support
const showIndividualSupport = (req, res) => {
  res.render("user/individual-support", { user: req.user || null })
}

// Show business support
const showBusinessSupport = (req, res) => {
  res.render("user/business-support", { user: req.user || null })
}

// Show submit request
const showSubmitRequest = async (req, res) => {
  try {
    let userRequests = []
    let userQuotes = []

    if (req.user) {
      userRequests = await getUserRequests(req.user.id)
      userQuotes = await getUserQuotes(req.user.id)
    }

    res.render("user/submit-request", {
      user: req.user || null,
      error: null,
      formData: {},
      requests: userRequests.slice(-5).reverse(),
      quotes: userQuotes.slice(-5).reverse(),
    })
  } catch (error) {
    console.error("Submit request page error:", error)
    res.render("user/submit-request", {
      user: req.user || null,
      error: null,
      formData: {},
      requests: [],
      quotes: [],
    })
  }
}

module.exports = {
  showDashboard,
  showKnowledge,
  showIndividualSupport,
  showBusinessSupport,
  showSubmitRequest,
}
