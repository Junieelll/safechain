<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SafeChain | Residents</title>
  <base href="/safechain/" />
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
</head>

<body class="min-h-screen flex transition-all duration-300 dark:bg-neutral-900">
  <?php include $_SERVER['DOCUMENT_ROOT'] . '/safechain/includes/sidebar.php'; ?>

  <main
    id="mainContent"
    class="transition-all duration-500 ease-in-out ml-[302px] flex-1 p-8">
    <div class="header mb-5 animate-target">
      <h4 class="text-bs font-semibold text-[#4b4b4b] dark:text-neutral-100">Manage Residents</h4>
      <p class="text-sm text-neutral-500 dark:text-neutral-400">
        Manage Registered barangay residents
      </p>
    </div>

    <!-- Stats Widget -->
    <div class="bg-white dark:bg-neutral-800 rounded-2xl p-6 py-8 mb-6 animate-target">
      <div class="grid grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700">
        <!-- Total Residents -->
        <div class="flex items-center gap-4 px-8">
          <div
            class="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/60 rounded-xl flex items-center justify-center flex-shrink-0">
            <i class="uil uil-users-alt text-2xl text-emerald-500 dark:bg-text-100"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span
                class="text-2xl font-semibold text-gray-800 dark:text-gray-200"
                id="totalCount"><i class="uil uil-ellipsis-h"></i></span>
              <i class="uil uil-arrow-growth text-sm text-emerald-500 dark:bg-text-100"></i>
            </div>
            <p class="text-xs text-gray-500 mt-1 font-medium dark:text-gray-300">
              Total Residents
            </p>
          </div>
        </div>

        <!-- Registered This Month -->
        <div class="flex items-center gap-4 px-8">
          <div
            class="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/60 rounded-xl flex items-center justify-center flex-shrink-0">
            <i class="uil uil-calendar-alt text-2xl text-emerald-500"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span
                class="text-2xl font-semibold text-gray-800 dark:text-gray-200"
                id="registeredCount"><i class="uil uil-ellipsis-h"></i></span>
              <i class="uil uil-arrow-growth text-sm text-emerald-500 dark:bg-text-100"></i>
            </div>
            <p class="text-xs text-gray-500 mt-1 font-medium dark:text-gray-300">
              Registered This Month
            </p>
          </div>
        </div>

        <!-- Last Registration -->
        <div class="flex items-center gap-4 px-8">
          <div
            class="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/60 rounded-xl flex items-center justify-center flex-shrink-0">
            <i class="uil uil-clock text-2xl text-emerald-500"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span
                class="text-2xl font-semibold text-gray-800 dark:text-gray-200"
                id="lastHourCount"><i class="uil uil-ellipsis-h"></i></span>
            </div>
            <p class="text-xs text-gray-500 mt-1 font-medium dark:text-gray-300">
              Last Registration
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Residents Table Section -->
    <section class="residents animate-target">
      <div class="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm overflow-hidden p-5">
        <!-- Filter Control -->
        <div class="flex justify-between items-center mb-7 gap-4">
          <!-- Search -->
          <div class="search flex flex-col gap-1 w-full max-w-[400px]">
            <label for="search" class="text-xs text-gray-700 dark:text-gray-200">Search</label>
            <div class="search-input relative w-full">
              <i
                class="uil uil-search dark:text-gray-200 absolute top-1/2 -translate-y-1/2 left-2 text-xl"></i>
              <input
                type="text"
                name="search"
                id="search"
                autocomplete="off"
                placeholder="Search incidents..."
                class="py-3 pl-9 bg-[#F1F5F9] dark:bg-neutral-700 dark:text-gray-200 rounded-lg focus:outline-none text-sm placeholder:text-xs w-full border-2 border-transparent focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 dark:focus:ring-emerald-900/60 dark:focus:border-emerald-500  transition" />
            </div>
          </div>

          <div class="right-control flex gap-5">
            <!-- Sort By -->
            <div class="sort flex flex-col gap-1 min-w-[250px]">
              <label for="sort" class="text-xs text-gray-700 dark:text-gray-200">Sort By</label>
              <div class="relative max-h-[46px]">
                <!-- Dropdown Button -->
                <button
                  id="sortDropdownButton"
                  class="w-full h-full bg-[#F1F5F9] dark:bg-neutral-700 rounded-lg px-4 py-[10px] border-2 border-transparent text-left flex items-center justify-between focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 dark:focus:ring-emerald-900/60 dark:focus:border-emerald-500 transition">
                  <span id="sortSelectedText" class="text-gray-700 dark:text-gray-200 text-xs">Newest First</span>
                  <i
                    id="sortDropdownIcon"
                    class="uil uil-angle-down text-xl text-gray-400 dark:text-gray-200 transition-transform duration-200"></i>
                </button>

                <!-- Dropdown Menu -->
                <div
                  id="sortDropdownMenu"
                  class="hidden absolute z-10 w-full mt-2 bg-white dark:bg-neutral-700 dark:border-gray-800 border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  <div class="py-1">
                    <button
                      class="dropdown-item text-sm w-full text-left px-4 py-2.5 text-gray-700 dark:text-white/85 dark:hover:bg-emerald-700/20 hover:bg-emerald-50 hover:text-emerald-600 transition"
                      data-value="newest">
                      Newest First
                    </button>
                    <button
                      class="dropdown-item text-sm w-full text-left px-4 py-2.5 text-gray-700 dark:text-white/85 dark:hover:bg-emerald-700/20 hover:bg-emerald-50 hover:text-emerald-600 transition"
                      data-value="oldest">
                      Oldest First
                    </button>
                    <button
                      class="dropdown-item text-sm w-full text-left px-4 py-2.5 text-gray-700 dark:text-white/85 dark:hover:bg-emerald-700/20 hover:bg-emerald-50 hover:text-emerald-600 transition"
                      data-value="ascending">
                      Name (A-Z)
                    </button>
                    <button
                      class="dropdown-item text-sm w-full text-left px-4 py-2.5 text-gray-700 dark:text-white/85 dark:hover:bg-emerald-700/20 hover:bg-emerald-50 hover:text-emerald-600 transition"
                      data-value="descending">
                      Name (Z-A)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="clear-filter-btn flex flex-col justify-end">
              <button
                id="exportBtn"
                class="py-2 px-4 font-medium flex gap-2 items-center whitespace-nowrap border border-[#01AF78] rounded-lg text-[#01AF78] text-xs hover:bg-emerald-50 dark:hover:bg-emerald-900/60 transition ease-in-out duration-200">
                <i class="uil uil-download-alt text-lg"></i>Export
              </button>
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto max-h-[450px]">
          <table class="w-full">
            <thead class="bg-[#F1F5F9] dark:bg-neutral-700">
              <tr>
                <th
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                  Resident Name
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                  User ID
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                  Address
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase dark:text-gray-200 tracking-wider">
                  Contact No.
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase dark:text-gray-200 tracking-wider">
                  Device ID
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase dark:text-gray-200 tracking-wider">
                  Registered Date
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase dark:text-gray-200 tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <!-- Table Row will appear here dynamically-->
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-center gap-2 mt-6">

        </div>
      </div>
    </section>

    <!-- Toast Container -->
    <div
      id="toastContainer"
      class="fixed top-4 right-4 z-50 space-y-3 max-w-md w-full"></div>
  </main>

  <script src="assets/js/sidebar.js"></script>
  <script src="assets/js/toast.js"></script>
  <script src="assets/js/modal.js"></script>
  <script src="assets/js/resident.js"></script>
</body>

</html>