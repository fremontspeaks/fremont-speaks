const TEACHER_SHEET_ID = '1idlAfqAxYje7NNtPv-mAhkXDZtpTXi44xfl0jn7k9z4';
const REVIEWS_SHEET_ID = '1HVrcsTOU8UkFSU7jhIdS91G9i3tPiUz1EpQCwrpI-Eo';

const STAFF_DEPTS = new Set([
  'SSS', 'SGMA', 'MSA', 'MSA/BSAP', 'LSJ', 'RSP', 'Principal',
  'Restorative Justice', 'Attendance', 'Office', 'ELD Office', 'Library',
]);

const POLICY_SCORES = { exemplary: 5, satisfactory: 4, 'neutral/ok': 3, 'needs improvement': 2, awful: 1 };
const POLICY_KEYS = ['Homework', 'Tardiness', 'Restroom', 'Office Hours', 'Grading', 'Cell Phones', 'Classroom Management'];

export default async function handler(req, res) {
  const { type, teacher } = req.query;
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  try {
    if (type === 'teachers') {
      const rows = await fetchSheet(TEACHER_SHEET_ID, 'Sheet1', apiKey);
      return res.status(200).json(parseTeachers(rows));
    }

    if (type === 'reviews') {
      const rows = await fetchSheet(REVIEWS_SHEET_ID, 'Form Responses 1', apiKey);
      return res.status(200).json(parseReviews(rows, teacher || null));
    }

    if (type === 'spotlight') {
      const [teacherRows, reviewRows] = await Promise.all([
        fetchSheet(TEACHER_SHEET_ID, 'Sheet1', apiKey),
        fetchSheet(REVIEWS_SHEET_ID, 'Form Responses 1', apiKey),
      ]);
      const teachers = parseTeachers(teacherRows);
      const allReviews = parseReviews(reviewRows, null);
      return res.status(200).json(computeSpotlight(teachers, allReviews));
    }

    if (type === 'ratings') {
      const [teacherRows, reviewRows] = await Promise.all([
        fetchSheet(TEACHER_SHEET_ID, 'Sheet1', apiKey),
        fetchSheet(REVIEWS_SHEET_ID, 'Form Responses 1', apiKey),
      ]);
      const teachers = parseTeachers(teacherRows);
      const allReviews = parseReviews(reviewRows, null);
      const ratingMap = buildRatingMap(allReviews);
      const result = {};
      for (const t of teachers) {
        const r = ratingMap[normalizeName(t.name)];
        if (r) result[t.slug] = { avgRating: (r.total / r.count).toFixed(1), reviewCount: r.count };
      }
      return res.status(200).json(result);
    }

    return res.status(400).json({ error: 'Invalid type parameter' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function fetchSheet(spreadsheetId, sheetName, apiKey) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}?key=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Sheets API error: ${response.status}`);
  const data = await response.json();
  return data.values || [];
}

function parseTeachers(rows) {
  const teachers = [];
  for (const row of rows) {
    const name = (row[1] || '').trim();
    const dept = (row[2] || '').trim();
    if (!name || name === 'default profile pic') continue;
    const isStaff = STAFF_DEPTS.has(dept) || (!dept && !name.match(/^(Mr\.|Ms\.|Dr\.|Mrs\.)/i));
    teachers.push({ name, department: dept || 'Other', type: isStaff ? 'staff' : 'teacher', slug: slugify(name) });
  }
  return teachers;
}

function parseReviews(rows, teacherFilter) {
  if (rows.length < 2) return [];
  const headers = rows[0].map(h => (h || '').toLowerCase().trim());

  const teacherNameCols = headers.reduce((acc, h, i) => { if (h === "teacher's name") acc.push(i); return acc; }, []);
  const adminNameCol    = headers.indexOf("administrator/counselor's name");
  const ratingCol       = headers.indexOf('rating:');
  const gradeCol        = headers.indexOf('what was your final grade?');
  const recommendCol    = headers.indexOf('would you recommend this course?');
  const tagsCol         = headers.findIndex(h => h.includes('applicable tags') && !h.includes('all'));
  const descCol         = headers.findIndex(h => h.includes('teaching style'));
  const publishCol      = headers.indexOf('publish? (y/n)');
  const commentsCol     = headers.findIndex(h => h.includes('comments, questions'));

  // Policy columns (7 consecutive columns starting after "would you recommend")
  const policyCols = POLICY_KEYS.map((_, i) => recommendCol + 1 + i).filter(i => i < headers.length);

  const descLabel    = descCol >= 0    ? (rows[0][descCol] || '').trim()    : '';
  const commentsLabel = commentsCol >= 0 ? (rows[0][commentsCol] || '').trim() : '';

  const reviews = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];

    let name = '';
    for (const col of teacherNameCols) {
      if (row[col] && row[col].trim()) { name = row[col].trim(); break; }
    }
    if (!name && adminNameCol >= 0 && row[adminNameCol]) name = row[adminNameCol].trim();
    if (!name) continue;

    if (teacherFilter) {
      const n = normalizeName(name), f = normalizeName(teacherFilter);
      if (!n.includes(f) && !f.includes(n)) continue;
    }

    const publish = (row[publishCol] || '').toLowerCase().trim();
    const published = publish === 'y' || publish === 'yes';

    const ratingRaw = ratingCol >= 0 ? (row[ratingCol] || '') : '';
    const ratingNum = parseInt(ratingRaw);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) continue;

    // Parse policy scores
    const policies = {};
    POLICY_KEYS.forEach((key, i) => {
      const val = (row[policyCols[i]] || '').toLowerCase().trim();
      policies[key] = POLICY_SCORES[val] ?? null;
    });

    // Recommend: treat numeric > 3 or text "yes" as recommended
    const recRaw = recommendCol >= 0 ? (row[recommendCol] || '') : '';
    const recNum = parseInt(recRaw);
    const recommended = isNaN(recNum) ? recRaw.toLowerCase().includes('yes') : recNum >= 4;

    reviews.push({
      name,
      rating: ratingNum,
      grade: gradeCol >= 0 ? (row[gradeCol] || '').trim() : '',
      recommended,
      policies,
      tags: tagsCol >= 0 ? (row[tagsCol] || '').split(',').map(t => t.trim()).filter(Boolean) : [],
      published,
      description: published && descCol >= 0 ? (row[descCol] || '').trim() : '',
      descLabel: published ? descLabel : '',
      comments: published && commentsCol >= 0 ? (row[commentsCol] || '').trim() : '',
      commentsLabel: published ? commentsLabel : '',
      timestamp: row[0] || '',
    });
  }
  return reviews;
}

function buildRatingMap(reviews) {
  const map = {};
  for (const r of reviews) {
    const key = normalizeName(r.name);
    if (!map[key]) map[key] = { total: 0, count: 0 };
    map[key].total += r.rating;
    map[key].count++;
  }
  return map;
}

function computeSpotlight(teachers, allReviews) {
  const ratingMap = buildRatingMap(allReviews);
  const scored = teachers.map(t => {
    const r = ratingMap[normalizeName(t.name)];
    return { ...t, avgRating: r ? r.total / r.count : 0, reviewCount: r ? r.count : 0 };
  }).filter(t => t.reviewCount > 0);

  const top = type => scored.filter(t => t.type === type).sort((a, b) => b.avgRating - a.avgRating)[0] || null;
  return { teacherOfWeek: top('teacher'), staffSpotlight: top('staff') };
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function normalizeName(name) {
  return name.toLowerCase().replace(/\s+/g, ' ').replace(/[().]/g, '').trim();
}
