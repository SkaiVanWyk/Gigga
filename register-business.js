import { supabase } from './supabase.js';
import { showMsg, bindPasswordToggle } from './utils.js';

bindPasswordToggle('toggleBizPw', 'bizPassword');

/* ── Logo preview ── */
let logoFile = null;
const logoInput   = document.getElementById('logoInput');
const logoPreview = document.getElementById('logoPreview');

logoInput?.addEventListener('change', (e) => {
  logoFile = e.target.files[0];
  if (logoFile) {
    const url = URL.createObjectURL(logoFile);
    logoPreview.innerHTML = `<img src="${url}" alt="Logo Preview" style="width:100%;height:100%;object-fit:cover;border-radius:10px;" />`;
  }
});
logoPreview?.addEventListener('click', () => logoInput?.click());

/* ── Register ── */
document.getElementById('registerBusinessForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('bizRegisterBtn');
  btn.disabled    = true;
  btn.textContent = 'Creating account...';

  const bizName  = document.getElementById('bizName').value.trim();
  const email    = document.getElementById('bizEmail').value.trim();
  const password = document.getElementById('bizPassword').value;
  const phone    = document.getElementById('bizPhone').value.trim();
  const city     = document.getElementById('bizCity').value.trim();
  const industry = document.getElementById('bizIndustry').value;
  const desc     = document.getElementById('bizDesc').value.trim();

  if (!bizName || !email || !password) {
    showMsg('authMsg', 'Please fill in the required fields.');
    btn.disabled = false;
    btn.textContent = 'Create Business Account →';
    return;
  }
  if (password.length < 8) {
    showMsg('authMsg', 'Password must be at least 8 characters.');
    btn.disabled = false;
    btn.textContent = 'Create Business Account →';
    return;
  }

  /* 1. Sign up */
  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
  if (authError) {
    showMsg('authMsg', authError.message);
    btn.disabled = false;
    btn.textContent = 'Create Business Account →';
    return;
  }

  const userId = authData.user?.id;
  if (!userId) {
    showMsg('authMsg', 'Registration failed. Please try again.');
    btn.disabled = false;
    btn.textContent = 'Create Business Account →';
    return;
  }

  /* 2. Upload logo */
  let logoPath = null;
  if (logoFile) {
    const ext  = logoFile.name.split('.').pop();
    const path = `${userId}/avatar.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, logoFile, { upsert: true });
    if (!uploadErr) logoPath = path;
  }

  /* 3. Insert profile */
  const { error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    role: 'business',
    business_name: bizName,
    full_name: bizName,
    email,
    phone,
    city,
    industry,
    bio: desc,
    avatar_url: logoPath,
  });

  if (profileError) {
    showMsg('authMsg', profileError.message);
    btn.disabled = false;
    btn.textContent = 'Create Business Account →';
    return;
  }

  showMsg('authMsg', '🎉 Business registered! Redirecting...', 'success');
  setTimeout(() => { window.location.href = 'profile.html'; }, 1200);
});
