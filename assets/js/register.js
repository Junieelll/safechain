// Register page logic (separate from login.js)

function _getUsers() {
  try {
    return JSON.parse(localStorage.getItem('sc_users') || '[]');
  } catch (e) {
    return [];
  }
}

function _saveUsers(users) {
  localStorage.setItem('sc_users', JSON.stringify(users));
}

function _setAuthUser(user) {
  localStorage.setItem('sc_authUser', JSON.stringify(user));
}

// --- Global Toast Notification ---
window.showToast = function (message, duration = 3000) {
  const toast = document.getElementById('globalToast');
  const toastMsg = document.getElementById('toastMessage');
  if (!toast || !toastMsg) return;
  
  toastMsg.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
};

// Toast close button
const toastClose = document.getElementById('toastClose');
if (toastClose) {
  toastClose.addEventListener('click', () => {
    const toast = document.getElementById('globalToast');
    if (toast) toast.classList.remove('show');
  });
}

// --- Image Carousel Slideshow ---
let currentSlide = 0;
const slides = document.querySelectorAll('.carousel-slide');
const totalSlides = slides.length;

function nextSlide() {
  slides[currentSlide].classList.remove('active');
  currentSlide = (currentSlide + 1) % totalSlides;
  slides[currentSlide].classList.add('active');
}

// Rotate images every 5 seconds
if (totalSlides > 0) {
  setInterval(nextSlide, 5000);
}

// Smooth redirect helper (local to register page)
window.redirectWithTransition = function (href) {
  document.body.classList.add('page-exit');
  setTimeout(() => {
    window.location.href = href;
  }, 400);
};

function registerUser({ name, email, password }) {
  const users = _getUsers();
  if (users.find(u => u.email === email)) {
    return { ok: false, message: 'This email is already registered.' };
  }
  if (users.find(u => u.name === name)) {
    return { ok: false, message: 'This username is already taken.' };
  }
  const newUser = { id: Date.now(), name, email, password };
  users.push(newUser);
  _saveUsers(users);
  return { ok: true, user: newUser };
}

// Validation helpers
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (password) => {
  const issues = [];
  if (password.length < 8) issues.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) issues.push('One uppercase letter');
  if (!/[0-9]/.test(password)) issues.push('One number');
  return issues;
};

// Password toggle for register inputs
document.querySelectorAll('.form-input-wrapper').forEach(wrapper => {
  const input = wrapper.querySelector('input[type="password"]');
  if (input) {
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'password-toggle';
    toggleBtn.innerHTML = '<i class="uil uil-eye"></i>';
    toggleBtn.style.position = 'absolute';
    toggleBtn.style.right = '0.75rem';
    toggleBtn.style.top = '50%';
    toggleBtn.style.transform = 'translateY(-50%)';
    toggleBtn.style.background = 'none';
    toggleBtn.style.border = 'none';
    toggleBtn.style.cursor = 'pointer';
    toggleBtn.style.color = '#94a3b8';
    toggleBtn.style.fontSize = '1.1rem';
    toggleBtn.style.padding = '0.5rem';
    toggleBtn.style.display = 'flex';
    toggleBtn.style.alignItems = 'center';
    toggleBtn.style.justifyContent = 'center';
    toggleBtn.style.transition = 'color 0.3s ease';

    toggleBtn.addEventListener('click', () => {
      if (input.type === 'password') {
        input.type = 'text';
        toggleBtn.innerHTML = '<i class="uil uil-eye-slash"></i>';
        toggleBtn.style.color = '#27c291';
      } else {
        input.type = 'password';
        toggleBtn.innerHTML = '<i class="uil uil-eye"></i>';
        toggleBtn.style.color = '#94a3b8';
      }
    });

    wrapper.style.position = 'relative';
    wrapper.appendChild(toggleBtn);
  }
});

// Real-time validation
const registerEmailEl = document.getElementById('registerEmail');
if (registerEmailEl) {
  registerEmailEl.addEventListener('blur', (e) => {
    const email = e.target.value.trim();
    const errorDiv = e.target.parentElement.nextElementSibling;
    if (!email) {
      e.target.classList.remove('error');
      if (errorDiv && errorDiv.classList.contains('form-error')) {
        errorDiv.textContent = '';
        errorDiv.classList.remove('show');
      }
      return;
    }
    if (email && !validateEmail(email)) {
      e.target.classList.add('error');
      if (errorDiv && errorDiv.classList.contains('form-error')) {
        errorDiv.textContent = 'Invalid email format';
        errorDiv.classList.add('show');
      }
    } else {
      e.target.classList.remove('error');
      if (errorDiv && errorDiv.classList.contains('form-error')) {
        errorDiv.textContent = '';
        errorDiv.classList.remove('show');
      }
    }
  });
}

const registerPasswordEl = document.getElementById('registerPassword');
if (registerPasswordEl) {
  registerPasswordEl.addEventListener('input', (e) => {
    const password = e.target.value;
    const errorDiv = e.target.parentElement.nextElementSibling;
    if (!password) {
      e.target.classList.remove('error');
      if (errorDiv && errorDiv.classList.contains('form-error')) {
        errorDiv.textContent = '';
        errorDiv.classList.remove('show');
      }
      return;
    }
    const issues = validatePassword(password);
    if (issues.length > 0) {
      e.target.classList.add('error');
      if (errorDiv && errorDiv.classList.contains('form-error')) {
        if (password.length < 8) {
          errorDiv.textContent = 'Password must be at least 8 characters';
        } else {
          errorDiv.textContent = 'Password must include one uppercase letter and one number';
        }
        errorDiv.classList.add('show');
      }
    } else {
      e.target.classList.remove('error');
      if (errorDiv && errorDiv.classList.contains('form-error')) {
        errorDiv.textContent = '';
        errorDiv.classList.remove('show');
      }
    }
  });
}

const confirmPasswordEl = document.getElementById('confirmPassword');
if (confirmPasswordEl) {
  confirmPasswordEl.addEventListener('blur', (e) => {
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = e.target.value;
    const errorDiv = e.target.parentElement.nextElementSibling;
    if (confirmPassword && password !== confirmPassword) {
      e.target.classList.add('error');
      if (errorDiv && errorDiv.classList.contains('form-error')) {
        errorDiv.textContent = 'Passwords do not match';
        errorDiv.classList.add('show');
      }
    } else {
      e.target.classList.remove('error');
      if (errorDiv && errorDiv.classList.contains('form-error')) {
        errorDiv.textContent = '';
        errorDiv.classList.remove('show');
      }
    }
  });
}

// Register form handler
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;

    // Clear errors
    registerForm.querySelectorAll('.form-input').forEach(input => input.classList.remove('error'));
    registerForm.querySelectorAll('.form-error').forEach(err => { err.textContent = ''; err.classList.remove('show'); });

    if (!name) {
      showError('registerName', 'Please enter your username');
      return;
    }
    if (name.length < 8) {
      showError('registerName', 'Username must be minimum of 8 characters');
      return;
    }
    if (!email) {
      showError('registerEmail', 'Please enter your email');
      return;
    }
    if (!validateEmail(email)) {
      showError('registerEmail', 'Invalid email format');
      return;
    }
    const passIssues = validatePassword(password);
    if (!password) {
      showError('registerPassword', 'Please enter your password');
      return;
    }
    if (passIssues.length) {
      if (password.length < 8) showError('registerPassword', 'Password must be at least 8 characters');
      else showError('registerPassword', 'Password must include one uppercase letter and one number');
      return;
    }
    if (password !== confirmPassword) {
      showError('confirmPassword', 'Passwords do not match');
      return;
    }
    if (!agreeTerms) {
      showError('agreeTerms', 'You must agree to the terms and conditions');
      return;
    }

    const res = registerUser({ name, email, password });
    if (!res.ok) {
      const msg = res.message || 'Registration error';
      if (msg.toLowerCase().includes('username')) {
        showError('registerName', msg);
      } else if (msg.toLowerCase().includes('email')) {
        showError('registerEmail', msg);
      } else {
        showError('registerEmail', msg);
      }
      return;
    }

    // Success — do NOT auto-login; redirect user to the login page
    window.showToast('Account created successfully! Redirecting to login...');
    setTimeout(() => {
      window.redirectWithTransition('login.html');
    }, 600);
  });
}

function showError(fieldId, msg) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.classList.add('error');
  const err = el.parentElement.nextElementSibling;
  if (err && err.classList.contains('form-error')) {
    err.textContent = msg;
    err.classList.add('show');
  }
}

// Link back to login: removed JS transition handler so anchor uses normal navigation
