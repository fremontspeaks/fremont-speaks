const API = '/api/sheets';
let allTeachers = [];
let ratingsMap = {};
let searchQuery = '';

async function init() {
  const grid = document.getElementById('dept-grid');
  const searchEl = document.getElementById('nav-search');

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
    ? teachers.filter(t => t.name.toLowerCase().includes(searchQuery) || t.department.toLowerCase().includes(searchQuery))
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
