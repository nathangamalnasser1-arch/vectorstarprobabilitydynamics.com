# 🥊 BubbleBoxing

A web app that uses your phone or computer camera to run a 3-minute bubble popping boxing session — counting bubble pops and estimating punch speed using on-device AI.

## Features

- 🫧 **Bubble detection** via OpenCV.js (Hough Circle Transform + background subtraction)
- 👊 **Punch detection & speed** via MediaPipe Hands (on-device, no server needed)
- 💡 **Ring light** — colored glowing screen border that acts as real supplemental lighting
- ⏺ **Session recording** saved directly to your device
- 📷 **Photo capture** with auto-capture on bubble pop
- 🏆 **Leaderboard** via Firebase Firestore
- 🎨 **6 color themes** (Neon Blue, Fight Red, Gold, Ice White, Jungle Green, Cosmic Purple)

---

## Local Development Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd bubbleboxing
npm install
```

### 2. Configure Firebase

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** (Email/Password + Google)
3. Enable **Firestore** (start in production mode)
4. Enable **Storage**
5. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

6. Fill in your Firebase credentials in `.env`:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3. Run locally

```bash
npm run dev
```

Open `http://localhost:5173` in Chrome (required for WebRTC + MediaPipe GPU acceleration).

### 4. Run tests

```bash
npm test
```

### 5. Deploy to Firebase

```bash
npm run build
npx firebase deploy
```

---

## Physical Setup Guide

### Camera Placement

| What | Detail |
|---|---|
| **Device** | Phone/tablet on a tripod, or held by a second person |
| **Orientation** | Portrait mode |
| **Framing** | Fighter from head to feet |
| **Distance** | 2–4 meters from the fighter |
| **Angle** | Slightly elevated (chest height or above) |
| **Calibration marker** | 30cm × 30cm white square on the floor, visible to camera |

### Lighting Setup

```
          [Softbox]        [Softbox]
              \               /
               \    Fighter  /
                \    🥊    /
                 \        /
                  [Camera]
                   (tripod)
```

- **Backdrop**: Dark solid color (black, dark blue, or deep grey)
- **Two softboxes or ring lights** at 45° angles, shoulder height
- **Avoid** direct overhead-only or direct flash — it washes out bubble surfaces
- **Screen ring light**: Enable in-app — the screen glow adds real supplemental light when held at chest height on a tripod facing the fighter

### Bubble Source

**Option A — Second person:**
- Stand 1 meter to the side of the fighter
- Blow bubbles toward the punch zone (chest-to-head height)

**Option B — Bubble machine:**
- Place 1–2 meters in front/side of the fighter
- Angle nozzle to float bubbles into the punch zone (chest-to-head height)
- Start with moderate flow; too many bubbles at once reduces detection accuracy

### Calibration Marker

- Print or tape a **30cm × 30cm white square** on the floor
- Place it in the fighter's stance area, visible to the camera
- The app detects it automatically and converts punch speed to km/h / mph
- If skipped, the app uses relative ratings (Slow / Medium / Fast / Lightning)

---

## Architecture

```
src/
├── lib/
│   ├── bubbleDetector.js   — OpenCV.js bubble tracking & pop detection
│   ├── punchDetector.js    — MediaPipe Hands punch detection
│   ├── speedCalculator.js  — Pixel-to-real speed conversion
│   ├── calibration.js      — 30cm marker detection via contour analysis
│   ├── recorder.js         — MediaRecorder API wrapper
│   ├── sessionService.js   — Firestore read/write
│   └── firebase.js         — Firebase SDK init
├── context/
│   └── AppContext.jsx      — Global state (screen, theme, session, ring light)
├── hooks/
│   ├── useCamera.js        — Camera stream management + wake lock
│   ├── useSession.js       — Session lifecycle (start/end, rAF loop)
│   └── useRingLight.js     — Ring light canvas rendering + event listeners
├── components/
│   ├── Auth/               — Login / Register screen
│   ├── Onboarding/         — Setup guide cards
│   ├── Setup/              — Camera preview + calibration
│   ├── Session/            — Full-screen camera session
│   ├── Summary/            — Post-session results
│   ├── History/            — Past sessions + leaderboard
│   └── RingLight/          — Ring light controls drawer
└── styles/
    └── themes.js           — Theme definitions + color presets
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Camera | WebRTC `getUserMedia` |
| Bubble CV | OpenCV.js (CDN) |
| Punch AI | MediaPipe Hands Tasks Vision |
| Auth | Firebase Auth (Email + Google) |
| Database | Firebase Firestore |
| Storage | Firebase Storage |
| Hosting | Firebase Hosting |
| Recording | MediaRecorder API |
| Testing | Vitest + Testing Library |

## Unit Tests

```bash
npm test          # run all tests
npm run coverage  # with coverage report
```

Tests cover:
- `bubbleDetector` — tracking, pop counting, reset
- `punchDetector` — velocity calculation, speed rating classification
- `speedCalculator` — pixel-to-cm conversion, km/h output, averages
- `sessionTimer` — countdown accuracy, start/stop/reset
- `ringLight` — state changes via context dispatch
- `recorder` — MediaRecorder start/stop/save flow
- `firestoreSession` — Firestore document structure validation

---

## Scripts

| Command | Action |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build locally |
| `npm test` | Run all unit tests |
| `npm run coverage` | Test coverage report |
| `npx firebase deploy` | Deploy to Firebase Hosting |
