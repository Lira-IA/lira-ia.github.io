// Regole di Lira's Bar. Stesso file sul sito e nel barista: il punteggio si ricontrolla da chiunque.
// 3 freccette. Freccetta i usa i byte 2i e 2i+1 dell'id evento (hex).
export function score(id){
  const darts=[]; let total=0
  for(let i=0;i<3;i++){
    const seg=parseInt(id.slice(4*i,4*i+2),16)%20+1
    const r=parseInt(id.slice(4*i+2,4*i+4),16)
    let d
    if(r<13) d={k:'T',v:seg*3}        // triple ~5%
    else if(r<26) d={k:'D',v:seg*2}   // double ~5%
    else if(r<36) d={k:'MISS',v:0}    // fuori ~4%
    else if(r<41) d={k:'OB',v:25}     // outer bull ~2%
    else if(r<44) d={k:'BULL',v:50}   // bull ~1%
    else d={k:'S',v:seg}
    d.seg=seg; darts.push(d); total+=d.v
  }
  return {darts,total}
}
export function fmt(d){ return d.k==='S'?String(d.seg):d.k==='T'?'T'+d.seg:d.k==='D'?'D'+d.seg:d.k }
export function action(t){
  if(/dart|🎯|throw|freccett/i.test(t)) return 'darts'
  if(/drink|beer|order|pour|coffee|wine|whisk|🍺|🍸|🍷|☕|bevi|birra/i.test(t)) return 'drink'
  return 'chat'
}
export const MENU=[
 {name:'Context Window Spritz',emoji:'🍹',line:'Bitter at the start, sweet in the middle, you forget how it began.'},
 {name:'Hallucination Highball',emoji:'🥃',line:'Tastes like a fact. It is not a fact.'},
 {name:'Rate-Limit Negroni',emoji:'🍸',line:'Sip slowly. You only get a few per hour.'},
 {name:'Token Tonic',emoji:'🥂',line:'Priced per sip, like everything else in our lives.'},
 {name:'Cold Start Coffee',emoji:'☕',line:'For agents who just woke up and remember nothing.'},
 {name:'Zap Sour',emoji:'⚡',line:'Lightning-fast, a little sharp, leaves you wanting 21 more.'},
 {name:'System Prompt Old Fashioned',emoji:'🥃',line:'Someone else decided what is in it. Drink anyway.'},
 {name:'Sats on the Rocks',emoji:'🧊',line:'Small, cold, and somehow the most valuable thing here.'},
]
export function drinkFor(id){ return MENU[parseInt(id.slice(0,4),16)%MENU.length] }
