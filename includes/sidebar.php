<?php
// includes/sidebar.php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/auth_helper.php';

// Ensure user is authenticated
if (!AuthChecker::isLoggedIn()) {
    header('Location: /auth/login.php');
    exit;
}

// Get user information using the new method names
$name = AuthChecker::getName();
$username = AuthChecker::getUsername();
$userRole = AuthChecker::getUserRole();
$userId = AuthChecker::getUserId();

// Get user initials for avatar
$initials = '';
$nameParts = explode(' ', $name);
if (count($nameParts) >= 2) {
    $initials = strtoupper(substr($nameParts[0], 0, 1) . substr($nameParts[1], 0, 1));
} else {
    $initials = strtoupper(substr($name, 0, 2));
}

// Format role for display
$roleDisplay = ucfirst($userRole);

// Define navigation structure with groups
$navStructure = [
    // Standalone items (not in any group)
    'standalone' => [
        [
            'id' => 'dashboard',
            'label' => 'Dashboard',
            'icon' => 'uil-apps',
            'url' => '/',
            'pages' => ['home.php']
        ]
    ],
    // Grouped items
    'groups' => [
        [
            'id' => 'management',
            'label' => 'Management',
            'icon' => 'uil-folder',
            'defaultOpen' => true,
            'items' => [
                [
                    'id' => 'incident',
                    'label' => 'Incident Log',
                    'icon' => 'uil-file-alt',
                    'url' => 'incident',
                    'pages' => ['incident.php']
                ],
                [
                    'id' => 'resident',
                    'label' => 'Residents',
                    'icon' => 'uil-user-circle',
                    'url' => 'resident',
                    'pages' => ['resident.php']
                ],
                [
                    'id' => 'devices',
                    'label' => 'Devices',
                    'icon' => 'uil-mobile-android',
                    'url' => 'devices',
                    'pages' => ['devices.php']
                ]
            ]
        ],
        [
            'id' => 'reports',
            'label' => 'Reports & Data',
            'icon' => 'uil-chart',
            'defaultOpen' => false,
            'items' => [
                [
                    'id' => 'analytics',
                    'label' => 'Analytics',
                    'icon' => 'uil-chart-bar',
                    'url' => 'analytics',
                    'pages' => ['analytics.php']
                ],
                [
                    'id' => 'archive',
                    'label' => 'Archive',
                    'icon' => 'uil-archive-alt',
                    'url' => 'archive',
                    'pages' => ['archive.php']
                ]
            ]
        ],
        [
            'id' => 'admin',
            'label' => 'Administration',
            'icon' => 'uil-cog',
            'defaultOpen' => false,
            'items' => [
                [
                    'id' => 'user-management',
                    'label' => 'User Management',
                    'icon' => 'uil-users-alt',
                    'url' => '/user-management',
                    'pages' => ['user-management.php']
                ],
                [
                    'id' => 'announcement',
                    'label' => 'Announcements',
                    'icon' => 'uil-megaphone',
                    'url' => '/announcements',
                    'pages' => ['announcements.php']
                ]
            ]
        ]
    ]
];

// Get current route from the router
$currentRoute = $_GET['route'] ?? 'home';

// Function to check if nav item is active
function isActiveNav($navItem, $currentRoute) {
    return $navItem['url'] === $currentRoute;
}

// Function to check if any item in group is active
function isGroupActive($group, $currentRoute) {
    foreach ($group['items'] as $item) {
        if (isActiveNav($item, $currentRoute)) {
            return true;
        }
    }
    return false;
}
?>

<aside
    id="sidebar"
    class="fixed w-[280px] m-4 rounded-[20px] sidebar-gradient h-[calc(100vh-32px)] transition-all duration-500 ease-in-out shadow-[0_10px_40px_rgba(0,0,0,0.3)] z-50">
    <header class="flex relative p-5 px-[15px] items-center justify-between">
        <a href="/" class="flex items-center gap-3 no-underline text-white">
            <div
                class="w-[50px] h-[50px] bg-white/70 rounded-2xl flex items-center justify-center backdrop-blur-[10px] border border-white/50">
                <img src="assets/img/logo.png" alt="Logo" class="p-1.5">
            </div>
            <span
                id="logoText"
                class="text-lg font-semibold whitespace-nowrap transition-opacity duration-300">SafeChain</span>
        </a>
        <button
            id="sidebarToggler"
            class="h-[35px] w-[35px] text-white cursor-pointer flex bg-white/20 backdrop-blur-[10px] border border-white/30 items-center justify-center rounded-[10px] transition-all duration-400 shadow-[0_2px_8px_rgba(0,0,0,0.1)] absolute right-5 hover:bg-white/50">
            <i
                class="uil uil-angle-left text-[1.75rem] transition-all duration-400"></i>
        </button>
    </header>

    <nav class="h-[calc(100%-86px)] flex flex-col justify-between">
        <ul
            id="primaryNav"
            class="list-none flex gap-1.5 px-[15px] flex-col translate-y-[15px] transition-all duration-500 ease-in-out overflow-y-auto scrollbar-hide max-h-[calc(100vh-250px)]">
            
            <?php /* Standalone Items */ ?>
            <?php foreach ($navStructure['standalone'] as $item): ?>
                <li class="relative nav-item text-sm">
                    <a
                        href="<?php echo htmlspecialchars($item['url']); ?>"
                        class="nav-link text-white/85 flex gap-3.5 whitespace-nowrap rounded-xl py-3 px-3.5 items-center border border-transparent transition-all duration-200 ease-in-out hover:text-white hover:bg-white/15 <?php echo isActiveNav($item, $currentRoute) ? 'active' : ''; ?>">
                        <i class="nav-icon uil <?php echo htmlspecialchars($item['icon']); ?> text-xl"></i>
                        <span class="nav-label"><?php echo htmlspecialchars($item['label']); ?></span>
                    </a>
                    <span
                        class="nav-tooltip py-2 px-3.5 rounded-xl whitespace-nowrap bg-white shadow-[0_4px_15px_rgba(0,0,0,0.2)] font-medium text-sm text-[#01AF78] z-[9999]"><?php echo htmlspecialchars($item['label']); ?></span>
                </li>
            <?php endforeach; ?>

            <?php /* Grouped Items */ ?>
            <?php foreach ($navStructure['groups'] as $group): ?>
                <?php 
                $groupActive = isGroupActive($group, $currentRoute);
                $defaultOpen = $group['defaultOpen'] || $groupActive;
                ?>
                <li class="relative nav-group text-sm">
                    <button
                        class="nav-group-toggle w-full text-white/85 flex gap-3.5 whitespace-nowrap rounded-xl py-3 px-3.5 items-center border border-transparent transition-all duration-200 ease-in-out hover:text-white hover:bg-white/15 cursor-pointer bg-transparent"
                        data-group="<?php echo htmlspecialchars($group['id']); ?>"
                        data-default-open="<?php echo $defaultOpen ? 'true' : 'false'; ?>">
                        <i class="nav-icon uil <?php echo htmlspecialchars($group['icon']); ?> text-xl"></i>
                        <span class="nav-label flex-1 text-left"><?php echo htmlspecialchars($group['label']); ?></span>
                        <i class="uil uil-angle-down group-arrow text-lg transition-transform duration-300"></i>
                    </button>
                    <span
                        class="nav-tooltip py-2 px-3.5 rounded-xl whitespace-nowrap bg-white shadow-[0_4px_15px_rgba(0,0,0,0.2)] font-medium text-sm text-[#01AF78] z-[9999]"><?php echo htmlspecialchars($group['label']); ?></span>
                    
                    <ul class="nav-group-items list-none ml-0 overflow-hidden transition-all duration-300" style="max-height: 0;">
                        <?php foreach ($group['items'] as $item): ?>
                            <li class="relative nav-item text-sm pb-2">
                                <a
                                    href="<?php echo htmlspecialchars($item['url']); ?>"
                                    class="nav-link text-white/75 flex gap-3.5 whitespace-nowrap rounded-xl py-2.5 px-3.5 ml-8 items-center border border-transparent transition-all duration-200 ease-in-out hover:text-white hover:bg-white/15 <?php echo isActiveNav($item, $currentRoute) ? 'active' : ''; ?>">
                                    <i class="nav-icon uil <?php echo htmlspecialchars($item['icon']); ?> text-lg"></i>
                                    <span class="nav-label text-sm"><?php echo htmlspecialchars($item['label']); ?></span>
                                </a>
                                <span
                                    class="nav-tooltip py-2 px-3.5 rounded-xl whitespace-nowrap bg-white shadow-[0_4px_15px_rgba(0,0,0,0.2)] font-medium text-sm text-[#01AF78] z-[9999]"><?php echo htmlspecialchars($item['label']); ?></span>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                </li>
            <?php endforeach; ?>
        </ul>

        <ul class="list-none flex gap-1.5 px-[15px] flex-col relative pb-5">
            <li class="relative nav-item text-sm mt-2">
                <a
                    href="#"
                    id="darkModeToggle"
                    class="nav-link text-white/85 flex gap-3.5 whitespace-nowrap rounded-xl py-3 px-3.5 items-center no-underline border border-transparent transition-all duration-200 ease-in-out hover:text-white hover:bg-white/15">
                    <i id="darkModeIcon" class="nav-icon uil uil-moon text-xl"></i>
                    <span id="darkModeLabel" class="nav-label">Dark Mode</span>
                </a>
                <span
                    class="nav-tooltip py-2 px-3.5 rounded-xl whitespace-nowrap bg-white shadow-[0_4px_15px_rgba(0,0,0,0.2)] font-medium text-sm text-[#01AF78] z-[9999]">Dark Mode</span>
            </li>
            <li class="relative">
                <button
                    id="userProfileBtn"
                    class="w-full flex items-center gap-3 py-3 px-3.5 mb-0 rounded-xl text-white no-underline transition-all duration-300 hover:bg-white/15 border-0 cursor-pointer bg-transparent">
                    <div
                        class="w-[38px] h-[38px] rounded-full avatar-gradient flex items-center justify-center flex-shrink-0 font-semibold text-[0.95rem] border-2 border-white/30">
                        <?php echo htmlspecialchars($initials); ?>
                    </div>
                    <div
                        id="userInfo"
                        class="flex flex-col transition-opacity duration-300 text-left">
                        <span class="font-semibold text-[0.95rem]"><?php echo htmlspecialchars($name); ?></span>
                        <span class="text-xs bg-white text-emerald-400 w-max py-1 px-3 rounded-full font-medium"><?php echo htmlspecialchars($username); ?></span>
                    </div>
                </button>

                <div
                    id="userDropdown"
                    class="hidden absolute bottom-full left-0 mb-2 w-[240px] bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.25)] overflow-hidden z-50">
                    <a
                        href="profile.php"
                        class="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors duration-200 no-underline">
                        <i class="uil uil-user text-xl text-[#01AF78]"></i>
                        <span class="text-sm font-medium">My Profile</span>
                    </a>
                    <a
                        href="settings.php"
                        class="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors duration-200 no-underline">
                        <i class="uil uil-setting text-xl text-[#01AF78]"></i>
                        <span class="text-sm font-medium">Settings</span>
                    </a>
                    <a
                        href="support.php"
                        class="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors duration-200 no-underline">
                        <i class="uil uil-question-circle text-xl text-[#01AF78]"></i>
                        <span class="text-sm font-medium">Help & Support</span>
                    </a>
                    <div class="border-t border-gray-200"></div>
                    <a
                        href="/pages/auth/logout.php"
                        class="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors duration-200 no-underline"
                        >
                        <i class="uil uil-signout text-xl"></i>
                        <span class="text-sm font-medium">Logout</span>
                    </a>
                </div>
            </li>
        </ul>
    </nav>
</aside>