# I Am Curious App

## Environment (`iamcurious/.env`)

```bash
VITE_AI_PROXY_URL=https://iamcurious-proxy.<your-subdomain>.workers.dev

VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
```

Notes:
- `VITE_AI_PROXY_URL` is required for AI responses.
- Firebase vars are required for Google parent sign-in and cloud journal sync.
- Child exploration flow still works without Firebase, but parent Google sign-in will be unavailable.

## Build

```bash
npm install
npm run build
```
