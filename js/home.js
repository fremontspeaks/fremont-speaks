const API = '/api/sheets';

async function loadSpotlight() {
  try {
    const res = await fetch(`${API}?type=spotlight`);
    if (!res.ok) throw new Error();
    const { teacherOfWeek, staffSpotlight } = await res.json();

    renderFeatured(document.getElementById('featured-teacher-tile'), teacherOfWeek, 'FEATURED TEACHER:');
    renderFeatured(document.getElementById('staff-spotlight-tile'), staffSpotlight, 'STAFF SPOTLIGHT:');
  } catch {
    setTileError('featured-teacher-tile');
    setTileError('staff-spotlight-tile');
  }
}

function renderFeatured(tile, person, label) {
  if (!person) { tile.innerHTML = `<div class="t-label">${label}</div><p style="opacity:0.5;margin-top:0.5rem;">No data yet</p>`; return; }
  const href = `/pages/teacher?name=${encodeURIComponent(person.name)}`;
  tile.innerHTML = `
    <div class="t-label">${label}</div>
    <a href="${href}" style="text-decoration:none;color:inherit;" class="featured-teacher">
      <div class="featured-photo-row">
        <div class="featured-photo" style="display:flex;align-items:center;justify-content:center;font-size:2rem;line-height:1;">★</div>
        <div>
          <div class="featured-rating">${person.avgRating.toFixed(1)}/5</div>
          <div class="featured-rating-label">Quality</div>
        </div>
      </div>
      <div class="t-heading" style="margin-top:0.5rem;">${esc(person.name)}</div>
    </a>
  `;
}

function setTileError(id) {
  const el = document.getElementById(id);
  if (el) el.innerHTML += `<p style="opacity:0.4;font-size:0.85rem;margin-top:0.5rem;">Could not load</p>`;
}

function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

loadSpotlight();
