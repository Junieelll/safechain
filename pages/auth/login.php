<?php
// pages/auth/login.php
require_once __DIR__ . '/../../config/conn.php';
require_once __DIR__ . '/../../includes/auth_helper.php';
require_once __DIR__ . '/../../includes/user_functions.php';

// Redirect if already authenticated
if (AuthChecker::isLoggedIn()) {
  header('Location: ../home');
  exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $username = trim($_POST['username'] ?? '');
  $password = $_POST['password'] ?? '';
  $rememberMe = isset($_POST['remember_me']);

  if (empty($username) || empty($password)) {
    $error = "Oops! Please fill in both your username and password.";
  } else {
    try {
      // First, check if username exists
      $userExists = getUserByUsername($conn, $username);
      
      if (!$userExists) {
        // Username doesn't exist
        $error = "Hmm, we couldn't find an account with that username. Double-check your spelling or create a new account.";
      } else {
        // Try to verify credentials
        $user = verifyCredentials($conn, $username, $password);
        
        if (!$user) {
          // Username exists but password is wrong
          $error = "That password doesn't seem right. Please try again.";
        } else {
          // Login successful - pass all required parameters
          AuthChecker::login($user['user_id'], $user['name'], $user['username'], $user['role'], $rememberMe);

          if (
            !empty($_SERVER['HTTP_X_REQUESTED_WITH']) &&
            strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest'
          ) {
            header('Content-Type: application/json');
            echo json_encode(['success' => true, 'redirect' => '../home']);
            exit;
          }

          header('Location: ../home');
          exit;
        }
      }
    } catch (Exception $e) {
      $error = "Something went wrong on our end. Please try again in a moment.";
      error_log("Login error: " . $e->getMessage());
    }
  }

  if (
    !empty($_SERVER['HTTP_X_REQUESTED_WITH']) &&
    strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest'
  ) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => $error]);
    exit;
  }
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SafeChain | Login</title>
  <base href="/safechain/">
  <link rel="stylesheet" href="assets/unicons/line.css" />
  <script src="assets/js/tailwind/tailwind.min.js"></script>
  <link href="assets/css/font.css" rel="stylesheet" />
  <link rel="stylesheet" href="assets/css/login.css" />
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

  <div class="login-container">
    <div class="login-left">
      <div class="login-branding">
        <div class="login-logo">
          <img src="assets/img/logo.png" alt="SafeChain Logo" style="width: 48px; height: 48px; display: block;" />
        </div>
        <div>
          <h1 class="login-title">SafeChain</h1>
        </div>
      </div>

      <div class="login-footer">
        <h2 class="text-neutral-200 mb-3 font-semibold text-4xl">Alert Instantly. Connect Reliably. Save Lives.</h2>
        <p class="text-neutral-300 text-base">From fire emergencies to floods and crime alerts, our smart community system lets you call for help instantly.</p>
        
        <div class="page-indicator">
          <div class="indicator-dot active"></div>
          <div class="indicator-dot"></div>
          <div class="indicator-dot"></div>
        </div>
      </div>
    </div>

    <div class="login-right">
      <div class="login-form-wrapper h-[calc(100%-40px)] flex flex-col justify-center">
        <div class="login-form-header">
          <h2>Welcome Back!</h2>
          <p>Log in to access your SafeChain dashboard</p>
        </div>

        <?php if ($error): ?>
          <div style="background: #fee2e2; border: 1px solid #fecaca; color: #dc2626; padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 14px;">
            <i class="uil uil-exclamation-triangle" style="margin-right: 8px;"></i>
            <?= htmlspecialchars($error) ?>
          </div>
        <?php endif; ?>

        <form id="loginForm" method="POST" action="auth/login" class="form-content active" data-form="login" novalidate>
          <div class="form-group">
            <label class="form-label" for="loginUsername">Username</label>
            <div class="form-input-wrapper">
              <i class="uil uil-user form-input-icon"></i>
              <input
                type="text"
                id="loginUsername"
                name="username"
                class="form-input"
                value="<?= htmlspecialchars($_POST['username'] ?? '') ?>"
                required />
            </div>
            <div class="form-error"></div>
          </div>

          <div class="form-group">
            <label class="form-label" for="loginPassword">Password</label>
            <div class="form-input-wrapper relative">
              <i class="uil uil-lock form-input-icon"></i>
              <input
                type="password"
                id="loginPassword"
                name="password"
                class="form-input"
                required />
                <i class="uil uil-eye absolute text-lg text-neutral-500 cursor-pointer top-1/2 -translate-y-1/2 right-3"></i>
            </div>
            <div class="form-error"></div>
          </div>

          <div class="form-checkbox">
            <input
              type="checkbox"
              id="rememberMe"
              name="remember_me"
              class="w-5 h-5 appearance-none border-2 border-gray-300 rounded-md checked:bg-[#01AF78] checked:border-[#01AF78] focus:ring-2 focus:ring-emerald-100 focus:ring-offset-0 transition-all cursor-pointer bg-[length:10px_10px] bg-center bg-no-repeat checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOSIgdmlld0JveD0iMCAwIDEyIDkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgNEw0LjUgNy41TDExIDEiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')]" />
            <label for="rememberMe">Remember me</label>
          </div>

          <button type="submit" class="form-submit rounded-full mt-5">Login</button>

          <div class="form-link">
            Don't have an account?
            <a href="auth/register">Register here</a>
          </div>
        </form>
      </div>
    </div>
  </div>

  <script src="assets/js/login.js"></script>
</body>

</html>