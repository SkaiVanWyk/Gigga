import { supabase } from './supabase.js';
import { showMsg, bindPasswordToggle } from './utils.js';

bindPasswordToggle('toggleLoginPw', 'loginPassword');

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn      = document.getElementById('loginBtn');

  if (!email || !password) {
    showMsg('authMsg', 'Please fill in all fields.');
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'Logging in...';

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    showMsg('authMsg', error.message || 'Login failed. Check your credentials.');
    btn.disabled    = false;
    btn.textContent = 'Log In';
    return;
  }

  showMsg('authMsg', 'Logged in! Redirecting...', 'success');
  setTimeout(() => { window.location.href = 'profile.html'; }, 800);
});
