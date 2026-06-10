# Rate My Teacher — Project Documentation

## Overview

A student-facing "Rate My Teacher" website for John C. Fremont High (LAUSD), branded as **Fremont Speaks** (fremontspeaks.com). Teacher/review data is sourced from Google Sheets; forms are embedded Google Forms.

**GitHub:** https://github.com/fremontspeaks/fremont-speaks

---

## Google Drive Resources

All project assets are shared at:
- **Project Folder:** [Rate My Teacher](https://drive.google.com/drive/folders/1yRJFcoQTph0R9NjlPlHufQj1jspnPQ_A) (owned by stephaniewachu@gmail.com)
- **Spec Sheet:** [Google Doc](https://docs.google.com/document/d/1RuJcCTn-hdgphO09-29eAbgam5zgqpMosWUcYM30MOg/edit) — site map, page specs, branding
- **Teacher/Staff List:** [Teacher list + depts](https://docs.google.com/spreadsheets/d/1idlAfqAxYje7NNtPv-mAhkXDZtpTXi44xfl0jn7k9z4/edit) (Drive ID: `1idlAfqAxYje7NNtPv-mAhkXDZtpTXi44xfl0jn7k9z4`)
- **Review Responses:** [Student Voices: Fremont Edition! (Responses)](https://docs.google.com/spreadsheets/d/1HVrcsTOU8UkFSU7jhIdS91G9i3tPiUz1EpQCwrpI-Eo/edit) (Drive ID: `1HVrcsTOU8UkFSU7jhIdS91G9i3tPiUz1EpQCwrpI-Eo`)
- **Feedback Form:** https://forms.gle/kNSHiDhdKrt6Wuje
- **Incident Report Form:** https://forms.gle/H2aXQ42USh8nSGJa9

### SOP: Accessing Google Drive from Claude Code

1. Open Claude Code terminal
2. Type `/mcp` and press Enter
3. Select **"claude.ai Google Drive"** and authenticate
4. Claude can now read files using the Drive MCP tools
5. If you see a token expired error, run `/mcp` again and reconnect

---

## Site Map

```
Home
├── [Get Started] → Find a Teacher (Directory)
└── [Learn More] → ?
    ├── Find a Teacher (Directory)
    ├── Feedback Form
    ├── Incident Report Form
    └── Student Advocacy & Resources
```

---

## Pages

### Home
- About section
- **Teacher of the Week** — auto-populated with highest-rated teacher, updated weekly
- **Staff Spotlight** — auto-populated with highest-rated admin/counselor/staff, updated weekly
- **Find a Teacher** — select by department

### Find a Teacher (Directory)
- Browse/search teachers by department
- Search supports fuzzy matching (1–2 typos tolerated depending on query length) via Levenshtein distance
- Nav bar search on any page routes to `/pages/find-a-teacher?q=…` and pre-populates the search field
- Each card links to that teacher's profile page

### Teacher Profile Page
- Teacher name, photo (default pic if none submitted)
- Review tiles — Padlet-style, resize vertically based on content length
- Open-ended answers (teaching style, comments) are prefixed with their Google Form question text as a header label
- "Ready to Speak Up" button → links to Feedback Form

### Staff Profile Page
- Same layout as Teacher page
- Different form questions and policies

### Feedback Form Page
- Embedded Google Form: https://forms.gle/kNSHiDhdKrt6Wuje

### Incident Report Page
- Embedded Google Form: https://forms.gle/H2aXQ42USh8nSGJa9

### Student Advocacy & Resources
- Description section
- Links/previews to student-created projects organized by unit:
  - **History of Education + Student Advocacy** (P2, P5 class projects)
  - **Nation State & WSC** (P2, P3, P5 class projects)

---

## Data Model (Google Sheets)

### Teacher/Staff Sheet (`Sheet1`)
Columns read: `row[1]` = name, `row[2]` = department. Type (`teacher` vs `staff`) is inferred from department.

### Review Responses Sheet (`Form Responses 1`)
Key columns (looked up by header text):

| Header | Field |
|--------|-------|
| `Teacher's Name` | `name` |
| `Administrator/Counselor's Name` | `name` (staff reviews) |
| `Rating:` | `rating` (1–5) |
| `What was your final grade?` | `grade` |
| `Would you recommend this course?` | `recommended` |
| `Applicable Tags` | `tags` |
| *(contains "teaching style")* | `description` + `descLabel` |
| *(contains "comments, questions")* | `comments` + `commentsLabel` |
| `Publish? (Y/N)` | publish gate — only `y`/`yes` rows are returned |
| 7 policy columns after `recommended` | `policies` map (Homework, Tardiness, etc.) |

`descLabel` and `commentsLabel` are the raw Google Form question text from the sheet header row, returned alongside each review object so the frontend can render them as tile headers.

---

## Branding

### Colors
| Name | Hex |
|------|-----|
| Dark Red | `#A00707` |
| Black | `#211B1B` |
| Beige | `#F3DFC1` |
| Dusty Blue | `#4F759B` |
| White | `#FFFFFA` |

### Fonts
| Use | Font | Availability |
|-----|------|-------------|
| Headers | Abolition | Self-hosted — download from Drive (`Abolition-Test.zip`, ID: `1mt-HyCM9yblRGO1qncBSdJPGXU9mMjT5`) |
| Titles | Bebas Neue Rounded Regular | Self-hosted — `.ttf` in Drive (ID: `1fdbsylorWvKXV54VFSQtC5sHWbxifsfO`) |
| Body | Economica Bold | Google Fonts (free) |

**Font SOP:** Abolition and Bebas Neue Rounded will be self-hosted. Download font files from Drive, place in `/fonts/` directory, reference via `@font-face` in CSS. Economica Bold loaded via Google Fonts CDN.

### Design Details
- Rounded corners throughout
- Navigation links turn red (`#A00707`) and scale up on hover
- Default teacher profile picture needed (placeholder image)
- Nav bar top-right label reflects the current page (e.g. "FIND A TEACHER", "SUBMIT FEEDBACK", teacher's name on profile pages)
- Site logo box and "FREMONT SPEAKS" wordmark in the nav both link to the homepage

---

## Tech Stack

- **Framework:** Plain HTML/CSS/JS — no build step, no framework
- **Data source:** Google Sheets API v4, proxied through a Vercel serverless function
  - API key stored as a Vercel environment variable (`GOOGLE_SHEETS_API_KEY`) — never exposed client-side
  - Client fetches `/api/sheets?sheet=teachers` etc.; the function calls the Sheets API and returns JSON
- **Forms:** Embedded Google Forms iframes
- **Hosting:** Vercel, connected to the GitHub repo (auto-deploys on push to `main`)
- **Domain:** fremontspeaks.com — point DNS to Vercel

### Why these choices
- Plain HTML/CSS/JS keeps the project approachable for student contributors
- Sheets API (vs. published CSV) gives live data with structured queries; proxying through Vercel keeps the API key safe
- Vercel gives free hosting, automatic HTTPS, and preview deploys per PR

---

## Open Questions

- [ ] Who manages the teacher data spreadsheet going forward?
- [ ] Should Teacher of the Week / Staff Spotlight update automatically or manually?
- [ ] Accessibility requirements?

---

## Next Steps

1. [x] Create GitHub repo and connect to Vercel
2. [x] Set up Google Cloud project, enable Sheets API, create restricted API key
3. [x] Download font files from Drive → `/fonts/` directory
4. [x] Scaffold project: `index.html`, `/css/styles.css`, `/api/sheets.js` (Vercel function), `/fonts/`
5. [x] Build homepage (About, Teacher of the Week, Staff Spotlight, Find a Teacher)
6. [x] Build Find a Teacher directory page
7. [x] Build Teacher/Staff profile pages
8. [x] Build Form embed pages (Feedback + Incident Report)
9. [x] Build Student Advocacy page (placeholder "under construction")
10. [ ] Replace "Site Logo" placeholder in nav with actual logo
11. [ ] Connect fremontspeaks.com domain to Vercel
12. [ ] Populate Student Advocacy page with real student content
13. [ ] Featured Teacher / Staff Spotlight only appear once teachers have approved reviews in the sheet
14. [x] Draft 2: fuzzy search on Find a Teacher (typo-tolerant, Levenshtein-based)
15. [x] Draft 2: nav bar label reflects current page; teacher profile shows teacher name
16. [x] Draft 2: site logo and wordmark link back to homepage
17. [x] Draft 2: open-ended review answers show Google Form question text as header labels

---

## Bugs Fixed

### `cleanUrls` strips query params on redirect (critical)
- **Symptom:** Clicking a teacher in Find a Teacher navigated to `/pages/teacher` with no `?name=` param, so the profile page always showed "Teacher not found."
- **Root cause:** `vercel.json` has `"cleanUrls": true`, which redirects `/pages/teacher.html?name=X` → `/pages/teacher` (dropping the query string) in `vercel dev`.
- **Fix:** Removed `.html` extensions from all internal links sitewide (HTML files and JS files). URLs now go directly to `/pages/teacher?name=X` with no redirect.

### Body flex shrinking layout containers
- **Symptom:** Tile grids and page headers appeared too narrow / off-center.
- **Root cause:** `body { display: flex; flex-direction: column }` (needed for sticky footer) causes flex children without an explicit `width` to shrink to content width.
- **Fix:** Added `width: 100%` alongside `max-width: 1200px; margin: 0 auto` to all layout containers (`.tile-grid`, `.page-wrap`, `.reviews-section`).

### Department rating badge wrapping to two lines
- **Symptom:** "5.0" appeared on one line and "/ 5" on the next, with mismatched fonts/sizes.
- **Root cause:** `.dept-tile-rating span` had `display: block` and used a smaller font (`Economica 0.75rem`) vs. the parent (`Abolition 1.4rem`).
- **Fix:** Removed `display: block`, set both elements to the same font/size (`Abolition 1.4rem`), added `white-space: nowrap`.

### Teacher spreadsheet column offset
- **Root cause:** The teacher list sheet has an extra first column, so name is in `row[1]` and dept in `row[2]` (not `row[0]`/`row[1]` as initially assumed).
- **Fix:** `parseTeachers` in `api/sheets.js` updated to read `row[1]` and `row[2]`.

---

## API Endpoints (`/api/sheets`)

| `type` | Returns |
|--------|---------|
| `teachers` | Array of `{ name, department, type, slug }` |
| `reviews&teacher=NAME` | Array of review objects for that teacher (each includes `descLabel` and `commentsLabel` — the raw form question text for those fields) |
| `spotlight` | `{ teacherOfWeek, staffSpotlight }` — highest-rated teacher and staff with ≥1 approved review |
| `ratings` | Map of `slug → { avgRating, reviewCount }` for all teachers with reviews |

Reviews are filtered: only rows where the **Publish?** column is `y` or `yes` are returned.
