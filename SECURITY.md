# Security

This document describes the security measures used in the VSPD and Gravitational Time Microscope static sites and how to harden them when deployed.

## What’s in place (client-side)

- **Referrer-Policy** (meta): `strict-origin-when-cross-origin` on all HTML pages so full URLs are not sent to other origins when following links.
- **Content-Security-Policy (CSP)** (meta): Each page has a CSP that:
  - Restricts scripts and styles to the site and, where needed, specific CDNs (Tailwind, MathJax, polyfill.io).
  - Restricts images, forms, and base URL to the same origin (plus `data:` / `https:` where required for CDN assets).
  - Uses `frame-ancestors 'self'` so the site can only be embedded in same-origin frames (clickjacking mitigation where supported).

Main VSPD pages (no CDN) use a strict CSP (`script-src 'self'`, `style-src 'self'`). Pages that use CDNs allow only those CDN hosts and `'unsafe-inline'` where inline scripts/styles are required.

## Recommended server / deployment settings

For stronger security, configure your web server or host to send these **HTTP response headers** (meta tags cannot set all of these):

| Header | Recommended value | Purpose |
|--------|-------------------|--------|
| **Strict-Transport-Security** | `max-age=31536000; includeSubDomains` | Enforce HTTPS (use only over HTTPS). |
| **X-Frame-Options** | `SAMEORIGIN` or `DENY` | Prevent embedding in iframes (clickjacking). |
| **X-Content-Type-Options** | `nosniff` | Prevent MIME sniffing. |
| **Content-Security-Policy** | (same as or stricter than meta) | Prefer header over meta when possible. |
| **Referrer-Policy** | `strict-origin-when-cross-origin` | Limit referrer sent to other sites. |
| **Permissions-Policy** | e.g. `camera=(), microphone=(), geolocation=()` | Disable unneeded browser features. |

### Example (Nginx)

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

### Example (Apache)

```apache
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
```

### Hosting (Netlify, Vercel, GitHub Pages, etc.)

- Use **HTTPS only** (usually default).
- Add the headers above via the platform’s config (e.g. `_headers` on Netlify, `vercel.json` on Vercel, or equivalent).

## Scope and limits

- These are **static** sites: no server-side app, no database, no user auth. Risk is mainly XSS, clickjacking, and abuse of third-party scripts.
- CSP and headers reduce the impact of injected script and limit who can embed or misuse the site. They do not replace secure coding if you add dynamic or user-driven content later.
- The About contact form uses `mailto:` only; no data is sent to your server. Still avoid putting raw user input into the page without sanitization if you change that later.

## Reporting issues

If you find a security concern in this project, please report it privately (e.g. via the contact on the About page or your preferred channel) rather than in a public issue.
