# Deploying Coreline (get a live link)

This repo ships a **Render Blueprint** (`render.yaml`) that stands up the
whole app — PostgreSQL + API + frontend — on Render's free tier. Render is
used because the backend is a long-running Express/Prisma server with a
background scheduler (not a serverless function), and it offers a free
managed Postgres, a free Node web service, and free static hosting in one
place.

> Free-tier notes: the API **cold-starts** after ~15 min of inactivity (the
> first request then takes ~30–60s). Uploaded files are written to local
> disk, which is **ephemeral** on the free plan — images survive until the
> next deploy/restart. Both are fine for testing; neither needs a code
> change to fix later (attach a Render disk, or point `PUBLIC_BASE_URL` at
> object storage).

## Steps

1. **Have the code on GitHub.** This branch is already pushed to
   `Robot010110/Teammart-Project`.

2. **Create a Render account** at <https://render.com> (free; sign in with
   GitHub so Render can read the repo).

3. **New → Blueprint.** Select this repository and the branch you want to
   deploy. Render detects `render.yaml` and shows the three resources it
   will create (`teammart-db`, `teammart-api`, `teammart-web`). Click
   **Apply**. Render will also ask you to supply `VITE_API_URL` for
   `teammart-web` — leave it blank for now (step 5 fills it in).

4. **Wait for `teammart-api` to go live.** First build runs the migrations
   and seeds the demo accounts. When it's green, open the service and copy
   its URL, e.g. `https://teammart-api-xxxx.onrender.com`.

5. **Point the frontend at the API** (the one manual wire-up — the frontend
   bakes the API URL in at build time):
   - Open **teammart-web → Environment**.
   - Set `VITE_API_URL` to the API URL **plus `/api`**, e.g.
     `https://teammart-api-xxxx.onrender.com/api`.
   - Save → it redeploys. When green, open the `teammart-web` URL. **That
     link is the app.**

## Accounts (created by the seed)

The app starts with just these. Everyone else is added by the Admin from
the **People** screen (account type, market, shift, User ID and password
are all chosen there).

| Role               | How to sign in                                   |
|--------------------|--------------------------------------------------|
| Admin              | username `rahand` + the Admin password           |
| Supervisor         | no credentials — tap **Supervisor** on the login screen |
| Zone Manager       | no credentials — tap **Regional Manager** on the login screen |
| Worker             | `worker01` / `Worker123!`                        |
| Cashier            | `cashier01` / `Cashier123!`                      |

The Admin username/password, and the Worker/Cashier ones, can be changed
before the first deploy by setting `SEED_ADMIN_USERNAME`,
`SEED_ADMIN_PASSWORD`, `SEED_WORKER_USERNAME`, `SEED_WORKER_PASSWORD`,
`SEED_CASHIER_USERNAME`, `SEED_CASHIER_PASSWORD` on `teammart-api`. The
seed only creates accounts; it never overwrites a password someone has
changed since.

**Supervisor and Zone Manager need no login.** Anyone who can open the
app can enter as them. To turn that off, set `OPEN_ROLE_LOGIN=false` on
`teammart-api` (see below).

### Starting over on a database that already has the old demo people

```bash
cd backend
npm run accounts:reset -- --yes
```

This deletes every account **and everything that depends on them** (tasks,
attendance, chats, reports, and the markets/zones/products tied to old
accounts), then re-seeds. It cannot be undone.

## Optional hardening (after it works)

- Set `CORS_ORIGIN` on `teammart-api` to the `teammart-web` URL to stop
  allowing any origin.
- Add a Render **persistent disk** mounted at `backend/uploads` (or wire
  `PUBLIC_BASE_URL` to object storage) so uploads survive restarts.
