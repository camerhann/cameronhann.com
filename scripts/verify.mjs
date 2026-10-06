#!/usr/bin/env node
/**
 * Pre-review verification for cameronhann.com.
 *
 * Runs, in order: production build, lint, type-check, tests, then a local
 * OpenNext/wrangler preview. Against that preview it smoke-checks routes,
 * screenshots key pages, and writes a feature map plus a PR summary.
 *
 * It does not deploy and it does not need Cloudflare credentials.
 * Evidence is written to .verify/ (gitignored).
 *
 * Usage:
 *   npm run verify
 *   node scripts/verify.mjs --help
 */
import { execFileSync, spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as cheerio from 'cheerio'

import {
  featuredArticle,
  listArticles,
  listHomeWork,
  listNavLinks,
  listProjectCards,
  readPublicSite,
} from './verify/catalog.mjs'
import { renderFeatureMap, renderSummary } from './verify/report.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
let previewHandle = null
const DEFAULT_SITE_URL = 'https://cameronhann.com'
const SITE_HOSTS = new Set(['cameronhann.com', 'www.cameronhann.com'])

const HELP = `verify — production build, lint, types, tests, and a local Workers preview

Usage:
  npm run verify
  node scripts/verify.mjs [--port <n>] [--output <dir>]

Options:
  --port <n>      Local preview port (default: 8787)
  --output <dir>  Evidence directory, relative to the repo (default: .verify)
  --help          Show this help

Examples:
  npm run verify
  npm run verify -- --port 8787
  npm run verify -- --output .verify

The preview uses \`opennextjs-cloudflare preview\` (wrangler dev --local).
Nothing is deployed. Cloudflare credentials are not required.
If a step cannot run without a secret, it is skipped with a message.
Output (gitignored): <output>/summary.md, <output>/feature-map.md, <output>/screenshots/
`

function parseArgs(argv) {
  const options = { port: 8787, output: '.verify', help: false }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--help' || arg === '-h') {
      options.help = true
      continue
    }
    if (arg === '--port') {
      const value = argv[++index]
      const port = Number(value)
      if (!value || !Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error(
          `Invalid --port.\n  npm run verify -- --port 8787`,
        )
      }
      options.port = port
      continue
    }
    if (arg === '--output') {
      const value = argv[++index]
      if (!value || value.startsWith('-')) {
        throw new Error(
          `Invalid --output.\n  npm run verify -- --output .verify`,
        )
      }
      options.output = value
      continue
    }
    throw new Error(
      `Unknown argument "${arg}".\n  npm run verify -- --help`,
    )
  }
  return options
}

function redact(text) {
  return String(text)
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, 'Bearer [redacted]')
    .replace(
      /(CLOUDFLARE_API_TOKEN|CF_API_TOKEN|API_TOKEN|Authorization)\s*[:=]\s*\S+/gi,
      '$1=[redacted]',
    )
}

function tail(text, lines = 30) {
  const clean = redact(text).trim()
  if (!clean) return ''
  return clean.split('\n').slice(-lines).join('\n')
}

function gitValue(args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
}

function publicSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return { url: process.env.NEXT_PUBLIC_SITE_URL, source: 'environment' }
  }
  const example = path.join(root, '.env.example')
  if (fs.existsSync(example)) {
    const match = fs
      .readFileSync(example, 'utf8')
      .match(/^NEXT_PUBLIC_SITE_URL=(.+)$/m)
    if (match) {
      return { url: match[1].trim(), source: '.env.example' }
    }
  }
  return { url: DEFAULT_SITE_URL, source: 'default' }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function runCommand(command, args, { env, logPath, timeoutMs }) {
  ensureDir(path.dirname(logPath))
  fs.writeFileSync(logPath, `$ ${command} ${args.join(' ')}\n`)
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: root,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let output = ''
    const append = (chunk) => {
      const text = chunk.toString()
      output += text
      fs.appendFileSync(logPath, text)
    }
    child.stdout.on('data', append)
    child.stderr.on('data', append)
    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      output += `\nTimed out after ${timeoutMs}ms\n`
      fs.appendFileSync(logPath, `\nTimed out after ${timeoutMs}ms\n`)
    }, timeoutMs)
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ code: code ?? 1, output })
    })
  })
}

class StepSkip extends Error {
  constructor(message) {
    super(message)
    this.skip = true
  }
}

function looksLikeMissingSecret(output) {
  return /wrangler login|not authenticated|authentication error|CLOUDFLARE_API_TOKEN|code:\s*10000|No account id found|You must be logged in/i.test(
    output,
  )
}

async function fetchText(url, timeoutMs = 20000) {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        'user-agent': 'cameronhann-verify/1.0 (+https://cameronhann.com)',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })
    const body = await response.text()
    return {
      ok: response.ok,
      status: response.status,
      finalUrl: response.url,
      contentType: response.headers.get('content-type') ?? '',
      body,
      error: '',
    }
  } catch (error) {
    const message = error?.name === 'TimeoutError' ? 'timeout' : error.message
    return {
      ok: false,
      status: 0,
      finalUrl: url,
      contentType: '',
      body: '',
      error: message,
    }
  }
}

function classifyRemote(result) {
  if (result.error) return `error: ${result.error}`
  if (result.status >= 200 && result.status < 300) return String(result.status)
  if (result.status === 401 || result.status === 403 || result.status === 429) {
    return `${result.status} blocked`
  }
  return String(result.status)
}

function isHardFailure(label) {
  if (!label || label === 'not checked' || label === 'no link') return false
  if (label.endsWith('blocked')) return false
  if (label.startsWith('error:')) return true
  const status = Number(String(label).match(/^\d+/)?.[0])
  return Number.isInteger(status) && (status < 200 || status >= 400)
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    '/usr/local/bin/google-chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ].filter(Boolean)
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }
  for (const command of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    try {
      const found = execFileSync('which', [command], { encoding: 'utf8' }).trim()
      if (found) return found
    } catch {
      // try the next name
    }
  }
  return ''
}

function loadCheerio(html) {
  if (typeof cheerio.load === 'function') return cheerio.load(html)
  if (cheerio.default && typeof cheerio.default.load === 'function') {
    return cheerio.default.load(html)
  }
  throw new Error('cheerio.load is not available')
}

function toInternalPath(raw, pageUrl, previewOrigin) {
  if (!raw || raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('javascript:')) {
    return null
  }
  let url
  try {
    url = new URL(raw, pageUrl)
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  const preview = new URL(previewOrigin)
  const isPreview = url.host === preview.host
  const isSite = SITE_HOSTS.has(url.hostname)
  if (!isPreview && !isSite) return null
  if (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/cdn-cgi/')) {
    return null
  }
  return `${url.pathname}${url.search}`
}

async function mapPool(items, limit, fn) {
  const results = new Array(items.length)
  let cursor = 0
  async function worker() {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      results[index] = await fn(items[index], index)
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker())
  await Promise.all(workers)
  return results
}

function startPreview({ port, logPath, env }) {
  ensureDir(path.dirname(logPath))
  fs.writeFileSync(
    logPath,
    `$ npx --no-install opennextjs-cloudflare preview --local --ip 127.0.0.1 --port ${port} --no-show-interactive-dev-session --persist-to .verify/wrangler-state\n`,
  )
  const child = spawn(
    'npx',
    [
      '--no-install',
      'opennextjs-cloudflare',
      'preview',
      '--local',
      '--ip',
      '127.0.0.1',
      '--port',
      String(port),
      '--inspector-port',
      '0',
      '--no-show-interactive-dev-session',
      '--persist-to',
      path.join(root, '.verify/wrangler-state'),
    ],
    {
      cwd: root,
      env,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )
  let output = ''
  const append = (chunk) => {
    const text = chunk.toString()
    output += text
    fs.appendFileSync(logPath, text)
  }
  child.stdout.on('data', append)
  child.stderr.on('data', append)
  child.on('error', (error) => {
    output += `\n${error.message}\n`
    fs.appendFileSync(logPath, `\n${error.message}\n`)
  })
  return {
    child,
    get output() {
      return output
    },
  }
}

function stopPreview(child) {
  if (!child?.pid || child.killed) return
  try {
    process.kill(-child.pid, 'SIGTERM')
  } catch {
    try {
      child.kill('SIGTERM')
    } catch {
      // already gone
    }
  }
}

async function waitForPreview(preview, origin, timeoutMs) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    if (preview.child.exitCode !== null) {
      const output = preview.output
      if (looksLikeMissingSecret(output)) {
        throw new StepSkip(
          `Skipped the local preview because it asked for Cloudflare credentials. Nothing was deployed.\n${tail(output)}`,
        )
      }
      throw new Error(`Preview exited before it was ready.\n${tail(output)}`)
    }
    const probe = await fetchText(`${origin}/`, 3000)
    if (probe.status > 0) return probe
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  throw new Error(`Preview did not accept requests within ${timeoutMs}ms.\n${tail(preview.output)}`)
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    process.stdout.write(HELP)
    return
  }

  const outputDir = path.resolve(root, options.output)
  const logDir = path.join(outputDir, 'logs')
  const screenshotDir = path.join(outputDir, 'screenshots')
  ensureDir(logDir)
  ensureDir(screenshotDir)

  const siteUrl = publicSiteUrl()
  const env = {
    ...process.env,
    CI: '1',
    WRANGLER_SEND_METRICS: 'false',
    NEXT_PUBLIC_SITE_URL: siteUrl.url,
  }
  if (siteUrl.source !== 'environment') {
    process.stdout.write(
      `NEXT_PUBLIC_SITE_URL was unset. Using ${siteUrl.url} from ${siteUrl.source} so /feed.xml can build. This is the public site URL, not a secret.\n`,
    )
  }

  const commit = gitValue(['rev-parse', '--short', 'HEAD']) || 'unknown'
  const dirty = gitValue(['status', '--porcelain']).length > 0
  const steps = []
  const screenshots = []
  let previewUrl = ''
  let routeStatus = new Map()
  let linkStatus = new Map()
  let brokenInternal = []
  let checkedInternal = 0
  let pageHtml = new Map()

  const site = readPublicSite(root)
  const articles = listArticles(root)
  const projectCards = listProjectCards(root, site)
  const homeWork = listHomeWork(root)
  const navLinks = listNavLinks(root, site)
  SITE_HOSTS.add(new URL(siteUrl.url).hostname)

  async function step(name, fn) {
    const started = Date.now()
    process.stdout.write(`\n== ${name} ==\n`)
    try {
      const result = await fn()
      const record = {
        name,
        status: 'pass',
        ms: Date.now() - started,
        detail: result?.detail ?? 'ok',
        logTail: result?.logTail ?? '',
      }
      steps.push(record)
      process.stdout.write(`verify ${name} pass ${record.detail}\n`)
    } catch (error) {
      const record = {
        name,
        status: error?.skip ? 'skipped' : 'fail',
        ms: Date.now() - started,
        detail: error.message.split('\n')[0],
        logTail: tail(error.message),
      }
      steps.push(record)
      process.stdout.write(`verify ${name} ${record.status} ${record.detail}\n`)
    }
  }

  await step('build', async () => {
    const logPath = path.join(logDir, 'build.log')
    const result = await runCommand('npx', ['--no-install', 'next', 'build'], {
      env,
      logPath,
      timeoutMs: 10 * 60 * 1000,
    })
    if (result.code !== 0) {
      throw new Error(`next build exited ${result.code}\n${tail(result.output)}`)
    }
    return { detail: 'next build' }
  })

  await step('lint', async () => {
    const logPath = path.join(logDir, 'lint.log')
    const result = await runCommand('npx', ['--no-install', 'eslint'], {
      env,
      logPath,
      timeoutMs: 5 * 60 * 1000,
    })
    if (result.code !== 0) {
      throw new Error(`eslint exited ${result.code}\n${tail(result.output, 40)}`)
    }
    return { detail: 'eslint' }
  })

  await step('typecheck', async () => {
    const logPath = path.join(logDir, 'typecheck.log')
    const result = await runCommand('npx', ['--no-install', 'tsc', '--noEmit'], {
      env,
      logPath,
      timeoutMs: 5 * 60 * 1000,
    })
    if (result.code !== 0) {
      throw new Error(`tsc --noEmit exited ${result.code}\n${tail(result.output, 40)}`)
    }
    return { detail: 'tsc --noEmit' }
  })

  await step('test', async () => {
    const logPath = path.join(logDir, 'test.log')
    const result = await runCommand('npm', ['test'], {
      env,
      logPath,
      timeoutMs: 2 * 60 * 1000,
    })
    if (result.code !== 0) {
      throw new Error(`npm test exited ${result.code}\n${tail(result.output, 40)}`)
    }
    const passed = result.output.match(/# pass (\d+)/)
    return { detail: passed ? `${passed[1]} tests passed` : 'npm test' }
  })

  await step('preview', async () => {
    const buildLog = path.join(logDir, 'opennext-build.log')
    const build = await runCommand(
      'npx',
      ['--no-install', 'opennextjs-cloudflare', 'build'],
      { env, logPath: buildLog, timeoutMs: 10 * 60 * 1000 },
    )
    if (build.code !== 0) {
      if (looksLikeMissingSecret(build.output)) {
        throw new StepSkip(
          `Skipped the OpenNext build because it asked for Cloudflare credentials.\n${tail(build.output)}`,
        )
      }
      throw new Error(
        `opennextjs-cloudflare build exited ${build.code}\n${tail(build.output)}`,
      )
    }

    const origin = `http://127.0.0.1:${options.port}`
    const busy = await fetchText(`${origin}/`, 1500)
    if (busy.status > 0) {
      throw new Error(
        `Port ${options.port} is already in use.\n  npm run verify -- --port ${options.port + 1}`,
      )
    }

    const previewLog = path.join(logDir, 'preview.log')
    previewHandle = startPreview({ port: options.port, logPath: previewLog, env })
    await waitForPreview(previewHandle, origin, 3 * 60 * 1000)
    previewUrl = origin
    return { detail: origin }
  })

  const previewUp = steps.find((item) => item.name === 'preview')?.status === 'pass'

  await step('smoke', async () => {
    if (!previewUp) {
      throw new StepSkip('Skipped smoke checks because the preview is not running.')
    }
    const routes = [
      { name: 'home', path: '/', expect: 200 },
      { name: 'about', path: '/about', expect: 200 },
      { name: 'articles', path: '/articles', expect: 200 },
      { name: 'projects', path: '/projects', expect: 200 },
      ...articles
        .filter((article) => article.inFolder)
        .map((article) => ({
          name: `article ${article.slug}`,
          path: `/articles/${article.slug}`,
          expect: 200,
        })),
      { name: 'feed', path: '/feed.xml', expect: 200 },
      { name: 'sitemap', path: '/sitemap.xml', expect: 200 },
      { name: 'robots', path: '/robots.txt', expect: 200 },
      { name: 'not-found', path: '/verify-missing-page', expect: 404 },
    ]
    const results = []
    for (const route of routes) {
      const response = await fetchText(`${previewUrl}${route.path}`)
      pageHtml.set(route.path, response.body)
      const problems = []
      if (response.status !== route.expect) {
        problems.push(`expected ${route.expect}, got ${response.status || response.error}`)
      }
      if (route.path === '/feed.xml' && response.status === 200) {
        if (!/xml/i.test(response.contentType) || !/<rss[\s>]/i.test(response.body)) {
          problems.push('response was not an RSS document')
        }
        for (const article of articles.filter((item) => item.registered && item.title)) {
          if (!response.body.includes(article.title)) {
            problems.push(`feed is missing "${article.title}"`)
          }
        }
      }
      if (route.path === '/sitemap.xml' && response.status === 200) {
        if (!response.body.includes('<urlset')) problems.push('response was not a sitemap')
        for (const article of articles.filter((item) => item.registered)) {
          if (!response.body.includes(`/articles/${article.slug}`)) {
            problems.push(`sitemap is missing /articles/${article.slug}`)
          }
        }
      }
      if (route.name === 'not-found' && response.status === 404) {
        if (!response.body.includes('Page not found')) {
          problems.push('404 body did not include "Page not found"')
        }
      }
      const label = response.error
        ? `error: ${response.error}`
        : String(response.status)
      routeStatus.set(route.path, problems.length ? `${label} (${problems[0]})` : label)
      results.push({ ...route, problems })
      process.stdout.write(
        `  ${route.path} ${response.status || response.error}${problems.length ? ' FAIL' : ''}\n`,
      )
    }
    const failed = results.filter((route) => route.problems.length)
    if (failed.length) {
      throw new Error(
        `${failed.length} route check${failed.length === 1 ? '' : 's'} failed: ${failed
          .map((route) => `${route.path} ${route.problems[0]}`)
          .join('; ')}`,
      )
    }
    return { detail: `${results.length} routes matched` }
  })

  await step('screenshots', async () => {
    if (!previewUp) {
      throw new StepSkip('Skipped screenshots because the preview is not running.')
    }
    const chrome = findChrome()
    if (!chrome) {
      throw new Error(
        'No Chrome or Chromium binary found for screenshots. Set CHROME_PATH to a Chrome executable and rerun.\n  CHROME_PATH=/usr/bin/google-chrome npm run verify',
      )
    }
    let chromium
    try {
      ;({ chromium } = await import('playwright-core'))
    } catch (error) {
      throw new Error(
        `playwright-core is not installed (${error.message}).\n  npm install`,
      )
    }
    const featured = featuredArticle(articles)
    const pages = [
      { name: 'home', path: '/' },
      { name: 'about', path: '/about' },
      { name: 'articles', path: '/articles' },
      { name: 'projects', path: '/projects' },
      featured
        ? { name: `article-${featured.slug}`, path: `/articles/${featured.slug}` }
        : null,
      { name: 'not-found', path: '/verify-missing-page' },
    ].filter(Boolean)
    const widths = [
      { name: 'desktop', width: 1280, height: 800 },
      { name: 'mobile', width: 390, height: 844 },
    ]
    const browser = await chromium.launch({
      executablePath: chrome,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    })
    try {
      for (const pageInfo of pages) {
        const row = { page: pageInfo.path, desktop: '', mobile: '' }
        for (const width of widths) {
          const context = await browser.newContext({
            viewport: { width: width.width, height: width.height },
            colorScheme: 'light',
            locale: 'en-GB',
          })
          const page = await context.newPage()
          const response = await page.goto(`${previewUrl}${pageInfo.path}`, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
          })
          await page.waitForTimeout(1500)
          const fileName = `${pageInfo.name}-${width.name}.png`
          const filePath = path.join(screenshotDir, fileName)
          await page.screenshot({ path: filePath, fullPage: true })
          row[width.name] = path.relative(root, filePath)
          const status = response?.status() ?? 0
          process.stdout.write(`  ${fileName} (${status})\n`)
          await context.close()
        }
        screenshots.push(row)
      }
    } finally {
      await browser.close()
    }
    return { detail: `${screenshots.length * 2} screenshots in ${path.relative(root, screenshotDir)}` }
  })

  await step('links', async () => {
    if (!previewUp) {
      for (const card of projectCards) {
        if (card.href) linkStatus.set(card.href, 'not checked')
      }
      throw new StepSkip('Skipped link checks because the preview is not running.')
    }
    const crawlPaths = [
      '/',
      '/about',
      '/articles',
      '/projects',
      ...articles.filter((article) => article.inFolder).map((article) => `/articles/${article.slug}`),
      '/verify-missing-page',
    ]
    const internalTargets = new Map()
    for (const crawlPath of crawlPaths) {
      let html = pageHtml.get(crawlPath)
      if (html === undefined) {
        const response = await fetchText(`${previewUrl}${crawlPath}`)
        html = response.body
        pageHtml.set(crawlPath, html)
      }
      const $ = loadCheerio(html)
      $('a[href]').each((_, element) => {
        const href = $(element).attr('href')
        const internal = toInternalPath(href, `${previewUrl}${crawlPath}`, previewUrl)
        if (!internal) return
        if (!internalTargets.has(internal)) internalTargets.set(internal, new Set())
        internalTargets.get(internal).add(crawlPath)
      })
    }

    const internalList = [...internalTargets.keys()]
    checkedInternal = internalList.length
    await mapPool(internalList, 6, async (target) => {
      if (routeStatus.has(target) && !String(routeStatus.get(target)).includes('(')) {
        return
      }
      const response = await fetchText(`${previewUrl}${target}`)
      const label = response.error ? `error: ${response.error}` : String(response.status)
      routeStatus.set(target, label)
    })
    for (const [target, from] of internalTargets) {
      const label = routeStatus.get(target) ?? 'not checked'
      if (isHardFailure(label)) {
        brokenInternal.push({
          from: [...from].sort().join(', '),
          href: target,
          status: label,
        })
      }
    }

    const external = new Map()
    for (const card of projectCards) {
      if (card.href) external.set(card.href, card.name)
    }
    for (const link of navLinks) {
      if (/^https?:\/\//.test(link.href)) external.set(link.href, link.label)
    }
    await mapPool([...external.keys()], 4, async (href) => {
      const response = await fetchText(href, 20000)
      const label = classifyRemote(response)
      linkStatus.set(href, label)
      process.stdout.write(`  ${href} ${label}\n`)
    })

    const hardExternal = [...external.keys()].filter((href) => isHardFailure(linkStatus.get(href)))
    if (brokenInternal.length || hardExternal.length) {
      const bits = [
        ...brokenInternal.map((link) => `${link.href} from ${link.from} (${link.status})`),
        ...hardExternal.map((href) => `${href} (${linkStatus.get(href)})`),
      ]
      throw new Error(`${bits.length} broken link${bits.length === 1 ? '' : 's'}: ${bits.join('; ')}`)
    }
    const blocked = [...linkStatus.values()].filter((label) => label.endsWith('blocked')).length
    return {
      detail: `${checkedInternal} internal links, ${external.size} work/nav links${blocked ? `, ${blocked} blocked by the remote host` : ''}`,
    }
  })

  stopPreview(previewHandle?.child)
  previewHandle = null

  const generatedAt = new Date().toISOString()
  const featureMap = renderFeatureMap({
    generatedAt,
    commit,
    previewUrl,
    articles,
    routeStatus,
    projectCards,
    homeWork,
    navLinks,
    linkStatus,
    brokenInternal,
    checkedInternal,
  })
  const overall = steps.every((item) => item.status === 'pass') ? 'PASS' : 'FAIL'
  const summary = renderSummary({
    generatedAt,
    commit,
    dirty,
    overall,
    steps,
    featureMap,
    screenshots,
    previewUrl,
  })
  const featurePath = path.join(outputDir, 'feature-map.md')
  const summaryPath = path.join(outputDir, 'summary.md')
  fs.writeFileSync(featurePath, featureMap)
  fs.writeFileSync(summaryPath, summary)

  process.stdout.write(`\nverify overall ${overall.toLowerCase()}\n`)
  process.stdout.write(`summary: ${path.relative(root, summaryPath)}\n`)
  process.stdout.write(`feature_map: ${path.relative(root, featurePath)}\n`)
  process.stdout.write(`screenshots: ${path.relative(root, screenshotDir)}\n`)

  if (overall !== 'PASS') process.exitCode = 1
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    stopPreview(previewHandle?.child)
    process.exit(1)
  })
}

try {
  await main()
} catch (error) {
  stopPreview(previewHandle?.child)
  process.stderr.write(`${error.message}\n`)
  process.exit(1)
}
