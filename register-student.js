import { supabase } from './supabase.js';
import { showMsg, bindPasswordToggle, initDarkMode, toggleDarkMode } from './utils.js';

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

bindPasswordToggle('toggleStudentPw', 'studentPassword');

/* ── Avatar preview ── */
let avatarFile = null;
const avatarInput   = document.getElementById('avatarInput');
const avatarPreview = document.getElementById('avatarPreview');

avatarInput?.addEventListener('change', (e) => {
  avatarFile = e.target.files[0];
  if (avatarFile) {
    const url = URL.createObjectURL(avatarFile);
    avatarPreview.innerHTML = `<img src="${url}" alt="Preview" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
  }
});
avatarPreview?.addEventListener('click', () => avatarInput?.click());

/* ── CV drop zone ── */
let cvFile = null;
const cvInput    = document.getElementById('cvInput');
const cvDropZone = document.getElementById('cvDropZone');
const cvLabel    = document.getElementById('cvLabel');

cvDropZone?.addEventListener('click', () => cvInput?.click());
cvInput?.addEventListener('change', (e) => {
  cvFile = e.target.files[0];
  if (cvFile) {
    cvLabel.textContent = `✅ ${cvFile.name}`;
    cvDropZone.classList.add('active');
  }
});
cvDropZone?.addEventListener('dragover', (e) => {
  e.preventDefault();
  cvDropZone.style.borderColor = 'var(--accent)';
});
cvDropZone?.addEventListener('dragleave', () => {
  cvDropZone.style.borderColor = '';
});
cvDropZone?.addEventListener('drop', (e) => {
  e.preventDefault();
  cvFile = e.dataTransfer.files[0];
  if (cvFile) {
    cvLabel.textContent = `✅ ${cvFile.name}`;
    cvDropZone.classList.add('active');
  }
  cvDropZone.style.borderColor = '';
});

/* ── Multi-step form ── */
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');

document.getElementById('step1Next')?.addEventListener('click', () => {
  const firstName = document.getElementById('firstName').value.trim();
  const lastName  = document.getElementById('lastName').value.trim();
  const email     = document.getElementById('studentEmail').value.trim();
  const password  = document.getElementById('studentPassword').value;

  if (!firstName || !lastName || !email || !password) {
    showMsg('authMsg', 'Please fill in all fields in Step 1.');
    return;
  }
  if (password.length < 8) {
    showMsg('authMsg', 'Password must be at least 8 characters.');
    return;
  }

  const msgEl = document.getElementById('authMsg');
  if (msgEl) msgEl.classList.add('hidden');

  step1.classList.remove('active');
  step2.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.getElementById('step2Back')?.addEventListener('click', () => {
  step2.classList.remove('active');
  step1.classList.add('active');
});

/* ── Register ── */
document.getElementById('registerStudentForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('registerBtn');
  btn.disabled    = true;
  btn.textContent = 'Creating account...';

  const firstName  = document.getElementById('firstName').value.trim();
  const lastName   = document.getElementById('lastName').value.trim();
  const email      = document.getElementById('studentEmail').value.trim();
  const password   = document.getElementById('studentPassword').value;
  const phone      = document.getElementById('phone').value.trim();
  const city       = document.getElementById('city').value.trim();
  const university = document.getElementById('university').value.trim();
  const studyField = document.getElementById('studyField').value.trim();
  const skills     = document.getElementById('skills').value.split(',').map(s => s.trim()).filter(Boolean);
  const bio        = document.getElementById('bio').value.trim();

  /* 1. Sign up */
  console.log('Attempting to sign up with:', { email, passwordLength: password.length });
  const { data: authData, error: authError } = await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      emailRedirectTo: window.location.origin + '/profile.html'
    }
  });
  
  console.log('Auth response:', { authData, authError });
  
  if (authError) {
    console.error('Auth error:', authError);
    showMsg('authMsg', 'Authentication failed: ' + authError.message);
    btn.disabled = false;
    btn.textContent = 'Create Account 🚀';
    return;
  }

  const userId = authData.user?.id;
  console.log('User ID:', userId);
  
  if (!userId) {
    showMsg('authMsg', 'Registration failed. Please try again.');
    btn.disabled = false;
    btn.textContent = 'Create Account 🚀';
    return;
  }

  /* 2. Upload avatar */
  let avatarPath = null;
  if (avatarFile) {
    const ext  = avatarFile.name.split('.').pop();
    const path = `${userId}/avatar.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true });
    if (uploadErr) {
      console.error('Avatar upload error:', uploadErr);
      showMsg('authMsg', 'Failed to upload avatar: ' + uploadErr.message);
      btn.disabled = false;
      btn.textContent = 'Create Account 🚀';
      return;
    }
    avatarPath = path;
  }

  /* 3. Upload CV */
  let cvPath = null;
  if (cvFile) {
    const ext  = cvFile.name.split('.').pop();
    const path = `${userId}/cv.${ext}`;
    const { error: cvErr } = await supabase.storage.from('cvs').upload(path, cvFile, { upsert: true });
    if (cvErr) {
      console.error('CV upload error:', cvErr);
      showMsg('authMsg', 'Failed to upload CV: ' + cvErr.message);
      btn.disabled = false;
      btn.textContent = 'Create Account 🚀';
      return;
    }
    cvPath = path;
  }

  /* 4. Insert profile */
  const profileData = {
    id: userId,
    role: 'student',
    full_name: `${firstName} ${lastName}`,
    email,
    phone,
    city,
    university,
    study_field: studyField,
    skills: skills && skills.length > 0 ? skills : null,
    bio,
    avatar_url: avatarPath,
    cv_url: cvPath,
  };

  console.log('Inserting profile:', profileData);
  
  // Wait a moment for the auth session to be established
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const { error: profileError } = await supabase.from('profiles').insert(profileData);

  if (profileError) {
    console.error('Profile insert error:', profileError);
    showMsg('authMsg', 'Failed to create profile: ' + profileError.message);
    btn.disabled = false;
    btn.textContent = 'Create Account 🚀';
    return;
  }

  showMsg('authMsg', '🎉 Account created! Redirecting to your profile...', 'success');
  setTimeout(() => { window.location.href = 'profile.html'; }, 1200);
});

document.getElementById('googleStudentBtn')?.addEventListener('click', async () => {
  if (window.location.protocol === 'file:') {
    showMsg('authMsg', 'Google Sign Up requires running the site on a local web server (e.g. Live Server or http://localhost) and does not support file:// URIs.');
    return;
  }
  localStorage.setItem('oauth_role', 'student');
  const currentDir = window.location.href.split('/').slice(0, -1).join('/');
  const redirectTo = currentDir + '/profile.html';

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo }
  });

  if (error) {
    showMsg('authMsg', error.message || 'Google signup failed.');
  }
});
