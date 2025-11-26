//js/resident.js
// Sample residents data
const residentsData = [
  {
    id: "USR-2025-001",
    name: "Maria Santos",
    initials: "MS",
    address: "123 Rizal Street, Barangay 1",
    contact: "+63 910 123 4567",
    deviceId: "SC-KC-001",
    registeredDate: new Date("2025-09-15"),
    color: "bg-emerald-500",
  },
  {
    id: "USR-2025-002",
    name: "Juan Dela Cruz",
    initials: "JD",
    address: "456 Bonifacio Avenue, Barangay 2",
    contact: "+63 920 234 5678",
    deviceId: "SC-KC-002",
    registeredDate: new Date("2024-09-20"),
    color: "bg-blue-500",
  },
  {
    id: "USR-2025-003",
    name: "Anna Reyes",
    initials: "AR",
    address: "789 Mabini Road, Barangay 3",
    contact: "+63 930 345 6789",
    deviceId: "SC-KC-003",
    registeredDate: new Date("2024-10-05"),
    color: "bg-purple-500",
  },
  {
    id: "USR-2025-004",
    name: "Pedro Garcia",
    initials: "PG",
    address: "321 Luna Street, Barangay 4",
    contact: "+63 940 456 7890",
    deviceId: "SC-KC-004",
    registeredDate: new Date("2024-10-12"),
    color: "bg-orange-500",
  },
  {
    id: "USR-2025-005",
    name: "Rosa Martinez",
    initials: "RM",
    address: "654 Del Pilar Avenue, Barangay 5",
    contact: "+63 950 567 8901",
    deviceId: "SC-KC-005",
    registeredDate: new Date("2024-10-18"),
    color: "bg-pink-500",
  },
  {
    id: "USR-2025-006",
    name: "Carlos Lopez",
    initials: "CL",
    address: "987 Aguinaldo Road, Barangay 6",
    contact: "+63 960 678 9012",
    deviceId: "SC-KC-006",
    registeredDate: new Date("2024-10-25"),
    color: "bg-indigo-500",
  },
  {
    id: "USR-2025-007",
    name: "Elena Torres",
    initials: "ET",
    address: "147 Quezon Boulevard, Barangay 7",
    contact: "+63 970 789 0123",
    deviceId: "SC-KC-007",
    registeredDate: new Date("2024-11-01"),
    color: "bg-teal-500",
  },
  {
    id: "USR-2025-008",
    name: "Miguel Fernandez",
    initials: "MF",
    address: "258 Magsaysay Street, Barangay 8",
    contact: "+63 980 890 1234",
    deviceId: "SC-KC-008",
    registeredDate: new Date("2024-11-08"),
    color: "bg-red-500",
  },
  {
    id: "USR-2025-009",
    name: "Sofia Ramirez",
    initials: "SR",
    address: "369 Osmena Avenue, Barangay 9",
    contact: "+63 990 901 2345",
    deviceId: "SC-KC-009",
    registeredDate: new Date("2024-11-15"),
    color: "bg-yellow-500",
  },
  {
    id: "USR-2025-010",
    name: "Diego Mendoza",
    initials: "DM",
    address: "741 Roxas Road, Barangay 10",
    contact: "+63 915 012 3456",
    deviceId: "SC-KC-010",
    registeredDate: new Date("2024-11-20"),
    color: "bg-cyan-500",
  },
  {
    id: "USR-2025-011",
    name: "Isabel Cruz",
    initials: "IC",
    address: "852 Marcos Boulevard, Barangay 11",
    contact: "+63 925 123 4567",
    deviceId: "SC-KC-011",
    registeredDate: new Date("2024-11-23"),
    color: "bg-lime-500",
  },
];

// State variables
let filteredResidents = [...residentsData];
let currentPage = 1;
const itemsPerPage = 5;
let searchQuery = "";
let selectedSort = "newest";

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
              <div class="skeleton w-10 h-10 rounded-full"></div>
              <div class="skeleton h-4 w-24"></div>
            </div>
          </td>
          <td class="px-6 py-4">
            <div class="skeleton h-3 w-20"></div>
          </td>
          <td class="px-6 py-4">
            <div class="skeleton h-3 w-36"></div>
          </td>
          <td class="px-6 py-4">
            <div class="skeleton h-3 w-24"></div>
          </td>
          <td class="px-6 py-4">
            <div class="skeleton h-3 w-16"></div>
          </td>
          <td class="px-6 py-4">
            <div class="skeleton h-3 w-28"></div>
          </td>
          <td class="px-6 py-4">
            <div class="flex items-center gap-2">
              <div class="skeleton h-8 w-8 rounded-lg"></div>
              <div class="skeleton h-8 w-8 rounded-lg"></div>
              <div class="skeleton h-8 w-8 rounded-lg"></div>
            </div>
          </td>
        </tr>
      `
      )
      .join("");

    tableBody.style.opacity = "1";
  }, 100);
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

  // Calculate hours since last registration
  const sortedByDate = [...residentsData].sort(
    (a, b) => b.registeredDate - a.registeredDate
  );
  const lastRegistration = sortedByDate[0].registeredDate;
  const hoursSince = Math.floor(
    (new Date() - lastRegistration) / (1000 * 60 * 60)
  );

  // Update DOM
  document.querySelector("#totalCount").textContent = totalResidents;
  document.querySelector("#registeredCount").textContent = registeredThisMonth;
  document.querySelector("#lastHourCount").textContent = `${hoursSince}h`;
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
      .map(
        (resident, index) => `
      <tr class="hover:bg-gray-50 transition item-enter" style="animation-delay: ${
        index * 0.05
      }s">
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 ${
              resident.color
            } rounded-full flex items-center justify-center text-white font-semibold text-sm">
              ${resident.initials}
            </div>
            <span class="text-xs font-medium text-gray-800">${resident.name}</span>
          </div>
        </td>
        <td class="px-6 py-4 text-xs text-gray-600">${resident.id}</td>
        <td class="px-6 py-4 text-xs text-gray-600">${resident.address}</td>
        <td class="px-6 py-4 text-xs text-gray-600">${resident.contact}</td>
        <td class="px-6 py-4 text-xs text-gray-600">${resident.deviceId}</td>
        <td class="px-6 py-4 text-xs text-gray-600">${formatDate(
          resident.registeredDate
        )}</td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-2">
            <button onclick="viewResident('${
              resident.id
            }')" class="text-gray-500 hover:text-[#01AF78] hover:bg-emerald-50 transition-colors bg-[#F1F5F9] p-2 rounded-lg w-8 h-8 flex items-center justify-center">
              <i class="uil uil-eye text-xl"></i>
            </button>
            <button onclick="editResident('${
              resident.id
            }')" class="text-gray-500 hover:text-blue-500 hover:bg-blue-50 transition-colors bg-[#F1F5F9] p-2 rounded-lg w-8 h-8 flex items-center justify-center">
              <i class="uil uil-pen text-xl"></i>
            </button>
            <button onclick="archiveResident('${
              resident.id
            }')" class="text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors bg-[#F1F5F9] p-2 rounded-lg w-8 h-8 flex items-center justify-center">
              <i class="uil uil-archive-alt text-xl"></i>
            </button>
          </div>
        </td>
      </tr>
    `
      )
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
      class="w-9 h-9 flex items-center justify-center rounded-full bg-[#F1F5F9] text-gray-600 hover:bg-emerald-50 hover:text-emerald-500 transition ${
        currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
      }"
      ${currentPage === 1 ? "disabled" : ""}>
      <i class="uil uil-angle-left text-xl"></i>
    </button>
    <div class="bg-[#F1F5F9] rounded-full p-1 flex items-center gap-1">
  `;

  // Show pages with ellipsis logic
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
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
      class="w-9 h-9 flex items-center justify-center rounded-full bg-[#F1F5F9] text-gray-600 hover:bg-emerald-50 hover:text-emerald-500 transition ${
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
      i.classList.remove("bg-emerald-50", "text-emerald-600")
    );
    e.target.classList.add("bg-emerald-50", "text-emerald-600");

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
      <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
        <input type="checkbox" id="selectAll" class="w-5 h-5 appearance-none border-2 border-gray-300 rounded-md checked:bg-[#01AF78] checked:border-[#01AF78] focus:ring-2 focus:ring-emerald-100 focus:ring-offset-0 transition-all cursor-pointer bg-[length:10px_10px] bg-center bg-no-repeat checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOSIgdmlld0JveD0iMCAwIDEyIDkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgNEw0LjUgNy41TDExIDEiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')]" onchange="toggleSelectAll(this)" />
        <div class="flex-1">
          <span class="text-xs font-semibold text-gray-800">Select All</span>
        </div>
      </label>

      <div class="border-t border-gray-200 my-2"></div>

      <div class="grid grid-cols-2 gap-3">
        <!-- Individual Fields -->
        <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <input type="checkbox" value="name" class="export-checkbox w-5 h-5 appearance-none border-2 border-gray-300 rounded-md checked:bg-[#01AF78] checked:border-[#01AF78] focus:ring-2 focus:ring-emerald-100 focus:ring-offset-0 transition-all cursor-pointer bg-[length:10px_10px] bg-center bg-no-repeat checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOSIgdmlld0JveD0iMCAwIDEyIDkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgNEw0LjUgNy41TDExIDEiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')]" checked onchange="updateSelectAll()" />
          <div class="flex-1">
            <span class="text-xs font-medium text-gray-700">Resident Name</span>
            <p class="text-xs text-gray-500">Full name of the resident</p>
          </div>
        </label>

        <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <input type="checkbox" value="userId" class="export-checkbox w-5 h-5 appearance-none border-2 border-gray-300 rounded-md checked:bg-[#01AF78] checked:border-[#01AF78] focus:ring-2 focus:ring-emerald-100 focus:ring-offset-0 transition-all cursor-pointer bg-[length:10px_10px] bg-center bg-no-repeat checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOSIgdmlld0JveD0iMCAwIDEyIDkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgNEw0LjUgNy41TDExIDEiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')]" checked onchange="updateSelectAll()" />
          <div class="flex-1">
            <span class="text-xs font-medium text-gray-700">User ID</span>
            <p class="text-xs text-gray-500">Unique identifier</p>
          </div>
        </label>

        <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <input type="checkbox" value="address" class="export-checkbox w-5 h-5 appearance-none border-2 border-gray-300 rounded-md checked:bg-[#01AF78] checked:border-[#01AF78] focus:ring-2 focus:ring-emerald-100 focus:ring-offset-0 transition-all cursor-pointer bg-[length:10px_10px] bg-center bg-no-repeat checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOSIgdmlld0JveD0iMCAwIDEyIDkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgNEw0LjUgNy41TDExIDEiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')]" checked onchange="updateSelectAll()" />
          <div class="flex-1">
            <span class="text-xs font-medium text-gray-700">Address</span>
            <p class="text-xs text-gray-500">Residential address</p>
          </div>
        </label>

        <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <input type="checkbox" value="contact" class="export-checkbox w-5 h-5 appearance-none border-2 border-gray-300 rounded-md checked:bg-[#01AF78] checked:border-[#01AF78] focus:ring-2 focus:ring-emerald-100 focus:ring-offset-0 transition-all cursor-pointer bg-[length:10px_10px] bg-center bg-no-repeat checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOSIgdmlld0JveD0iMCAwIDEyIDkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgNEw0LjUgNy41TDExIDEiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')]" checked onchange="updateSelectAll()" />
          <div class="flex-1">
            <span class="text-xs font-medium text-gray-700">Contact Number</span>
            <p class="text-xs text-gray-500">Phone number</p>
          </div>
        </label>

        <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <input type="checkbox" value="deviceId" class="export-checkbox w-5 h-5 appearance-none border-2 border-gray-300 rounded-md checked:bg-[#01AF78] checked:border-[#01AF78] focus:ring-2 focus:ring-emerald-100 focus:ring-offset-0 transition-all cursor-pointer bg-[length:10px_10px] bg-center bg-no-repeat checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOSIgdmlld0JveD0iMCAwIDEyIDkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgNEw0LjUgNy41TDExIDEiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')]" checked onchange="updateSelectAll()" />
          <div class="flex-1">
            <span class="text-xs font-medium text-gray-700">Device ID</span>
            <p class="text-xs text-gray-500">Associated device identifier</p>
          </div>
        </label>

        <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <input type="checkbox" value="registeredDate" class="export-checkbox w-5 h-5 appearance-none border-2 border-gray-300 rounded-md checked:bg-[#01AF78] checked:border-[#01AF78] focus:ring-2 focus:ring-emerald-100 focus:ring-offset-0 transition-all cursor-pointer bg-[length:10px_10px] bg-center bg-no-repeat checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOSIgdmlld0JveD0iMCAwIDEyIDkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgNEw0LjUgNy41TDExIDEiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')]" checked onchange="updateSelectAll()" />
          <div class="flex-1">
            <span class="text-xs font-medium text-gray-700">Registered Date</span>
            <p class="text-xs text-gray-500">Date of registration</p>
          </div>
        </label>
      </div>
    </div>
  `;

  modalManager.create({
    id: "exportModal",
    icon: "uil-download-alt",
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-50",
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
        <label for="editResidentName" class="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
          Resident Name
        </label>
        <input type="text" id="editResidentName" value="${resident.name}" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-2 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition text-xs text-gray-800 transition-all ease-in-out duration-200" placeholder="Enter resident name" />
      </div>

      <!-- User ID (Read-only) -->
      <div>
        <label for="editUserId" class="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
          User ID
        </label>
        <input type="text" id="editUserId" value="${resident.id}" class="w-full px-4 py-3 bg-emerald-50 border focus:outline-none focus:border-2 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 order-emerald-200 rounded-lg text-xs text-emerald-600 font-medium cursor-not-allowed transition-all ease-in-out duration-200" readonly />
      </div>

      <!-- Household/Address -->
      <div>
        <label for="editAddress" class="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
          Household / Address
        </label>
        <input type="text" id="editAddress" value="${resident.address}" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-2 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition text-xs text-gray-800 transition-all ease-in-out duration-200" placeholder="Enter address" />
      </div>

      <!-- Contact Number -->
      <div>
        <label for="editContact" class="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
          Contact Number
        </label>
        <input type="tel" id="editContact" value="${resident.contact}" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-2 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition text-xs text-gray-800 transition-all ease-in-out duration-200" placeholder="Enter contact number" />
      </div>

      <!-- Device ID -->
      <div>
        <label for="editDeviceId" class="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
          Device ID
        </label>
        <input type="text" id="editDeviceId" value="${resident.deviceId}" class="w-full px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg focus:outline-none focus:border-2 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition transition text-xs text-emerald-600 font-medium transition-all ease-in-out duration-200" placeholder="Enter device ID" readonly />
      </div>
    </div>
  `;

  // Store current editing ID
  window.currentEditingId = id;

  modalManager.create({
    id: "editModal",
    icon: "uil-pen",
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50",
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

function saveResidentChanges() {
  const id = window.currentEditingId;
  if (!id) return;

  const resident = residentsData.find((r) => r.id === id);
  if (!resident) return;

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

  // Update resident data
  resident.name = name;
  resident.address = address;
  resident.contact = contact;
  resident.deviceId = deviceId;

  // Update initials if name changed
  const nameParts = name.split(" ");
  resident.initials =
    nameParts.length >= 2
      ? nameParts[0][0] + nameParts[nameParts.length - 1][0]
      : name.substring(0, 2);
  resident.initials = resident.initials.toUpperCase();

  // Close modal and refresh table
  modalManager.close("editModal");
  renderTable();
  showToast(
    "success",
    `${resident.name}'s details have been updated successfully!`
  );
}

// Archive Modal Functions
function archiveResident(id) {
  const resident = residentsData.find((r) => r.id === id);
  if (!resident) return;

  const archiveBody = `
    <p class="text-xs text-gray-600 text-center leading-relaxed">
      Are you sure you want to move <span class="font-semibold" style="color: #27c291">${resident.name}</span> to Archive? You can restore this resident anytime from the archive.
    </p>
  `;

  // Store current archiving ID
  window.currentArchivingId = id;

  modalManager.create({
    id: "archiveModal",
    icon: "uil-archive",
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-50",
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

function confirmArchiveResident() {
  const id = window.currentArchivingId;
  if (!id) return;

  const index = residentsData.findIndex((r) => r.id === id);
  if (index !== -1) {
    const residentName = residentsData[index].name;
    residentsData.splice(index, 1);
    currentPage = 1;
    updateStats();
    renderTable();
    showToast(
      "success",
      `${residentName} has been moved to archive successfully!`
    );
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

  updateStats();

  showLoadingSkeleton();

  setTimeout(() => {
    renderTable();
  }, 1000);
});
