const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const UserPreference = require("../../models/UserPreference");

// Middleware to get user from session
const getAuthenticatedUser = (req, res, next) => {
  // Check multiple possible locations for user data based on common auth patterns
  let userId = null;
  
  // Pattern 1: req.user (common with passport.js)
  if (req.user && req.user._id) {
    userId = req.user._id;
  }
  // Pattern 2: req.user with id field
  else if (req.user && req.user.id) {
    userId = req.user.id;
  }
  // Pattern 3: req.session.user
  else if (req.session && req.session.user && req.session.user._id) {
    userId = req.session.user._id;
  }
  // Pattern 4: req.session.userId
  else if (req.session && req.session.userId) {
    userId = req.session.userId;
  }
  // Pattern 5: Authorization header with user ID (for testing)
  else if (req.headers['x-user-id']) {
    userId = req.headers['x-user-id'];
  }

  if (userId) {
    try {
      req.userId = new mongoose.Types.ObjectId(userId);
      console.log("Using authenticated user ID:", req.userId);
      next();
    } catch (error) {
      console.log("Invalid user ID format:", userId);
      return res.status(401).json({ error: "Invalid user authentication" });
    }
  } else {
    // No user found - use unique demo user per session
    if (!req.session.demoUserId) {
      // Generate a unique ObjectId for this demo session
      req.session.demoUserId = new mongoose.Types.ObjectId();
      console.log("Created new demo user ID:", req.session.demoUserId);
    }
    req.userId = req.session.demoUserId;
    console.log("Using demo user ID:", req.userId);
    next();
  }
};

router.use(getAuthenticatedUser);

router.get("/", async (req, res) => {
  try {
    console.log("Fetching preferences for user:", req.userId);
    const docs = await UserPreference.find({ userId: req.userId }).lean();
    console.log(`Found ${docs.length} preferences for user ${req.userId}`);
    res.json(docs);
  } catch (error) {
    console.error("Error fetching preferences:", error);
    res.status(500).json({ error: "Failed to fetch preferences" });
  }
});

router.get("/:modelKey", async (req, res) => {
  try {
    console.log("Fetching preference for user:", req.userId, "model:", req.params.modelKey);
    const doc = await UserPreference.findOne({
      userId: req.userId,
      modelKey: req.params.modelKey,
    }).lean();
    console.log("Found preference:", doc ? "yes" : "no");
    res.json(doc || null);
  } catch (error) {
    console.error("Error fetching preference:", error);
    res.status(500).json({ error: "Failed to fetch preference" });
  }
});

router.put("/:modelKey", async (req, res) => {
  try {
    console.log("SAVE PREFS HIT", { 
      userId: req.userId, 
      modelKey: req.params.modelKey, 
      bodyKeys: Object.keys(req.body || {}) 
    });
    
    const { options = {} } = req.body || {};
    const doc = await UserPreference.findOneAndUpdate(
      { userId: req.userId, modelKey: req.params.modelKey },
      { $set: { options } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
    console.log("Saved preference for user:", req.userId);
    res.json(doc);
  } catch (error) {
    console.error("Error saving preference:", error);
    res.status(500).json({ error: "Failed to save preference" });
  }
});

router.delete("/:modelKey", async (req, res) => {
  try {
    console.log("Deleting preference for user:", req.userId, "model:", req.params.modelKey);
    await UserPreference.deleteOne({ 
      userId: req.userId, 
      modelKey: req.params.modelKey 
    });
    res.json({ ok: true });
  } catch (error) {
    console.error("Error deleting preference:", error);
    res.status(500).json({ error: "Failed to delete preference" });
  }
});

module.exports = router;