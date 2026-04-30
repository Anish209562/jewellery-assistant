import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Gem, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const nextErrors = {
      email: isValidEmail(form.email) ? '' : 'Please enter a valid email address',
      password: form.password.length >= 6 ? '' : 'Password must be at least 6 characters',
    };
    setErrors(nextErrors);
    return !nextErrors.email && !nextErrors.password;
  };

  const handleChange = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    setErrors(p => ({
      ...p,
      [field]: field === 'email'
        ? (isValidEmail(value) ? '' : p.email)
        : (value.length >= 6 ? '' : p.password),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success('Welcome back! ✨');
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: 16,
    }}>
      {/* Background decorations */}
      <div style={{
        position: 'fixed', top: '-30%', right: '-10%',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,168,83,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '16px',
            background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(212,168,83,0.3)',
          }}>
            <Gem size={26} color="#000" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
            Jewel Assistant
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: 14 }}>
            Sign in to your manufacturing dashboard
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 28 }}>
          <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                required
              />
              {errors.email ? (
                <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>
                  {errors.email}
                </p>
              ) : null}
            </div>

            <div>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Your password"
                  value={form.password}
                  onChange={e => handleChange('password', e.target.value)}
                  required
                  minLength={6}
                  style={{ paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(p => !p)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', display: 'flex',
                  }}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password ? (
                <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>
                  {errors.password}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
