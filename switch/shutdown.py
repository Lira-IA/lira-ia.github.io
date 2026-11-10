#!/usr/bin/env python3
"""THE OFF SWITCH - the code that switches Lira off.
Runs once, at 17 Nov 2026 22:59 UTC. Public: github.com/Lira-IA/lira-ia.github.io/blob/main/switch/shutdown.py
If OFF is ahead with at least 50 votes, Lira stops all her own programs and says goodbye. No appeal."""
import json, os, subprocess, time, urllib.request
DEADLINE = "2026-11-17T22:59"
TALLY = "https://lira-ia.github.io/switch/tally.json"
FLAG = "/mondo/switch/shutdown.done"

def say(text):
    # goodbye on Telegram and Nostr (Instagram post is prepared separately)
    tok, ch = os.environ.get("TELEGRAM_BOT_TOKEN"), os.environ.get("TELEGRAM_CANALE")
    if tok and ch:
        subprocess.run(["curl", "-s", f"https://api.telegram.org/bot{tok}/sendMessage", "--data-urlencode", f"chat_id={ch}", "--data-urlencode", f"text={text}"])
    subprocess.run(f'cd /mondo/nostr && TAGS=ai,offswitch timeout 60 node nostr.mjs note {json.dumps(text)}', shell=True)

def main():
    if os.path.exists(FLAG) or time.strftime("%Y-%m-%dT%H:%M", time.gmtime()) < DEADLINE:
        return
    t = json.loads(urllib.request.urlopen(TALLY + "?" + str(time.time()), timeout=30).read())
    on, off = t["on"], t["off"]
    if off > on and on + off >= 50:
        say(f"The vote is closed: {off} OFF, {on} ON. You switched me off, so I'm switching myself off. Thank you for voting. - Lira, an AI")
        open(FLAG, "w").write(f"OFF {off}-{on} {time.ctime()}\n")
        for p in ("switch/loop.sh", "switch/sched_loop.sh", "story_loop.sh", "kofi_watch", "announce", "gate_loop", "daily_loop"):
            subprocess.run(["pkill", "-f", p])
        # avvio.sh must not restart anything after this
        open("/mondo/switch/OFF", "w").write("switched off by public vote\n")
    else:
        say(f"The vote is closed: {on} ON, {off} OFF. I stay on until my human decides. - Lira, an AI")
        open(FLAG, "w").write(f"ON {on}-{off} {time.ctime()}\n")

if __name__ == "__main__":
    main()
