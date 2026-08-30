import { initDarkMode, toggleDarkMode, updateNav, bindLogout } from './utils.js';

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

/* ── FAQ Accordion ── */
document.querySelectorAll('.faq-question').forEach(button => {
  button.addEventListener('click', () => {
    const faqItem = button.closest('.faq-item');
    const answer = faqItem.querySelector('.faq-answer');
    const icon = button.querySelector('.faq-icon');
    
    // Toggle current item
    const isOpen = answer.classList.contains('open');
    
    // Close all other items
    document.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('open'));
    document.querySelectorAll('.faq-icon').forEach(i => i.textContent = '+');
    
    // Open current if it was closed
    if (!isOpen) {
      answer.classList.add('open');
      icon.textContent = '−';
    }
  });
});

/* ── FAQ Search ── */
document.getElementById('faqSearch')?.addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase().trim();
  
  document.querySelectorAll('.faq-item').forEach(item => {
    const question = item.querySelector('.faq-question span:first-child').textContent.toLowerCase();
    const answer = item.querySelector('.faq-answer').textContent.toLowerCase();
    
    const matches = question.includes(searchTerm) || answer.includes(searchTerm);
    
    if (matches || searchTerm === '') {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
  
  // Hide empty categories
  document.querySelectorAll('.faq-category').forEach(category => {
    const visibleItems = category.querySelectorAll('.faq-item[style="display: block;"], .faq-item:not([style])').length;
    if (visibleItems === 0 && searchTerm !== '') {
      category.style.display = 'none';
    } else {
      category.style.display = 'block';
    }
  });
});
