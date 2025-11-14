const mongoose = require("mongoose");

const CuePresetSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    modelKey: { type: String, required: true },
    options: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

// prevent duplicates
CuePresetSchema.index({ userId: 1, name: 1, modelKey: 1 }, { unique: true });

module.exports = mongoose.model("CuePreset", CuePresetSchema);
