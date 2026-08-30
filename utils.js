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
export function buildJobCard(job, showSave = false, isSaved = false) {
  const logo = job.profiles?.avatar_url
    ? `<img src="${getAvatarUrl(job.profiles.avatar_url)}" alt="${job.profiles.business_name}" />`
    : `<span>${(job.profiles?.business_name || 'B')[0].toUpperCase()}</span>`;

  const tags = (job.tags || []).slice(0, 3).map(t =>
    `<span class="job-tag">${t}</span>`
  ).join('');

  const saveButton = showSave ? `
    <button class="job-save-btn ${isSaved ? 'saved' : ''}" data-job-id="${job.id}" aria-label="${isSaved ? 'Unsave job' : 'Save job'}">
      ${isSaved ? '♥' : '♡'}
    </button>
  ` : '';

  return `
    <div class="job-card" data-id="${job.id}" tabindex="0" role="button" aria-label="View ${job.title}">
      ${saveButton}
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

/* ── Dark Mode ── */
export function initDarkMode() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const saved = localStorage.getItem('darkMode');
  const isDark = saved === 'true' || (saved === null && prefersDark);
  
  if (isDark) {
    document.documentElement.classList.add('dark-mode');
  }
  
  return isDark;
}

export function toggleDarkMode() {
  document.documentElement.classList.toggle('dark-mode');
  const isDark = document.documentElement.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDark);
  return isDark;
}

/* ── Loading States ── */
export function setLoading(btn, loading, originalText = '') {
  if (!btn) return;
  
  if (loading) {
    btn.dataset.originalText = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = `<span class="btn-spinner"></span> ${originalText || 'Loading...'}`;
  } else {
    btn.disabled = false;
    btn.textContent = btn.dataset.originalText || originalText;
  }
}

export function showLoadingOverlay(show = true) {
  let overlay = document.getElementById('loadingOverlay');
  
  if (show) {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'loadingOverlay';
      overlay.className = 'loading-overlay';
      overlay.innerHTML = '<div class="loading-spinner"></div>';
      document.body.appendChild(overlay);
    }
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  } else {
    overlay?.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

/* ── Form Validation ── */
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePhone(phone) {
  const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return re.test(phone);
}

export function validatePassword(password) {
  return password.length >= 8;
}

export function setFieldError(field, message) {
  const group = field.closest('.form-group');
  if (!group) return;
  
  let errorEl = group.querySelector('.field-error');
  if (!errorEl) {
    errorEl = document.createElement('small');
    errorEl.className = 'field-error';
    group.appendChild(errorEl);
  }
  
  errorEl.textContent = message;
  field.classList.add('error');
}

export function clearFieldError(field) {
  const group = field.closest('.form-group');
  if (!group) return;
  
  const errorEl = group.querySelector('.field-error');
  if (errorEl) errorEl.remove();
  
  field.classList.remove('error');
}

export function clearAllErrors(form) {
  form.querySelectorAll('.field-error').forEach(el => el.remove());
  form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
}

/* ── Local Storage Helpers ── */
export function storageGet(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage error:', e);
  }
}

export function storageRemove(key) {
  localStorage.removeItem(key);
}

/* ── Debounce ── */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/* ── Throttle ── */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/* ── Format Currency ── */
export function formatCurrency(amount, currency = 'ZAR') {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

/* ── Truncate Text ── */
export function truncate(text, length = 100) {
  if (!text || text.length <= length) return text;
  return text.slice(0, length) + '...';
}
