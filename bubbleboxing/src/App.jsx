import { useEffect } from 'react';
import { useApp, SCREENS } from './context/AppContext.jsx';
import AuthScreen from './components/Auth/AuthScreen.jsx';
import OnboardingScreen from './components/Onboarding/OnboardingScreen.jsx';
import SetupScreen from './components/Setup/SetupScreen.jsx';
import SessionScreen from './components/Session/SessionScreen.jsx';
import SummaryScreen from './components/Summary/SummaryScreen.jsx';
import HistoryScreen from './components/History/HistoryScreen.jsx';

export default function App() {
  const { state } = useApp();
  const { screen, theme, authLoading } = state;

  // Apply theme CSS variables to :root
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--bg', theme.bg);
    root.style.setProperty('--text', theme.text);
    root.style.setProperty('--dim', theme.dimText);
  }, [theme]);

  if (authLoading) {
    return (
      <div style={loadingStyle(theme)}>
        <span style={{ fontSize: 48 }}>🥊</span>
        <p style={{ color: theme.dimText, marginTop: 12 }}>Loading…</p>
      </div>
    );
  }

  switch (screen) {
    case SCREENS.AUTH:        return <AuthScreen />;
    case SCREENS.ONBOARDING:  return <OnboardingScreen />;
    case SCREENS.SETUP:       return <SetupScreen />;
    case SCREENS.SESSION:     return <SessionScreen />;
    case SCREENS.SUMMARY:     return <SummaryScreen />;
    case SCREENS.HISTORY:     return <HistoryScreen />;
    default:                  return <AuthScreen />;
  }
}

const loadingStyle = (theme) => ({
  height: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: theme.bg,
  fontFamily: 'inherit',
});
