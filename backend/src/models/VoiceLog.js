const mongoose = require('mongoose');

const voiceLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    transcript: {
      type: String,
      required: true
    },
    language: {
      type: String,
      default: 'en-IN'
    },
    intent: {
      type: String,
      required: true
    },
    parameters: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    success: {
      type: Boolean,
      default: true
    },
    responseText: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

const VoiceLog = mongoose.models.VoiceLog || mongoose.model('VoiceLog', voiceLogSchema);
module.exports = VoiceLog;
