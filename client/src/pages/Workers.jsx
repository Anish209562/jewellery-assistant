import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import ChatWidget from '../components/ChatWidget';
import useRealtimeRefresh from '../hooks/useRealtimeRefresh';
import { workerService } from '../services/services';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const SPECIALIZATIONS = [
  'Gold Smith', 'Silver Smith', 'Stone Setting', 'Polishing',
  'Engraving', 'Casting', 'Wax Carving', 'Quality Control', 'General',
];
const STATUSES = ['Available', 'Busy', 'On Leave', 'Inactive'];

const emptyForm = {
  name: '', email: '', phone: '', specialization: 'Gold Smith',
  experience: '', status: 'Available', salary: '', notes: '',
};
const WORKER_EVENTS = ['worker:created', 'worker:updated', 'worker:deleted'];

const getStatusBadge = (s) => {
  const map = {
    Available: 'badge-available', Busy: 'badge-busy',
    'On Leave': 'badge-leave', Inactive: 'badge-inactive',
  };
  return `badge ${map[s] || ''}`;
};

export default function Workers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchWorkers = useCallback(async () => {
    try {
      const res = await workerService.getAll({ status: filterStatus || undefined });
      setWorkers(res.data.workers || []);
    } catch { toast.error('Failed to load workers'); }
    finally { setLoading(false); }
  }, [filterStatus]);

  useEffect(() => { fetchWorkers(); }, [fetchWorkers]);
  useRealtimeRefresh(WORKER_EVENTS, fetchWorkers);

  const openCreate = () => { setForm(emptyForm); setModal({ open: true, mode: 'create', data: null }); };
  const openEdit = (w) => {
    setForm({ ...w, salary: w.salary || '', experience: w.experience || '' });
    setModal({ open: true, mode: 'edit', data: w });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.mode === 'create') {
        await workerService.create(form);
        toast.success('Worker added');
      } else {
        await workerService.update(modal.data._id, form);
        toast.success('Worker updated');
      }
      setModal({ open: false, mode: 'create', data: null });
      fetchWorkers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this worker?')) return;
    try {
      await workerService.delete(id);
      toast.success('Worker removed');
      fetchWorkers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const filtered = workers.filter(w =>
    w.name?.toLowerCase().includes(search.toLowerCase()) ||
    w.specialization?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="Workers">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input-field" placeholder="Search workers..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36, width: 220 }} />
          </div>
          <select className="input-field" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 150 }}>
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <button className="btn-primary" onClick={openCreate}><Plus size={16} /> Add Worker</button>
      </div>

      {/* Worker Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', paddingTop: 60 }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 14 }}>
          No workers found.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map(worker => (
            <div key={worker._id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Avatar */}
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'var(--accent-dim)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 700, color: 'var(--accent)',
                    border: '1px solid rgba(212,168,83,0.25)',
                    flexShrink: 0,
                  }}>
                    {worker.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{worker.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{worker.specialization}</div>
                  </div>
                </div>
                <span className={getStatusBadge(worker.status)}>{worker.status}</span>
              </div>

              {/* Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                {[
                  ['📞 Phone', worker.phone],
                  ['⏱ Experience', `${worker.experience || 0} yrs`],
                  ['📋 Orders', `${worker.assignedOrders?.length || 0} active`],
                  ['🌟 Rating', worker.rating ? '★'.repeat(worker.rating) : '—'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '8px 12px' }} onClick={() => openEdit(worker)}>
                  <Edit2 size={13} /> Edit
                </button>
                <button className="btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleDelete(worker._id)}>
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, mode: 'create', data: null })} title={modal.mode === 'create' ? 'Add Worker' : 'Edit Worker'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-grid">
            <div>
              <label className="label">Full Name *</label>
              <input className="input-field" placeholder="Worker name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Phone *</label>
              <input className="input-field" placeholder="Phone number" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input-field" placeholder="Optional" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Specialization *</label>
              <select className="input-field" value={form.specialization} onChange={e => setForm(p => ({ ...p, specialization: e.target.value }))}>
                {SPECIALIZATIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Experience (years)</label>
              <input type="number" className="input-field" placeholder="0" value={form.experience} onChange={e => setForm(p => ({ ...p, experience: e.target.value }))} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input-field" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Monthly Salary (₹)</label>
              <input type="number" className="input-field" placeholder="0" value={form.salary} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input-field" placeholder="Additional notes..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={() => setModal({ open: false, mode: 'create', data: null })}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : null}
              {saving ? 'Saving...' : modal.mode === 'create' ? 'Add Worker' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      <ChatWidget />
    </Layout>
  );
}
