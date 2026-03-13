<?php
// pages/auth/forgot_password.php
if (session_status() === PHP_SESSION_NONE) session_start();

require_once __DIR__ . '/../../config/conn.php';
require_once __DIR__ . '/../../includes/auth_helper.php';

AuthChecker::redirectIfAuthenticated('../home');

// Allow restarting the flow via GET param
if (isset($_GET['restart'])) {
    foreach (['fp_step','fp_user_id','fp_username','fp_name','fp_email','fp_otp','fp_expires','fp_verified','fp_masked'] as $k) {
        unset($_SESSION[$k]);
    }
    header('Location: forgot-password');
    exit;
}

$step    = $_SESSION['fp_step'] ?? 'request';
$error   = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    // ── Step 1: Lookup username ───────────────────────────────────────────
    if ($action === 'request') {
        $username = trim($_POST['username'] ?? '');
        if (empty($username)) {
            $error = 'Please enter your username.';
            $step  = 'request';
        } else {
            $stmt = $conn->prepare("SELECT user_id, name, email FROM users WHERE username = ? AND status != 'suspended' LIMIT 1");
            $stmt->bind_param('s', $username);
            $stmt->execute();
            $row = $stmt->get_result()->fetch_assoc();
            $stmt->close();

            if (!$row) {
                $error = "We couldn't find an active account with that username.";
                $step  = 'request';
            } elseif (empty($row['email'])) {
                $error = "No email is linked to this account. Please contact an administrator.";
                $step  = 'request';
            } else {
                $otp     = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
                $expires = time() + 600;

                $_SESSION['fp_user_id']  = $row['user_id'];
                $_SESSION['fp_username'] = $username;
                $_SESSION['fp_name']     = $row['name'];
                $_SESSION['fp_email']    = $row['email'];
                $_SESSION['fp_otp']      = password_hash($otp, PASSWORD_DEFAULT);
                $_SESSION['fp_expires']  = $expires;
                $_SESSION['fp_verified'] = false;
                $_SESSION['fp_step']     = 'verify';

                // Send OTP — swap mail() for your mailer as needed
                $to      = $row['email'];
                $subject = 'SafeChain Password Reset OTP';
                $msg     = "Hi {$row['name']},\n\nYour OTP is: {$otp}\n\nThis code expires in 10 minutes.\nIf you did not request this, ignore this email.\n\n— SafeChain";
                @mail($to, $subject, $msg, 'From: no-reply@safechain.local');

                [$local, $domain] = explode('@', $to);
                $masked = substr($local, 0, 2) . str_repeat('*', max(0, strlen($local) - 2)) . '@' . $domain;
                $_SESSION['fp_masked'] = $masked;

                $step    = 'verify';
                $success = "A 6-digit code was sent to {$masked}.";
            }
        }
    }

    // ── Step 2: Verify OTP ────────────────────────────────────────────────
    elseif ($action === 'verify') {
        $digits = array_map(fn($k) => trim($_POST[$k] ?? ''), ['d1','d2','d3','d4','d5','d6']);
        $otp    = implode('', $digits);
        $step   = 'verify';

        if (strlen($otp) < 6 || !ctype_digit($otp)) {
            $error = 'Please enter the complete 6-digit code.';
        } elseif (!isset($_SESSION['fp_otp'], $_SESSION['fp_expires'])) {
            $error = 'Session expired. Please start over.';
            $step  = 'request';
        } elseif (time() > $_SESSION['fp_expires']) {
            $error = 'Your code has expired. Please request a new one.';
            $step  = 'request';
            unset($_SESSION['fp_otp'], $_SESSION['fp_expires'], $_SESSION['fp_step']);
        } elseif (!password_verify($otp, $_SESSION['fp_otp'])) {
            $error = 'Incorrect code. Please try again.';
        } else {
            $_SESSION['fp_verified'] = true;
            $_SESSION['fp_step']     = 'reset';
            $step = 'reset';
        }
    }

    // ── Step 3: Reset password ────────────────────────────────────────────
    elseif ($action === 'reset') {
        $step = 'reset';
        if (empty($_SESSION['fp_verified'])) {
            $error = 'Unauthorized. Please start over.';
            $step  = 'request';
        } else {
            $pw  = $_POST['password']  ?? '';
            $pw2 = $_POST['password2'] ?? '';

            if (strlen($pw) < 8) {
                $error = 'Password must be at least 8 characters.';
            } elseif ($pw !== $pw2) {
                $error = 'Passwords do not match.';
            } else {
                $hash = password_hash($pw, PASSWORD_DEFAULT);
                $uid  = $_SESSION['fp_user_id'];
                $stmt = $conn->prepare("UPDATE users SET password = ? WHERE user_id = ?");
                $stmt->bind_param('ss', $hash, $uid);
                $stmt->execute();
                $stmt->close();

                foreach (['fp_step','fp_user_id','fp_username','fp_name','fp_email','fp_otp','fp_expires','fp_verified','fp_masked'] as $k) {
                    unset($_SESSION[$k]);
                }

                $step = 'done';
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SafeChain | Forgot Password</title>
    <base href="../../" />
    <link rel="stylesheet" href="assets/unicons/line.css" />
    <script src="assets/js/tailwind/tailwind.min.js"></script>
    <link href="assets/css/font.css" rel="stylesheet" />
    <link rel="icon" type="image/x-icon" href="assets/img/logo.png">
    <style>
        @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fadeSlideUp .4s ease both; }

        @keyframes slide {
            0%,33.32%  { opacity: 1; }
            33.33%,100% { opacity: 0; }
        }
        .carousel-slide                  { animation: slide 12s infinite; }
        .carousel-slide:nth-child(2)     { animation-delay: 4s; }
        .carousel-slide:nth-child(3)     { animation-delay: 8s; }

        .otp-input::-webkit-outer-spin-button,
        .otp-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .otp-input { -moz-appearance: textfield; }
    </style>
</head>
<body class="min-h-screen flex overflow-hidden">

    <!-- Carousel background -->
    <div class="fixed inset-0 z-0">
        <div class="carousel-slide absolute inset-0 bg-cover bg-center" style="background-image:url('assets/img/1.jpeg')"></div>
        <div class="carousel-slide absolute inset-0 bg-cover bg-center opacity-0" style="background-image:url('assets/img/2.jpg')"></div>
        <div class="carousel-slide absolute inset-0 bg-cover bg-center opacity-0" style="background-image:url('assets/img/3.jpeg')"></div>
        <div class="absolute inset-0 bg-black/60"></div>
    </div>

    <!-- Layout -->
    <div class="relative z-10 flex w-full min-h-screen">

        <!-- ── Left panel ── -->
        <div class="hidden lg:flex flex-col justify-between flex-1 p-10">
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                    <img src="assets/img/logo.png" alt="SafeChain" class="w-7 h-7 object-contain" />
                </div>
                <span class="text-white text-xl font-bold tracking-tight">SafeChain</span>
            </div>

            <div>
                <h2 class="text-neutral-200 font-semibold text-4xl leading-snug mb-3">
                    Alert Instantly.<br>Connect Reliably.<br>Save Lives.
                </h2>
                <p class="text-neutral-300 text-base leading-relaxed max-w-sm">
                    From fire emergencies to floods and crime alerts, our smart community system lets you call for help instantly.
                </p>
                <div class="flex gap-2 mt-6">
                    <div class="w-6 h-1.5 rounded-full bg-white"></div>
                    <div class="w-2 h-1.5 rounded-full bg-white/40"></div>
                    <div class="w-2 h-1.5 rounded-full bg-white/40"></div>
                </div>
            </div>
        </div>

        <!-- ── Right panel ── -->
        <div class="flex items-center justify-center w-full lg:w-[480px] flex-shrink-0 p-6">
            <div class="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 md:p-10 animate-fade-up">

                <?php if ($step === 'done'): ?>
                <!-- ══ Done ══ -->
                <div class="flex flex-col items-center text-center">
                    <div class="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-5">
                        <i class="uil uil-check-circle text-[2.5rem] text-emerald-500"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-slate-800 mb-2">Password Reset!</h2>
                    <p class="text-slate-500 text-sm leading-relaxed mb-8">
                        Your password has been updated successfully. You can now log in with your new password.
                    </p>
                    <a href="auth/login"
                        class="w-full inline-flex items-center justify-center gap-2 bg-[#01AF78] hover:bg-emerald-600 text-white font-semibold py-3 rounded-full transition-colors text-sm">
                        <i class="uil uil-sign-in-alt"></i> Back to Login
                    </a>
                </div>

                <?php elseif ($step === 'reset'): ?>
                <!-- ══ Step 3: New password ══ -->
                <a href="auth/forgot-password?restart=1"
                    class="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors mb-6">
                    <i class="uil uil-arrow-left text-sm"></i> Start Over
                </a>
                <div class="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                    <i class="uil uil-lock-alt text-xl text-[#01AF78]"></i>
                </div>
                <h2 class="text-2xl font-bold text-slate-800 mb-1">Set New Password</h2>
                <p class="text-slate-500 text-sm mb-6">Choose a strong password for your account.</p>

                <?php if ($error): ?>
                    <div class="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-5 text-sm">
                        <i class="uil uil-exclamation-triangle flex-shrink-0 mt-0.5"></i>
                        <?= htmlspecialchars($error) ?>
                    </div>
                <?php endif; ?>

                <form method="POST" action="auth/forgot-password" novalidate>
                    <input type="hidden" name="action" value="reset" />

                    <div class="mb-4">
                        <label class="block text-xs font-semibold text-slate-600 mb-1.5">New Password</label>
                        <div class="relative">
                            <i class="uil uil-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none"></i>
                            <input type="password" name="password" id="newPassword" required minlength="8"
                                placeholder="Min. 8 characters"
                                class="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-[#01AF78] focus:ring-2 focus:ring-emerald-100 transition-all placeholder-slate-300" />
                            <button type="button" onclick="toggleVis('newPassword','eyeNew')"
                                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                <i id="eyeNew" class="uil uil-eye text-lg"></i>
                            </button>
                        </div>
                    </div>

                    <div class="mb-7">
                        <label class="block text-xs font-semibold text-slate-600 mb-1.5">Confirm Password</label>
                        <div class="relative">
                            <i class="uil uil-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none"></i>
                            <input type="password" name="password2" id="confirmPassword" required
                                placeholder="Re-enter your password"
                                class="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-[#01AF78] focus:ring-2 focus:ring-emerald-100 transition-all placeholder-slate-300" />
                            <button type="button" onclick="toggleVis('confirmPassword','eyeConfirm')"
                                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                <i id="eyeConfirm" class="uil uil-eye text-lg"></i>
                            </button>
                        </div>
                    </div>

                    <button type="submit"
                        class="w-full bg-[#01AF78] hover:bg-emerald-600 text-white font-semibold py-3 rounded-full transition-colors text-sm flex items-center justify-center gap-2">
                        <i class="uil uil-check"></i> Reset Password
                    </button>
                </form>

                <?php elseif ($step === 'verify'): ?>
                <!-- ══ Step 2: OTP ══ -->
                <a href="auth/forgot-password?restart=1"
                    class="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors mb-6">
                    <i class="uil uil-arrow-left text-sm"></i> Back
                </a>
                <div class="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                    <i class="uil uil-envelope-check text-xl text-[#01AF78]"></i>
                </div>
                <h2 class="text-2xl font-bold text-slate-800 mb-1">Check Your Email</h2>
                <p class="text-slate-500 text-sm mb-6">
                    We sent a 6-digit code to
                    <span class="font-semibold text-slate-700"><?= htmlspecialchars($_SESSION['fp_masked'] ?? '') ?></span>.
                    Enter it below to continue.
                </p>

                <?php if ($error): ?>
                    <div class="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-5 text-sm">
                        <i class="uil uil-exclamation-triangle flex-shrink-0 mt-0.5"></i>
                        <?= htmlspecialchars($error) ?>
                    </div>
                <?php endif; ?>
                <?php if ($success): ?>
                    <div class="flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 mb-5 text-sm">
                        <i class="uil uil-check-circle flex-shrink-0 mt-0.5"></i>
                        <?= htmlspecialchars($success) ?>
                    </div>
                <?php endif; ?>

                <form method="POST" action="auth/forgot-password" novalidate>
                    <input type="hidden" name="action" value="verify" />
                    <div class="flex gap-2 justify-between mb-6">
                        <?php foreach (['d1','d2','d3','d4','d5','d6'] as $d): ?>
                            <input type="number" name="<?= $d ?>" maxlength="1" inputmode="numeric" autocomplete="off"
                                class="otp-input w-11 h-14 text-center text-xl font-bold text-slate-800 border-2 border-slate-200 rounded-xl outline-none focus:border-[#01AF78] focus:ring-2 focus:ring-emerald-100 transition-all" />
                        <?php endforeach; ?>
                    </div>

                    <button type="submit"
                        class="w-full bg-[#01AF78] hover:bg-emerald-600 text-white font-semibold py-3 rounded-full transition-colors text-sm flex items-center justify-center gap-2 mb-5">
                        <i class="uil uil-arrow-right"></i> Verify Code
                    </button>
                </form>

                <p class="text-center text-xs text-slate-400">
                    Didn't receive it?
                    <form method="POST" action="auth/forgot-password" class="inline">
                        <input type="hidden" name="action" value="request" />
                        <input type="hidden" name="username" value="<?= htmlspecialchars($_SESSION['fp_username'] ?? '') ?>" />
                        <button type="submit" class="text-[#01AF78] font-semibold hover:underline">Resend code</button>
                    </form>
                </p>

                <?php else: ?>
                <!-- ══ Step 1: Username ══ -->
                <a href="auth/login"
                    class="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors mb-6">
                    <i class="uil uil-arrow-left text-sm"></i> Back to Login
                </a>
                <div class="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                    <i class="uil uil-key-skeleton-alt text-xl text-[#01AF78]"></i>
                </div>
                <h2 class="text-2xl font-bold text-slate-800 mb-1">Forgot Password?</h2>
                <p class="text-slate-500 text-sm mb-6">
                    Enter your username and we'll send a reset code to your linked email address.
                </p>

                <?php if ($error): ?>
                    <div class="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-5 text-sm">
                        <i class="uil uil-exclamation-triangle flex-shrink-0 mt-0.5"></i>
                        <?= htmlspecialchars($error) ?>
                    </div>
                <?php endif; ?>

                <form method="POST" action="auth/forgot-password" novalidate>
                    <input type="hidden" name="action" value="request" />

                    <div class="mb-7">
                        <label class="block text-xs font-semibold text-slate-600 mb-1.5">Username</label>
                        <div class="relative">
                            <i class="uil uil-user absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none"></i>
                            <input type="text" name="username" autofocus required
                                value="<?= htmlspecialchars($_POST['username'] ?? '') ?>"
                                placeholder="Enter your username"
                                class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 outline-none focus:border-[#01AF78] focus:ring-2 focus:ring-emerald-100 transition-all placeholder-slate-300" />
                        </div>
                    </div>

                    <button type="submit"
                        class="w-full bg-[#01AF78] hover:bg-emerald-600 text-white font-semibold py-3 rounded-full transition-colors text-sm flex items-center justify-center gap-2">
                        <i class="uil uil-fast-mail"></i> Send Reset Code
                    </button>
                </form>

                <?php endif; ?>

            </div>
        </div>
    </div>

    <script>
        // ── OTP box auto-advance & paste ──────────────────────────────────
        const otpInputs = document.querySelectorAll('.otp-input');
        otpInputs.forEach((box, i) => {
            box.addEventListener('input', () => {
                const val = box.value.replace(/\D/g, '');
                box.value = val.slice(-1);
                if (val && i < otpInputs.length - 1) otpInputs[i + 1].focus();
            });
            box.addEventListener('keydown', e => {
                if (e.key === 'Backspace' && !box.value && i > 0) otpInputs[i - 1].focus();
            });
            box.addEventListener('paste', e => {
                e.preventDefault();
                const pasted = (e.clipboardData || window.clipboardData)
                    .getData('text').replace(/\D/g, '').slice(0, 6);
                [...pasted].forEach((ch, j) => { if (otpInputs[j]) otpInputs[j].value = ch; });
                const focusIdx = Math.min(pasted.length, otpInputs.length - 1);
                otpInputs[focusIdx]?.focus();
            });
        });

        // ── Password visibility toggle ────────────────────────────────────
        function toggleVis(inputId, iconId) {
            const input = document.getElementById(inputId);
            const icon  = document.getElementById(iconId);
            if (!input) return;
            const show  = input.type === 'password';
            input.type  = show ? 'text' : 'password';
            icon.className = `uil ${show ? 'uil-eye-slash' : 'uil-eye'} text-lg`;
        }
    </script>
</body>
</html>