import { supabase } from './supabase.js';
import { showMsg, bindPasswordToggle } from './utils.js';

/* ── CONFIGURATION ── */
const REGISTRATION_FEE = {
  student: 99.00, // ZAR
  business: 199.00 // ZAR
};

/* ── DOM ELEMENTS ── */
const form = document.getElementById('registerStudentForm');
const authMsg = document.getElementById('authMsg');

/* ── INITIALIZATION ── */
document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  bindPasswordToggle();
  setupFormSteps();
  loadPricingPlans();
});

/* ── FORM STEPS ── */
let currentStep = 1;
const totalSteps = 3; // Account, Profile, Payment

function setupFormSteps() {
  // Step navigation will be handled by the form submission
  form.addEventListener('submit', handleFormSubmit);
}

async function handleFormSubmit(e) {
  e.preventDefault();
  
  if (currentStep === 1) {
    await handleStep1();
  } else if (currentStep === 2) {
    await handleStep2();
  } else if (currentStep === 3) {
    await handleStep3();
  }
}

async function handleStep1() {
  // Validate account details
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  if (!email || !password || !confirmPassword) {
    showMsg(authMsg, 'Please fill in all fields', 'error');
    return;
  }
  
  if (password !== confirmPassword) {
    showMsg(authMsg, 'Passwords do not match', 'error');
    return;
  }
  
  if (password.length < 6) {
    showMsg(authMsg, 'Password must be at least 6 characters', 'error');
    return;
  }
  
  // Check if email already exists
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('email')
    .eq('email', email)
    .single();
  
  if (existingUser) {
    showMsg(authMsg, 'An account with this email already exists', 'error');
    return;
  }
  
  // Move to step 2
  showStep(2);
}

async function handleStep2() {
  // Validate profile details
  const firstName = document.getElementById('firstName').value;
  const lastName = document.getElementById('lastName').value;
  const phone = document.getElementById('phone').value;
  const city = document.getElementById('city').value;
  const university = document.getElementById('university').value;
  const studyField = document.getElementById('studyField').value;
  
  if (!firstName || !lastName || !phone || !city || !university || !studyField) {
    showMsg(authMsg, 'Please fill in all required fields', 'error');
    return;
  }
  
  // Move to step 3 (payment)
  showStep(3);
  loadPaymentOptions();
}

async function handleStep3() {
  const selectedPlan = document.querySelector('input[name="plan"]:checked');
  const paymentMethod = document.getElementById('paymentMethod').value;
  
  if (!selectedPlan) {
    showMsg(authMsg, 'Please select a plan', 'error');
    return;
  }
  
  if (!paymentMethod) {
    showMsg(authMsg, 'Please select a payment method', 'error');
    return;
  }
  
  const plan = selectedPlan.value;
  const isTrial = plan === 'free_trial';
  
  if (!isTrial && !paymentMethod) {
    showMsg(authMsg, 'Please select a payment method', 'error');
    return;
  }
  
  // Proceed with registration
  await completeRegistration(plan, paymentMethod);
}

function showStep(stepNumber) {
  // Hide all steps
  document.querySelectorAll('.form-step').forEach(step => {
    step.classList.remove('active');
  });
  
  // Show current step
  document.getElementById(`step${stepNumber}`).classList.add('active');
  
  // Update step indicator
  document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
    if (index < stepNumber) {
      indicator.classList.add('completed');
    } else if (index === stepNumber - 1) {
      indicator.classList.add('active');
    } else {
      indicator.classList.remove('active', 'completed');
    }
  });
  
  currentStep = stepNumber;
}

/* ── PRICING ── */
async function loadPricingPlans() {
  const { data: plans } = await supabase
    .from('pricing')
    .select('*')
    .eq('role', 'student')
    .eq('is_active', true)
    .order('price', { ascending: true });
  
  if (plans) {
    displayPricingPlans(plans);
  }
}

function displayPricingPlans(plans) {
  const pricingContainer = document.getElementById('pricingPlans');
  if (!pricingContainer) return;
  
  pricingContainer.innerHTML = plans.map(plan => {
    const isTrial = plan.plan_type === 'free_trial';
    const priceDisplay = isTrial ? 'FREE' : `R${plan.price.toFixed(2)}`;
    const duration = isTrial ? '7 days' : `${plan.duration_days} days`;
    
    return `
      <div class="pricing-card ${isTrial ? 'trial-card' : ''}">
        <div class="pricing-header">
          <h3>${plan.plan_type.replace('_', ' ').toUpperCase()}</h3>
          <div class="pricing-price">${priceDisplay}</div>
          <div class="pricing-duration">${duration}</div>
        </div>
        <ul class="pricing-features">
          ${plan.features.map(feature => `<li>✓ ${feature}</li>`).join('')}
        </ul>
        <label class="pricing-radio">
          <input type="radio" name="plan" value="${plan.plan_type}" ${isTrial ? 'checked' : ''}>
          <span>Select ${plan.plan_type.replace('_', ' ')}</span>
        </label>
      </div>
    `;
  }).join('');
}

/* ── PAYMENT ── */
function loadPaymentOptions() {
  const selectedPlan = document.querySelector('input[name="plan"]:checked');
  if (!selectedPlan) return;
  
  const planType = selectedPlan.value;
  const paymentSection = document.getElementById('paymentSection');
  
  if (planType === 'free_trial') {
    paymentSection.innerHTML = `
      <div class="trial-notice">
        <h3>🎉 Free Trial Selected</h3>
        <p>You'll get 7 days of full access to Gigga. No payment required now.</p>
        <p>After your trial ends, you can upgrade to a paid plan.</p>
      </div>
    `;
  } else {
    paymentSection.innerHTML = `
      <h3 class="payment-title">Payment Method</h3>
      <div class="payment-methods">
        <label class="payment-method">
          <input type="radio" name="paymentMethod" value="payfast_card">
          <span class="payment-icon">💳</span>
          <span class="payment-name">Credit/Debit Card</span>
        </label>
        <label class="payment-method">
          <input type="radio" name="paymentMethod" value="payfast_eft">
          <span class="payment-icon">🏦</span>
          <span class="payment-name">Instant EFT</span>
        </label>
        <label class="payment-method">
          <input type="radio" name="paymentMethod" value="ozow">
          <span class="payment-icon">⚡</span>
          <span class="payment-name">Ozow Instant EFT</span>
        </label>
      </div>
      <div class="payment-summary">
        <div class="summary-row">
          <span>Selected Plan:</span>
          <span>${planType.replace('_', ' ').toUpperCase()}</span>
        </div>
        <div class="summary-row total">
          <span>Total:</span>
          <span>R${REGISTRATION_FEE.student.toFixed(2)}</span>
        </div>
      </div>
    `;
  }
}

/* ── REGISTRATION ── */
async function completeRegistration(planType, paymentMethod) {
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating account...';
  
  try {
    // Step 1: Create auth user
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (authError) throw authError;
    
    const userId = authData.user.id;
    
    // Step 2: Create profile with pending status
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const phone = document.getElementById('phone').value;
    const city = document.getElementById('city').value;
    const university = document.getElementById('university').value;
    const studyField = document.getElementById('studyField').value;
    const bio = document.getElementById('bio').value;
    
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        role: 'student',
        full_name: `${firstName} ${lastName}`,
        email,
        phone,
        city,
        university,
        study_field: studyField,
        bio,
        account_status: 'pending', // Account not active until payment
      });
    
    if (profileError) throw profileError;
    
    // Step 3: Handle payment
    if (planType === 'free_trial') {
      // Create trial payment record
      const { error: paymentError } = await supabase
        .from('registration_payments')
        .insert({
          user_id: userId,
          amount: 0,
          payment_status: 'completed',
          payment_method: 'free_trial',
          payment_date: new Date().toISOString(),
        });
      
      if (paymentError) throw paymentError;
      
      // Account will be activated by trigger
      showSuccessAndRedirect();
    } else {
      // Redirect to payment gateway
      await initiatePayment(userId, planType, paymentMethod);
    }
    
  } catch (error) {
    console.error('Registration error:', error);
    showMsg(authMsg, error.message || 'Registration failed. Please try again.', 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Complete Registration';
  }
}

async function initiatePayment(userId, planType, paymentMethod) {
  try {
    // Create pending payment record
    const { data: payment, error: paymentError } = await supabase
      .from('registration_payments')
      .insert({
        user_id: userId,
        amount: REGISTRATION_FEE.student,
        payment_status: 'pending',
        payment_method: paymentMethod,
        gateway: paymentMethod.includes('payfast') ? 'payfast' : 'ozow',
      })
      .select()
      .single();
    
    if (paymentError) throw paymentError;
    
    // Redirect to payment gateway (implementation depends on chosen gateway)
    // For now, show a message
    showMsg(authMsg, 'Redirecting to payment gateway...', 'success');
    
    // TODO: Implement actual payment gateway redirect
    // window.location.href = `/payment.html?payment_id=${payment.id}`;
    
  } catch (error) {
    console.error('Payment initiation error:', error);
    showMsg(authMsg, 'Failed to initiate payment. Please try again.', 'error');
  }
}

function showSuccessAndRedirect() {
  showMsg(authMsg, 'Account created successfully! Redirecting to login...', 'success');
  
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 2000);
}

/* ── DARK MODE ── */
function initDarkMode() {
  const toggle = document.getElementById('darkModeToggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const saved = localStorage.getItem('darkMode');
  const isDark = saved === 'true' || (saved === null && prefersDark);
  
  if (isDark) {
    document.documentElement.classList.add('dark-mode');
  }
  
  toggle?.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark-mode');
    const isDarkMode = document.documentElement.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    toggle.textContent = isDarkMode ? '☀️' : '🌙';
  });
  
  toggle.textContent = isDark ? '☀️' : '🌙';
}
