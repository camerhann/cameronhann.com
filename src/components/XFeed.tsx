'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'

import { social } from '@/lib/site'

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (el?: HTMLElement) => void
      }
    }
  }
}

export function XFeed({ height = 560 }: { height?: number }) {
  let { resolvedTheme } = useTheme()
  let theme = resolvedTheme === 'dark' ? 'dark' : 'light'

  useEffect(() => {
    if (window.twttr?.widgets) {
      window.twttr.widgets.load()
      return
    }

    if (
      document.querySelector(
        'script[src="https://platform.twitter.com/widgets.js"]',
      )
    ) {
      return
    }

    let script = document.createElement('script')
    script.src = 'https://platform.twitter.com/widgets.js'
    script.async = true
    document.body.appendChild(script)
  }, [theme])

  return (
    <div className="rounded-2xl border border-zinc-100 p-6 dark:border-zinc-700/40">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          On X
        </h2>
        <a
          href={social.x.href}
          rel="me"
          className="text-sm font-medium text-teal-500 transition hover:text-teal-600 dark:hover:text-teal-400"
        >
          {social.x.handle}
        </a>
      </div>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Short versions of the work, posted as I do it.
      </p>
      <div className="mt-4 min-h-40 overflow-hidden">
        <a
          key={theme}
          className="twitter-timeline"
          href={`${social.x.href}?ref_src=twsrc%5Etfw`}
          data-height={String(height)}
          data-theme={theme}
          data-chrome="noheader nofooter noborders transparent"
        >
          Posts by {social.x.handle}
        </a>
      </div>
    </div>
  )
}
