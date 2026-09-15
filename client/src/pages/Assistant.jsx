import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowUpRight, Bot, Clock3, LoaderCircle, PackageSearch, Send, WandSparkles } from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';

const prompts = [
  'Bugungi ombor holatini ko‘rsat',
  'Qaysi mahsulotlar kam qolgan?',
  'Qaysi zayavkalarda kechikish xavfi bor?',
  'Transport kutayotgan buyurtmalarni ko‘rsat',
];

const bubbleMotion = {
  initial: { opacity: 0, y: 12, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -5, scale: 0.99 },
  transition: { duration: 0.22, ease: 'easeOut' },
};

export default function Assistant() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState('mock');
  const endRef = useRef(null);

  useEffect(() => {
    api.get('/ai/status').then((response) => setMode(response.data.data.mode)).catch(() => {});
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, busy]);

  const send = async (value) => {
    const question = (value || input).trim();
    if (!question || busy) return;
    setMessages((items) => [...items, { role: 'user', text: question }]);
    setInput('');
    setBusy(true);
    try {
      const response = await api.post('/ai/chat', { message: question }, { timeout: 30000 });
      setMessages((items) => [...items, { role: 'assistant', result: response.data.data }]);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-wrap ai-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow"><i className="live-dot" /> MAʼLUMOTGA ASOSLANGAN YORDAMCHI</span>
          <h1>AI Agent</h1>
          <p>Javoblar siz ko‘rishga ruxsatli bo‘lgan ombor yozuvlaridan tuziladi.</p>
        </div>
        <span className="mode-badge"><span className="live-dot" /> {mode.toUpperCase()} · DB ULANISHI</span>
      </div>

      <div className="ai-layout">
        <section className="panel ai-chat">
          <div className="chat-head">
            <div className="ai-avatar"><WandSparkles size={18} /></div>
            <div><b>SWC Assistant</b><small>Ombor tahlili · faqat o‘qish rejimi</small></div>
            <span className="online-pill">Ulangan</span>
          </div>

          <div className="chat-messages" aria-live="polite">
            {!messages.length && (
              <div className="ai-welcome">
                <div className="ai-orbit"><Bot size={27} /></div>
                <span className="eyebrow">OMBOR MAʼLUMOTLARI BILAN SAVOL-JAVOB</span>
                <h2>Bugun nimani<br />tekshiramiz?</h2>
                <p>Javoblar mavjud bazaga asoslanadi. Yetarli maʼlumot bo‘lmasa, buni ochiq aytaman.</p>
                <div className="prompt-grid">
                  {prompts.map((prompt) => (
                    <button key={prompt} onClick={() => send(prompt)}>{prompt}<ArrowUpRight size={14} /></button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((message, index) => (
                <motion.div key={`${message.role}-${index}`} className={`chat-message ${message.role}`} {...bubbleMotion}>
                  <i>{message.role === 'assistant' ? <WandSparkles size={15} /> : <span>U</span>}</i>
                  <div>
                    {message.role === 'user' ? <p>{message.text}</p> : (
                      <>
                        <b>{message.result.summary}</b>
                        {message.result.analysis && <p className="ai-analysis">{message.result.analysis}</p>}
                        <div className="ai-metrics">
                          {message.result.metrics.map((item, itemIndex) => (
                            <div key={itemIndex}><small>{item.label}</small><strong>{item.value}</strong></div>
                          ))}
                        </div>
                        {message.result.problems.length > 0 && (
                          <div className="ai-problems">
                            <b><AlertTriangle size={14} /> Aniqlangan holatlar</b>
                            {message.result.problems.slice(0, 5).map((problem, problemIndex) => <span key={problemIndex}>{problem}</span>)}
                          </div>
                        )}
                        <p className="recommendation"><PackageSearch size={15} />{message.result.recommendation}</p>
                        <small className="ai-time"><Clock3 size={12} /> {new Date(message.result.asOf).toLocaleString('uz-UZ')} · {message.result.mode}</small>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
              {busy && (
                <motion.div key="typing" className="chat-message assistant" {...bubbleMotion}>
                  <i><WandSparkles size={15} /></i>
                  <div className="typing-indicator" aria-label="Javob tayyorlanmoqda">
                    <span /><span /><span /><small>Javob tayyorlanmoqda</small>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={endRef} />
          </div>

          <form className="chat-compose" onSubmit={(event) => { event.preventDefault(); send(); }}>
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ombor yoki zayavkalar haqida so‘rang…" />
            <button className="button button-primary" disabled={busy || !input.trim()}><Send size={16} /><span>Yuborish</span></button>
            <small>AI hech qanday yozuvni sizning tasdig‘ingizsiz o‘zgartirmaydi.</small>
          </form>
        </section>

        <aside className="ai-aside">
          <section className="panel ai-side-card">
            <span className="eyebrow">NIMALARNI TAHLIL QILADI</span>
            {[
              ['Qoldiq va rezerv', 'availableQuantity hamda minimum'],
              ['Zayavka risklari', 'muddat va workflow holati'],
              ['Taʼminot ehtiyoji', 'ochiq shortage so‘rovlari'],
              ['Rol doirasi', 'faqat ruxsatli yozuvlar'],
            ].map(([title, detail], index) => (
              <div className="ai-capability" key={title}><i>0{index + 1}</i><span><b>{title}</b><small>{detail}</small></span></div>
            ))}
          </section>
          <section className="panel ai-limit"><b>Javob chegarasi</b><p>AI Agent faqat mavjud db.json yozuvlaridan hisoblaydi. Maxfiy token va parollar modelga yuborilmaydi.</p></section>
        </aside>
      </div>
    </div>
  );
}
