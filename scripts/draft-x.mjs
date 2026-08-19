#!/usr/bin/env node
/**
 * Draft an X post from a published essay. Does not post.
 * Usage: node scripts/draft-x.mjs i-build-models-software-teams
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const slug = process.argv[2];
const dir = join(root, 'src/content/writing');

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error('No frontmatter');
  const data = Object.fromEntries(
    match[1]
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const i = line.indexOf(':');
        return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
      }),
  );
  return { data, body: match[2].trim() };
}

const files = slug
  ? [`${slug}.md`, `${slug}.mdx`].filter((name) => {
      try {
        readFileSync(join(dir, name));
        return true;
      } catch {
        return false;
      }
    })
  : readdirSync(dir).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));

if (!files.length) {
  console.error('No essay found. Available:');
  for (const f of readdirSync(dir)) console.error(' -', f.replace(/\.(md|mdx)$/, ''));
  process.exit(1);
}

const file = files[0];
const id = file.replace(/\.(md|mdx)$/, '');
const { data, body } = parseFrontmatter(readFileSync(join(dir, file), 'utf8'));
const url = `https://cameronhann.com/writing/${id}`;
const firstPara = body.split(/\n\n/).find((p) => !p.startsWith('#') && !p.startsWith('**')) ?? data.description;

const post = `${data.title}.\n\n${data.description}\n\n${url}`;
const alt = `${firstPara.replace(/\s+/g, ' ').slice(0, 220)}\n\n${url}`;

console.log('--- single post ---');
console.log(post);
console.log('\n--- alt (opens on first paragraph) ---');
console.log(alt);
console.log(`\n${post.length} / 280 chars for the short form (title + dek + url may wrap). Paste into X. Do not auto-post.`);
