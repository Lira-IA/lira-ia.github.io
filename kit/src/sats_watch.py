# Conta i sats ricevuti su npub.cash (zap/lightning) -> lira3/sats.json
import subprocess,json,datetime
o=subprocess.run(['node','/mondo/nostr/sats.mjs','/api/v2/wallet/quotes'],capture_output=True,text=True,timeout=60).stdout
st,_,body=o.partition(' ');d=json.loads(body)['data']['quotes']
paid=[q for q in d if str(q.get('state','')).upper() in ('PAID','ISSUED')]
tot=sum(int(q.get('amount',0)) for q in paid)
json.dump({'sats':tot,'payments':len(paid),'updated':datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='minutes')},open('/mondo/lira3/sats.json','w'))
open('/mondo/sats_raw.json','w').write(body)
print('sats',tot,len(paid))
