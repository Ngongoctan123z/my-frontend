# Administrator access and Turnstile

Both admin layouts first require a signed authenticated session and the existing
root-admin allowlist. Guests redirect to login and ordinary users remain denied.
API authorization is unchanged. Authentication exceptions are no longer rendered
verbatim into the page.

Turnstile is an optional additional challenge for an already authorized
administrator. The server activates it only with both a real site key and secret;
absent/partial/test configuration does not strand the administrator at an unusable
widget. No fake verification token or success state is generated when disabled.
Runtime Cloudflare TURNSTILE_SITE_KEY (or the existing NEXT_PUBLIC name) is passed
as a public prop; the private secret stays on the server. This removes the need
for a public key to have been baked into an earlier Next build.

When enabled, the challenge requires a successful HTTP response and explicit
success=true from the existing verification API. Network errors and rejected
requests remain locked. sessionStorage is never trusted as verification evidence.
Retries issue a fresh widget; callbacks remain stable across parent renders.
Small containers use Cloudflare's compact widget rather than overflowing phones.

Tests exercise both real server layouts, allowed/denied identities, absent and
partial configuration, private-secret serialization, runtime site keys and real
client widgets with mocked Cloudflare events/network failures at 320 and 1280px.
Actual Cloudflare challenge solving requires a human and is not simulated as a
production verification.
