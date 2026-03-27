import { useEffect, useState } from 'react';
import { useApp, SCREENS } from '../../context/AppContext.jsx';
import { getUserSessions, getLeaderboard } from '../../lib/sessionService.js';
import { classifySpeed } from '../../lib/speedCalculator.js';

export default function HistoryScreen() {
  const { state, dispatch } = useApp();
  const { theme, user } = state;
  const [tab, setTab] = useState('mine'); // 'mine' | 'leaderboard'
  const [sessions, setSessions] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([getUserSessions(user.uid), getLeaderboard()])
      .then(([mine, lb]) => {
        setSessions(mine);
        setLeaders(lb);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const formatDate = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={styles.container(theme)}>
      <div style={styles.header}>
        <button
          style={styles.backBtn(theme)}
          onClick={() => dispatch({ type: 'GO_TO', payload: SCREENS.SETUP })}
        >
          ← Back
        </button>
        <h2 style={styles.title(theme)}>History</h2>
        <div />
      </div>

      <div style={styles.tabs}>
        {['mine', 'leaderboard'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={styles.tabBtn(t === tab, theme)}
          >
            {t === 'mine' ? 'My Sessions' : '🏆 Leaderboard'}
          </button>
        ))}
      </div>

      {loading && (
        <div style={styles.loading(theme)}>Loading…</div>
      )}

      {tab === 'mine' && !loading && (
        <div style={styles.list}>
          {!user && (
            <div style={styles.guestNote(theme)}>
              <p style={{ marginBottom: 12 }}>Sign in to save sessions and track your progress over time.</p>
              <button
                style={styles.signInBtn(theme)}
                onClick={() => dispatch({ type: 'GO_TO', payload: SCREENS.AUTH })}
              >
                Sign In / Register
              </button>
            </div>
          )}
          {user && sessions.length === 0 && (
            <div style={styles.empty(theme)}>
              No sessions yet. Complete a session to see your history!
            </div>
          )}
          {sessions.map((s, i) => (
            <SessionCard key={s.id} session={s} theme={theme} index={i} formatDate={formatDate} />
          ))}
        </div>
      )}

      {tab === 'leaderboard' && !loading && (
        <div style={styles.list}>
          {leaders.map((s, i) => (
            <div key={s.id} style={styles.leaderRow}>
              <span style={styles.rank(i, theme)}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </span>
              <div style={{ flex: 1 }}>
                <div style={styles.leaderName(theme)}>
                  {s.displayName ?? 'Anonymous Boxer'}
                </div>
                <div style={styles.leaderSub(theme)}>{formatDate(s.createdAt)}</div>
              </div>
              <div style={styles.leaderScore(theme)}>{s.totalPops} 🫧</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SessionCard({ session, theme, index, formatDate }) {
  const avgRating = session.averageSpeed > 0 ? classifySpeed(session.averageSpeed) : 'N/A';
  const speedColors = { Lightning: '#ffcc00', Fast: '#ff6600', Medium: '#00aaff', Slow: '#888', 'N/A': '#666' };

  return (
    <div style={styles.card}>
      <div style={styles.cardTop}>
        <span style={styles.cardDate(theme)}>{formatDate(session.createdAt)}</span>
        <span style={{ color: speedColors[avgRating] ?? '#888', fontSize: 12, fontWeight: 700 }}>
          {avgRating}
        </span>
      </div>
      <div style={styles.cardStats}>
        <div style={styles.cardStat}>
          <span style={styles.cardStatVal(theme.accent)}>{session.totalPops}</span>
          <span style={styles.cardStatLabel(theme)}>pops</span>
        </div>
        <div style={styles.cardStat}>
          <span style={styles.cardStatVal('#ff8844')}>{session.punchEvents?.length ?? 0}</span>
          <span style={styles.cardStatLabel(theme)}>punches</span>
        </div>
        <div style={styles.cardStat}>
          <span style={styles.cardStatVal('#88aaff')}>
            {Math.floor((session.duration ?? 180) / 60)}:{String((session.duration ?? 180) % 60).padStart(2, '0')}
          </span>
          <span style={styles.cardStatLabel(theme)}>time</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: (theme) => ({
    minHeight: '100dvh', background: theme.bg,
    display: 'flex', flexDirection: 'column',
  }),
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px',
  },
  backBtn: (theme) => ({
    background: 'none', border: 'none',
    color: theme.accent, fontSize: 14, fontWeight: 600, cursor: 'pointer',
  }),
  title: (theme) => ({ color: theme.text, fontSize: 18, fontWeight: 700, margin: 0 }),
  tabs: {
    display: 'flex', gap: 0,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    padding: '0 16px',
  },
  tabBtn: (active, theme) => ({
    flex: 1, padding: '12px 0',
    background: 'none', border: 'none',
    borderBottom: active ? `2px solid ${theme.accent}` : '2px solid transparent',
    color: active ? theme.accent : theme.dimText,
    fontWeight: active ? 700 : 500, fontSize: 14, cursor: 'pointer',
  }),
  loading: (theme) => ({
    padding: 40, textAlign: 'center', color: theme.dimText,
  }),
  list: { padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 },
  empty: (theme) => ({
    color: theme.dimText, textAlign: 'center', padding: '40px 20px', fontSize: 14,
  }),
  guestNote: (theme) => ({
    color: theme.dimText, textAlign: 'center',
    padding: '32px 20px', fontSize: 14, lineHeight: 1.6,
  }),
  signInBtn: (theme) => ({
    padding: '12px 28px', borderRadius: 10,
    border: 'none', background: theme.accent,
    color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer',
  }),
  card: {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 14, padding: '14px 16px',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  cardTop: {
    display: 'flex', justifyContent: 'space-between', marginBottom: 10,
  },
  cardDate: (theme) => ({ color: theme.dimText, fontSize: 12 }),
  cardStats: { display: 'flex', gap: 20 },
  cardStat: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  cardStatVal: (color) => ({ fontSize: 22, fontWeight: 800, color }),
  cardStatLabel: (theme) => ({ fontSize: 11, color: theme.dimText }),
  leaderRow: {
    display: 'flex', alignItems: 'center', gap: 14,
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 12, padding: '12px 14px',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  rank: (i, theme) => ({
    fontSize: i < 3 ? 22 : 15,
    fontWeight: 800,
    color: theme.accent,
    width: 32, textAlign: 'center',
  }),
  leaderName: (theme) => ({ color: theme.text, fontWeight: 600, fontSize: 14 }),
  leaderSub: (theme) => ({ color: theme.dimText, fontSize: 12 }),
  leaderScore: (theme) => ({
    color: theme.accent, fontWeight: 800, fontSize: 18,
  }),
};
