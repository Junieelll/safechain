<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Safechain | Devices</title>
  <base href="../" />
  <link rel="stylesheet" href="assets/unicons/line.css" />
  <script src="assets/js/tailwind/tailwind.min.js"></script>
  <link href="assets/css/font.css" rel="stylesheet" />
  <link rel="stylesheet" href="assets/css/sidebar.css" />
  <link rel="stylesheet" href="assets/css/page-load-animation.css" />
  <link rel="icon" type="image/x-icon" href="assets/img/logo.png">
  <link rel="stylesheet" href="assets/css/toast.css" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <script>
    tailwind.config = { darkMode: ["class", '[data-theme="dark"]'] };
  </script>
</head>

<body class="min-h-screen flex transition-all duration-300 dark:bg-neutral-900">
  <?php include $_SERVER['DOCUMENT_ROOT'] . '/includes/sidebar.php'; ?>

  <main id="mainContent" class="transition-all duration-500 ease-in-out ml-[302px] flex-1 p-8 flex flex-col">
    <div>

      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-bs font-semibold text-[#4b4b4b] dark:text-neutral-400">Device Management</h1>
          <p class="text-sm text-neutral-500 dark:text-neutral-500">Monitor and manage infrastructure devices</p>
        </div>
        <!-- Add Device button -->
        <button onclick="openAddDeviceModal()"
          class="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-2xl text-xs font-medium hover:opacity-90 transition">
          <i class="uil uil-plus text-lg"></i>
          Add Device
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

        <!-- Total Devices -->
        <div
          class="bg-white dark:bg-neutral-800 rounded-2xl p-8 shadow-[0_0_24px_rgba(0,0,0,0.10)] relative overflow-hidden">
          <div class="absolute top-0 right-0 w-32 h-32 bg-emerald-50 dark:bg-emerald-900/60 rounded-full -mr-16 -mt-16">
          </div>
          <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 dark:bg-emerald-900/30">
            <i class="uil uil-processor text-2xl text-emerald-600"></i>
          </div>
          <div id="statTotal" class="text-xl md:text-2xl font-semibold text-neutral-600 dark:text-neutral-400 mb-3">—
          </div>
          <div class="text-xs md:text-sm text-neutral-600 font-medium dark:text-neutral-400">Total Devices</div>
        </div>

        <!-- Active Nodes -->
        <div
          class="bg-white dark:bg-neutral-800 rounded-2xl p-8 shadow-[0_0_24px_rgba(0,0,0,0.10)] relative overflow-hidden">
          <div class="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/60 rounded-full -mr-16 -mt-16"></div>
          <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/60 rounded-xl flex items-center justify-center mb-4">
            <i class="uil uil-mobile-android text-2xl text-blue-600"></i>
          </div>
          <div id="statNodes" class="text-xl md:text-2xl font-semibold text-neutral-600 dark:text-neutral-400 mb-3">—
          </div>
          <div class="text-xs md:text-sm text-neutral-600 font-medium dark:text-neutral-400">Node Devices</div>
        </div>

        <!-- LoRa Devices -->
        <div
          class="bg-white dark:bg-neutral-800 rounded-2xl p-8 shadow-[0_0_24px_rgba(0,0,0,0.10)] relative overflow-hidden">
          <div class="absolute top-0 right-0 w-32 h-32 bg-red-50 dark:bg-red-900/60 rounded-full -mr-16 -mt-16"></div>
          <div class="w-12 h-12 bg-red-100 dark:bg-red-900/60 rounded-xl flex items-center justify-center mb-4">
            <i class="uil uil-wifi-router text-2xl text-red-600"></i>
          </div>
          <div id="statLora" class="text-xl md:text-2xl font-semibold text-neutral-600 dark:text-neutral-400 mb-3">—
          </div>
          <div class="text-xs md:text-sm text-neutral-600 font-medium dark:text-neutral-400">LoRa Devices</div>
        </div>

        <!-- Active Gateways -->
        <div
          class="bg-white dark:bg-neutral-800 rounded-2xl p-8 shadow-[0_0_24px_rgba(0,0,0,0.10)] relative overflow-hidden">
          <div class="absolute top-0 right-0 w-32 h-32 bg-yellow-50 dark:bg-yellow-900/60 rounded-full -mr-16 -mt-16">
          </div>
          <div class="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/60 rounded-xl flex items-center justify-center mb-4">
            <i class="uil uil-bolt text-2xl text-yellow-600"></i>
          </div>
          <div id="statGateways" class="text-xl md:text-2xl font-semibold text-neutral-600 dark:text-neutral-400 mb-3">—
          </div>
          <div class="text-xs md:text-sm text-neutral-600 font-medium dark:text-neutral-400">Active Gateways</div>
        </div>

      </div>

      <!-- Search + Filter + View Toggle -->
      <div class="flex items-center justify-between mb-6 bg-white dark:bg-neutral-800 rounded-2xl p-3">
        <div class="flex gap-4 w-full">

          <!-- Search -->
          <div class="flex-1 max-w-md">
            <div class="text-xs font-medium text-gray-600 dark:text-neutral-400 mb-2">Search</div>
            <div class="relative">
              <i class="uil uil-search text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 text-xl"></i>
              <input type="text" placeholder="Search devices..."
                class="py-3 pl-9 bg-[#F1F5F9] dark:bg-neutral-700 dark:text-neutral-400 rounded-lg focus:outline-none text-sm placeholder:text-xs w-full border-2 border-transparent focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 dark:focus:ring-emerald-900/60 dark:focus:border-emerald-600 transition" />
            </div>
          </div>

          <!-- Device Type Dropdown -->
          <div class="sort flex flex-col gap-1 min-w-[250px]">
            <label class="text-xs text-gray-700 dark:text-gray-200 mb-1">Device Type</label>
            <div class="relative max-h-[46px]">
              <button id="sortDropdownButton"
                class="w-full h-full bg-[#F1F5F9] dark:bg-neutral-700 rounded-lg px-4 py-[10px] border-2 border-transparent text-left flex items-center justify-between focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 dark:focus:ring-emerald-900/60 dark:focus:border-emerald-500 transition">
                <span id="sortSelectedText" class="text-gray-700 dark:text-gray-200 text-xs">All Types</span>
                <i id="sortDropdownIcon"
                  class="uil uil-angle-down text-xl text-gray-400 dark:text-gray-200 transition-transform duration-200"></i>
              </button>
              <div id="sortDropdownMenu"
                class="hidden absolute z-10 w-full mt-2 bg-white dark:bg-neutral-700 dark:border-gray-800 border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                <div class="py-1">
                  <button
                    class="dropdown-item text-sm w-full text-left px-4 py-2.5 text-gray-700 dark:text-white/85 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-700/20 transition"
                    data-value="AllTypes">All Types</button>
                  <button
                    class="dropdown-item text-sm w-full text-left px-4 py-2.5 text-gray-700 dark:text-white/85 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-700/20 transition"
                    data-value="NodeDevice">Node Devices</button>
                  <button
                    class="dropdown-item text-sm w-full text-left px-4 py-2.5 text-gray-700 dark:text-white/85 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-700/20 transition"
                    data-value="Gateway">Gateways Only</button>
                  <button
                    class="dropdown-item text-sm w-full text-left px-4 py-2.5 text-gray-700 dark:text-white/85 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-700/20 transition"
                    data-value="Repeater">Repeaters Only</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- View toggle -->
        <div class="flex gap-2 ml-4">
          <button onclick="setViewMode('grid')" id="gridBtn"
            class="p-3 w-[50px] h-[50px] flex items-center justify-center bg-emerald-500 text-white rounded-xl hover:bg-emerald-700 transition-colors">
            <i class="uil uil-apps text-xl"></i>
          </button>
          <button onclick="setViewMode('list')" id="listBtn"
            class="p-3 w-[50px] h-[50px] flex items-center justify-center bg-[#f5f4f9] text-emerald-500 dark:bg-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-gray-50 transition-colors">
            <i class="uil uil-list-ul text-xl"></i>
          </button>
        </div>
      </div>

      <!-- Device Cards Container -->
      <div id="devicesContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>

      <div class="flex items-center justify-center gap-2 mt-6" id="devicePagination">

      </div>

      <!-- Toast -->
      <div id="toastContainer" class="fixed top-4 right-4 z-[99999] space-y-3 max-w-md w-full"></div>
  </main>

  <script src="assets/js/sidebar.js"></script>
  <script src="assets/js/toast.js"></script>
  <script src="assets/js/modal.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
  <script src="assets/js/devices.js"></script>
</body>

</html>