const express = require("express");
const router = express.Router();

const CuePreset = require("../../models/CuePreset");
const { authUser } = require("../authorization");

// All presets routes require login
router.use(authUser);


// Return all presets for the current user
router.get("/", async (req, res) => {
  try {
    const presets = await CuePreset.find({ userId: req.userId })
      .sort({ updatedAt: -1 })
      .lean();

    res.json(presets);
  } catch (err) {
    console.error("Error loading presets:", err);
    res.status(500).json({ error: "Failed to load presets" });
  }
});


// Creates or updates a preset with that name for this user + modelKey
router.post("/", async (req, res) => {
  try {
    const { name, modelKey, options } = req.body || {};

    if (!name || !modelKey || !options) {
      return res.status(400).json({
        error: "Missing name, modelKey, or options",
      });
    }

    const trimmedName = String(name).trim();
    if (!trimmedName) {
      return res.status(400).json({ error: "Preset name cannot be empty" });
    }

    const preset = await CuePreset.findOneAndUpdate(
      {
        userId: req.userId,
        name: trimmedName,
        modelKey,
      },
      {
        $set: { options },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    ).lean();
    print("presets\n");
    print(req.userId);
    print(preset);
    res.json(preset);
  } catch (err) {
    console.error("Error saving preset:", err);
    res.status(500).json({ error: "Failed to save preset" });
  }
});

// Delete
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await CuePreset.deleteOne({
      _id: id,
      userId: req.userId,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting preset:", err);
    res.status(500).json({ error: "Failed to delete preset" });
  }
});

module.exports = router;
