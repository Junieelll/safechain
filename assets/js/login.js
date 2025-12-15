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
  }, 400);
};

// --- Password Toggle Visibility ---
const togglePassword = document.getElementById('togglePassword');
const loginPassword = document.getElementById('loginPassword');

if (togglePassword && loginPassword) {
  togglePassword.addEventListener('click', function() {
    const type = loginPassword.getAttribute('type') === 'password' ? 'text' : 'password';
    loginPassword.setAttribute('type', type);
    
    this.classList.toggle('uil-eye');
    this.classList.toggle('uil-eye-slash');
  });
}

// --- Form Validation ---
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('loginUsername');
  const passwordInput = document.getElementById('loginPassword');

  if (!loginForm || !usernameInput || !passwordInput) return;

  // Function to show error
  function showError(input, message) {
    const formGroup = input.closest('.form-group');
    const errorDiv = formGroup.querySelector('.form-error');
    
    // Add error styling to input
    input.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-200');
    input.classList.remove('border-gray-300');
    
    // Show error message
    errorDiv.textContent = message;
    errorDiv.classList.add('text-red-500', 'text-sm', 'mt-1', 'block');
    errorDiv.style.display = 'block'; // Force display
  }

  // Function to clear error
  function clearError(input) {
    const formGroup = input.closest('.form-group');
    const errorDiv = formGroup.querySelector('.form-error');
    
    // Remove error styling from input
    input.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-200');
    input.classList.add('border-gray-300');
    
    // Clear error message
    errorDiv.textContent = '';
    errorDiv.style.display = 'none';
  }

  // Clear errors on input
  usernameInput.addEventListener('input', function() {
    if (this.value.trim() !== '') {
      clearError(this);
    }
  });

  passwordInput.addEventListener('input', function() {
    if (this.value.trim() !== '') {
      clearError(this);
    }
  });

  // Form submit validation
  loginForm.addEventListener('submit', function(e) {
    let isValid = true;

    // Validate username
    if (usernameInput.value.trim() === '') {
      e.preventDefault();
      showError(usernameInput, 'Username is required');
      isValid = false;
    } else {
      clearError(usernameInput);
    }

    // Validate password
    if (passwordInput.value.trim() === '') {
      e.preventDefault();
      showError(passwordInput, 'Password is required');
      isValid = false;
    } else {
      clearError(passwordInput);
    }

    // If form is invalid, focus on first error
    if (!isValid) {
      const firstError = loginForm.querySelector('.border-red-500');
      if (firstError) {
        firstError.focus();
      }
    }
  });
});