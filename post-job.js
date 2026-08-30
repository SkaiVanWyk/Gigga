import { supabase } from './supabase.js';
import { showMsg, initDarkMode, toggleDarkMode } from './utils.js';

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

/* ── Auth guard: must be logged in as business ── */
async function init() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const { data: profile } = await supabase.from('profiles').select('role, business_name').eq('id', user.id).single();
  if (!profile || profile.role !== 'business') {
    alert('Only business accounts can post jobs.');
    window.location.href = 'jobs.html';
    return;
  }

  /* Update nav */
  const navLogout = document.getElementById('navLogout');
  if (navLogout) {
    navLogout.addEventListener('click', async () => {
      await supabase.auth.signOut();
      window.location.href = 'index.html';
    });
  }

  bindForm(user.id);
}

function bindForm(userId) {
  document.getElementById('postJobForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('postJobBtn');
    btn.disabled    = true;
    btn.textContent = 'Posting...';

    const title        = document.getElementById('jobTitle').value.trim();
    const job_type     = document.getElementById('jobType').value;
    const category     = document.getElementById('jobCategory').value;
    const city         = document.getElementById('jobCity').value.trim();
    const pay          = document.getElementById('jobPay').value.trim();
    const description  = document.getElementById('jobDesc').value.trim();
    const requirements = document.getElementById('jobRequirements').value.trim();
    const deadline     = document.getElementById('jobDeadline').value || null;
    const tags         = document.getElementById('jobTags').value.split(',').map(t => t.trim()).filter(Boolean);

    if (!title || !job_type || !category || !city || !description) {
      showMsg('postJobMsg', 'Please fill in all required fields.');
      btn.disabled    = false;
      btn.textContent = 'Post Job 🚀';
      return;
    }

    const { error } = await supabase.from('jobs').insert({
      business_id: userId,
      title,
      job_type,
      category,
      city,
      pay,
      description,
      requirements,
      deadline,
      tags,
    });

    if (error) {
      showMsg('postJobMsg', error.message);
      btn.disabled    = false;
      btn.textContent = 'Post Job 🚀';
      return;
    }

    showMsg('postJobMsg', '🎉 Job posted successfully! Redirecting...', 'success');
    setTimeout(() => { window.location.href = 'profile.html'; }, 1200);
  });
}

init();
