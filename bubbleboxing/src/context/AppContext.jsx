import { createContext, useContext, useReducer, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase.js';
import { DEFAULT_THEME } from '../styles/themes.js';

const AppContext = createContext(null);

const SCREENS = {
  AUTH: 'auth',
  ONBOARDING: 'onboarding',
  SETUP: 'setup',
  SESSION: 'session',
  SUMMARY: 'summary',
  HISTORY: 'history',
};

const initialState = {
  screen: SCREENS.AUTH,
  user: null,
  isGuest: false,
  authLoading: true,
  hasSeenOnboarding: false,

  // Ring light
  ringLight: {
    enabled: false,
    color: '#ffffff',
    intensity: 0.8,
    thickness: 40,
    pulseOnPunch: true,
    flashOnPop: true,
    isRainbow: false,
  },

  // Theme
  theme: DEFAULT_THEME,

  // Session state
  session: {
    popCount: 0,
    punchEvents: [],
    lastPunchRating: null,
    lastPunchSpeed: null,
    isRunning: false,
    timeLeft: 180,
    pixelsPerCm: null,
  },

  // Last completed session (for summary screen)
  lastSession: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, isGuest: false, authLoading: false };
    case 'PLAY_AS_GUEST':
      return { ...state, user: null, isGuest: true, authLoading: false };
    case 'SET_AUTH_LOADING':
      return { ...state, authLoading: action.payload };
    case 'GO_TO':
      return { ...state, screen: action.payload };
    case 'SET_ONBOARDING_SEEN':
      return { ...state, hasSeenOnboarding: true };
    case 'SET_RING_LIGHT':
      return { ...state, ringLight: { ...state.ringLight, ...action.payload } };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'UPDATE_SESSION':
      return { ...state, session: { ...state.session, ...action.payload } };
    case 'RESET_SESSION':
      return {
        ...state,
        session: {
          ...initialState.session,
          pixelsPerCm: state.session.pixelsPerCm,
        },
      };
    case 'SET_LAST_SESSION':
      return { ...state, lastSession: action.payload };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        dispatch({ type: 'SET_USER', payload: user });
      } else {
        // Only redirect to auth if the user isn't already in guest mode
        dispatch({ type: 'SET_AUTH_LOADING', payload: false });
      }
    });
    return unsubscribe;
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, SCREENS }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export { SCREENS };
