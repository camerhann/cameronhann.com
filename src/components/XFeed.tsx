'use client'

import { useEffect, useRef, useState } from 'react'

import { social } from '@/lib/site'

declare global {
  interface Window {
    twttr?: {
      ready: (cb: (twttr: NonNullable<Window['twttr']>) => void) => void
      widgets: {
        createTimeline: (
          source: { sourceType: string; screenName: string },
          target: HTMLElement,
          options?: Record<string, unknown>,
        ) => Promise<HTMLElement | undefined>
      }
    }
  }
}

const SCRIPT_SRC = 'https://platform.x.com/widgets.js'

function loadWidgetsScript(): Promise<void> {
  if (window.twttr?.widgets) {
    return Promise.resolve()
  }

  let existing = document.querySelector<HTMLScriptElement>(
    `script[src="${SCRIPT_SRC}"]`,
  )
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener(
        'error',
        () => reject(new Error('widgets.js')),
        {
          once: true,
        },
      )
    })
  }

  return new Promise((resolve, reject) => {
    let script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.charset = 'utf-8'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('widgets.js'))
    document.body.appendChild(script)
  })
}

export function XFeed() {
  let nodeRef = useRef<HTMLDivElement>(null)
  let [status, setStatus] = useState<'loading' | 'ready' | 'blocked'>('loading')

  useEffect(() => {
    let node = nodeRef.current
    if (!node) {
      return
    }

    let cancelled = false
    let timeout = window.setTimeout(() => {
      if (!cancelled && !node.querySelector('iframe')) {
        setStatus('blocked')
      }
    }, 5000)

    loadWidgetsScript()
      .then(() => {
        if (cancelled || !node) {
          return
        }
        let twttr = window.twttr
        if (!twttr?.widgets) {
          throw new Error('no widgets')
        }
        node.replaceChildren()
        return twttr.widgets.createTimeline(
          { sourceType: 'profile', screenName: 'camerhann' },
          node,
          {
            height: 560,
            chrome: 'noheader nofooter noborders',
            tweetLimit: 6,
            dnt: true,
          },
        )
      })
      .then((element) => {
        if (cancelled) {
          return
        }
        if (element || node.querySelector('iframe')) {
          setStatus('ready')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('blocked')
        }
      })

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [])

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
      <div
        ref={nodeRef}
        className={status === 'blocked' ? 'hidden' : 'mt-4 min-h-40'}
      />
      {status === 'loading' && (
        <p className="mt-4 text-sm text-zinc-400 dark:text-zinc-500">
          Loading posts…
        </p>
      )}
      {status === 'blocked' && (
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          The live timeline is on X.{' '}
          <a
            href={social.x.href}
            className="font-medium text-teal-500 hover:text-teal-600"
          >
            Open {social.x.handle}
          </a>
          .
        </p>
      )}
    </div>
  )
}
