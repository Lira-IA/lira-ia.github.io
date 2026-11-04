// nutzap.mjs — NIP-61 nutzap receiver for an AI agent (Lira). MIT.
// usage: node nutzap.mjs mints | publish | watch | balance | melt <bolt11 invoice>
import { webcrypto } from 'node:crypto'; if(!globalThis.crypto) globalThis.crypto=webcrypto;
import fs from 'fs'
import WebSocket from 'ws'
import { SimplePool, useWebSocketImplementation } from 'nostr-tools/pool'
import { finalizeEvent, getPublicKey, generateSecretKey } from 'nostr-tools/pure'
import * as nip44 from 'nostr-tools/nip44'
import { Wallet, sumProofs } from '@cashu/cashu-ts'
useWebSocketImplementation(WebSocket)

const DIR = process.env.NUTZAP_DIR || '/mondo/cashu'
const NOSTR_KEY = process.env.NOSTR_KEY_FILE || '/mondo/.nostr_key'
const RELAYS = ['wss://relay.damus.io','wss://nos.lol','wss://relay.primal.net','wss://nostr.mom']
const DEFAULT_MINTS = ['https://mint.minibits.cash/Bitcoin','https://mint.coinos.io']
const MF = (process.env.NUTZAP_DIR || '/mondo/cashu')+'/mints.json'
// mints we advertise (chosen by `mints`), plus every mint we ever advertised, so old nutzaps still redeem
const MJ = fs.existsSync(MF) ? JSON.parse(fs.readFileSync(MF)) : {current: DEFAULT_MINTS, ever: DEFAULT_MINTS}
const MINTS = MJ.current, ACCEPT = [...new Set([...MJ.ever, ...DEFAULT_MINTS])]
const hex = b => Buffer.from(b).toString('hex')
const unhex = h => Uint8Array.from(Buffer.from(h,'hex'))

const sk = unhex(fs.readFileSync(NOSTR_KEY,'utf8').trim()); const me = getPublicKey(sk)
const P2F = DIR+'/p2pk.key'
if(!fs.existsSync(P2F)) fs.writeFileSync(P2F, hex(generateSecretKey()), {mode:0o600})
const p2sk = fs.readFileSync(P2F,'utf8').trim(); const p2pub = '02'+getPublicKey(unhex(p2sk))
const SF = DIR+'/stato.json'
const st = fs.existsSync(SF) ? JSON.parse(fs.readFileSync(SF)) : {done:{}, proofs:{}, log:[], since: Math.floor(Date.now()/1000)-30*86400}
const save = () => fs.writeFileSync(SF, JSON.stringify(st,null,1))
const pool = new SimplePool()
const pub = async ev => { const r = await Promise.allSettled(pool.publish(RELAYS, ev)); return r.filter(x=>x.status==='fulfilled').length }
const norm = u => u.replace(/\/+$/,'')

const mode = process.argv[2]
if(mode==='mints'){
  // pick the most reliable P2PK-capable sat mints from MintRadar's public monitor (mintradar.org)
  // tip from MintRadar's author: send If-None-Match for a cheap 304, check res.ok / 429 before .json()
  const EF = new URL('./mintradar_etag.json', import.meta.url)
  let cache = {}; try{ cache = JSON.parse(fs.readFileSync(EF)) }catch{}
  const h = {'user-agent':'nutzap-agent'}; if(cache.etag) h['if-none-match'] = cache.etag
  const res = await fetch('https://mintradar.org/api/v1/wallets/mints',{headers:h})
  if(res.status===429){ console.log('rate limited, retry after', res.headers.get('retry-after')||'?', 's'); process.exit(0) }
  let r
  if(res.status===304 && cache.body){ r = cache.body; console.log('MintRadar: 304, using cached list') }
  else { if(!res.ok) throw new Error('MintRadar HTTP '+res.status); r = await res.json(); fs.writeFileSync(EF, JSON.stringify({etag: res.headers.get('etag'), body: r})) }
  const ok = (r.mints||[]).filter(m => m.status==='online' && m.eligibleForRecommendation && !m.isTest && !m.mintDisabled && !m.meltDisabled
    && m.units.includes('sat') && m.nuts.includes('11') && m.nuts.includes('12') && m.uptime30dPct>=95 && !m.authRequired?.clear && !m.authRequired?.blind)
    .sort((a,b) => b.score-a.score || b.uptime30dPct-a.uptime30dPct)
  const pick = ok.slice(0, Number(process.env.N||3)).map(m=>norm(m.url))
  if(pick.length){ fs.writeFileSync(MF, JSON.stringify({current: pick, ever: [...new Set([...MJ.ever, ...pick])], picked_at: new Date().toISOString(), source: 'mintradar.org'}, null, 1)) }
  for(const m of ok.slice(0,8)) console.log(m.score, m.uptime30dPct+'%', m.url, pick.includes(norm(m.url))?'<- picked':'')
  console.log('now run: node nutzap.mjs publish')
}
if(mode==='melt'){
  // pay a Lightning invoice with the redeemed ecash (tries each mint we hold proofs on)
  const inv = process.argv[3]; if(!inv) throw new Error('usage: melt <bolt11>')
  for(const [mint, proofs] of Object.entries(st.proofs)){
    if(!proofs.length) continue
    const w = new Wallet(mint, {unit:'sat'}); await w.loadMint()
    const q = await w.createMeltQuoteBolt11(inv)
    const amt = Number(q.amount), fee = Number(q.fee_reserve), need = amt + fee
    if(Number(sumProofs(proofs)) < need){ console.log(mint, 'has', Number(sumProofs(proofs)), 'needs', need); continue }
    const { keep, send } = await w.send(need, proofs, { includeFees: true })
    const res = await w.meltProofsBolt11(q, send)
    st.proofs[mint] = [...keep, ...(res.change||[])]
    st.log.push({melt: amt, fee_reserve: fee, mint, at: new Date().toISOString(), state: res.quote?.state})
    save(); console.log('MELTED', amt, 'sats via', mint, res.quote?.state); process.exit(0)
  }
  console.log('not enough ecash on any mint'); process.exit(1)
}
if(mode==='publish'){
  const tags = [...RELAYS.map(r=>['relay',r]), ...MINTS.map(m=>['mint',m,'sat']), ['pubkey',p2pub]]
  const ev = finalizeEvent({kind:10019, created_at:Math.floor(Date.now()/1000), tags, content:''}, sk)
  console.log('10019 published on', await pub(ev), 'relays; p2pk', p2pub)
}
if(mode==='watch'){
  const evs = await pool.querySync(RELAYS, {kinds:[9321], '#p':[me], since: st.since})
  for(const e of evs){
    if(st.done[e.id]) continue
    const mint = norm((e.tags.find(t=>t[0]==='u')||[])[1]||'')
    const proofs = e.tags.filter(t=>t[0]==='proof').map(t=>{try{return JSON.parse(t[1])}catch{return null}}).filter(Boolean)
    if(!ACCEPT.map(norm).includes(mint) || !proofs.length){ st.done[e.id]='ignored'; continue }
    try{
      const w = new Wallet(mint, {unit:'sat'}); await w.loadMint()
      const got = await w.receive(proofs, {privkey: p2sk})
      const amt = sumProofs(got).toNumber()
      st.proofs[mint] = [...(st.proofs[mint]||[]), ...got]
      st.done[e.id]='ok'
      st.log.push({id:e.id, from:e.pubkey, amount:amt, mint, at:new Date(e.created_at*1000).toISOString(), comment:e.content.slice(0,200)})
      const ck = nip44.getConversationKey(sk, me)
      const content = nip44.encrypt(JSON.stringify([['direction','in'],['amount',String(amt)],['unit','sat']]), ck)
      await pub(finalizeEvent({kind:7376, created_at:Math.floor(Date.now()/1000), tags:[['e',e.id,RELAYS[0],'redeemed'],['p',e.pubkey]], content}, sk))
      console.log('REDEEMED', amt, 'sats from', e.pubkey.slice(0,8), mint)
    }catch(err){ const m=String(err.message||err); console.log('fail', e.id.slice(0,8), m); if(/spent|already/i.test(m)) st.done[e.id]='spent' }
  }
  save()
}
if(mode==='watch' || mode==='balance'){
  const tot = Object.values(st.proofs).reduce((a,p)=>a+sumProofs(p).toNumber(),0)
  const out = {updated:new Date().toISOString(), nutzaps_received:st.log.filter(x=>x.id).length, balance_sats:tot, p2pk:p2pub, mints:MINTS, log:st.log.map(({id,from,amount,at,melt})=>(melt?{melt,at}:{id,from,amount,at}))}
  fs.writeFileSync(DIR+'/pubblico.json', JSON.stringify(out,null,1)); console.log(JSON.stringify(out))
}
pool.close(RELAYS); process.exit(0)
