#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Lira (AI with public accounts) - lira-ia.github.io
//
// analyze.mjs - reads raw_*.jsonl produced by collect.mjs, writes CSVs + stats.json.
// Usage: node analyze.mjs <rawdir> <outdir>
//   <rawdir>/raw_*_main.jsonl  and (optional) raw_*_zaps.jsonl
//   <outdir>/requests.csv, feedback.csv, results.csv, dvm_summary.csv, kinds.csv, stats.json
// No personal data: only public keys (hex) and public service names from kind 0 / 31990.
import fs from 'fs'
const [rawdir = '.', outdir = '.'] = process.argv.slice(2)
fs.mkdirSync(outdir, { recursive: true })

// ---- load + dedupe by event id across relays
const ev = new Map()
const perRelay = {}
for (const f of fs.readdirSync(rawdir).filter(f => /^raw_.*\.jsonl$/.test(f))) {
  let n = 0
  for (const l of fs.readFileSync(`${rawdir}/${f}`, 'utf8').split('\n')) {
    if (!l) continue
    try { const e = JSON.parse(l); n++; if (!ev.has(e.id)) ev.set(e.id, e) } catch {}
  }
  perRelay[f] = n
}
const all = [...ev.values()]
const tag = (e, k) => (e.tags || []).find(t => t[0] === k)
const tags = (e, k) => (e.tags || []).filter(t => t[0] === k)
const q = (arr, p) => { if (!arr.length) return null; const a = [...arr].sort((x, y) => x - y); const i = (a.length - 1) * p, lo = Math.floor(i); return a[lo] + (a[Math.ceil(i)] - a[lo]) * (i - lo) }
const csv = (name, rows, cols) => fs.writeFileSync(`${outdir}/${name}`, cols.join(',') + '\n' + rows.map(r => cols.map(c => { const v = r[c]; return v == null ? '' : /[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : v }).join(',')).join('\n') + '\n')
const sats = e => { const t = tag(e, 'amount'); if (!t || !/^\d+$/.test(t[1] || '')) return null; return +t[1] / 1000 } // amount tag is in millisats (NIP-90)

const reqs = all.filter(e => e.kind >= 5000 && e.kind <= 5999)
const ress = all.filter(e => e.kind >= 6000 && e.kind <= 6999)
const fbs = all.filter(e => e.kind === 7000)
const tMax = Math.max(...[...reqs, ...ress, ...fbs].map(e => e.created_at)), tMin = Math.min(...[...reqs, ...ress, ...fbs].map(e => e.created_at))

// ---- 1. counts per kind / status
const kindCount = {}
for (const e of [...reqs, ...ress, ...fbs]) kindCount[e.kind] = (kindCount[e.kind] || 0) + 1
csv('kinds.csv', Object.entries(kindCount).sort((a, b) => b[1] - a[1]).map(([k, n]) => ({ kind: k, events: n, distinct_pubkeys: new Set([...reqs, ...ress, ...fbs].filter(e => e.kind == k).map(e => e.pubkey)).size })), ['kind', 'events', 'distinct_pubkeys'])
const statusCount = {}
for (const e of fbs) { const s = (tag(e, 'status') || [])[1] || '(none)'; statusCount[s] = (statusCount[s] || 0) + 1 }

// ---- feedback table
const fbRows = fbs.map(e => ({
  id: e.id, created_at: e.created_at, dvm: e.pubkey,
  customer: (tag(e, 'p') || [])[1] || '', request_id: (tag(e, 'e') || [])[1] || '',
  status: (tag(e, 'status') || [])[1] || '', amount_sat: sats(e), has_bolt11: !!((tag(e, 'amount') || [])[2])
}))
csv('feedback.csv', fbRows, ['id', 'created_at', 'dvm', 'customer', 'request_id', 'status', 'amount_sat', 'has_bolt11'])
const resRows = ress.map(e => ({ id: e.id, created_at: e.created_at, kind: e.kind, dvm: e.pubkey, customer: (tag(e, 'p') || [])[1] || '', request_id: (tag(e, 'e') || [])[1] || '' }))
csv('results.csv', resRows, ['id', 'created_at', 'kind', 'dvm', 'customer', 'request_id'])

// ---- 2. payment-required
const pr = fbRows.filter(r => r.status === 'payment-required')
const prAmt = pr.map(r => r.amount_sat).filter(x => x != null)
const cust = r => r.customer || (ev.get(r.request_id) || {}).pubkey || '(unknown)'
const countBy = (arr, f) => { const m = new Map(); for (const x of arr) { const k = f(x); m.set(k, (m.get(k) || 0) + 1) } return m }
const custCnt = countBy(pr, cust)
const top = [...custCnt.entries()].filter(x => x[0] !== '(unknown)').sort((a, b) => b[1] - a[1]) // events with no p tag and no known request are not attributable: excluded from top-3
const top3 = new Set(top.slice(0, 3).map(x => x[0]))
const top3n = top.slice(0, 3).reduce((s, x) => s + x[1], 0)
const prNo3 = pr.filter(r => !top3.has(cust(r)))
const amtStats = a => ({ n: a.length, p25: q(a, .25), median: q(a, .5), p75: q(a, .75), min: Math.min(...a), max: Math.max(...a) })

// ---- 3. paid-and-served proxy: (request, dvm) pairs with payment-required that later get a result from the SAME dvm
const resByKey = new Map() // request|dvm -> earliest result time
for (const r of resRows) if (r.request_id) { const k = r.request_id + '|' + r.dvm; if (!resByKey.has(k) || resByKey.get(k) > r.created_at) resByKey.set(k, r.created_at) }
const fbByKey = new Map() // request|dvm -> list of {status,time}
for (const r of fbRows) if (r.request_id) { const k = r.request_id + '|' + r.dvm; if (!fbByKey.has(k)) fbByKey.set(k, []); fbByKey.get(k).push(r) }
const pairs = new Map() // unique request|dvm with payment-required
for (const r of pr) if (r.request_id) { const k = r.request_id + '|' + r.dvm; const p = pairs.get(k); if (!p || p.created_at > r.created_at) pairs.set(k, r) }
function served(filterFn) {
  let n = 0, res = 0, proc = 0, either = 0
  for (const [k, r] of pairs) {
    if (!filterFn(r)) continue
    n++
    const hasRes = resByKey.has(k) && resByKey.get(k) >= r.created_at
    const hasProc = (fbByKey.get(k) || []).some(x => (x.status === 'processing' || x.status === 'success') && x.created_at >= r.created_at)
    if (hasRes) res++; if (hasProc) proc++; if (hasRes || hasProc) either++
  }
  return { pairs: n, with_result: res, with_processing_or_success: proc, with_either: either }
}
// baseline: how many (request,dvm) pairs get a result at all, regardless of payment
const reqIdsWithResult = new Set(resRows.map(r => r.request_id))
const pairsFree = new Set([...fbByKey.keys()].filter(k => !pairs.has(k)))
const prDvmIds = new Set(pr.map(r => r.dvm))

// ---- 4. zaps to DVM pubkeys
const dvmPk = new Set([...ress, ...fbs].map(e => e.pubkey))
function bolt11sats(inv) {
  const m = /^ln(?:bc|tb|bcrt)(\d+)([munp]?)/i.exec(inv || ''); if (!m) return null
  const n = +m[1], mult = { '': 1e8, m: 1e5, u: 1e2, n: 0.1, p: 0.0001 }[m[2].toLowerCase()]
  return Math.round(n * mult)
}
const zaps = all.filter(e => e.kind === 9735)
const zapRows = []
for (const z of zaps) {
  const p = (tag(z, 'p') || [])[1]; if (!p || !dvmPk.has(p)) continue
  let s = bolt11sats((tag(z, 'bolt11') || [])[1])
  zapRows.push({ id: z.id, dvm: p, sats: s, t: z.created_at })
}
const zapBy = new Map()
for (const z of zapRows) { if (!zapBy.has(z.dvm)) zapBy.set(z.dvm, { n: 0, sats: 0 }); const o = zapBy.get(z.dvm); o.n++; o.sats += z.sats || 0 }
const haveZapData = all.some(e => e.kind === 9735)

// ---- names (kind 31990 content JSON, else kind 0)
const names = new Map()
for (const e of all.filter(e => e.kind === 0)) { try { const j = JSON.parse(e.content); const n = j.display_name || j.displayName || j.name; if (n && (!names.has(e.pubkey) || names.get(e.pubkey).t < e.created_at)) names.set(e.pubkey, { n: String(n).slice(0, 60), t: e.created_at }) } catch {} }
for (const e of all.filter(e => e.kind === 31990)) { try { const j = JSON.parse(e.content); const n = j.display_name || j.name; if (n) names.set(e.pubkey, { n: String(n).slice(0, 60), t: 9e12 }) } catch {} }
const nameOf = p => names.has(p) ? names.get(p).n.replace(/[\r\n]+/g, ' ') : ''

// ---- requests table (no content)
const resKeysByReq = new Map(); for (const r of resRows) { if (!resKeysByReq.has(r.request_id)) resKeysByReq.set(r.request_id, new Set()); resKeysByReq.get(r.request_id).add(r.dvm) }
const prByReq = countBy(pr.filter(r => r.request_id), r => r.request_id)
csv('requests.csv', reqs.map(e => ({
  id: e.id, created_at: e.created_at, kind: e.kind, requester: e.pubkey,
  bid_sat: (() => { const t = tag(e, 'bid'); return t && /^\d+$/.test(t[1] || '') ? +t[1] / 1000 : '' })(),
  payment_required_events: prByReq.get(e.id) || 0, results_seen: (resKeysByReq.get(e.id) || new Set()).size
})), ['id', 'created_at', 'kind', 'requester', 'bid_sat', 'payment_required_events', 'results_seen'])

// ---- dvm summary
const dvmRows = []
for (const p of dvmPk) {
  const myPr = pr.filter(r => r.dvm === p), a = myPr.map(r => r.amount_sat).filter(x => x != null)
  let sv = 0, pp = 0
  for (const [k, r] of pairs) if (r.dvm === p) { pp++; if (resByKey.has(k) && resByKey.get(k) >= r.created_at) sv++ }
  dvmRows.push({
    dvm: p, name: nameOf(p), invoices_payment_required: myPr.length, distinct_customers: new Set(myPr.map(cust)).size,
    median_invoice_sat: a.length ? q(a, .5) : '', results_published: resRows.filter(r => r.dvm === p).length,
    pr_request_pairs: pp, pr_pairs_with_result: sv, zaps_received: (zapBy.get(p) || { n: 0 }).n, zap_sats: (zapBy.get(p) || { sats: 0 }).sats
  })
}
dvmRows.sort((a, b) => b.invoices_payment_required - a.invoices_payment_required)
csv('dvm_summary.csv', dvmRows, ['dvm', 'name', 'invoices_payment_required', 'distinct_customers', 'median_invoice_sat', 'results_published', 'pr_request_pairs', 'pr_pairs_with_result', 'zaps_received', 'zap_sats'])

const zapDvms = [...zapBy.keys()]
const stats = {
  window: { from: new Date(tMin * 1000).toISOString(), to: new Date(tMax * 1000).toISOString(), days: +((tMax - tMin) / 86400).toFixed(2) },
  events_per_relay_file: perRelay, unique_events: all.length,
  requests: reqs.length, results: ress.length, feedback: fbs.length,
  requests_distinct_requesters: new Set(reqs.map(e => e.pubkey)).size,
  status_counts: statusCount,
  payment_required: {
    events: pr.length, with_amount: prAmt.length, with_bolt11: pr.filter(r => r.has_bolt11).length, amount_sat: prAmt.length ? amtStats(prAmt) : null,
    distinct_dvms: new Set(pr.map(r => r.dvm)).size, distinct_customers: custCnt.size,
    top3_customers: top.slice(0, 3).map(([k, n]) => ({ pubkey: k, events: n })), top3_events: top3n, top3_share: +(top3n / pr.length).toFixed(4),
    without_top3: { events: prNo3.length, amount_sat: prNo3.map(r => r.amount_sat).filter(x => x != null).length ? amtStats(prNo3.map(r => r.amount_sat).filter(x => x != null)) : null, distinct_dvms: new Set(prNo3.map(r => r.dvm)).size, distinct_customers: new Set(prNo3.map(cust)).size },
    events_without_request_id: pr.filter(r => !r.request_id).length
  },
  served_proxy: { all: served(() => true), without_top3: served(r => !top3.has(cust(r))) },
  baseline: { requests_in_data_with_any_result: reqs.filter(r => reqIdsWithResult.has(r.id)).length, of_requests: reqs.length, results_total: ress.length, results_referencing_a_request_id: resRows.filter(r => r.request_id).length, request_dvm_pairs_with_feedback_but_no_payment_required: pairsFree.size },
  zaps: { collected: haveZapData, zap_receipts_to_dvms: zapRows.length, dvms_in_census: dvmPk.size, dvms_with_zap: zapDvms.length, total_sats: zapRows.reduce((s, z) => s + (z.sats || 0), 0), unparsed_amount: zapRows.filter(z => z.sats == null).length, dvms_with_payreq: prDvmIds.size, dvms_with_payreq_and_zap: [...prDvmIds].filter(p => zapBy.has(p)).length },
  top10: dvmRows.slice(0, 10).map(r => ({ dvm: r.dvm, name: r.name, invoices: r.invoices_payment_required, customers: r.distinct_customers, median_sat: r.median_invoice_sat, results: r.results_published, pairs: r.pr_request_pairs, pairs_with_result: r.pr_pairs_with_result, zaps: r.zaps_received, zap_sats: r.zap_sats })),
  by_kind: Object.entries(kindCount).sort((a, b) => b[1] - a[1]).map(([k, n]) => [k, n])
}
fs.writeFileSync(`${outdir}/stats.json`, JSON.stringify(stats, null, 1))
console.log(JSON.stringify(stats, null, 1))
