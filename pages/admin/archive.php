<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SafeChain | Archive</title>
  <base href="/safechain/" />
  <link rel="stylesheet" href="assets/unicons/line.css" />
  <script src="assets/js/tailwind/tailwind.min.js"></script>
  <link href="assets/css/font.css" rel="stylesheet" />
  <!-- Sample -->
  <link rel="stylesheet" href="assets/css/sidebar.css" />
  <link rel="stylesheet" href="assets/css/toast.css" />
  <link rel="stylesheet" href="assets/css/archive.css" />
  <link rel="stylesheet" href="assets/css/page-load-animation.css" />
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
    class="transition-all duration-500 ease-in-out ml-[302px] flex-1 p-8">
    <div class="header flex items-center justify-between mb-5">
      <div class="title">
        <h4 class="text-bs font-semibold text-[#4b4b4b] dark:text-gray-200">Archive</h4>
        <p class="text-sm text-neutral-500 dark:text-gray-400">
          Access and restore archived items.
        </p>
      </div>
    </div>

    <div class="w-full">
      <!-- Tabs Section -->
      <div class="rounded-lg mb-4">
        <div class="flex border-b dark:border-neutral-700 relative">
          <!-- Animated tab indicator -->
          <div id="tabIndicator" class="tab-indicator bg-[#414141] dark:bg-neutral-600"></div>

          <button
            class="tab-btn px-6 py-3 text-sm font-medium transition-all"
            data-tab="all">
            All Items
            <span class="ml-2 px-2 py-0.5 text-xs rounded-full tab-count">6</span>
          </button>
          <button
            class="tab-btn px-6 py-3 text-sm font-medium transition-all"
            data-tab="incidents">
            Incidents
            <span class="ml-2 px-2 py-0.5 text-xs rounded-full tab-count">2</span>
          </button>
          <button
            class="tab-btn px-6 py-3 text-sm font-medium transition-all"
            data-tab="users">
            Users
            <span class="ml-2 px-2 py-0.5 text-xs rounded-full tab-count">2</span>
          </button>
          <button
            class="tab-btn px-6 py-3 text-sm font-medium transition-all"
            data-tab="devices">
            Devices
            <span class="ml-2 px-2 py-0.5 text-xs rounded-full tab-count">2</span>
          </button>
        </div>
      </div>

      <!-- Filter Controls Section -->
      <div class="bg-white dark:bg-neutral-800 rounded-xl flex justify-between mb-4">
        <div class="p-4 flex gap-4 items-center">
          <!-- Search -->
          <div class="search flex flex-col gap-1 min-w-[400px]">
            <div class="search-input relative w-full">
              <i
                class="uil uil-search dark:text-neutral-400 absolute top-1/2 -translate-y-1/2 left-2 text-xl"></i>
              <input
                type="text"
                name="search"
                id="search"
                autocomplete="off"
                placeholder="Search incidents..."
                class="py-3 pl-9 pr-5 bg-[#F1F5F9] dark:bg-neutral-700 dark:text-neutral-300 rounded-lg focus:outline-none text-sm placeholder:text-xs w-full border-2 border-transparent focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 dark:focus:ring-emerald-900/60 dark:focus:border-emerald-600 transition" />
            </div>
          </div>
        </div>
        <div class="action flex gap-4 p-4">
          <button
            id="restoreAllBtn"
            class="px-4 py-2 border border-[#D4D9E0] text-xs text-gray-600 dark:text-neutral-300 dark:hover:bg-neutral-700 font-medium rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors">
            <i class="uil uil-sync text-lg text-gray-600 dark:text-neutral-300"></i>
            Restore All
          </button>
          <button
            id="deleteAllBtn"
            class="px-4 py-2 font-medium bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 flex items-center gap-2 transition-colors">
            <i class="uil uil-trash-alt text-lg"></i>
            Empty Archive
          </button>
        </div>
      </div>

      <!-- Items List Section -->
      <div id="itemsContainer" class="bg-white dark:bg-neutral-800 rounded-xl p-4">
        <!-- Items Header -->
        <div
          class="px-5 py-3 flex items-center gap-3 bg-[#F1F5F9] dark:bg-neutral-700">
          <h3 class="text-xs font-semibold text-gray-700 dark:text-neutral-300">Archived Items</h3>
          <label class="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              id="selectAll"
              class="w-5 h-5 appearance-none border-2 border-gray-300 rounded-md checked:bg-[#01AF78] checked:border-[#01AF78] focus:ring-2 focus:ring-emerald-100 focus:ring-offset-0 transition-all cursor-pointer bg-[length:10px_10px] bg-center bg-no-repeat checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOSIgdmlld0JveD0iMCAwIDEyIDkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgNEw0LjUgNy41TDExIDEiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')]" />
            <span
              class="text-xs text-gray-600 dark:text-neutral-300 group-hover:text-gray-900  group-hover:text-neutral-400 transition-colors">Select All</span>
          </label>
        </div>

        <!-- Items List -->
        <div id="itemsList" class="divide-y dark:divide-white/10">
          <!-- Items will be rendered here -->
        </div>
      </div>

      <!-- Action Bar -->
      <div
        id="actionBar"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-neutral-700 rounded-full shadow-2xl p-3 pl-5 flex items-center gap-4 hidden slide-up z-50">
        <span class="text-white text-sm font-medium"><span id="selectedCount">0</span> items selected</span>
        <button
          id="restoreBtn"
          class="px-4 py-2.5 bg-white text-sm text-gray-900 rounded-full hover:bg-gray-100 flex items-center gap-2 transition-all transform hover:scale-105">
          <i class="uil uil-redo"></i>
          Restore
        </button>
        <button
          id="deleteBtn"
          class="px-4 py-2.5 bg-red-500 text-sm text-white rounded-full hover:bg-red-600 flex items-center gap-2 transition-all transform hover:scale-105">
          <i class="uil uil-trash-alt"></i>
          Delete Permanently
        </button>
      </div>
    </div>
    <div
      id="toastContainer"
      class="fixed top-4 right-4 z-50 space-y-3 max-w-md w-full"></div>
  </main>

  <script src="assets/js/sidebar.js"></script>
  <script src="assets/js/toast.js"></script>
  <script src="assets/js/modal.js"></script>
  <script src="assets/js/archive.js"></script>
</body>

</html>