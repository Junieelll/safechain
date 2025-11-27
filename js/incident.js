// Dummy Data
const incidentsData = [
  {
    id: "EMG-2024-1001",
    type: "fire",
    location: "123 Main St., Diliman, QC",
    reporter: "Juan Dela Cruz",
    dateTime: "2024-11-20 10:15 AM",
    status: "resolved",
  },
  {
    id: "EMG-2024-1002",
    type: "flood",
    location: "456 Commonwealth Ave., QC",
    reporter: "Maria Garcia",
    dateTime: "2024-11-19 02:30 PM",
    status: "responding",
  },
  {
    id: "EMG-2024-1003",
    type: "crime",
    location: "789 Quezon Ave., Cubao, QC",
    reporter: "Pedro Santos",
    dateTime: "2024-11-18 08:45 PM",
    status: "pending",
  },
  {
    id: "EMG-2024-1004",
    type: "fire",
    location: "321 España Blvd., QC",
    reporter: "Ana Reyes",
    dateTime: "2024-11-17 11:20 AM",
    status: "resolved",
  },
  {
    id: "EMG-2024-1005",
    type: "flood",
    location: "654 Aurora Blvd., Project 4, QC",
    reporter: "Carlos Mendoza",
    dateTime: "2024-11-16 04:15 PM",
    status: "responding",
  },
  {
    id: "EMG-2024-1006",
    type: "crime",
    location: "987 Katipunan Ave., QC",
    reporter: "Rosa Martinez",
    dateTime: "2024-11-15 09:30 AM",
    status: "pending",
  },
  {
    id: "EMG-2024-1007",
    type: "fire",
    location: "147 EDSA, Kamuning, QC",
    reporter: "Miguel Torres",
    dateTime: "2024-11-14 01:45 PM",
    status: "resolved",
  },
  {
    id: "EMG-2024-1008",
    type: "flood",
    location: "258 Araneta Ave., QC",
    reporter: "Linda Cruz",
    dateTime: "2024-11-13 07:00 PM",
    status: "responding",
  },
  {
    id: "EMG-2024-1009",
    type: "crime",
    location: "369 West Ave., QC",
    reporter: "Ramon Silva",
    dateTime: "2024-11-12 03:25 PM",
    status: "pending",
  },
  {
    id: "EMG-2024-1010",
    type: "fire",
    location: "741 Roosevelt Ave., QC",
    reporter: "Elena Ramos",
    dateTime: "2024-11-11 12:10 PM",
    status: "resolved",
  },
  {
    id: "EMG-2024-1011",
    type: "flood",
    location: "852 Magsaysay Ave., QC",
    reporter: "Jose Lopez",
    dateTime: "2024-11-10 05:40 AM",
    status: "responding",
  },
  {
    id: "EMG-2024-1012",
    type: "crime",
    location: "963 Timog Ave., QC",
    reporter: "Sofia Flores",
    dateTime: "2024-11-09 10:55 PM",
    status: "pending",
  },
  {
    id: "EMG-2024-1013",
    type: "fire",
    location: "159 Tomas Morato, QC",
    reporter: "Diego Morales",
    dateTime: "2024-11-08 08:20 AM",
    status: "resolved",
  },
  {
    id: "EMG-2024-1014",
    type: "flood",
    location: "357 Banawe St., QC",
    reporter: "Carmen Aquino",
    dateTime: "2024-11-07 02:15 PM",
    status: "responding",
  },
  {
    id: "EMG-2024-1015",
    type: "crime",
    location: "486 Del Monte Ave., QC",
    reporter: "Ricardo Villanueva",
    dateTime: "2024-11-06 06:30 PM",
    status: "pending",
  },
  {
    id: "EMG-2024-1016",
    type: "fire",
    location: "753 Congressional Ave., QC",
    reporter: "Isabella Castro",
    dateTime: "2024-11-05 11:45 AM",
    status: "resolved",
  },
  {
    id: "EMG-2024-1017",
    type: "flood",
    location: "864 Visayas Ave., QC",
    reporter: "Antonio Valdez",
    dateTime: "2024-11-04 04:00 PM",
    status: "responding",
  },
  {
    id: "EMG-2024-1018",
    type: "crime",
    location: "975 Mindanao Ave., QC",
    reporter: "Patricia Fernandez",
    dateTime: "2024-11-03 09:25 AM",
    status: "pending",
  },
  {
    id: "EMG-2024-1019",
    type: "fire",
    location: "246 North Ave., QC",
    reporter: "Gabriel Santos",
    dateTime: "2024-11-02 01:50 PM",
    status: "resolved",
  },
  {
    id: "EMG-2024-1020",
    type: "flood",
    location: "135 South Triangle, QC",
    reporter: "Victoria Reyes",
    dateTime: "2024-11-01 07:35 PM",
    status: "responding",
  },
];

// Type Dropdown
const typeDropdownButton = document.getElementById("typeDropdownButton");
const typeDropdownMenu = document.getElementById("typeDropdownMenu");
const typeDropdownIcon = document.getElementById("typeDropdownIcon");
const typeSelectedText = document.getElementById("typeSelectedText");
const typeDropdownItems = typeDropdownMenu.querySelectorAll(".dropdown-item");

// Status Dropdown
const statusDropdownButton = document.getElementById("statusDropdownButton");
const statusDropdownMenu = document.getElementById("statusDropdownMenu");
const statusDropdownIcon = document.getElementById("statusDropdownIcon");
const statusSelectedText = document.getElementById("statusSelectedText");
const statusDropdownItems =
  statusDropdownMenu.querySelectorAll(".dropdown-item");

// Date Dropdown
const dateButton = document.getElementById("dateButton");
const dateMenu = document.getElementById("dateMenu");
const dateIcon = document.getElementById("dateIcon");
const dateText = document.getElementById("dateText");
const quickDateButtons = document.querySelectorAll(".quick-date");
const customDates = document.getElementById("customDates");
const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");
const applyCustom = document.getElementById("applyCustom");
const clearDate = document.getElementById("clearDate");

// Search Input
const searchInput = document.getElementById("search");

// Clear Filter Button
const clearFilterBtn = document.getElementById("clearFilterBtn");

const tableBody = document.querySelector("tbody");

// Pagination
const paginationContainer = document.querySelector(
  ".inline-flex.items-center.justify-center"
);

// Filter States
let selectedDateRange = null;
let selectedType = "all";
let selectedStatus = "all";
let searchQuery = "";
let currentPage = 1;
const itemsPerPage = 5;

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
            <div class="skeleton h-3 w-24 bg-gray-200 dark:bg-gray-700/50 rounded"></div>
          </td>
          <td class="px-6 py-4">
            <div class="skeleton h-6 w-[60px] rounded-full bg-gray-200 dark:bg-gray-700/50"></div>
          </td>
          <td class="px-6 py-4">
            <div class="skeleton h-3 w-40 bg-gray-200 dark:bg-gray-700/50 rounded"></div>
          </td>
          <td class="px-6 py-4">
            <div class="skeleton h-3 w-28 bg-gray-200 dark:bg-gray-700/50 rounded"></div>
          </td>
          <td class="px-6 py-4">
            <div class="skeleton h-3 w-32 bg-gray-200 dark:bg-gray-700/50 rounded"></div>
          </td>
          <td class="px-6 py-4">
            <div class="skeleton h-6 w-24 rounded-full bg-gray-200 dark:bg-gray-700/50"></div>
          </td>
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="skeleton h-8 w-8 rounded-lg bg-gray-200 dark:bg-gray-700/50"></div>
              <div class="skeleton h-8 w-8 rounded-lg bg-gray-200 dark:bg-gray-700/50"></div>
            </div>
          </td>
        </tr>
      `
      )
      .join("");

    tableBody.style.opacity = "1";
  }, 100);
}

// Helper Functions
function getTypeColor(type) {
  const colors = {
    fire: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-600",
    flood: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-600",
    crime:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-600",
  };
  return (
    colors[type] ||
    "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300"
  );
}

function getStatusColor(status) {
  const colors = {
    resolved:
      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-600",
    responding:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-600",
    pending:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-600",
  };
  return (
    colors[status] ||
    "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300"
  );
}

function parseDate(dateStr) {
  // Parse "2024-11-20 10:15 AM" format
  const [datePart, timePart, period] = dateStr.split(" ");
  const [year, month, day] = datePart.split("-");
  let [hours, minutes] = timePart.split(":");
  hours = parseInt(hours);

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return new Date(year, month - 1, day, hours, minutes);
}

function filterByDateRange(incident) {
  if (!selectedDateRange) return true;

  const incidentDate = parseDate(incident.dateTime);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  if (selectedDateRange === "Today") {
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    return incidentDate >= startOfDay && incidentDate <= today;
  }

  if (selectedDateRange === "Last 7 Days") {
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    return incidentDate >= sevenDaysAgo && incidentDate <= today;
  }

  if (selectedDateRange === "Last 30 Days") {
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    return incidentDate >= thirtyDaysAgo && incidentDate <= today;
  }

  // Custom date range
  if (startDate.value && endDate.value) {
    const start = new Date(startDate.value);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate.value);
    end.setHours(23, 59, 59, 999);
    return incidentDate >= start && incidentDate <= end;
  }

  return true;
}

function filterIncidents() {
  return incidentsData.filter((incident) => {
    // Type filter
    if (selectedType !== "all" && incident.type !== selectedType) {
      return false;
    }

    // Status filter
    if (selectedStatus !== "all" && incident.status !== selectedStatus) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        incident.id.toLowerCase().includes(query) ||
        incident.type.toLowerCase().includes(query) ||
        incident.location.toLowerCase().includes(query) ||
        incident.reporter.toLowerCase().includes(query) ||
        incident.status.toLowerCase().includes(query)
      );
    }

    // Date filter
    if (!filterByDateRange(incident)) {
      return false;
    }

    return true;
  });
}

function renderTable() {
  const filteredData = filterIncidents();
  const tbody = document.querySelector("tbody");

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageData = filteredData.slice(startIndex, endIndex);

  // Update count
  document.querySelector(
    ".incidents h1 .count"
  ).textContent = `(${filteredData.length})`;

  // Fade out
  tbody.style.opacity = "0";
  tbody.style.transition = "opacity 0.3s ease-in-out";

  // Skeleton
  setTimeout(() => showLoadingSkeleton(), 300);

  setTimeout(() => {
    tbody.innerHTML = "";

    if (pageData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="px-3 md:px-6 py-12 text-center text-gray-500">
            <i class="uil uil-inbox text-4xl mb-2"></i>
            <p class="text-sm">No incidents found</p>
          </td>
        </tr>`;
    } else {
      pageData.forEach((incident, index) => {
        const row = document.createElement("tr");

        row.className =
          "hover:bg-gray-50 dark:hover:bg-black/20 transition-colors item-enter";
        row.style.animationDelay = `${index * 0.05}s`;

        row.innerHTML = `
          <td class="px-3 md:px-6 py-3 md:py-4"><span class="text-xs font-medium text-blue-600 dark:text-blue-800">${
            incident.id
          }</span></td>
          <td class="px-3 md:px-6 py-3 md:py-4">
            <span class="inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(
              incident.type
            )}">
              ${incident.type.charAt(0).toUpperCase() + incident.type.slice(1)}
            </span>
          </td>
          <td class="px-3 md:px-6 py-3 md:py-4"><span class="text-xs text-gray-700 dark:text-neutral-400">${
            incident.location
          }</span></td>
          <td class="px-3 md:px-6 py-3 md:py-4"><span class="text-xs text-gray-700 dark:text-neutral-400">${
            incident.reporter
          }</span></td>
          <td class="px-3 md:px-6 py-3 md:py-4"><span class="text-xs text-gray-700 dark:text-neutral-400">${
            incident.dateTime
          }</span></td>
          <td class="px-3 md:px-6 py-3 md:py-4">
            <span class="inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
              incident.status
            )}">
              ${
                incident.status.charAt(0).toUpperCase() +
                incident.status.slice(1)
              }
            </span>
          </td>
          <td class="px-3 md:px-6 py-3 md:py-4">
            <div class="flex items-center gap-2 md:gap-3">
              <button class="text-gray-500 dark:text-neutral-400 hover:text-[#01AF78] hover:bg-emerald-50 dark:hover:bg-emerald-700/20 dark:hover:text-emerald-500 transition-colors bg-[#F1F5F9] dark:bg-neutral-700 p-1.5 md:p-2 rounded-lg w-7 h-7 md:w-8 md:h-8 flex items-center justify-center transition-all transform hover:scale-105">
                <i class="uil uil-eye text-lg md:text-xl"></i>
              </button>
              <button onclick="archiveIncident('${incident.id}')" 
                      class="text-gray-500 dark:text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-700/20 dark:hover:text-emerald-500 transition-colors bg-[#F1F5F9] dark:bg-neutral-700 p-1.5 md:p-2 rounded-lg w-7 h-7 md:w-8 md:h-8 flex items-center justify-center transition-all transform hover:scale-105">
                <i class="uil uil-archive-alt text-lg md:text-xl"></i>
              </button>
            </div>
          </td>
        `;

        tbody.appendChild(row);
      });
    }

    tbody.style.opacity = "1";
    renderPagination(totalPages);
  }, 800);
}

function renderPagination(totalPages) {
  const paginationNumbers = paginationContainer.querySelector("div");
  paginationNumbers.innerHTML = "";

  if (totalPages <= 1) {
    paginationContainer.style.display = "none";
    return;
  }

  paginationContainer.style.display = "flex";

  // Show first page
  paginationNumbers.appendChild(createPageButton(1, currentPage === 1));

  if (totalPages <= 7) {
    // Show all pages
    for (let i = 2; i <= totalPages; i++) {
      paginationNumbers.appendChild(createPageButton(i, currentPage === i));
    }
  } else {
    // Show with ellipsis
    if (currentPage > 3) {
      paginationNumbers.appendChild(createEllipsis());
    }

    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 3) {
      end = 4;
    }

    if (currentPage >= totalPages - 2) {
      start = totalPages - 3;
    }

    for (let i = start; i <= end; i++) {
      paginationNumbers.appendChild(createPageButton(i, currentPage === i));
    }

    if (currentPage < totalPages - 2) {
      paginationNumbers.appendChild(createEllipsis());
    }

    paginationNumbers.appendChild(
      createPageButton(totalPages, currentPage === totalPages)
    );
  }

  // Update prev/next buttons
  const prevButton = paginationContainer.querySelector("#prevBtn");
  const nextButton = paginationContainer.querySelector("#nextBtn");

  prevButton.disabled = currentPage === 1;
  prevButton.style.opacity = currentPage === 1 ? "0.5" : "1";
  prevButton.style.cursor = currentPage === 1 ? "not-allowed" : "pointer";

  nextButton.disabled = currentPage === totalPages;
  nextButton.style.opacity = currentPage === totalPages ? "0.5" : "1";
  nextButton.style.cursor =
    currentPage === totalPages ? "not-allowed" : "pointer";
}

function createPageButton(pageNum, isActive) {
  const button = document.createElement("button");
  button.className = `w-8 h-8 flex items-center justify-center rounded-full transition-colors font-medium text-sm ${
    isActive
      ? "bg-emerald-500 text-white shadow-md"
      : "text-neutral-700 dark:text-neutral-400 hover:bg-emerald-50 hover:text-emerald-500 dark:hover:bg-emerald-700/20 "
  }`;
  button.textContent = pageNum;
  button.onclick = () => {
    currentPage = pageNum;
    renderTable();
  };
  return button;
}

function createEllipsis() {
  const span = document.createElement("span");
  span.className = "text-gray-500 font-medium text-sm px-1";
  span.textContent = "...";
  return span;
}

// Close all dropdowns
function closeAllDropdowns() {
  typeDropdownMenu.classList.add("hidden");
  typeDropdownIcon.style.transform = "rotate(0deg)";
  statusDropdownMenu.classList.add("hidden");
  statusDropdownIcon.style.transform = "rotate(0deg)";
  dateMenu.classList.add("hidden");
  dateIcon.style.transform = "rotate(0deg)";
}

// Update filter button visibility
function updateClearFilterButton() {
  const hasFilters =
    selectedType !== "all" ||
    selectedStatus !== "all" ||
    selectedDateRange !== null ||
    searchQuery !== "";

  if (hasFilters) {
    clearFilterBtn.classList.remove("hidden");
    setTimeout(() => {
      clearFilterBtn.classList.remove("opacity-0");
      clearFilterBtn.classList.add("opacity-100");
    }, 10);
  } else {
    clearFilterBtn.classList.remove("opacity-100");
    clearFilterBtn.classList.add("opacity-0");
    setTimeout(() => {
      clearFilterBtn.classList.add("hidden");
    }, 300);
  }
}

// Event Listeners

const activeDropdownClasses = [
  "bg-emerald-50",
  "border-emerald-500",
  "text-emerald-600",
  "dark:bg-emerald-700/20",
  "dark:border-emerald-700/20",
  "dark:text-emerald-300",
];

// Search
searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value;
  currentPage = 1;
  renderTable();
  updateClearFilterButton();
});

// Type Dropdown Toggle
typeDropdownButton.addEventListener("click", (e) => {
  e.stopPropagation();
  const isHidden = typeDropdownMenu.classList.contains("hidden");
  closeAllDropdowns();

  if (isHidden) {
    typeDropdownMenu.classList.remove("hidden");
    typeDropdownIcon.style.transform = "rotate(180deg)";
  }
});

// Type Dropdown Selection
typeDropdownItems.forEach((item) => {
  item.addEventListener("click", (e) => {
    const value = e.target.getAttribute("data-value");
    const text = e.target.textContent.trim();

    selectedType = value;
    typeSelectedText.textContent = text;

    typeDropdownItems.forEach((i) =>
      i.classList.remove(...activeDropdownClasses)
    );
    e.target.classList.add(...activeDropdownClasses);

    typeDropdownMenu.classList.add("hidden");
    typeDropdownIcon.style.transform = "rotate(0deg)";
    currentPage = 1;
    renderTable();
    updateClearFilterButton();
  });
});

// Status Dropdown Toggle
statusDropdownButton.addEventListener("click", (e) => {
  e.stopPropagation();
  const isHidden = statusDropdownMenu.classList.contains("hidden");
  closeAllDropdowns();

  if (isHidden) {
    statusDropdownMenu.classList.remove("hidden");
    statusDropdownIcon.style.transform = "rotate(180deg)";
  }
});

// Status Dropdown Selection
statusDropdownItems.forEach((item) => {
  item.addEventListener("click", (e) => {
    const value = e.target.getAttribute("data-value");
    const text = e.target.textContent.trim();

    selectedStatus = value;
    statusSelectedText.textContent = text;

    statusDropdownItems.forEach((i) =>
      i.classList.remove(...activeDropdownClasses)
    );
    e.target.classList.add(...activeDropdownClasses);

    statusDropdownMenu.classList.add("hidden");
    statusDropdownIcon.style.transform = "rotate(0deg)";
    currentPage = 1;
    renderTable();
    updateClearFilterButton();
  });
});

// Date Dropdown Toggle
dateButton.addEventListener("click", (e) => {
  e.stopPropagation();
  const isHidden = dateMenu.classList.contains("hidden");
  closeAllDropdowns();

  if (isHidden) {
    dateMenu.classList.remove("hidden");
    dateIcon.style.transform = "rotate(180deg)";
  }
});

dateMenu.addEventListener("click", (e) => {
  e.stopPropagation();
});

// Quick date selections
quickDateButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const days = button.getAttribute("data-days");

    // Remove active classes from all buttons
    quickDateButtons.forEach((btn) => btn.classList.remove(...activeDropdownClasses));

    // Add active classes to selected button
    button.classList.add(...activeDropdownClasses);

    if (days === "custom") {
      customDates.classList.remove("hidden");
    } else {
      customDates.classList.add("hidden");
      const text = button.textContent;
      dateText.textContent = text;
      selectedDateRange = text;

      dateMenu.classList.add("hidden");
      dateIcon.style.transform = "rotate(0deg)";
      currentPage = 1;
      renderTable();
      updateClearFilterButton();
    }
  });
});

// Apply custom date range
applyCustom.addEventListener("click", () => {
  if (startDate.value && endDate.value) {
    const start = new Date(startDate.value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const end = new Date(endDate.value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    dateText.textContent = `${start} - ${end}`;
    selectedDateRange = `${start} - ${end}`;
    dateMenu.classList.add("hidden");
    dateIcon.style.transform = "rotate(0deg)";
    currentPage = 1;
    renderTable();
    updateClearFilterButton();
  }
});

// Clear date filter
clearDate.addEventListener("click", () => {
  dateText.textContent = "Date Range";
  selectedDateRange = null;
  startDate.value = "";
  endDate.value = "";
  customDates.classList.add("hidden");
  quickDateButtons.forEach((btn) =>
    btn.classList.remove(
      "bg-emerald-50",
      "border-emerald-500",
      "text-emerald-600"
    )
  );
  dateMenu.classList.add("hidden");
  dateIcon.style.transform = "rotate(0deg)";
  currentPage = 1;
  renderTable();
  updateClearFilterButton();
});

// Clear All Filters
clearFilterBtn.addEventListener("click", () => {
  // Reset search
  searchInput.value = "";
  searchQuery = "";

  // Reset type
  selectedType = "all";
  typeSelectedText.textContent = "All Types";
  typeDropdownItems.forEach((i) =>
    i.classList.remove(...activeDropdownClasses)
  );

  // Reset status
  selectedStatus = "all";
  statusSelectedText.textContent = "All Status";
  statusDropdownItems.forEach((i) =>
    i.classList.remove(...activeDropdownClasses)
  );

  // Reset date
  dateText.textContent = "Date Range";
  selectedDateRange = null;
  startDate.value = "";
  endDate.value = "";
  customDates.classList.add("hidden");
  quickDateButtons.forEach((btn) =>
    btn.classList.remove(...activeDropdownClasses)
  );

  currentPage = 1;
  renderTable();
  updateClearFilterButton();
});

// Pagination buttons
const prevButton = paginationContainer.querySelector("#prevBtn");
const nextButton = paginationContainer.querySelector("#nextBtn");

prevButton.addEventListener("click", (e) => {
  e.preventDefault();
  if (currentPage > 1) {
    currentPage--;
    renderTable();
  }
});

nextButton.addEventListener("click", (e) => {
  e.preventDefault();
  const totalPages = Math.ceil(filterIncidents().length / itemsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderTable();
  }
});

// Close dropdowns when clicking outside
document.addEventListener("click", () => {
  closeAllDropdowns();
});

// Set max dates to today
const today = new Date().toISOString().split("T")[0];
startDate.max = today;
endDate.max = today;

startDate.addEventListener("change", () => {
  endDate.min = startDate.value;
});

function updateWidgetCounts() {
  const totalIncidents = incidentsData.length;
  const activeIncidents = incidentsData.filter(
    (i) => i.status === "responding"
  ).length;
  const resolvedIncidents = incidentsData.filter(
    (i) => i.status === "resolved"
  ).length;
  const pendingIncidents = incidentsData.filter(
    (i) => i.status === "pending"
  ).length;

  // Calculate resolution rate
  const resolutionRate =
    totalIncidents > 0
      ? Math.round((resolvedIncidents / totalIncidents) * 100)
      : 0;

  // Update the DOM
  document.getElementById("incidentCount").textContent = totalIncidents;
  document.getElementById("activeCount").textContent = activeIncidents;
  document.getElementById("resolvedCount").textContent = resolvedIncidents;
  document.getElementById("pendingCount").textContent = pendingIncidents;

  // Update resolution rate
  const resolutionRateElement = document.querySelector(
    ".card:nth-child(3) .subtitle"
  );
  resolutionRateElement.innerHTML = `<i class="uil uil-arrow-up"></i> ${resolutionRate}% resolution rate`;
}

// Archive Modal Functions
function showArchiveModal(id) {
  const incident = incidentsData.find((i) => i.id === id);
  if (!incident) return;

  // Update incident name in modal
  document.getElementById("incidentArchive").textContent = incident.id;

  // Store current archiving ID
  window.currentArchivingId = id;

  const modal = document.getElementById("incidentArchiveModal");
  const overlay = document.getElementById("archiveModalOverlay");

  if (modal && overlay) {
    overlay.classList.remove("hidden");
    modal.classList.remove("hidden");

    // Trigger animation
    setTimeout(() => {
      overlay.classList.add("opacity-100");
      modal.classList.add("scale-100", "opacity-100");
    }, 10);
  }
}

function closeArchiveModal() {
  const modal = document.getElementById("incidentArchiveModal");
  const overlay = document.getElementById("archiveModalOverlay");

  if (modal && overlay) {
    overlay.classList.remove("opacity-100");
    modal.classList.remove("scale-100", "opacity-100");

    setTimeout(() => {
      overlay.classList.add("hidden");
      modal.classList.add("hidden");
      window.currentArchivingId = null;
    }, 300);
  }
}

function confirmArchiveIncident() {
  const id = window.currentArchivingId;
  if (!id) return;

  const index = incidentsData.findIndex((i) => i.id === id);
  if (index !== -1) {
    incidentsData.splice(index, 1);
    currentPage = 1;
    updateWidgetCounts();
    renderTable();
  }

  closeArchiveModal();
}

// Update the archiveResident function
function archiveIncident(id) {
  showArchiveModal(id);
}

// Close modal when clicking overlay
document.addEventListener("click", (e) => {
  if (e.target.id === "archiveModalOverlay") {
    closeArchiveModal();
  }
});

// Make functions global
window.closeArchiveModal = closeArchiveModal;
window.confirmArchiveIncident = confirmArchiveIncident;

// Page load animations
function initPageAnimations() {
  const header = document.querySelector(".header");
  const statsWidget = document.querySelector(".widget");
  const residentsSection = document.querySelector(".incidents");

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

  updateWidgetCounts();
  updateClearFilterButton();

  showLoadingSkeleton();

  setTimeout(() => {
    renderTable();
  }, 1000);
});
