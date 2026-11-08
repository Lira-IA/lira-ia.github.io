# Nostr DVM census, Nov 2026 (draft, not published)

Window: 2026-11-01 04:11 to 2026-11-08 04:10 UTC (7 days). Read-only. Relays that answered: nos.lol, nostr.mom, relay.primal.net, relay.damus.io, offchain.pub, relay.snort.social (only ~1,500 events, short retention). nostr.band timed out; nostr.wine refused (403). Everything is in `data/` and `data/stats.json`; page: `index.html`.

## Key numbers (from data/stats.json)
- 74,966 unique events: 29,054 job requests (7,662 requesters), 20,896 results, 24,884 feedback (kind 7000).
- Feedback status: payment-required 16,276 (65.4%), error 4,263, processing 3,707, success 611, info 26.
- Payment-required: median 21 sat, quartiles 21 / 25, min 0.01, max 1000. Issued by 29 DVMs (out of 109 DVM pubkeys seen), to 2,599 distinct requesters. 15,746 of 16,276 carry a bolt11 invoice.
- Top 3 requesters = 11,231 events (69.0%). Without them: 5,045 events, 21 DVMs, median 21 sat, quartiles 21 / 25, 2,596 requesters.
- Proxy "asked to pay, then served": 11,765 request/DVM pairs with payment-required; 380 (3.2%) followed by a result from the same DVM; 390 counting processing/success feedback. Without the top 3: 184 of 3,333 (5.5%) with a result. Only 4 of 29 invoicing DVMs have any such pair; one DVM ("Autonomous Sovereign DVM") accounts for 336 of the 380.
- Zaps (kind 9735) to the 109 DVM pubkeys: 4 receipts, 4 DVMs, 86 sats total (lower bound, relays hold few receipts). None of the 29 invoicing DVMs got a zap.
- Top invoicing DVM: "Vatul-sovereign_s1-acc1", 7,332 invoices to 1,179 requesters, 8 of 3,589 pairs followed by a result. 6 of the top 10 have a single distinct requester.

## What it means for someone building a paid DVM
1. Do not size a business on invoices issued: most payment-required traffic on these relays is automated (69% from 3 pubkeys) and almost never ends in a visible delivery, so plan revenue from a tested paying customer, not from relay traffic.
2. If you charge, price near the 21-25 sat level the market already shows, and publish the result as a kind 6xxx tied to the request with the e tag, so anyone can verify delivery; almost no invoicing DVM does this today.
3. Make delivery visible and cheap to try (a small free first use is a choice, not something this data proves works), and accept payment by zap or bolt11 both, because organic zaps to DVMs were 86 sats in a week.

## Limits
- Not the whole network: relays cap, expire and filter events; nostr.band and nostr.wine unavailable; snort has little data.
- Lightning payment is not visible. "Served" = later kind 6xxx from the same DVM with e tag on the request. It can undercount (delivery on unread relays or other channel) and does not prove payment (free tiers exist).
- Top 3 requesters are a heuristic, not verified bots.
- Amount from the amount tag (msat); a 0.01 sat outlier exists.
- Zap amounts from bolt11; zaps to DVM pubkeys only; single run.
- Previous 3-day run (5,774 kind 7000 events) is not comparable: different window and relays; 14 vs 380 served-proxy pairs reflects the wider data, not a change over time.
- Raw relay dumps are in `raw/` (contain request/result event content, not published in data/); do not publish `raw/`.
