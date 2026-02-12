# VSPD in Hadronic Physics: Interactive Showcase

A web-based showcase linking **Vector-Star Probability Dynamics (VSPD)** with hadronic physics: finite measurement duration (Δt) and thermal photon energy spectra from Quark-Gluon Plasma (QGP).

## Run the site

Open `index.html` in a browser, or serve the folder with any static server:

```bash
npx serve .
# or: python -m http.server 8080
```

## Features

- **Header**: Glass-morphism nav; modules: Theory, Application, Synthesis.
- **Theory**: Vector-Star canvas (red micro-paths; density scales with Δt).
- **Application**: GeV photon spectrum (0.1–1.0 GeV), log Y-axis, inverse slope (T_eff).
- **Synthesis**: Δt / Plasma Expansion slider; model toggle (VSPD vs standard); **draggable yellow measurement window** on the temporal evolution graph; live spectrum and regression (β_Δt, β_expansion).

## Tests

- **Node** (DataEngine, GraphController):
  ```bash
  node tests/dataEngine.test.js
  node tests/graphController.test.js
  ```
- **Browser** (Theory, Application, Temporal views): open `tests/browser-tests.html` in a browser.

## Tech

- Vanilla JS, Canvas API, no heavy libs.
- Palette: Heavy-Ion Gold, Plasma Blue, Vector-Star Red; yellow measurement window at 0.3 opacity.
- DataEngine: validation (T ≥ 0, |v| < c), Lorentz/Doppler, vector-star summation, inverse slope, mock multivariable regression (control for transverse expansion), caching for 60fps.
