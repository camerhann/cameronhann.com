# cameronhann.com

Chris Cameron-Hann's personal site: essays on flood hydrology and forecasting, his CV, his X feed, and links to Aegaea, 7Analytics, Hydrometric, and the live forecast at forecast.cameronhann.com. Next.js (App Router) + MDX + Tailwind CSS, hosted on Cloudflare Workers via OpenNext.

```
npm install
npm run dev        # local dev
npm run build      # production build
npx wrangler deploy
```

Articles live in `src/app/articles/<slug>/page.mdx` and must also be added to the bundled registry in `src/lib/articles.ts`.

Every X Article is cross-published here with its original X publication date and a link to the canonical X post.
