/**
 * Create the first admin account.
 *
 * Run from the server folder:
 *   ADMIN_NAME="Admin" ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="change-me-123" node scripts/createAdmin.js
 *
 * Uses MONGO_URI from .env. If an account already exists for ADMIN_EMAIL, the script exits without duplicating it.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jewellery-assistant';
const name = process.env.ADMIN_NAME?.trim() || 'Admin';
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

const createAdmin = async () => {
  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required');
  }

  if (password.length < 6) {
    throw new Error('ADMIN_PASSWORD must be at least 6 characters');
  }

  await mongoose.connect(MONGO_URI);

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    console.log(`Admin setup skipped: ${email} already exists with role "${existingUser.role}".`);
    return;
  }

  await User.create({ name, email, password, role: 'admin' });
  console.log(`Admin account created for ${email}.`);
};

createAdmin()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
