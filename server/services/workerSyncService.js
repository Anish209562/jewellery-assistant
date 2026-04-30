const User = require('../models/User');
const Worker = require('../models/Worker');

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const normalizeEmail = (email) => (email || '').trim().toLowerCase();

const publicUser = (user) => {
  if (!user) return null;
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
};

const workerPayload = (data = {}) => ({
  name: data.name?.trim(),
  email: normalizeEmail(data.email),
  phone: data.phone?.trim() || 'N/A',
  specialization: data.specialization || 'General',
  experience: data.experience === '' || data.experience === undefined ? 0 : data.experience,
  status: data.status || 'Available',
  salary: data.salary === '' || data.salary === undefined ? 0 : data.salary,
  notes: data.notes || '',
});

const assertWorkerEmailAvailable = async (email, workerIdToExclude = null) => {
  if (!email) return;

  if (!isValidEmail(email)) {
    const error = new Error('Please enter a valid email address');
    error.statusCode = 400;
    throw error;
  }

  const query = { email };
  if (workerIdToExclude) query._id = { $ne: workerIdToExclude };

  const existingWorker = await Worker.findOne(query);
  if (existingWorker) {
    const error = new Error('Worker with this email already exists');
    error.statusCode = 400;
    throw error;
  }
};

const findOrCreateWorkerUser = async ({ name, email, password, existingUserId }) => {
  if (!email) return null;

  let user = existingUserId ? await User.findById(existingUserId).select('+password') : null;

  if (existingUserId) {
    const conflictingUser = await User.findOne({ email, _id: { $ne: existingUserId } });
    if (conflictingUser) {
      const error = new Error('Email already registered');
      error.statusCode = 400;
      throw error;
    }
  }

  if (!user) user = await User.findOne({ email }).select('+password');

  if (user && user.role !== 'worker') {
    const error = new Error('Email is already registered to an admin account');
    error.statusCode = 400;
    throw error;
  }

  if (user) {
    user.name = name || user.name;
    user.email = email;
    user.role = 'worker';
    if (password) user.password = password;
    await user.save();
    return user;
  }

  if (!password) return null;

  if (password.length < 6) {
    const error = new Error('Password must be at least 6 characters');
    error.statusCode = 400;
    throw error;
  }

  return User.create({ name, email, password, role: 'worker' });
};

const createSyncedWorker = async (data) => {
  const payload = workerPayload(data);

  if (!payload.name) {
    const error = new Error('Worker name is required');
    error.statusCode = 400;
    throw error;
  }

  await assertWorkerEmailAvailable(payload.email);

  const user = await findOrCreateWorkerUser({
    name: payload.name,
    email: payload.email,
    password: data.password,
  });

  const worker = await Worker.create({
    ...payload,
    userAccount: user?._id || null,
  });

  return { worker, user: publicUser(user) };
};

const updateSyncedWorker = async (workerId, data) => {
  const worker = await Worker.findById(workerId);
  if (!worker) return null;

  const payload = workerPayload({ ...worker.toObject(), ...data });
  await assertWorkerEmailAvailable(payload.email, workerId);

  if (worker.userAccount && !payload.email) {
    await User.findOneAndDelete({ _id: worker.userAccount, role: 'worker' });
  }

  const user = await findOrCreateWorkerUser({
    name: payload.name,
    email: payload.email,
    password: data.password,
    existingUserId: worker.userAccount,
  });

  Object.assign(worker, payload, { userAccount: user?._id || null });
  await worker.save();

  return { worker, user: publicUser(user) };
};

const deleteSyncedWorker = async (workerId) => {
  const worker = await Worker.findByIdAndDelete(workerId);
  if (!worker) return null;

  if (worker.userAccount) {
    await User.findOneAndDelete({ _id: worker.userAccount, role: 'worker' });
  } else if (worker.email) {
    await User.findOneAndDelete({ email: worker.email, role: 'worker' });
  }

  return worker;
};

module.exports = {
  createSyncedWorker,
  deleteSyncedWorker,
  isValidEmail,
  normalizeEmail,
  publicUser,
  updateSyncedWorker,
};
