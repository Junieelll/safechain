// js/resident.js
let residentsData = [];
let filteredResidents = [];
let currentPage = 1;
const itemsPerPage = 5;
let searchQuery = "";
let selectedSort = "newest";

async function fetchResidents() {
  try {
    const response = await fetch("api/fetch_resident.php");
    const result = await response.json();

    if (result.success) {
      // Convert registeredDate strings to Date objects
      residentsData = result.data.map((resident) => ({
        ...resident,
        registeredDate: new Date(resident.registeredDate),
      }));
      updateStats();
      renderTable();
    } else {
      console.error("Error fetching residents:", result.error);
      showError("Failed to load residents data");
    }
  } catch (error) {
    console.error("Fetch error:", error);
    showError("Failed to connect to server");
  }
}

function showError(message) {
  const tbody = document.querySelector("tbody");
  tbody.innerHTML = `
    <tr>
      <td colspan="7" class="px-6 py-12 text-center text-red-500">
        <i class="uil uil-exclamation-triangle text-4xl mb-2"></i>
        <p class="text-sm">${message}</p>
        <button onclick="fetchResidents()" class="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
          Retry
        </button>
      </td>
    </tr>`;
}

// DOM Elements
const searchInput = document.getElementById("search");
const sortDropdownButton = document.getElementById("sortDropdownButton");
const sortDropdownMenu = document.getElementById("sortDropdownMenu");
const sortDropdownIcon = document.getElementById("sortDropdownIcon");
const sortSelectedText = document.getElementById("sortSelectedText");
const sortDropdownItems = sortDropdownMenu.querySelectorAll(".dropdown-item");
const exportBtn = document.getElementById("exportBtn");
const tableBody = document.querySelector("tbody");

// Add CSS transition to tbody
tableBody.style.transition =
  "opacity 0.3s ease-in-out, transform 0.3s ease-in-out";

// Format date function
function formatDate(date) {
  const months = [
    "JANUARY",
    "FEBRUARY",
    "MARCH",
    "APRIL",
    "MAY",
    "JUNE",
    "JULY",
    "AUGUST",
    "SEPTEMBER",
    "OCTOBER",
    "NOVEMBER",
    "DECEMBER",
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

// Loading skeleton
function showLoadingSkeleton() {
  tableBody.style.opacity = "0";

  setTimeout(() => {
    tableBody.innerHTML = Array(itemsPerPage)
      .fill(0)
      .map(
        () => `
        <tr>
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700/50 animate-pulse"></div>
              <div class="h-4 w-24 bg-gray-200 dark:bg-gray-700/50 rounded animate-pulse"></div>
            </div>
          </td>
          <td class="px-6 py-4">
            <div class="h-3 w-20 bg-gray-200 dark:bg-gray-700/50 rounded animate-pulse"></div>
          </td>
          <td class="px-6 py-4">
            <div class="h-3 w-36 bg-gray-200 dark:bg-gray-700/50 rounded animate-pulse"></div>
          </td>
          <td class="px-6 py-4">
            <div class="h-3 w-24 bg-gray-200 dark:bg-gray-700/50 rounded animate-pulse"></div>
          </td>
          <td class="px-6 py-4">
            <div class="h-3 w-16 bg-gray-200 dark:bg-gray-700/50 rounded animate-pulse"></div>
          </td>
          <td class="px-6 py-4">
            <div class="h-3 w-28 bg-gray-200 dark:bg-gray-700/50 rounded animate-pulse"></div>
          </td>
          <td class="px-6 py-4">
            <div class="flex items-center gap-2">
              <div class="h-8 w-8 rounded-lg bg-gray-200 dark:bg-gray-700/50 animate-pulse"></div>
              <div class="h-8 w-8 rounded-lg bg-gray-200 dark:bg-gray-700/50 animate-pulse"></div>
              <div class="h-8 w-8 rounded-lg bg-gray-200 dark:bg-gray-700/50 animate-pulse"></div>
            </div>
          </td>
        </tr>
      `
      )
      .join("");

    tableBody.style.opacity = "1";
  }, 100);
}

// Helper function to get initials from name
function getInitials(name) {
  if (!name) return "??";

  const nameParts = name
    .trim()
    .split(" ")
    .filter((part) => part.length > 0);

  if (nameParts.length === 0) return "??";
  if (nameParts.length === 1) return nameParts[0].substring(0, 2).toUpperCase();

  // Get first letter of first name and first letter of last name
  const firstInitial = nameParts[0][0];
  const lastInitial = nameParts[nameParts.length - 1][0];

  return (firstInitial + lastInitial).toUpperCase();
}

// Helper function to generate consistent color based on name
function getColorForName(name) {
  const colors = [
    "bg-emerald-500 dark:bg-emerald-600/70",
    "bg-blue-500 dark:bg-blue-600/70",
    "bg-purple-500 dark:bg-purple-600/70",
    "bg-orange-500 dark:bg-orange-600/70",
    "bg-pink-500 dark:bg-pink-600/70",
    "bg-indigo-500 dark:bg-indigo-600/70",
    "bg-teal-500 dark:bg-teal-600/70",
    "bg-red-500 dark:bg-red-600/70",
    "bg-yellow-500 dark:bg-yellow-600/70",
    "bg-cyan-500 dark:bg-cyan-600/70",
    "bg-lime-500 dark:bg-lime-600/70",
    "bg-rose-500 dark:bg-rose-600/70",
    "bg-violet-500 dark:bg-violet-600/70",
    "bg-fuchsia-500 dark:bg-fuchsia-600/70",
    "bg-sky-500 dark:bg-sky-600/70",
  ];

  // Generate a consistent color index based on the name
  // This ensures the same name always gets the same color
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

// Calculate statistics
function updateStats() {
  const totalResidents = residentsData.length;

  // Calculate registered this month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const registeredThisMonth = residentsData.filter((r) => {
    const regDate = r.registeredDate;
    return (
      regDate.getMonth() === currentMonth &&
      regDate.getFullYear() === currentYear
    );
  }).length;

  // Calculate time since last registration with dynamic units
  let timeSinceText = '0h';
  if (residentsData.length > 0) {
    const sortedByDate = [...residentsData].sort(
      (a, b) => b.registeredDate - a.registeredDate
    );
    const lastRegistration = sortedByDate[0].registeredDate;
    const millisecondsSince = new Date() - lastRegistration;
    
    const hours = Math.floor(millisecondsSince / (1000 * 60 * 60));
    const days = Math.floor(millisecondsSince / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    
    if (years > 0) {
      timeSinceText = `${years}y`;
    } else if (months > 0) {
      timeSinceText = `${months}mo`;
    } else if (days > 0) {
      timeSinceText = `${days}d`;
    } else {
      timeSinceText = `${hours}h`;
    }
  }

  // Update DOM
  document.querySelector("#totalCount").textContent = totalResidents;
  document.querySelector("#registeredCount").textContent = registeredThisMonth;
  document.querySelector("#lastHourCount").textContent = timeSinceText;
}

// Filter and sort residents
function filterAndSortResidents() {
  // Filter by search
  filteredResidents = residentsData.filter((resident) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      resident.name.toLowerCase().includes(searchLower) ||
      resident.id.toLowerCase().includes(searchLower) ||
      resident.address.toLowerCase().includes(searchLower) ||
      resident.contact.includes(searchQuery) ||
      resident.deviceId.toLowerCase().includes(searchLower)
    );
  });

  // Sort
  switch (selectedSort) {
    case "newest":
      filteredResidents.sort((a, b) => b.registeredDate - a.registeredDate);
      break;
    case "oldest":
      filteredResidents.sort((a, b) => a.registeredDate - b.registeredDate);
      break;
    case "ascending":
      filteredResidents.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "descending":
      filteredResidents.sort((a, b) => b.name.localeCompare(a.name));
      break;
  }
}

// Render table
function renderTable() {
  filterAndSortResidents();

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResidents = filteredResidents.slice(startIndex, endIndex);

  // Add fade-out effect
  tableBody.style.opacity = "0";

  // Show skeleton loading
  setTimeout(() => {
    showLoadingSkeleton();
  }, 300);

  setTimeout(() => {
    if (paginatedResidents.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="px-6 py-12 text-center text-gray-500">
            <i class="uil uil-search text-4xl mb-2"></i>
            <p class="text-sm">No residents found</p>
          </td>
        </tr>
      `;

      // Fade in
      tableBody.style.opacity = "1";
      renderPagination();
      return;
    }

    tableBody.innerHTML = paginatedResidents
      .map((resident, index) => {
        // Generate initials and color dynamically
        const initials = resident.initials || getInitials(resident.name);
        const color = resident.color || getColorForName(resident.name);

        return `
      <tr class="hover:bg-gray-50 dark:hover:bg-black/20 transition item-enter" style="animation-delay: ${
        index * 0.05
      }s">
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 ${color} rounded-full flex items-center p-4 justify-center text-white font-semibold text-sm">
              ${initials}
            </div>
            <span class="text-xs font-medium text-gray-800 dark:text-gray-200">${
              resident.name
            }</span>
          </div>
        </td>
        <td class="px-6 py-4 text-xs text-gray-600 dark:text-gray-200">${
          resident.id
        }</td>
        <td class="px-6 py-4 text-xs text-gray-600 dark:text-gray-200">${
          resident.address
        }</td>
        <td class="px-6 py-4 text-xs text-gray-600 dark:text-gray-200">${
          resident.contact
        }</td>
        <td class="px-6 py-4 text-xs text-gray-600 dark:text-gray-200">${
          resident.deviceId
        }</td>
        <td class="px-6 py-4 text-xs text-gray-600 dark:text-gray-200">${formatDate(
          resident.registeredDate
        )}</td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-2">
            <button onclick="viewResident('${
              resident.id
            }')" class="text-gray-500 hover:text-[#01AF78] hover:bg-emerald-50 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-500 transition-colors bg-[#F1F5F9] dark:bg-neutral-700 dark:text-gray-200 p-2 rounded-lg w-8 h-8 flex items-center justify-center">
              <i class="uil uil-eye text-xl"></i>
            </button>
            <button onclick="editResident('${
              resident.id
            }')" class="text-gray-500 hover:text-blue-500 hover:bg-blue-50 transition-colors bg-[#F1F5F9] dark:hover:bg-blue-900/20 dark:hover:text-blue-500 dark:bg-neutral-700 dark:text-gray-200 p-2 rounded-lg w-8 h-8 flex items-center justify-center">
              <i class="uil uil-pen text-xl"></i>
            </button>
            <button onclick="archiveResident('${
              resident.id
            }')" class="text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-500 transition-colors bg-[#F1F5F9] dark:bg-neutral-700 dark:text-gray-200 p-2 rounded-lg w-8 h-8 flex items-center justify-center">
              <i class="uil uil-archive-alt text-xl"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
      })
      .join("");

    // Fade in
    tableBody.style.opacity = "1";
    renderPagination();
  }, 800); // Show skeleton for 800ms total
}

// Render pagination
function renderPagination() {
  const totalPages = Math.ceil(filteredResidents.length / itemsPerPage);
  const paginationContainer = document.querySelector(
    ".flex.items-center.justify-center.gap-2.mt-6"
  );

  if (totalPages === 0) {
    paginationContainer.innerHTML = "";
    return;
  }

  let paginationHTML = `
    <button onclick="changePage(${currentPage - 1})" 
      class="w-9 h-9 flex items-center justify-center rounded-full bg-[#F1F5F9] dark:bg-neutral-700 dark:hover:bg-emerald-900/60 text-gray-600 hover:bg-emerald-50 hover:text-emerald-500 transition ${
        currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
      }"
      ${currentPage === 1 ? "disabled" : ""}>
      <i class="uil uil-angle-left text-xl"></i>
    </button>
    <div class="bg-[#F1F5F9] dark:bg-neutral-700 rounded-full p-1 flex items-center gap-1">
  `;

  // Show pages with ellipsis logic
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      paginationHTML += `
        <button onclick="changePage(${i})" 
          class="w-8 h-8 flex items-center justify-center rounded-full ${
            currentPage === i
              ? "bg-emerald-500 text-white"
              : "hover:bg-white dark:hover:bg-emerald-900/60 text-neutral-600 dark:text-neutral-400 dark:hover:text-emerald-500"
          } text-sm font-medium transition">
          ${i}
        </button>
      `;
    }
  } else {
    // Always show first page
    paginationHTML += `
      <button onclick="changePage(1)" 
        class="w-8 h-8 flex items-center justify-center rounded-full ${
          currentPage === 1
            ? "bg-emerald-500 text-white"
            : "hover:bg-white text-gray-600"
        } text-sm font-medium transition">
        1
      </button>
    `;

    if (currentPage > 3) {
      paginationHTML += `<span class="px-2 text-gray-500">...</span>`;
    }

    // Show current page and neighbors
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `
        <button onclick="changePage(${i})" 
          class="w-8 h-8 flex items-center justify-center rounded-full ${
            currentPage === i
              ? "bg-emerald-500 text-white"
              : "hover:bg-white text-gray-600"
          } text-sm font-medium transition">
          ${i}
        </button>
      `;
    }

    if (currentPage < totalPages - 2) {
      paginationHTML += `<span class="px-2 text-gray-500">...</span>`;
    }

    // Always show last page
    paginationHTML += `
      <button onclick="changePage(${totalPages})" 
        class="w-8 h-8 flex items-center justify-center rounded-full ${
          currentPage === totalPages
            ? "bg-emerald-500 text-white"
            : "hover:bg-white text-gray-600"
        } text-sm font-medium transition">
        ${totalPages}
      </button>
    `;
  }

  paginationHTML += `
    </div>
    <button onclick="changePage(${currentPage + 1})" 
      class="w-9 h-9 flex items-center justify-center rounded-full bg-[#F1F5F9] dark:bg-neutral-700 dark:hover:bg-emerald-900/60 text-gray-600 dark:text-neutral-400 hover:bg-emerald-50 hover:text-emerald-500 transition ${
        currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""
      }"
      ${currentPage === totalPages ? "disabled" : ""}>
      <i class="uil uil-angle-right text-xl"></i>
    </button>
  `;

  paginationContainer.innerHTML = paginationHTML;
}

// Change page function
function changePage(page) {
  const totalPages = Math.ceil(filteredResidents.length / itemsPerPage);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderTable();
  // Removed scroll to top - user stays at current position
}

// Search functionality
searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value;
  currentPage = 1;
  renderTable();
});

const activeDropdownClasses = [
  "bg-emerald-50",
  "border-emerald-500",
  "text-emerald-600",
  "dark:bg-emerald-700/20",
  "dark:border-emerald-700/20",
  "dark:text-emerald-300",
];

// Sort Dropdown Toggle
sortDropdownButton.addEventListener("click", (e) => {
  e.stopPropagation();
  const isHidden = sortDropdownMenu.classList.contains("hidden");

  if (isHidden) {
    sortDropdownMenu.classList.remove("hidden");
    sortDropdownIcon.style.transform = "rotate(180deg)";
  } else {
    sortDropdownMenu.classList.add("hidden");
    sortDropdownIcon.style.transform = "rotate(0deg)";
  }
});

// Sort Dropdown Selection
sortDropdownItems.forEach((item) => {
  item.addEventListener("click", (e) => {
    const value = e.target.getAttribute("data-value");
    const text = e.target.textContent.trim();

    selectedSort = value;
    sortSelectedText.textContent = text;

    sortDropdownItems.forEach((i) =>
      i.classList.remove(...activeDropdownClasses)
    );
    e.target.classList.add(...activeDropdownClasses);

    sortDropdownMenu.classList.add("hidden");
    sortDropdownIcon.style.transform = "rotate(0deg)";
    currentPage = 1;
    renderTable();
  });
});

// Export functionality
exportBtn.addEventListener("click", () => {
  // Show export modal
  showExportModal();
});

// Export Modal Functions
function showExportModal() {
  const exportBody = `
    <div class="space-y-3">
      <!-- Select All Option -->
      <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
        <input type="checkbox" id="selectAll" class="w-5 h-5 appearance-none border-2 border-gray-300 rounded-md checked:bg-[#01AF78] checked:border-[#01AF78] focus:ring-2 focus:ring-emerald-100 focus:ring-offset-0 transition-all cursor-pointer bg-[length:10px_10px] bg-center bg-no-repeat checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOSIgdmlld0JveD0iMCAwIDEyIDkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgNEw0LjUgNy41TDExIDEiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')]" onchange="toggleSelectAll(this)" />
        <div class="flex-1">
          <span class="text-xs font-semibold text-gray-800 dark:text-gray-300">Select All</span>
        </div>
      </label>

      <div class="border-t border-gray-200 dark:border-gray-700 my-2"></div>

      <div class="grid grid-cols-2 gap-3">
        <!-- Individual Fields -->
        <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
          <input type="checkbox" value="name" class="export-checkbox w-5 h-5 appearance-none border-2 border-gray-300 rounded-md checked:bg-[#01AF78] checked:border-[#01AF78] focus:ring-2 focus:ring-emerald-100 focus:ring-offset-0 transition-all cursor-pointer bg-[length:10px_10px] bg-center bg-no-repeat checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOSIgdmlld0JveD0iMCAwIDEyIDkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgNEw0LjUgNy41TDExIDEiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')]" checked onchange="updateSelectAll()" />
          <div class="flex-1">
            <span class="text-xs font-medium text-gray-700 dark:text-gray-200">Resident Name</span>
            <p class="text-xs text-gray-500 dark:text-gray-300">Full name of the resident</p>
          </div>
        </label>

        <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
          <input type="checkbox" value="userId" class="export-checkbox w-5 h-5 appearance-none border-2 border-gray-300 rounded-md checked:bg-[#01AF78] checked:border-[#01AF78] focus:ring-2 focus:ring-emerald-100 focus:ring-offset-0 transition-all cursor-pointer bg-[length:10px_10px] bg-center bg-no-repeat checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOSIgdmlld0JveD0iMCAwIDEyIDkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgNEw0LjUgNy41TDExIDEiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')]" checked onchange="updateSelectAll()" />
          <div class="flex-1">
            <span class="text-xs font-medium text-gray-700 dark:text-gray-200">User ID</span>
            <p class="text-xs text-gray-500 dark:text-gray-300">Unique identifier</p>
          </div>
        </label>

        <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
          <input type="checkbox" value="address" class="export-checkbox w-5 h-5 appearance-none border-2 border-gray-300 rounded-md checked:bg-[#01AF78] checked:border-[#01AF78] focus:ring-2 focus:ring-emerald-100 focus:ring-offset-0 transition-all cursor-pointer bg-[length:10px_10px] bg-center bg-no-repeat checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOSIgdmlld0JveD0iMCAwIDEyIDkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgNEw0LjUgNy41TDExIDEiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')]" checked onchange="updateSelectAll()" />
          <div class="flex-1">
            <span class="text-xs font-medium text-gray-700 dark:text-gray-200">Address</span>
            <p class="text-xs text-gray-500 dark:text-gray-300">Residential address</p>
          </div>
        </label>

        <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
          <input type="checkbox" value="contact" class="export-checkbox w-5 h-5 appearance-none border-2 border-gray-300 rounded-md checked:bg-[#01AF78] checked:border-[#01AF78] focus:ring-2 focus:ring-emerald-100 focus:ring-offset-0 transition-all cursor-pointer bg-[length:10px_10px] bg-center bg-no-repeat checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOSIgdmlld0JveD0iMCAwIDEyIDkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgNEw0LjUgNy41TDExIDEiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')]" checked onchange="updateSelectAll()" />
          <div class="flex-1">
            <span class="text-xs font-medium text-gray-700 dark:text-gray-200">Contact Number</span>
            <p class="text-xs text-gray-500 dark:text-gray-300">Phone number</p>
          </div>
        </label>

        <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
          <input type="checkbox" value="deviceId" class="export-checkbox w-5 h-5 appearance-none border-2 border-gray-300 rounded-md checked:bg-[#01AF78] checked:border-[#01AF78] focus:ring-2 focus:ring-emerald-100 focus:ring-offset-0 transition-all cursor-pointer bg-[length:10px_10px] bg-center bg-no-repeat checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOSIgdmlld0JveD0iMCAwIDEyIDkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgNEw0LjUgNy41TDExIDEiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')]" checked onchange="updateSelectAll()" />
          <div class="flex-1">
            <span class="text-xs font-medium text-gray-700 dark:text-gray-200">Device ID</span>
            <p class="text-xs text-gray-500 dark:text-gray-300">Associated device identifier</p>
          </div>
        </label>

        <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
          <input type="checkbox" value="registeredDate" class="export-checkbox w-5 h-5 appearance-none border-2 border-gray-300 rounded-md checked:bg-[#01AF78] checked:border-[#01AF78] focus:ring-2 focus:ring-emerald-100 focus:ring-offset-0 transition-all cursor-pointer bg-[length:10px_10px] bg-center bg-no-repeat checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOSIgdmlld0JveD0iMCAwIDEyIDkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgNEw0LjUgNy41TDExIDEiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')]" checked onchange="updateSelectAll()" />
          <div class="flex-1">
            <span class="text-xs font-medium text-gray-700 dark:text-gray-200">Registered Date</span>
            <p class="text-xs text-gray-500 dark:text-gray-300">Date of registration</p>
          </div>
        </label>
      </div>
    </div>
  `;

  modalManager.create({
    id: "exportModal",
    icon: "uil-download-alt",
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/60",
    title: "Export Residents",
    subtitle: "Select fields to include in export",
    body: exportBody,
    primaryButton: {
      text: "Export CSV",
      icon: "uil-download-alt",
      class: "bg-emerald-500 hover:bg-emerald-600",
    },
    secondaryButton: {
      text: "Cancel",
    },
    onPrimary: exportResidents,
    onSecondary: () => modalManager.close("exportModal"),
  });

  modalManager.show("exportModal");

  // Initialize select all state
  setTimeout(() => {
    updateSelectAll();
  }, 10);
}

function exportResidents() {
  // Get selected fields
  const checkboxes = document.querySelectorAll(".export-checkbox");
  const selectedFields = [];
  const fieldMap = {
    name: "Resident Name",
    userId: "User ID",
    address: "Address",
    contact: "Contact No.",
    deviceId: "Device ID",
    registeredDate: "Registered Date",
  };

  checkboxes.forEach((checkbox) => {
    if (checkbox.checked) {
      selectedFields.push(checkbox.value);
    }
  });

  if (selectedFields.length === 0) {
    showToast("error", "Please select at least one field to export");
    return;
  }

  // Create CSV headers
  const headers = selectedFields.map((field) => fieldMap[field]);

  // Create CSV rows
  const rows = filteredResidents.map((r) => {
    const row = [];
    selectedFields.forEach((field) => {
      switch (field) {
        case "name":
          row.push(r.name);
          break;
        case "userId":
          row.push(r.id);
          break;
        case "address":
          row.push(r.address);
          break;
        case "contact":
          row.push(r.contact);
          break;
        case "deviceId":
          row.push(r.deviceId);
          break;
        case "registeredDate":
          row.push(formatDate(r.registeredDate));
          break;
      }
    });
    return row;
  });

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  // Download CSV
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `residents_export_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);

  // Close modal and show success
  modalManager.close("exportModal");
  showToast("success", "Residents exported successfully!");
}

// Close dropdown when clicking outside
document.addEventListener("click", () => {
  sortDropdownMenu.classList.add("hidden");
  sortDropdownIcon.style.transform = "rotate(0deg)";
});

function editResident(id) {
  const resident = residentsData.find((r) => r.id === id);
  if (!resident) return;

  const editBody = `
    <div class="space-y-5">
      <!-- Resident Name -->
      <div>
        <label for="editResidentName" class="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-2 uppercase tracking-wide">
          Resident Name
        </label>
        <input type="text" id="editResidentName" value="${resident.name}" class="w-full px-4 py-3 bg-gray-50 dark:text-gray-200 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-2 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 dark:focus:ring-emerald-900 dark:focus:border-emerald-600 transition text-xs text-gray-800 transition-all ease-in-out duration-200" placeholder="Enter resident name" />
      </div>

      <!-- User ID (Read-only) -->
      <div>
        <label for="editUserId" class="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-2 uppercase tracking-wide">
          User ID
        </label>
        <input type="text" id="editUserId" value="${resident.id}" class="w-full px-4 py-3 dark:bg-emerald-900/60 bg-emerald-50 border focus:outline-none focus:border-2 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 border-emerald-200 dark:border-emerald-900 dark:focus:ring-emerald-900 dark:focus:border-emerald-600 rounded-lg text-xs text-emerald-600 font-medium cursor-not-allowed transition-all ease-in-out duration-200" readonly />
      </div>

      <!-- Household/Address -->
      <div>
        <label for="editAddress" class="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-2 uppercase tracking-wide">
          Household / Address
        </label>
        <input type="text" id="editAddress" value="${resident.address}" class="w-full px-4 py-3 bg-gray-50 dark:text-gray-200 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-2 focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900 dark:focus:border-emerald-600 focus:border-emerald-400 transition text-xs text-gray-800 transition-all ease-in-out duration-200" placeholder="Enter address" />
      </div>

      <!-- Contact Number -->
      <div>
        <label for="editContact" class="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-2 uppercase tracking-wide">
          Contact Number
        </label>
        <input type="tel" id="editContact" value="${resident.contact}" class="w-full px-4 py-3 bg-gray-50 dark:text-gray-200 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-2 focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900 dark:focus:border-emerald-600 focus:border-emerald-400 transition text-xs text-gray-800 transition-all ease-in-out duration-200" placeholder="Enter contact number" />
      </div>

      <!-- Device ID -->
      <div>
        <label for="editDeviceId" class="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-2 uppercase tracking-wide">
          Device ID
        </label>
        <input type="text" id="editDeviceId" value="${resident.deviceId}" class="w-full px-4 py-3 bg-emerald-50 dark:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-900 rounded-lg focus:outline-none focus:border-2 focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900 dark:focus:border-emerald-600 focus:border-emerald-400 transition transition text-xs text-emerald-600 font-medium transition-all ease-in-out duration-200" placeholder="Enter device ID" readonly />
      </div>
    </div>
  `;

  // Store current editing ID
  window.currentEditingId = id;

  modalManager.create({
    id: "editModal",
    icon: "uil-pen",
    iconColor: "text-blue-500",
    iconBg: "bg-blue-100 dark:bg-blue-900/60",
    title: "Edit Resident",
    subtitle: "Update resident information.",
    body: editBody,
    primaryButton: {
      text: "Save Changes",
      icon: "uil-save",
      class: "bg-emerald-500 hover:bg-emerald-600",
    },
    secondaryButton: {
      text: "Cancel",
    },
    onPrimary: saveResidentChanges,
    onSecondary: () => modalManager.close("editModal"),
  });

  modalManager.show("editModal");
}

async function saveResidentChanges() {
  const id = window.currentEditingId;
  if (!id) return;

  // Get values from form
  const name = document.getElementById("editResidentName").value.trim();
  const address = document.getElementById("editAddress").value.trim();
  const contact = document.getElementById("editContact").value.trim();
  const deviceId = document.getElementById("editDeviceId").value.trim();

  // Validate
  if (!name || !address || !contact || !deviceId) {
    showToast("error", "Please fill in all fields");
    return;
  }

  try {
    const response = await fetch('api/update_resident.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: id,
        name: name,
        address: address,
        contact: contact,
        deviceId: deviceId
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Refresh data from database
      await fetchResidents();
      modalManager.close("editModal");
      showToast("success", `${name}'s details have been updated successfully!`);
    } else {
      showToast("error", "Failed to update resident: " + result.error);
    }
  } catch (error) {
    console.error('Update error:', error);
    showToast("error", "Failed to update resident. Please try again.");
  }
}

// Archive Modal Functions
function archiveResident(id) {
  const resident = residentsData.find((r) => r.id === id);
  if (!resident) return;

  const archiveBody = `
    <p class="text-xs text-gray-600 dark:text-gray-200 text-center leading-relaxed">
      Are you sure you want to move <span class="font-semibold" style="color: #27c291">${resident.name}</span> to Archive? You can restore this resident anytime from the archive.
    </p>
  `;

  // Store current archiving ID
  window.currentArchivingId = id;

  modalManager.create({
    id: "archiveModal",
    icon: "uil-archive",
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/60",
    title: "Move Resident to Archive",
    subtitle: "This resident can be restored anytime.",
    body: archiveBody,
    primaryButton: {
      text: "Move to Archive",
      icon: "uil-archive",
      class: "bg-[#27C291] hover:bg-[#22A87B]",
    },
    secondaryButton: {
      text: "Close",
    },
    onPrimary: confirmArchiveResident,
    onSecondary: () => modalManager.close("archiveModal"),
  });

  modalManager.show("archiveModal");
}

async function confirmArchiveResident() {
  const id = window.currentArchivingId;
  if (!id) return;

  try {
    const response = await fetch('api/archive_resident.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: id })
    });
    
    const result = await response.json();
    
    if (result.success) {
      const residentName = residentsData.find(r => r.id === id)?.name || 'Resident';
      
      // Refresh data from database
      await fetchResidents();
      currentPage = 1;
      updateStats();
      renderTable();
      showToast("success", `${residentName} has been moved to archive successfully!`);
    } else {
      showToast("error", "Failed to archive resident: " + result.error);
    }
  } catch (error) {
    console.error('Archive error:', error);
    showToast("error", "Failed to archive resident. Please try again.");
  }

  modalManager.close("archiveModal");
}

// Select All functionality
function toggleSelectAll(checkbox) {
  const checkboxes = document.querySelectorAll(".export-checkbox");
  checkboxes.forEach((cb) => {
    cb.checked = checkbox.checked;
  });
}

function updateSelectAll() {
  const checkboxes = document.querySelectorAll(".export-checkbox");
  const selectAll = document.getElementById("selectAll");
  const allChecked = Array.from(checkboxes).every((cb) => cb.checked);
  selectAll.checked = allChecked;
}

// Page load animations
function initPageAnimations() {
  const header = document.querySelector(".header");
  const statsWidget = document.querySelector(".bg-white.rounded-2xl.p-6");
  const residentsSection = document.querySelector(".residents");

  if (header) {
    header.classList.add("animate-fade-in-up", "stagger-1");
  }
  if (statsWidget) {
    statsWidget.classList.add("animate-fade-in-up", "stagger-2");
  }
  if (residentsSection) {
    residentsSection.classList.add("animate-fade-in-up", "stagger-3");
  }
}

// Initialize
window.addEventListener("DOMContentLoaded", () => {
  initPageAnimations();
  fetchResidents();

  updateStats();

  showLoadingSkeleton();

});
