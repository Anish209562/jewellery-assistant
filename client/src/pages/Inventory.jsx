import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import ChatWidget from '../components/ChatWidget';
import useRealtimeRefresh from '../hooks/useRealtimeRefresh';
import { inventoryService } from '../services/services';
import { Plus, Search, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['Metal', 'Gemstone', 'Tool', 'Packaging', 'Chemical', 'Other'];
const UNITS = ['grams', 'kilograms', 'pieces', 'carats', 'milliliters', 'liters'];

const emptyForm = {
  name: '', category: 'Metal', sku: '', quantity: '',
  unit: 'grams', minStockLevel: 10, pricePerUnit: '',
  supplier: '', location: '', description: '',
};
const INVENTORY_EVENTS = ['inventory:created', 'inventory:updated', 'inventory:deleted'];

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showLow, setShowLow] = useState(false);
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const res = await inventoryService.getAll({
        category: filterCategory || undefined,
        lowStock: showLow ? 'true' : undefined,
      });
      setItems(res.data.items || []);
    } catch { toast.error('Failed to load inventory'); }
    finally { setLoading(false); }
  }, [filterCategory, showLow]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useRealtimeRefresh(INVENTORY_EVENTS, fetchItems);

  const openCreate = () => { setForm(emptyForm); setModal({ open: true, mode: 'create', data: null }); };
  const openEdit = (item) => {
    setForm({ ...item, sku: item.sku || '', pricePerUnit: item.pricePerUnit || '' });
    setModal({ open: true, mode: 'edit', data: item });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.mode === 'create') {
        await inventoryService.create(form);
        toast.success('Item added to inventory');
      } else {
        await inventoryService.update(modal.data._id, form);
        toast.success('Inventory updated');
      }
      setModal({ open: false, mode: 'create', data: null });
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    try {
      await inventoryService.delete(id);
      toast.success('Item deleted');
      fetchItems();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  const filtered = items.filter(i =>
    i.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.supplier?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="Inventory">
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input-field" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36, width: 220 }} />
          </div>
          <select className="input-field" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ width: 140 }}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: showLow ? 'var(--warning)' : 'var(--text-secondary)' }}>
            <input type="checkbox" checked={showLow} onChange={e => setShowLow(e.target.checked)} style={{ accentColor: 'var(--warning)' }} />
            <AlertTriangle size={13} />
            Low Stock Only
          </label>
        </div>
        <button className="btn-primary" onClick={openCreate}><Plus size={16} /> Add Item</button>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 14 }}>
            No items found.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th><th>Category</th><th>Quantity</th><th>Unit</th>
                <th>Min Stock</th><th>Price/Unit</th><th>Supplier</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const isLow = item.quantity <= item.minStockLevel;
                return (
                  <tr key={item._id}>
                    <td style={{ fontWeight: 500 }}>{item.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{item.category}</td>
                    <td style={{ color: isLow ? 'var(--warning)' : 'var(--text-primary)', fontWeight: isLow ? 600 : 400 }}>
                      {item.quantity}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{item.unit}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{item.minStockLevel}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {item.pricePerUnit ? `₹${item.pricePerUnit}` : '—'}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{item.supplier || '—'}</td>
                    <td>
                      <span className={`badge ${isLow ? 'badge-pending' : 'badge-completed'}`}>
                        {isLow ? '⚠ Low' : '✓ OK'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openEdit(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}>
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => handleDelete(item._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 4 }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, mode: 'create', data: null })}
        title={modal.mode === 'create' ? 'Add Inventory Item' : 'Edit Item'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-grid">
            <div>
              <label className="label">Item Name *</label>
              <input className="input-field" placeholder="e.g. 22K Gold" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Category *</label>
              <select className="input-field" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Quantity *</label>
              <input type="number" className="input-field" placeholder="0" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Unit *</label>
              <select className="input-field" value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}>
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Min Stock Level</label>
              <input type="number" className="input-field" placeholder="10" value={form.minStockLevel} onChange={e => setForm(p => ({ ...p, minStockLevel: e.target.value }))} />
            </div>
            <div>
              <label className="label">Price Per Unit (₹)</label>
              <input type="number" className="input-field" placeholder="0" value={form.pricePerUnit} onChange={e => setForm(p => ({ ...p, pricePerUnit: e.target.value }))} />
            </div>
            <div>
              <label className="label">Supplier</label>
              <input className="input-field" placeholder="Supplier name" value={form.supplier} onChange={e => setForm(p => ({ ...p, supplier: e.target.value }))} />
            </div>
            <div>
              <label className="label">Storage Location</label>
              <input className="input-field" placeholder="Rack A, Drawer 2..." value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input-field" placeholder="Additional details..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={() => setModal({ open: false, mode: 'create', data: null })}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : null}
              {saving ? 'Saving...' : modal.mode === 'create' ? 'Add Item' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      <ChatWidget />
    </Layout>
  );
}
