const API = '/api/sheets';
let allTeachers = [];
let ratingsMap = {};
let searchQuery = '';

async function init() {
  const grid = document.getElementById('dept-grid');
  const searchEl = document.getElementById('nav-search');

  const q = new URLSearchParams(location.search).get('q');
  if (q && searchEl) {
    searchEl.value = q;
    searchQuery = q.toLowerCase().trim();
  }

  try {
    const [teachersRes, ratingsRes] = await Promise.all([
      fetch(`${API}?type=teachers`),
      fetch(`${API}?type=ratings`),
    ]);
    allTeachers = teachersRes.ok ? await teachersRes.json() : [];
    ratingsMap = ratingsRes.ok ? await ratingsRes.json() : {};

    render(grid, allTeachers);

    if (searchEl) {
      searchEl.addEventListener('input', () => {
        searchQuery = searchEl.value.toLowerCase().trim();
        render(grid, allTeachers);
      });
    }
  } catch {
    grid.innerHTML = '<div class="empty-state">Could not load teachers.</div>';
  }
}

function render(container, teachers) {
  const filtered = searchQuery
    ? teachers.filter(t => fuzzyMatch(searchQuery, t.name) || t.department.toLowerCase().includes(searchQuery))
    : teachers;

  if (!filtered.length) { container.innerHTML = '<div class="empty-state">No teachers found.</div>'; return; }

  const byDept = {};
  for (const t of filtered) {
    if (!byDept[t.department]) byDept[t.department] = [];
    byDept[t.department].push(t);
  }

  const depts = Object.keys(byDept).sort();
  container.innerHTML = depts.map(dept => deptTile(dept, byDept[dept])).join('');
}

function fuzzyMatch(query, name) {
  const normalize = s => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const q = normalize(query);
  const n = normalize(name);

  if (n.includes(q)) return true;

  const qTokens = q.split(/\s+/).filter(Boolean);
  const nTokens = n.split(/\s+/).filter(Boolean);

  return qTokens.every(qt => {
    const threshold = qt.length <= 3 ? 0 : qt.length <= 6 ? 1 : 2;
    return nTokens.some(nt => nt.includes(qt) || (threshold > 0 && levenshtein(qt, nt) <= threshold));
  });
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = [];
  for (let i = 0; i <= m; i++) dp[i] = [i];
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

function deptTile(dept, teachers) {
  const ratings = teachers.map(t => ratingsMap[t.slug]?.avgRating).filter(r => r != null).map(Number);
  const deptAvg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null;

  const ratingBadge = deptAvg
    ? `<div class="dept-tile-rating">${deptAvg}<span>/ 5</span></div>`
    : '';

  const teacherLinks = teachers.map(t => {
    const r = ratingsMap[t.slug];
    const rating = r ? ` <span class="teacher-rating">· ${r.avgRating}</span>` : '';
    return `
      <a href="/pages/teacher?name=${encodeURIComponent(t.name)}" class="dept-teacher-link">
        <img src="/images/default-teacher.svg" alt="${esc(t.name)}" class="dept-teacher-photo" width="32" height="32">
        <span>${esc(t.name)}${rating}</span>
      </a>`;
  }).join('');

  return `
    <div class="dept-tile">
      <div class="dept-tile-header">
        <div class="dept-tile-name">${esc(dept)}</div>
        ${ratingBadge}
      </div>
      <div class="dept-teachers">${teacherLinks}</div>
    </div>`;
}

function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

init();
