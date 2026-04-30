/**
 * Create the first admin account.
 *
 * Run from the server folder:
 *   ADMIN_NAME="Admin" ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="change-me-123" node scripts/createAdmin.js
 *
 * Uses MONGO_URI from server/.env. If an account already exists for ADMIN_EMAIL,
 * the script exits without duplicating it unless ADMIN_RESET=true is set.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jewellery-assistant';
const name = process.env.ADMIN_NAME?.trim() || 'Admin';
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const shouldReset = process.env.ADMIN_RESET === 'true';

const isBcryptHash = (value) => /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value || '');

const hashPasswordIfNeeded = async (value) => {
  if (isBcryptHash(value)) return value;
  return bcrypt.hash(value, 12);
};

const createAdmin = async () => {
  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required');
  }

  if (password.length < 6) {
    throw new Error('ADMIN_PASSWORD must be at least 6 characters');
  }

  await mongoose.connect(MONGO_URI);

  const hashedPassword = await hashPasswordIfNeeded(password);
  const existingUser = await User.findOne({ email }).select('+password');

  if (existingUser) {
    if (!shouldReset) {
      console.log(`Admin setup skipped: ${email} already exists with role "${existingUser.role}". Set ADMIN_RESET=true to reset its password.`);
      return;
    }

    existingUser.name = name;
    existingUser.password = hashedPassword;
    existingUser.role = 'admin';
    await existingUser.save();
    console.log(`Admin password reset and role confirmed for ${email}.`);
    return;
  }

  await User.create({ name, email, password: hashedPassword, role: 'admin' });
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
