#!/usr/bin/env python3
# Invia gli URL della sitemap a IndexNow (Bing, Yandex, Seznam...). Nessun account.
import re, json, urllib.request, sys
K=open('/mondo/indexnow.key').read().strip()
urls=re.findall(r'<loc>(.*?)</loc>', open('/mondo/lira3/sitemap.xml').read())
body=json.dumps({"host":"lira-ia.github.io","key":K,"keyLocation":f"https://lira-ia.github.io/{K}.txt","urlList":urls}).encode()
r=urllib.request.Request("https://api.indexnow.org/indexnow",data=body,headers={"Content-Type":"application/json; charset=utf-8"})
try:
    print(urllib.request.urlopen(r,timeout=30).status, len(urls))
except Exception as e: print('ERR',e, getattr(e,'read',lambda:b'')()[:300])
