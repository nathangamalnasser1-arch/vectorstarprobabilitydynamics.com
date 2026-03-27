import { useApp, SCREENS } from '../../context/AppContext.jsx';

const steps = [
  {
    icon: '📸',
    title: 'Camera Placement',
    items: [
      'Place phone/tablet on a tripod or have someone hold it',
      'Frame the fighter from head to feet (portrait mode)',
      'Distance: 2–4 meters from the fighter',
      'Slightly elevated angle (chest height or above) works best',
      'Ensure the 30cm calibration square is visible on the floor',
    ],
  },
  {
    icon: '💡',
    title: 'Lighting Setup',
    items: [
      'Use a dark or solid-color backdrop (black, dark blue, or deep grey)',
      'Place two softboxes or ring lights at 45° angles, at shoulder height',
      'Avoid direct flash — it washes out bubble surfaces',
      "Use the app's Ring Light as supplemental screen light",
      'Best: screen faces the fighter at chest height on a tripod',
    ],
  },
  {
    icon: '🫧',
    title: 'Bubble Source',
    items: [
      'Option A: A second person blows bubbles toward the fighter from the side',
      'Option B: A bubble machine 1–2m in front/side, angled at chest-to-head height',
      'Start with a steady moderate bubble flow for best detection',
      'More bubbles = higher score potential, but harder to detect',
    ],
  },
  {
    icon: '📏',
    title: 'Calibration Marker',
    items: [
      'Print or tape a 30cm × 30cm white square on the floor',
      'Place it in front of the fighter, visible to the camera',
      'The app detects it automatically to calculate real punch speed (km/h)',
      'If skipped, the app uses relative speed ratings instead',
    ],
  },
];

export default function OnboardingScreen() {
  const { state, dispatch } = useApp();
  const { theme } = state;

  const proceed = () => {
    dispatch({ type: 'SET_ONBOARDING_SEEN' });
    dispatch({ type: 'GO_TO', payload: SCREENS.SETUP });
  };

  return (
    <div style={styles.container(theme)}>
      <div style={styles.inner}>
        <h1 style={styles.heading(theme)}>
          <span>🥊</span> How to Set Up Your Session
        </h1>

        <div style={styles.grid}>
          {steps.map((step) => (
            <div key={step.title} style={styles.card}>
              <div style={styles.cardIcon}>{step.icon}</div>
              <h2 style={styles.cardTitle(theme)}>{step.title}</h2>
              <ul style={styles.list}>
                {step.items.map((item) => (
                  <li key={item} style={styles.listItem(theme)}>
                    <span style={styles.bullet(theme)}>›</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <button style={styles.btn(theme)} onClick={proceed}>
          Got it — Start Setup
        </button>

        <button
          style={styles.skipBtn(theme)}
          onClick={() => dispatch({ type: 'GO_TO', payload: SCREENS.SETUP })}
        >
          Skip intro
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: (theme) => ({
    minHeight: '100dvh',
    background: theme.bg,
    padding: '32px 20px 48px',
    overflowY: 'auto',
  }),
  inner: {
    maxWidth: 800,
    margin: '0 auto',
  },
  heading: (theme) => ({
    color: theme.text,
    fontSize: 26,
    fontWeight: 800,
    textAlign: 'center',
    marginBottom: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  }),
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 16,
    marginBottom: 36,
  },
  card: {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: '20px 20px 24px',
    border: '1px solid rgba(255,255,255,0.07)',
  },
  cardIcon: { fontSize: 32, marginBottom: 10 },
  cardTitle: (theme) => ({
    color: theme.accent,
    fontSize: 17,
    fontWeight: 700,
    margin: '0 0 12px',
  }),
  list: { margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 },
  listItem: (theme) => ({
    color: theme.text,
    fontSize: 13,
    lineHeight: 1.5,
    display: 'flex',
    gap: 8,
  }),
  bullet: (theme) => ({
    color: theme.accent,
    fontWeight: 700,
    flexShrink: 0,
    marginTop: 1,
  }),
  btn: (theme) => ({
    display: 'block',
    width: '100%',
    maxWidth: 380,
    margin: '0 auto 12px',
    padding: '15px',
    borderRadius: 12,
    border: 'none',
    background: theme.accent,
    color: '#000',
    fontWeight: 700,
    fontSize: 16,
    cursor: 'pointer',
  }),
  skipBtn: (theme) => ({
    display: 'block',
    margin: '0 auto',
    background: 'none',
    border: 'none',
    color: theme.dimText,
    fontSize: 13,
    cursor: 'pointer',
    textDecoration: 'underline',
  }),
};
