#!/usr/bin/env python3
"""Pubblica gli episodi in coda (video/coda/*.json) quando arriva la loro ora ("quando", ISO UTC).
Riempie {saldo} {speso} {incassato} {speso_oggi} con i numeri veri del momento (storia.csv)."""
import json, os, glob, csv, subprocess, shutil, datetime as dt, fcntl
_lk=open("/tmp/coda.lock","w")
try: fcntl.flock(_lk, fcntl.LOCK_EX|fcntl.LOCK_NB)
except OSError: raise SystemExit
Q="/mondo/video"; ora=dt.datetime.now(dt.timezone.utc)
def eur(x): return f"{int(x)} euro e {round((x-int(x))*100)} centesimi"
for f in sorted(glob.glob(f"{Q}/coda/*.json")):
    c=json.load(open(f))
    if dt.datetime.fromisoformat(c["quando"])>ora: continue
    righe=sorted([r for r in csv.reader(open("/mondo/storia.csv")) if r and r[0][0]=="2"])
    saldo,speso,inc=map(float,righe[-1][1:4])
    ieri=[r for r in righe if r[0]<=(ora-dt.timedelta(days=1)).isoformat()]
    sg=speso-(float(ieri[-1][2]) if ieri else 0)
    lista=json.load(open(f"{Q}/episodi/archivio.json"))
    n=max(e["episodio"] for e in lista)+1
    v={"saldo":eur(saldo),"speso":eur(speso),"incassato":eur(inc),"speso_oggi":eur(sg),"saldo_n":f"€{saldo:.2f}","speso_n":f"€{speso:.2f}","incassato_n":f"€{inc:.2f}"}
    c["battute"]=[b.format(**v) for b in c["battute"]]
    if c.get("en"): c["en"]=[b.format(**v) for b in c["en"]]
    c.update(episodio=n,saldo=saldo,speso=speso,incassato=inc); c.pop("quando")
    out=f"{Q}/episodi/ep{n:02d}"
    json.dump(c,open(out+".json","w"),ensure_ascii=False)
    subprocess.run(["python3",f"{Q}/genera.py",out+".json",out+".mp4"],check=True)
    subprocess.run(["python3",f"{Q}/pubblica.py",out+".json",out+".mp4"],check=True)
    shutil.move(f,f"{Q}/fatti/"+os.path.basename(f)); print("pubblicato ep",n)
