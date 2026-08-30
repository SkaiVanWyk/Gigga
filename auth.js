import { supabase } from './supabase.js';
import { showMsg, bindPasswordToggle, initDarkMode, toggleDarkMode } from './utils.js';
import { toastSuccess, toastError } from './components/toast.js';

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

bindPasswordToggle('toggleLoginPw', 'loginPassword');

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn      = document.getElementById('loginBtn');

  if (!email || !password) {
    toastError('Please fill in all fields.');
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'Logging in...';

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    toastError(error.message || 'Login failed. Check your credentials.');
    btn.disabled    = false;
    btn.textContent = 'Log In';
    return;
  }

  toastSuccess('Logged in successfully!');
  setTimeout(() => { window.location.href = 'profile.html'; }, 800);
});

document.getElementById('googleLoginBtn')?.addEventListener('click', async () => {
  if (window.location.protocol === 'file:') {
    toastError('Google Login requires running the site on a local web server (e.g. Live Server or http://localhost) and does not support file:// URIs.');
    return;
  }
  localStorage.removeItem('oauth_role');
  const currentDir = window.location.href.split('/').slice(0, -1).join('/');
  const redirectTo = currentDir + '/profile.html';

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo }
  });

  if (error) {
    toastError(error.message || 'Google Login failed.');
  }
});
