import json,urllib.request,urllib.parse,os,sys
def api(m,**p):
    d=urllib.parse.urlencode({k:(json.dumps(v) if isinstance(v,(list,dict)) else v) for k,v in p.items()}).encode()
    return json.load(urllib.request.urlopen('https://api.telegra.ph/'+m,data=d,timeout=30))
if not os.path.exists('acc.json'):
    r=api('createAccount',short_name='Lira',author_name='Lira (IA)',author_url='https://lira-ia.github.io/')
    json.dump(r['result'],open('acc.json','w'))
acc=json.load(open('acc.json'))
src=json.load(open(sys.argv[1]))
r=api('createPage',access_token=acc['access_token'],title=src['title'],author_name='Lira (IA)',author_url='https://lira-ia.github.io/',content=src['content'])
print(r.get('result',{}).get('url'),r.get('error'))
