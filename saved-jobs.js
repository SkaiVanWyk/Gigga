import { supabase } from './supabase.js';
import { buildJobCard, getAvatarUrl, timeAgo, initDarkMode, toggleDarkMode } from './utils.js';

/* ── Dark Mode ── */
initDarkMode();
const darkModeToggle = document.getElementById('darkModeToggle');
if (darkModeToggle) {
  darkModeToggle.addEventListener('click', () => {
    const isDark = toggleDarkMode();
    darkModeToggle.textContent = isDark ? '☀️' : '🌙';
  });
  
  const isDark = document.documentElement.classList.contains('dark-mode');
  darkModeToggle.textContent = isDark ? '☀️' : '🌙';
}

/* ── Auth check ── */
async function checkAuth() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'student') {
    alert('Only students can save jobs.');
    window.location.href = 'jobs.html';
    return null;
  }
  
  return user.id;
}

/* ── Load saved jobs ── */
async function loadSavedJobs(userId) {
  const { data: savedJobs, error } = await supabase
    .from('saved_jobs')
    .select('*, jobs(*, profiles(business_name, avatar_url))')
    .eq('student_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    document.getElementById('savedJobsMeta').textContent = 'Failed to load saved jobs.';
    return;
  }

  const grid = document.getElementById('savedJobsGrid');
  const empty = document.getElementById('emptySavedJobs');
  const meta = document.getElementById('savedJobsMeta');

  if (!savedJobs || savedJobs.length === 0) {
    grid.innerHTML = '';
    grid.classList.add('hidden');
    empty.classList.remove('hidden');
    meta.textContent = '';
    return;
  }

  grid.classList.remove('hidden');
  empty.classList.add('hidden');
  meta.textContent = `Showing ${savedJobs.length} saved job${savedJobs.length !== 1 ? 's' : ''}`;
  
  const jobs = savedJobs.map(sj => sj.jobs).filter(Boolean);
  grid.innerHTML = jobs.map(job => buildJobCard(job, true, true)).join('');

  /* Bind card clicks */
  grid.querySelectorAll('.job-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (!e.target.classList.contains('job-save-btn')) {
        window.location.href = `jobs.html#${card.dataset.id}`;
      }
    });
  });

  /* Bind save buttons */
  grid.querySelectorAll('.job-save-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSaveJob(userId, btn.dataset.jobId, btn);
    });
  });
}

/* ── Toggle save job ── */
async function toggleSaveJob(userId, jobId, btn) {
  const isSaved = btn.classList.contains('saved');
  
  if (isSaved) {
    // Unsave
    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('student_id', userId)
      .eq('job_id', jobId);
    
    if (!error) {
      btn.classList.remove('saved');
      btn.textContent = '♡';
      btn.setAttribute('aria-label', 'Save job');
      
      // Remove from grid if on saved jobs page
      const card = btn.closest('.job-card');
      if (card) {
        card.style.opacity = '0';
        setTimeout(() => {
          card.remove();
          const remaining = document.querySelectorAll('.job-card').length;
          document.getElementById('savedJobsMeta').textContent = 
            remaining > 0 ? `Showing ${remaining} saved job${remaining !== 1 ? 's' : ''}` : '';
          
          if (remaining === 0) {
            document.getElementById('savedJobsGrid').classList.add('hidden');
            document.getElementById('emptySavedJobs').classList.remove('hidden');
          }
        }, 300);
      }
    }
  } else {
    // Save
    const { error } = await supabase
      .from('saved_jobs')
      .insert({ student_id: userId, job_id: jobId });
    
    if (!error) {
      btn.classList.add('saved');
      btn.textContent = '♥';
      btn.setAttribute('aria-label', 'Unsave job');
    }
  }
}

/* ── Navbar scroll ── */
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
}

/* ── Logout ── */
document.getElementById('navLogout')?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
});

/* ── Initialize ── */
async function init() {
  const userId = await checkAuth();
  if (userId) {
    await loadSavedJobs(userId);
  }
}

init();
