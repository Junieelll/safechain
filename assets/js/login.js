// // Auth Helper Functions (same as sidebar.js for consistency)
// function _getUsers() {
//   try {
//     return JSON.parse(localStorage.getItem('sc_users') || '[]');
//   } catch (e) {
//     return [];
//   }
// }

// function _saveUsers(users) {
//   localStorage.setItem('sc_users', JSON.stringify(users));
// }

// function _setAuthUser(user) {
//   localStorage.setItem('sc_authUser', JSON.stringify(user));
// }

// function _getAuthUser() {
//   try {
//     return JSON.parse(localStorage.getItem('sc_authUser'));
//   } catch (e) {
//     return null;
//   }
// }

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

// --- Smooth Page Transitions ---
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.remove('page-exit');
});

window.redirectWithTransition = function (href) {
  document.body.classList.add('page-exit');
  setTimeout(() => {
    window.location.href = href;
  }, 400); // Match animation duration
};

// registerUser moved to `js/register.js` (register page)

// function loginUser({ email, password }) {
//   const users = _getUsers();
//   const byEmail = users.find(u => u.email === email);
//   if (!byEmail) return { ok: false, code: 'no_user', message: "We can\u2019t find an account with this email" };
//   if (byEmail.password !== password) return { ok: false, code: 'incorrect_pw', message: 'Incorrect password' };
//   _setAuthUser({ id: byEmail.id, name: byEmail.name, email: byEmail.email });
//   return { ok: true, user: byEmail };
// }

// --- Password Toggle Visibility ---
// document.querySelectorAll('.form-input-wrapper').forEach(wrapper => {
//   const input = wrapper.querySelector('input[type="password"]');
//   if (input) {
//     const toggleBtn = document.createElement('button');
//     toggleBtn.type = 'button';
//     toggleBtn.className = 'password-toggle';
//     toggleBtn.innerHTML = '<i class="uil uil-eye"></i>';
//     toggleBtn.style.position = 'absolute';
//     toggleBtn.style.right = '0.75rem';
//     toggleBtn.style.top = '50%';
//     toggleBtn.style.transform = 'translateY(-50%)';
//     toggleBtn.style.background = 'none';
//     toggleBtn.style.border = 'none';
//     toggleBtn.style.cursor = 'pointer';
//     toggleBtn.style.color = '#94a3b8';
//     toggleBtn.style.fontSize = '1.1rem';
//     toggleBtn.style.padding = '0.5rem';
//     toggleBtn.style.display = 'flex';
//     toggleBtn.style.alignItems = 'center';
//     toggleBtn.style.justifyContent = 'center';
//     toggleBtn.style.transition = 'color 0.3s ease';
    
//     toggleBtn.addEventListener('mousedown', () => {
//       input.type = 'text';
//       toggleBtn.innerHTML = '<i class="uil uil-eye-slash"></i>';
//       toggleBtn.style.color = '#27c291';
//     });
    
//     toggleBtn.addEventListener('mouseup', () => {
//       input.type = 'password';
//       toggleBtn.innerHTML = '<i class="uil uil-eye"></i>';
//       toggleBtn.style.color = '#94a3b8';
//     });
    
//     toggleBtn.addEventListener('mouseleave', () => {
//       input.type = 'password';
//       toggleBtn.innerHTML = '<i class="uil uil-eye"></i>';
//       toggleBtn.style.color = '#94a3b8';
//     });
    
//     wrapper.style.position = 'relative';
//     wrapper.appendChild(toggleBtn);
//   }
// });

// Login form real-time validation
document.getElementById('loginUsername').addEventListener('blur', (e) => {
  const email = e.target.value.trim();
  const errorDiv = e.target.parentElement.nextElementSibling;

  if (!email) {
    // empty - don't show a browser tooltip (we use JS messages on submit)
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

document.getElementById('loginPassword').addEventListener('blur', (e) => {
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

  if (password && password.length < 8) {
    e.target.classList.add('error');
    if (errorDiv && errorDiv.classList.contains('form-error')) {
      errorDiv.textContent = 'Password must be at least 8 characters';
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

// Register validations and handlers moved to `js/register.js`

// // --- Tab Switching ---
// document.querySelectorAll('.tab-btn').forEach(btn => {
//   btn.addEventListener('click', () => {
//     const tabName = btn.getAttribute('data-tab');
    
//     // Remove active from all tabs and forms
//     document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
//     document.querySelectorAll('.form-content').forEach(f => f.classList.remove('active'));
    
//     // Add active to clicked tab and corresponding form
//     btn.classList.add('active');
//     document.querySelector(`.form-content[data-form="${tabName}"]`).classList.add('active');
//   });
// });

// // Switch tab via link click
// document.querySelectorAll('.switch-tab').forEach(link => {
//   link.addEventListener('click', (e) => {
//     e.preventDefault();
//     const tabName = link.getAttribute('data-tab');
//     const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
//     if (tabBtn) tabBtn.click();
//   });
// });

// // --- Login Form Handler ---
// document.getElementById('loginForm').addEventListener('submit', async (e) => {
//   e.preventDefault();
  
//   const email = document.getElementById('loginEmail').value.trim();
//   const password = document.getElementById('loginPassword').value;
  
//   // Clear previous errors
//   clearFormErrors('login');

//   // Validate
//   if (!email || !password) {
//     // show under the email field and mark password too
//     showFormError('login', 'loginEmail', 'Email and password are required');
//     const pw = document.getElementById('loginPassword'); if (pw) pw.classList.add('error');
//     return;
//   }
  
//   // Attempt login
//   const res = loginUser({ email, password });
  
//   if (!res.ok) {
//     // show specific messages depending on failure reason
//     if (res.code === 'no_user') {
//       showFormError('login', 'loginEmail', res.message || "We can\u2019t find an account with this email");
//     } else if (res.code === 'incorrect_pw') {
//       showFormError('login', 'loginPassword', res.message || 'Incorrect password');
//     } else {
//       showFormError('login', 'loginEmail', res.message || 'Email or password is incorrect');
//       const pw = document.getElementById('loginPassword'); if (pw) pw.classList.add('error');
//     }
//     return;
//   }
  
//   // Success - redirect to dashboard
//   showSuccess('login', 'Login successful! Redirecting...');
//   window.showToast('Login successful! Redirecting...');
//   setTimeout(() => {
//     window.redirectWithTransition('index.html');
//   }, 1000);
// });

// Register form handling moved to `js/register.js`

// --- Helper Functions ---
function showFormError(formId, fieldId, message) {
  const field = document.getElementById(fieldId);
  if (field) {
    field.classList.add('error');
    const errorDiv = field.parentElement.nextElementSibling;
    if (errorDiv && errorDiv.classList.contains('form-error')) {
      errorDiv.textContent = message;
      errorDiv.classList.add('show');
    }
  }
}

function clearFormErrors(formId) {
  const form = formId === 'login' ? document.getElementById('loginForm') : document.getElementById('registerForm');
  form.querySelectorAll('.form-input').forEach(input => {
    input.classList.remove('error');
  });
  form.querySelectorAll('.form-error').forEach(error => {
    error.textContent = '';
    error.classList.remove('show');
  });
}

function showSuccess(formId, message) {
  const form = formId === 'login' ? document.getElementById('loginForm') : document.getElementById('registerForm');
  // You could replace alert with a toast notification here
  console.log('✓', message);
}

// // --- Auto-login check (redirect if already authenticated) ---
// window.addEventListener('DOMContentLoaded', () => {
//   const auth = _getAuthUser();
//   if (auth) {
//     // Already logged in, redirect to dashboard
//     window.location.href = 'index.html';
//   }
// });

// // Expose debug API
// window.SCAuth = {
//   loginUser,
  
//   _getUsers,
//   _getAuthUser
// };
