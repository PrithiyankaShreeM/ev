const mongoose = require('mongoose');

const chargerSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: [true, 'Please provide charger name'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    address: {
      type: String,
      required: [true, 'Please provide charger address']
    },
    city: {
      type: String,
      default: 'Chennai'
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    acDcType: {
      type: String,
      enum: ['AC', 'DC'],
      default: 'AC'
    },
    connectorType: {
      type: String,
      enum: ['Type 1', 'Type 2', 'CCS', 'CHAdeMO'],
      default: 'Type 2'
    },
    capacityKw: {
      type: Number,
      required: [true, 'Please provide capacity in kW'],
      default: 7.4
    },
    numberOfConnectors: {
      type: Number,
      default: 1
    },
    photos: {
      type: [String],
      default: []
    },
    instructions: {
      type: String,
      default: 'Ring doorbell or call host before plugging in.'
    },
    isFree: {
      type: Boolean,
      default: false
    },
    pricing: {
      pricePerKwh: { type: Number, default: 15 },
      pricePerHour: { type: Number, default: 40 },
      pricePerSession: { type: Number, default: 100 }
    },
    availableDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    availableSlots: [
      {
        startTime: { type: String, default: '08:00' },
        endTime: { type: String, default: '22:00' }
      }
    ],
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

chargerSchema.index({ location: '2dsphere' });

const Charger = mongoose.models.Charger || mongoose.model('Charger', chargerSchema);
module.exports = Charger;
