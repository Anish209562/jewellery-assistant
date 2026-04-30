import { useState } from 'react';
import Layout from '../components/Layout';
import ChatWidget from '../components/ChatWidget';
import { aiService } from '../services/services';
import { Sparkles, RefreshCw, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const METAL_OPTIONS = ['Gold', 'Silver', 'Platinum', 'Rose Gold', 'White Gold'];
const STYLE_OPTIONS = ['Traditional', 'Contemporary', 'Fusion', 'Minimalist', 'Bridal', 'Casual'];
const OCCASION_OPTIONS = ['Wedding', 'Engagement', 'Festival', 'Casual Wear', 'Gift', 'Party'];

const EXAMPLE_PROMPTS = [
  'A delicate gold necklace with peacock motif for a bride',
  'Minimalist silver rings for everyday wear',
  'A traditional Kundan set with modern touches for a sangeet',
  'A lightweight mangalsutra with diamond accents',
];

export default function AIDesignAssistant() {
  const [form, setForm] = useState({
    prompt: '', metalType: '', style: '', occasion: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.prompt.trim()) return toast.error('Please enter a design prompt');
    setLoading(true);
    setResult('');
    try {
      const res = await aiService.generateDesign(form);
      setResult(res.data.ideas);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to generate design. Check your Groq API key.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const applyExample = (prompt) => {
    setForm(p => ({ ...p, prompt }));
  };

  return (
    <Layout title="AI Design Assistant">
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header banner */}
        <div style={{
          padding: '28px 32px',
          background: 'linear-gradient(135deg, rgba(212,168,83,0.12) 0%, rgba(212,168,83,0.03) 100%)',
          border: '1px solid rgba(212,168,83,0.2)',
          borderRadius: 16,
          marginBottom: 28,
          display: 'flex', alignItems: 'center', gap: 20,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '16px',
            background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Sparkles size={26} color="#000" />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              AI Jewellery Design Assistant
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Powered by Groq AI · Describe your idea and get detailed design concepts, techniques & cost estimates
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Input Panel */}
          <div>
            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Prompt */}
              <div className="card" style={{ padding: 20 }}>
                <label className="label" style={{ marginBottom: 10, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Design Prompt *
                </label>
                <textarea
                  className="input-field"
                  placeholder="Describe the jewellery piece you want to design..."
                  value={form.prompt}
                  onChange={e => setForm(p => ({ ...p, prompt: e.target.value }))}
                  rows={5}
                  style={{ resize: 'vertical' }}
                  required
                />

                {/* Example prompts */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Try an example:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {EXAMPLE_PROMPTS.map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => applyExample(p)}
                        style={{
                          textAlign: 'left', background: 'var(--bg-secondary)',
                          border: '1px solid var(--border)', borderRadius: 8,
                          padding: '8px 12px', cursor: 'pointer',
                          fontSize: 12, color: 'var(--text-secondary)',
                          transition: 'all 0.15s',
                        }}
                        onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                        onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Optional filters */}
              <div className="card" style={{ padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>
                  Refine (Optional)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label className="label">Metal Preference</label>
                    <select className="input-field" value={form.metalType} onChange={e => setForm(p => ({ ...p, metalType: e.target.value }))}>
                      <option value="">Any Metal</option>
                      {METAL_OPTIONS.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Style</label>
                    <select className="input-field" value={form.style} onChange={e => setForm(p => ({ ...p, style: e.target.value }))}>
                      <option value="">Any Style</option>
                      {STYLE_OPTIONS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Occasion</label>
                    <select className="input-field" value={form.occasion} onChange={e => setForm(p => ({ ...p, occasion: e.target.value }))}>
                      <option value="">Any Occasion</option>
                      {OCCASION_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ justifyContent: 'center', padding: '14px' }} disabled={loading}>
                {loading ? <span className="spinner" /> : <Sparkles size={16} />}
                {loading ? 'Generating...' : 'Generate Design Ideas'}
              </button>
            </form>
          </div>

          {/* Output Panel */}
          <div>
            <div className="card" style={{ padding: 20, minHeight: '500px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                  ✨ AI Design Ideas
                </div>
                {result && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={handleCopy}>
                      {copied ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={handleGenerate}>
                      <RefreshCw size={13} /> Regenerate
                    </button>
                  </div>
                )}
              </div>

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 350, gap: 16 }}>
                  <div className="spinner" style={{ width: 40, height: 40 }} />
                  <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Consulting the AI designer...</div>
                </div>
              ) : result ? (
                <div style={{
                  fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap',
                  background: 'var(--bg-secondary)',
                  borderRadius: 10, padding: 16,
                  border: '1px solid var(--border)',
                  maxHeight: 500, overflowY: 'auto',
                }}>
                  {result}
                </div>
              ) : (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  height: 350, color: 'var(--text-muted)', textAlign: 'center', gap: 12,
                }}>
                  <div style={{ fontSize: 48 }}>💎</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Design ideas will appear here
                  </div>
                  <div style={{ fontSize: 13 }}>Enter a prompt and click "Generate"</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ChatWidget />
    </Layout>
  );
}
