import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  listArticles,
  listHomeWork,
  listNavLinks,
  listProjectCards,
  readPublicSite,
} from './catalog.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

function isRealIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

test('every article folder is registered and every registration has a folder', () => {
  const articles = listArticles(root)
  assert.ok(articles.length > 0, 'expected at least one article')
  assert.deepEqual(
    articles.filter((article) => article.inFolder && !article.registered).map((article) => article.slug),
    [],
    'article folders missing from src/lib/articles.ts',
  )
  assert.deepEqual(
    articles.filter((article) => article.registered && !article.inFolder).map((article) => article.slug),
    [],
    'registry slugs with no src/app/articles/<slug>/page.mdx',
  )
  assert.deepEqual(
    articles.filter((article) => article.duplicate).map((article) => article.slug),
    [],
    'duplicate slugs in src/lib/articles.ts',
  )
})

test('each article exports a title, date, and description', () => {
  const articles = listArticles(root).filter((article) => article.inFolder)
  for (const article of articles) {
    assert.equal(typeof article.title, 'string', `${article.slug} title`)
    assert.ok(article.title.trim(), `${article.slug} title is empty`)
    assert.ok(isRealIsoDate(article.date), `${article.slug} date "${article.date}"`)
    assert.equal(typeof article.description, 'string', `${article.slug} description`)
    assert.ok(article.description.trim(), `${article.slug} description is empty`)
  }
})

test('every Work page card has a title and an absolute link', () => {
  const site = readPublicSite(root)
  const cards = listProjectCards(root, site)
  assert.ok(cards.length > 0, 'expected Work cards on /projects')
  assert.ok(
    cards.some((card) => card.href === site.forecast.href),
    'expected the Forecast card to use works.forecast.href',
  )
  for (const card of cards) {
    assert.ok(card.name, 'Work card is missing a name')
    assert.match(card.href ?? '', /^https?:\/\//, `${card.name} link`)
    assert.ok(card.label, `${card.name} link label`)
  }
})

test('the home Work list has a company and a title on every row', () => {
  const roles = listHomeWork(root)
  assert.ok(roles.length > 0, 'expected home Work rows')
  for (const role of roles) {
    assert.ok(role.company, 'home Work row is missing a company')
    assert.ok(role.title, `${role.company} is missing a title`)
  }
})

test('header and footer navigation include the main routes', () => {
  const site = readPublicSite(root)
  const hrefs = new Set(listNavLinks(root, site).map((link) => link.href))
  for (const href of ['/', '/about', '/articles', '/projects', site.forecast.href]) {
    assert.ok(hrefs.has(href), `missing nav href ${href}`)
  }
})
