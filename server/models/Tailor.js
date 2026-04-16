const mongoose = require('mongoose');

const tailorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shopName: {
    type: String,
    required: true
  },
  experience: {
    type: Number,
    required: true
  },
  specializations: [{
    type: String,
    enum: ['repair', 'alteration', 'stitching', 'embroidery', 'custom']
  }],
  workingHours: {
    open: String,
    close: String,
    days: [String]
  },
  pricing: {
    repair: { min: Number, max: Number },
    alteration: { min: Number, max: Number },
    stitching: { min: Number, max: Number }
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  completedOrders: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  documents: [{
    type: String,
    url: String
  }],
  portfolio: [{
    image: String,
    description: String
  }],
  isAvailable: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Tailor', tailorSchema);
