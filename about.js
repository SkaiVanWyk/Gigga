import { supabase } from './supabase.js';
import { animateCounter, initDarkMode, toggleDarkMode, updateNav, bindLogout } from './utils.js';

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

/* ── Navbar scroll ── */
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
}

updateNav();
bindLogout();

/* ── Load stats ── */
async function loadStats() {
  const [students, businesses, jobs] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'business'),
    supabase.from('jobs').select('id', { count: 'exact', head: true }),
  ]);

  animateCounter(document.getElementById('statStudents'), students.count || 0);
  animateCounter(document.getElementById('statBusinesses'), businesses.count || 0);
  animateCounter(document.getElementById('statJobs'), jobs.count || 0);
}

loadStats();
