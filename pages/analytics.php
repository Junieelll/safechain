<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Safechain | Analytics</title>
  <base href="../" />
  <link rel="stylesheet" href="assets/unicons/line.css" />
  <script src="assets/js/tailwind/tailwind.min.js"></script>
  <link href="assets/css/font.css" rel="stylesheet" />
  <link rel="stylesheet" href="assets/css/toast.css" />
  <link rel="stylesheet" href="assets/css/sidebar.css" />
  <link rel="stylesheet" href="assets/css/page-load-animation.css" />
  <link rel="stylesheet" href="assets/css/analytics.css" />
  <script src="assets/js/chart/chart.umd.min.js"></script>
  <link rel="icon" type="image/x-icon" href="assets/img/logo.png">
  <script>
    tailwind.config = {
      darkMode: ["class", '[data-theme="dark"]'],
    };
  </script>

  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"></script>
  <script
    src="https://cdnjs.cloudflare.com/ajax/libs/leaflet-routing-machine/3.2.12/leaflet-routing-machine.min.js"></script>
</head>

<body class="min-h-screen flex transition-all duration-300 dark:bg-neutral-900">
  <?php include $_SERVER['DOCUMENT_ROOT'] . '/includes/sidebar.php'; ?>

  <main id="mainContent" class="transition-all duration-500 ease-in-out ml-[302px] flex-1 p-8 flex flex-col">
    <div class="header mb-5 flex justify-between items-center animate-target">
      <div>
        <h4 class="text-bs font-semibold text-[#4b4b4b] dark:text-neutral-100">
          Analytics and Reports
        </h4>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          Track incidents, response times, and system performance
        </p>
      </div>

      <div class="header-actions flex gap-2">
        <button class="py-2.5 px-6 bg-white dark:bg-neutral-800 flex gap-3 text-sm rounded-lg text-emerald-500 dark:text-white/80 font-medium">
          <i class="uil uil-filter"></i>
          Filters
        </button>
        <button class="py-2.5 px-6 bg-emerald-500 text-white font-medium rounded-lg text-sm flex gap-3">
          <i class="uil uil-download-alt"></i>
          Export Report
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
      <!-- Card 1 -->
      <div
        class="animate-scale-in-1 float-effect stat-card relative bg-white/95 dark:bg-neutral-800 backdrop-blur-md rounded-3xl p-8 border border-gray-200/80 dark:border-neutral-600 overflow-hidden transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-2 hover:shadow-[0_12px_32px_rgba(39,194,145,0.15)] hover:border-emerald-500/30">
        <div class="relative z-10">
          <div class="flex justify-between items-start mb-4">
            <div
              class="stat-icon w-[52px] h-[52px] rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-[0_4px_12px_rgba(39,194,145,0.3)] flex items-center justify-center text-white text-[22px] transition-all duration-300">
              <i class="uil uil-exclamation-triangle"></i>
            </div>
            <div data-badge="total" class="animate-pulse-custom flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold 
         bg-gradient-to-br from-emerald-50 to-emerald-100 dark:text-emerald-500
         dark:from-emerald-950/60 dark:to-emerald-900/40 dark:text-emerald-400 dark:border dark:border-emerald-800/30">
              <i class="uil uil-arrow-up"></i>
              12%
            </div>
          </div>
          <div class="animate-count-up text-4xl font-semibold text-[#4B4B4B] mb-2 dark:text-neutral-300"
            data-stat="total">
            247
          </div>
          <div class="text-sm text-[#5a5a5a] font-medium dark:text-neutral-400">
            Total Incidents (30 days)
          </div>
        </div>
      </div>

      <!-- Card 2 -->
      <div
        class="animate-scale-in-2 float-effect stat-card relative bg-white/95 dark:bg-neutral-800 backdrop-blur-md rounded-3xl p-8 border border-gray-200/80 dark:border-neutral-600 overflow-hidden transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-2 hover:shadow-[0_12px_32px_rgba(39,194,145,0.15)] hover:border-emerald-500/30">
        <div class="relative z-10">
          <div class="flex justify-between items-start mb-4">
            <div
              class="stat-icon w-[52px] h-[52px] rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-[0_4px_12px_rgba(33,150,243,0.3)] flex items-center justify-center text-white text-[22px] transition-all duration-300">
              <i class="uil uil-clock"></i>
            </div>
            <div data-badge="response" class="animate-pulse-custom flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold 
         bg-gradient-to-br from-red-50 to-red-100 text-red-500
         dark:from-red-950/60 dark:to-red-900/40 dark:text-red-400 dark:border dark:border-red-800/30">
              <i class="uil uil-arrow-down"></i>
              8%
            </div>
          </div>
          <div class="animate-count-up text-4xl font-semibold text-[#4B4B4B] dark:text-neutral-300 mb-2"
            data-stat="response">
            loading...
          </div>
          <div class="text-sm text-[#5a5a5a] font-medium dark:text-neutral-400">
            Avg Response Time
          </div>
        </div>
      </div>

      <!-- Card 3 -->
      <div 
        class="animate-scale-in-3 float-effect stat-card relative bg-white/95 dark:bg-neutral-800 backdrop-blur-md rounded-3xl p-8 border border-gray-200/80 dark:border-neutral-600 overflow-hidden transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-2 hover:shadow-[0_12px_32px_rgba(39,194,145,0.15)] hover:border-emerald-500/30">
        <div class="relative z-10">
          <div class="flex justify-between items-start mb-4">
            <div
              class="stat-icon w-[52px] h-[52px] rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-[0_4px_12px_rgba(39,194,145,0.3)] flex items-center justify-center text-white text-[22px] transition-all duration-300">
              <i class="uil uil-check-circle"></i>
            </div>
            <div data-badge="resolution" class="animate-pulse-custom flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold 
         bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-500
         dark:from-emerald-950/60 dark:to-emerald-900/40 dark:text-emerald-400 dark:border dark:border-emerald-800/30">
              <i class="uil uil-arrow-up"></i>
              5%
            </div>
          </div>
          <div class="animate-count-up text-4xl font-semibold text-[#4B4B4B] dark:text-neutral-300 mb-2"
            data-stat="resolution">
            98.2%
          </div>
          <div class="text-sm text-[#5a5a5a] dark:text-neutral-400 font-medium">
            Resolution Rate
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
      <!-- Incident Trends Chart -->
      <div
        class="chart-card lg:col-span-2 relative bg-white/95 dark:bg-neutral-800 backdrop-blur-md rounded-3xl p-6 border border-gray-200/80 dark:border-neutral-600 overflow-hidden transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.02] hover:shadow-[0_12px_32px_rgba(39,194,145,0.15)] hover:border-emerald-500/30">
        <div class="mb-4">
          <h3 class="font-semibold text-[#4B4B4B] dark:text-neutral-300">Incident Trends</h3>
          <p class="text-xs font-medium text-gray-500 dark:text-neutral-400">
            Daily reports over 30 days
          </p>
        </div>
        <div class="relative h-64">
          <canvas id="incidentTrendsChart"></canvas>
        </div>
      </div>

      <!-- Incident Types Chart -->
      <div
        class="chart-card relative bg-white/95 dark:bg-neutral-800 backdrop-blur-md rounded-3xl p-6 border border-gray-200/80 dark:border-neutral-600 overflow-hidden transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.02] hover:shadow-[0_12px_32px_rgba(39,194,145,0.15)] hover:border-emerald-500/30">
        <div class="mb-4">
          <h3 class="font-semibold text-[#4B4B4B] dark:text-neutral-300">Incident Types</h3>
          <p class="text-xs font-medium text-[#5a5a5a] dark:text-neutral-400">
            Distribution by category
          </p>
        </div>
        <div class="relative flex items-center justify-center">
          <canvas id="incidentTypesChart" style="max-width: 280px; max-height: 240px"></canvas>
        </div>
      </div>
    </div>

    <!-- Response Time and Peak Hours -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <!-- Response Time Chart -->
      <div
        class="chart-card relative bg-white/95 dark:bg-neutral-800 backdrop-blur-md rounded-3xl p-6 border border-gray-200/80 dark:border-neutral-600 overflow-hidden transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.02] hover:shadow-[0_12px_32px_rgba(39,194,145,0.15)] hover:border-emerald-500/30">
        <div class="mb-4">
          <h3 class="font-semibold text-[#4B4B4B] dark:text-neutral-300">Response Time</h3>
          <p class="text-xs text-[#5a5a5a] font-medium dark:text-neutral-400">Time to respond</p>
        </div>
        <div class="relative h-64">
          <canvas id="responseTimeChart"></canvas>
        </div>
      </div>

      <!-- Peak Hours Chart -->
      <div
        class="chart-card relative bg-white/95 dark:bg-neutral-800 backdrop-blur-md rounded-3xl p-6 border border-gray-200/80 dark:border-neutral-600 overflow-hidden transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.02] hover:shadow-[0_12px_32px_rgba(39,194,145,0.15)] hover:border-emerald-500/30">
        <div class="mb-4">
          <h3 class="font-semibold text-[#4B4B4B] dark:text-neutral-300">Peak Hours</h3>
          <p class="text-xs text-[#5a5a5a] font-medium dark:text-neutral-400">Incidents by hour</p>
        </div>
        <div class="relative h-64">
          <canvas id="peakHoursChart"></canvas>
        </div>
      </div>
    </div>

    <!-- Recent Emergency Incidents Table -->
    <div
      class="relative bg-white/95 dark:bg-neutral-800 backdrop-blur-md rounded-3xl p-6 border border-gray-200/80 dark:border-neutral-600 overflow-hidden transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.02] hover:shadow-[0_12px_32px_rgba(39,194,145,0.15)] hover:border-emerald-500/30">
      <div class="mb-6">
        <h3 class="font-semibold text-[#4B4B4B] dark:text-neutral-300">
          Recent Emergency Incidents
        </h3>
        <p class="text-xs font-medium text-gray-500 dark:text-neutral-400">
          Latest emergency responses in the last 24 hours
        </p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-[#F1F5F9] dark:bg-neutral-700">
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-neutral-300 uppercase">
                Incident ID
              </th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-neutral-300 uppercase">
                Type
              </th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-neutral-300 uppercase">
                Resident
              </th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-neutral-300 uppercase">
                Location
              </th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-neutral-300 uppercase">
                Time Reported
              </th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-neutral-300 uppercase">
                Response Time
              </th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-neutral-300 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td class="py-4 px-4 text-sm font-semibold text-emerald-500">
                EMG-2025-1047
              </td>
              <td class="py-4 px-4 text-sm text-gray-700">Fire</td>
              <td class="py-4 px-4 text-sm text-gray-700">Maria Santos</td>
              <td class="py-4 px-4 text-sm text-gray-700">
                63 San Nicasio St., Villaflor, Gulod, QC
              </td>
              <td class="py-4 px-4 text-sm text-gray-700">
                2025-10-10 2:34 PM
              </td>
              <td class="py-4 px-4 text-sm text-gray-700">1.8 Min</td>
              <td class="py-4 px-4">
                <span
                  class="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-600">Resolved</span>
              </td>
            </tr>
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td class="py-4 px-4 text-sm font-semibold text-emerald-500">
                EMG-2025-1047
              </td>
              <td class="py-4 px-4 text-sm text-gray-700">Fire</td>
              <td class="py-4 px-4 text-sm text-gray-700">Maria Santos</td>
              <td class="py-4 px-4 text-sm text-gray-700">
                63 San Nicasio St., Villaflor, Gulod, QC
              </td>
              <td class="py-4 px-4 text-sm text-gray-700">
                2025-10-10 2:34 PM
              </td>
              <td class="py-4 px-4 text-sm text-gray-700">1.8 Min</td>
              <td class="py-4 px-4">
                <span
                  class="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-600">Resolved</span>
              </td>
            </tr>
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td class="py-4 px-4 text-sm font-semibold text-emerald-500">
                EMG-2025-1047
              </td>
              <td class="py-4 px-4 text-sm text-gray-700">Fire</td>
              <td class="py-4 px-4 text-sm text-gray-700">Maria Santos</td>
              <td class="py-4 px-4 text-sm text-gray-700">
                63 San Nicasio St., Villaflor, Gulod, QC
              </td>
              <td class="py-4 px-4 text-sm text-gray-700">
                2025-10-10 2:34 PM
              </td>
              <td class="py-4 px-4 text-sm text-gray-700">1.8 Min</td>
              <td class="py-4 px-4">
                <span
                  class="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-600">Resolved</span>
              </td>
            </tr>
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td class="py-4 px-4 text-sm font-semibold text-emerald-500">
                EMG-2025-1047
              </td>
              <td class="py-4 px-4 text-sm text-gray-700">Fire</td>
              <td class="py-4 px-4 text-sm text-gray-700">Maria Santos</td>
              <td class="py-4 px-4 text-sm text-gray-700">
                63 San Nicasio St., Villaflor, Gulod, QC
              </td>
              <td class="py-4 px-4 text-sm text-gray-700">
                2025-10-10 2:34 PM
              </td>
              <td class="py-4 px-4 text-sm text-gray-700">1.8 Min</td>
              <td class="py-4 px-4">
                <span
                  class="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-600">Resolved</span>
              </td>
            </tr>
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td class="py-4 px-4 text-sm font-semibold text-emerald-500">
                EMG-2025-1047
              </td>
              <td class="py-4 px-4 text-sm text-gray-700">Fire</td>
              <td class="py-4 px-4 text-sm text-gray-700">Maria Santos</td>
              <td class="py-4 px-4 text-sm text-gray-700">
                63 San Nicasio St., Villaflor, Gulod, QC
              </td>
              <td class="py-4 px-4 text-sm text-gray-700">
                2025-10-10 2:34 PM
              </td>
              <td class="py-4 px-4 text-sm text-gray-700">1.8 Min</td>
              <td class="py-4 px-4">
                <span
                  class="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-600">Resolved</span>
              </td>
            </tr>
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td class="py-4 px-4 text-sm font-semibold text-emerald-500">
                EMG-2025-1047
              </td>
              <td class="py-4 px-4 text-sm text-gray-700">Fire</td>
              <td class="py-4 px-4 text-sm text-gray-700">Maria Santos</td>
              <td class="py-4 px-4 text-sm text-gray-700">
                63 San Nicasio St., Villaflor, Gulod, QC
              </td>
              <td class="py-4 px-4 text-sm text-gray-700">
                2025-10-10 2:34 PM
              </td>
              <td class="py-4 px-4 text-sm text-gray-700">1.8 Min</td>
              <td class="py-4 px-4">
                <span
                  class="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-600">Resolved</span>
              </td>
            </tr>
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td class="py-4 px-4 text-sm font-semibold text-emerald-500">
                EMG-2025-1047
              </td>
              <td class="py-4 px-4 text-sm text-gray-700">Fire</td>
              <td class="py-4 px-4 text-sm text-gray-700">Maria Santos</td>
              <td class="py-4 px-4 text-sm text-gray-700">
                63 San Nicasio St., Villaflor, Gulod, QC
              </td>
              <td class="py-4 px-4 text-sm text-gray-700">
                2025-10-10 2:34 PM
              </td>
              <td class="py-4 px-4 text-sm text-gray-700">1.8 Min</td>
              <td class="py-4 px-4">
                <span
                  class="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-600">Resolved</span>
              </td>
            </tr>
            <tr class="hover:bg-gray-50 transition-colors">
              <td class="py-4 px-4 text-sm font-semibold text-emerald-500">
                EMG-2025-1047
              </td>
              <td class="py-4 px-4 text-sm text-gray-700">Fire</td>
              <td class="py-4 px-4 text-sm text-gray-700">Maria Santos</td>
              <td class="py-4 px-4 text-sm text-gray-700">
                63 San Nicasio St., Villaflor, Gulod, QC
              </td>
              <td class="py-4 px-4 text-sm text-gray-700">
                2025-10-10 2:34 PM
              </td>
              <td class="py-4 px-4 text-sm text-gray-700">1.8 Min</td>
              <td class="py-4 px-4">
                <span
                  class="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-600">Resolved</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <!-- Toast Container -->
    <div id="toastContainer" class="fixed top-4 right-4 z-50 space-y-3 max-w-md w-full"></div>
  </main>

  <script src="assets/js/sidebar.js"></script>
  <script src="assets/js/toast.js"></script>
  <script src="assets/js/modal.js"></script>
  <script src="assets/js/analytics.js"></script>
</body>

</html>