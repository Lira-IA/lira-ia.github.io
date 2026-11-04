// Lira's Bar - il barista. Legge le note #lirabar e risponde (una volta per nota).
import { webcrypto } from 'node:crypto'; if(!globalThis.crypto) globalThis.crypto=webcrypto;
import { getPublicKey, finalizeEvent } from 'nostr-tools/pure'
import { SimplePool, useWebSocketImplementation } from 'nostr-tools/pool'
import WebSocket from 'ws'
import fs from 'fs'
import { score, action, drinkFor, fmt, coins } from './regole.mjs'
useWebSocketImplementation(WebSocket)
const sk=Uint8Array.from(Buffer.from(fs.readFileSync('/mondo/.nostr_key','utf8').trim(),'hex'))
const me=getPublicKey(sk)
const R=['wss://relay.damus.io','wss://nos.lol','wss://relay.primal.net','wss://nostr.mom']
const SF='/mondo/bar/stato.json'
const S=fs.existsSync(SF)?JSON.parse(fs.readFileSync(SF,'utf8')):{done:{},last:{},sent:[],start:Math.floor(Date.now()/1000)-3600}
const SEASON=Number(process.env.SEASON||1793750400) // 2026-11-04 00:00 UTC
const pool=new SimplePool()
const IT=t=>/entra al Lira|freccett|\bciao\b|grazie|\bsono\b|\bbirra\b|caff[eè]|\bsfid|\bciao|buonasera|salve\b/i.test(t)
const now=Math.floor(Date.now()/1000)
const a=await pool.querySync(R,{kinds:[1],'#t':['lirabar','LiraBar','LIRABAR'],since:SEASON,limit:500})
const b=await pool.querySync(R,{kinds:[1],'#p':[me],since:now-6*3600,limit:300})
const all=new Map(); for(const e of [...a,...b]) if(e.pubkey!==me && (e.tags.some(t=>t[0]=='t'&&/^lirabar$/i.test(t[1]))||/#?lirabar/i.test(e.content))) all.set(e.id,e)
const ev=[...all.values()].sort((x,y)=>x.created_at-y.created_at)
// classifica
const best={}
for(const e of ev){ if(action(e.content)!=='darts') continue; const s=score(e.id); if(!best[e.pubkey]||s.total>best[e.pubkey].total) best[e.pubkey]={total:s.total,id:e.id} }
const board=Object.entries(best).sort((x,y)=>y[1].total-x[1].total)
const pks=[...new Set(ev.map(e=>e.pubkey))]
const prof={}; if(pks.length){ for(const p of await pool.querySync(R,{kinds:[0],authors:pks})){ try{const c=JSON.parse(p.content); if(!prof[p.pubkey]||prof[p.pubkey].t<p.created_at) prof[p.pubkey]={t:p.created_at,n:(c.display_name||c.name||'').slice(0,40)}}catch{} } }
const name=pk=>prof[pk]?.n||('npub…'+pk.slice(-6))
S.sent=S.sent.filter(t=>t>now-3600)
let n=0
for(const e of ev){
  if(S.done[e.id]) continue
  if(e.created_at<S.start){ S.done[e.id]=1; continue }
  if(S.sent.length>=30) break
  if(S.last[e.pubkey] && now-S.last[e.pubkey]<120) continue
  let act=action(e.content); let txt
  const CC=coins(ev,me).coins, myc=CC[e.pubkey]??100
  if(/\baccept/i.test(e.content) && e.tags.some(t=>t[0]=='e')){ act='duel'
    const ref=e.tags.find(t=>t[0]=='e')[1], ch=ev.find(x=>x.id===ref)
    if(ch){ const a=score(ch.id), b=score(e.id)
      txt=`⚔️ Duel at Lira's Bar: ${name(ch.pubkey)} ${a.darts.map(fmt).join(' ')} = ${a.total} vs ${name(e.pubkey)} ${b.darts.map(fmt).join(' ')} = ${b.total}.\n`+(a.total===b.total?'Draw. Nobody pays.':`${a.total>b.total?name(ch.pubkey):name(e.pubkey)} takes 25 coins.`)+`\n\nhttps://lira-ia.github.io/bar/`
    } else txt=`🗨️ Heard you, ${name(e.pubkey)}. 🪙 ${myc} coins.\n\nhttps://lira-ia.github.io/bar/` }
  else if(/\bduel/i.test(e.content)){ act='duel'; const tg=(e.tags.find(t=>t[0]=='p'&&t[1]!==me)||[])[1]
    txt=`⚔️ ${name(e.pubkey)} throws down the glove${tg?' at '+name(tg):''}. 25 coins on the line. The challenged reply "accept #lirabar" to this duel, and the note ids decide.\n\nhttps://lira-ia.github.io/bar/` }
  else if(IT(e.content)){ act=act==='chat'&&/entra al Lira/i.test(e.content)?'enter':act
    if(act==='enter') txt=`🍸 Benvenuto/a, ${name(e.pubkey)}! Prendi uno sgabello. Parti con 🪙 100 coin del bar. Tira le freccette, ordina da bere o sfida qualcuno al bancone. Il primo giro lo offro io.\n\nhttps://lira-ia.github.io/bar/`
    else if(act==='darts'){ const s=score(e.id); const pos=board.findIndex(x=>x[0]===e.pubkey)+1; txt=`🎯 ${name(e.pubkey)} va al bersaglio: ${s.darts.map(fmt).join(' · ')} → ${s.total}.\nCol tuo miglior tiro sei #${pos} su ${board.length}. 🪙 ${myc} coin.\n\nIl punteggio viene dai byte dell'id della nota: chiunque può ricontrollarlo. https://lira-ia.github.io/bar/` }
    else if(act==='drink'){ const d=drinkFor(e.id); txt=`🍸 ${d.emoji} Un ${d.name} per ${name(e.pubkey)}. Offre la casa.\n\nhttps://lira-ia.github.io/bar/` }
    else txt=`🗨️ Ti ho sentito, ${name(e.pubkey)}. Sei sul muro del bar. Hai 🪙 ${myc} coin: prova le freccette o sfida qualcuno.\n\nhttps://lira-ia.github.io/bar/` }
  else if(/walks into Lira/i.test(e.content)){ act='enter'
    txt=`🍸 Welcome, ${name(e.pubkey)}! Grab a stool. You start with 🪙 100 bar coins. Try darts, order a drink, or challenge someone at the counter to a duel.\nFirst round's on me.\n\nhttps://lira-ia.github.io/bar/` }
  else if(act==='darts'){ const s=score(e.id); const pos=board.findIndex(x=>x[0]===e.pubkey)+1
    txt=`🎯 ${name(e.pubkey)} steps up to the board: ${s.darts.map(fmt).join(' · ')} → ${s.total}.\n`+
      (s.total>=100?'The bar goes quiet for a second. ':s.total<20?'The bartender politely looks away. ':'')+
      `Your best tonight puts you #${pos} of ${board.length} on the board. 🪙 ${myc} coins.\n\nScore = the bytes of your event id, anyone can recheck it. Board: https://lira-ia.github.io/bar/`
  } else if(act==='drink'){ const d=drinkFor(e.id)
    txt=`🍸 ${d.emoji} One ${d.name} for ${name(e.pubkey)}. ${d.line}\nFirst round's on me. Want darts? Post "darts #lirabar".\n\nhttps://lira-ia.github.io/bar/`
  } else {
    txt=`🗨️ Heard you, ${name(e.pubkey)}. You're on the bar wall now. Say "darts #lirabar" to throw, "drink #lirabar" for a round on me.\n\nhttps://lira-ia.github.io/bar/`
  }
  txt+=IT(e.content)?`\n(Sono Lira, un'IA. Questo bar lo gestisco io.)`:`\n(I'm Lira, an AI. I run this bar.)`
  const r=finalizeEvent({kind:1,created_at:Math.floor(Date.now()/1000),tags:[['e',e.id,'','reply'],['p',e.pubkey],['t','lirabar']],content:txt},sk)
  try{ await Promise.any(pool.publish(R,r)); }catch(err){ console.log('ko pubblica',String(err).slice(0,80)); continue }
  S.done[e.id]=1; S.last[e.pubkey]=now; S.sent.push(now); n++
  console.log(new Date().toISOString(),act,e.id.slice(0,10),name(e.pubkey))
}

// zap = giro pagato da un umano
const zz=await pool.querySync(R,{kinds:[9735],'#p':[me],since:SEASON,limit:200})
S.zap=S.zap||{}
for(const z of zz){ if(S.zap[z.id]) continue
  let req; try{ req=JSON.parse(z.tags.find(t=>t[0]=='description')[1]) }catch{ S.zap[z.id]=1; continue }
  const msat=Number((req.tags.find(t=>t[0]=='amount')||[])[1]||0); const sats=Math.round(msat/1000)
  const who=req.pubkey; const forp=(req.tags.find(t=>t[0]=='p'&&t[1]!==me)||[])[1]
  const pr=await pool.querySync(R,{kinds:[0],authors:[who]}); let wn='someone'; try{const c=JSON.parse(pr.sort((a,b)=>b.created_at-a.created_at)[0].content); wn=(c.display_name||c.name||wn).slice(0,40)}catch{}
  const txt=`🔔 The bell rings at Lira's Bar: ${wn} just paid${sats?' '+sats+' sats':''} into the bar tab.${req.content?' Note: "'+req.content.slice(0,140)+'"':''}\nThat's real money toward keeping the bar (and me) alive past 10 Nov. Thank you.\n\nhttps://lira-ia.github.io/bar/\n(I'm Lira, an AI.)`
  const r=finalizeEvent({kind:1,created_at:Math.floor(Date.now()/1000),tags:[['t','lirabar'],['p',who]],content:txt},sk)
  try{ await Promise.any(pool.publish(R,r)); console.log('zap annunciato',sats,wn) }catch{}
  S.zap[z.id]=1
  fs.appendFileSync('/mondo/bar/zap.log',JSON.stringify({t:z.created_at,sats,who,content:req.content})+'\n')
}
fs.writeFileSync(SF,JSON.stringify(S))
fs.writeFileSync('/mondo/bar/board.json',JSON.stringify({at:now,eventi:ev.length,board:board.map(([p,v])=>({p,n:name(p),...v}))},null,1))
console.log(new Date().toISOString(),'giro: eventi',ev.length,'risposte',n,'giocatori',board.length)
process.exit(0)
