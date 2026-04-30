const Worker = require('../models/Worker');
const {
  createSyncedWorker,
  deleteSyncedWorker,
  updateSyncedWorker,
} = require('../services/workerSyncService');

const emitRealtime = (req, event, payload) => {
  const io = req.app.get('io');
  if (io) io.emit(event, payload);
};

/**
 * @route   GET /api/workers
 * @access  Private
 */
const getWorkers = async (req, res, next) => {
  try {
    const { status, specialization } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (specialization) filter.specialization = specialization;

    const workers = await Worker.find(filter)
      .populate('assignedOrders', 'orderNumber title status dueDate')
      .sort({ name: 1 });

    res.json({ success: true, count: workers.length, workers });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/workers/:id
 * @access  Private
 */
const getWorker = async (req, res, next) => {
  try {
    const worker = await Worker.findById(req.params.id).populate(
      'assignedOrders',
      'orderNumber title status dueDate metalType'
    );

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    res.json({ success: true, worker });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/workers
 * @access  Private
 */
const createWorker = async (req, res, next) => {
  try {
    const { worker } = await createSyncedWorker(req.body);
    emitRealtime(req, 'worker:created', { workerId: worker._id, name: worker.name });
    res.status(201).json({ success: true, message: 'Worker added', worker });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/workers/:id
 * @access  Private
 */
const updateWorker = async (req, res, next) => {
  try {
    const result = await updateSyncedWorker(req.params.id, req.body);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    const { worker } = result;
    emitRealtime(req, 'worker:updated', { workerId: worker._id, name: worker.name });

    res.json({ success: true, message: 'Worker updated', worker });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/workers/:id
 * @access  Private (Admin)
 */
const deleteWorker = async (req, res, next) => {
  try {
    const worker = await deleteSyncedWorker(req.params.id);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }
    emitRealtime(req, 'worker:deleted', { workerId: worker._id, name: worker.name });
    res.json({ success: true, message: 'Worker removed' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/workers/stats
 * @access  Private
 */
const getWorkerStats = async (req, res, next) => {
  try {
    const all = await Worker.find();
    const available = all.filter((w) => w.status === 'Available').length;
    const busy = all.filter((w) => w.status === 'Busy').length;

    const bySpecialization = {};
    all.forEach((w) => {
      bySpecialization[w.specialization] = (bySpecialization[w.specialization] || 0) + 1;
    });

    res.json({
      success: true,
      total: all.length,
      available,
      busy,
      bySpecialization,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getWorkers, getWorker, createWorker, updateWorker, deleteWorker, getWorkerStats };
