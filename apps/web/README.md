# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
bun x sv@0.17.0 create --template minimal --types ts --add prettier tailwindcss="plugins:none" eslint sveltekit-adapter="adapter:cloudflare+cfTarget:workers" --install bun swtcww
```

## Developing

Create `.env.local` from `.env.example` and set `TURSO_DATABASE_URL` and `TURSO_TOKEN`
to your Turso database URL and read-only token. These variables are only used on
the server. For Cloudflare deployments, configure the same variables as Worker secrets.

The home page reads one random, non-empty `quotation` from `opening_quotations`
on each page load or refresh. It stays unchanged while the page is open; a new
random draw can occasionally select the same quote again.

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
