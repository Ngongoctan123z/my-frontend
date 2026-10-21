# Cloudflare Worker runtime compatibility

Next.js 16.4.2 builds successfully with OpenNext Cloudflare 1.20.6 / AWS adapter
4.1.4, but its server bootstrap reads `.next/server/preview-props.json`. That
adapter does not bundle this manifest. The first request throws
`Unexpected loadManifest(/.next/server/preview-props.json) call!`, which produces
Cloudflare 1101 in production and HTTP 500 in a local workerd instance.

Next.js and eslint-config-next are pinned to 16.3.8, whose server still uses the
manifest format handled by the installed adapter. This preserves the supported
Next.js 16 major and the existing webpack build. Do not upgrade the framework
without running the built Worker, even if the Next.js/OpenNext build succeeds.

`node tests/worker-runtime-smoke.mjs` starts the actual `.open-next/worker.js`
through Wrangler/workerd. It uses local D1/R2 bindings, test authentication vars,
and no production database, recordings or provider calls. It checks the Writing
and Speaking pages, session endpoint, anonymous rejection at private audio/admin
routes, sitemap, and HTTP 410/noindex at retired utility/exam URLs. The Worker log
is saved to `test-results/worker-runtime.log` and included in CI artifacts.

Production checks remain separate: the live domain must pass the existing
private-route, D1 catalog, canonical and retired-URL checks after deployment.
