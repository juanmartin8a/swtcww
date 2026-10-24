# swtcww

A SvelteKit website that displays a random Clone Wars opening quotation from Turso.
Deployed as a Cloudflare Worker with static assets (not a static-only Pages upload).

## Developing

Run all commands from `apps/web`. Install [Bun 1.4.0](https://bun.sh/) and a current Node.js LTS
release for Wrangler.

```sh
bun install --frozen-lockfile
cp .env.example .env.local
```

Set `TURSO_DATABASE_URL` and `TURSO_TOKEN` in `.env.local` to your Turso database URL
and read-only token, then run `bun run dev`. These variables are private and read
at runtime; never commit credentials. Wrangler also reads `.env.local` for local
production previews. Do not create a `.dev.vars` file alongside it, as that takes precedence.

The home page reads one random, non-empty `quotation` from `opening_quotations`
on each page load or refresh. It stays unchanged while the page is open; a new
random draw can occasionally select the same quote again.

The season, episode number, and episode name sit below the quote, hidden until
hovered or focused with the keyboard. They fade into view; click or press Enter/Space
to toggle whether they stay visible after the cursor leaves. Hover always reveals
the details when using a mouse; touch devices use taps to show or hide them.
Reduced-motion preferences disable the fade.

## Validate and preview

```sh
bun run check
bun run lint
bun run deploy:check
bun run preview
```

`deploy:check` builds and bundles the Worker without uploading anything. The preview
runs the production build in the local Workers runtime at `http://localhost:4173`.
Builds and checks regenerate Cloudflare types automatically so clean checkouts work
before the generated Worker exists. After changing Wrangler bindings or upgrading
Wrangler, run `bun run gen` and commit the updated `worker-configuration.d.ts`.

## Deploy to Cloudflare Workers

The Worker name is `swtcww` in `wrangler.jsonc`. Change it before the first deployment
if you want a different name. No Cloudflare account ID or credentials belong in source control.

### From your computer

For the first deployment, create an ignored secrets file from the template and
replace its placeholders with your production database URL and read-only token:

```sh
cp .env.example .env.production
bunx wrangler login
bun run deploy --secrets-file .env.production
```

The `--secrets-file` option uploads both secrets alongside the initial Worker code.
Keep `.env.production` out of version control. Local `.env.local` values are **not**
uploaded automatically.
The database must already contain an `opening_quotations` table with `quotation`,
`season`, `episode`, and `episode_name` columns. Only non-empty quotations are shown.
Use a read-only Turso token.

For subsequent code deployments, run `bun run deploy`; existing Worker secrets
are preserved. To update individual secrets, use the interactive prompts:

```sh
bunx wrangler secret put TURSO_DATABASE_URL
bunx wrangler secret put TURSO_TOKEN
```

`deploy` builds before uploading the server and static assets. Wrangler prints the
public `workers.dev` URL. Open it and refresh to verify that quotations load. Requests
are not cached, so each refresh queries Turso. Worker logs are enabled; use
`bunx wrangler tail` to investigate deployment/runtime errors.

### Git-connected deployment (Cloudflare Workers Builds)

Connect this repository under **Workers & Pages → Create → Import a repository**
and choose Workers, with these settings:

| Setting        | Value                  |
| -------------- | ---------------------- |
| Root directory | `apps/web`             |
| Build command  | `bun run build`        |
| Deploy command | `bunx wrangler deploy` |

Before the first build, set the **build variable** `BUN_VERSION` to `1.4.0` under
**Settings → Build → Build Variables and Secrets**. Cloudflare's documented default
is Bun 1.2.15, not the version used to validate this project. See the
[Workers Builds image documentation](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/).

Cloudflare installs dependencies using `bun.lock`. Configure `TURSO_DATABASE_URL`
and `TURSO_TOKEN` as **runtime secrets** on the `swtcww` Worker before deployment,
using the initial CLI deployment above or **Settings → Variables and Secrets**. Build variables are
separate from runtime secrets. Keep non-production branch deployments disabled
until you have deliberately configured their secrets and database access.

To attach your own domain, add a `routes` entry to `wrangler.jsonc`, replacing the
example hostname with a domain managed in your Cloudflare account, and redeploy:

```jsonc
"routes": [{ "pattern": "quotes.example.com", "custom_domain": true }]
```

Keep the domain in Wrangler configuration so future deployments use the same routing.
Cloudflare manages the DNS record and TLS certificate.
