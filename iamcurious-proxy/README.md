# I Am Curious Proxy (Cloudflare Worker)

This worker keeps AI keys off the browser and calls a free-tier model through OpenRouter.

## 1) Install and login

```bash
npm install -g wrangler
wrangler login
```

## 2) Set secret

```bash
cd iamcurious-proxy
wrangler secret put OPENROUTER_API_KEY
```

## 3) Deploy

```bash
wrangler deploy
```

Copy the deployed URL, for example:

`https://iamcurious-proxy.<your-subdomain>.workers.dev`

## 4) Point frontend to proxy

Create `iamcurious/.env` with:

```bash
VITE_AI_PROXY_URL=https://iamcurious-proxy.<your-subdomain>.workers.dev
```

Then rebuild:

```bash
cd iamcurious
npm install
npm run build
```

## Notes

- Default model is free-tier: `meta-llama/llama-3.1-8b-instruct:free`
- You can change model in `iamcurious-proxy/wrangler.toml` (`OPENROUTER_MODEL`)
- Optional: set `ALLOWED_ORIGIN` in `wrangler.toml` to restrict browser origin
