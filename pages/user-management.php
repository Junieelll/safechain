<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SafeChain | Users</title>
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
</head>

<body class="min-h-screen flex transition-all duration-300 dark:bg-neutral-900">
    <?php include $_SERVER['DOCUMENT_ROOT'] . '/includes/sidebar.php'; ?>

    <main
        id="mainContent"
        class="transition-all duration-500 ease-in-out ml-[302px] flex-1 p-8">
        <div class="header flex items-center justify-between mb-5 animate-target">
            <div class="title">
                <h4
                    class="text-bs font-semibold text-[#4b4b4b] dark:text-neutral-400">
                    User Account Management
                </h4>
                <p class="text-sm text-neutral-500 dark:text-neutral-500">
                    Manage and monitor user accounts
                </p>
            </div>
            <button
                class="py-2.5 px-5 flex gap-2 flex justify-center items-center font-medium bg-emerald-500 text-white text-xs rounded-2xl hover:bg-emerald-600 transition-all ease-in-out duration-200 focus:ring-4 focus:ring-emerald-100">
                <i class="uil uil-user-plus text-lg"></i>
                Create Account
            </button>
        </div>

        <!-- Residents Table Section -->
        <section class="residents animate-target">
            <div class="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm overflow-hidden p-5 min-h-[600px]">
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
                                placeholder="Search users..."
                                class="py-3 pl-9 bg-[#F1F5F9] dark:bg-neutral-700 dark:text-gray-200 rounded-lg focus:outline-none text-sm placeholder:text-xs w-full border-2 border-transparent focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 dark:focus:ring-emerald-900/60 dark:focus:border-emerald-500  transition" />
                        </div>
                    </div>

                    <div class="right-control flex gap-5">
                        <!-- Role -->
                        <div class="sort flex flex-col gap-1 min-w-[250px]">
                            <label for="sort" class="text-xs text-gray-700 dark:text-gray-200">Role</label>
                            <div class="relative max-h-[46px]">
                                <!-- Dropdown Button -->
                                <button
                                    id="sortDropdownButton"
                                    class="w-full h-full bg-[#F1F5F9] dark:bg-neutral-700 rounded-lg px-4 py-[10px] border-2 border-transparent text-left flex items-center justify-between focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 dark:focus:ring-emerald-900/60 dark:focus:border-emerald-500 transition">
                                    <span id="sortSelectedText" class="text-gray-700 dark:text-gray-200 text-xs">All Roles</span>
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
                                            data-value="allRoles">
                                            All Roles
                                        </button>
                                        <button
                                            class="dropdown-item text-sm w-full text-left px-4 py-2.5 text-gray-700 dark:text-white/85 dark:hover:bg-emerald-700/20 hover:bg-emerald-50 hover:text-emerald-600 transition"
                                            data-value="bpso">
                                            BPSO
                                        </button>
                                        <button
                                            class="dropdown-item text-sm w-full text-left px-4 py-2.5 text-gray-700 dark:text-white/85 dark:hover:bg-emerald-700/20 hover:bg-emerald-50 hover:text-emerald-600 transition"
                                            data-value="admin">
                                            ADMIN
                                        </button>
                                        <button
                                            class="dropdown-item text-sm w-full text-left px-4 py-2.5 text-gray-700 dark:text-white/85 dark:hover:bg-emerald-700/20 hover:bg-emerald-50 hover:text-emerald-600 transition"
                                            data-value="bdrrm">
                                            BDRRM
                                        </button>
                                        <button
                                            class="dropdown-item text-sm w-full text-left px-4 py-2.5 text-gray-700 dark:text-white/85 dark:hover:bg-emerald-700/20 hover:bg-emerald-50 hover:text-emerald-600 transition"
                                            data-value="bfp">
                                            BFP
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Status Dropdown -->
                        <div class="status flex flex-col gap-1 w-full">
                            <label
                                for="status"
                                class="text-xs text-gray-700 dark:text-white/85">Status</label>
                            <div class="relative max-h-[46px] min-w-[150px]">
                                <button
                                    id="statusDropdownButton"
                                    class="w-full h-full bg-[#F1F5F9] dark:bg-neutral-700 rounded-lg px-4 py-[10px] text-left flex items-center justify-between focus:outline-none border-2 border-transparent focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 dark:focus:ring-emerald-900/60 dark:focus:border-emerald-600 transition">
                                    <span
                                        id="statusSelectedText"
                                        class="text-gray-700 text-xs dark:text-white/85">All Status</span>
                                    <i
                                        id="statusDropdownIcon"
                                        class="uil uil-angle-down text-xl text-gray-400 transition-transform duration-200"></i>
                                </button>

                                <div
                                    id="statusDropdownMenu"
                                    class="hidden absolute z-10 w-full mt-2 bg-white dark:bg-neutral-700 dark:border-gray-800 border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                                    <div class="py-1">
                                        <button
                                            class="dropdown-item dark:hover:bg-emerald-700/20 w-full text-sm text-left px-4 py-2.5 text-gray-700 dark:text-white/85 hover:bg-emerald-50 hover:text-emerald-600 transition"
                                            data-value="allStatuses">
                                            All Status
                                        </button>
                                        <button
                                            class="dropdown-item dark:hover:bg-emerald-700/20 w-full text-sm text-left px-4 py-2.5 text-gray-700 dark:text-white/85 hover:bg-emerald-50 hover:text-emerald-600 transition"
                                            data-value="active">
                                            Active
                                        </button>
                                        <button
                                            class="dropdown-item dark:hover:bg-emerald-700/20 w-full text-sm text-left px-4 py-2.5 text-gray-700 dark:text-white/85 hover:bg-emerald-50 hover:text-emerald-600 transition"
                                            data-value="suspended">
                                            Suspended
                                        </button>
                                    </div>
                                </div>
                            </div>
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
                                    User ID
                                </th>
                                <th
                                    class="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                                    Name
                                </th>
                                <th
                                    class="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                                    Role
                                </th>
                                <th
                                    class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase dark:text-gray-200 tracking-wider">
                                    Username
                                </th>
                                <th
                                    class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase dark:text-gray-200 tracking-wider">
                                    Last Login
                                </th>
                                <th
                                    class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase dark:text-gray-200 tracking-wider">
                                    Date Created
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
    <script src="assets/js/user-management.js"></script>
</body>

</html>