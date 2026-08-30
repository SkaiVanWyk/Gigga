import { supabase } from './supabase.js';
import { showMsg, validateEmail, initDarkMode, toggleDarkMode, updateNav, bindLogout } from './utils.js';

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

/* ── Contact Form ── */
document.getElementById('contactForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('contactName').value.trim();
  const email = document.getElementById('contactEmail').value.trim();
  const subject = document.getElementById('contactSubject').value.trim();
  const message = document.getElementById('contactMessage').value.trim();
  const btn = document.getElementById('contactBtn');

  // Validation
  if (!name || !email || !message) {
    showMsg('contactMsg', 'Please fill in all required fields.');
    return;
  }

  if (!validateEmail(email)) {
    showMsg('contactMsg', 'Please enter a valid email address.');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Sending...';

  const { error } = await supabase.from('contact_submissions').insert({
    name,
    email,
    subject,
    message
  });

  if (error) {
    showMsg('contactMsg', error.message || 'Failed to send message. Please try again.');
    btn.disabled = false;
    btn.textContent = 'Send Message 📨';
    return;
  }

  showMsg('contactMsg', '🎉 Message sent successfully! We\'ll get back to you soon.', 'success');
  btn.disabled = false;
  btn.textContent = 'Send Message 📨';
  
  // Clear form
  document.getElementById('contactForm').reset();
});
