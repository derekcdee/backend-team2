const mongoose = require('mongoose');

const UserPreferenceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    modelKey: { type: String, index: true, required: true }, 
    options: {}, // the selections sent by the UI
  },
  { timestamps: true, strict: false }
);

// one doc per user per model
UserPreferenceSchema.index({ userId: 1, modelKey: 1 }, { unique: true });

module.exports = mongoose.model('UserPreference', UserPreferenceSchema);
