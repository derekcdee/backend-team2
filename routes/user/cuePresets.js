const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const CuePreset = require("../../models/CuePreset");
const { authUser } = require("../authorization");
const { getAllowedOrigins, getStripeKey } = require('../../utils/environment');
const { makeError, makeResponse } = require('../../response/makeResponse');

// all routes require authentication
router.use(authUser);

router.use(function (req, res, next) {
    const allowedOrigins = getAllowedOrigins();
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, methods, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers")
    next()
});

// GET all presets for logged in user
router.get("/", async (req, res) => {
  try {
    const presets = await CuePreset.find({ userId: req.userId }).lean();
    res.status(200).json(makeResponse('success', presets, ['fetched all presets from database'], false))
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load presets" });
  }
});

// POST create/update preset
router.post("/", async (req, res) => {
  try {
    const { name, modelKey, options } = req.body;
    const preset = await CuePreset.findOneAndUpdate(
      {
        userId: req.userId,
        name,
        modelKey
      },
      {
        $set: { options }
      },
      { upsert: true, new: true, runValidators: true }
    );
    
    res.status(201).json(makeResponse('success', preset, ['New Preset successfully created.'], false));
  } catch (err) {
    res.status(400).json(makeError([err.message]))

  }
});

// DELETE a preset
router.delete("/:id", async (req, res) => {
  try {
    await CuePreset.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    res.json(makeResponse('success', _id, ['Preset deleted successfully.'], false))
  } catch (err) {
    res.status(500).json(makeError(["internal server error, please try again later or contact support"]))
  }
});

module.exports = router;