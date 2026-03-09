<?php
// pages/profile.php
if (session_status() === PHP_SESSION_NONE) session_start();

require_once $_SERVER['DOCUMENT_ROOT'] . '/includes/auth_helper.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/includes/user_functions.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/config/conn.php'; // adjust path if needed

// Guard: must be logged in
if (!AuthChecker::isLoggedIn()) {
    header('Location: /auth/login');
    exit;
}

$userId = AuthChecker::getUserId();

// Fetch fresh data from DB
$user = getUserById($conn, $userId);

if (!$user) {
    header('Location: /auth/login');
    exit;
}

// ── Helpers ──────────────────────────────────────────────
// Initials from name
function getProfileInitials(string $name): string {
    $parts = explode(' ', trim($name));
    if (count($parts) >= 2) {
        return strtoupper(substr($parts[0], 0, 1) . substr($parts[1], 0, 1));
    }
    return strtoupper(substr($name, 0, 2));
}

// Format datetime nicely, returns '—' if null
function formatDate(?string $datetime, string $format = 'M j, Y'): string {
    if (!$datetime) return '—';
    return date($format, strtotime($datetime));
}

function formatDateTime(?string $datetime): string {
    if (!$datetime) return 'Never';
    $ts   = strtotime($datetime);
    $diff = time() - $ts;
    if ($diff < 60)         return 'Just now';
    if ($diff < 3600)       return floor($diff / 60) . 'm ago';
    if ($diff < 86400)      return floor($diff / 3600) . 'h ago';
    if ($diff < 172800)     return 'Yesterday';
    return date('M j, Y g:i A', $ts);
}

// Role badge config
function getRoleBadge(string $role): array {
    return match(strtolower($role)) {
        'superadmin' => ['label' => 'Super Admin', 'bg' => 'bg-purple-100 dark:bg-purple-900/30', 'text' => 'text-purple-700 dark:text-purple-300', 'dot' => 'bg-purple-500'],
        'admin'      => ['label' => 'Admin',       'bg' => 'bg-emerald-100 dark:bg-emerald-900/30','text' => 'text-emerald-700 dark:text-emerald-300','dot' => 'bg-emerald-500'],
        default      => ['label' => ucfirst($role), 'bg' => 'bg-slate-100 dark:bg-neutral-700',    'text' => 'text-slate-600 dark:text-slate-300',   'dot' => 'bg-slate-400'],
    };
}

// Precompute values used in HTML
$initials    = getProfileInitials($user['name']);
$roleBadge   = getRoleBadge($user['role']);
$memberSince = formatDate($user['created_at'], 'M j, Y');
$avatarSeed  = urlencode($user['name']);
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SafeChain | Profile</title>
    <base href="../" />
    <link rel="stylesheet" href="assets/unicons/line.css" />
    <script src="assets/js/tailwind/tailwind.min.js"></script>
    <link href="assets/css/font.css" rel="stylesheet" />
    <link rel="stylesheet" href="assets/css/sidebar.css" />
    <link rel="stylesheet" href="assets/css/page-load-animation.css" />
    <link rel="stylesheet" href="assets/css/toast.css" />
    <link rel="icon" type="image/x-icon" href="assets/img/logo.png">
    <script>
        tailwind.config = {
            darkMode: ["class", '[data-theme="dark"]'],
        };
    </script>
    <style>
        .focus-brand:focus { outline: none; border-color: #27C291; box-shadow: 0 0 0 3px rgba(39,194,145,0.2); }
        .btn-brand        { background: #27C291; color: #fff; transition: background .2s, transform .1s; }
        .btn-brand:hover  { background: #22ae83; }
        .btn-brand:active { transform: scale(0.96); }
        .icon-brand       { background: rgba(39,194,145,0.1); border: 1px solid rgba(39,194,145,0.2); }
        .icon-brand i     { color: #27C291; }
    </style>
</head>

<body class="min-h-screen flex transition-all duration-300 dark:bg-neutral-900">
    <?php include $_SERVER['DOCUMENT_ROOT'] . '/includes/sidebar.php'; ?>

    <main id="mainContent" class="transition-all duration-500 ease-in-out ml-[302px] flex-1 p-8">

        <!-- Page Header -->
        <div class="mb-8">
            <p class="text-xs text-slate-400 dark:text-slate-500 font-medium mb-1 flex items-center gap-1.5">
                <span>Admin</span>
                <i class="uil uil-angle-right text-sm"></i>
                <span>Profile Settings</span>
            </p>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Account Settings</h1>
            <p class="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Manage your administrator profile and credentials.</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

            <!-- ── Left: Profile Card ── -->
            <div class="lg:col-span-1">
                <div class="bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-3xl p-6 flex flex-col items-center text-center gap-4">

                    <!-- Avatar -->
                    <div class="relative w-28 h-28 mt-1 group">
                        <img id="avatarPreview"
                            src="https://api.dicebear.com/8.x/initials/svg?seed=<?= $avatarSeed ?>&backgroundColor=27C291&fontFamily=Helvetica&fontSize=38&chars=2"
                            alt="Profile Photo"
                            class="w-full h-full rounded-full object-cover"
                            style="box-shadow: 0 0 0 4px rgba(39,194,145,0.3);" />
                        <div onclick="document.getElementById('avatarInput').click()"
                            class="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer gap-1">
                            <i class="uil uil-camera text-white text-xl"></i>
                            <span class="text-white text-xs font-medium">Change</span>
                        </div>
                    </div>
                    <input type="file" id="avatarInput" accept="image/*" class="hidden" />

                    <!-- Name & username -->
                    <div>
                        <div id="displayName" class="font-bold text-lg text-slate-900 dark:text-slate-100 leading-tight">
                            <?= htmlspecialchars($user['name']) ?>
                        </div>
                        <div id="displayUsername" class="text-slate-400 dark:text-slate-500 text-sm font-medium mt-0.5">
                            <?= htmlspecialchars($user['username']) ?>
                        </div>
                    </div>

                    <!-- Role & Status badges -->
                    <div class="flex items-center gap-2 flex-wrap justify-center">
                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold <?= $roleBadge['bg'] ?> <?= $roleBadge['text'] ?>">
                            <span class="w-1.5 h-1.5 rounded-full <?= $roleBadge['dot'] ?>"></span>
                            <?= $roleBadge['label'] ?>
                        </span>
                    </div>

                    <!-- Info rows -->
                    <div class="w-full border-t border-slate-100 dark:border-neutral-700 pt-4 flex flex-col gap-3">


                        <div class="flex items-center justify-between text-sm">
                            <span class="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs font-medium">
                                <i class="uil uil-calendar-alt text-base"></i>
                                Member Since
                            </span>
                            <span class="text-slate-700 dark:text-slate-300 text-xs font-semibold">
                                <?= htmlspecialchars($memberSince) ?>
                            </span>
                        </div>

                        <div class="flex items-center justify-between text-sm">
                            <span class="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs font-medium">
                                <i class="uil uil-postcard text-base"></i>
                                User ID
                            </span>
                            <span class="text-slate-500 dark:text-slate-400 text-xs font-mono">
                                <?= htmlspecialchars($user['user_id']) ?>
                            </span>
                        </div>

                    </div>

                    <!-- Upload button -->
                    <button onclick="document.getElementById('avatarInput').click()"
                        class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-neutral-600 hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors duration-200">
                        <i class="uil uil-image-upload text-base"></i>
                        Upload Photo
                    </button>
                </div>
            </div>

            <!-- ── Right: Forms ── -->
            <div class="lg:col-span-2 flex flex-col gap-4">

                <!-- Personal Information -->
                <div class="bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-3xl p-6">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 icon-brand">
                            <i class="uil uil-user text-lg"></i>
                        </div>
                        <div>
                            <h2 class="font-semibold text-slate-900 dark:text-slate-100 text-base leading-tight">Personal Information</h2>
                            <p class="text-slate-400 dark:text-slate-500 text-xs mt-0.5">Update your display identity</p>
                        </div>
                    </div>

                    <div class="flex flex-col gap-5">
                        <!-- Full Name -->
                        <div>
                            <label class="block text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Full Name</label>
                            <input id="nameInput" type="text"
                                placeholder="Enter full name"
                                value="<?= htmlspecialchars($user['name']) ?>"
                                oninput="updatePreview(); onInfoChange()"
                                class="focus-brand w-full rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-neutral-700/60 border border-slate-200 dark:border-neutral-600 placeholder-slate-300 dark:placeholder-neutral-500 transition-all duration-200" />
                        </div>

                        <!-- Username -->
                        <div>
                            <label class="block text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Username</label>
                            <div class="relative">
                                <input id="usernameInput" type="text"
                                    placeholder="username"
                                    value="<?= htmlspecialchars($user['username']) ?>"
                                    oninput="onInfoChange(); checkUsernameUnique(this)"
                                    class="focus-brand w-full rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-neutral-700/60 border border-slate-200 dark:border-neutral-600 placeholder-slate-300 dark:placeholder-neutral-500 transition-all duration-200" />
                                <span id="usernameCheckIcon" class="absolute right-3.5 top-1/2 -translate-y-1/2 hidden"></span>
                            </div>
                            <p id="usernameError" class="hidden text-red-400 text-xs font-medium mt-1.5 flex items-center gap-1">
                                <i class="uil uil-exclamation-circle"></i>
                                <span id="usernameErrorText">Only letters, numbers, and underscores allowed.</span>
                            </p>
                        </div>
                    </div>

                    <div id="infoSaveRow" class="hidden justify-end mt-6">
                        <button onclick="saveProfile()" class="btn-brand flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-medium">
                            <i class="uil uil-save text-base"></i>
                            Save Changes
                        </button>
                    </div>
                </div>

                <!-- Change Password -->
                <div class="bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-3xl p-6">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 icon-brand">
                            <i class="uil uil-lock text-lg"></i>
                        </div>
                        <div>
                            <h2 class="font-semibold text-slate-900 dark:text-slate-100 text-base leading-tight">Change Password</h2>
                            <p class="text-slate-400 dark:text-slate-500 text-xs mt-0.5">Choose a strong, unique password</p>
                        </div>
                    </div>

                    <div class="flex flex-col gap-5">

                        <!-- Current Password -->
                        <div>
                            <label class="block text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Current Password</label>
                            <div class="relative">
                                <input id="currentPass" type="password" placeholder="Enter current password"
                                    oninput="onPassChange()"
                                    class="focus-brand w-full rounded-xl px-4 py-3 pr-11 text-sm font-medium text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-neutral-700/60 border border-slate-200 dark:border-neutral-600 placeholder-slate-300 dark:placeholder-neutral-500 transition-all duration-200" />
                                <button type="button" onclick="togglePass('currentPass', this)"
                                    class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500 hover:text-slate-600 dark:hover:text-neutral-300 transition-colors duration-150">
                                    <i class="uil uil-eye text-lg"></i>
                                </button>
                            </div>
                        </div>

                        <!-- New Password -->
                        <div>
                            <label class="block text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">New Password</label>
                            <div class="relative">
                                <input id="newPass" type="password" placeholder="Enter new password"
                                    oninput="checkStrength(this.value); onPassChange()"
                                    class="focus-brand w-full rounded-xl px-4 py-3 pr-11 text-sm font-medium text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-neutral-700/60 border border-slate-200 dark:border-neutral-600 placeholder-slate-300 dark:placeholder-neutral-500 transition-all duration-200" />
                                <button type="button" onclick="togglePass('newPass', this)"
                                    class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500 hover:text-slate-600 dark:hover:text-neutral-300 transition-colors duration-150">
                                    <i class="uil uil-eye text-lg"></i>
                                </button>
                            </div>

                            <!-- Strength meter -->
                            <div class="mt-2.5 flex items-center gap-3">
                                <div class="flex gap-1 flex-1">
                                    <div class="flex-1 h-1 rounded-full bg-slate-100 dark:bg-neutral-700 overflow-hidden"><div id="s1" class="h-full rounded-full w-0 transition-all duration-300"></div></div>
                                    <div class="flex-1 h-1 rounded-full bg-slate-100 dark:bg-neutral-700 overflow-hidden"><div id="s2" class="h-full rounded-full w-0 transition-all duration-300"></div></div>
                                    <div class="flex-1 h-1 rounded-full bg-slate-100 dark:bg-neutral-700 overflow-hidden"><div id="s3" class="h-full rounded-full w-0 transition-all duration-300"></div></div>
                                    <div class="flex-1 h-1 rounded-full bg-slate-100 dark:bg-neutral-700 overflow-hidden"><div id="s4" class="h-full rounded-full w-0 transition-all duration-300"></div></div>
                                </div>
                                <span id="strengthLabel" class="text-xs font-semibold text-slate-400 dark:text-slate-500 w-14 text-right">—</span>
                            </div>

                            <!-- Requirements -->
                            <ul class="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5">
                                <li id="req-len"   class="flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-neutral-500"><i class="uil uil-circle req-icon text-sm"></i>8+ characters</li>
                                <li id="req-upper" class="flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-neutral-500"><i class="uil uil-circle req-icon text-sm"></i>Uppercase letter</li>
                                <li id="req-num"   class="flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-neutral-500"><i class="uil uil-circle req-icon text-sm"></i>Number</li>
                                <li id="req-sym"   class="flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-neutral-500"><i class="uil uil-circle req-icon text-sm"></i>Symbol</li>
                            </ul>
                        </div>

                        <!-- Confirm Password -->
                        <div>
                            <label class="block text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Confirm New Password</label>
                            <div class="relative">
                                <input id="confirmPass" type="password" placeholder="Repeat new password"
                                    oninput="checkMatch(); onPassChange()"
                                    class="focus-brand w-full rounded-xl px-4 py-3 pr-11 text-sm font-medium text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-neutral-700/60 border border-slate-200 dark:border-neutral-600 placeholder-slate-300 dark:placeholder-neutral-500 transition-all duration-200" />
                                <button type="button" onclick="togglePass('confirmPass', this)"
                                    class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500 hover:text-slate-600 dark:hover:text-neutral-300 transition-colors duration-150">
                                    <i class="uil uil-eye text-lg"></i>
                                </button>
                            </div>
                            <p id="matchMsg" class="hidden text-xs font-medium mt-1.5"></p>
                        </div>
                    </div>

                    <div class="flex items-center justify-between mt-6">
                        <button onclick="clearPassFields()"
                            class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-neutral-600 hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors duration-200">
                            <i class="uil uil-times-circle text-base"></i>
                            Clear
                        </button>
                        <button id="passSaveBtn" onclick="savePassword()" style="display:none"
                            class="btn-brand flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold">
                            <i class="uil uil-lock-alt text-base"></i>
                            Update Password
                        </button>
                    </div>
                </div>

                <!-- Danger Zone -->
                <div class="bg-white dark:bg-neutral-800 border border-red-100 dark:border-red-500/20 rounded-3xl p-5">
                    <div class="flex items-center justify-between gap-4">
                        <div>
                            <h3 class="font-semibold text-red-500 text-sm flex items-center gap-1.5">
                                <i class="uil uil-exclamation-triangle text-base"></i>
                                Danger Zone
                            </h3>
                            <p class="text-slate-400 dark:text-slate-500 text-xs mt-1">Permanently delete this admin account and all associated data.</p>
                        </div>
                        <button onclick="confirmDelete()"
                            class="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-red-500 border border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors duration-200">
                            <i class="uil uil-trash-alt text-sm"></i>
                            Delete Account
                        </button>
                    </div>
                </div>

            </div>
        </div>

        <!-- Toast Container -->
        <div id="toastContainer" class="fixed top-4 right-4 z-50 space-y-3 max-w-md w-full"></div>
    </main>

    <script>
        // ── Seed data from PHP ──────────────────────────────────────────
        const currentUser = {
            userId:   '<?= htmlspecialchars($user['user_id']) ?>',
            name:     '<?= htmlspecialchars($user['name'],     ENT_QUOTES) ?>',
            username: '<?= htmlspecialchars($user['username'], ENT_QUOTES) ?>',
            role:     '<?= htmlspecialchars($user['role'],     ENT_QUOTES) ?>',
        };

        // ── Avatar local preview ────────────────────────────────────────
        document.getElementById('avatarInput').addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => { document.getElementById('avatarPreview').src = ev.target.result; };
            reader.readAsDataURL(file);
        });

        // ── Live card preview (no @ anywhere) ──────────────────────────
        function updatePreview() {
            const name = document.getElementById('nameInput').value.trim();
            const user = document.getElementById('usernameInput').value.trim();
            document.getElementById('displayName').textContent     = name || currentUser.name;
            document.getElementById('displayUsername').textContent = user || currentUser.username;
        }

        // ══════════════════════════════════════════════════════════════════
        // PERSONAL INFORMATION — dirty tracking + username uniqueness
        // ══════════════════════════════════════════════════════════════════

        let usernameCheckTimer = null;
        let usernameIsValid    = true; // format valid
        let usernameIsFree     = true; // not taken

        // Show/hide Save Changes based on whether anything actually changed
        function onInfoChange() {
            updatePreview();
            const nameChanged     = document.getElementById('nameInput').value.trim()     !== currentUser.name;
            const usernameChanged = document.getElementById('usernameInput').value.trim() !== currentUser.username;
            const isDirty = nameChanged || usernameChanged;
            const saveRow = document.getElementById('infoSaveRow');
            saveRow.style.display = (isDirty && usernameIsValid && usernameIsFree) ? 'flex' : 'none';
        }

        // Debounced username uniqueness check via API
        function checkUsernameUnique(input) {
            const val = input.value.trim();

            // First check format
            if (!/^[a-zA-Z0-9_]*$/.test(val)) {
                setUsernameError('Only letters, numbers, and underscores allowed.');
                usernameIsValid = false;
                usernameIsFree  = false;
                onInfoChange();
                return;
            }
            usernameIsValid = true;

            // If unchanged from saved value, clear any errors immediately
            if (val === currentUser.username) {
                clearUsernameError();
                usernameIsFree = true;
                onInfoChange();
                return;
            }

            // Show checking indicator
            setUsernameChecking();
            clearTimeout(usernameCheckTimer);

            usernameCheckTimer = setTimeout(async () => {
                if (!val) { clearUsernameError(); onInfoChange(); return; }
                try {
                    const res  = await fetch(`api/profile/check-username.php?username=${encodeURIComponent(val)}`);
                    const data = await res.json();
                    if (data.taken) {
                        setUsernameError('That username is already taken.');
                        usernameIsFree = false;
                    } else {
                        setUsernameAvailable();
                        usernameIsFree = true;
                    }
                } catch (_) {
                    clearUsernameError(); // fail open — server will validate on save
                    usernameIsFree = true;
                }
                onInfoChange();
            }, 500);
        }

        function setUsernameError(msg) {
            const input = document.getElementById('usernameInput');
            const err   = document.getElementById('usernameError');
            const icon  = document.getElementById('usernameCheckIcon');
            input.style.borderColor = '#f87171';
            err.querySelector('span').textContent = msg;
            err.classList.remove('hidden');
            icon.innerHTML   = '';
            icon.classList.add('hidden');
        }

        function setUsernameAvailable() {
            const input = document.getElementById('usernameInput');
            const err   = document.getElementById('usernameError');
            const icon  = document.getElementById('usernameCheckIcon');
            input.style.borderColor = '#27C291';
            err.classList.add('hidden');
            icon.innerHTML   = '<i class="uil uil-check-circle text-base" style="color:#27C291"></i>';
            icon.classList.remove('hidden');
        }

        function setUsernameChecking() {
            const icon = document.getElementById('usernameCheckIcon');
            icon.innerHTML = '<i class="uil uil-spinner-alt text-base text-slate-400 animate-spin"></i>';
            icon.classList.remove('hidden');
            document.getElementById('usernameError').classList.add('hidden');
            document.getElementById('usernameInput').style.borderColor = '';
        }

        function clearUsernameError() {
            const input = document.getElementById('usernameInput');
            const err   = document.getElementById('usernameError');
            const icon  = document.getElementById('usernameCheckIcon');
            input.style.borderColor = '';
            err.classList.add('hidden');
            icon.innerHTML = '';
            icon.classList.add('hidden');
        }

        // ══════════════════════════════════════════════════════════════════
        // CHANGE PASSWORD — show Update Password only when all 3 fields filled
        // ══════════════════════════════════════════════════════════════════

        function onPassChange() {
            const cur = document.getElementById('currentPass').value;
            const np  = document.getElementById('newPass').value;
            const cp  = document.getElementById('confirmPass').value;
            const btn = document.getElementById('passSaveBtn');
            btn.style.display = (cur && np && cp) ? 'flex' : 'none';
            checkMatch();
        }

        // ── Password strength ───────────────────────────────────────────
        function checkStrength(val) {
            const ok = {
                len:   val.length >= 8,
                upper: /[A-Z]/.test(val),
                num:   /[0-9]/.test(val),
                sym:   /[^A-Za-z0-9]/.test(val),
            };
            const score  = Object.values(ok).filter(Boolean).length;
            const colors = ['#ef4444', '#f97316', '#eab308', '#27C291'];
            const labels = ['Weak', 'Fair', 'Good', 'Strong'];

            setReq('req-len',   ok.len);
            setReq('req-upper', ok.upper);
            setReq('req-num',   ok.num);
            setReq('req-sym',   ok.sym);

            ['s1','s2','s3','s4'].forEach((id, i) => {
                const el = document.getElementById(id);
                el.style.width      = i < score ? '100%' : '0%';
                el.style.background = score > 0  ? colors[score - 1] : '';
            });

            const lbl = document.getElementById('strengthLabel');
            lbl.textContent = score > 0 ? labels[score - 1] : '—';
            lbl.style.color = score > 0 ? colors[score - 1] : '';

            onPassChange();
        }

        function setReq(id, met) {
            const li   = document.getElementById(id);
            const icon = li.querySelector('.req-icon');
            li.style.color = met ? '#27C291' : '';
            icon.className = met ? 'uil uil-check-circle req-icon text-sm' : 'uil uil-circle req-icon text-sm';
        }

        // ── Confirm match ───────────────────────────────────────────────
        function checkMatch() {
            const np  = document.getElementById('newPass').value;
            const cp  = document.getElementById('confirmPass').value;
            const msg = document.getElementById('matchMsg');
            if (!cp) { msg.classList.add('hidden'); return; }
            msg.classList.remove('hidden');
            if (np === cp) {
                msg.innerHTML   = '<i class="uil uil-check-circle"></i> Passwords match';
                msg.style.color = '#27C291';
            } else {
                msg.innerHTML   = '<i class="uil uil-times-circle"></i> Passwords do not match';
                msg.style.color = '#f87171';
            }
        }

        // ── Toggle password visibility ──────────────────────────────────
        function togglePass(id, btn) {
            const input = document.getElementById(id);
            const icon  = btn.querySelector('i');
            if (input.type === 'password') {
                input.type     = 'text';
                icon.className = 'uil uil-eye-slash text-lg';
            } else {
                input.type     = 'password';
                icon.className = 'uil uil-eye text-lg';
            }
        }

        // ── Clear password fields ───────────────────────────────────────
        function clearPassFields() {
            ['currentPass', 'newPass', 'confirmPass'].forEach(id => document.getElementById(id).value = '');
            ['s1','s2','s3','s4'].forEach(id => {
                document.getElementById(id).style.width      = '0';
                document.getElementById(id).style.background = '';
            });
            document.getElementById('strengthLabel').textContent = '—';
            document.getElementById('strengthLabel').style.color = '';
            document.getElementById('matchMsg').classList.add('hidden');
            document.getElementById('passSaveBtn').style.display = 'none';
            ['req-len','req-upper','req-num','req-sym'].forEach(id => setReq(id, false));
        }

        // ══════════════════════════════════════════════════════════════════
        // SAVE HANDLERS
        // ══════════════════════════════════════════════════════════════════

        async function saveProfile() {
            const name     = document.getElementById('nameInput').value.trim();
            const username = document.getElementById('usernameInput').value.trim();

            if (!name || !username) {
                showToast('error', 'Missing Fields', 'Name and username are required.');
                return;
            }
            if (!usernameIsValid || !usernameIsFree) {
                showToast('error', 'Invalid Username', 'Fix the username before saving.');
                return;
            }

            try {
                const res  = await fetch('api/profile/update-info.php', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ name, username }),
                });
                const data = await res.json();

                if (data.success) {
                    showToast('success', 'Profile Updated', 'Your information has been saved.');
                    currentUser.name     = name;
                    currentUser.username = username;
                    clearUsernameError();
                    document.getElementById('infoSaveRow').style.display = 'none';
                } else {
                    showToast('error', 'Update Failed', data.error || 'Could not update profile.');
                }
            } catch (err) {
                console.error(err);
                showToast('error', 'Error', 'Something went wrong. Please try again.');
            }
        }

        async function savePassword() {
            const cur = document.getElementById('currentPass').value;
            const np  = document.getElementById('newPass').value;
            const cp  = document.getElementById('confirmPass').value;

            if (!cur) { showToast('error', 'Missing Field', 'Enter your current password.'); return; }
            if (!np)  { showToast('error', 'Missing Field', 'Enter a new password.'); return; }
            if (np !== cp) { showToast('error', 'Mismatch', 'New passwords do not match.'); return; }
            if (np.length < 8 || !/[A-Z]/.test(np) || !/[0-9]/.test(np)) {
                showToast('error', 'Weak Password', 'Must be 8+ chars with uppercase & a number.');
                return;
            }

            try {
                const res  = await fetch('api/profile/update-password.php', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ currentPassword: cur, newPassword: np }),
                });
                const data = await res.json();

                if (data.success) {
                    showToast('success', 'Password Changed', 'Your password has been updated.');
                    clearPassFields();
                } else {
                    showToast('error', 'Update Failed', data.error || 'Could not update password.');
                }
            } catch (err) {
                console.error(err);
                showToast('error', 'Error', 'Something went wrong. Please try again.');
            }
        }

        // ── Delete modal ────────────────────────────────────────────────
        function confirmDelete() {
            modalManager.create({
                id: 'deleteAccountModal',
                icon: 'uil-trash-alt',
                iconColor: 'text-red-500 dark:text-red-400',
                iconBg: 'bg-red-50 dark:bg-red-900/20',
                title: 'Delete Account?',
                subtitle: 'This action cannot be undone',
                showWarning: true,
                warningText: 'All admin data, settings, and access will be permanently erased from SafeChain.',
                body: `<p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    You are about to permanently delete your administrator account.
                    Once deleted, you will lose access to the SafeChain dashboard and all associated data.
                </p>`,
                primaryButton: {
                    text: 'Delete Account',
                    icon: 'uil-trash-alt',
                    class: 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700',
                },
                secondaryButton: { text: 'Cancel' },
                onPrimary: async () => {
                    showToast('error', 'Action Logged', 'Account deletion has been flagged.');
                },
            });
            modalManager.show('deleteAccountModal');
        }
    </script>

    <script src="assets/js/sidebar.js"></script>
    <script src="assets/js/toast.js"></script>
    <script src="assets/js/modal.js"></script>
</body>

</html>