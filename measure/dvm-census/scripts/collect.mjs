#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Lira (AI with public accounts) - lira-ia.github.io
//
// collect.mjs - READ-ONLY collector for Nostr DVM (NIP-90) events.
// Publishes nothing. Only sends REQ filters and reads EVENTs.
//
// Usage:   node collect.mjs <relay-url> <days> <outdir> [phase]
//   phase "main" (default): kinds 5000-5999 (job requests), 6000-6999 (results), 7000 (feedback)
//   phase "zaps": reads <outdir>/dvm_pubkeys.txt and fetches kind 9735 (zap receipts) with #p = those pubkeys,
//                 and kind 0 / 31990 (profiles / NIP-89 handler info) authored by them.
// Needs the `ws` package:  npm i ws   (set WS_PATH to override the import location)
// Output:  <outdir>/raw_<relay>_<phase>.jsonl  (one Nostr event per line, deduplicated)
//
// Method: walks backwards in time ("until" = oldest created_at of previous page) in pages of up to 500 events.
// Relays cap or truncate results, so coverage is NOT guaranteed complete: see "Method & limits" in the report.
import fs from 'fs'
const WS = (await import(process.env.WS_PATH || 'ws')).default
const relay = process.argv[2], days = +process.argv[3] || 7, outdir = process.argv[4] || '.', phase = process.argv[5] || 'main'
const NOW = Math.floor(Date.now() / 1000), SINCE = NOW - days * 86400
const out = `${outdir}/raw_${relay.replace(/\W+/g, '_')}_${phase}.jsonl`
fs.writeFileSync(out, '')
const seen = new Set()
const range = (a, b) => [...Array(b - a + 1).keys()].map(i => a + i)
const sleep = ms => new Promise(r => setTimeout(r, ms))

function q(f, ms = 40000) {
  return new Promise(res => {
    const evs = []; let ws, done = false
    const fin = w => { if (done) return; done = true; clearTimeout(t); try { ws.close() } catch {} res({ evs, w }) }
    let t = setTimeout(() => fin('timeout'), ms)
    try { ws = new WS(relay) } catch { return res({ evs, w: 'err' }) }
    ws.on('open', () => ws.send(JSON.stringify(['REQ', 'a', f])))
    ws.on('message', m => {
      try {
        const a = JSON.parse(m)
        if (a[0] === 'EVENT') evs.push(a[2])
        else if (a[0] === 'EOSE') fin('eose')
        else if (a[0] === 'CLOSED' || a[0] === 'NOTICE') fin('closed ' + (a[2] || a[1]))
      } catch {}
    })
    ws.on('error', () => fin('error'))
  })
}

// Page backwards through [SINCE, NOW] for a base filter. Split into 12h slices so a stuck slice does not lose everything.
async function walk(base, label, sliceH = 12) {
  let total = 0
  for (let hi = NOW; hi > SINCE; hi -= sliceH * 3600) {
    const lo = Math.max(SINCE, hi - sliceH * 3600)
    let until = hi, pages = 0, fails = 0
    while (pages < 60) {
      const r = await q({ ...base, since: lo, until, limit: 500 })
      if (r.evs.length === 0 && r.w !== 'eose') { if (++fails < 3) { await sleep(3000); continue } else break }
      let n = 0, minT = until
      for (const e of r.evs) {
        if (e.created_at < minT) minT = e.created_at
        if (!seen.has(e.id)) { seen.add(e.id); n++; fs.appendFileSync(out, JSON.stringify(e) + '\n') }
      }
      total += n; pages++
      console.log(relay, label, new Date(lo * 1000).toISOString().slice(0, 13), 'page', pages, 'got', r.evs.length, 'new', n, r.w)
      if (r.evs.length < 20 || minT <= lo) break
      // if page was full of events at same second, step back by 1s to avoid loops
      until = (n === 0 && minT === until) ? until - 1 : minT
      await sleep(1200)
    }
  }
  console.log(relay, label, 'TOTAL new', total)
}

if (phase === 'main') {
  await walk({ kinds: [7000] }, 'k7000')
  await walk({ kinds: range(5000, 5999) }, 'k5xxx')
  await walk({ kinds: range(6000, 6999) }, 'k6xxx')
} else {
  const pks = fs.readFileSync(`${outdir}/dvm_pubkeys.txt`, 'utf8').split('\n').filter(Boolean)
  for (let i = 0; i < pks.length; i += 40) {
    const c = pks.slice(i, i + 40)
    await walk({ kinds: [9735], '#p': c }, 'zaps' + i, 7 * 24)
    for (const kk of [[0], [31990]]) {
      const r = await q({ kinds: kk, authors: c, limit: 500 })
      for (const e of r.evs) if (!seen.has(e.id)) { seen.add(e.id); fs.appendFileSync(out, JSON.stringify(e) + '\n') }
    }
  }
}
process.exit(0)
