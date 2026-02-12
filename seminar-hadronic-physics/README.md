# Thermal EM Radiation from Deconfined Nuclear Matter

Static web application for visualizing thermal electromagnetic radiation from the Quark-Gluon Plasma (QGP), based on the research context of **Jean-François Paquet (Vanderbilt University)** and the McGill Physics seminar. The app maps GeV-scale photon spectra and effective temperature (inverse slope) into an interactive, dual-audience interface.

## Features

- **Physics engine**: Boltzmann-like thermal spectrum \(dN^\gamma/d^2p_T dy\), Doppler blue-shift, and effective temperature \(T_{\mathrm{eff}} \approx T_{\mathrm{local}} \sqrt{(1+v)/(1-v)}\).
- **Data pipeline**: Five-step workflow (Gather → Discover/Assess → Cleanse/Validate → Transform/Enrich → Store) with JSON data and validation.
- **Visualization**: D3.js spectrum plot with inverse-slope line; schematic transverse expansion \(u^\mu\).
- **Dual-track UI**: Beginner (“So what?” — heat wave/ice cream analogy) and Expert (T(x,τ), \(u^\mu\), formulas).
- **Validation**: Causal correlation check (expansion → spectral hardening); no spurious relationships.

## Run locally

1. Open `index.html` in a browser, or serve the folder with any static server (e.g. `npx serve .`).
2. Use sliders for **T_local (MeV)** and **Transverse flow v**; toggle **Spectrum** between “Local temperature” and “Effective (with flow)”.

## Tests

```bash
npm test
```

Runs unit tests for:

- `js/physicsEngine.js` — thermal yield, \(T_{\mathrm{eff}}\), spectrum, inverse slope
- `js/dataPipeline.js` — 5-step pipeline
- `js/validation.js` — linear regression, causal v→\(T_{\mathrm{eff}}\), \(T_{\mathrm{eff}}\) formula

## Project layout

- `index.html` — Single-page app and dual-track narrative
- `css/styles.css` — Layout and theming
- `js/physicsEngine.js` — Thermal spectrum and Doppler logic
- `js/dataPipeline.js` — 5-step data workflow
- `js/validation.js` — Causal validation
- `js/app.js` — D3 chart, expansion viz, controls
- `data/` — Pipeline README, `photon_spectrum.json`, `flow_profiles.json`
- `tests/` — Unit tests for physics, pipeline, validation

## References

- Jean-François Paquet (Vanderbilt), thermal photons in relativistic heavy-ion collisions.
- McGill Physics seminar context; GeV-photon data and hydrodynamic flow.
