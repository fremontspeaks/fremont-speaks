# Known Limitations & Fragile Points

A reference for anyone maintaining or modifying this project. These are things that could silently break if the Google Sheets/Forms setup is changed without updating the code.

---

## 1. Review form column lookup by header text

**File:** `api/sheets.js`

Most columns in the review responses sheet are found by searching the header row for specific substrings. If a Google Form question is renamed and the new name no longer contains the expected substring, that field silently returns empty for all reviews.

| Field | Substring searched for |
|-------|------------------------|
| Teacher name | `"teacher's name"` (exact) |
| Admin/counselor name | `"administrator/counselor's name"` (exact) |
| Rating | `"rating:"` (exact) |
| Final grade | `"what was your final grade?"` (exact) |
| Would recommend | `"would you recommend this course?"` (exact) |
| Tags | contains `"applicable tags"` |
| Teaching style (open-ended) | contains `"teaching style"` |
| Comments (open-ended) | contains `"comments, questions"` |
| Publish gate | `"publish? (y/n)"` (exact) |

**What breaks:** The field goes empty on all reviews. No error is thrown — it just silently disappears from the site.

---

## 2. Policy columns assumed to be consecutive

**File:** `api/sheets.js`, line ~95

The 7 class policy columns (Homework, Tardiness, Restroom, etc.) are assumed to appear consecutively in the sheet, starting immediately after the "Would you recommend" column. The code doesn't look them up by name — it just counts forward by index.

**What breaks:** If a column is inserted between "Would you recommend" and the policy columns, or between any two policy columns, every policy score shifts and maps to the wrong category.

---

## 3. Policy score text values are hardcoded

**File:** `api/sheets.js`, line ~9

```js
const POLICY_SCORES = { exemplary: 5, satisfactory: 4, 'neutral/ok': 3, 'needs improvement': 2, awful: 1 };
```

These must exactly match the dropdown option text in the Google Form (case-insensitive). If any option label is renamed, that score returns `null` and doesn't count toward the average.

---

## 4. Sheet tab names are hardcoded

**File:** `api/sheets.js`, lines ~1, 19, 24

```js
'Sheet1'           // teacher/staff list
'Form Responses 1' // review responses
```

If either spreadsheet tab is renamed, the API returns a 400 error and the whole page fails to load.

---

## 5. Teacher list column positions are hardcoded

**File:** `api/sheets.js`, line ~71

Teacher name is read from `row[1]` and department from `row[2]`. If a column is inserted before or between these, names and departments will be wrong or empty.

---

## 6. Staff department list is hardcoded

**File:** `api/sheets.js`, lines ~4–7

```js
const STAFF_DEPTS = new Set([
  'SSS', 'SGMA', 'MSA', 'MSA/BSAP', 'LSJ', 'RSP', 'Principal',
  'Restorative Justice', 'Attendance', 'Office', 'ELD Office', 'Library',
]);
```

Any department not in this list is classified as a teacher, not staff. If a new staff department is added to the sheet, those people will appear in teacher listings and teacher-of-the-week calculations instead of staff spotlight.

---

## 7. Teacher name matching between sheets

**File:** `api/sheets.js`

Reviews are linked to teachers by fuzzy name matching (`normalizeName`). If a teacher's name is spelled differently in the review responses sheet vs. the teacher list sheet (e.g., "Mr. Garcia" vs. "Garcia, Mr."), their reviews won't be counted in their profile's rating, and they won't be eligible for Teacher of the Week.

---

## 8. "Teacher of the Week" is not actually weekly

**File:** `api/sheets.js`, `js/home.js`

The Featured Teacher and Staff Spotlight tiles always show whoever has the highest average rating at that moment. There is no weekly reset or rotation logic — the name is slightly misleading.

---

## 9. No API response caching

**File:** `api/sheets.js`

Every page load makes fresh requests to the Google Sheets API. The free tier allows 100 requests per 100 seconds. If the site gets significant traffic simultaneously, it may hit rate limits and return errors. This isn't a concern at low traffic but worth knowing.

---

## 10. Google Form embeds are hardcoded

**Files:** `pages/feedback.html`, `pages/incident-report.html`

The embedded Google Forms use hardcoded form IDs. If a form is deleted and recreated (rather than edited in place), the embed will break and show an error inside the iframe.

---

## 11. Google Sheets API key

**Vercel env var:** `GOOGLE_SHEETS_API_KEY`

If this key is deleted, rotated, or its restrictions are tightened (e.g., domain referrer rules blocking Vercel preview URLs), the entire site stops loading data. The key lives only in Vercel — it is not in the GitHub repo.
