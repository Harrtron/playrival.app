# AGENTS.md

## Cursor Cloud specific instructions

This repository is a **static website** for `playrival.app` (the RIVAL marketing site), deployed via **GitHub Pages** (see `CNAME`, `.nojekyll`). There is **no build step, no package manager, no automated test suite, and no lint tooling**. The "application" is the set of static HTML/CSS/JS files served as-is.

### Running the site (development)

Serve the repo root over HTTP with any static file server, for example:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000/index.html`. Opening the HTML files directly via `file://` can break root-relative asset paths and some browser behaviors, so always serve over HTTP.

There is no hot reload — after editing a file, refresh the browser (hard refresh, since assets are cache-busted with `?v=<N>`; see `.cursor/rules/cache-busting-assets.mdc`).

### Structure

- Root pages: `index.html`, `privacy.html`, `terms.html`.
- Nested pages: `download/`, `support/`, `community/`, `manifesto/`, `code-of-conduct/`, `elite/`, `tiktok-download/`, `account-deletion-request/`.
- `css/main.css`, `js/*.js` are the local assets (nested pages reference them as `../css/` and `../js/`).
- The email signup form on `index.html` posts to an external **Brevo (sibforms.com)** endpoint; it will not work offline and submitting sends real data — avoid submitting it during testing. The interactive carousel/galaxy section (`js/galaxy.js`, navigation dots + prev/next arrows) is client-side and safe to exercise.

### Cursor rules that must be respected

- Local `.css`/`.js` references from HTML must carry a `?v=<integer>` cache-busting query; bump it when editing those files (`.cursor/rules/cache-busting-assets.mdc`).
- Every deployed HTML page needs the Google Analytics Consent Mode v2 tag and `js/analytics.js` (`.cursor/rules/google-analytics.mdc`).

### Optional tooling

`scripts/*.py` are one-off image/asset generation utilities that require **Pillow** (`pip install Pillow`). They are not needed to run or develop the site and are not part of the update script.
