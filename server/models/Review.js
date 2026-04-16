const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
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
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  },
  images: [{
    type: String
  }],
  response: {
    text: String,
    respondedAt: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
