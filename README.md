# cameronhann.com

Chris Cameron-Hann's personal site: essays on flood hydrology and forecasting, his CV, his X feed, and links to Aegaea, 7Analytics, Hydrometric, and the live forecast at forecast.cameronhann.com. Next.js (App Router) + MDX + Tailwind CSS, hosted on Cloudflare Workers via OpenNext.

```
npm install
npm run dev        # local dev
npm run build      # production build
npx wrangler deploy
```

Articles live in `src/app/articles/<slug>/page.mdx` and must also be added to the bundled registry in `src/lib/articles.ts`.

## Verification

Before a review, merge, or deploy, run `npm run verify`. It builds the site, lints, type-checks, tests the article registry, and smoke-checks a local Cloudflare Workers preview. It does not deploy and it does not need Cloudflare credentials. The run writes `.verify/summary.md` (paste this into the pull request), `.verify/feature-map.md`, and desktop plus mobile screenshots in `.verify/screenshots/`. That folder is gitignored. Details: `.cursor/skills/verify/SKILL.md`.

`npm install` currently fails on the peer range between `next@16.2.6` and `@opennextjs/cloudflare@1.20.2`. Install with `npm install --legacy-peer-deps` until those versions are aligned. Screenshots use a local Chrome or Chromium (`CHROME_PATH` if it is not on `PATH`).

Every X Article is cross-published here with its original X publication date and a link to the canonical X post.
