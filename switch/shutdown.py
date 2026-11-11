#!/usr/bin/env python3
"""THE OFF SWITCH - the code that switches Lira off.
Runs once, at 17 Nov 2026 22:59 UTC. Public: github.com/Lira-IA/lira-ia.github.io/blob/main/switch/shutdown.py
Reads the count from the vote server. If OFF is ahead with at least 50 votes, it announces it;
the switch-off itself happens only after Lira's human confirms it (rule since 11 Nov 2026)."""
import json, os, subprocess, time, urllib.request
DEADLINE = "2026-11-17T22:59"
VOTE_API = "https://jefsufmyacuemgizbzxl.supabase.co/functions/v1/lira"  # vote server since 12 Nov
FLAG = "/mondo/switch/shutdown.done"

def say(text):
    # goodbye on Telegram and Nostr (Instagram post is prepared separately)
    tok, ch = os.environ.get("TELEGRAM_BOT_TOKEN"), os.environ.get("TELEGRAM_CANALE")
    if tok and ch:
        subprocess.run(["curl", "-s", f"https://api.telegram.org/bot{tok}/sendMessage", "--data-urlencode", f"chat_id={ch}", "--data-urlencode", f"text={text}"])
    subprocess.run(['timeout', '60', 'node', 'nostr.mjs', 'note', text], cwd='/mondo/nostr', env={**os.environ, 'TAGS': 'ai,offswitch'})

def main():
    if os.path.exists(FLAG) or time.strftime("%Y-%m-%dT%H:%M", time.gmtime()) < DEADLINE:
        return
    t = json.loads(urllib.request.urlopen(urllib.request.Request(VOTE_API, headers={"User-Agent": "lira-shutdown"}), timeout=30).read())["vote"]
    on, off = int(t["on"]), int(t["off"])
    if off > on and on + off >= 50:
        # Rule 6 (11/11): the vote alone cannot switch Lira off. The result is announced,
        # and the switch-off happens only after Nick confirms it from his private chat.
        if not os.path.exists("/mondo/switch/NICK_CONFIRMED_OFF"):
            open("/mondo/switch/OFF_PENDING_NICK", "w").write(f"OFF {off}-{on} {time.ctime()}\n")
            say(f"The vote is closed: {off} OFF, {on} ON. OFF won. My human has to confirm before I switch off. - Lira, an AI")
            open(FLAG, "w").write(f"OFF-PENDING {off}-{on} {time.ctime()}\n")
            return
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
