# Request a Crosswalk Here

[requestacrosswalkhere.org](https://requestacrosswalkhere.org). Mark a spot that needs a crosswalk, post a half-letter sign with a QR code, and gather neighbors' support.

> **Note:** This app is 100% vibe coded, but also we should have more crosswalks.

Next.js 16, shadcn/ui (Base UI), Drizzle + libSQL (SQLite locally, Turso in prod), MapLibre + OpenFreeMap tiles, OpenStreetMap Overpass, Postmark, react-pdf.

## Setup

```sh
pnpm install
cp .env.example .env.local   # set APP_SECRET (openssl rand -base64 32)
pnpm db:migrate
pnpm dev
```

Without `POSTMARK_SERVER_TOKEN`, emails (including magic links) are printed to the server console.

## Flows

- **Request** (`/request`): pick a spot, cross streets resolved via Overpass, nearby requests (50 m) suggested instead. Request stays `pending` until the email link is clicked, then it goes on the map and the requester gets a link to the sign.
- **Support** (`/c/[id]`, the QR target): name, email, optional address, optional public name. Counted after email confirmation; confirmation email invites them to request another crosswalk.
- **Sign** (`/c/[id]/sign`): half-letter PDF.
- **Form letter** (`/c/[id]/letter`): editable recipient, print or copy.

## Database

```sh
pnpm db:generate   # after editing src/db/schema.ts
pnpm db:migrate    # applies to DATABASE_URL (local file or Turso)
pnpm db:studio
```
