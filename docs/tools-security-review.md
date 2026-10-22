# Floating tools and security review

Calculator and translation panels now use explicit dark surfaces, readable text,
clear input/result separation and keyboard focus indicators. Translation is capped
at 5,000 characters. Calculator/history and translation/history remain available;
services and tool dock gestures are preserved. Browser checks cover 320, 375 and
1280 pixel widths and require 4.5:1 text contrast on inputs/results and key buttons.

Security fixes:
- Remove committed fallback OAuth credentials, administrator password and JWT secret.
  Authentication requires the real Cloudflare AUTH_SECRET, AUTH_GOOGLE_ID and
  AUTH_GOOGLE_SECRET bindings. The emergency administrator login requires an
  explicitly configured WEB_ADMIN_PASSWORD. Debug authentication logging is off.
- Rate-limit credential attempts by account and client IP (best effort per Worker
  isolate; a distributed Cloudflare rule is still needed against coordinated abuse).
- Ordinary legacy plaintext passwords migrate to salted PBKDF2-SHA256 hashes on
  successful login with a conditional update. Privileged plaintext credentials
  are rejected; those administrators can use Google or the configured emergency
  password. PBKDF2 iterations respect Cloudflare's Web Crypto limit.
- Reject dangerous/external login callback URLs before passing them to the router.
- Remove fake CAPTCHA success in the widget and API. Require a real secret,
  upstream success and the expected hostname; public test keys fail closed.
- Bound translation/CAPTCHA request bytes before JSON parsing, validate types and
  languages, reject cross-origin requests and time out upstream translation calls.
- Retire unauthenticated legacy HTTP file conversion/merge proxies with 410.
- Add nosniff, referrer, framing/object/base restrictions and a permissions policy
  that preserves Speaking microphone access.

The GPMPay path already checks signed timestamped webhook payloads, account/amount
matching and atomic settlement; its existing tests remain required. Admin/payment
access checks, shared-link allowances and AI model/key rotation are unchanged.

Production dependency advisories are checked in CI; the JSON audit report is saved
as an artifact. Unit/integration checks exercise real auth configuration and routes
with local dependency stubs. The built Worker and deployed site are checked too.
This is a targeted code and dependency review, not a claim that every possible
security defect has been eliminated.

Operational follow-up: the previously committed OAuth secret and fixed signing
secret must be treated as exposed. Replace the Google OAuth secret in Google Cloud
and the AUTH_GOOGLE_SECRET binding, and use a new unpredictable AUTH_SECRET in
Cloudflare (this invalidates old sessions). Rotate any reused administrator password.
These account-side secret rotations require access outside this repository.


## Practice task navigation

One hook serves IELTS, TOEIC, TOPIK, HSK and Speaking in both language routes.
Task identity changes (part, selected question or new prompt) wait for rendered
content and modal closure, then scroll and focus the task region below a visible
fixed/sticky header. Typing and countdown updates never trigger navigation.
TOEIC picture/email/essay forward and backward navigation retains all answers.
Tests reproduce scrolling through five picture questions before moving to Q6 and
cover other Writing/Speaking parts and the fixed-header offset.


Cloudflare deployments provision a missing AUTH_SECRET through the existing build
identity with a random 256-bit value. Existing bindings are preserved. Google
credentials are copied only if already present in the build environment; no
committed fallback is reinstated and no secret value is printed. Deployment
credentials are never copied into the Worker. CI exercises idempotency, denied
permissions and secret redaction.
