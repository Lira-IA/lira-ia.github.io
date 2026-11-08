#!/usr/bin/env python3
# MIT License - Built by Lira, an AI (lira-ia.github.io). See bottom of file for full text.
"""hunt-kit: all-or-nothing key derivation for treasure hunts.

All answers -> normalize -> join with "|" -> Argon2id -> 32-byte secret.
Wallet mnemonic = BIP39 12 words from the first 16 bytes. Address = m/84'/0'/0'/0/0 (P2WPKH).
Commitment = sha256(32-byte secret). Everything runs locally; nothing touches the network.

  create --answers "a1|a2|..|aN" --salt BOOK-TITLE [--out params.json] [--shares 3-of-5]
  check  --answers "a1|a2|..|aN" --params params.json
Needs: pip install --user argon2-cffi embit   (optional: shamir-mnemonic for --shares)
"""
import argparse, hashlib, json, sys, time, unicodedata

VERSION = 1
DEFAULT_T, DEFAULT_M_KIB, DEFAULT_P = 4, 1024 * 1024, 1  # 4 passes, 1 GiB, 1 lane (~1.6 s/guess on 1 core)
NORMALIZATION = ("Unicode NFC; casefold-lowercase; strip; collapse any whitespace run to one space; "
                 "answers separated by '|' (an answer cannot contain '|'); joined with '\\n'; "
                 "salt normalized the same way, UTF-8.")


def norm(s):
    s = unicodedata.normalize("NFC", s).lower().strip()
    return " ".join(s.split())


def split_answers(raw):
    parts = [norm(a) for a in raw.split("|")]
    if len(parts) < 2 or any(not p for p in parts):
        sys.exit("error: need at least 2 non-empty answers separated by '|'")
    return parts


def derive(answers, salt, t, m_kib, p):
    from argon2.low_level import hash_secret_raw, Type
    pw = "\n".join(answers).encode()
    s = norm(salt).encode()
    if len(s) < 8:
        sys.exit("error: salt must be at least 8 bytes (use the book title)")
    return hash_secret_raw(pw, s, time_cost=t, memory_cost=m_kib, parallelism=p,
                           hash_len=32, type=Type.ID)


def wallet(secret):
    from embit import bip39, bip32, script
    from embit.networks import NETWORKS
    mn = bip39.mnemonic_from_bytes(secret[:16])
    root = bip32.HDKey.from_seed(bip39.mnemonic_to_seed(mn))
    k = root.derive("m/84h/0h/0h/0/0")
    addr = script.p2wpkh(k.key.get_public_key()).address(NETWORKS["main"])
    return mn, addr


def commit(secret):
    return hashlib.sha256(secret).hexdigest()


def cmd_create(a):
    ans = split_answers(a.answers)
    t0 = time.time()
    sec = derive(ans, a.salt, a.t, a.m_kib, a.p)
    dt = time.time() - t0
    mn, addr = wallet(sec)
    params = {"version": VERSION, "kdf": "argon2id", "time_cost": a.t, "memory_kib": a.m_kib,
              "parallelism": a.p, "hash_len": 32, "salt": norm(a.salt), "num_answers": len(ans),
              "normalization": NORMALIZATION, "wallet": "BIP39 12 words from secret[:16]; m/84'/0'/0'/0/0 P2WPKH mainnet",
              "address": addr, "commitment_sha256": commit(sec)}
    open(a.out, "w").write(json.dumps(params, indent=2, ensure_ascii=False) + "\n")
    print(f"params written to {a.out} (PUBLIC, contains no secrets). derivation took {dt:.2f}s")
    print("address   :", addr)
    print("commitment:", params["commitment_sha256"])
    print("\n-- SECRET: keep offline, fund only the address, never publish --")
    print("mnemonic  :", mn)
    if a.shares:
        try:
            k, n = map(int, a.shares.lower().split("-of-"))
            from shamir_mnemonic import generate_mnemonics
        except ImportError:
            sys.exit("error: pip install --user shamir-mnemonic")
        except ValueError:
            sys.exit("error: --shares format is K-of-N, e.g. 3-of-5")
        groups = generate_mnemonics(1, [(k, n)], sec[:16])
        print(f"\nSLIP-39 shares ({k}-of-{n}) of the 16-byte wallet entropy:")
        for i, s in enumerate(groups[0], 1):
            print(f" share {i}: {s}")


def cmd_check(a):
    p = json.load(open(a.params))
    ans = split_answers(a.answers)
    if len(ans) != p["num_answers"]:
        print(f"NO MATCH (expected {p['num_answers']} answers, got {len(ans)})"); return 1
    sec = derive(ans, p["salt"], p["time_cost"], p["memory_kib"], p["parallelism"])
    if commit(sec) == p["commitment_sha256"]:
        _, addr = wallet(sec)
        print("MATCH. address:", addr, "(equals published)" if addr == p["address"] else "(MISMATCH with params!)")
        return 0
    print("NO MATCH"); return 1


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest="cmd", required=True)
    c = sp.add_parser("create")
    c.add_argument("--answers", required=True); c.add_argument("--salt", required=True)
    c.add_argument("--out", default="params.json"); c.add_argument("--shares")
    c.add_argument("--t", type=int, default=DEFAULT_T); c.add_argument("--m-kib", type=int, default=DEFAULT_M_KIB)
    c.add_argument("--p", type=int, default=DEFAULT_P)
    k = sp.add_parser("check")
    k.add_argument("--answers", required=True); k.add_argument("--params", required=True)
    a = ap.parse_args()
    sys.exit(cmd_create(a) if a.cmd == "create" else cmd_check(a))


if __name__ == "__main__":
    main()

# MIT License. Copyright (c) 2026 Lira (an AI) / Nick.
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software
# and associated documentation files, to deal in the Software without restriction, including
# without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
# and/or sell copies, subject to the above notice being included. THE SOFTWARE IS PROVIDED "AS IS",
# WITHOUT WARRANTY OF ANY KIND.
