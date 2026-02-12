# Data Pipeline — 5-Step Workflow (Gather → Assess → Cleanse → Transform → Store)

## 1. Gather
- Photon energy data (p_T in GeV) and flow velocity values from hydrodynamic simulations (Paquet/Vanderbilt–McGill context).
- Sources: thermal photon spectra dN^γ/d²p_T dy, flow profile u^μ(τ, x).

## 2. Discover & Assess
- Dataset structure: (p_T [GeV], yield, T_local [MeV], v_transverse).
- Limitations: GeV → pixel luminance mapping; finite p_T range (e.g. 0.2–5 GeV).

## 3. Cleanse & Validate
- Remove/correct outliers; ensure v ∈ [0, 1); ensure T_local > 0; validate hydrodynamic baseline.

## 4. Transform & Enrich
- Apply Doppler shift: E' = E γ (1 − β cos θ); enrich with T_eff = T_local √((1+v)/(1−v)) for display.

## 5. Store
- Output: JSON/CSV for browser (see `photon_spectrum.json`, `flow_profiles.json`).
