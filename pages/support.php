<?php
// pages/support.php
if (session_status() === PHP_SESSION_NONE)
    session_start();

require_once $_SERVER['DOCUMENT_ROOT'] . '/includes/auth_helper.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/config/conn.php';

if (!AuthChecker::isLoggedIn()) {
    header('Location: /auth/login');
    exit;
}

$userRole = AuthChecker::getUserRole();
$userName = AuthChecker::getName();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SafeChain | Help & Support</title>
    <base href="../" />
    <link rel="stylesheet" href="assets/unicons/line.css" />
    <script src="assets/js/tailwind/tailwind.min.js"></script>
    <link href="assets/css/font.css" rel="stylesheet" />
    <link rel="stylesheet" href="assets/css/sidebar.css" />
    <link rel="stylesheet" href="assets/css/page-load-animation.css" />
    <link rel="stylesheet" href="assets/css/toast.css" />
    <link rel="icon" type="image/x-icon" href="assets/img/logo.png">
    <script>
        tailwind.config = { darkMode: ["class", '[data-theme="dark"]'] };
    </script>
    <style>
        .brand { color: #27C291; }
        .search-wrap:focus-within { box-shadow: 0 0 0 3px rgba(39,194,145,0.25); }
        .cat-card { transition: transform .2s, box-shadow .2s; }
        .cat-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.08); }
        .dark .cat-card:hover { box-shadow: 0 12px 32px rgba(0,0,0,0.35); }
        .faq-answer { max-height: 0; overflow: hidden; transition: max-height .35s ease; }
        .faq-item.open .faq-answer { max-height: 600px; }
        .faq-item.open .faq-arrow { transform: rotate(180deg); }
        .faq-arrow { transition: transform .3s; }
        .step-badge {
            background: linear-gradient(135deg,#27C291,#1da878);
            color: #fff; width: 28px; height: 28px;
            border-radius: 50%; display: flex; align-items: center;
            justify-content: center; font-size: .75rem; font-weight: 700; flex-shrink: 0;
        }
        .tip-box { border-left: 3px solid #27C291; background: rgba(39,194,145,.07); }
        .dark .tip-box { background: rgba(39,194,145,.1); }
        .warn-box { border-left: 3px solid #f97316; background: rgba(249,115,22,.07); }
        .dark .warn-box { background: rgba(249,115,22,.1); }
        .tag { background: rgba(39,194,145,.12); color: #27C291; }
        .dark .tag { background: rgba(39,194,145,.18); }
        html { scroll-behavior: smooth; }
        .section-nav-btn.active {
            background: rgba(39,194,145,.12); color: #27C291; font-weight: 600;
        }
        .dark .section-nav-btn.active { background: rgba(39,194,145,.18); }
    </style>
</head>

<body class="min-h-screen flex transition-all duration-300 dark:bg-neutral-900">
    <?php include $_SERVER['DOCUMENT_ROOT'] . '/includes/sidebar.php'; ?>

    <main id="mainContent" class="transition-all duration-500 ease-in-out ml-[302px] flex-1 p-8 pb-16">

        <!-- Page Header -->
        <div class="mb-8">
            <p class="text-xs text-slate-400 dark:text-slate-500 font-medium mb-1 flex items-center gap-1.5">
                <span>Admin</span>
                <i class="uil uil-angle-right text-sm"></i>
                <span>Help & Support</span>
            </p>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Help & Support</h1>
            <p class="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Everything you need to manage SafeChain effectively.</p>
        </div>

        <!-- Search -->
        <div class="search-wrap flex items-center gap-3 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-2xl px-5 py-3.5 mb-8 transition-all duration-200">
            <i class="uil uil-search text-xl text-slate-400 dark:text-slate-500 flex-shrink-0"></i>
            <input id="globalSearch" type="text" placeholder="Search for topics, features, or questions…"
                class="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-neutral-500 outline-none" />
            <kbd class="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-400 dark:text-neutral-500 border border-slate-200 dark:border-neutral-600">
                <span>⌘</span><span>K</span>
            </kbd>
        </div>

        <!-- Quick Category Cards -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <?php
            $cats = [
                ['icon'=>'uil-apps',          'label'=>'Getting Started', 'section'=>'getting-started', 'color'=>'text-emerald-500', 'bg'=>'bg-emerald-50 dark:bg-emerald-900/20'],
                ['icon'=>'uil-fire',           'label'=>'Incidents',       'section'=>'incidents',        'color'=>'text-orange-500',  'bg'=>'bg-orange-50 dark:bg-orange-900/20'],
                ['icon'=>'uil-users-alt',      'label'=>'Residents',       'section'=>'residents',        'color'=>'text-blue-500',    'bg'=>'bg-blue-50 dark:bg-blue-900/20'],
                ['icon'=>'uil-mobile-android', 'label'=>'Devices',         'section'=>'devices',          'color'=>'text-purple-500',  'bg'=>'bg-purple-50 dark:bg-purple-900/20'],
                ['icon'=>'uil-megaphone',      'label'=>'Announcements',   'section'=>'announcements',    'color'=>'text-pink-500',    'bg'=>'bg-pink-50 dark:bg-pink-900/20'],
                ['icon'=>'uil-chart-bar',      'label'=>'Analytics',       'section'=>'analytics',        'color'=>'text-indigo-500',  'bg'=>'bg-indigo-50 dark:bg-indigo-900/20'],
            ];
            foreach ($cats as $cat): ?>
            <button onclick="scrollToSection('<?= $cat['section'] ?>')"
                class="cat-card <?= $cat['bg'] ?> border border-slate-200 dark:border-neutral-700 rounded-2xl p-4 flex flex-col items-center gap-2 text-center cursor-pointer">
                <div class="w-10 h-10 bg-white dark:bg-neutral-800 rounded-xl flex items-center justify-center shadow-sm">
                    <i class="uil <?= $cat['icon'] ?> text-xl <?= $cat['color'] ?>"></i>
                </div>
                <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-tight"><?= $cat['label'] ?></span>
            </button>
            <?php endforeach; ?>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">

            <!-- Sticky section nav -->
            <div class="xl:col-span-1">
                <div class="bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-3xl p-4 sticky top-6">
                    <p class="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 px-2">On This Page</p>
                    <nav class="flex flex-col gap-1" id="sectionNav">
                        <?php
                        $sections = [
                            'getting-started' => 'Getting Started',
                            'system-overview' => 'System Overview',
                            'incidents'       => 'Managing Incidents',
                            'residents'       => 'Residents',
                            'devices'         => 'SafeChain Device',
                            'announcements'   => 'Announcements',
                            'analytics'       => 'Analytics & Reports',
                            'account'         => 'Account & Security',
                            'faq'             => 'FAQ',
                        ];
                        foreach ($sections as $id => $label): ?>
                        <button onclick="scrollToSection('<?= $id ?>')"
                            class="section-nav-btn text-left px-3 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors duration-150"
                            data-section="<?= $id ?>">
                            <?= $label ?>
                        </button>
                        <?php endforeach; ?>
                    </nav>
                </div>
            </div>

            <!-- Content -->
            <div class="xl:col-span-3 flex flex-col gap-6" id="helpContent">

                <!-- ════ GETTING STARTED ════ -->
                <section id="getting-started" class="help-section bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-3xl p-6">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center">
                            <i class="uil uil-apps text-xl text-emerald-500"></i>
                        </div>
                        <div>
                            <h2 class="font-bold text-slate-900 dark:text-slate-100 text-base">Getting Started</h2>
                            <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Welcome to the SafeChain Admin Web App</p>
                        </div>
                    </div>

                    <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
                        SafeChain is a community emergency response platform designed for barangay-level disaster and crime management. The system consists of three components that work together: the <strong class="text-slate-700 dark:text-slate-300">Admin Web App</strong> (this dashboard), the <strong class="text-slate-700 dark:text-slate-300">Responder Mobile App</strong>, and the <strong class="text-slate-700 dark:text-slate-300">SafeChain LoRa Device</strong>.
                    </p>

                    <div class="tip-box rounded-2xl p-4 mb-5">
                        <p class="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-1">
                            <i class="uil uil-desktop brand"></i> Admin-Only Access
                        </p>
                        <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Only administrators can access this web dashboard. Responders (BPSO, BHERT, Firefighters) use the SafeChain mobile app on their phones. Residents do not have a dashboard — they interact with the system through the compact LoRa device.
                        </p>
                    </div>

                    <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">Role Permissions</h3>
                    <div class="overflow-hidden rounded-2xl border border-slate-200 dark:border-neutral-700 mb-2">
                        <table class="w-full text-xs">
                            <thead>
                                <tr class="bg-slate-50 dark:bg-neutral-700/60">
                                    <th class="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Role</th>
                                    <th class="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Platform</th>
                                    <th class="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Incident Types</th>
                                    <th class="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Web App</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100 dark:divide-neutral-700">
                                <?php
                                $roles = [
                                    ['Admin',       'Web App',    'All types',       'Full access'],
                                    ['BPSO',        'Mobile App', 'Crime',           'No access'],
                                    ['BHERT',       'Mobile App', 'Flood & Fire',    'No access'],
                                    ['Firefighter', 'Mobile App', 'Fire & Flood',    'No access'],
                                ];
                                foreach ($roles as $r): ?>
                                <tr class="hover:bg-slate-50 dark:hover:bg-neutral-700/40 transition-colors">
                                    <td class="px-4 py-3 font-medium text-slate-700 dark:text-slate-300"><?= $r[0] ?></td>
                                    <td class="px-4 py-3 text-slate-500 dark:text-slate-400"><?= $r[1] ?></td>
                                    <td class="px-4 py-3 text-slate-500 dark:text-slate-400"><?= $r[2] ?></td>
                                    <td class="px-4 py-3 text-slate-500 dark:text-slate-400"><?= $r[3] ?></td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </section>

                <!-- ════ SYSTEM OVERVIEW ════ -->
                <section id="system-overview" class="help-section bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-3xl p-6">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-10 h-10 bg-slate-100 dark:bg-neutral-700 rounded-xl flex items-center justify-center">
                            <i class="uil uil-sitemap text-xl text-slate-500"></i>
                        </div>
                        <div>
                            <h2 class="font-bold text-slate-900 dark:text-slate-100 text-base">System Overview</h2>
                            <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">How the three components work together</p>
                        </div>
                    </div>

                    <div class="flex flex-col gap-3 mb-5">
                        <?php
                        $components = [
                            ['uil-keyhole-circle', 'text-emerald-500', 'bg-emerald-50 dark:bg-emerald-900/20',
                             'SafeChain LoRa Device (Resident)',
                             'A compact keychain-sized device with 3 emergency buttons — one for Fire, one for Flood, and one for Crime. When a resident presses a button, the device sends a LoRa signal with their registered location and the incident type. No smartphone required.'],
                            ['uil-mobile-android', 'text-blue-500', 'bg-blue-50 dark:bg-blue-900/20',
                             'Responder Mobile App',
                             'Used by BPSO, BHERT, and Firefighters. Each responder only sees incidents relevant to their role. They can accept, respond, update the status, and submit the incident report — all from their phone.'],
                            ['uil-desktop', 'text-purple-500', 'bg-purple-50 dark:bg-purple-900/20',
                             'Admin Web Dashboard (This App)',
                             'Used exclusively by administrators. Admins monitor all incidents in real-time, manage residents and devices, broadcast announcements, view analytics, and manage user accounts. Admins can also force-resolve incidents when necessary.'],
                        ];
                        foreach ($components as $c): ?>
                        <div class="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-neutral-700/50 border border-slate-100 dark:border-neutral-700">
                            <div class="w-10 h-10 <?= $c[2] ?> rounded-xl flex items-center justify-center flex-shrink-0">
                                <i class="uil <?= $c[0] ?> text-xl <?= $c[1] ?>"></i>
                            </div>
                            <div>
                                <p class="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1"><?= $c[3] ?></p>
                                <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed"><?= $c[4] ?></p>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>

                    <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">Dashboard Features (Admin Web App)</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <?php
                        $overview = [
                            ['uil-map-marker',   'Live Incident Map',    'Real-time map with incident markers and a heatmap overlay showing concentration of incidents per area.'],
                            ['uil-map', 'Heatmap', 'The heatmap visualizes areas with a high concentration of incidents by using color intensity, helping identify hotspots and patterns of activity.'],
                            ['uil-chart-line', 'Incident Histogram', 'A monthly chart showing the number of reported emergencies by type, including fire, flood, and crime, to help monitor incident patterns throughout the year.'],
                            ['uil-list-ol-alt', 'Emergency List', 'Displays the latest reported emergencies with key details such as status, time reported, and reporter information, linked to their location on the map.'],
                        ];
                        foreach ($overview as $o): ?>
                        <div class="flex gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-700/50 border border-slate-100 dark:border-neutral-700">
                            <div class="w-8 h-8 rounded-lg bg-white dark:bg-neutral-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                                <i class="uil <?= $o[0] ?> text-base brand"></i>
                            </div>
                            <div>
                                <p class="text-xs font-semibold text-slate-800 dark:text-slate-200"><?= $o[1] ?></p>
                                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed"><?= $o[2] ?></p>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </section>

                <!-- ════ INCIDENTS ════ -->
                <section id="incidents" class="help-section bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-3xl p-6">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
                            <i class="uil uil-fire text-xl text-orange-500"></i>
                        </div>
                        <div>
                            <h2 class="font-bold text-slate-900 dark:text-slate-100 text-base">Managing Incidents</h2>
                            <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Monitor, oversee, and force-resolve emergencies</p>
                        </div>
                    </div>

                    <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">Incident Types & Responders</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                        <?php
                        $types = [
                            ['uil-fire',             'text-red-500',    'bg-red-50 dark:bg-red-900/20',    'Fire',  'Firefighters & BHERT receive fire incidents in their mobile app.'],
                            ['uil-water',            'text-blue-500',   'bg-blue-50 dark:bg-blue-900/20',  'Flood', 'BHERT & Firefighters receive flood incidents.'],
                            ['uil-shield-exclamation','text-yellow-500','bg-yellow-50 dark:bg-yellow-900/20','Crime','BPSO officers receive crime incidents exclusively.'],
                        ];
                        foreach ($types as $t): ?>
                        <div class="p-4 rounded-2xl <?= $t[2] ?> border border-slate-200 dark:border-neutral-700 text-center">
                            <i class="uil <?= $t[0] ?> text-2xl <?= $t[1] ?> mb-2 block"></i>
                            <p class="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1"><?= $t[3] ?></p>
                            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed"><?= $t[4] ?></p>
                        </div>
                        <?php endforeach; ?>
                    </div>

                    <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">Incident Lifecycle</h3>
                    <div class="flex flex-col gap-3 mb-5">
                        <?php
                        $steps = [
                            ['Resident Triggers Alert',
                             'The resident presses one of the 3 buttons on their SafeChain LoRa device. The signal is sent with their registered location and incident type. A new incident appears in the Incident Log as <strong>Pending</strong>.'],
                            ['Responder Receives Notification',
                             'The relevant responders (based on incident type) receive a push notification on their mobile app. Each responder sees only incidents matching their role.'],
                            ['Responder Accepts & Responds',
                             'The responder taps "Respond" in their mobile app. The incident status changes to <strong>Responding</strong>. The admin can see this update in real-time on the web dashboard.'],
                            ['Responder Updates Status',
                             'Only the assigned responder can update the incident status from their mobile app. The admin monitors progress but cannot change the status under normal circumstances.'],
                            ['Responder Submits Report',
                             'After resolving the situation, the responder fills out and submits the incident report from the mobile app — including description, casualties, injuries, actions taken, and resolution status.'],
                            ['Admin Reviews & Generates Report',
                             'Once the responder submits a report, the admin can view it and generate a formal report from the web dashboard. Admins cannot generate a report until the responder has submitted one.'],
                        ];
                        foreach ($steps as $i => $s): ?>
                        <div class="flex gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-neutral-700/50 border border-slate-100 dark:border-neutral-700">
                            <div class="step-badge mt-0.5"><?= $i+1 ?></div>
                            <div>
                                <p class="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-0.5"><?= $s[0] ?></p>
                                <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed"><?= $s[1] ?></p>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>

                    <div class="warn-box rounded-2xl p-4 mb-4">
                        <p class="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-1">
                            <i class="uil uil-clock-eight text-orange-500"></i> Force Resolve (Admin Only)
                        </p>
                        <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            If an incident has been in <strong>Responding</strong> status for <strong>6 hours or more</strong> without being resolved, an admin can force-resolve it. This is intended for situations where the responder's phone died, was destroyed, or communication was lost. The force-resolve action is logged in the incident timeline with the admin's name and reason.
                        </p>
                    </div>

                    <div class="tip-box rounded-2xl p-4">
                        <p class="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-1">
                            <i class="uil uil-lightbulb-alt brand"></i> Admin Role in Incidents
                        </p>
                        <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            As admin, your primary role in incident management is <strong>oversight</strong> — not direct response. You monitor status, add internal notes, manage evidence, and step in only when a force-resolve is needed. All field actions are handled by responders via the mobile app.
                        </p>
                    </div>
                </section>

                <!-- ════ RESIDENTS ════ -->
                <section id="residents" class="help-section bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-3xl p-6">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                            <i class="uil uil-users-alt text-xl text-blue-500"></i>
                        </div>
                        <div>
                            <h2 class="font-bold text-slate-900 dark:text-slate-100 text-base">Residents</h2>
                            <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Community members registered in SafeChain</p>
                        </div>
                    </div>

                    <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
                        Residents are the end users of the SafeChain system. They do not use a smartphone app — they interact with SafeChain exclusively through their compact LoRa device. Residents are registered by an admin and linked to a device.
                    </p>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                        <?php
                        $residentActions = [
                            ['uil-user-plus',     'Register Resident',   'Add a new resident with their name, address, contact number, and optional medical conditions. Assign a SafeChain device to them during registration.'],
                            ['uil-edit',          'Edit Information',    'Update a resident\'s address, contact number, or medical conditions. Medical info is shown to responders during an incident.'],
                            ['uil-mobile-android','Linked Device',       'Each resident is linked to one SafeChain LoRa device. The device ID is displayed in their profile. One device per resident.'],
                            ['uil-archive-alt',   'Archive Resident',    'Archiving hides a resident from the active list without deleting their data. Useful when a resident moves away or returns the device.'],
                        ];
                        foreach ($residentActions as $a): ?>
                        <div class="flex gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-700/50 border border-slate-100 dark:border-neutral-700">
                            <div class="w-8 h-8 rounded-lg bg-white dark:bg-neutral-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                                <i class="uil <?= $a[0] ?> text-base brand"></i>
                            </div>
                            <div>
                                <p class="text-xs font-semibold text-slate-800 dark:text-slate-200"><?= $a[1] ?></p>
                                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed"><?= $a[2] ?></p>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>

                    <div class="tip-box rounded-2xl p-4">
                        <p class="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-1">
                            <i class="uil uil-heart-medical brand"></i> Medical Conditions
                        </p>
                        <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Medical conditions (e.g., Asthma, Heart Disease, Visually Impaired) are prominently shown to responders when they receive an incident from that resident. This helps responders prepare the right equipment and approach before arriving on scene.
                        </p>
                    </div>
                </section>

                <!-- ════ DEVICES ════ -->
                <section id="devices" class="help-section bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-3xl p-6">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                            <i class="uil uil-mobile-android text-xl text-purple-500"></i>
                        </div>
                        <div>
                            <h2 class="font-bold text-slate-900 dark:text-slate-100 text-base">SafeChain Device</h2>
                            <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">The compact LoRa emergency keychain</p>
                        </div>
                    </div>

                    <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
                        The SafeChain device is a small, compact LoRa-enabled keychain device distributed to registered residents. It has <strong class="text-slate-700 dark:text-slate-300">3 physical buttons</strong>, each mapped to a specific emergency type. It does not require Wi-Fi or a mobile data connection — it communicates over LoRa (Long Range) radio.
                    </p>

                    <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">Button Mapping</h3>
                    <div class="grid grid-cols-3 gap-3 mb-5">
                        <div class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-2xl text-center">
                            <i class="uil uil-fire text-2xl text-red-500 mb-2 block"></i>
                            <p class="text-xs font-bold text-slate-800 dark:text-slate-200">Button 1</p>
                            <p class="text-xs text-red-500 font-semibold">Fire</p>
                        </div>
                        <div class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-2xl text-center">
                            <i class="uil uil-water text-2xl text-blue-500 mb-2 block"></i>
                            <p class="text-xs font-bold text-slate-800 dark:text-slate-200">Button 2</p>
                            <p class="text-xs text-blue-500 font-semibold">Flood</p>
                        </div>
                        <div class="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 rounded-2xl text-center">
                            <i class="uil uil-shield-exclamation text-2xl text-yellow-500 mb-2 block"></i>
                            <p class="text-xs font-bold text-slate-800 dark:text-slate-200">Button 3</p>
                            <p class="text-xs text-yellow-600 font-semibold">Crime</p>
                        </div>
                    </div>

                    <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">Device Management</h3>
                    <div class="flex flex-col gap-3 mb-5">
                        <?php
                        $deviceTasks = [
                            ['uil-plus-circle',  'Register a Device',  'Go to Devices → Add Device. Enter the device name, Bluetooth remote ID, and link it to a resident account.'],
                            ['uil-battery-bolt', 'Monitor Battery',    'Battery levels are synced and displayed on each device card. Devices with low battery should be recharged and returned to the resident.'],
                            ['uil-link-broken',  'Unlink a Device',    'You can reassign a device to a different resident or clear the resident link from the device detail page.'],
                            ['uil-tag-alt',      'Device ID Format',   'Device IDs follow the format SC-KC-XXX (e.g., SC-KC-001). These IDs appear in incident records to identify which device triggered the alert.'],
                        ];
                        foreach ($deviceTasks as $t): ?>
                        <div class="flex gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-neutral-700/50 border border-slate-100 dark:border-neutral-700">
                            <div class="w-8 h-8 rounded-lg bg-white dark:bg-neutral-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                                <i class="uil <?= $t[0] ?> text-base brand"></i>
                            </div>
                            <div>
                                <p class="text-xs font-semibold text-slate-800 dark:text-slate-200"><?= $t[1] ?></p>
                                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed"><?= $t[2] ?></p>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </section>

                <!-- ════ ANNOUNCEMENTS ════ -->
                <section id="announcements" class="help-section bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-3xl p-6">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-10 h-10 bg-pink-50 dark:bg-pink-900/20 rounded-xl flex items-center justify-center">
                            <i class="uil uil-megaphone text-xl text-pink-500"></i>
                        </div>
                        <div>
                            <h2 class="font-bold text-slate-900 dark:text-slate-100 text-base">Announcements</h2>
                            <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Broadcast messages to residents via the mobile feed</p>
                        </div>
                    </div>

                    <div class="flex flex-col gap-3 mb-5">
                        <?php
                        $annSteps = [
                            ['Create an Announcement', 'Go to Announcements → New Announcement. Write your message content and optionally add an external link.'],
                            ['Attach Media',           'You can attach up to 7 images per announcement. Supported formats: JPG, PNG, and other standard image types.'],
                            ['Publish',                'Once published, the announcement is pushed to all residents who have the SafeChain app installed. It also appears in the in-app announcement feed.'],
                            ['Track Views',            'Each announcement card shows a view count — the number of residents who have opened and seen it.'],
                        ];
                        foreach ($annSteps as $i => $s): ?>
                        <div class="flex gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-neutral-700/50 border border-slate-100 dark:border-neutral-700">
                            <div class="step-badge mt-0.5"><?= $i+1 ?></div>
                            <div>
                                <p class="text-xs font-semibold text-slate-800 dark:text-slate-200"><?= $s[0] ?></p>
                                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed"><?= $s[1] ?></p>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </section>

                <!-- ════ ANALYTICS ════ -->
                <section id="analytics" class="help-section bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-3xl p-6">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center">
                            <i class="uil uil-chart-bar text-xl text-indigo-500"></i>
                        </div>
                        <div>
                            <h2 class="font-bold text-slate-900 dark:text-slate-100 text-base">Analytics & Reports</h2>
                            <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Understand trends and generate official reports</p>
                        </div>
                    </div>

                    <div class="tip-box rounded-2xl p-4 mb-5">
                        <p class="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-1">
                            <i class="uil uil-map brand"></i> Heatmap is on the Dashboard
                        </p>
                        <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            The incident heatmap and live incident markers on the map are located on the <strong>Dashboard</strong>, not in Analytics. The Analytics page focuses on historical data, trends, and reports.
                        </p>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                        <?php
                        $analytics = [
                            ['uil-chart-line',    'Incident Trends',
                             'Line charts showing the number of incidents over time. Filter by incident type (fire, flood, crime) and custom date ranges to spot patterns.'],
                            ['uil-stopwatch',     'Response Time',
                             'Average time from when an incident is reported to when a responder accepts it. Broken down per incident type and time period to evaluate team performance.'],
                            ['uil-clock-three',   'Peak Hours',
                             'Bar chart showing which hours of the day have the highest incident frequency — useful for scheduling responder duty hours.'],
                            ['uil-file-download', 'Export Reports',
                             'Generate and download formal incident reports as PDF or CSV. Reports are only available once a responder has submitted their field report for that incident.'],
                        ];
                        foreach ($analytics as $a): ?>
                        <div class="flex gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-700/50 border border-slate-100 dark:border-neutral-700">
                            <div class="w-8 h-8 rounded-lg bg-white dark:bg-neutral-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                                <i class="uil <?= $a[0] ?> text-base brand"></i>
                            </div>
                            <div>
                                <p class="text-xs font-semibold text-slate-800 dark:text-slate-200"><?= $a[1] ?></p>
                                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed"><?= $a[2] ?></p>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>

                    <div class="warn-box rounded-2xl p-4">
                        <p class="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-1">
                            <i class="uil uil-exclamation-triangle text-orange-500"></i> Report Generation Requirement
                        </p>
                        <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            You can only generate an official report for an incident <strong>after the assigned responder has submitted their field report</strong> through the mobile app. If no report has been submitted, the export option will be unavailable for that incident.
                        </p>
                    </div>
                </section>

                <!-- ════ ACCOUNT ════ -->
                <section id="account" class="help-section bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-3xl p-6">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-10 h-10 bg-slate-100 dark:bg-neutral-700 rounded-xl flex items-center justify-center">
                            <i class="uil uil-shield-check text-xl text-slate-500"></i>
                        </div>
                        <div>
                            <h2 class="font-bold text-slate-900 dark:text-slate-100 text-base">Account & Security</h2>
                            <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Keep your admin account safe and up to date</p>
                        </div>
                    </div>

                    <div class="flex flex-col gap-3 mb-5">
                        <?php
                        $accountItems = [
                            ['uil-user-circle',  'Update Profile',     'Go to Profile Settings to change your display name, username, and profile picture.'],
                            ['uil-lock-alt',     'Change Password',    'Use a strong password: 8+ characters, an uppercase letter, a number, and a symbol. Update it regularly to keep your account secure.'],
                            ['uil-image-upload', 'Profile Picture',    'Click the avatar on the Profile page to upload a photo. A crop tool will appear so you can frame it before saving. Images are saved as 400×400 JPEG.'],
                            ['uil-signout',      'Logging Out',        'Use the Logout option in the sidebar user menu. Your JWT session token will be invalidated.'],
                            ['uil-users-alt',    'User Management',    'As admin, you can create, suspend, or delete responder accounts from the User Management page. You can also invalidate another user\'s session tokens.'],
                            ['uil-trash-alt',    'Delete Account',     'Account deletion is permanent and requires password confirmation. All data tied to your account will be permanently removed.'],
                        ];
                        foreach ($accountItems as $a): ?>
                        <div class="flex gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-neutral-700/50 border border-slate-100 dark:border-neutral-700">
                            <div class="w-8 h-8 rounded-lg bg-white dark:bg-neutral-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                                <i class="uil <?= $a[0] ?> text-base brand"></i>
                            </div>
                            <div>
                                <p class="text-xs font-semibold text-slate-800 dark:text-slate-200"><?= $a[1] ?></p>
                                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed"><?= $a[2] ?></p>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>

                    <div class="tip-box rounded-2xl p-4">
                        <p class="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-1">
                            <i class="uil uil-info-circle brand"></i> Session Tokens
                        </p>
                        <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            JWT tokens expire after 30 days. If you suspect unauthorized access to an account, go to User Management and invalidate that user's session tokens — this forces a logout on all their active devices immediately.
                        </p>
                    </div>
                </section>

                <!-- ════ FAQ ════ -->
                <section id="faq" class="help-section bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-3xl p-6">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center">
                            <i class="uil uil-question-circle text-xl brand"></i>
                        </div>
                        <div>
                            <h2 class="font-bold text-slate-900 dark:text-slate-100 text-base">Frequently Asked Questions</h2>
                            <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Quick answers to common questions</p>
                        </div>
                    </div>

                    <div class="flex flex-col gap-2" id="faqList">
                        <?php
                        $faqs = [
                            
                            ['Can the admin change an incident status directly?',
                             'No — under normal circumstances, only the assigned responder can update incident status through the mobile app. The admin can only use Force Resolve, which is available after an incident has been in Responding status for 6 hours or more.'],
                            ['Can I generate a report before the responder submits theirs?',
                             'No. Report generation is only unlocked after the responding officer submits their field report via the mobile app. This ensures reports contain accurate field data.'],
                            ['What happens if a resident presses the wrong button?',
                             'The incident will still be created. You can add an internal note on the incident to flag it. The responder can also indicate this in their field report. There is no automatic cancellation from the device.'],
                            ['Can one SafeChain device be linked to multiple residents?',
                             'No. Each device is linked to exactly one resident. If you need to reassign a device, unlink it from the current resident first, then assign it to the new one.'],
                            ['Why can a responder only see certain incidents?',
                             'Incident visibility in the mobile app is role-based. Firefighters see Fire and Flood incidents. BHERT sees Flood and Fire. BPSO sees Crime only. This prevents alert fatigue and ensures the right responders are notified.'],
                            ['What does Force Resolve log in the system?',
                             'The Force Resolve action is recorded in the incident timeline with the admin\'s name, the timestamp, and the reason entered at the time of force-resolving. This ensures full accountability.'],
                            ['How are incident IDs generated?',
                             'Incident IDs follow the format EMG-YYYY-XXXX (e.g., EMG-2026-1001). The year reflects when the incident was created, and the number increments sequentially across all incident types.'],
                            ['What image formats are supported for profile pictures?',
                             'JPEG, PNG, WebP, GIF, and JFIF are all accepted. Images are cropped using an interactive crop tool and saved as 400×400 JPEG before being stored.'],
                        ];
                        foreach ($faqs as $i => $faq): ?>
                        <div class="faq-item border border-slate-200 dark:border-neutral-700 rounded-2xl overflow-hidden" data-faq="<?= $i ?>">
                            <button onclick="toggleFaq(<?= $i ?>)"
                                class="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-neutral-700/50 transition-colors duration-150">
                                <span class="text-sm font-medium text-slate-800 dark:text-slate-200"><?= $faq[0] ?></span>
                                <i class="uil uil-angle-down faq-arrow text-xl text-slate-400 dark:text-slate-500 flex-shrink-0"></i>
                            </button>
                            <div class="faq-answer">
                                <p class="px-5 pb-4 text-sm text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-neutral-700 pt-3">
                                    <?= $faq[1] ?>
                                </p>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </section>

                <!-- Contact -->
                <section class="bg-gradient-to-br from-[#27C291]/10 to-emerald-50 dark:from-[#27C291]/10 dark:to-neutral-800 border border-[#27C291]/20 rounded-3xl p-6">
                    <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                        <div>
                            <h2 class="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                                <i class="uil uil-envelope brand"></i> Still need help?
                            </h2>
                            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                Can't find what you're looking for? Reach out to the SafeChain development team.
                            </p>
                        </div>
                        <a href="mailto:support@safechain.site"
                            class="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                            style="background:#27C291;">
                            <i class="uil uil-envelope text-base"></i>
                            Contact Support
                        </a>
                    </div>
                </section>

            </div>
        </div>

        <div id="toastContainer" class="fixed top-4 right-4 z-50 space-y-3 max-w-md w-full"></div>
    </main>

    <script>
        function toggleFaq(index) {
            const item = document.querySelector(`.faq-item[data-faq="${index}"]`);
            if (!item) return;
            const isOpen = item.classList.contains('open');
            document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
            if (!isOpen) item.classList.add('open');
        }

        function scrollToSection(id) {
            const el = document.getElementById(id);
            if (!el) return;
            const top = el.getBoundingClientRect().top + window.scrollY - 24;
            window.scrollTo({ top, behavior: 'smooth' });
        }

        // Active section highlight
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    document.querySelectorAll('.section-nav-btn').forEach(btn => btn.classList.remove('active'));
                    const active = document.querySelector(`.section-nav-btn[data-section="${entry.target.id}"]`);
                    if (active) active.classList.add('active');
                }
            });
        }, { rootMargin: '-30% 0px -60% 0px' });

        document.querySelectorAll('.help-section, #faq').forEach(s => observer.observe(s));

        // Search
        document.getElementById('globalSearch').addEventListener('input', function () {
            const q = this.value.trim().toLowerCase();
            if (!q) {
                document.querySelectorAll('.help-section, #faq').forEach(s => s.style.display = '');
                document.querySelectorAll('.faq-item').forEach(f => f.style.display = '');
                return;
            }
            document.querySelectorAll('.faq-item').forEach(item => {
                item.style.display = item.textContent.toLowerCase().includes(q) ? '' : 'none';
            });
            document.querySelectorAll('.help-section, #faq').forEach(section => {
                section.style.display = section.textContent.toLowerCase().includes(q) ? '' : 'none';
            });
        });

        document.addEventListener('keydown', function (e) {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('globalSearch').focus();
            }
        });
    </script>

    <script src="assets/js/sidebar.js"></script>
    <script src="assets/js/toast.js"></script>
    <script src="assets/js/modal.js"></script>
</body>
</html>