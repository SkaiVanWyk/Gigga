import { supabase } from './supabase.js';

/* ── Navbar scroll effect ── */
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  });
  if (window.scrollY > 10) navbar.classList.add('scrolled');
}

/* ── Hamburger menu ── */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
}

/* ── Auth-aware nav ── */
export async function updateNav() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

  const navLogin  = document.getElementById('navLogin');
  const navSignup = document.getElementById('navSignup');
  const navLogout = document.getElementById('navLogout');
  const navPostJob= document.getElementById('navPostJob');
  const navProfile= document.getElementById('navProfile');

  if (navLogin)  navLogin.classList.add('hidden');
  if (navSignup) navSignup.classList.add('hidden');
  if (navLogout) navLogout.classList.remove('hidden');
  if (navProfile)navProfile.classList.remove('hidden');

  if (profile?.role === 'business' && navPostJob) {
    navPostJob.classList.remove('hidden');
  }
}

/* ── Logout ── */
export function bindLogout() {
  const btn = document.getElementById('navLogout');
  if (btn) {
    btn.addEventListener('click', async () => {
      await supabase.auth.signOut();
      window.location.href = 'index.html';
    });
  }
}

/* ── Show message ── */
export function showMsg(elId, text, type = 'error') {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = text;
  el.className = `auth-msg ${type}`;
  el.classList.remove('hidden');
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ── Password toggle ── */
export function bindPasswordToggle(btnId, inputId) {
  const btn = document.getElementById(btnId);
  const inp = document.getElementById(inputId);
  if (btn && inp) {
    btn.addEventListener('click', () => {
      inp.type = inp.type === 'password' ? 'text' : 'password';
      btn.textContent = inp.type === 'password' ? '👁' : '🙈';
    });
  }
}

/* ── Animate counter ── */
export function animateCounter(el, target, suffix = '') {
  let start = 0;
  const step = Math.ceil(target / 40);
  const timer = setInterval(() => {
    start = Math.min(start + step, target);
    el.textContent = start + suffix;
    if (start >= target) clearInterval(timer);
  }, 30);
}

/* ── Format date relative ── */
export function timeAgo(dateString) {
  const now  = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60)   return 'Just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  const days = Math.floor(diff/86400);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

/* ── Get avatar URL from storage ── */
export function getAvatarUrl(path) {
  if (!path) return null;
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data?.publicUrl || null;
}

/* ── Get CV URL from storage ── */
export function getCvUrl(path) {
  if (!path) return null;
  const { data } = supabase.storage.from('cvs').getPublicUrl(path);
  return data?.publicUrl || null;
}

/* ── Build job card HTML ── */
export function buildJobCard(job) {
  const logo = job.profiles?.avatar_url
    ? `<img src="${getAvatarUrl(job.profiles.avatar_url)}" alt="${job.profiles.business_name}" />`
    : `<span>${(job.profiles?.business_name || 'B')[0].toUpperCase()}</span>`;

  const tags = (job.tags || []).slice(0, 3).map(t =>
    `<span class="job-tag">${t}</span>`
  ).join('');

  return `
    <div class="job-card" data-id="${job.id}" tabindex="0" role="button" aria-label="View ${job.title}">
      <div class="job-card-header">
        <div class="job-biz-logo">${logo}</div>
        <div>
          <div class="job-title">${job.title}</div>
          <div class="job-biz-name">${job.profiles?.business_name || 'Business'}</div>
        </div>
      </div>
      <span class="job-type-badge">${job.job_type || 'Flexible'}</span>
      <div class="job-tags">${tags}</div>
      <div class="job-footer">
        <span class="job-pay">${job.pay || 'Negotiable'}</span>
        <div class="job-meta-info">
          <span class="job-meta-item">📍 ${job.city || 'Remote'}</span>
        </div>
      </div>
    </div>
  `;
}
