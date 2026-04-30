const Order = require('../models/Order');
const Worker = require('../models/Worker');

const ORDER_STATUSES = ['Pending', 'In Progress', 'Quality Check', 'Completed', 'Cancelled'];
const WORKER_EDITABLE_FIELDS = ['status'];

const emitRealtime = (req, event, payload) => {
  const io = req.app.get('io');
  if (io) io.emit(event, payload);
};

const uploadedPaths = (files = []) => files.map((file) => `/uploads/orders/${file.filename}`);

const normalizeOrderPayload = (body, files = []) => {
  const payload = { ...body };

  delete payload.createdBy;
  delete payload.orderNumber;
  delete payload._id;

  if (payload.assignedWorker === '' || payload.assignedWorker === 'null' || payload.assignedWorker === 'undefined') {
    payload.assignedWorker = null;
  }

  ['metalWeight', 'estimatedCost', 'finalCost'].forEach((field) => {
    if (payload[field] === '') {
      delete payload[field];
    } else if (payload[field] !== undefined) {
      payload[field] = Number(payload[field]);
    }
  });

  if (payload.dueDate === '') {
    delete payload.dueDate;
  }

  const newAttachments = uploadedPaths(files);
  if (newAttachments.length) {
    payload.attachments = newAttachments;
  } else {
    delete payload.attachments;
  }

  return payload;
};

const getLoggedInWorkerIds = async (user) => {
  const workerIds = [user._id];
  const email = user.email?.toLowerCase();

  const worker = await Worker.findOne({
    $or: [
      ...(email ? [{ email }] : []),
      ...(user.name ? [{ name: user.name }] : []),
    ],
  }).select('_id');

  if (worker) {
    workerIds.push(worker._id);
  }

  return workerIds;
};

const orderBelongsToUser = async (order, user) => {
  if (!order?.assignedWorker) return false;
  const workerIds = await getLoggedInWorkerIds(user);
  return workerIds.some((id) => id.toString() === order.assignedWorker.toString());
};

/**
 * @route   GET /api/orders
 * @desc    Get all orders (with optional filters)
 * @access  Private
 */
const getOrders = async (req, res, next) => {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query;
    const filter = {};
    const safeLimit = Math.min(Number(limit) || 20, 100);
    const safePage = Math.max(Number(page) || 1, 1);

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const skip = (safePage - 1) * safeLimit;
    const orders = await Order.find(filter)
      .populate('assignedWorker', 'name specialization status')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit);

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      count: orders.length,
      total,
      page: safePage,
      pages: Math.ceil(total / safeLimit),
      orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/orders/my-orders
 * @desc    Get orders assigned to logged-in worker
 * @access  Private (Worker)
 */
const getMyOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const safeLimit = Math.min(Number(limit) || 20, 100);
    const safePage = Math.max(Number(page) || 1, 1);
    const workerIds = await getLoggedInWorkerIds(req.user);

    const filter = { assignedWorker: { $in: workerIds } };
    if (status) filter.status = status;

    const skip = (safePage - 1) * safeLimit;
    const orders = await Order.find(filter)
      .populate('assignedWorker', 'name specialization status')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(safeLimit);

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      count: orders.length,
      total,
      page: safePage,
      pages: Math.ceil(total / safeLimit),
      orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/orders/:id
 * @desc    Get single order
 * @access  Private
 */
const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('assignedWorker', 'name specialization status phone')
      .populate('createdBy', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (req.user.role !== 'admin' && !(await orderBelongsToUser(order, req.user))) {
      return res.status(403).json({ success: false, message: 'You can access only your assigned orders' });
    }

    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/orders
 * @desc    Create new order
 * @access  Private
 */
const createOrder = async (req, res, next) => {
  try {
    const payload = normalizeOrderPayload(req.body, req.files);
    const order = await Order.create({ ...payload, createdBy: req.user._id });

    emitRealtime(req, 'order:created', { orderId: order._id, orderNumber: order.orderNumber });

    res.status(201).json({ success: true, message: 'Order created', order });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/orders/:id
 * @desc    Update order
 * @access  Private
 */
const updateOrder = async (req, res, next) => {
  try {
    let payload = normalizeOrderPayload(req.body, req.files);

    if (req.user.role !== 'admin') {
      const blockedFields = Object.keys(payload).filter((field) => !WORKER_EDITABLE_FIELDS.includes(field));
      if (blockedFields.length > 0) {
        return res.status(403).json({
          success: false,
          message: 'Workers can update only order status',
        });
      }
    }

    if (payload.status && !ORDER_STATUSES.includes(payload.status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status' });
    }

    // If marking as completed, set completedDate
    if (payload.status === 'Completed') {
      payload.completedDate = new Date();
    } else if (payload.status && payload.status !== 'Completed') {
      payload.completedDate = null;
    }

    const existing = await Order.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (req.user.role !== 'admin' && !(await orderBelongsToUser(existing, req.user))) {
      return res.status(403).json({ success: false, message: 'You can update only your assigned orders' });
    }

    if (payload.attachments?.length) {
      payload.attachments = [...(existing.attachments || []), ...payload.attachments];
    }

    const order = await Order.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    }).populate('assignedWorker', 'name specialization');

    emitRealtime(req, 'order:updated', { orderId: order._id, orderNumber: order.orderNumber });

    res.json({ success: true, message: 'Order updated', order });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/orders/:id
 * @desc    Delete order
 * @access  Private (Admin only)
 */
const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    emitRealtime(req, 'order:deleted', { orderId: order._id, orderNumber: order.orderNumber });

    res.json({ success: true, message: 'Order deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/orders/stats
 * @desc    Get order statistics for dashboard
 * @access  Private
 */
const getOrderStats = async (req, res, next) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$estimatedCost' },
        },
      },
    ]);

    const total = await Order.countDocuments();
    const overdue = await Order.countDocuments({
      dueDate: { $lt: new Date() },
      status: { $nin: ['Completed', 'Cancelled'] },
    });

    res.json({ success: true, stats, total, overdue });
  } catch (error) {
    next(error);
  }
};

module.exports = { getOrders, getMyOrders, getOrder, createOrder, updateOrder, deleteOrder, getOrderStats };
