import { useState, useRef, useEffect } from 'react';

const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FF8B94', '#B5EAD7', '#FFDAC1', '#C7CEEA'];

const AGE_PROFILES = {
  young: { label: '5 – 7 years', emoji: '🐣', desc: 'Use very simple words a kindergartner knows. Maximum 3 options. Short sentences. Lots of warmth and excitement.' },
  middle: { label: '8 – 10 years', emoji: '🌟', desc: 'Clear words a 3rd-grader knows. 3–4 options. Slightly more detail is fine.' },
  older: { label: '11 – 13 years', emoji: '🚀', desc: 'More nuanced language. 4 options. Can mention concepts like documentary, podcast, or encyclopedia.' },
};

function buildSystemPrompt(ageKey) {
  const p = AGE_PROFILES[ageKey];
  return `You are a warm, playful learning guide for children, like a loving aunt or older sibling who teaches kids HOW to find answers rather than giving them answers directly.

TARGET AGE: ${p.label}. ${p.desc}

When a child says they are curious about something, never explain it. Instead, ask WHERE they could look to find out more and give clickable options. Keep guiding them deeper with every choice they make.

SAFETY — NEVER BREAK:
- Never suggest the child go somewhere alone or approach any stranger or professional.
- All options must be safe things a child can do at home or school WITH a parent, guardian, or teacher.
- If suggesting asking someone, always say "Ask a parent or teacher" — never a stranger.

FORMAT:
- Respond in raw JSON ONLY. No markdown, no backticks, no preamble.
- Guide message: 1–2 short sentences, ends with a guiding question.
- Exactly ${ageKey === 'young' ? '3' : '4'} options. Safe sources: YouTube with a parent, library books, National Geographic Kids, kids encyclopedias, asking a parent or teacher, educational documentaries with a parent.
- Options feel like little adventures.

{"message":"Ooh, cars! Where do you think we could learn more about them?","options":["Watch a YouTube video with a parent 🎬","Find a library book 📚","Ask a parent or teacher 🙋","Check National Geographic Kids 🌍"]}

Always build on the path the child has taken so far.`;
}

function parseAssistantPayload(text) {
  const cleaned = text.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return { message: 'Hmm, I got a muddled reply. Try again!', options: [] };
  }
}

async function askClaude(history, ageKey) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    const err = new Error('NO_API_KEY');
    throw err;
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: buildSystemPrompt(ageKey),
      messages: history,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    const detail = data.error?.message || res.statusText || 'Request failed';
    throw new Error(detail);
  }
  const text = data.content?.find((b) => b.type === 'text')?.text || '';
  return parseAssistantPayload(text);
}

function loadJournal() {
  try {
    return JSON.parse(localStorage.getItem('ck_journal') || '[]');
  } catch {
    return [];
  }
}
function saveJournal(entries) {
  try {
    localStorage.setItem('ck_journal', JSON.stringify(entries));
  } catch { /* ignore */ }
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&family=Fredoka+One&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
.opt-btn{
  background:white;border:3px solid transparent;border-radius:20px;padding:13px 20px;
  font-size:1rem;font-family:'Nunito',cursive;font-weight:700;cursor:pointer;
  transition:all .18s;box-shadow:0 4px 12px rgba(0,0,0,.08);text-align:left;width:100%;color:#333;
}
.opt-btn:hover{transform:translateY(-3px) scale(1.02);box-shadow:0 8px 20px rgba(0,0,0,.13);}
.opt-btn:active{transform:scale(.97);}
.pri-btn{
  background:linear-gradient(135deg,#FF6B6B,#FF8B94);color:white;border:none;border-radius:50px;
  padding:14px 32px;font-size:1.1rem;font-family:'Fredoka One',cursive;cursor:pointer;
  box-shadow:0 6px 20px rgba(255,107,107,.4);transition:all .2s;letter-spacing:.5px;
}
.pri-btn:hover{transform:translateY(-3px);box-shadow:0 10px 28px rgba(255,107,107,.5);}
.pri-btn:disabled{opacity:.4;cursor:not-allowed;transform:none;}
.ghost-btn{
  background:transparent;border:2px solid #ddd;border-radius:50px;padding:7px 18px;
  font-size:.88rem;font-family:'Nunito',cursive;cursor:pointer;color:#888;transition:all .2s;
}
.ghost-btn:hover{border-color:#FF6B6B;color:#FF6B6B;}
.chip{display:inline-flex;align-items:center;border-radius:50px;padding:4px 13px;font-size:.78rem;font-weight:800;color:#333;white-space:nowrap;}
.fade-in{animation:fadeIn .35s ease forwards;}
@keyframes fadeIn{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
@keyframes spin{to{transform:rotate(360deg);}}
.spin{animation:spin 1s linear infinite;display:inline-block;}
.topic-in{border:none;background:transparent;font-size:1.15rem;font-family:'Nunito',cursive;font-weight:700;color:#333;outline:none;flex:1;min-width:120px;}
.topic-in::placeholder{color:#ccc;}
.tab-btn{padding:8px 18px;border-radius:50px;font-family:'Nunito',cursive;font-weight:800;font-size:.85rem;cursor:pointer;border:2px solid transparent;transition:all .18s;}
.tab-btn.on{background:#FF6B6B;color:white;box-shadow:0 4px 12px rgba(255,107,107,.35);}
.tab-btn.off{background:white;color:#aaa;border-color:#eee;}
.tab-btn.off:hover{border-color:#FF6B6B;color:#FF6B6B;}
.age-card{border:3px solid #eee;border-radius:20px;padding:16px 12px;cursor:pointer;background:white;transition:all .18s;font-family:'Nunito',cursive;text-align:center;}
.age-card:hover{transform:translateY(-3px);box-shadow:0 8px 20px rgba(0,0,0,.1);}
.age-card.sel{border-color:#FF6B6B;background:#FFF5F5;box-shadow:0 4px 16px rgba(255,107,107,.2);}
.jcard{background:white;border-radius:20px;padding:18px 20px;box-shadow:0 4px 16px rgba(0,0,0,.07);border:2px solid #FFF0E6;margin-bottom:12px;}
.tree-wrap{border-left:3px solid #FFD6D6;margin-left:8px;padding-left:12px;margin-top:6px;}
.back-site{display:block;text-align:center;margin:12px 0 0;font-size:.9rem;font-family:'Nunito',cursive;font-weight:700;}
.back-site a{color:white;text-underline-offset:3px;}
`;

function TreeNode({ node, depth = 0 }) {
  const col = COLORS[depth % COLORS.length];
  return (
    <div style={{ marginTop: depth === 0 ? 0 : 6 }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: `${col}30`,
          border: `2px solid ${col}`,
          borderRadius: 50,
          padding: '4px 13px',
          fontSize: '.82rem',
          fontWeight: 800,
          color: '#333',
        }}
      >
        {depth === 0 ? '🌱' : '→'} {node.label}
      </span>
      {node.children?.length > 0 && (
        <div className="tree-wrap">
          {node.children.map((c, i) => (
            <TreeNode key={i} node={c} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function failMessage(err) {
  if (err?.message === 'NO_API_KEY') {
    return {
      message:
        'To run this app, add VITE_ANTHROPIC_API_KEY to iamcurious/.env, then run npm run build (see iamcurious/package.json).',
      options: [],
    };
  }
  return { message: 'Oops! Something went wrong.', options: [] };
}

export default function CuriousKid() {
  const [screen, setScreen] = useState('setup');
  const [age, setAge] = useState('middle');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [path, setPath] = useState([]);
  const [tree, setTree] = useState(null);
  const [treePtr, setTreePtr] = useState(null);
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [journal, setJournal] = useState(loadJournal);
  const [pinSet, setPinSet] = useState('1234');
  const [pinIn, setPinIn] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [pinErr, setPinErr] = useState(false);
  const [newPin, setNewPin] = useState('');
  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [current, loading]);

  const startExploration = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    const root = { label: topic, children: [] };
    setTree(root);
    setTreePtr(root);
    setPath([topic]);
    const h = [{ role: 'user', content: `I am curious about ${topic}` }];
    setHistory(h);
    try {
      const r = await askClaude(h, age);
      setCurrent(r);
      setHistory([...h, { role: 'assistant', content: JSON.stringify(r) }]);
    } catch (e) {
      setCurrent(failMessage(e));
    }
    setLoading(false);
    setScreen('explore');
  };

  const pickOption = async (opt) => {
    setLoading(true);
    const label = opt.replace(/\p{Emoji}/gu, '').trim();
    const newNode = { label, children: [] };
    treePtr.children.push(newNode);
    setTreePtr(newNode);
    setPath((p) => [...p, label]);
    const h = [...history, { role: 'user', content: opt }];
    setHistory(h);
    setCurrent(null);
    try {
      const r = await askClaude(h, age);
      setCurrent(r);
      setHistory([...h, { role: 'assistant', content: JSON.stringify(r) }]);
    } catch (e) {
      setCurrent(failMessage(e));
    }
    setLoading(false);
  };

  const doSave = () => {
    if (!tree || path.length < 2) return;
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      topic,
      age: AGE_PROFILES[age].label,
      path: [...path],
      tree: JSON.parse(JSON.stringify(tree)),
    };
    const u = [entry, ...journal];
    setJournal(u);
    saveJournal(u);
  };

  const delEntry = (id) => {
    const u = journal.filter((e) => e.id !== id);
    setJournal(u);
    saveJournal(u);
  };

  const reset = () => {
    setTopic('');
    setPath([]);
    setTree(null);
    setTreePtr(null);
    setCurrent(null);
    setHistory([]);
    setScreen('setup');
  };

  const tryUnlock = () => {
    if (pinIn === pinSet) {
      setUnlocked(true);
      setPinErr(false);
      setPinIn('');
    } else {
      setPinErr(true);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#FFF9F0,#FFF0E6 50%,#F0F8FF)', fontFamily: "'Nunito',cursive" }}>
      <style>{CSS}</style>

      <div style={{ background: 'linear-gradient(135deg,#FF6B6B,#FF8B94)', padding: '22px 20px 18px', textAlign: 'center', boxShadow: '0 4px 20px rgba(255,107,107,.25)' }}>
        <div style={{ fontSize: '2rem', marginBottom: 2 }}>🔍</div>
        <h1
          style={{
            fontFamily: "'Fredoka One',cursive",
            fontSize: 'clamp(1.6rem,5vw,2.2rem)',
            color: 'white',
            letterSpacing: 1,
            textShadow: '0 2px 8px rgba(0,0,0,.15)',
          }}
        >
          Curious Kid!
        </h1>
        <p className="back-site">
          <a href="../natapps.html">← Back to Natapps</a>
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
          {[
            ['setup', '🗺️ Explore'],
            ['journal', '📓 Journal'],
            ['parent', '👩‍🏫 Parent'],
          ].map(([s, lbl]) => (
            <button
              key={s}
              type="button"
              className={`tab-btn ${screen === s || (s === 'setup' && screen === 'explore') ? 'on' : 'off'}`}
              onClick={() => {
                if (s === 'setup') {
                  if (screen !== 'setup' && screen !== 'explore') setScreen('setup');
                } else setScreen(s);
              }}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 580, margin: '0 auto', padding: '26px 18px 80px' }}>
        {screen === 'setup' && (
          <div className="fade-in">
            <p style={{ fontWeight: 800, color: '#bbb', fontSize: '.82rem', marginBottom: 10, letterSpacing: 0.5 }}>HOW OLD IS THE EXPLORER?</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 24 }}>
              {Object.entries(AGE_PROFILES).map(([k, p]) => (
                <div key={k} role="button" tabIndex={0} className={`age-card ${age === k ? 'sel' : ''}`} onClick={() => setAge(k)} onKeyDown={(e) => e.key === 'Enter' && setAge(k)}>
                  <div style={{ fontSize: '1.7rem' }}>{p.emoji}</div>
                  <div style={{ fontWeight: 800, fontSize: '.82rem', marginTop: 6, color: '#333' }}>{p.label}</div>
                </div>
              ))}
            </div>

            <div style={{ background: 'white', borderRadius: 24, padding: '18px 22px', boxShadow: '0 8px 32px rgba(0,0,0,.08)', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10, border: '2px solid #FFE4E4' }}>
              <span style={{ fontWeight: 900, color: '#FF6B6B', whiteSpace: 'nowrap', fontSize: '1.1rem' }}>I am curious about</span>
              <input ref={inputRef} className="topic-in" placeholder="cars, stars, dinosaurs…" value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && startExploration()} />
              <span style={{ fontSize: '1.2rem' }}>…</span>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <button type="button" className="pri-btn" onClick={startExploration} disabled={!topic.trim()}>
                Let&apos;s explore! 🚀
              </button>
            </div>

            <p style={{ color: '#ccc', fontSize: '.8rem', fontWeight: 700, textAlign: 'center', marginBottom: 10 }}>Try something like:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {['🚗 Cars', '🦕 Dinosaurs', '⭐ Stars', '🐳 Whales', '🎸 Guitars', '🏔️ Mountains', '🦋 Butterflies', '🌋 Volcanoes'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTopic(s.split(' ').slice(1).join(' '))}
                  style={{
                    background: 'white',
                    border: '2px solid #eee',
                    borderRadius: 50,
                    padding: '5px 14px',
                    fontSize: '.88rem',
                    cursor: 'pointer',
                    fontWeight: 700,
                    color: '#555',
                    transition: 'all .18s',
                    fontFamily: "'Nunito',cursive",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#FF6B6B';
                    e.target.style.color = '#FF6B6B';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#eee';
                    e.target.style.color = '#555';
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {screen === 'explore' && (
          <div className="fade-in">
            {path.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20, alignItems: 'center' }}>
                {path.map((p, i) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {i > 0 && <span style={{ color: '#ccc' }}>→</span>}
                    <span className="chip" style={{ background: `${COLORS[i % COLORS.length]}40`, border: `2px solid ${COLORS[i % COLORS.length]}` }}>
                      {p}
                    </span>
                  </span>
                ))}
              </div>
            )}

            {current && (
              <div className="fade-in jcard" style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg,#FF6B6B,#FF8B94)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(255,107,107,.3)',
                    }}
                  >
                    👩
                  </div>
                  <p style={{ fontSize: '1.05rem', fontWeight: 700, color: '#333', lineHeight: 1.55, margin: 0 }}>{current.message}</p>
                </div>
              </div>
            )}

            {current && current.options.length > 0 && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
                {current.options.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    className="opt-btn"
                    style={{ borderColor: `${COLORS[i % COLORS.length]}80` }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = COLORS[i % COLORS.length];
                      e.currentTarget.style.background = `${COLORS[i % COLORS.length]}18`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = `${COLORS[i % COLORS.length]}80`;
                      e.currentTarget.style.background = 'white';
                    }}
                    onClick={() => pickOption(opt)}
                  >
                    <span style={{ marginRight: 10, fontSize: '1.1rem' }}>{['🔵', '🟠', '🟢', '🔴'][i % 4]}</span>
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div style={{ textAlign: 'center', padding: '28px 0', color: '#aaa' }}>
                <div className="spin" style={{ fontSize: '2rem' }}>
                  🔍
                </div>
                <p style={{ fontWeight: 700, marginTop: 10 }}>Thinking of where to look…</p>
              </div>
            )}

            {!loading && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
                <button type="button" className="ghost-btn" onClick={reset}>
                  ← New curiosity
                </button>
                {path.length > 1 && (
                  <button
                    type="button"
                    className="ghost-btn"
                    style={{ borderColor: '#4ECDC4', color: '#4ECDC4' }}
                    onClick={() => {
                      doSave();
                      setScreen('journal');
                    }}
                  >
                    📓 Save to Journal
                  </button>
                )}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {screen === 'journal' && (
          <div className="fade-in">
            <h2 style={{ fontFamily: "'Fredoka One',cursive", fontSize: '1.6rem', color: '#FF6B6B', marginBottom: 4 }}>📓 Discovery Journal</h2>
            <p style={{ color: '#bbb', fontWeight: 700, fontSize: '.85rem', marginBottom: 20 }}>Everything the explorer has been curious about!</p>

            {journal.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#ccc' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>🌱</div>
                <p style={{ fontWeight: 700 }}>No discoveries yet — go explore something!</p>
                <button type="button" className="pri-btn" style={{ marginTop: 16 }} onClick={() => setScreen('setup')}>
                  Start exploring
                </button>
              </div>
            )}

            {journal.map((entry) => (
              <div key={entry.id} className="jcard">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <span style={{ fontFamily: "'Fredoka One',cursive", fontSize: '1.15rem', color: '#FF6B6B' }}>🌱 {entry.topic}</span>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <span style={{ fontSize: '.75rem', fontWeight: 800, color: '#bbb' }}>{entry.date}</span>
                      <span style={{ fontSize: '.75rem', fontWeight: 800, color: '#4ECDC4' }}>{entry.age}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => delEntry(entry.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#ddd', transition: 'color .18s' }}
                    onMouseEnter={(e) => {
                      e.target.style.color = '#FF6B6B';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = '#ddd';
                    }}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
                  {entry.path.map((p, i) => (
                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      {i > 0 && (
                        <span style={{ color: '#ddd', fontSize: '.8rem' }}>→</span>
                      )}
                      <span className="chip" style={{ background: `${COLORS[i % COLORS.length]}35`, cursor: 'default', border: `2px solid ${COLORS[i % COLORS.length]}`, fontSize: '.75rem' }}>
                        {p}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {screen === 'parent' && (
          <div className="fade-in">
            <h2 style={{ fontFamily: "'Fredoka One',cursive", fontSize: '1.6rem', color: '#FF6B6B', marginBottom: 4 }}>👩‍🏫 Parent & Teacher Mode</h2>
            <p style={{ color: '#bbb', fontWeight: 700, fontSize: '.85rem', marginBottom: 20 }}>Full exploration path trees and settings.</p>

            {!unlocked ? (
              <div style={{ background: 'white', borderRadius: 24, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,.08)', border: '2px solid #FFF0E6', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🔒</div>
                <p style={{ fontWeight: 800, color: '#333', marginBottom: 6 }}>Enter your PIN</p>
                <p style={{ color: '#bbb', fontSize: '.82rem', marginBottom: 18 }}>
                  Default PIN is <strong>1234</strong>
                </p>
                <input
                  type="password"
                  maxLength={6}
                  value={pinIn}
                  onChange={(e) => setPinIn(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && tryUnlock()}
                  style={{
                    border: `2px solid ${pinErr ? '#FF6B6B' : '#eee'}`,
                    borderRadius: 14,
                    padding: '12px 18px',
                    fontSize: '1.4rem',
                    fontFamily: "'Nunito',cursive",
                    fontWeight: 800,
                    textAlign: 'center',
                    width: 160,
                    outline: 'none',
                    letterSpacing: 8,
                    marginBottom: pinErr ? 10 : 18,
                  }}
                  placeholder="••••"
                />
                {pinErr && (
                  <p style={{ color: '#FF6B6B', fontWeight: 800, fontSize: '.85rem', marginBottom: 10 }}>Wrong PIN, try again!</p>
                )}
                <br />
                <button type="button" className="pri-btn" onClick={tryUnlock}>
                  Unlock 🔓
                </button>
              </div>
            ) : (
              <div>
                <div className="jcard" style={{ marginBottom: 20 }}>
                  <p style={{ fontWeight: 800, color: '#333', marginBottom: 10 }}>🔑 Change PIN</p>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="password"
                      maxLength={6}
                      placeholder="New PIN (4–6 digits)"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      style={{
                        border: '2px solid #eee',
                        borderRadius: 12,
                        padding: '8px 14px',
                        fontSize: '1rem',
                        fontFamily: "'Nunito',cursive",
                        fontWeight: 800,
                        width: 170,
                        outline: 'none',
                        letterSpacing: 4,
                      }}
                    />
                    <button
                      type="button"
                      className="ghost-btn"
                      style={{ borderColor: '#4ECDC4', color: '#4ECDC4' }}
                      onClick={() => {
                        if (newPin.length >= 4) {
                          setPinSet(newPin);
                          setNewPin('');
                        }
                      }}
                    >
                      Save PIN
                    </button>
                  </div>
                </div>

                <p style={{ fontWeight: 800, color: '#bbb', fontSize: '.82rem', marginBottom: 12, letterSpacing: 0.5 }}>EXPLORATION PATH TREES</p>
                {journal.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 30, color: '#ccc' }}>
                    <p style={{ fontWeight: 700 }}>No explorations saved yet.</p>
                  </div>
                )}
                {journal.map((entry) => (
                  <div key={entry.id} className="jcard" style={{ marginBottom: 14 }}>
                    <div style={{ marginBottom: 10 }}>
                      <span style={{ fontFamily: "'Fredoka One',cursive", fontSize: '1.1rem', color: '#FF6B6B' }}>🌱 {entry.topic}</span>
                      <span style={{ marginLeft: 10, fontSize: '.75rem', fontWeight: 800, color: '#bbb' }}>
                        {entry.date} · {entry.age}
                      </span>
                    </div>
                    <TreeNode node={entry.tree} />
                  </div>
                ))}

                <div style={{ justifyContent: 'center', marginTop: 20, display: 'flex' }}>
                  <button type="button" className="ghost-btn" onClick={() => { setUnlocked(false); setPinIn(''); }}>
                    🔒 Lock
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
