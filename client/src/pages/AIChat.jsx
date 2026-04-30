import { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import { aiService } from '../services/services';
import { Bot, Send, User, Loader } from 'lucide-react';

export default function AIChat() {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: 'Hi! Ask me about your assigned orders, workshop status, stock alerts, or production priorities.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages
        .slice(1)
        .map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.content }));

      const res = await aiService.chat({
        message: text,
        conversationHistory: history,
      });

      setMessages(prev => [...prev, { role: 'bot', content: res.data.message }]);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Sorry, something went wrong. Please try again.';
      setMessages(prev => [...prev, { role: 'bot', content: errMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Layout title="AI Chat">
      <div className="card" style={{ maxWidth: 760, margin: '0 auto', overflow: 'hidden' }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'var(--accent-dim)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(212,168,83,0.25)',
          }}>
            <Bot size={16} color="var(--accent)" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Business Assistant</div>
            <div style={{ fontSize: 11, color: 'var(--success)' }}>Online</div>
          </div>
        </div>

        <div style={{ minHeight: 420, maxHeight: 520, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {messages.map((msg, index) => (
            <div key={index} className={`chat-msg ${msg.role}`}>
              <div style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                flexShrink: 0,
                background: msg.role === 'bot' ? 'var(--bg-secondary)' : 'var(--accent-dim)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border)',
              }}>
                {msg.role === 'bot'
                  ? <Bot size={14} color="var(--accent)" />
                  : <User size={14} color="var(--accent)" />
                }
              </div>
              <div className="chat-bubble" style={{ whiteSpace: 'pre-wrap' }}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-msg bot">
              <div style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border)',
                flexShrink: 0,
              }}>
                <Bot size={14} color="var(--accent)" />
              </div>
              <div className="chat-bubble" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Loader size={13} color="var(--accent)" className="spinner" style={{ animation: 'spin 0.8s linear infinite' }} />
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
          <input
            type="text"
            className="input-field"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your work..."
          />
          <button className="btn-primary" onClick={sendMessage} disabled={loading || !input.trim()}>
            <Send size={15} />
          </button>
        </div>
      </div>
    </Layout>
  );
}
