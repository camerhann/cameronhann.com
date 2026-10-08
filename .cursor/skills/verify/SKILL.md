---
name: verify
description: Run the cameronhann.com pre-review verification and attach its evidence to a pull request. Use before asking Chris to review, merge, or deploy, or when someone asks to verify the site.
---

# Verify cameronhann.com

Chris approves merges and deploys only when a pull request includes the evidence from `npm run verify`. Run it yourself. Do not treat GitHub Actions as a substitute: billing on this account can block CI.

The command does not deploy and does not need Cloudflare credentials.

## When to run it

- Before opening a pull request, or before asking for review on one that already exists.
- After any change to articles, Work cards, navigation, layout, or the build.
- Again after you fix something the previous run reported. Attach the new output.

## How to run it

From a clean install:

```bash
npm install --legacy-peer-deps
npm run verify
```

`npm install` without `--legacy-peer-deps` currently fails because `@opennextjs/cloudflare@1.20.2` asks for `next@>=16.2.11` while the repo pins `next@16.2.6`. That conflict is existing. Do not bump Next just to make install quieter.

`npm run verify` then runs, in order:

1. `next build` (production build)
2. `eslint`
3. `tsc --noEmit`
4. `npm test` (article registry, Work cards, nav)
5. `opennextjs-cloudflare build` and `opennextjs-cloudflare preview` on 127.0.0.1 (wrangler dev, local only)
6. Smoke checks against that preview
7. Playwright screenshots via the system Chrome/Chromium
8. Internal link and Work/nav link checks
9. `.verify/summary.md` and `.verify/feature-map.md`

Useful flags:

```bash
npm run verify -- --port 8787
npm run verify -- --output .verify
node scripts/verify.mjs --help
```

If Chrome is not on `PATH`, set `CHROME_PATH` to the executable. The script does not download a browser.

If a step genuinely cannot run without a secret, the summary marks it `skipped` and says why. Do not hide that. A skipped preview means there are no screenshots, so the run is not evidence Chris can approve.

## What to attach

`.verify/` is gitignored. Do not commit it.

Paste `.verify/summary.md` into the pull request description. It already contains the step results and the feature map. Also embed the desktop and mobile screenshots of the home page and one article:

- `.verify/screenshots/home-desktop.png`
- `.verify/screenshots/home-mobile.png`
- `.verify/screenshots/article-<slug>-desktop.png`
- `.verify/screenshots/article-<slug>-mobile.png`

The other screenshots (about, writing, work, 404) can go in the description too. Keep logs in `.verify/logs/` for the failures the summary quotes.

Leave the pull request as a draft when the overall result is `FAIL`.

## What the checks mean

- Articles live in `src/app/articles/<slug>/page.mdx` and must be registered in `src/lib/articles.ts`. Tests fail if either side is missing, or if `title`, `date`, or `description` is missing.
- Linked Work cards are the `projects` array on `/projects`. The home page Work list is the résumé and those rows have no links. The feature map records both.
- Smoke expects 200 for `/`, `/about`, `/articles`, `/projects`, every article, `/feed.xml`, `/sitemap.xml`, and `/robots.txt`, and 404 with "Page not found" for an unknown path.
- A remote 401, 403, or 429 is recorded as blocked, not as a broken link. Other non-2xx results fail the links step.

## Do not

- Do not deploy (`npm run deploy`, `wrangler deploy`).
- Do not add Cloudflare tokens to make the preview "more real".
- Do not commit `.verify/`.
