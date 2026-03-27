import { useState } from 'react';
import { useApp, SCREENS } from '../../context/AppContext.jsx';
import { saveSession } from '../../lib/sessionService.js';
import { classifySpeed } from '../../lib/speedCalculator.js';

export default function SummaryScreen() {
  const { state, dispatch } = useApp();
  const { theme, lastSession, user } = state;
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!lastSession) {
    return (
      <div style={styles.container(theme)}>
        <p style={{ color: theme.dimText }}>No session data.</p>
        <button
          style={styles.btn(theme)}
          onClick={() => dispatch({ type: 'GO_TO', payload: SCREENS.SETUP })}
        >
          Back to Setup
        </button>
      </div>
    );
  }

  const { totalPops, punchEvents, averageSpeed, duration } = lastSession;
  const punchCount = punchEvents?.length ?? 0;

  const ratingCounts = (punchEvents ?? []).reduce((acc, e) => {
    acc[e.rating] = (acc[e.rating] ?? 0) + 1;
    return acc;
  }, {});

  const avgRating = averageSpeed > 0 ? classifySpeed(averageSpeed) : 'N/A';

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  const handleSave = async () => {
    if (saving || saved || !user) return;
    setSaving(true);
    try {
      await saveSession(user.uid, lastSession);
      setSaved(true);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const stats = [
    { label: 'Bubbles Popped', value: totalPops, icon: '🫧', color: theme.accent },
    { label: 'Total Punches', value: punchCount, icon: '👊', color: '#ff8844' },
    { label: 'Avg Speed', value: avgRating, icon: '⚡', color: '#ffcc44' },
    { label: 'Duration', value: `${minutes}:${String(seconds).padStart(2, '0')}`, icon: '⏱', color: '#88aaff' },
  ];

  return (
    <div style={styles.container(theme)}>
      <div style={styles.inner}>
        <div style={styles.hero}>
          <span style={styles.heroIcon}>🏆</span>
          <h1 style={styles.heroTitle(theme)}>Session Complete!</h1>
          <p style={styles.heroSub(theme)}>
            {totalPops >= 50
              ? 'Outstanding performance!'
              : totalPops >= 20
              ? 'Great work, keep it up!'
              : 'Every session makes you stronger!'}
          </p>
        </div>

        <div style={styles.statsGrid}>
          {stats.map((s) => (
            <div key={s.label} style={styles.statCard}>
              <span style={styles.statIcon}>{s.icon}</span>
              <span style={styles.statValue(s.color)}>{s.value}</span>
              <span style={styles.statLabel(theme)}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Speed breakdown */}
        {punchCount > 0 && (
          <div style={styles.breakdownCard}>
            <h3 style={styles.breakdownTitle(theme)}>Punch Breakdown</h3>
            {['Lightning', 'Fast', 'Medium', 'Slow'].map((rating) => {
              const count = ratingCounts[rating] ?? 0;
              const pct = punchCount > 0 ? (count / punchCount) * 100 : 0;
              const colors = { Lightning: '#ffcc00', Fast: '#ff6600', Medium: '#00aaff', Slow: '#888' };
              return (
                <div key={rating} style={styles.barRow}>
                  <span style={styles.barLabel(theme)}>{rating}</span>
                  <div style={styles.barTrack}>
                    <div style={styles.barFill(pct, colors[rating])} />
                  </div>
                  <span style={styles.barCount(theme)}>{count}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div style={styles.actions}>
          {user ? (
            !saved ? (
              <button
                style={styles.saveBtn(theme)}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving…' : '☁️  Save to Cloud'}
              </button>
            ) : (
              <div style={styles.savedBadge}>✓ Saved to your history</div>
            )
          ) : (
            <button
              style={styles.signInNudge(theme)}
              onClick={() => dispatch({ type: 'GO_TO', payload: SCREENS.AUTH })}
            >
              Sign in to save scores &amp; join the leaderboard
            </button>
          )}

          <button
            style={styles.btn(theme)}
            onClick={() => dispatch({ type: 'GO_TO', payload: SCREENS.SETUP })}
          >
            New Session
          </button>

          <button
            style={styles.ghostBtn(theme)}
            onClick={() => dispatch({ type: 'GO_TO', payload: SCREENS.HISTORY })}
          >
            View History →
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: (theme) => ({
    minHeight: '100dvh', background: theme.bg,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '32px 20px',
  }),
  inner: { width: '100%', maxWidth: 480 },
  hero: { textAlign: 'center', marginBottom: 32 },
  heroIcon: { fontSize: 56, display: 'block', marginBottom: 8 },
  heroTitle: (theme) => ({
    color: theme.text, fontSize: 28, fontWeight: 800, margin: '0 0 8px',
  }),
  heroSub: (theme) => ({
    color: theme.dimText, fontSize: 14, margin: 0,
  }),
  statsGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20,
  },
  statCard: {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 16, padding: '20px 16px',
    textAlign: 'center',
    border: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  statIcon: { fontSize: 24 },
  statValue: (color) => ({ fontSize: 32, fontWeight: 900, color }),
  statLabel: (theme) => ({ fontSize: 12, color: theme.dimText, fontWeight: 500 }),
  breakdownCard: {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 16, padding: '16px 18px',
    marginBottom: 24,
    border: '1px solid rgba(255,255,255,0.06)',
  },
  breakdownTitle: (theme) => ({
    color: theme.text, fontSize: 15, fontWeight: 700, margin: '0 0 14px',
  }),
  barRow: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
  },
  barLabel: (theme) => ({
    color: theme.dimText, fontSize: 13, width: 70, flexShrink: 0,
  }),
  barTrack: {
    flex: 1, height: 8, background: 'rgba(255,255,255,0.08)',
    borderRadius: 4, overflow: 'hidden',
  },
  barFill: (pct, color) => ({
    height: '100%', width: `${pct}%`,
    background: color, borderRadius: 4,
    transition: 'width 0.5s ease',
  }),
  barCount: (theme) => ({
    color: theme.dimText, fontSize: 13, width: 24, textAlign: 'right',
  }),
  actions: { display: 'flex', flexDirection: 'column', gap: 12 },
  saveBtn: (theme) => ({
    padding: '13px', borderRadius: 12,
    border: `1px solid ${theme.accent}`,
    background: 'transparent', color: theme.accent,
    fontWeight: 700, fontSize: 14, cursor: 'pointer',
  }),
  savedBadge: {
    padding: '13px', borderRadius: 12, textAlign: 'center',
    background: 'rgba(0,255,136,0.08)',
    border: '1px solid rgba(0,255,136,0.3)',
    color: '#00ff88', fontWeight: 700, fontSize: 14,
  },
  btn: (theme) => ({
    padding: '13px', borderRadius: 12, border: 'none',
    background: theme.accent, color: '#000',
    fontWeight: 700, fontSize: 15, cursor: 'pointer',
  }),
  ghostBtn: (theme) => ({
    background: 'none', border: 'none',
    color: theme.dimText, fontSize: 14,
    cursor: 'pointer', textAlign: 'center',
  }),
  signInNudge: (theme) => ({
    padding: '13px', borderRadius: 12, textAlign: 'center',
    border: `1px solid rgba(255,255,255,0.1)`,
    background: 'rgba(255,255,255,0.03)',
    color: theme.dimText, fontSize: 13,
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  }),
};
