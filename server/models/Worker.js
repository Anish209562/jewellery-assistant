const mongoose = require('mongoose');

/**
 * Worker Model
 * Tracks craftsmen and their work assignments
 */
const workerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Worker name is required'],
      trim: true,
    },
    email: {
      type: String,
      default: '',
      lowercase: true,
      trim: true,
      validate: {
        validator(value) {
          return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: 'Please enter a valid email address',
      },
    },
    userAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    specialization: {
      type: String,
      enum: [
        'Gold Smith',
        'Silver Smith',
        'Stone Setting',
        'Polishing',
        'Engraving',
        'Casting',
        'Wax Carving',
        'Quality Control',
        'General',
      ],
      required: true,
    },
    experience: {
      type: Number, // years of experience
      default: 0,
    },
    status: {
      type: String,
      enum: ['Available', 'Busy', 'On Leave', 'Inactive'],
      default: 'Available',
    },
    salary: {
      type: Number,
      default: 0,
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    assignedOrders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
      },
    ],
    completedOrders: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Worker', workerSchema);
