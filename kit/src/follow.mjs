// node follow.mjs pk1 pk2 ... : aggiunge ai miei follow (kind 3), conserva quelli esistenti
import { webcrypto } from 'node:crypto'; if(!globalThis.crypto) globalThis.crypto=webcrypto;
import { finalizeEvent, getPublicKey } from 'nostr-tools/pure'
import {SimplePool,useWebSocketImplementation} from 'nostr-tools/pool'
import WebSocket from 'ws'; import fs from 'fs'
useWebSocketImplementation(WebSocket); process.on('uncaughtException',()=>{})
const sk=Uint8Array.from(Buffer.from(fs.readFileSync('/mondo/.nostr_key','utf8').trim(),'hex')); const pk=getPublicKey(sk)
const R=['wss://relay.damus.io','wss://nos.lol','wss://relay.primal.net','wss://nostr.mom','wss://relay.nostr.band']
const pool=new SimplePool()
const old=(await pool.querySync(R,{kinds:[3],authors:[pk]},{maxWait:6000})).sort((a,b)=>b.created_at-a.created_at)[0]
const tags=old?old.tags.slice():[]; const have=new Set(tags.filter(t=>t[0]=='p').map(t=>t[1]))
console.log('prima',have.size)
for(const p of process.argv.slice(2)) if(/^[0-9a-f]{64}$/.test(p)&&p!==pk&&!have.has(p)){tags.push(['p',p]);have.add(p)}
if(process.env.DRY){console.log('dopo',have.size);process.exit(0)}
const ev=finalizeEvent({kind:3,created_at:Math.floor(Date.now()/1000),tags,content:old?old.content:''},sk)
const r=await Promise.allSettled(pool.publish(R,ev)); console.log('dopo',have.size,'ok',r.filter(x=>x.status=='fulfilled').length); process.exit(0)
