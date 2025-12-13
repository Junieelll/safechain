// Smooth Page Transitions

// Apply fade-in animation on page load
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.remove('page-exit');
});

// Intercept all navigation links to apply fade-out before redirect
function setupPageTransitions() {
  // Redirect functions that should include fade-out
  const originalRedirects = {
    loginToIndex: () => redirectWithTransition('index.html'),
    logoutToLogin: () => redirectWithTransition('login.html'),
  };

  window.redirectWithTransition = function (href) {
    document.body.classList.add('page-exit');
    setTimeout(() => {
      window.location.href = href;
    }, 400); // Match animation duration
  };

  // Export for use in other scripts
  window.pageTransitions = originalRedirects;
}

// Initialize on load
setupPageTransitions();
