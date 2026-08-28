export type XPost = {
  id: string
  text: string
  createdAt: string | null
}

const SCREEN_NAME = 'camerhann'
const TIMELINE_URLS = [
  `https://syndication.twitter.com/srv/timeline-profile/screen-name/${SCREEN_NAME}`,
  `https://syndication.twitter.com/srv/timeline-profile/screen-name/${SCREEN_NAME}?dnt=true`,
]

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function collectPosts(node: unknown, out: Map<string, XPost>) {
  if (!node || typeof node !== 'object') {
    return
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      collectPosts(item, out)
    }
    return
  }

  let record = asRecord(node)
  if (!record) {
    return
  }

  let legacy = asRecord(record.legacy)
  let core = asRecord(record.core)
  let id = String(record.rest_id ?? record.id_str ?? legacy?.id_str ?? '')
  let text = String(legacy?.full_text ?? record.full_text ?? record.text ?? '')
  let createdAt = String(
    legacy?.created_at ?? record.created_at ?? core?.created_at ?? '',
  )

  if (/^\d{8,}$/.test(id) && text.length > 1 && !out.has(id)) {
    let user = asRecord(record.user)
    let userLegacy = asRecord(user?.legacy)
    let screenName = String(
      asRecord(record.core)?.screen_name ??
        userLegacy?.screen_name ??
        asRecord(user)?.screen_name ??
        '',
    )
    let retweeted = Boolean(
      legacy?.retweeted_status_id_str ??
      record.retweeted_status ??
      asRecord(record.retweeted_status_result),
    )
    if (
      !retweeted &&
      !text.startsWith('RT @') &&
      (!screenName || screenName === SCREEN_NAME)
    ) {
      out.set(id, {
        id,
        text: text
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>'),
        createdAt: createdAt || null,
      })
    }
  }

  for (let value of Object.values(record)) {
    collectPosts(value, out)
  }
}

function parseTimelineHtml(html: string): XPost[] {
  let posts = new Map<string, XPost>()
  let nextData = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  )
  if (nextData) {
    try {
      collectPosts(JSON.parse(nextData[1]), posts)
    } catch {
      // fall through to a raw walk of any JSON blobs
    }
  }
  if (posts.size === 0) {
    for (let match of html.matchAll(
      /<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/g,
    )) {
      try {
        collectPosts(JSON.parse(match[1]), posts)
      } catch {
        // ignore
      }
    }
  }
  return [...posts.values()].sort((a, b) => (a.id < b.id ? 1 : -1))
}

export async function getXPosts(limit = 6): Promise<XPost[]> {
  let headers = {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
  }

  for (let url of TIMELINE_URLS) {
    try {
      let response = await fetch(url, {
        headers,
        next: { revalidate: 300 },
      })
      if (!response.ok) {
        continue
      }
      let html = await response.text()
      let posts = parseTimelineHtml(html)
      if (posts.length > 0) {
        return posts.slice(0, limit)
      }
    } catch {
      // try the next source
    }
  }

  return []
}

export function postHref(id: string) {
  return `https://x.com/${SCREEN_NAME}/status/${id}`
}

export function formatPostTime(value: string | null) {
  if (!value) {
    return null
  }
  let date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })
}
