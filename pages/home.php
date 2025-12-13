<?php
// pages/home.php (or index.php)
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../includes/auth_helper.php';

// Check if user is logged in
if (!AuthChecker::isLoggedIn()) {
    header('Location: /safechain/auth/login.php');
    exit;
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SafeChain | Dashboard</title>
    <base href="/safechain/">
    <link rel="stylesheet" href="assets/unicons/line.css" />
    <link rel="stylesheet" href="assets/css/leaflet/leaflet.css" />
    <script src="assets/js/tailwind/tailwind.min.js"></script>
    <link href="assets/css/font.css" rel="stylesheet" />
    <link rel="stylesheet" href="assets/css/dashboard.css" />
    <link rel="stylesheet" href="assets/css/toast.css" />
    <link rel="stylesheet" href="assets/css/transitions.css" />
    <link rel="icon" type="image/x-icon" href="assets/img/logo.png">
    <script>
        tailwind.config = {
            darkMode: ["class", '[data-theme="dark"]'],
        };
    </script>
</head>

<body class="min-h-screen flex transition-all duration-300 dark:bg-neutral-900">

    <?php include $_SERVER['DOCUMENT_ROOT'] . '/safechain/includes/sidebar.php'; ?>

    <main
        id="mainContent"
        class="transition-all duration-500 ease-in-out ml-[302px] mr-[360px] flex-1 p-8">
        <div class="left-panel w-full">
            <div class="header flex flex-col items-end">
                <h1 class="text-sm font-medium mb-1 dark:text-white/90">
                    Brgy. Gulod, Novaliches, QC
                </h1>
                <p class="text-black/70 text-xs dark:text-white/70">
                    Friday, October 18, 2025, 3:42:52 PM
                </p>
            </div>

            <div class="border border-white dark:border-neutral-800 rounded-2xl mt-4 relative">
                <div id="map" class="rounded-2xl"></div>
                <div class="map-controls flex flex-col gap-3">
                    <div class="zoom-controls flex flex-col gap-0.5 overflow-hidden p-0.5">
                        <button
                            class="map-btn flex items-center justify-center dark:border-gray-600"
                            id="zoomIn"
                            title="Zoom in">
                            <i class="uil uil-plus"></i>
                        </button>
                        <button
                            class="map-btn flex items-center justify-center dark:border-gray-600"
                            id="zoomOut"
                            title="Zoom out">
                            <i class="uil uil-minus"></i>
                        </button>
                    </div>

                    <div class="filter-controls flex flex-col items-center text-white gap-0.5 rounded-[50px] py-1.5 dark:border-gray-600">
                        <button
                            class="filter-btn active flex items-center justify-center"
                            id="filterFire"
                            title="Fire Incidents"
                            data-filter="fire">
                            <i class="uil uil-fire"></i>
                        </button>
                        <button
                            class="filter-btn active flex items-center justify-center"
                            id="filterCrime"
                            title="Crime Incidents"
                            data-filter="crime">
                            <i class="uil uil-shield-plus"></i>
                        </button>
                        <button
                            class="filter-btn active flex items-center justify-center"
                            id="filterFlood"
                            title="Flood Incidents"
                            data-filter="flood">
                            <i class="uil uil-cloud-showers-heavy"></i>
                        </button>
                    </div>

                    <button
                        class="map-btn rounded-full w-12 h-12 text-2xl flex items-center justify-center dark:border-gray-600"
                        id="locate"
                        title="My location">
                        <i class="uil uil-crosshairs"></i>
                    </button>
                    <div class="border-t border-white/20 my-1 w-8 mx-auto"></div>

                    <div class="heatmap-controls flex flex-col items-center gap-3 relative">
                        <button
                            class="map-btn rounded-full w-12 h-12 text-2xl flex items-center justify-center dark:border-gray-600 transition-all"
                            id="heatmapMenuToggle"
                            title="Heatmap Controls">
                            <i class="uil uil-ellipsis-h"></i>
                        </button>

                        <div
                            id="heatmapControlsContainer"
                            class="heatmap-controls-container hidden flex-col gap-0.5 rounded-xl p-2 dark:border-neutral-400">
                            <p class="font-medium text-nowrap text-xs text-neutral-600 dark:text-neutral-200 p-2">TOGGLE HEATMAP</p>
                            <button
                                class="filter-btn active flex items-center px-2 py-1 rounded-lg dark:text-neutral-200"
                                id="toggleFireHeatmap"
                                title="Fire Heatmap"
                                data-heatmap="fire">
                                <i class="uil uil-fire"></i>
                                <span class="heatmap-btn-text">Fire</span>
                            </button>
                            <button
                                class="filter-btn active flex items-center px-2 py-1 rounded-lg"
                                id="toggleCrimeHeatmap"
                                title="Crime Heatmap"
                                data-heatmap="crime">
                                <i class="uil uil-shield-plus"></i>
                                <span class="heatmap-btn-text">Crime</span>
                            </button>
                            <button
                                class="filter-btn active flex items-center px-2 py-1 rounded-lg"
                                id="toggleFloodHeatmap"
                                title="Flood Heatmap"
                                data-heatmap="flood">
                                <i class="uil uil-water"></i>
                                <span class="heatmap-btn-text">Flood</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="chart mt-4 py-4 w-full">
                <div class="header flex items-center justify-between mb-4">
                    <p class="text-black/50 font-medium text-sm flex gap-3 items-center dark:text-white/85">
                        <i class="uil uil-chart-line text-xl dark:text-white/85"></i>
                        Emergency Histogram
                    </p>

                    <div class="relative">
                        <button
                            id="yearDropdownBtn"
                            class="bg-white dark:bg-neutral-800 dark:border-neutral-700 dark:text-gray-400 border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-700 cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#01af78] focus:border-transparent transition-all flex items-center gap-2 min-w-[100px]">
                            <i class="uil uil-calendar-alt"></i>
                            <span id="selectedYear">2024</span>
                            <i
                                id="yearDropdownIcon"
                                class="uil uil-angle-down dark:text-gray-400 absolute right-3 text-gray-600 transition-transform duration-200"></i>
                        </button>

                        <div
                            id="yearDropdownMenu"
                            class="hidden absolute top-full right-0 mt-2 w-full bg-white dark:bg-neutral-800 dark:border-gray-600 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.15)] overflow-hidden z-50 border border-gray-200">
                            <div
                                class="year-option px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300/80 hover:bg-gray-100 dark:hover:bg-emerald-700/20 cursor-pointer transition-colors active bg-[#01af78]/10 font-medium"
                                data-year="2024">
                                2024
                            </div>
                            <div
                                class="year-option px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300/80 hover:bg-gray-100 dark:hover:bg-emerald-700/20 cursor-pointer transition-colors"
                                data-year="2023">
                                2023
                            </div>
                            <div
                                class="year-option px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300/80 hover:bg-gray-100 dark:hover:bg-emerald-700/20 cursor-pointer transition-colors"
                                data-year="2022">
                                2022
                            </div>
                            <div
                                class="year-option px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300/80 hover:bg-gray-100 dark:hover:bg-emerald-700/20 cursor-pointer transition-colors"
                                data-year="2021">
                                2021
                            </div>
                        </div>
                    </div>
                </div>

                <div class="chart-wrapper rounded-2xl p-5 bg-white dark:bg-neutral-800">
                    <canvas id="emergencyChart"></canvas>
                </div>
            </div>
        </div>
    </main>

    <aside
        id="rightPanel"
        class="fixed right-0 top-0 w-[360px] h-screen bg-white dark:bg-neutral-800 backdrop-blur-lg p-6 transition-all duration-500 ease-in-out flex flex-col z-40">
        <div class="flex items-center justify-between mb-6 flex-shrink-0">
            <h2 class="text-base font-semibold text-[#27C291] dark:text-emerald-600">
                Emergency Details
            </h2>
            <button
                id="rightPanelToggle"
                class="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors dark:bg-neutral-700 dark:border-gray-700 dark:text-gray-300">
                <i class="uil uil-angle-right text-xl text-gray-600 dark:text-gray-300"></i>
            </button>
        </div>

        <div class="flex-1 overflow-y-auto pr-2 -mr-2">
            <div id="incidentContent"></div>
        </div>

        <div class="flex-shrink-0 pt-4">
            <button
                onclick="window.location='admin/incidents/details';"
                class="w-full bg-white border border-gray-300 text-[#64748B] rounded-xl py-3 px-4 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800">
                <i class="uil uil-eye dark:text-gray-300"></i>
                View More Details
            </button>
        </div>
    </aside>

    <!-- Toast Container -->
    <div id="toastContainer" class="fixed top-4 right-4 z-50 space-y-3 max-w-md w-full"></div>

    <script src="assets/js/leaflet/leaflet.js"></script>
    <script src="assets/js/leaflet/leaflet-heat.js"></script>
    <script src="assets/js/chart/chart.umd.min.js"></script>

    <script src="assets/js/sidebar.js"></script>
    <script src="assets/js/toast.js"></script>
    <script src="assets/js/dashboard.js"></script>
</body>

</html>