import { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { workerService } from '../services/services';
import { Plus, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const emptyForm = { name: '', email: '', password: '' };
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export default function AdminPanel() {
  const [workers, setWorkers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchWorkers = useCallback(async () => {
    try {
      const res = await workerService.getAll();
      setWorkers(res.data.workers || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load worker accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWorkers(); }, [fetchWorkers]);

  const validate = () => {
    const nextErrors = {
      name: form.name.trim() ? '' : 'Name is required',
      email: isValidEmail(form.email) ? '' : 'Please enter a valid email address',
      password: form.password.length >= 6 ? '' : 'Password must be at least 6 characters',
    };
    setErrors(nextErrors);
    return !nextErrors.name && !nextErrors.email && !nextErrors.password;
  };

  const handleChange = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    setErrors(p => ({
      ...p,
      [field]: field === 'email'
        ? (isValidEmail(value) ? '' : p.email)
        : field === 'password'
          ? (value.length >= 6 ? '' : p.password)
          : (value.trim() ? '' : p.name),
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      await workerService.create(form);
      toast.success('Worker account created');
      setForm(emptyForm);
      fetchWorkers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create worker account');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this worker account?')) return;

    try {
      await workerService.delete(id);
      toast.success('Worker account deleted');
      fetchWorkers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete worker account');
    }
  };

  return (
    <Layout title="Admin Panel">
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 380px) 1fr', gap: 20, alignItems: 'start' }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Plus size={18} color="var(--accent)" />
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Create Worker Account
            </h3>
          </div>

          <form noValidate onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="label">Full Name *</label>
              <input
                className="input-field"
                placeholder="Worker name"
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                required
              />
              {errors.name ? <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>{errors.name}</p> : null}
            </div>

            <div>
              <label className="label">Email Address *</label>
              <input
                type="email"
                className="input-field"
                placeholder="worker@example.com"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                required
              />
              {errors.email ? <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>{errors.email}</p> : null}
            </div>

            <div>
              <label className="label">Password *</label>
              <input
                type="password"
                className="input-field"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={e => handleChange('password', e.target.value)}
                minLength={6}
                required
              />
              {errors.password ? <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>{errors.password}</p> : null}
            </div>

            <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }} disabled={saving}>
              {saving ? <span className="spinner" /> : null}
              {saving ? 'Creating...' : 'Create Worker'}
            </button>
          </form>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <Users size={18} color="var(--accent)" />
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Worker Accounts
            </h3>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>
          ) : workers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>
              No worker accounts found.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th style={{ width: 90 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map(worker => (
                    <tr key={worker._id}>
                      <td>{worker.name}</td>
                      <td>{worker.email}</td>
                      <td><span className="badge badge-available">{worker.role || 'worker'}</span></td>
                      <td>{worker.createdAt ? new Date(worker.createdAt).toLocaleDateString() : '-'}</td>
                      <td>
                        <button className="btn-danger" onClick={() => handleDelete(worker._id)} style={{ padding: '7px 10px' }}>
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
