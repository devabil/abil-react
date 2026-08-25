# ABiL MEDiAS

Website and studio dashboard for ABiL MEDiAS, an independent creative studio in Geneva. Built with React 19, TypeScript and Vite, and deployed on Vercel.

The public site is available in French, English, Portuguese, German and Italian. It includes the home page, projects, case studies, services, agency, journal and contact pages.

The studio dashboard is available at `/admin`. It includes content editing, projects, blog, social media, CRM, proposals and the AI copilot. Features that depend on external accounts stay visibly unavailable until their environment variables are configured.

Production: https://abil-site.vercel.app

## Requirements

- Node 20+
- pnpm

## Commands

```bash
pnpm install     # install dependencies
pnpm dev         # dev server (Vite, port 5173)
pnpm build       # runs the build guards, then builds dist/
pnpm lint        # eslint
```

## Deploy

Every release is an explicit command line action.

```bash
test ! -e .vercel/output || mv .vercel/output ".vercel/output.previous.$(date +%s)"
npx vercel build --prod
test -f .vercel/output/config.json
test -f .vercel/output/static/index.html
test -f .vercel/output/static/dossier/content.js
npx vercel deploy --prebuilt --prod --archive=tgz
```

`--archive=tgz` is required because the project exceeds the upload file count limit. Build and deploy must run sequentially in one session. A second build erases `.vercel/output` while it starts, so never run concurrent release commands in this directory.

## Environment variables

Copy `.env.example` and fill in the values. Never commit real values. Only `.env.example` is tracked.

`VAULT_ENC_KEY` must be backed up and transferred before any administrator password is changed. It is the independent encryption key for private data.

Automated prospecting email remains disabled while `ABIL_SEND_HARD_OFF=1`. Keep it disabled until the team approves the recipients and the copy.

## Where things live

The internal operating manual is served at `/dossier/` and protected by an access code supplied separately. It documents each dashboard area, infrastructure, persistence, security, development, publication and migration.

```
api/          serverless functions (Vercel @vercel/node)
public/       static media, fonts, dossier and the pdf.js worker
src/
  App.tsx     the dashboard (large single file; edit with unique anchors, never rewrite whole)
  main.tsx    entry point
  index.css   design tokens and @font-face
  components/  hooks/  lib/  styles/
vercel.json   build, rewrites, headers, image config
```

## Safe handover order

1. Back up and transfer custody of `VAULT_ENC_KEY`.
2. Create a new private repository owned by ABiL from the delivered source package. Do not copy a local `.git` directory into that repository.
3. Transfer the Vercel project and custody of the active media store. Export and rehydrate the media first if the store cannot move with the project.
4. Transfer the domain and DNS.
5. Recreate all required environment variables in ABiL controlled accounts.
6. Verify administrator login and private collections.
7. Verify the public site, forms and configured integrations. Only then rotate passwords and revoke old access.
