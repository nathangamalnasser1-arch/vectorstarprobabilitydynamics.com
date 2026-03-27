import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { useRingLight } from '../../hooks/useRingLight.js';
import { RING_PRESET_COLORS, THEMES } from '../../styles/themes.js';

export default function RingLightControls({ canvasRef, onClose }) {
  const { state, dispatch } = useApp();
  const { ringLight, theme } = state;
  const [open, setOpen] = useState(false);
  const rl = useRingLight(canvasRef);

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(true)}
        style={styles.fab(theme, ringLight.enabled)}
        title="Ring Light Controls"
        aria-label="Ring light controls"
      >
        💡
      </button>

      {/* Slide-up drawer */}
      {open && (
        <div style={styles.overlay} onClick={handleClose}>
          <div style={styles.drawer(theme)} onClick={(e) => e.stopPropagation()}>
            <div style={styles.drawerHandle} />
            <h3 style={styles.drawerTitle(theme)}>Ring Light</h3>

            {/* On/Off */}
            <div style={styles.row}>
              <span style={styles.label(theme)}>Ring Light</span>
              <button
                onClick={rl.toggle}
                style={styles.toggle(ringLight.enabled, theme)}
              >
                {ringLight.enabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Color presets */}
            <div style={styles.section}>
              <span style={styles.label(theme)}>Color</span>
              <div style={styles.colorGrid}>
                {RING_PRESET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => rl.setColor(c.value)}
                    title={c.label}
                    style={styles.colorDot(
                      c.value === 'rainbow'
                        ? 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)'
                        : c.value,
                      ringLight.color === c.value
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Intensity */}
            <div style={styles.section}>
              <div style={styles.rowBetween}>
                <span style={styles.label(theme)}>Intensity</span>
                <span style={styles.value(theme)}>{Math.round(ringLight.intensity * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.2}
                max={1}
                step={0.05}
                value={ringLight.intensity}
                onChange={(e) => rl.setIntensity(Number(e.target.value))}
                style={styles.slider(theme)}
              />
            </div>

            {/* Thickness */}
            <div style={styles.section}>
              <div style={styles.rowBetween}>
                <span style={styles.label(theme)}>Thickness</span>
                <span style={styles.value(theme)}>{ringLight.thickness}px</span>
              </div>
              <input
                type="range"
                min={10}
                max={120}
                step={5}
                value={ringLight.thickness}
                onChange={(e) => rl.setThickness(Number(e.target.value))}
                style={styles.slider(theme)}
              />
            </div>

            {/* Pulse modes */}
            <div style={styles.row}>
              <span style={styles.label(theme)}>Pulse on punch</span>
              <button
                onClick={() => rl.setPulseOnPunch(!ringLight.pulseOnPunch)}
                style={styles.toggle(ringLight.pulseOnPunch, theme)}
              >
                {ringLight.pulseOnPunch ? 'ON' : 'OFF'}
              </button>
            </div>

            <div style={styles.row}>
              <span style={styles.label(theme)}>Flash on pop</span>
              <button
                onClick={() => rl.setFlashOnPop(!ringLight.flashOnPop)}
                style={styles.toggle(ringLight.flashOnPop, theme)}
              >
                {ringLight.flashOnPop ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Theme presets */}
            <div style={styles.section}>
              <span style={styles.label(theme)}>Theme</span>
              <div style={styles.themeGrid}>
                {Object.entries(THEMES).map(([name, t]) => (
                  <button
                    key={name}
                    onClick={() => {
                      dispatch({ type: 'SET_THEME', payload: t });
                      rl.setColor(t.ringColor);
                    }}
                    style={styles.themeBtn(t, state.theme.id === t.id)}
                    title={name}
                  >
                    {name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <button style={styles.closeBtn(theme)} onClick={handleClose}>
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  fab: (theme, enabled) => ({
    position: 'fixed',
    bottom: 100,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: '50%',
    border: `2px solid ${enabled ? theme.accent : 'rgba(255,255,255,0.2)'}`,
    background: enabled ? theme.accent + '33' : 'rgba(0,0,0,0.6)',
    fontSize: 22,
    cursor: 'pointer',
    zIndex: 100,
    backdropFilter: 'blur(8px)',
  }),
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    zIndex: 200, display: 'flex', alignItems: 'flex-end',
  },
  drawer: (theme) => ({
    width: '100%',
    maxWidth: 480,
    margin: '0 auto',
    background: theme.bg,
    borderRadius: '20px 20px 0 0',
    padding: '16px 24px 40px',
    border: `1px solid rgba(255,255,255,0.08)`,
    maxHeight: '85dvh',
    overflowY: 'auto',
  }),
  drawerHandle: {
    width: 36, height: 4, background: 'rgba(255,255,255,0.2)',
    borderRadius: 2, margin: '0 auto 16px',
  },
  drawerTitle: (theme) => ({
    color: theme.text, fontSize: 18, fontWeight: 700, margin: '0 0 20px',
  }),
  section: { marginBottom: 20 },
  row: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  rowBetween: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 },
  label: (theme) => ({ color: theme.text, fontSize: 14, fontWeight: 500 }),
  value: (theme) => ({ color: theme.dimText, fontSize: 14 }),
  toggle: (active, theme) => ({
    padding: '6px 16px',
    borderRadius: 20,
    border: `1px solid ${active ? theme.accent : 'rgba(255,255,255,0.15)'}`,
    background: active ? theme.accent + '33' : 'transparent',
    color: active ? theme.accent : 'rgba(255,255,255,0.5)',
    fontWeight: 700,
    fontSize: 12,
    cursor: 'pointer',
  }),
  colorGrid: { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  colorDot: (bg, selected) => ({
    width: 32, height: 32, borderRadius: '50%',
    background: bg,
    border: selected ? '3px solid #fff' : '2px solid rgba(255,255,255,0.2)',
    cursor: 'pointer',
    outline: selected ? '2px solid rgba(255,255,255,0.5)' : 'none',
  }),
  slider: (theme) => ({
    width: '100%', accentColor: theme.accent, cursor: 'pointer',
  }),
  themeGrid: {
    display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10,
  },
  themeBtn: (t, active) => ({
    padding: '6px 12px',
    borderRadius: 8,
    border: `1px solid ${active ? t.accent : 'rgba(255,255,255,0.1)'}`,
    background: active ? t.accent + '22' : 'transparent',
    color: t.accent,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  }),
  closeBtn: (theme) => ({
    width: '100%', padding: '13px',
    borderRadius: 12, border: 'none',
    background: theme.accent, color: '#000',
    fontWeight: 700, fontSize: 15, cursor: 'pointer',
    marginTop: 8,
  }),
};
