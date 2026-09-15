# Broken Knuckles Auto Repair — website

Static site. No build step, no dependencies, no framework. Push it to GitHub, point
Cloudflare Pages at the repo, done.

```
index.html               the whole page
styles.css               all styling (design tokens at the top)
main.js                  animations + booking form
google-apps-script.gs    paste into Google Sheets to receive form submissions
assets/                  photos + favicon
_headers                 Cloudflare caching + security headers
robots.txt, sitemap.xml  SEO
```

---

## 1. Push to GitHub

```bash
cd broken-knuckles
git init
git add .
git commit -m "Broken Knuckles website"
git branch -M main
git remote add origin https://github.com/YOURNAME/broken-knuckles.git
git push -u origin main
```

## 2. Deploy on Cloudflare Pages

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Pick the repo.
3. Build settings:
   - **Framework preset:** `None`
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/`
4. **Save and Deploy.**

Every `git push` to `main` redeploys automatically.

To use your own domain: Pages project → **Custom domains** → **Set up a domain**.
If the domain is already on Cloudflare the DNS record is created for you.

---

## 3. Make the booking form write to a Google Sheet

Takes about five minutes.

1. Create a new Google Sheet (name it whatever you like).
2. In that sheet: **Extensions → Apps Script**.
3. Delete whatever is in `Code.gs` and paste the entire contents of
   `google-apps-script.gs` from this repo.
4. At the top of that script, set `NOTIFY_EMAIL` to your email address so you get
   an alert on every request. (Leave it as `""` if you'd rather just watch the sheet.)
5. **Deploy → New deployment → ⚙️ → Web app**
   - Description: `Booking form`
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`  ← this matters; without it the form gets a 401
6. Click **Deploy**, approve the permission prompts, and copy the
   **Web app URL** (ends in `/exec`).
7. Open `main.js` in this repo and paste it into line 1 of the config block:

   ```js
   const GOOGLE_SHEET_ENDPOINT = "https://script.google.com/macros/s/AKfy..../exec";
   ```

8. Commit and push. Submit a test request on the live site — a row appears in the
   sheet's **Requests** tab within a second or two.

**Checking it works:** open the `/exec` URL directly in a browser. You should see
`{"result":"ok","message":"Broken Knuckles booking endpoint is live."}`.

**If you change the script later,** you must redeploy: **Deploy → Manage deployments
→ ✏️ → Version: New version → Deploy**. The URL stays the same.

### What gets captured

| Submitted | Name | Phone | Vehicle | Service Type | Preferred Day | Preferred Time | Issue | Source |
|---|---|---|---|---|---|---|---|---|

A hidden "company" field on the form is a honeypot — anything that fills it is
silently discarded, which kills most spam bots without a captcha.

### Until you connect it

The form validates and then tells the customer to call the shop. If you'd rather it
open the customer's email app as a stopgap, set `FALLBACK_EMAIL` in `main.js`.

---

## 4. Editing content

Everything is plain HTML in `index.html`:

- **Phone number** — search for `3604698367` (appears in `tel:` links) and `(360) 469-8367`
- **Address** — search for `17002 415th Ave SE`
- **Services** — the six `<article class="card">` blocks under `<!-- SERVICES -->`
- **Reviews** — the `<blockquote>` blocks under `<!-- REVIEWS -->`
- **Colors** — the `:root` block at the top of `styles.css`. `--primary` is the amber,
  `--accent` is the red.

### Swapping photos

Drop a new file into `assets/` and update the `src` in `index.html`. Current photos:

| File | Where it appears |
|---|---|
| `hero-shop.jpg` | Full-bleed background at the top |
| `engine-work.jpg` | Large photo in "Straight From Mike" |
| `detail-work.jpg` | Small inset photo overlapping it |
| `mobile-repair.jpg` | Background of the roadside band |
| `shot-1…5.jpg` | The scrolling "Recent Work" strip |

Keep hero images under ~400 KB so the page stays fast.

---

## 5. Animations

All hand-written, all respecting `prefers-reduced-motion`:

- Diagonal hazard stripe scrolls across the top
- Hero background slow-zooms on load and parallaxes on scroll
- Headings, cards and sections fade and rise in as you reach them, staggered
- Stats count up from zero the first time they're seen
- Header compresses and a gradient scroll-progress bar fills across the bottom of it
- Active nav link gets an underline that wipes in
- Service cards lift, gain a gradient top edge, and their icon tilts
- Buttons sweep a periodic shine; the roadside call button pulses
- Stars pop in one after another
- "Recent Work" strip scrolls continuously and pauses on hover
- Form fields shake on invalid input; submit button spins while sending

Turning any of it off: they're all in `styles.css` — the keyframes are grouped and
named after what they do.
