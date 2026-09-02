import { supabase } from './supabase.js';
import { getAvatarUrl, getCvUrl, timeAgo, showMsg, initDarkMode, toggleDarkMode } from './utils.js';

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

let currentUser    = null;
let currentProfile = null;

/* ══════════════════════════════════════════
   INIT
══════════════════════════════════════════ */
async function createProfileAndInit(user, role) {
  const fullName = user.user_metadata?.full_name || user.email.split('@')[0];
  
  // Wait a moment for the auth session to be established
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const { data: newProfile, error: createError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      role: role,
      full_name: fullName,
      business_name: role === 'business' ? fullName : null,
      email: user.email,
      avatar_url: user.user_metadata?.avatar_url || null
    })
    .select()
    .single();

  if (createError) {
    console.error('Profile creation error:', createError);
    alert('Error creating profile: ' + createError.message);
    return;
  }

  currentProfile = newProfile;
  renderProfile(newProfile);
  bindNav(newProfile);
  bindAvatarUpload();
  bindEditModal(newProfile);

  if (newProfile.role === 'student') {
    loadApplications(user.id);
  } else {
    loadMyJobs(user.id);
  }
}

async function init() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  currentUser = user;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    // If profile is missing, check if they registered using a specific role button
    const oauthRole = localStorage.getItem('oauth_role');
    if (oauthRole === 'student' || oauthRole === 'business') {
      localStorage.removeItem('oauth_role');
      await createProfileAndInit(user, oauthRole);
    } else {
      // Show role selection modal
      const modal = document.getElementById('roleSelectionModal');
      if (modal) {
        modal.classList.remove('hidden');
        
        // Add event listeners to the modal buttons
        document.getElementById('selectStudentBtn')?.addEventListener('click', async () => {
          modal.classList.add('hidden');
          await createProfileAndInit(user, 'student');
        });
        document.getElementById('selectBusinessBtn')?.addEventListener('click', async () => {
          modal.classList.add('hidden');
          await createProfileAndInit(user, 'business');
        });
      } else {
        alert('Could not load profile. Please try again.');
      }
    }
    return;
  }
  currentProfile = profile;

  renderProfile(profile);
  bindNav(profile);
  bindAvatarUpload();
  bindEditModal(profile);

  if (profile.role === 'student') {
    loadApplications(user.id);
  } else {
    loadMyJobs(user.id);
  }
}

/* ══════════════════════════════════════════
   RENDER PROFILE
══════════════════════════════════════════ */
function renderProfile(profile) {
  const isStudent = profile.role === 'student';
  const name      = isStudent ? profile.full_name : (profile.business_name || profile.full_name);
  const initials  = (name || 'U').slice(0, 2).toUpperCase();

  /* Avatar */
  const imgEl      = document.getElementById('profileAvatarImg');
  const initialsEl = document.getElementById('profileAvatarInitials');
  const avatarUrl  = getAvatarUrl(profile.avatar_url);
  if (avatarUrl && imgEl) {
    imgEl.src = avatarUrl;
    imgEl.classList.remove('hidden');
    if (initialsEl) initialsEl.style.display = 'none';
  } else if (initialsEl) {
    initialsEl.textContent = initials;
  }

  /* Role badge */
  const badge = document.getElementById('profileRoleBadge');
  if (badge) {
    badge.textContent  = isStudent ? '🎓 Student' : '💼 Business';
    badge.style.background  = isStudent ? 'var(--accent-glow)' : 'rgba(5, 150, 105, 0.1)';
    badge.style.color       = isStudent ? 'var(--accent)' : 'var(--green)';
    badge.style.padding     = '4px 12px';
    badge.style.borderRadius= '999px';
    badge.style.fontSize    = '0.75rem';
    badge.style.fontWeight  = '600';
  }

  /* Name & tagline */
  const nameEl = document.getElementById('profileName');
  if (nameEl) nameEl.textContent = name || 'Your Name';

  const tagEl = document.getElementById('profileTagline');
  if (tagEl) tagEl.textContent = isStudent
    ? `${profile.study_field || ''} ${profile.university ? `· ${profile.university}` : ''}`.trim()
    : `${profile.industry || ''} ${profile.city ? `· ${profile.city}` : ''}`.trim();

  /* Meta tags */
  const metaEl = document.getElementById('profileMetaTags');
  if (metaEl) {
    const items = [];
    if (profile.city)      items.push(`📍 ${profile.city}`);
    if (profile.phone)     items.push(`📞 ${profile.phone}`);
    if (isStudent && profile.university) items.push(`🎓 ${profile.university}`);
    metaEl.innerHTML = items.map(i => `<span class="profile-meta-tag">${i}</span>`).join('');
  }

  /* Contact */
  setText('profileEmail', profile.email || '—');
  setText('profilePhone', profile.phone  || '—');
  setText('profileCity',  profile.city   || '—');

  /* Bio */
  setText('profileBio', profile.bio || 'No bio yet. Click Edit Profile to add one.');

  /* Skills */
  const skillsEl = document.getElementById('profileSkills');
  if (skillsEl) {
    const skills = profile.skills || [];
    skillsEl.innerHTML = skills.length
      ? skills.map(s => `<span class="skill-tag">${s}</span>`).join('')
      : '<span style="color:var(--text-3);font-size:0.82rem;">No skills listed yet.</span>';
  }

  /* CV */
  const cvCard = document.getElementById('profileCvCard');
  if (cvCard) {
    if (!isStudent) {
      cvCard.classList.add('hidden');
    } else {
      const cvExisting = document.getElementById('cvExisting');
      const cvUrl      = getCvUrl(profile.cv_url);
      if (cvUrl && cvExisting) {
        cvExisting.classList.remove('hidden');
        const cvLink = document.getElementById('cvLink');
        if (cvLink) cvLink.href = cvUrl;
        const fn = document.getElementById('cvFilename');
        if (fn) fn.textContent = profile.cv_url?.split('/').pop() || 'cv.pdf';
      }
      /* CV replace upload */
      const cvUploadInput = document.getElementById('cvUploadInput');
      cvUploadInput?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const ext  = file.name.split('.').pop();
        const path = `${currentUser.id}/cv.${ext}`;
        const { error } = await supabase.storage.from('cvs').upload(path, file, { upsert: true });
        if (!error) {
          await supabase.from('profiles').update({ cv_url: path }).eq('id', currentUser.id);
          const cvUrl2 = getCvUrl(path);
          if (cvExisting) cvExisting.classList.remove('hidden');
          const cvLink2 = document.getElementById('cvLink');
          if (cvLink2) { cvLink2.href = cvUrl2; cvLink2.textContent = '📄 Download CV'; }
          const fn2 = document.getElementById('cvFilename');
          if (fn2) fn2.textContent = file.name;
        }
      });
    }
  }

  /* Show correct section */
  document.querySelectorAll('.student-only').forEach(el => {
    el.classList.toggle('hidden', !isStudent);
  });
  document.querySelectorAll('.business-only').forEach(el => {
    el.classList.toggle('hidden', isStudent);
  });
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/* ══════════════════════════════════════════
   LOAD APPLICATIONS (student)
══════════════════════════════════════════ */
async function loadApplications(userId) {
  const { data: apps } = await supabase
    .from('applications')
    .select('*, jobs(title, city, job_type, profiles(business_name, avatar_url))')
    .eq('student_id', userId)
    .order('created_at', { ascending: false });

  const list    = document.getElementById('applicationsList');
  const empty   = document.getElementById('emptyApplications');
  const counter = document.getElementById('appCount');

  if (!apps || apps.length === 0) {
    if (list)  list.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
    if (counter) counter.textContent = '0';
    return;
  }

  if (counter) counter.textContent = apps.length;
  if (empty)   empty.classList.add('hidden');

  if (list) {
    list.innerHTML = apps.map(app => {
      const job     = app.jobs;
      const logo    = job?.profiles?.avatar_url
        ? `<img src="${getAvatarUrl(job.profiles.avatar_url)}" alt="logo" />`
        : `<span>${(job?.profiles?.business_name || 'B')[0].toUpperCase()}</span>`;
      const status  = app.status || 'pending';
      const statusClass = `status-${status}`;
      const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

      return `
        <div class="application-card">
          <div class="app-logo">${logo}</div>
          <div class="app-info">
            <strong>${job?.title || 'Job'}</strong>
            <span>${job?.profiles?.business_name || 'Business'} · ${job?.city || ''} · ${job?.job_type || ''}</span>
          </div>
          <span class="app-status ${statusClass}">${statusLabel}</span>
        </div>
      `;
    }).join('');
  }
}

/* ══════════════════════════════════════════
   LOAD MY JOBS (business)
══════════════════════════════════════════ */
async function loadMyJobs(userId) {
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*, applications(count)')
    .eq('business_id', userId)
    .order('created_at', { ascending: false });

  const list  = document.getElementById('myJobsList');
  const empty = document.getElementById('emptyMyJobs');

  if (!jobs || jobs.length === 0) {
    if (empty) empty.classList.remove('hidden');
    return;
  }
  if (empty) empty.classList.add('hidden');

  if (list) {
    list.innerHTML = jobs.map(job => {
      const appCount = job.applications?.[0]?.count || 0;
      return `
        <div class="my-job-card">
          <div class="my-job-info">
            <strong>${job.title}</strong>
            <span>${job.city || 'Remote'} · ${job.job_type || 'Flexible'} · Posted ${timeAgo(job.created_at)}</span>
          </div>
          <div class="my-job-actions">
            <button class="btn-outline-sm view-applicants-btn" data-job-id="${job.id}" data-job-title="${job.title}">
              👥 ${appCount} Applicant${appCount !== 1 ? 's' : ''}
            </button>
            <button class="btn-danger-sm delete-job-btn" data-job-id="${job.id}">Delete</button>
          </div>
        </div>
      `;
    }).join('');

    list.querySelectorAll('.view-applicants-btn').forEach(btn => {
      btn.addEventListener('click', () => openApplicantsModal(btn.dataset.jobId, btn.dataset.jobTitle));
    });
    list.querySelectorAll('.delete-job-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteJob(btn.dataset.jobId));
    });
  }
}

async function deleteJob(jobId) {
  if (!confirm('Delete this job? This will also remove all applications.')) return;
  await supabase.from('applications').delete().eq('job_id', jobId);
  await supabase.from('jobs').delete().eq('id', jobId);
  loadMyJobs(currentUser.id);
}

/* ══════════════════════════════════════════
   APPLICANTS MODAL (business)
══════════════════════════════════════════ */
async function openApplicantsModal(jobId, jobTitle) {
  const modal = document.getElementById('applicantsModal');
  const list  = document.getElementById('applicantsList');
  const title = document.getElementById('applicantsModalTitle');

  if (title) title.textContent = `Applicants for "${jobTitle}"`;
  if (list)  list.innerHTML    = '<p style="color:var(--text-3)">Loading...</p>';
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  const { data: apps } = await supabase
    .from('applications')
    .select('*, profiles(full_name, email, avatar_url, cv_url, skills, bio, city)')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });

  if (!apps || apps.length === 0) {
    if (list) list.innerHTML = '<p style="color:var(--text-3);text-align:center;padding:24px;">No applicants yet.</p>';
    return;
  }

  if (list) {
    list.innerHTML = apps.map(app => {
      const p       = app.profiles;
      const initials= (p?.full_name || 'U').slice(0, 2).toUpperCase();
      const avatarEl= p?.avatar_url
        ? `<img src="${getAvatarUrl(p.avatar_url)}" alt="${p.full_name}" />`
        : initials;
      const cvBtn   = p?.cv_url
        ? `<a href="${getCvUrl(p.cv_url)}" target="_blank" class="btn-outline-sm">📄 CV</a>`
        : '';
      const status  = app.status || 'pending';

      return `
        <div class="applicant-card">
          <div class="applicant-avatar">${avatarEl}</div>
          <div class="applicant-info">
            <strong>${p?.full_name || 'Student'}</strong>
            <span>${p?.email || ''} ${p?.city ? `· ${p.city}` : ''}</span>
            ${p?.bio ? `<p style="font-size:0.8rem;color:var(--text-3);margin-top:4px;">${p.bio.slice(0, 100)}${p.bio.length > 100 ? '...' : ''}</p>` : ''}
            ${p?.skills?.length ? `<div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px;">${p.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div>` : ''}
          </div>
          <div class="applicant-actions">
            ${cvBtn}
            ${status === 'pending' ? `
              <button class="status-btn btn-accept" data-app-id="${app.id}" data-status="accepted">Accept</button>
              <button class="status-btn btn-reject" data-app-id="${app.id}" data-status="rejected">Reject</button>
            ` : `<span class="app-status status-${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`}
          </div>
        </div>
      `;
    }).join('');

    list.querySelectorAll('.status-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const { error } = await supabase
          .from('applications')
          .update({ status: btn.dataset.status })
          .eq('id', btn.dataset.appId);
        if (!error) openApplicantsModal(jobId, jobTitle);
      });
    });
  }
}

document.getElementById('applicantsModalClose')?.addEventListener('click', () => {
  document.getElementById('applicantsModal').classList.add('hidden');
  document.body.style.overflow = '';
});

/* ══════════════════════════════════════════
   AVATAR UPLOAD
══════════════════════════════════════════ */
function bindAvatarUpload() {
  const input = document.getElementById('profileAvatarInput');
  input?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext  = file.name.split('.').pop();
    const path = `${currentUser.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) { alert('Upload failed: ' + error.message); return; }
    await supabase.from('profiles').update({ avatar_url: path }).eq('id', currentUser.id);
    const imgEl = document.getElementById('profileAvatarImg');
    if (imgEl) {
      imgEl.src = getAvatarUrl(path) + '?t=' + Date.now();
      imgEl.classList.remove('hidden');
      const init = document.getElementById('profileAvatarInitials');
      if (init) init.style.display = 'none';
    }
  });
}

/* ══════════════════════════════════════════
   EDIT PROFILE MODAL
══════════════════════════════════════════ */
function bindEditModal(profile) {
  const editBtn   = document.getElementById('editProfileBtn');
  const modal     = document.getElementById('editModal');
  const closeBtn  = document.getElementById('editModalClose');
  const cancelBtn = document.getElementById('cancelEdit');
  const content   = document.getElementById('editFormContent');

  const isStudent = profile.role === 'student';

  function openModal() {
    const f = currentProfile;
    content.innerHTML = `
      ${isStudent ? `
        <div class="form-row">
          <div class="form-group">
            <label for="editFirstName">First Name</label>
            <input type="text" id="editFirstName" value="${(f.full_name || '').split(' ')[0]}" />
          </div>
          <div class="form-group">
            <label for="editLastName">Last Name</label>
            <input type="text" id="editLastName" value="${(f.full_name || '').split(' ').slice(1).join(' ')}" />
          </div>
        </div>
      ` : `
        <div class="form-group">
          <label for="editBizName">Business Name</label>
          <input type="text" id="editBizName" value="${f.business_name || ''}" />
        </div>
      `}
      <div class="form-row">
        <div class="form-group">
          <label for="editPhone">Phone</label>
          <input type="tel" id="editPhone" value="${f.phone || ''}" />
        </div>
        <div class="form-group">
          <label for="editCity">City</label>
          <input type="text" id="editCity" value="${f.city || ''}" />
        </div>
      </div>
      ${isStudent ? `
        <div class="form-row">
          <div class="form-group">
            <label for="editUniversity">University</label>
            <input type="text" id="editUniversity" value="${f.university || ''}" />
          </div>
          <div class="form-group">
            <label for="editStudyField">Field of Study</label>
            <input type="text" id="editStudyField" value="${f.study_field || ''}" />
          </div>
        </div>
        <div class="form-group">
          <label for="editSkills">Skills (comma-separated)</label>
          <input type="text" id="editSkills" value="${(f.skills || []).join(', ')}" />
        </div>
      ` : `
        <div class="form-group">
          <label for="editIndustry">Industry</label>
          <input type="text" id="editIndustry" value="${f.industry || ''}" />
        </div>
      `}
      <div class="form-group">
        <label for="editBio">Bio</label>
        <textarea id="editBio" rows="3">${f.bio || ''}</textarea>
      </div>
    `;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  editBtn?.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  document.getElementById('editProfileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn   = document.getElementById('saveProfileBtn');
    saveBtn.disabled    = true;
    saveBtn.textContent = 'Saving...';

    const updates = {};

    if (isStudent) {
      const fn  = document.getElementById('editFirstName')?.value.trim();
      const ln  = document.getElementById('editLastName')?.value.trim();
      updates.full_name   = `${fn} ${ln}`.trim();
      updates.university  = document.getElementById('editUniversity')?.value.trim();
      updates.study_field = document.getElementById('editStudyField')?.value.trim();
      updates.skills      = document.getElementById('editSkills')?.value.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      updates.business_name = document.getElementById('editBizName')?.value.trim();
      updates.full_name     = updates.business_name;
      updates.industry      = document.getElementById('editIndustry')?.value.trim();
    }

    updates.phone = document.getElementById('editPhone')?.value.trim();
    updates.city  = document.getElementById('editCity')?.value.trim();
    updates.bio   = document.getElementById('editBio')?.value.trim();

    const { error } = await supabase.from('profiles').update(updates).eq('id', currentUser.id);

    if (error) {
      alert('Failed to save: ' + error.message);
      saveBtn.disabled    = false;
      saveBtn.textContent = 'Save Changes';
      return;
    }

    currentProfile = { ...currentProfile, ...updates };
    renderProfile(currentProfile);
    closeModal();
    saveBtn.disabled    = false;
    saveBtn.textContent = 'Save Changes';
  });
}

/* ── Nav ── */
function bindNav(profile) {
  const navLogout  = document.getElementById('navLogout');
  const navPostJob = document.getElementById('navPostJob');
  const navSavedJobs = document.getElementById('navSavedJobs');

  if (navLogout) {
    navLogout.addEventListener('click', async () => {
      await supabase.auth.signOut();
      window.location.href = 'index.html';
    });
  }
  if (navPostJob && profile.role === 'business') {
    navPostJob.classList.remove('hidden');
  }
  if (navSavedJobs && profile.role === 'student') {
    navSavedJobs.classList.remove('hidden');
  }
}

init();
