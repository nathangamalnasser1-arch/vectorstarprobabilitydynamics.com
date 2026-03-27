import { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../../lib/firebase.js';
import { useApp, SCREENS } from '../../context/AppContext.jsx';

export default function AuthScreen() {
  const { state, dispatch } = useApp();
  const { theme } = state;
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const afterLogin = (user) => {
    dispatch({ type: 'SET_USER', payload: user });
    dispatch({ type: 'GO_TO', payload: SCREENS.ONBOARDING });
  };

  const handleGuest = () => {
    dispatch({ type: 'PLAY_AS_GUEST' });
    dispatch({ type: 'GO_TO', payload: SCREENS.ONBOARDING });
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', cred.user.uid), {
          displayName: name,
          email,
          createdAt: serverTimestamp(),
        });
        afterLogin(cred.user);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        afterLogin(cred.user);
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await setDoc(
        doc(db, 'users', cred.user.uid),
        { displayName: cred.user.displayName, email: cred.user.email, createdAt: serverTimestamp() },
        { merge: true }
      );
      afterLogin(cred.user);
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const accent = theme.accent;

  return (
    <div style={styles.container(theme)}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <span style={styles.logoEmoji}>🥊</span>
          <h1 style={styles.logoTitle(accent)}>BubbleBoxing</h1>
          <p style={styles.logoSub(theme)}>Pop bubbles. Track speed. Beat your record.</p>
        </div>

        {/* Guest CTA — most prominent action */}
        <button style={styles.guestBtn(accent)} onClick={handleGuest}>
          Play without account
        </button>

        <div style={styles.guestNote(theme)}>
          Record &amp; download clips to your phone — no sign-up needed
        </div>

        <div style={styles.divider(theme)}>
          <span>or sign in to save scores &amp; leaderboard</span>
        </div>

        <div style={styles.tabs}>
          {['login', 'register'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={styles.tab(m === mode, accent)}
            >
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        <form onSubmit={handleEmailAuth} style={styles.form}>
          {mode === 'register' && (
            <input
              style={styles.input(accent)}
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            style={styles.input(accent)}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input(accent)}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.primaryBtn(accent)} type="submit" disabled={loading}>
            {loading ? 'Loading…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={styles.divider(theme)}>
          <span>or</span>
        </div>

        <button style={styles.googleBtn} onClick={handleGoogle} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: 8 }}>
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
            <path fill="#FBBC05" d="M4.5 10.48A4.8 4.8 0 014.5 7.52V5.45H1.83a8 8 0 000 7.1l2.67-2.07z"/>
            <path fill="#EA4335" d="M8.98 3.58c1.32 0 2.5.45 3.44 1.35l2.54-2.54A8 8 0 001.83 5.45L4.5 7.52A4.77 4.77 0 018.98 3.58z"/>
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: (theme) => ({
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: theme.bg,
    padding: '24px 16px',
  }),
  card: {
    width: '100%',
    maxWidth: 380,
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: '36px 28px',
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(12px)',
  },
  logo: { textAlign: 'center', marginBottom: 28 },
  logoEmoji: { fontSize: 48, display: 'block' },
  logoTitle: (accent) => ({
    fontSize: 28,
    fontWeight: 800,
    color: accent,
    margin: '8px 0 4px',
    letterSpacing: '-0.5px',
  }),
  logoSub: (theme) => ({
    color: theme.dimText,
    fontSize: 13,
    margin: 0,
  }),
  tabs: {
    display: 'flex',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
    border: '1px solid rgba(255,255,255,0.1)',
  },
  tab: (active, accent) => ({
    flex: 1,
    padding: '10px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    transition: 'all 0.2s',
    background: active ? accent : 'transparent',
    color: active ? '#000' : 'rgba(255,255,255,0.5)',
  }),
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: (accent) => ({
    padding: '12px 14px',
    borderRadius: 10,
    border: `1px solid rgba(255,255,255,0.12)`,
    background: 'rgba(255,255,255,0.06)',
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
  }),
  error: {
    color: '#ff4466',
    fontSize: 13,
    margin: '4px 0',
    padding: '8px 12px',
    background: 'rgba(255,68,102,0.1)',
    borderRadius: 8,
  },
  primaryBtn: (accent) => ({
    padding: '13px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    background: accent,
    color: '#000',
    fontWeight: 700,
    fontSize: 15,
    marginTop: 4,
    transition: 'opacity 0.2s',
  }),
  divider: (theme) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '20px 0',
    color: theme.dimText,
    fontSize: 12,
  }),
  googleBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '12px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.04)',
    color: '#fff',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  guestBtn: (accent) => ({
    display: 'block',
    width: '100%',
    padding: '15px',
    borderRadius: 12,
    border: 'none',
    background: accent,
    color: '#000',
    fontWeight: 800,
    fontSize: 16,
    cursor: 'pointer',
    marginBottom: 10,
    letterSpacing: '-0.2px',
  }),
  guestNote: (theme) => ({
    textAlign: 'center',
    color: theme.dimText,
    fontSize: 12,
    marginBottom: 4,
  }),
};
