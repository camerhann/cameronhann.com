import fs from 'node:fs'
import path from 'node:path'

/**
 * Read the public site constants verification needs from source.
 * These are not secrets. The parsers stay on the source files so the
 * feature map updates when articles, Work cards, or nav links change.
 */

export function readPublicSite(root) {
  const source = fs.readFileSync(path.join(root, 'src/lib/site.ts'), 'utf8')
  const forecast = readObjectBlock(source, 'forecast')
  const x = readObjectBlock(source, 'x')
  return {
    forecast: {
      href: readStringField(forecast, 'href'),
      label: readStringField(forecast, 'label'),
      name: readStringField(forecast, 'name'),
    },
    x: {
      href: readStringField(x, 'href'),
      handle: readStringField(x, 'handle'),
      label: readStringField(x, 'label'),
    },
  }
}

export function listArticles(root) {
  const articlesDir = path.join(root, 'src/app/articles')
  const folders = new Set(
    fs
      .readdirSync(articlesDir, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isDirectory() &&
          fs.existsSync(path.join(articlesDir, entry.name, 'page.mdx')),
      )
      .map((entry) => entry.name),
  )
  const registrySource = fs.readFileSync(
    path.join(root, 'src/lib/articles.ts'),
    'utf8',
  )
  const registered = [...registrySource.matchAll(/slug:\s*'([^']+)'/g)].map(
    (match) => match[1],
  )
  const slugs = [...new Set([...folders, ...registered])].sort()

  return slugs.map((slug) => {
    const inFolder = folders.has(slug)
    const registrations = registered.filter((item) => item === slug).length
    let meta = { title: null, date: null, description: null, author: null }
    if (inFolder) {
      meta = readArticleMeta(
        fs.readFileSync(path.join(articlesDir, slug, 'page.mdx'), 'utf8'),
        slug,
      )
    }
    return {
      slug,
      inFolder,
      registered: registrations > 0,
      duplicate: registrations > 1,
      ...meta,
    }
  })
}

export function listProjectCards(root, site = readPublicSite(root)) {
  const source = fs.readFileSync(
    path.join(root, 'src/app/projects/page.tsx'),
    'utf8',
  )
  const array = source.match(/const projects = \[([\s\S]*?)\n\]/)
  if (!array) {
    throw new Error('Could not find the projects array in src/app/projects/page.tsx')
  }
  return splitTopLevelObjects(array[1]).map((chunk) => {
      const link = chunk.match(/link:\s*\{([\s\S]*?)\}/)
      const name = resolveSiteExpr(readRawField(chunk, 'name'), site)
      const href = link ? resolveSiteExpr(readRawField(link[1], 'href'), site) : null
      const label = link
        ? resolveSiteExpr(readRawField(link[1], 'label'), site)
        : null
      return { name, href, label, surface: '/projects' }
    })
}

export function listHomeWork(root) {
  const source = fs.readFileSync(
    path.join(root, 'src/components/Resume.tsx'),
    'utf8',
  )
  const array = source.match(/const roles: Array<Role> = \[([\s\S]*?)\n\]/)
  if (!array) {
    throw new Error('Could not find the home Work roles in src/components/Resume.tsx')
  }
  return splitTopLevelObjects(array[1]).map((chunk) => ({
      company: readStringField(chunk, 'company'),
      title: readStringField(chunk, 'title'),
      surface: '/',
    }))
}

export function listNavLinks(root, site = readPublicSite(root)) {
  const header = fs.readFileSync(
    path.join(root, 'src/components/Header.tsx'),
    'utf8',
  )
  const footer = fs.readFileSync(
    path.join(root, 'src/components/Footer.tsx'),
    'utf8',
  )
  const links = []

  function add(surface, href, label) {
    if (!href || !label) return
    links.push({ surface, href, label: label.trim() })
  }

  if (header.includes('href="/"') && header.includes('aria-label="Home"')) {
    add('header', '/', 'Home')
  }

  for (const source of [
    ['header', header],
    ['footer', footer],
  ]) {
    const [surface, text] = source
    for (const match of text.matchAll(
      /<(?:NavItem|MobileNavItem|NavLink) href="([^"]+)">([^<]+)<\/(?:NavItem|MobileNavItem|NavLink)>/g,
    )) {
      add(surface, match[1], match[2])
    }
    for (const match of text.matchAll(
      /<(?:NavItem|MobileNavItem|NavLink) href=\{works\.forecast\.href\}>([^<]+)<\/(?:NavItem|MobileNavItem|NavLink)>/g,
    )) {
      add(surface, site.forecast.href, match[1])
    }
  }

  const footerForecast = footer.match(
    /<a[\s\S]*?href=\{works\.forecast\.href\}[\s\S]*?>([\s\S]*?)<\/a>/,
  )
  if (footerForecast) {
    add('footer', site.forecast.href, footerForecast[1])
  }
  if (footer.includes('href={social.x.href}')) {
    add('footer', site.x.href, site.x.handle)
  }

  return links
}

export function featuredArticle(articles) {
  const ready = articles.filter((article) => article.inFolder && article.date)
  ready.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return a.slug.localeCompare(b.slug)
  })
  return ready[0] ?? null
}

function readArticleMeta(source, slug) {
  const block = source.match(/export const article = \{([\s\S]*?)\n\}/)
  if (!block) {
    return { title: null, date: null, description: null, author: null, slug }
  }
  return {
    title: readStringField(block[1], 'title'),
    date: readStringField(block[1], 'date'),
    description: readStringField(block[1], 'description'),
    author: readStringField(block[1], 'author'),
  }
}

function splitTopLevelObjects(arrayBody) {
  const objects = []
  let depth = 0
  let start = -1
  let quote = ''
  for (let index = 0; index < arrayBody.length; index += 1) {
    const char = arrayBody[index]
    if (quote) {
      if (char === '\\') {
        index += 1
        continue
      }
      if (char === quote) quote = ''
      continue
    }
    if (char === "'" || char === '"' || char === '`') {
      quote = char
      continue
    }
    if (char === '{') {
      if (depth === 0) start = index
      depth += 1
    } else if (char === '}') {
      depth -= 1
      if (depth === 0 && start >= 0) {
        objects.push(arrayBody.slice(start, index + 1))
        start = -1
      }
    }
  }
  return objects
}

function readObjectBlock(source, name) {
  const match = source.match(
    new RegExp(`${name}:\\s*\\{([\\s\\S]*?)\\n\\s*\\},`),
  )
  if (!match) {
    throw new Error(`Could not parse "${name}" in src/lib/site.ts`)
  }
  return match[1]
}

export function readStringField(block, field) {
  const start = block.search(new RegExp(`(?:^|\\n)\\s*${field}\\s*:`))
  if (start < 0) return null
  let index = block.indexOf(':', start) + 1
  while (index < block.length && /\s/.test(block[index])) index += 1
  const quote = block[index]
  if (quote !== "'" && quote !== '"' && quote !== '`') return null
  index += 1
  let value = ''
  while (index < block.length) {
    const char = block[index]
    if (char === '\\') {
      value += block[index + 1] ?? ''
      index += 2
      continue
    }
    if (char === quote) return value
    value += char
    index += 1
  }
  return null
}

function readRawField(block, field) {
  const match = block.match(new RegExp(`\\b${field}\\s*:\\s*([^,\\n]+)`))
  return match ? match[1].trim() : null
}

function resolveSiteExpr(expr, site) {
  if (!expr) return null
  if (
    (expr.startsWith("'") && expr.endsWith("'")) ||
    (expr.startsWith('"') && expr.endsWith('"'))
  ) {
    return expr.slice(1, -1)
  }
  if (expr === 'works.forecast.name') return site.forecast.name
  if (expr === 'works.forecast.href') return site.forecast.href
  if (expr === 'works.forecast.label') return site.forecast.label
  return null
}
