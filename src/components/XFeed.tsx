'use client'

import { useEffect, useRef, useState } from 'react'

import { social } from '@/lib/site'
import { formatPostTime, postHref, type XPost } from '@/lib/x'

declare global {
  interface Window {
    twttr?: {
      widgets: {
        createTimeline: (
          source: { sourceType: string; screenName: string },
          target: HTMLElement,
          options?: Record<string, unknown>,
        ) => Promise<HTMLElement>
      }
    }
  }
}

function TimelineEmbed() {
  let nodeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let node = nodeRef.current
    if (!node) {
      return
    }

    let cancelled = false

    function create() {
      if (cancelled || !node || !window.twttr?.widgets) {
        return
      }
      node.replaceChildren()
      window.twttr.widgets.createTimeline(
        { sourceType: 'profile', screenName: 'camerhann' },
        node,
        {
          height: 520,
          chrome: 'noheader nofooter noborders',
          tweetLimit: 6,
          dnt: true,
        },
      )
    }

    if (window.twttr?.widgets) {
      create()
      return
    }

    let src = 'https://platform.x.com/widgets.js'
    let existing = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`,
    )
    if (existing) {
      existing.addEventListener('load', create, { once: true })
      return () => {
        cancelled = true
      }
    }

    let script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = create
    document.body.appendChild(script)

    return () => {
      cancelled = true
    }
  }, [])

  return <div ref={nodeRef} className="mt-4 min-h-40" />
}

export function XFeed() {
  let [posts, setPosts] = useState<XPost[] | null>(null)

  useEffect(() => {
    let ignore = false
    fetch('/api/x-feed')
      .then((response) => (response.ok ? response.json() : { posts: [] }))
      .then((data: { posts?: XPost[] }) => {
        if (!ignore) {
          setPosts(Array.isArray(data.posts) ? data.posts : [])
        }
      })
      .catch(() => {
        if (!ignore) {
          setPosts([])
        }
      })
    return () => {
      ignore = true
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
      {posts === null ? (
        <p className="mt-4 text-sm text-zinc-400 dark:text-zinc-500">
          Loading posts…
        </p>
      ) : posts.length > 0 ? (
        <ol className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-700/40">
          {posts.map((post) => {
            let when = formatPostTime(post.createdAt)
            return (
              <li key={post.id} className="py-3 first:pt-0 last:pb-0">
                <a
                  href={postHref(post.id)}
                  className="block text-sm text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  <p className="whitespace-pre-wrap">{post.text}</p>
                  {when && (
                    <time className="mt-2 block text-xs text-zinc-400 dark:text-zinc-500">
                      {when}
                    </time>
                  )}
                </a>
              </li>
            )
          })}
        </ol>
      ) : (
        <TimelineEmbed />
      )}
    </div>
  )
}
