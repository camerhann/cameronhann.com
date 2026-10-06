function escapeCell(value) {
  return String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
}

function table(headers, rows) {
  const head = `| ${headers.map(escapeCell).join(' | ')} |`
  const rule = `| ${headers.map(() => '---').join(' | ')} |`
  const body = rows.map((row) => `| ${row.map(escapeCell).join(' | ')} |`)
  return [head, rule, ...body].join('\n')
}

export function renderFeatureMap({
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
}) {
  const articleRows = articles.map((article) => [
    article.slug,
    article.title ?? '',
    article.date ?? '',
    article.registered ? 'yes' : 'no',
    routeStatus.get(`/articles/${article.slug}`) ?? 'not checked',
  ])

  const projectRows = projectCards.map((card) => [
    card.name ?? '',
    card.href ?? '',
    linkStatus.get(card.href) ?? 'not checked',
  ])

  const homeRows = homeWork.map((role) => [
    role.company ?? '',
    role.title ?? '',
    '—',
    'no link',
  ])

  const navRows = []
  const seenNav = new Map()
  for (const link of navLinks) {
    const key = `${link.label}|${link.href}`
    const current = seenNav.get(key)
    if (current) {
      current.surfaces.add(link.surface)
    } else {
      seenNav.set(key, {
        label: link.label,
        href: link.href,
        surfaces: new Set([link.surface]),
      })
    }
  }
  for (const link of seenNav.values()) {
    navRows.push([
      link.label,
      link.href,
      [...link.surfaces].sort().join(', '),
      linkStatus.get(link.href) ?? routeStatus.get(link.href) ?? 'not checked',
    ])
  }

  const brokenRows = brokenInternal.map((link) => [
    link.from,
    link.href,
    link.status,
  ])

  return `# Feature map

Generated: ${generatedAt}
Commit: \`${commit}\`
Preview: ${previewUrl ?? 'not running'}

## Articles

${table(['Slug', 'Title', 'Date', 'Registered', 'Route'], articleRows)}

## Work cards

The linked cards are on \`/projects\`. The home page Work list is the résumé in \`src/components/Resume.tsx\`; those rows do not have outbound links.

### /projects

${table(['Title', 'Link', 'Link status'], projectRows)}

### Home page Work list

${table(['Title', 'Role', 'Link', 'Link status'], homeRows)}

## Navigation

${table(['Label', 'Href', 'Where', 'Status'], navRows)}

## Internal links

Checked ${checkedInternal} unique internal link${checkedInternal === 1 ? '' : 's'} from the home page, about, writing, work, each article, and the 404 page.

${
  brokenRows.length
    ? table(['Found on', 'Href', 'Status'], brokenRows)
    : 'No broken internal links found.'
}
`
}

export function renderSummary({
  generatedAt,
  commit,
  dirty,
  overall,
  steps,
  featureMap,
  screenshots,
  previewUrl,
}) {
  const stepRows = steps.map((step) => [
    step.name,
    step.status,
    formatDuration(step.ms),
    step.detail,
  ])

  const screenshotRows = screenshots.map((shot) => [
    shot.page,
    shot.desktop ?? '—',
    shot.mobile ?? '—',
  ])

  const failures = steps.filter((step) => step.status !== 'pass')
  const failureNotes = failures
    .map((step) => {
      const log = step.logTail ? `\n\n\`\`\`\n${step.logTail}\n\`\`\`` : ''
      return `### ${step.name}: ${step.status}\n\n${step.detail}${log}`
    })
    .join('\n\n')

  return `# Verify summary

Overall: **${overall}**
Commit: \`${commit}\`${dirty ? ' (worktree dirty)' : ''}
Date: ${generatedAt}
Command: \`npm run verify\`
Preview: ${previewUrl ?? 'not running'}

Paste this file into the pull request. Attach the desktop and mobile screenshots of the home page and one article. Do not commit \`.verify/\`.

## Steps

${table(['Step', 'Result', 'Duration', 'Notes'], stepRows)}

## Screenshots

${
  screenshotRows.length
    ? table(['Page', 'Desktop', 'Mobile'], screenshotRows)
    : 'No screenshots were captured.'
}

## Feature map

${featureMap}

${failures.length ? `## Findings\n\n${failureNotes}\n` : '## Findings\n\nNo failed or skipped steps.\n'}
`
}

function formatDuration(ms) {
  if (typeof ms !== 'number') return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}
