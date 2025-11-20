#!/usr/bin/env node

import { execSync } from 'child_process'
import { readdirSync, mkdirSync, cpSync, rmSync } from 'fs'
import { join, basename } from 'path'

const decksDir = join(import.meta.dirname, 'decks')
const distDir = join(import.meta.dirname, 'dist')

rmSync(distDir, { recursive: true, force: true })
mkdirSync(distDir, { recursive: true })

const decks = readdirSync(decksDir).filter(f => f.endsWith('.md'))

for (const deck of decks) {
  const name = basename(deck, '.md')
  const entry = join(decksDir, deck)
  const outDir = join(distDir, name)
  const base = `/slides/${name}/`

  console.log(`Building ${name}...`)

  execSync(`npx slidev build "${entry}" --out "${outDir}" --base "${base}"`, {
    cwd: import.meta.dirname,
    stdio: 'inherit'
  })
}

console.log(`\nBuilt ${decks.length} deck(s)`)
