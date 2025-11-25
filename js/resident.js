// Sample residents data
const residentsData = [
  {
    id: "USR-2025-001",
    name: "Maria Santos",
    initials: "MS",
    address: "123 Rizal Street, Barangay 1",
    contact: "+63 910 123 4567",
    deviceId: "SC-KC-001",
    registeredDate: new Date("2024-09-15"),
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
let toastId = 0;

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

// Render table with smooth transition
// Render table with smooth transition
function renderTable() {
  filterAndSortResidents();

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResidents = filteredResidents.slice(startIndex, endIndex);

  // Add fade-out effect
  tableBody.style.opacity = "0";

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
        (resident) => `
      <tr class="hover:bg-gray-50 transition">
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 ${
              resident.color
            } rounded-full flex items-center justify-center text-white font-semibold text-sm">
              ${resident.initials}
            </div>
            <span class="text-xs font-medium text-gray-800">${
              resident.name
            }</span>
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
  }, 300);
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
  const modal = document.getElementById("exportModal");
  const overlay = document.getElementById("modalOverlay");

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

function closeExportModal() {
  const modal = document.getElementById("exportModal");
  const overlay = document.getElementById("modalOverlay");

  if (modal && overlay) {
    overlay.classList.remove("opacity-100");
    modal.classList.remove("scale-100", "opacity-100");

    setTimeout(() => {
      overlay.classList.add("hidden");
      modal.classList.add("hidden");
    }, 300);
  }
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
    alert("Please select at least one field to export");
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

  // Close modal
  closeExportModal();
}

// Make functions global
window.closeExportModal = closeExportModal;
window.exportResidents = exportResidents;

// Close dropdown when clicking outside
document.addEventListener("click", () => {
  sortDropdownMenu.classList.add("hidden");
  sortDropdownIcon.style.transform = "rotate(0deg)";
});

function viewResident(id) {
  console.log("View resident:", id);
  alert(`Viewing resident ${id}`);
}

function editResident(id) {
  const resident = residentsData.find((r) => r.id === id);
  if (!resident) return;

  // Populate modal fields
  document.getElementById("editResidentName").value = resident.name;
  document.getElementById("editUserId").value = resident.id;
  document.getElementById("editAddress").value = resident.address;
  document.getElementById("editContact").value = resident.contact;
  document.getElementById("editDeviceId").value = resident.deviceId;

  // Store current editing ID
  window.currentEditingId = id;

  // Show modal
  showEditModal();
}

function showEditModal() {
  const modal = document.getElementById("residentEditModal");
  const overlay = document.getElementById("editModalOverlay");

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

function closeEditModal() {
  const modal = document.getElementById("residentEditModal");
  const overlay = document.getElementById("editModalOverlay");

  if (modal && overlay) {
    overlay.classList.remove("opacity-100");
    modal.classList.remove("scale-100", "opacity-100");

    setTimeout(() => {
      overlay.classList.add("hidden");
      modal.classList.add("hidden");
      window.currentEditingId = null;
    }, 300);
  }
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
    alert("Please fill in all fields");
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
  closeEditModal();
  renderTable();
  showToast('success', `${resident.name}'s details have been updated successfully!`);

  // Show success message (optional)
  console.log("Resident updated successfully");
}

// Make functions global
window.closeEditModal = closeEditModal;
window.saveResidentChanges = saveResidentChanges;

// Archive Modal Functions
function showArchiveModal(id) {
  const resident = residentsData.find((r) => r.id === id);
  if (!resident) return;

  // Update resident name in modal
  document.getElementById("residentNameArchive").textContent = resident.name;
  
  // Store current archiving ID
  window.currentArchivingId = id;

  const modal = document.getElementById("residentArchiveModal");
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
  const modal = document.getElementById("residentArchiveModal");
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

     // Show success toast
    showToast('success', `${residentName} has been moved to archive successfully!`);
  }

  closeArchiveModal();
}

// Update the archiveResident function
function archiveResident(id) {
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
window.confirmArchiveResident = confirmArchiveResident;

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

// Close modal when clicking overlay
document.addEventListener("click", (e) => {
  if (e.target.id === "modalOverlay") {
    closeExportModal();
  }
});

document.addEventListener("click", (e) => {
  if (e.target.id === "editModalOverlay") {
    closeEditModal();
  }
});

// Initialize select all state
document.addEventListener("DOMContentLoaded", () => {
  updateSelectAll();
});

function showToast(type, message, duration = 5000) {
    const id = `toast-${toastId++}`;
    const container = document.getElementById('toastContainer');

    // Toast colors and icons
    const config = {
        success: {
            bg: 'bg-[#27C291]',
            iconColor: '#27C291',
            icon: 'uil-check'
        },
        error: {
            bg: 'bg-[#E4595C]',
            iconColor: '#E4595C',
            icon: 'uil-times'
        },
        info: {
            bg: 'bg-[#2563EB]',
            iconColor: '#2563EB',
            icon: 'uil-info'
        }
    };

    const { bg, iconColor, icon } = config[type] || config.info;

    // Create toast element
    const toast = document.createElement('div');
    toast.id = id;
    toast.className = `${bg} rounded-2xl shadow-lg p-4 flex items-center justify-between gap-3 toast-enter`;
    toast.innerHTML = `
        <div class="flex items-center gap-3 flex-1">
            <div class="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
                <!-- Outer Timer Circle (white stroke) -->
                <svg class="absolute w-12 h-12 transform -rotate-90">
                    <circle
                        cx="24"
                        cy="24"
                        r="22"
                        stroke="rgba(255, 255, 255, 0.3)"
                        stroke-width="4"
                        fill="none"
                    />
                    <circle
                        cx="24"
                        cy="24"
                        r="22"
                        stroke="white"
                        stroke-width="4"
                        fill="none"
                        stroke-dasharray="138"
                        stroke-dashoffset="0"
                        class="countdown-circle"
                        style="animation-duration: ${duration}ms;"
                    />
                </svg>
                
                <!-- Inner White Circle with Icon -->
                <div class="absolute w-7 h-7 bg-white rounded-full flex items-center justify-center">
                    <i class="${icon} text-xl" style="color: ${iconColor};"></i>
                </div>
            </div>
            <span class="text-white text-sm font-medium flex-1">${message}</span>
        </div>
        <button
            onclick="closeToast('${id}')"
            class="text-white hover:bg-white/10 rounded-lg p-1 transition-colors flex-shrink-0"
        >
            <i class="uil uil-times text-xl"></i>
        </button>
    `;

    container.appendChild(toast);

    // Auto remove after duration
    setTimeout(() => {
        closeToast(id);
    }, duration);
}

function closeToast(id) {
    const toast = document.getElementById(id);
    if (!toast) return;

    toast.classList.remove('toast-enter');
    toast.classList.add('toast-exit');

    setTimeout(() => {
        toast.remove();
    }, 300);
}

// Make functions global
window.showToast = showToast;
window.closeToast = closeToast;

// Initialize
updateStats();
renderTable();
