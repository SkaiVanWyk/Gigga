import { supabase } from './supabase.js';
import { updateNav, bindLogout, buildJobCard, getAvatarUrl, getCvUrl, showMsg, timeAgo } from './utils.js';

updateNav();
bindLogout();

/* ── Navbar scroll ── */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
}

let allJobs    = [];
let currentFilter = 'all';
let searchTerm    = '';
let cityFilter    = '';
let typeFilter    = '';

/* ══════════════════════════════════════════
   LOAD JOBS
══════════════════════════════════════════ */
async function loadJobs() {
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*, profiles(business_name, avatar_url)')
    .order('created_at', { ascending: false });

  if (error) {
    document.getElementById('jobsMeta').textContent = 'Failed to load jobs.';
    return;
  }

  allJobs = jobs || [];
  renderJobs();
}

function renderJobs() {
  let filtered = allJobs;

  if (currentFilter !== 'all') {
    filtered = filtered.filter(j => j.category === currentFilter);
  }
  if (searchTerm) {
    const s = searchTerm.toLowerCase();
    filtered = filtered.filter(j =>
      j.title?.toLowerCase().includes(s) ||
      j.description?.toLowerCase().includes(s) ||
      (j.tags || []).some(t => t.toLowerCase().includes(s))
    );
  }
  if (cityFilter) {
    filtered = filtered.filter(j => j.city?.toLowerCase() === cityFilter.toLowerCase());
  }
  if (typeFilter) {
    filtered = filtered.filter(j => j.job_type === typeFilter);
  }

  const grid  = document.getElementById('jobsGrid');
  const empty = document.getElementById('emptyJobs');
  const meta  = document.getElementById('jobsMeta');

  if (!filtered.length) {
    grid.innerHTML = '';
    grid.classList.add('hidden');
    empty.classList.remove('hidden');
    meta.textContent = '';
    return;
  }

  grid.classList.remove('hidden');
  empty.classList.add('hidden');
  meta.textContent = `Showing ${filtered.length} job${filtered.length !== 1 ? 's' : ''}`;
  grid.innerHTML = filtered.map(buildJobCard).join('');

  /* Bind card clicks */
  grid.querySelectorAll('.job-card').forEach(card => {
    card.addEventListener('click', () => openJobModal(card.dataset.id));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') openJobModal(card.dataset.id);
    });
  });
}

/* ══════════════════════════════════════════
   JOB MODAL
══════════════════════════════════════════ */
async function openJobModal(jobId) {
  const job = allJobs.find(j => j.id === jobId);
  if (!job) return;

  const modal   = document.getElementById('jobModal');
  const content = document.getElementById('jobModalContent');
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  const logo = job.profiles?.avatar_url
    ? `<img src="${getAvatarUrl(job.profiles.avatar_url)}" alt="${job.profiles.business_name}" />`
    : `<span>${(job.profiles?.business_name || 'B')[0].toUpperCase()}</span>`;

  const tags = (job.tags || []).map(t => `<span class="job-tag">${t}</span>`).join('');

  const deadline = job.deadline
    ? `<div class="modal-meta-item">📅 Deadline: ${new Date(job.deadline).toLocaleDateString('en-ZA')}</div>`
    : '';

  content.innerHTML = `
    <div class="modal-job-header">
      <div class="modal-biz-logo">${logo}</div>
      <div>
        <div class="modal-job-title">${job.title}</div>
        <div class="modal-biz-name">by ${job.profiles?.business_name || 'Business'}</div>
      </div>
    </div>
    <div class="modal-meta">
      <div class="modal-meta-item">💼 ${job.job_type || 'Flexible'}</div>
      <div class="modal-meta-item">📍 ${job.city || 'Remote'}</div>
      <div class="modal-meta-item">🏷️ ${job.category || 'General'}</div>
      ${job.pay ? `<div class="modal-meta-item">💰 ${job.pay}</div>` : ''}
      ${deadline}
      <div class="modal-meta-item">🕐 Posted ${timeAgo(job.created_at)}</div>
    </div>
    ${tags ? `<div class="job-tags" style="margin-bottom:16px">${tags}</div>` : ''}
    <div class="modal-section-title">Description</div>
    <div class="modal-body">${job.description || 'No description provided.'}</div>
    ${job.requirements ? `
      <div class="modal-section-title">Requirements</div>
      <div class="modal-body">${job.requirements}</div>
    ` : ''}
    <button class="btn-primary modal-apply-btn" id="applyBtn" data-job-id="${job.id}" data-job-title="${job.title}">
      Apply Now →
    </button>
  `;

  document.getElementById('applyBtn')?.addEventListener('click', () => applyForJob(job.id, job.title));
}

function closeJobModal() {
  document.getElementById('jobModal').classList.add('hidden');
  document.body.style.overflow = '';
}

document.getElementById('jobModalClose')?.addEventListener('click', closeJobModal);
document.getElementById('jobModal')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('jobModal')) closeJobModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeJobModal();
});

/* ══════════════════════════════════════════
   APPLY FOR JOB
══════════════════════════════════════════ */
async function applyForJob(jobId, jobTitle) {
  const btn = document.getElementById('applyBtn');

  /* Check auth */
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    if (confirm('You need to be logged in to apply. Go to login page?')) {
      window.location.href = 'login.html';
    }
    return;
  }

  /* Check role */
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'student') {
    alert('Only students can apply for jobs.');
    return;
  }

  /* Check already applied */
  const { data: existing } = await supabase
    .from('applications')
    .select('id')
    .eq('job_id', jobId)
    .eq('student_id', user.id)
    .single();

  if (existing) {
    btn.textContent = '✅ Already Applied';
    btn.disabled    = true;
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'Sending...';

  const { error } = await supabase.from('applications').insert({
    job_id:     jobId,
    student_id: user.id,
    status:     'pending',
  });

  if (error) {
    btn.textContent = 'Apply Now →';
    btn.disabled    = false;
    alert('Failed to apply: ' + error.message);
    return;
  }

  btn.textContent = '✅ Application Sent!';
  btn.style.background = 'linear-gradient(135deg, var(--green), #10b981)';
}

/* ══════════════════════════════════════════
   FILTERS
══════════════════════════════════════════ */
document.getElementById('searchInput')?.addEventListener('input', (e) => {
  searchTerm = e.target.value.trim();
  renderJobs();
});

document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentFilter = chip.dataset.filter;
    renderJobs();
  });
});

document.getElementById('cityFilter')?.addEventListener('change', (e) => {
  cityFilter = e.target.value;
  renderJobs();
});

document.getElementById('typeFilter')?.addEventListener('change', (e) => {
  typeFilter = e.target.value;
  renderJobs();
});

loadJobs();
