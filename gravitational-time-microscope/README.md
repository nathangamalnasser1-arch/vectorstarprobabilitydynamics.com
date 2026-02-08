# The Gravitational Time Microscope

A multi-page static research website (HTML / Tailwind CSS / JS) for the physics project **The Gravitational Time Microscope**, presenting the Vector-Star Probability Dynamics (VSPD) framework and its supporting astronomical evidence.

## Design

- **Theme**: “Deep Space” — background `slate-950`, text `slate-200`, accents `cyan-400` (light) and `indigo-500` (gravity). Academic journal style, high-contrast typography.
- **Responsive**: Cohesive nav with mobile hamburger; image-comparison slider and range input work on mobile and desktop.

## Structure

- **Home (`index.html`)** — Introduction to VSPD (theory and mechanism); links to the three experiment pages.
- **Page 1: The Visual Proof (`experiment1-cosmos.html`)** — COSMOS field: image-comparison slider (JS + range input). Left: `images/hubble_cosmos.jpg` with CSS `blur(4px)`, label “The Blurry Picture.” Right: `images/webb_cosmos.jpg` sharp, label “Invisible Scaffolding in Stunning Detail.” Caption on Webb’s sharpness and the “sharpening” effect.
- **Page 2: The Precision Proof (`experiment2-black-hole-spectroscopy.html`)** — GW250114, black hole spectroscopy, multiple tones, Einstein’s predictions, signatures of quantum gravity.
- **Page 3: The Mechanistic Proof (`experiment3-sirius-b.html`)** — Hubble spectroscopy of Sirius B, Balmer lines, gravitational redshift, time dilation, link to VSPD and the “engine” of the microscope.

## Tech

- **Tailwind CSS** via CDN (no build step).
- **Vanilla JS** for the image-comparison slider (range input + draggable divider) and mobile nav toggle.
- **Images**: Placeholders `images/hubble_cosmos.jpg` and `images/webb_cosmos.jpg` are provided (copy of COSMOS field). Replace with your local Hubble and Webb COSMOS images as needed.

## Running locally

Open `index.html` in a browser (e.g. from the `gravitational-time-microscope` folder), or serve the folder with any static server.

## Favicon

Uses the parent project favicon (`../favicon.ico`). For a standalone deploy, add a `favicon.ico` in this folder and update the `<link>` in each HTML file.
