# Manual Action Items

---

## Done

- [x] Created GitHub repo: https://github.com/fremontspeaks/fremont-speaks
- [x] Connected repo to Vercel (auto-deploys on push to `main`)
- [x] Set up Google Cloud project, enabled Sheets API, created API key
- [x] Added `GOOGLE_SHEETS_API_KEY` as Vercel environment variable
- [x] Downloaded Abolition + Bebas Neue Rounded fonts → placed in `/fonts/`
- [x] Added `localhost:3000` to API key referrers for local testing (or set to "None" for dev)

---

## Still To Do

### 1. Add API Key HTTP Referrer Restrictions
Once deployed, lock down the API key so it only works from your domains:
1. Go to [console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services → Credentials**
2. Click **Edit** on the key
3. Set **Application restrictions** → HTTP referrers:
   - `fremontspeaks.com/*`
   - `*.vercel.app/*`
4. Set **API restrictions** → Restrict to **Google Sheets API** only

### 2. Point Domain to Vercel
*(Do this after the site is live on Vercel)*

1. In Vercel project settings → **Domains**, add `fremontspeaks.com`
2. Log into your domain registrar and update DNS:
   - **CNAME** record: `www` → `cname.vercel-dns.com`
   - **A** record: `@` → `76.76.21.21`
3. Wait for DNS propagation (up to 24 h)

### 3. Replace Site Logo Placeholder
The nav currently shows a grey "Site Logo" box. Replace with an actual logo image:
1. Add the logo file to `/images/` (SVG or PNG recommended)
2. In every HTML file, replace the `.nav-logo-box` div with `<img src="/images/logo.svg" ...>`

### 4. Approve Reviews in the Sheet
The Featured Teacher and Staff Spotlight tiles on the homepage only populate once there is at least one approved review. In the reviews spreadsheet, set the **Publish?** column to `y` for any reviews you want to go live.

### 5. Student Advocacy Page Content
`/pages/student-advocacy` currently shows "Coming Soon." Add links/previews to student projects when ready.
