const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tailorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tailor',
    required: true
  },
  serviceType: {
    type: String,
    enum: ['repair', 'alteration', 'stitching'],
    required: true
  },
  garmentType: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  images: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['pending', 'quoted', 'accepted', 'in-progress', 'completed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  quote: {
    price: Number,
    estimatedTime: String,
    notes: String,
    quotedAt: Date
  },
  pickup: {
    date: Date,
    timeSlot: String,
    address: String,
    status: {
      type: String,
      enum: ['pending', 'scheduled', 'picked', 'cancelled'],
      default: 'pending'
    }
  },
  delivery: {
    date: Date,
    timeSlot: String,
    address: String,
    status: {
      type: String,
      enum: ['pending', 'scheduled', 'delivered', 'cancelled'],
      default: 'pending'
    }
  },
  payment: {
    amount: Number,
    method: String,
    status: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending'
    },
    paidAt: Date
  },
  sustainabilityImpact: {
    co2Saved: Number,
    waterSaved: Number,
    category: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
