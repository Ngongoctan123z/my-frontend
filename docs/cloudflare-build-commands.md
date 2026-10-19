# Workers Builds commands

This repository uses Next.js 15 + OpenNext, deployed to the existing `my-frontend` Worker. GitHub Actions verifies the build; the connected Cloudflare Git integration publishes it.

Dashboard → Workers & Pages → my-frontend → Settings → Builds:

| Field | Value |
| --- | --- |
| Production branch | `main` |
| Build command | `npm run pages:build` |
| Production deploy command | `npm run deploy` |
| Non-production / Preview command, if enabled | `npm run deploy:preview` |

`pages:build` produces `.open-next/worker.js` and its assets. `deploy` publishes that output. `deploy:preview` uses OpenNext's version upload command and does not promote the version to production.

The 2026-10-19 supplied log completed `next build` and then failed on `npx wrangler preview` because the repository has no `previews` resource block. Cloudflare's newer Worker Previews flow has its own resource configuration. This repository uses the supported version upload flow instead. A preview failure does not by itself establish that the separate main deployment failed.

Do not change the Next.js `build` script to invoke OpenNext: OpenNext invokes that script internally. Dashboard configuration is not stored in this repository and must be changed there by an account with the relevant access.

Sources: [Cloudflare build branches](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/), [Cloudflare configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), [OpenNext deploy and upload](https://opennext.js.org/cloudflare/howtos/dev-deploy).
