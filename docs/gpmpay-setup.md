# GPMPay payments

Webhook URL: **https://vndocs.net/api/gpmpay/webhook**

Open `/quan-ly-he-thong-123?tab=payments` while signed in as an administrator.
Confirm the bank code, receiving account and account-holder name. The initial
values come from the former checkout; verify they match the account connected
to GPMPay. Enter a random HMAC secret of at least 32 characters and save it.
Use exactly the same secret on GPMPay, select **HMAC signed**, paste the URL,
and click **Kiểm tra kết nối**. The website records the last successful signed
verification. Enable customer checkout only after configuration is correct.
Disable simulator delivery in GPMPay for production use.

The secret is stored server-side in the private GPMPAY_CONFIG record and is
excluded from the general admin configuration response. The payment admin GET
returns only whether a secret exists. An optional Cloudflare secret named
GPMPAY_WEBHOOK_SECRET overrides the stored secret; when set, edit it on
Cloudflare instead of the form. Never put secrets in NEXT_PUBLIC variables,
Git, logs or chat. No GPMPay API token is needed for webhook-only settlement.

## Behavior

- Each authenticated checkout creates a persistent order with a random six-character
  uppercase letter/digit reference (for example `K7M4Q9`),
  fixed server price, exact owner and receiving-account snapshot. The browser
  cannot choose the price or beneficiary user. Checkout retries reuse the same
  request ID; only the order's owner can read its status.
  References are reserved permanently by a database unique key; a collision
  generates a new code without overwriting another order. Existing 22-character
  references remain valid for previously issued QR codes. A short code must be a
  complete memo token. Ordinary six-letter words are ignored unless they name an
  actual order; a memo naming multiple orders is held for manual investigation.
- HMAC uses X-GPMPay-Signature: t=unix,v1=hex and SHA-256 over `t.raw_body`,
  with a five-minute timestamp tolerance. Unsigned/stale requests are rejected.
- Authenticated test:true probes return 200 without creating payments. SIMULATED
  events and outgoing transfers are ignored; they never activate real packages.
- REAL incoming transfers must match one exact random reference, amount,
  destination bank/account and the order's payment window. No fuzzy email or
  memo-prefix matching is retained. Unmatched real receipts remain visible for
  manual investigation; partial/overpayments are not automatically granted.
- Receipt IDs and bank reference/account combinations prevent duplicate credit.
  D1 transactions update membership and receipts atomically. Retries after a DB
  failure recover without granting twice. An active higher/permanent plan is
  never downgraded; a conflicting paid order is marked review for support.
- Plus is 50,000 VND and Pro is 149,000 VND for 30 days. Same-plan renewals add
  30 days to remaining time; upgrades start a new 30-day term. No automatic debit
  or recurring subscription is implemented or advertised.

Bankhook sync code and UI are removed. Former sync/check routes return 410, and
the old admin page redirects to payment configuration. Historical bank_transaction
records and existing memberships are preserved; nothing is dropped. Transfers
made using an old QR need manual investigation, not speculative reassignment.
The SQL migration is `migrations/0012_gpmpay_payments.sql`; runtime table creation
is idempotent for an existing D1 deployment. No mutation occurs during build.

Sources: https://docs.gpmpay.com/webhook and https://docs.gpmpay.com/simulator.
Tests use signed fixtures and SQLite; a real signed verification from your
GPMPay dashboard and a small real transfer remain deployment acceptance checks.
