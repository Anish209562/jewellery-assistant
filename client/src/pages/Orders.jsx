import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import ChatWidget from '../components/ChatWidget';
import useRealtimeRefresh from '../hooks/useRealtimeRefresh';
import { useAuth } from '../context/AuthContext';
import { orderService, workerService } from '../services/services';
import { Plus, Search, Edit2, Trash2, Eye, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Quality Check', 'Completed', 'Cancelled'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];
const METAL_OPTIONS = ['Gold', 'Silver', 'Platinum', 'Rose Gold', 'White Gold', 'Other'];

const emptyForm = {
  title: '', customerName: '', customerPhone: '',
  metalType: 'Gold', metalWeight: '', description: '',
  status: 'Pending', priority: 'Medium',
  dueDate: '', estimatedCost: '', assignedWorker: '', notes: '',
  images: [],
};
const ORDER_EVENTS = ['order:created', 'order:updated', 'order:deleted'];
const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api').replace(/\/api\/?$/, '');

const getBadge = (status) => {
  const map = {
    'Pending': 'badge-pending', 'In Progress': 'badge-progress',
    'Quality Check': 'badge-quality', 'Completed': 'badge-completed',
    'Cancelled': 'badge-cancelled',
  };
  return `badge ${map[status] || ''}`;
};

const getPriorityBadge = (p) => {
  const map = { Low: 'badge-low', Medium: 'badge-medium', High: 'badge-high', Urgent: 'badge-urgent' };
  return `badge ${map[p] || ''}`;
};

export default function Orders({ mode = 'admin' }) {
  const { isAdmin } = useAuth();
  const isWorkerMode = mode === 'worker' || !isAdmin;
  const canManageOrders = mode === 'admin' && isAdmin;
  const [orders, setOrders] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      const params = { status: filterStatus || undefined };
      const res = isWorkerMode
        ? await orderService.getMyOrders(params)
        : await orderService.getAll(params);
      setOrders(res.data.orders || []);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, [filterStatus, isWorkerMode]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useRealtimeRefresh(ORDER_EVENTS, fetchOrders);

  useEffect(() => {
    if (!canManageOrders) return;
    workerService.getAll({ status: 'Available' })
      .then(r => setWorkers(r.data.workers || []))
      .catch(() => {});
  }, [canManageOrders]);

  const openCreate = () => {
    setForm(emptyForm);
    setModal({ open: true, mode: 'create', data: null });
  };

  const openEdit = (order) => {
    setForm({
      title: order.title, customerName: order.customerName,
      customerPhone: order.customerPhone || '',
      metalType: order.metalType, metalWeight: order.metalWeight,
      description: order.description || '',
      status: order.status, priority: order.priority,
      dueDate: order.dueDate?.split('T')[0] || '',
      estimatedCost: order.estimatedCost || '',
      assignedWorker: order.assignedWorker?._id || order.assignedWorker || '',
      notes: order.notes || '',
      images: [],
    });
    setModal({ open: true, mode: 'edit', data: order });
  };

  const openStatusUpdate = (order) => {
    setForm({
      ...emptyForm,
      status: order.status,
      notes: order.notes || '',
    });
    setModal({ open: true, mode: 'status', data: order });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.mode === 'create') {
        await orderService.create(form);
        toast.success('Order created');
      } else {
        await orderService.update(modal.data._id, form);
        toast.success('Order updated');
      }
      setModal({ open: false, mode: 'create', data: null });
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save order');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this order?')) return;
    try {
      await orderService.delete(id);
      toast.success('Order deleted');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleStatusSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await orderService.update(modal.data._id, {
        status: form.status,
      });
      toast.success('Order status updated');
      setModal({ open: false, mode: 'create', data: null });
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally { setSaving(false); }
  };

  const filtered = orders.filter(o =>
    o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
    o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    o.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title={isWorkerMode ? 'My Orders' : 'Orders'}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search orders..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 36, width: 240 }}
            />
          </div>
          {/* Status filter */}
          <select
            className="input-field"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ width: 160 }}
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {canManageOrders && (
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> New Order
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 14 }}>
            No orders found. {!search && canManageOrders && <span style={{ cursor: 'pointer', color: 'var(--accent)' }} onClick={openCreate}>Create one →</span>}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th><th>Title</th><th>Customer</th><th>Metal</th>
                <th>Status</th><th>Priority</th><th>Due Date</th><th>Worker</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <tr key={order._id}>
                  <td style={{ color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>{order.orderNumber}</td>
                  <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.title}</td>
                  <td>{order.customerName}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{order.metalType}</td>
                  <td><span className={getBadge(order.status)}>{order.status}</span></td>
                  <td><span className={getPriorityBadge(order.priority)}>{order.priority}</span></td>
                  <td style={{ color: order.dueDate && new Date(order.dueDate) < new Date() && order.status !== 'Completed' ? 'var(--danger)' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {order.dueDate ? new Date(order.dueDate).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{order.assignedWorker?.name || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button title="View" onClick={() => setViewOrder(order)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                        <Eye size={15} />
                      </button>
                      {canManageOrders && (
                        <>
                          <button title="Edit" onClick={() => openEdit(order)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}>
                            <Edit2 size={15} />
                          </button>
                          <button title="Delete" onClick={() => handleDelete(order._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 4 }}>
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                      {isWorkerMode && (
                        <button title="Update Status" onClick={() => openStatusUpdate(order)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}>
                          <RefreshCw size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modal.open && modal.mode !== 'status'}
        onClose={() => setModal({ open: false, mode: 'create', data: null })}
        title={modal.mode === 'create' ? 'New Order' : 'Edit Order'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-grid">
            <div>
              <label className="label">Order Title *</label>
              <input className="input-field" placeholder="e.g. Gold Necklace" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Customer Name *</label>
              <input className="input-field" placeholder="Customer name" value={form.customerName} onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Customer Phone</label>
              <input className="input-field" placeholder="Phone number" value={form.customerPhone} onChange={e => setForm(p => ({ ...p, customerPhone: e.target.value }))} />
            </div>
            <div>
              <label className="label">Metal Type *</label>
              <select className="input-field" value={form.metalType} onChange={e => setForm(p => ({ ...p, metalType: e.target.value }))}>
                {METAL_OPTIONS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Metal Weight (g) *</label>
              <input type="number" className="input-field" placeholder="Weight in grams" value={form.metalWeight} onChange={e => setForm(p => ({ ...p, metalWeight: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Due Date *</label>
              <input type="date" className="input-field" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input-field" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input-field" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                {PRIORITY_OPTIONS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Estimated Cost (₹)</label>
              <input type="number" className="input-field" placeholder="0" value={form.estimatedCost} onChange={e => setForm(p => ({ ...p, estimatedCost: e.target.value }))} />
            </div>
            <div>
              <label className="label">Assign Worker</label>
              <select className="input-field" value={form.assignedWorker} onChange={e => setForm(p => ({ ...p, assignedWorker: e.target.value }))}>
                <option value="">Unassigned</option>
                {workers.map(w => <option key={w._id} value={w._id}>{w.name} ({w.specialization})</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input-field" placeholder="Design details..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input-field" placeholder="Internal notes..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
          </div>
          <div>
            <label className="label">Order Images</label>
            <input
              type="file"
              className="input-field"
              accept="image/*"
              multiple
              onChange={e => setForm(p => ({ ...p, images: Array.from(e.target.files || []) }))}
            />
            {form.images.length > 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                {form.images.length} image{form.images.length > 1 ? 's' : ''} selected
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={() => setModal({ open: false, mode: 'create', data: null })}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : null}
              {saving ? 'Saving...' : modal.mode === 'create' ? 'Create Order' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={modal.open && modal.mode === 'status'}
        onClose={() => setModal({ open: false, mode: 'create', data: null })}
        title="Update Order Status"
        maxWidth="420px"
      >
        <form onSubmit={handleStatusSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="label">Status</label>
            <select className="input-field" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={() => setModal({ open: false, mode: 'create', data: null })}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : null}
              {saving ? 'Saving...' : 'Update Status'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Order Modal */}
      <Modal isOpen={!!viewOrder} onClose={() => setViewOrder(null)} title={viewOrder?.orderNumber || 'Order Details'}>
        {viewOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-grid">
              {[
                ['Title', viewOrder.title], ['Customer', viewOrder.customerName],
                ['Phone', viewOrder.customerPhone || '—'], ['Metal', viewOrder.metalType],
                ['Weight', `${viewOrder.metalWeight}g`], ['Status', viewOrder.status],
                ['Priority', viewOrder.priority], ['Due Date', new Date(viewOrder.dueDate).toLocaleDateString('en-IN')],
                ['Est. Cost', viewOrder.estimatedCost ? `₹${viewOrder.estimatedCost}` : '—'],
                ['Worker', viewOrder.assignedWorker?.name || 'Unassigned'],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{k}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>
            {viewOrder.description && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Description</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{viewOrder.description}</div>
              </div>
            )}
            {viewOrder.notes && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Notes</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{viewOrder.notes}</div>
              </div>
            )}
            {viewOrder.attachments?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Images</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {viewOrder.attachments.map((src, index) => (
                    <a
                      key={src}
                      href={`${API_ORIGIN}${src}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary"
                      style={{ padding: '6px 10px', fontSize: 12 }}
                    >
                      Image {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ChatWidget />
    </Layout>
  );
}
