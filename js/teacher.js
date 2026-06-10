const API = '/api/sheets';
const POLICY_KEYS = ['Homework', 'Tardiness', 'Restroom', 'Office Hours', 'Grading', 'Cell Phones', 'Classroom Management'];

const params = new URLSearchParams(location.search);
const teacherName = params.get('name') || '';

// Nav search → go to directory
const navSearch = document.getElementById('nav-search');
if (navSearch) {
  navSearch.addEventListener('keydown', e => {
    if (e.key === 'Enter' && navSearch.value.trim()) {
      location.href = `/pages/find-a-teacher?q=${encodeURIComponent(navSearch.value.trim())}`;
    }
  });
}

async function init() {
  const tilesEl = document.getElementById('teacher-tiles');
  const reviewsGrid = document.getElementById('reviews-grid');
  const reviewsTitle = document.getElementById('reviews-title');

  if (!teacherName) {
    tilesEl.innerHTML = '<div class="tile tile-beige tile-span2"><div class="t-heading">Teacher not found.</div></div>';
    return;
  }

  document.title = `${teacherName} — Fremont Speaks`;
  const navLabel = document.getElementById('nav-page-label');
  if (navLabel) navLabel.textContent = teacherName.toUpperCase();

  const [teachersRes, reviewsRes] = await Promise.all([
    fetch(`${API}?type=teachers`),
    fetch(`${API}?type=reviews&teacher=${encodeURIComponent(teacherName)}`),
  ]);

  const teachers = teachersRes.ok ? await teachersRes.json() : [];
  const reviews  = reviewsRes.ok  ? await reviewsRes.json()  : [];

  const norm = s => s.toLowerCase().replace(/\s+/g,' ').replace(/[().]/g,'').trim();
  const teacher = teachers.find(t => norm(t.name) === norm(teacherName)) || { name: teacherName, department: '' };

  // Compute aggregates from all responses
  const reviewCount  = reviews.length;
  const avgRating    = reviewCount ? reviews.reduce((s, r) => s + r.rating, 0) / reviewCount : null;
  const recommendPct = reviewCount ? Math.round(reviews.filter(r => r.recommended).length / reviewCount * 100) : null;

  const policyAvgs = {};
  for (const key of POLICY_KEYS) {
    const vals = reviews.map(r => r.policies[key]).filter(v => v !== null && v !== undefined);
    policyAvgs[key] = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
  }

  const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const r of reviews) dist[r.rating] = (dist[r.rating] || 0) + 1;

  const topTags = getTopTags(reviews);

  // Render tiles
  tilesEl.innerHTML = `
    <!-- Row 1: Name/photo + Rating -->
    <div class="tile tile-beige" style="min-height:140px; justify-content:center;">
      <div class="t-heading" style="font-size:clamp(2.2rem,8cqi,5rem);">${esc(teacher.name)}</div>
      <div style="color:var(--blue);font-size:clamp(0.9rem,2cqi,1.1rem);margin-top:0.4rem;">${esc(teacher.department)}</div>
    </div>
    <div class="tile tile-blue" style="align-items:flex-start;">
      <div class="t-label">OVERALL QUALITY</div>
      <div class="big-stat">${avgRating ? avgRating.toFixed(1) + '/5' : 'N/A'}</div>
      ${reviewCount ? `<div style="opacity:0.8;margin-top:0.4rem;font-size:0.9rem;">Based on ${reviewCount} rating${reviewCount !== 1 ? 's' : ''}</div>` : ''}
    </div>

    <!-- Row 2: Top tags + Class policies + Recommend % -->
    <div class="tile tile-blue">
      <div class="t-heading" style="font-size:1.5rem;margin-bottom:0.75rem;">TOP TAGS</div>
      <div class="tag-list">${topTags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
      ${!topTags.length ? '<p style="opacity:0.6;font-size:0.85rem;margin-top:0.5rem;">(top 6)</p>' : '<p style="opacity:0.6;font-size:0.8rem;margin-top:0.5rem;">(top 6)</p>'}
    </div>
    <div class="tile tile-black">
      <div class="t-heading" style="font-size:1.5rem;margin-bottom:0.875rem;">CLASS POLICIES</div>
      <ul class="policy-list">
        ${POLICY_KEYS.map(key => `
          <li class="policy-item">
            <span class="policy-score">${policyAvgs[key] !== null ? policyAvgs[key].toFixed(1) : '—'}</span>
            <span>${key}</span>
          </li>
        `).join('')}
      </ul>
    </div>
    ${recommendPct !== null ? `
    <div class="tile tile-beige" style="align-items:center;justify-content:center;text-align:center;">
      <div class="big-stat" style="color:var(--red);">${recommendPct}%</div>
      <div class="t-heading" style="font-size:1.2rem;margin-top:0.5rem;">WOULD RECOMMEND<br>THIS TEACHER</div>
    </div>` : ''}

    <!-- Row 3: Feedback distribution + CTA -->
    ${reviewCount ? `
    <div class="tile tile-beige">
      <div class="t-heading" style="font-size:1.4rem;margin-bottom:1rem;">FEEDBACK DISTRIBUTION</div>
      <div class="dist-chart">
        ${[5,4,3,2,1].map(n => {
          const count = dist[n] || 0;
          const pct = reviewCount ? Math.round(count / reviewCount * 100) : 0;
          const labels = {5:'Awesome-5',4:'Great-4',3:'Good-3',2:'OK-2',1:'Awful-1'};
          return `
            <div class="dist-row">
              <span class="dist-label">${labels[n]}</span>
              <div class="dist-bar-wrap"><div class="dist-bar" style="width:${pct}%"></div></div>
              <span class="dist-count">${count}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>` : ''}
    <div class="tile tile-blue" style="align-items:center;justify-content:center;text-align:center;gap:1rem;">
      <div class="t-heading" style="font-size:1.6rem;">READY TO SPEAK UP?</div>
      <a href="/pages/feedback" class="tile tile-black" style="min-height:auto;padding:0.75rem 2rem;text-decoration:none;border-radius:var(--radius);font-family:'BebasNeueRounded',sans-serif;font-size:1.1rem;letter-spacing:0.06em;color:var(--white);margin-top:0.25rem;">
        SUBMIT FEEDBACK
      </a>
    </div>
  `;

  // Render reviews
  const publishedReviews = reviews.filter(r => r.published);
  reviewsTitle.textContent = `Feedback from ${reviewCount} Student${reviewCount !== 1 ? 's' : ''}`;
  renderReviews(reviewsGrid, publishedReviews);
}

function renderReviews(grid, reviews) {
  if (!reviews.length) {
    grid.innerHTML = '<div class="empty-state">No reviews yet — be the first to leave one!</div>';
    return;
  }
  grid.innerHTML = reviews.map(r => `
    <div class="review-tile">
      <div class="review-tile-top">
        <div class="review-rating-num">${r.rating}</div>
        <div class="review-tags-col">
          <div class="tag-list">
            ${r.tags.slice(0,6).map(t => `<span class="tag" style="background:var(--blue);color:var(--white);">${esc(t)}</span>`).join('')}
          </div>
        </div>
        <div class="review-meta">
          ${r.grade ? `<div>Class grade: <strong>${esc(r.grade)}</strong></div>` : ''}
          ${r.recommended !== undefined ? `<div>Would recommend: <strong>${r.recommended ? 'Yes' : 'No'}</strong></div>` : ''}
        </div>
      </div>
      ${r.description ? `
        ${r.descLabel ? `<div class="review-tile-question">${esc(r.descLabel)}</div>` : ''}
        <div class="review-tile-body">${esc(r.description)}</div>` : ''}
      ${r.comments ? `
        ${r.commentsLabel ? `<div class="review-tile-question">${esc(r.commentsLabel)}</div>` : ''}
        <div class="review-tile-body">${esc(r.comments)}</div>` : ''}
    </div>
  `).join('');
}

function getTopTags(reviews) {
  const counts = {};
  for (const r of reviews) for (const t of r.tags) counts[t] = (counts[t] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t]) => t);
}

function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

init();
