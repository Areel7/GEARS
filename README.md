# GEARS — Garrison Engineering And Robotic Society

The GEARS public website, plus a MongoDB backend and a secure admin CMS.

The public site is unchanged in design. Every section that used to read
from a static JavaScript file now reads the same content from the API,
and falls back to the bundled content if the API cannot be reached — so
the site renders identically either way.

```
.
├── src/                 React frontend (Vite)
│   ├── components/      Public components (design untouched)
│   ├── pages/           Public pages
│   ├── admin/           Admin dashboard (own routes, own theme)
│   ├── context/         Public site settings provider
│   ├── hooks/           useRemoteData (API + static fallback)
│   └── services/api.js  API client
└── server/              Node + Express + Mongoose API
    ├── src/models/      12 Mongoose models
    ├── src/controllers/ Route handlers
    ├── src/services/    Storage, exports, status automation
    ├── src/scripts/     seed.js, createAdmin.js
    ├── tests/verify.mjs End-to-end verification
    └── uploads/         Local file storage (default driver)
```

---

## 1. Setup

### Backend

```bash
cd server
npm install
cp .env.example .env
```

Fill in `server/.env`:

| Variable | Notes |
| --- | --- |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/gears` locally, or a MongoDB Atlas URI |
| `JWT_SECRET` | Generate one: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `CLIENT_URL` | Frontend origin(s), comma separated. Used for CORS |
| `PUBLIC_API_URL` | Public URL of this backend, used to build local file URLs |
| `STORAGE_DRIVER` | `local` (default) or `cloudinary` |

### Frontend

```bash
npm install
cp .env.example .env     # set VITE_API_URL if the API is not on localhost:5000
```

---

## 2. Migrate the existing content

This imports the content that currently lives in the frontend data files
— leadership, core team, alumni, presidents, home images and gallery
images — into MongoDB, uploading every image through the storage driver.

Set the initial admin credentials in `server/.env` first:

```
SEED_ADMIN_NAME=Muhammad Ahmad Samdani
SEED_ADMIN_DESIGNATION=Senior Admin
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=<a strong password>
```

Then:

```bash
cd server
npm run seed
```

What it imports:

| Content | Records | Source |
| --- | --- | --- |
| Leadership | 6 | `AllTeamData.js` (4 flagged for the home page strip) |
| Core team | 10 | `AllTeamData.js` + `MemberData.js` photos |
| Members | 10 | Created for each core team member |
| Alumni of the Year | 3 | `AllTeamData.js` |
| Presidents | 8 | `AllTeamData.js`, oldest first |
| Home images | 12 | `assets/images/gallary/` |
| Gallery images | 30 | `assets/images/ourgallery/` |

The seed is safe to run against a live database: it **skips** any
collection that already holds records. Pass `--force` to replace them,
`--only=gallery,home` to limit it, and `--registration=on` to open
registration. It never writes a hard-coded password — the initial admin
comes only from the `SEED_ADMIN_*` environment variables.

To add more admins later:

```bash
cd server
SEED_ADMIN_NAME="..." SEED_ADMIN_DESIGNATION="..." \
SEED_ADMIN_EMAIL="..." SEED_ADMIN_PASSWORD="..." npm run create-admin
```

---

## 3. Run

```bash
cd server && npm run dev     # API on http://localhost:5000
npm run dev                  # site on http://localhost:5173
```

- Public site: <http://localhost:5173>
- Admin login: <http://localhost:5173/gears-control-7q4m9xk2v8-login2512hassansultanumer-5rc7kta>

---

## 4. Admin dashboard

Sign in at `/gears-control-7q4m9xk2v8-login2512hassansultanumer-5rc7kta`, then:

The sign-in path is deliberately long and is never linked from the
public site. It is defined once in `src/admin/routes.js`; change it
there and every route, guard and redirect follows. `/admin` and
anything below it send visitors without a session to the public home
page rather than to the sign-in form, so the address is not revealed
by a redirect.


| Route | What it manages |
| --- | --- |
| `/admin` | Live counts, recent activity, registration switch |
| `/admin/registrations` | Submissions, statuses, manual entry, CSV/Excel export |
| `/admin/members` | Membership records, statuses, CSV/Excel export |
| `/admin/core-team` | Appointments, designations, images, CSV/Excel export |
| `/admin/president` | Current and historical presidents |
| `/admin/alumni` | Alumni of the Year |
| `/admin/leadership` | Supervisors and mentors |
| `/admin/gallery` | Public gallery images |
| `/admin/home-images` | Home achievements grid |
| `/admin/inventory` | Equipment and stock |
| `/admin/documents` | Reusable templates (PDF/DOC/DOCX/XLS/XLSX/PPT/PPTX) |
| `/admin/admins` | Dashboard accounts |
| `/admin/settings` | Registration switch, display limits |
| `/admin/profile` | Own details and password |

The dashboard has its own dark/orange/blue theme, scoped entirely under
`.gears-admin` so it cannot affect the public site. It is not linked from
the public navigation.

---

## 5. How the automations work

**Registration → Member.** Setting a registration to `Member` creates
the member record, or reactivates an existing one. Flipping the status
back and forth reuses the same record rather than creating duplicates,
and reverting never deletes the member.

**Member → Core Team.** Setting a member to `Core Member` creates or
reactivates a core team appointment. Any other status retires the
appointment — the person disappears from the public team page, but both
the member record and the historical appointment are kept.

Core team records reference the member rather than copying their name,
so the two can never disagree.

---

## 6. Registration on/off

The switch lives in MongoDB (`SiteSettings.registrationEnabled`) and is
controlled from **Admin → Settings** or the dashboard. When it is off:

- `/registration` shows the closed message instead of the form
- the Registration links disappear from the header and footer
- the server rejects `POST /api/registrations/public` with `403`

The last point is the one that matters: the server enforces it
independently, so a direct API call while registration is closed is
rejected regardless of what the frontend renders.

---

## 7. Display limits

The home achievements grid is a hand-authored CSS layout with 13 fixed
positions (`.gallery-item-1` … `-13`), so the number of images the public
page renders is capped by `homeGalleryLimit`, seeded at the current 12.

**Adding images in the admin does not change the public layout.** Raising
the limit in Admin → Settings is a deliberate act. The same applies to
the gallery page via `galleryLimit`.

---

## 8. File storage

MongoDB stores only metadata and a URL; binaries never go into a
document.

- `STORAGE_DRIVER=local` (default) writes to `server/uploads/` and serves
  it at `/uploads`. Works with no extra setup.
- `STORAGE_DRIVER=cloudinary` uploads to Cloudinary. Set
  `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and
  `CLOUDINARY_API_SECRET`. Recommended for production, where a container
  filesystem is usually ephemeral. If the credentials are incomplete the
  server logs a warning and falls back to local disk.

Replacing or deleting a record removes the old stored file.

Uploads are validated on **both** the MIME type and the file extension,
capped by size, and stored under a server-generated name — the client
filename is never trusted.

---

## 9. Security

- Passwords hashed with bcrypt (cost 12). `passwordHash` is `select: false`
  and stripped from every serialised output, so no query can leak it.
- Sessions in an HTTP-only cookie; a bearer token is returned only as a
  fallback for cross-site deployments where cookies are blocked.
- Every admin API requires authentication server-side. The React route
  guards are a convenience, not the protection.
- Login is rate limited (10 per 15 min), public submissions too
  (20 per hour).
- Login returns the same message for an unknown email and a wrong
  password, so the endpoint cannot be used to enumerate admin accounts.
- Deleting your own account, deactivating yourself, and removing the last
  admin are all blocked.
- CORS is restricted to `CLIENT_URL`. Helmet is enabled. Error responses
  never carry stack traces.
- Public endpoints return only public content — no emails, roll numbers
  or admin data.

---

## 10. Verify

```bash
cd server
npm run verify
```

Boots an in-memory MongoDB, starts the real Express app, runs the
migration, and exercises 119 checks covering authentication, the admin
profile, the registration switch (including a direct POST while it is
off), the Registration → Member and Member → Core Team automations,
public payload shapes, the display limit, CSV/XLSX exports, uploads and
downloads, admin management, password changes and persistence.

This uses `mongodb-memory-server`, a devDependency. Deploy with
`npm ci --omit=dev` to skip it, or remove it if you do not want the
verification script.

Frontend:

```bash
npm run build
npm run lint
```

Both are clean. Two pre-existing lint issues remain in files this work
did not touch: a `set-state-in-effect` error in `RegistrationPopup.jsx`
(a component that is currently not rendered) and an `exhaustive-deps`
warning in `MemberTeam.jsx`.

---

## 11. Deployment

Frontend and backend deploy independently.

**Frontend** (Vercel/Netlify): build `npm run build`, output `dist`. Set
`VITE_API_URL` to the deployed API. Add a SPA rewrite so `/admin/*`
resolves to `index.html`.

**Backend** (Render/Railway/AWS): start `npm start`. Set `MONGODB_URI`,
`JWT_SECRET`, `CLIENT_URL` (the deployed frontend origin),
`PUBLIC_API_URL`, `NODE_ENV=production`, and — if the frontend and API
are on different sites — `COOKIE_CROSS_SITE=true` so the session cookie
is sent with `SameSite=None; Secure`.

Use `STORAGE_DRIVER=cloudinary` in production unless the host gives you a
persistent disk.

**Database**: MongoDB Atlas.

Never commit `server/.env`. Only `VITE_`-prefixed variables reach the
browser; everything else stays on the server.

---

## 12. Known notes

- One migrated alumni record (Daniyal) has no photo. The original data
  points at `alumni/ahmad.jpg`, which does not exist on disk — only
  `ahmad.jpeg` — so that card renders without an image on the current
  site too. It is migrated as-is rather than silently substituted; upload
  a photo in Admin → Alumni of the Year to fix it.
- The 10 migrated core team members have no roll number, because the
  original site never recorded one. Rather than invent placeholders, the
  field is left empty for an admin to fill in.
- `npm audit` reports two moderate advisories from `uuid`, a transitive
  dependency of `exceljs` (used for Excel export). There is no fixed
  release that does not break `exceljs`.
- Upcoming projects and the gallery timeline are still static data. They
  were not in scope for the CMS.
