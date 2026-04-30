import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader } from 'lucide-react';
import { aiService } from '../services/services';

/**
 * Floating AI Chat Widget
 * Shows a floating button; expands to a chat panel on click
 */
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: '👋 Hi! I\'m your Jewellery Business Assistant. Ask me about pending orders, low stock, available workers, or anything about the business!',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    // Add user message
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Build conversation history for the API (exclude the welcome message)
      const history = messages
        .slice(1) // skip welcome bot message
        .map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.content }));

      const res = await aiService.chat({
        message: text,
        conversationHistory: history,
      });

      setMessages(prev => [...prev, { role: 'bot', content: res.data.message }]);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Sorry, something went wrong. Please try again.';
      setMessages(prev => [...prev, { role: 'bot', content: `❌ ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-widget">
      {/* Chat Panel */}
      {open && (
        <div className="chat-panel">
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 18px',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--accent-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(212,168,83,0.25)',
              }}>
                <Bot size={16} color="var(--accent)" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Business Assistant
                </div>
                <div style={{ fontSize: 11, color: 'var(--success)' }}>● Online</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', display: 'flex'
            }}>
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role}`}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: msg.role === 'bot' ? 'var(--bg-secondary)' : 'var(--accent-dim)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid var(--border)',
                }}>
                  {msg.role === 'bot'
                    ? <Bot size={13} color="var(--accent)" />
                    : <User size={13} color="var(--accent)" />
                  }
                </div>
                <div className="chat-bubble" style={{ whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="chat-msg bot">
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--bg-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid var(--border)', flexShrink: 0,
                }}>
                  <Bot size={13} color="var(--accent)" />
                </div>
                <div className="chat-bubble" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Loader size={13} color="var(--accent)" className="spinner" style={{ animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border)',
            display: 'flex', gap: 8, alignItems: 'center',
          }}>
            <input
              type="text"
              className="input-field"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about orders, stock, workers..."
              style={{ fontSize: 13, padding: '8px 12px' }}
            />
            <button
              className="btn-primary"
              style={{ padding: '8px 12px', flexShrink: 0 }}
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Trigger button */}
      <button className="chat-trigger" onClick={() => setOpen(prev => !prev)} title="AI Business Assistant">
        {open ? <X size={22} color="#000" /> : <MessageCircle size={22} color="#000" />}
      </button>
    </div>
  );
}
