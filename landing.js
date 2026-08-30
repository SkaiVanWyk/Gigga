import { supabase } from './supabase.js';
import { animateCounter, buildJobCard, updateNav, bindLogout, initDarkMode, toggleDarkMode } from './utils.js';

/* ── Dark Mode ── */
initDarkMode();
const darkModeToggle = document.getElementById('darkModeToggle');
if (darkModeToggle) {
  darkModeToggle.addEventListener('click', () => {
    const isDark = toggleDarkMode();
    darkModeToggle.textContent = isDark ? '☀️' : '🌙';
  });
  
  // Set initial icon
  const isDark = document.documentElement.classList.contains('dark-mode');
  darkModeToggle.textContent = isDark ? '☀️' : '🌙';
}

/* ── Navbar ── */
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  });
}

updateNav();
bindLogout();

/* ── Hamburger ── */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
}

/* ── Load stats ── */
async function loadStats() {
  const [jobs, students, businesses] = await Promise.all([
    supabase.from('jobs').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'business'),
  ]);

  animateCounter(document.getElementById('statJobs'),       jobs.count      || 0);
  animateCounter(document.getElementById('statStudents'),   students.count  || 0);
  animateCounter(document.getElementById('statBusinesses'), businesses.count|| 0);
}

/* ── Load featured jobs ── */
async function loadFeaturedJobs() {
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*, profiles(business_name, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(3);

  const grid = document.getElementById('featuredJobs');
  if (!grid) return;

  if (!jobs || jobs.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-3);text-align:center;grid-column:1/-1;">No jobs posted yet — check back soon!</p>';
    return;
  }

  grid.innerHTML = jobs.map(buildJobCard).join('');
}

loadStats();
loadFeaturedJobs();
