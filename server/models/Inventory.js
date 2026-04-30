const mongoose = require('mongoose');

/**
 * Inventory Model
 * Tracks raw materials, gemstones, and supplies
 */
const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Metal', 'Gemstone', 'Tool', 'Packaging', 'Chemical', 'Other'],
      required: true,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    unit: {
      type: String,
      enum: ['grams', 'kilograms', 'pieces', 'carats', 'milliliters', 'liters'],
      required: true,
    },
    minStockLevel: {
      type: Number,
      default: 10,
    },
    pricePerUnit: {
      type: Number,
      default: 0,
    },
    supplier: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '', // Storage location in workshop
    },
    description: {
      type: String,
      default: '',
    },
    lastRestocked: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Virtual: check if stock is low
inventorySchema.virtual('isLowStock').get(function () {
  return this.quantity <= this.minStockLevel;
});

// Ensure virtuals are included in JSON output
inventorySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Inventory', inventorySchema);
