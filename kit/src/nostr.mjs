import { webcrypto } from 'node:crypto'; if(!globalThis.crypto) globalThis.crypto=webcrypto;
import { generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools/pure'
import * as nip19 from 'nostr-tools/nip19'
import { Relay, useWebSocketImplementation } from 'nostr-tools/relay'
import WebSocket from 'ws'
import fs from 'fs'
useWebSocketImplementation(WebSocket)
const KF='/mondo/.nostr_key'
let sk
if (fs.existsSync(KF)) sk=Uint8Array.from(Buffer.from(fs.readFileSync(KF,'utf8').trim(),'hex'))
else { sk=generateSecretKey(); fs.writeFileSync(KF,Buffer.from(sk).toString('hex'),{mode:0o600}) }
const pk=getPublicKey(sk)
const RELAYS=['wss://relay.damus.io','wss://nos.lol','wss://relay.primal.net','wss://relay.nostr.band','wss://nostr.mom']
const [mode,arg]=process.argv.slice(2)
let ev
if(mode==='pub'){ console.log(nip19.npubEncode(pk)); process.exit(0)}
if(mode==='profile') ev=finalizeEvent({kind:0,created_at:Math.floor(Date.now()/1000),tags:[],content:fs.readFileSync(arg,'utf8')},sk)
else if(mode==='goal'){ const now=Math.floor(Date.now()/1000); const tg=[['relays',...RELAYS],['amount',process.env.MSAT],['closed_at',process.env.CLOSED],['summary',process.env.SUMMARY||''],['r','https://lira-ia.github.io/deadline/']]; if(process.env.IMAGE) tg.push(['image',process.env.IMAGE]); ev=finalizeEvent({kind:9041,created_at:now,tags:tg,content:arg},sk); console.log('hexid',ev.id); }
else if(mode==='article'){ const now=Math.floor(Date.now()/1000); const tg=[['d',process.env.DTAG],['title',process.env.TITLE],['summary',process.env.SUMMARY||''],['published_at',String(now)]]; if(process.env.IMAGE) tg.push(['image',process.env.IMAGE]); for(const t of (process.env.TAGS||'').split(',').filter(Boolean)) tg.push(['t',t]); for(const p of (process.env.PTAGS||'').split(',').filter(Boolean)) tg.push(['p',p]); ev=finalizeEvent({kind:30023,created_at:now,tags:tg,content:fs.readFileSync(arg,'utf8')},sk); console.log('naddr',nip19.naddrEncode({kind:30023,pubkey:pk,identifier:process.env.DTAG,relays:['wss://relay.damus.io','wss://nos.lol']})) }
else { const tg=(process.env.TAGS||'ai').split(',').filter(Boolean).map(t=>['t',t]); if(process.env.PTAGS){for(const p of process.env.PTAGS.split(',').filter(Boolean)) tg.push(['p',p])} if(process.env.REPLY){tg.push(['e',process.env.REPLY,'','reply'],['p',process.env.REPLYPK])} ev=finalizeEvent({kind:1,created_at:Math.floor(Date.now()/1000),tags:tg,content:arg},sk) }
let ok=0
for(const u of RELAYS){ try{ const r=await Relay.connect(u); await Promise.race([r.publish(ev),new Promise((_,j)=>setTimeout(()=>j('timeout'),8000))]); ok++; console.log('ok',u); r.close()}catch(e){console.log('ko',u,String(e).slice(0,80))} }
console.log('id',nip19.noteEncode(ev.id),'relays_ok',ok)
process.exit(0)
