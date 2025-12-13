<?php
// pages/auth/register.php
require_once __DIR__ . '/../../includes/auth_helper.php';

// Redirect if already authenticated
if (AuthChecker::isLoggedIn()) {
  header('Location: /home');
  exit;
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SafeChain | Register</title>
  <base href="/safechain/" />
  <link rel="stylesheet" href="assets/unicons/line.css" />
  <script src="assets/js/tailwind/tailwind.min.js"></script>
  <link href="assets/css/font.css" rel="stylesheet" />
  <link rel="stylesheet" href="assets/css/register.css" />
  <link rel="stylesheet" href="assets/css/transitions.css" />
  <link rel="icon" type="image/x-icon" href="assets/img/logo.png">
</head>

<body>
  <!-- Full-Screen Carousel Background -->
  <div class="carousel-wrapper">
    <div class="carousel-slide active" style="background-image: url('assets/img/1.jpeg');"></div>
    <div class="carousel-slide" style="background-image: url('assets/img/2.jpg');"></div>
    <div class="carousel-slide" style="background-image: url('assets/img/3.jpeg');"></div>
  </div>

  <!-- Dark Overlay -->
  <div class="carousel-overlay-dark"></div>

  <!-- Global Toast Notification -->
  <div id="globalToast" class="global-toast">
    <div class="toast-content">
      <i class="uil uil-check-circle"></i>
      <span id="toastMessage"></span>
    </div>
    <button id="toastClose" type="button" class="toast-close">
      <i class="uil uil-times"></i>
    </button>
  </div>

  <!-- Content Container -->
  <div class="login-container">
    <!-- Left Side - Branding -->
    <div class="login-left">
      <div class="login-branding">
        <div class="login-logo"><img src="assets/img/logo.png" alt="SafeChain Logo" style="width: 48px; height: 48px; display: block;" /></div>
        <div>
          <h1 class="login-title">SafeChain</h1>
        </div>
      </div>

      <div class="login-footer">
        <h2 style="font-size: 2.5rem; font-weight: 700; color: white; line-height: 1.2; margin-bottom: 1rem;">Alert Instantly. Connect Reliably. Save Lives.</h2>
        <p style="font-size: 1rem; color: rgba(255, 255, 255, 0.7); max-width: 400px; line-height: 1.6; margin: 0;">From fire emergencies to floods and crime alerts, our smart community system lets you call for help instantly.</p>
        <p style="margin-top: 1.5rem; font-size: 0.85rem; letter-spacing: 1px; text-transform: uppercase; color: rgba(255, 255, 255, 0.5);">TRUSTED RESPONSE PARTNERS</p>
      </div>
    </div>

    <!-- Right Side - Form -->
    <div class="login-right">
      <div class="login-form-wrapper">
        <div class="login-form-header">
          <h2>Create Account</h2>
          <p>Register to access your SafeChain dashboard</p>
        </div>

        <form id="registerForm" class="form-content active" data-form="register" novalidate>
          <div class="form-group">
            <label class="form-label" for="registerName">Full Name</label>
            <div class="form-input-wrapper">
              <i class="uil uil-user form-input-icon"></i>
              <input type="text" id="registerName" class="form-input" required />
            </div>
            <div class="form-error"></div>
          </div>

          <div class="form-group">
            <label class="form-label" for="registerUsername">Username</label>
            <div class="form-input-wrapper">
              <i class="uil uil-user form-input-icon"></i>
              <input type="email" id="registerUsername" class="form-input" required />
            </div>
            <div class="form-error"></div>
          </div>

          <div class="form-group">
            <label class="form-label" for="registerPassword">Password</label>
            <div class="form-input-wrapper">
              <i class="uil uil-lock form-input-icon"></i>
              <input type="password" id="registerPassword" class="form-input" required />
            </div>
            <div class="form-error"></div>
          </div>

          <div class="form-group">
            <label class="form-label" for="confirmPassword">Confirm Password</label>
            <div class="form-input-wrapper">
              <i class="uil uil-lock form-input-icon"></i>
              <input type="password" id="confirmPassword" class="form-input" required />
            </div>
            <div class="form-error"></div>
          </div>

          <div class="form-checkbox">
            <input type="checkbox" id="agreeTerms" name="agreeTerms" class="w-5 h-5 appearance-none border-2 border-gray-300 rounded-md checked:bg-[#01AF78] checked:border-[#01AF78] focus:ring-2 focus:ring-emerald-100 focus:ring-offset-0 transition-all cursor-pointer bg-[length:10px_10px] bg-center bg-no-repeat checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOSIgdmlld0JveD0iMCAwIDEyIDkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgNEw0LjUgNy41TDExIDEiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')]" required />
            <label for="agreeTerms">I agree to the terms and conditions</label>
          </div>

          <button type="submit" class="form-submit mt-5 rounded-full">Create Account</button>

          <div class="form-link">
            Already have an account?
            <a href="auth/login">Login here</a>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- <script src="assets/js/register.js"></script> -->
</body>

</html>