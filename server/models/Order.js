const mongoose = require('mongoose');

/**
 * Order Model
 * Tracks jewellery manufacturing orders
 */
const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
    title: {
      type: String,
      required: [true, 'Order title is required'],
      trim: true,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    customerPhone: {
      type: String,
      default: '',
    },
    metalType: {
      type: String,
      enum: ['Gold', 'Silver', 'Platinum', 'Rose Gold', 'White Gold', 'Other'],
      required: true,
    },
    metalWeight: {
      type: Number, // in grams
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Quality Check', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    completedDate: {
      type: Date,
    },
    assignedWorker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      default: null,
    },
    estimatedCost: {
      type: Number,
      default: 0,
    },
    finalCost: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
    attachments: [String], // URLs to uploaded images
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Auto-generate order number before saving
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `JWL-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
