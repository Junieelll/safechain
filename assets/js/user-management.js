// User Management JavaScript
let allUsers = [];
let filteredUsers = [];
let currentPage = 1;
const usersPerPage = 5;

// ✅ active filters
let activeSearch = "";
let activeRole = "allRoles";
let activeStatus = "allStatuses";

// Initialize on page load
document.addEventListener("DOMContentLoaded", function () {
  fetchUsers();
  setupEventListeners();
});

// Fetch users from API
async function fetchUsers() {
  try {
    const response = await fetch("api/user_management/get-users.php");
    const result = await response.json();

    if (result.success) {
      allUsers = result.data;
      applyFilters();
    } else {
      showToast("error", "Error loading users: " + result.error);
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    showToast("error", "Failed to load users");
  }
}

const userTableBody = document.querySelector("tbody");
userTableBody.style.transition =
  "opacity 0.3s ease-in-out, transform 0.3s ease-in-out";

function showUserLoadingSkeleton() {
  userTableBody.style.opacity = "0";

  setTimeout(() => {
    userTableBody.innerHTML = Array(usersPerPage)
      .fill(0)
      .map(
        () => `
        <tr>
          <td class="px-6 py-4">
            <div class="h-3 w-16 bg-gray-200 dark:bg-gray-700/50 rounded animate-pulse"></div>
          </td>
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700/50 animate-pulse"></div>
              <div class="h-3 w-24 bg-gray-200 dark:bg-gray-700/50 rounded animate-pulse"></div>
            </div>
          </td>
          <td class="px-6 py-4">
            <div class="h-6 w-20 bg-gray-200 dark:bg-gray-700/50 rounded-full animate-pulse"></div>
          </td>
          <td class="px-6 py-4">
            <div class="h-3 w-28 bg-gray-200 dark:bg-gray-700/50 rounded animate-pulse"></div>
          </td>
          <td class="px-6 py-4">
            <div class="h-3 w-20 bg-gray-200 dark:bg-gray-700/50 rounded animate-pulse"></div>
          </td>
          <td class="px-6 py-4">
            <div class="h-3 w-20 bg-gray-200 dark:bg-gray-700/50 rounded animate-pulse"></div>
          </td>
          <td class="px-6 py-4">
            <div class="flex items-center gap-2">
              <div class="h-8 w-8 rounded-lg bg-gray-200 dark:bg-gray-700/50 animate-pulse"></div>
              <div class="h-8 w-8 rounded-lg bg-gray-200 dark:bg-gray-700/50 animate-pulse"></div>
              <div class="h-8 w-8 rounded-lg bg-gray-200 dark:bg-gray-700/50 animate-pulse"></div>
              <div class="h-8 w-8 rounded-lg bg-gray-200 dark:bg-gray-700/50 animate-pulse"></div>
            </div>
          </td>
        </tr>
      `,
      )
      .join("");

    userTableBody.style.opacity = "1";
  }, 100);
}

// Render users in table
function renderUsers() {
  // Fade out
  userTableBody.style.opacity = "0";

  // Show skeleton
  setTimeout(() => {
    showUserLoadingSkeleton();
  }, 300);

  setTimeout(() => {
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const usersToDisplay = filteredUsers.slice(startIndex, endIndex);

    if (usersToDisplay.length === 0) {
      userTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="px-6 py-16 text-center">
            <div class="flex flex-col items-center justify-center gap-4">
              <div class="w-20 h-20 rounded-full bg-gray-100 dark:bg-neutral-700 flex items-center justify-center">
                <i class="uil uil-user-times text-4xl text-gray-400 dark:text-gray-500"></i>
              </div>
              <div class="space-y-1">
                <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">No users found</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">Get started by creating your first user account</p>
              </div>
              <button onclick="openCreateAccountModal()" class="mt-2 py-2.5 px-5 flex gap-2 items-center font-medium bg-emerald-500 text-white text-sm rounded-xl hover:bg-emerald-600 transition-all ease-in-out duration-200 focus:ring-4 focus:ring-emerald-100">
                <i class="uil uil-user-plus text-lg"></i>
                Create Account
              </button>
            </div>
          </td>
        </tr>
      `;
      userTableBody.style.opacity = "1";
      renderPagination();
      return;
    }

    userTableBody.innerHTML = usersToDisplay
      .map((user, index) => createUserRow(user, index))
      .join("");

    // Fade in
    userTableBody.style.opacity = "1";
    renderPagination();
  }, 800);
}

// Create user row HTML
function createUserRow(user, index = 0) {
  const initials = getInitials(user.name);
  const roleConfig = getRoleConfig(user.role);
  const lastLogin = user.lastLogin ? formatDate(user.lastLogin) : "Never";
  const createdAt = formatDate(user.createdAt);

  const avatarHtml = user.profilePicture
    ? `<img src="${user.profilePicture}" class="w-10 h-10 rounded-full object-cover shrink-0" alt="${user.name}" />`
    : `<div class="w-10 h-10 rounded-full shrink-0 bg-[linear-gradient(141.34deg,#27C291_4.44%,#20A577_95.56%)] flex items-center justify-center text-white font-semibold text-sm">${initials}</div>`;

  return `
    <tr class="hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition item-enter" style="animation-delay: ${index * 0.05}s">
      <td class="px-6 py-4">
        <span class="text-sm font-medium text-emerald-500 dark:text-emerald-400">${user.userId}</span>
      </td>
      <td class="px-6 py-4">
        <div class="flex items-center gap-3">
          ${avatarHtml}
          <span class="text-sm font-medium text-gray-900 dark:text-gray-100">${user.name}</span>
        </div>
      </td>
      <td class="px-6 py-4">
        <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${roleConfig.bgColor} ${roleConfig.textColor} ${roleConfig.borderColor} border-2">
          <i class="${roleConfig.icon}"></i>
          ${roleConfig.label}
        </span>
      </td>
      <td class="px-6 py-4">
        <span class="text-sm text-gray-600 dark:text-gray-300">${user.username}</span>
      </td>
      <td class="px-6 py-4">
        <span class="text-sm text-gray-600 dark:text-gray-300">${lastLogin}</span>
      </td>
      <td class="px-6 py-4">
        <span class="text-sm text-gray-600 dark:text-gray-300">${createdAt}</span>
      </td>
      <td class="px-6 py-4">
        <div class="flex items-center gap-2">
          <button onclick="editUser('${user.userId}')" class="p-2 hover:-translate-y-1 bg-blue-100 dark:bg-blue-900/20 rounded-lg w-8 h-8 flex items-center justify-center transition" title="Edit">
            <i class="uil uil-edit text-lg text-blue-600 dark:text-blue-300"></i>
          </button>
          <button onclick="resetPassword('${user.userId}')" class="p-2 hover:-translate-y-1 bg-purple-100 dark:bg-purple-900/20 rounded-lg w-8 h-8 flex items-center justify-center transition" title="Reset Password">
            <i class="uil uil-key-skeleton text-lg text-purple-600 dark:text-purple-300"></i>
          </button>
          <button onclick="toggleUserStatus('${user.userId}')" class="p-2 hover:-translate-y-1 ${
            user.status === "suspended"
              ? "bg-emerald-100 dark:bg-emerald-900/20"
              : "bg-orange-100 dark:bg-orange-900/20"
          } rounded-lg w-8 h-8 flex items-center justify-center transition" title="${user.status === "suspended" ? "Unsuspend" : "Suspend"}">
            <i class="uil ${
              user.status === "suspended"
                ? "uil-sync text-emerald-600 dark:text-emerald-300"
                : "uil-ban text-orange-600 dark:text-orange-300"
            } text-lg"></i>
          </button>
          <button onclick="deleteUser('${user.userId}')" class="p-2 hover:-translate-y-1 bg-red-100 dark:bg-red-900/20 rounded-lg w-8 h-8 flex items-center justify-center transition" title="Delete">
            <i class="uil uil-trash text-lg text-red-600 dark:text-red-400"></i>
          </button>
        </div>
      </td>
    </tr>
  `;
}

function getRoleConfig(role) {
  const configs = {
    bdrrm: {
      label: "BDRRM",
      icon: "uil uil-medkit",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/20",
      textColor: "text-emerald-500 dark:text-emerald-400",
      borderColor: "border-emerald-500 dark:border-emerald-800",
    },
    bpso: {
      label: "BPSO",
      icon: "uil uil-shield",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      textColor: "text-blue-500 dark:text-blue-400 ",
      borderColor: "border-blue-500 dark:border-blue-800",
    },
    admin: {
      label: "ADMIN",
      icon: "uil uil-user-md",
      bgColor: "bg-amber-100 dark:bg-amber-900/20",
      textColor: "text-amber-500 dark:text-amber-400",
      borderColor: "border-amber-500 dark:border-amber-800",
    },
    bfp: {
      label: "BFP",
      icon: "uil uil-fire",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      textColor: "text-red-700 dark:text-red-400",
      borderColor: "border-red-700 dark:border-red-800",
    },
    resident: {
      label: "RESIDENT",
      icon: "uil uil-user",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
      textColor: "text-purple-500 dark:text-purple-400",
      borderColor: "border-purple-500 dark:border-purple-800",
    },
  };

  return configs[role] || configs["bpso"];
}

// Get initials from name
function getInitials(name) {
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: "numeric", month: "short", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

// Render pagination
function renderPagination() {
  const paginationContainer = document.querySelector(
    ".flex.items-center.justify-center.gap-2.mt-6",
  );
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  if (totalPages <= 1) {
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
    // First page
    paginationHTML += `
      <button onclick="changePage(1)"
        class="w-8 h-8 flex items-center justify-center rounded-full ${
          currentPage === 1
            ? "bg-emerald-500 text-white"
            : "hover:bg-white dark:hover:bg-emerald-900/60 text-neutral-600 dark:text-neutral-400 dark:hover:text-emerald-500"
        } text-sm font-medium transition">
        1
      </button>
    `;

    if (currentPage > 3) {
      paginationHTML += `<span class="px-2 text-gray-500 dark:text-gray-400">...</span>`;
    }

    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    for (let i = startPage; i <= endPage; i++) {
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

    if (currentPage < totalPages - 2) {
      paginationHTML += `<span class="px-2 text-gray-500 dark:text-gray-400">...</span>`;
    }

    // Last page
    paginationHTML += `
      <button onclick="changePage(${totalPages})"
        class="w-8 h-8 flex items-center justify-center rounded-full ${
          currentPage === totalPages
            ? "bg-emerald-500 text-white"
            : "hover:bg-white dark:hover:bg-emerald-900/60 text-neutral-600 dark:text-neutral-400 dark:hover:text-emerald-500"
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

// Change page
function changePage(page) {
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  if (page < 1 || page > totalPages) return;

  currentPage = page;
  renderUsers();
  renderPagination();
}

function applyFilters() {
  filteredUsers = allUsers.filter((user) => {
    const matchSearch =
      user.name.toLowerCase().includes(activeSearch) ||
      user.username.toLowerCase().includes(activeSearch) ||
      user.userId.toLowerCase().includes(activeSearch);

    const matchRole = activeRole === "allRoles" || user.role === activeRole;

    const matchStatus =
      activeStatus === "allStatuses" ||
      user.status?.toLowerCase() === activeStatus.toLowerCase();

    return matchSearch && matchRole && matchStatus;
  });

  currentPage = 1;
  renderUsers();
  renderPagination();
}

// Setup event listeners
function setupEventListeners() {
  // Search
  const searchInput = document.getElementById("search");
  searchInput.addEventListener("input", function (e) {
    activeSearch = e.target.value.toLowerCase();
    applyFilters();
  });

  // Role filter dropdown
  setupDropdown(
    "sortDropdownButton",
    "sortDropdownMenu",
    "sortSelectedText",
    "sortDropdownIcon",
    filterByRole,
  );

  // Status filter dropdown
  setupDropdown(
    "statusDropdownButton",
    "statusDropdownMenu",
    "statusSelectedText",
    "statusDropdownIcon",
    filterByStatus,
  );

  // Create account button
  const createAccountBtn = document.querySelector(".header button");
  if (createAccountBtn) {
    createAccountBtn.addEventListener("click", openCreateAccountModal);
  }
}

// Setup dropdown
function setupDropdown(buttonId, menuId, textId, iconId, callback) {
  const button = document.getElementById(buttonId);
  const menu = document.getElementById(menuId);
  const text = document.getElementById(textId);
  const icon = document.getElementById(iconId);

  button.addEventListener("click", function () {
    menu.classList.toggle("hidden");
    icon.classList.toggle("rotate-180");
  });

  const items = menu.querySelectorAll(".dropdown-item");
  items.forEach((item) => {
    item.addEventListener("click", function () {
      const value = this.dataset.value;
      text.textContent = this.textContent.trim();
      menu.classList.add("hidden");
      icon.classList.remove("rotate-180");
      callback(value);
    });
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", function (e) {
    if (!button.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.add("hidden");
      icon.classList.remove("rotate-180");
    }
  });
}

// Filter by role
function filterByRole(role) {
  activeRole = role;
  applyFilters();
}

// Filter by status
function filterByStatus(status) {
  activeStatus = status;
  applyFilters();
}

function handleNameKeydown(event) {
  // Allow: backspace, delete, tab, escape, enter, arrows, home, end
  const allowedKeys = [
    "Backspace",
    "Delete",
    "Tab",
    "Escape",
    "Enter",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Home",
    "End",
  ];

  if (allowedKeys.includes(event.key)) return;

  // Block any numeric key (0-9)
  if (/[0-9]/.test(event.key)) {
    event.preventDefault();
    return;
  }
}

function handleNamePaste(event) {
  event.preventDefault();
  const pasted = (event.clipboardData || window.clipboardData)
    .getData("text")
    .replace(/[0-9]/g, ""); // Strip numbers from pasted text

  // Insert cleaned text at cursor position
  const input = event.target;
  const start = input.selectionStart;
  const end = input.selectionEnd;
  input.value = input.value.slice(0, start) + pasted + input.value.slice(end);

  // Update name preview if in edit modal
  const namePreview = document.getElementById("userNamePreview");
  if (namePreview) namePreview.textContent = input.value || "Full Name";
}

// User Management Modals

// ============================================
// CREATE ACCOUNT MODAL
// ============================================
function openCreateAccountModal() {
  const createAccountBody = `
        <div class="space-y-4">
            <!-- Full Name -->
            <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    FULL NAME
                </label>
                <input
                    type="text"
                    id="createFullName"
                    placeholder="Enter Full Name"
                    onblur="handleFullNameBlur()"
                      onkeydown="handleNameKeydown(event)"
                      onpaste="handleNamePaste(event)"
                    class="w-full px-4 py-3 bg-[#F1F5F9] dark:bg-neutral-700 rounded-xl text-sm 
                           border-2 border-transparent focus:border-emerald-400 dark:focus:border-emerald-500
                           focus:outline-none focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/60
                           text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500
                           transition"
                />
            </div>

            <!-- Username -->
            <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    USERNAME
                </label>
                <div class="relative">
                    <input
                        type="text"
                        id="createUsername"
                        placeholder="@sample.username"
                        oninput="checkUsernameAvailability('createUsername')"
                        onkeydown="handleUsernameKeydown(event)"
                        onpaste="handleUsernamePaste(event)"
                        class="w-full px-4 py-3 pr-24 bg-[#F1F5F9] dark:bg-neutral-700 rounded-xl text-sm 
                               border-2 border-transparent focus:border-emerald-400 dark:focus:border-emerald-500
                               focus:outline-none focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/60
                               text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500
                               transition"
                    />
                    <div id="usernameStatus" class="absolute right-3 top-1/2 -translate-y-1/2 hidden">
                        <!-- Status icons will appear here -->
                    </div>
                </div>
                <p id="usernameHelp" class="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <i class="uil uil-info-circle"></i>
                    Auto-generated from name or enter your own
                </p>
            </div>

            <!-- Select Role -->
            <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SELECT ROLE
                </label>
                <div class="relative">
                    <button
                        id="createRoleDropdownButton"
                        type="button"
                        class="w-full bg-[#F1F5F9] dark:bg-neutral-700 rounded-xl px-4 py-3 border-2 border-transparent text-left flex items-center justify-between focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 dark:focus:ring-emerald-900/60 dark:focus:border-emerald-500 transition">
                        <span id="createRoleSelectedText" class="text-sm text-gray-400 dark:text-gray-500">Select Role</span>
                        <i id="createRoleDropdownIcon" class="uil uil-angle-down text-xl text-gray-400 dark:text-gray-500 transition-transform duration-200"></i>
                    </button>
                    <div
                        id="createRoleDropdownMenu"
                        class="hidden absolute z-10 w-full mt-2 bg-white dark:bg-neutral-700 dark:border-gray-800 border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                        <div class="py-1">
                            <button type="button" class="dropdown-item text-sm w-full text-left px-4 py-2.5 text-gray-700 dark:text-white/85 dark:hover:bg-emerald-700/20 hover:bg-emerald-50 hover:text-emerald-600 transition" data-value="admin">ADMIN</button>
                            <button type="button" class="dropdown-item text-sm w-full text-left px-4 py-2.5 text-gray-700 dark:text-white/85 dark:hover:bg-emerald-700/20 hover:bg-emerald-50 hover:text-emerald-600 transition" data-value="bpso">BPSO</button>
                            <button type="button" class="dropdown-item text-sm w-full text-left px-4 py-2.5 text-gray-700 dark:text-white/85 dark:hover:bg-emerald-700/20 hover:bg-emerald-50 hover:text-emerald-600 transition" data-value="bdrrm">BDRRM</button>
                            <button type="button" class="dropdown-item text-sm w-full text-left px-4 py-2.5 text-gray-700 dark:text-white/85 dark:hover:bg-emerald-700/20 hover:bg-emerald-50 hover:text-emerald-600 transition" data-value="bfp">BFP</button>
                        </div>
                    </div>
                    <input type="hidden" id="createRole" value="" />
                </div>
            </div>

            <!-- Password -->
            <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    PASSWORD
                </label>
                <div class="flex items-center gap-3">
                    <div class="relative flex-1">
                        <input
                            type="password"
                            id="createPassword"
                            placeholder="Enter or generate a password"
                            class="w-full px-4 py-3 pr-12 bg-[#F1F5F9] dark:bg-neutral-700 rounded-xl text-sm 
                                  border-2 border-transparent focus:border-emerald-400 dark:focus:border-emerald-500
                                  focus:outline-none focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/60
                                  text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500
                                  transition"
                        />
                        <button
                            type="button"
                            onclick="togglePasswordVisibility('createPassword')"
                            class="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-lg transition"
                        >
                            <i class="uil uil-eye text-gray-500 dark:text-gray-400"></i>
                        </button>
                    </div>
                    <button
                        type="button"
                        onclick="generatePassword('createPassword')"
                        class="px-4 py-3 bg-white dark:bg-neutral-700 border-2 border-[#EDEDED] dark:border-neutral-600 
                              rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 
                              hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20
                              transition flex items-center gap-2 whitespace-nowrap shadow-[0_0_20px_rgba(0,0,0,0.10)]"
                    >
                        <i class="uil uil-sync text-emerald-600 dark:text-emerald-400"></i>
                        Generate Password
                    </button>
                </div>
                <p class="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <i class="uil uil-info-circle"></i>
                    Minimum 8 of characters with uppercase, lowercase, and numbers
                </p>
            </div>
        </div>
    `;

  modalManager.create({
    id: "createAccountModal",
    icon: "uil-user-plus",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-50 dark:bg-emerald-900/20",
    title: "Create Account",
    subtitle: "Create an account for admins and emergency responders",
    body: createAccountBody,
    primaryButton: {
      text: "Create Account",
      icon: "uil-user-plus",
      class:
        "bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700",
    },
    secondaryButton: {
      text: "Cancel",
    },
    onPrimary: () => {
      const fullName = document.getElementById("createFullName").value.trim();
      const username = document.getElementById("createUsername").value.trim();
      const role = document.getElementById("createRole").value;
      const password = document.getElementById("createPassword").value;

      if (!fullName || !username || !role || !password) {
        showToast("error", "Please fill in all fields");
        modalManager.setButtonLoading("createAccountModal", "primary", false);
        return false;
      }

      if (password.length < 8) {
        showToast("error", "Password must be at least 8 characters");
        modalManager.setButtonLoading("createAccountModal", "primary", false);
        return false;
      }

      handleCreateAccount();
      return false;
    },
  });

  modalManager.show("createAccountModal");

  // Wire up the role dropdown using the same setupDropdown pattern
  setTimeout(() => {
    setupDropdown(
      "createRoleDropdownButton",
      "createRoleDropdownMenu",
      "createRoleSelectedText",
      "createRoleDropdownIcon",
      (value) => {
        document.getElementById("createRole").value = value;
      },
    );
  }, 0);
}

// Generate username from full name
function generateUsernameFromName(fullName) {
  if (!fullName) return "";

  // Remove special characters and extra spaces
  const cleaned = fullName
    .toLowerCase()
    .trim()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, ".");

  return cleaned;
}

// Handle when user finishes typing full name
async function handleFullNameBlur() {
  const fullNameInput = document.getElementById("createFullName");
  const usernameInput = document.getElementById("createUsername");

  const fullName = fullNameInput.value.trim();

  // Only auto-generate if username is empty
  if (fullName && !usernameInput.value.trim()) {
    const baseUsername = generateUsernameFromName(fullName);

    if (baseUsername) {
      // Find available username
      const availableUsername = await findAvailableUsername(baseUsername);
      usernameInput.value = availableUsername;

      // Trigger availability check
      checkUsernameAvailability();
    }
  }
}

// Find an available username by adding numbers if needed
async function findAvailableUsername(baseUsername) {
  let username = baseUsername;
  let suffix = 1;
  let isAvailable = false;

  // Try base username first
  isAvailable = await checkIfUsernameExists(username);

  // If taken, add numbers until we find available one
  while (isAvailable && suffix <= 99) {
    username = `${baseUsername}${suffix}`;
    isAvailable = await checkIfUsernameExists(username);
    suffix++;
  }

  return username;
}

// Check if username exists in database
async function checkIfUsernameExists(username) {
  try {
    const response = await fetch("api/user_management/check-username.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    const result = await response.json();
    return result.exists;
  } catch (error) {
    console.error("Error checking username:", error);
    return false;
  }
}

// Debounce timer for username checking
let usernameCheckTimeout;

// Check username availability with visual feedback
function checkUsernameAvailability(inputId = "createUsername") {
  const usernameInput = document.getElementById(inputId);
  const statusDiv = document.getElementById("usernameStatus");
  const helpText = document.getElementById("usernameHelp");

  const username = usernameInput.value.trim();

  // Clear previous timeout
  clearTimeout(usernameCheckTimeout);

  if (!username) {
    statusDiv.classList.add("hidden");
    helpText.innerHTML = `
      <i class="uil uil-info-circle"></i>
      Auto-generated from name or enter your own
    `;
    helpText.className =
      "mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1";
    return;
  }

  // Show checking status
  statusDiv.classList.remove("hidden");
  statusDiv.innerHTML = `
    <div class="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-emerald-500"></div>
  `;

  // Debounce the API call
  usernameCheckTimeout = setTimeout(async () => {
    try {
      const exists = await checkIfUsernameExists(username);

      if (exists) {
        // Username taken
        statusDiv.innerHTML = `
          <i class="uil uil-times-circle text-red-500 text-lg"></i>
        `;
        helpText.innerHTML = `
          <i class="uil uil-exclamation-triangle"></i>
          Username already taken, please choose another
        `;
        helpText.className =
          "mt-2 text-xs text-red-500 dark:text-red-400 flex items-center gap-1";
        usernameInput.classList.add("border-red-400", "dark:border-red-500");
        usernameInput.classList.remove("border-transparent");
      } else {
        // Username available
        statusDiv.innerHTML = `
          <i class="uil uil-check-circle text-emerald-500 text-lg"></i>
        `;
        helpText.innerHTML = `
          <i class="uil uil-check-circle"></i>
          Username is available
        `;
        helpText.className =
          "mt-2 text-xs text-emerald-500 dark:text-emerald-400 flex items-center gap-1";
        usernameInput.classList.remove("border-red-400", "dark:border-red-500");
        usernameInput.classList.add("border-transparent");
      }
    } catch (error) {
      console.error("Error checking username:", error);
      statusDiv.classList.add("hidden");
      helpText.innerHTML = `
        <i class="uil uil-info-circle"></i>
        Unable to verify username availability
      `;
      helpText.className =
        "mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1";
    }
  }, 500); // Wait 500ms after user stops typing
}

async function handleCreateAccount() {
  const fullName = document.getElementById("createFullName").value.trim();
  const username = document.getElementById("createUsername").value.trim();
  const role = document.getElementById("createRole").value;
  const password = document.getElementById("createPassword").value;

  // Check username availability one final time
  const exists = await checkIfUsernameExists(username);
  if (exists) {
    showToast("error", "Username is already taken");
    return;
  }

  try {
    const response = await fetch("api/user_management/create-user.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, username, role, password }),
    });

    const result = await response.json();

    if (result.success) {
      showToast("success", "Account created successfully");
      modalManager.close("createAccountModal");
      fetchUsers(); // Refresh the user list
    } else {
      showToast("error", result.error || "Failed to create account");
    }
  } catch (error) {
    console.error("Error creating account:", error);
    showToast("error", "Failed to create account");
  }
}
// ============================================
// EDIT ACCOUNT MODAL
// ============================================
function editUser(userId) {
  const user = allUsers.find((u) => u.userId === userId);
  if (!user) return;

  const initials = getInitials(user.name);
  const roleConfig = getRoleConfig(user.role);

  const editAccountBody = `
    <div class="space-y-0">

      <!-- Profile Card Header -->
      <div class="relative rounded-2xl overflow-hidden mb-5" style="background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #60a5fa 100%)">
        <!-- Decorative circles -->
        <div class="absolute top-[-20px] right-[-20px] w-36 h-36 rounded-full bg-white/10"></div>
        <div class="absolute bottom-[-30px] left-[-10px] w-28 h-28 rounded-full bg-white/10"></div>

        <div class="relative z-10 flex flex-col items-center pt-8 pb-5 px-6">
          <!-- Avatar Upload -->
          <div class="relative group mb-3">
            <div id="userAvatarContainer" class="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden flex items-center justify-center bg-blue-700 text-white font-bold text-2xl cursor-pointer">
              ${
                user.profilePicture
                  ? `<img id="userAvatarPreview" src="${user.profilePicture}" class="w-full h-full object-cover" />`
                  : `<span id="userAvatarInitials">${initials}</span>`
              }
            </div>

            <!-- Camera overlay -->
            <label for="userProfilePicInput" class="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer">
              <div class="text-center">
                <i class="uil uil-camera text-white text-2xl block"></i>
                <span class="text-white text-[10px] font-medium">Change</span>
              </div>
            </label>
            <input type="file" id="userProfilePicInput" accept="image/*" class="hidden" onchange="previewUserProfilePic(event)" />

            <!-- Remove button -->
            <button onclick="removeUserProfilePic('${initials}')" id="removeUserPhotoBtn"
              class="${user.profilePicture ? "flex" : "hidden"} absolute -bottom-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full items-center justify-center shadow-md transition-colors"
              title="Remove photo">
              <i class="uil uil-times text-white text-xs"></i>
            </button>
          </div>

          <!-- Name & Role preview -->
          <h3 id="userNamePreview" class="text-white font-bold text-base tracking-wide">${user.name}</h3>
          <span class="mt-1 px-3 py-0.5 bg-white/20 text-white text-xs rounded-full">${roleConfig.label}</span>
        </div>
      </div>

      <!-- Form Fields -->
      <div class="space-y-4">
        <!-- Full Name -->
        <div>
          <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
            Full Name
          </label>
          <input
            type="text"
            id="editFullName"
            value="${user.name}"
            placeholder="Enter Full Name"
            oninput="document.getElementById('userNamePreview').textContent = this.value || 'Full Name'"
            onkeydown="handleNameKeydown(event)"
  onpaste="handleNamePaste(event)"
            class="w-full px-4 py-2.5 bg-gray-100 dark:bg-neutral-700 border-2 border-transparent
                   focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-neutral-600
                   focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/50
                   rounded-xl text-sm text-gray-800 dark:text-gray-100 transition-all duration-200 placeholder:text-gray-400"
          />
        </div>

        <!-- Username -->
        <div>
          <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
            Username
          </label>
          <div class="relative">
            <input
              type="text"
              id="editUsername"
              value="${user.username}"
              placeholder="@sample.username"
              oninput="checkUsernameAvailability('editUsername')"
              onkeydown="handleUsernameKeydown(event)"
              onpaste="handleUsernamePaste(event)"
              class="w-full px-4 py-2.5 pr-10 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent
                     focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-neutral-600
                     focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/50
                     rounded-xl text-sm text-gray-800 dark:text-gray-100 transition-all duration-200"
            />
            <div id="editUsernameStatus" class="absolute right-3 top-1/2 -translate-y-1/2 hidden"></div>
          </div>
          <p id="editUsernameHelp" class="mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <i class="uil uil-info-circle"></i>
            Username will be validated on change
          </p>
        </div>

        <!-- Role -->
        <div>
          <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
            Role
          </label>
          <div class="relative">
            <select
              id="editRole"
              class="w-full px-4 py-2.5 bg-gray-50 dark:bg-neutral-700 border-2 border-transparent
                     focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-neutral-600
                     focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/50
                     rounded-xl text-sm text-gray-800 dark:text-gray-100 appearance-none cursor-pointer transition-all duration-200"
            >
              <option value="admin"       ${user.role === "admin" ? "selected" : ""}>Admin</option>
              <option value="bpso"        ${user.role === "bpso" ? "selected" : ""}>BPSO</option>
              <option value="bhert"       ${user.role === "bhert" ? "selected" : ""}>BHERT</option>
              <option value="firefighter" ${user.role === "firefighter" ? "selected" : ""}>Firefighter</option>
            </select>
            <i class="uil uil-angle-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
          </div>
        </div>
      </div>
    </div>
  `;

  // Reset state
  window.userProfilePicFile = null;
  window.removeUserPhoto = false;

  modalManager.create({
    id: "editAccountModal",
    icon: "uil-edit-alt",
    iconColor: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-50 dark:bg-blue-900/20",
    title: "Edit Account",
    subtitle: "Update account information for this user",
    body: editAccountBody,
    primaryButton: {
      text: "Update Account",
      icon: "uil-check",
      class:
        "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700",
    },
    secondaryButton: { text: "Cancel" },
    onPrimary: () => {
      const fullName = document.getElementById("editFullName").value.trim();
      const username = document.getElementById("editUsername").value.trim();

      if (!fullName || !username) {
        showToast("error", "Please fill in all fields");
        modalManager.setButtonLoading("editAccountModal", "primary", false);
        return false;
      }

      handleUpdateAccount(userId);
      return false;
    },
  });

  modalManager.show("editAccountModal");
}

// Preview selected photo
function previewUserProfilePic(event) {
  const file = event.target.files[0];
  if (!file) return;

  window.userProfilePicFile = file;
  window.removeUserPhoto = false;

  const reader = new FileReader();
  reader.onload = (e) => {
    const container = document.getElementById("userAvatarContainer");
    container.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover" />`;

    const removeBtn = document.getElementById("removeUserPhotoBtn");
    if (removeBtn) {
      removeBtn.classList.remove("hidden");
      removeBtn.classList.add("flex");
    }
  };
  reader.readAsDataURL(file);
}

// Remove photo — revert to initials
function removeUserProfilePic(initials) {
  const container = document.getElementById("userAvatarContainer");
  container.innerHTML = `<span class="text-2xl font-bold">${initials}</span>`;

  window.userProfilePicFile = null;
  window.removeUserPhoto = true;

  const removeBtn = document.getElementById("removeUserPhotoBtn");
  if (removeBtn) {
    removeBtn.classList.add("hidden");
    removeBtn.classList.remove("flex");
  }

  const input = document.getElementById("userProfilePicInput");
  if (input) input.value = "";
}

// Updated handleUpdateAccount — uses FormData for file support
async function handleUpdateAccount(userId) {
  const fullName = document.getElementById("editFullName").value.trim();
  const username = document.getElementById("editUsername").value.trim();
  const role = document.getElementById("editRole").value;

  if (!fullName || !username) {
    showToast("error", "Please fill in all fields");
    return;
  }

  // Check username only if changed
  const originalUser = allUsers.find((u) => u.userId === userId);
  if (username !== originalUser.username) {
    const exists = await checkIfUsernameExists(username);
    if (exists) {
      showToast("error", "Username is already taken");
      return;
    }
  }

  try {
    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("fullName", fullName);
    formData.append("username", username);
    formData.append("role", role);

    if (window.userProfilePicFile) {
      formData.append("profilePicture", window.userProfilePicFile);
    }
    if (window.removeUserPhoto) {
      formData.append("removePhoto", "1");
    }

    const response = await fetch("api/user_management/update-user.php", {
      method: "POST",
      body: formData, // No Content-Type header — browser sets boundary automatically
    });

    const result = await response.json();

    if (result.success) {
      showToast("success", "Account updated successfully");
      modalManager.close("editAccountModal");
      fetchUsers();
    } else {
      showToast("error", result.error || "Failed to update account");
    }
  } catch (error) {
    console.error("Error updating account:", error);
    showToast("error", "Failed to update account");
  }
}

// ============================================
// CHANGE PASSWORD MODAL
// ============================================
function resetPassword(userId) {
  const user = allUsers.find((u) => u.userId === userId);
  if (!user) return;

  const changePasswordBody = `
        <div class="space-y-4">
            <!-- User Info Banner -->
            <div class="bg-emerald-400 dark:bg-emerald-900/20 rounded-xl p-4 flex items-center gap-3">
                <div class="w-12 h-12 rounded-full border-2 border-white bg-emerald-500 flex items-center justify-center text-white font-semibold">
                    ${getInitials(user.name)}
                </div>
                <div>
                    <p class="text-xs font-medium text-white dark:text-gray-400 uppercase">
                        Changing Password For:
                    </p>
                    <p class="text-sm font-semibold text-white dark:text-gray-100">
                        ${user.name}
                    </p>
                </div>
            </div>

            <!-- New Password -->
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  NEW PASSWORD
              </label>
              <div class="flex items-center gap-3">
                  <div class="relative flex-1">
                      <input
                          type="password"
                          id="newPassword"
                          placeholder="Enter or generate a password"
                          class="w-full px-4 py-3 pr-12 bg-[#F1F5F9] dark:bg-neutral-700 rounded-xl text-sm 
                                border-2 border-transparent focus:border-emerald-400 dark:focus:border-emerald-500
                                focus:outline-none focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/60
                                text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500
                                transition"
                      />
                      <button
                          type="button"
                          onclick="togglePasswordVisibility('newPassword')"
                          class="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-lg transition"
                      >
                          <i class="uil uil-eye text-gray-500 dark:text-gray-400"></i>
                      </button>
                  </div>
                  <button
                      type="button"
                      onclick="generatePassword('newPassword')"
                      class="px-4 py-3 bg-white dark:bg-neutral-700 border-2 border-[#EDEDED] dark:border-neutral-600 
                              rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 
                              hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20
                              transition flex items-center gap-2 whitespace-nowrap shadow-[0_0_20px_rgba(0,0,0,0.10)]"
                  >
                      <i class="uil uil-sync text-emerald-600 dark:text-emerald-400"></i>
                      Generate Password
                  </button>
              </div>
              <p class="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <i class="uil uil-info-circle"></i>
                  Minimum 8 of characters with uppercase, lowercase, and numbers
              </p>
          </div>
        </div>
    `;

  modalManager.create({
    id: "changePasswordModal",
    icon: "uil-key-skeleton",
    iconColor: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-100 dark:bg-purple-900/20",
    title: "Change Password",
    subtitle: "Edit account information for this user",
    body: changePasswordBody,
    primaryButton: {
      text: "Change Password",
      icon: "uil-key-skeleton",
      class:
        "bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700",
    },
    secondaryButton: {
      text: "Cancel",
    },
    onPrimary: () => {
      const newPassword = document.getElementById("newPassword").value;

      if (!newPassword) {
        showToast("error", "Please enter a new password");
        modalManager.setButtonLoading("changePasswordModal", "primary", false);
        return false;
      }

      if (newPassword.length < 8) {
        showToast("error", "Password must be at least 8 characters");
        modalManager.setButtonLoading("changePasswordModal", "primary", false);
        return false;
      }

      handleChangePassword(userId);
      return false;
    },
  });

  modalManager.show("changePasswordModal");
}

async function handleChangePassword(userId) {
  const newPassword = document.getElementById("newPassword").value;

  try {
    const response = await fetch("api/user_management/change-password.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, newPassword }),
    });

    const result = await response.json();

    if (result.success) {
      showToast("success", "Password changed successfully");
      modalManager.close("changePasswordModal");
    } else {
      showToast("error", result.error || "Failed to change password");
    }
  } catch (error) {
    console.error("Error changing password:", error);
    showToast("error", "Failed to change password");
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Toggle password visibility
function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  const icon = input.parentElement.querySelector(".uil-eye");

  if (input.type === "password") {
    input.type = "text";
    icon.classList.remove("uil-eye");
    icon.classList.add("uil-eye-slash");
  } else {
    input.type = "password";
    icon.classList.remove("uil-eye-slash");
    icon.classList.add("uil-eye");
  }
}

// Generate random password
function generatePassword(inputId) {
  const input = document.getElementById(inputId);
  const charset = {
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    numbers: "0123456789",
    symbols: "!@#$%^&*",
  };

  let password = "";

  // Ensure at least one of each required character type
  password +=
    charset.uppercase[Math.floor(Math.random() * charset.uppercase.length)];
  password +=
    charset.lowercase[Math.floor(Math.random() * charset.lowercase.length)];
  password +=
    charset.numbers[Math.floor(Math.random() * charset.numbers.length)];
  password +=
    charset.symbols[Math.floor(Math.random() * charset.symbols.length)];

  // Fill the rest randomly
  const allChars =
    charset.uppercase + charset.lowercase + charset.numbers + charset.symbols;
  for (let i = password.length; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  password = password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");

  input.value = password;
  input.type = "text"; // Show generated password

  // Update icon to eye-slash
  const icon = input.parentElement.querySelector(".uil");
  icon.classList.remove("uil-eye");
  icon.classList.add("uil-eye-slash");
}

function deleteUser(userId) {
  const user = allUsers.find((u) => u.userId === userId);
  if (!user) return;

  modalManager.create({
    id: "deleteModal",
    icon: "uil-trash-alt",
    iconColor: "text-red-600 dark:text-red-400",
    iconBg: "bg-red-100 dark:bg-red-900/20",
    title: "Delete Permanently",
    subtitle: "This action cannot be undone.",
    body: `
            <p class="text-sm text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                Are you sure you want to permanently delete
                <span class="font-semibold text-red-600 dark:text-red-400">${user.name}</span>?
                This user account will be removed forever and cannot be recovered.
            </p>
        `,
    primaryButton: {
      text: "Delete Forever",
      icon: "uil-trash-alt",
      class:
        "bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700",
    },
    secondaryButton: {
      text: "Cancel",
    },
    onPrimary: () => confirmDeleteUser(userId),
  });

  modalManager.show("deleteModal");
}

async function confirmDeleteUser(userId) {
  try {
    const response = await fetch("api/user_management/delete-user.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    const result = await response.json();

    if (result.success) {
      showToast("success", "User deleted successfully");
      modalManager.close("deleteModal");
      fetchUsers(); // Refresh the user list
    } else {
      showToast("error", result.error || "Failed to delete user");
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    showToast("error", "Failed to delete user");
  }
}

function toggleUserStatus(userId) {
  const user = allUsers.find((u) => u.userId === userId);
  if (!user) return;

  // Check if user is currently suspended
  if (user.status === "suspended") {
    // Show unsuspend confirmation
    showUnsuspendModal(user);
  } else {
    // Show suspend modal
    showSuspendModal(user);
  }
}

function showSuspendModal(user) {
  const suspendBody = `
        <div class="space-y-4">
            <!-- User Info Banner -->
            <div class="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 flex items-center gap-3">
                <div class="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold">
                    ${getInitials(user.name)}
                </div>
                <div>
                    <p class="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                        Suspending Account For:
                    </p>
                    <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        ${user.name}
                    </p>
                </div>
            </div>

            <!-- Suspension Duration -->
            <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SUSPENSION DURATION
                </label>
                <div class="relative">
                    <select
                        id="suspensionDuration"
                        class="w-full px-4 py-3 bg-[#f5f4f9] dark:bg-neutral-700 rounded-xl text-sm 
                               border-2 border-transparent focus:border-orange-400 dark:focus:border-orange-500
                               focus:outline-none focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-900/60
                               text-gray-900 dark:text-gray-100
                               appearance-none cursor-pointer transition"
                    >
                        <option value="1day">1 Day</option>
                        <option value="3days">3 Days</option>
                        <option value="1week">1 Week</option>
                        <option value="1month">1 Month</option>
                        <option value="indefinite">Indefinite (Until lifted)</option>
                    </select>
                    <i class="uil uil-angle-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"></i>
                </div>
            </div>

            <!-- Suspension Reason -->
            <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    REASON FOR SUSPENSION
                </label>
                <textarea
                    id="suspensionReason"
                    rows="4"
                    placeholder="Enter the reason for suspending this account..."
                    class="w-full px-4 py-3 bg-[#f5f4f9] dark:bg-neutral-700 rounded-xl text-sm 
                           border-2 border-transparent focus:border-orange-400 dark:focus:border-orange-500
                           focus:outline-none focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-900/60
                           text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500
                           transition resize-none"
                ></textarea>
            </div>

            <!-- Warning Message -->
            <div class="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-3">
                <div class="flex items-start gap-2">
                    <i class="uil uil-exclamation-triangle text-amber-600 dark:text-amber-400 text-lg mt-0.5"></i>
                    <p class="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                        This user will not be able to log in until the suspension is lifted or expires.
                    </p>
                </div>
            </div>
        </div>
    `;

  modalManager.create({
    id: "suspendModal",
    icon: "uil-ban",
    iconColor: "text-orange-600 dark:text-orange-400",
    iconBg: "bg-orange-100 dark:bg-orange-900/20",
    title: "Suspend Account",
    subtitle: "Temporarily restrict access to this account",
    body: suspendBody,
    primaryButton: {
      text: "Suspend Account",
      icon: "uil-ban",
      class:
        "bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700",
    },
    secondaryButton: {
      text: "Cancel",
    },
    onPrimary: () => {
      const reason = document.getElementById("suspensionReason").value.trim();
      if (!reason) {
        showToast("error", "Please provide a reason for suspension");
        modalManager.setButtonLoading("suspendModal", "primary", false); // ← reset
        return false;
      }
      confirmSuspendUser(user.userId);
      return false;
    },
  });

  modalManager.show("suspendModal");
}

async function confirmSuspendUser(userId) {
  const duration = document.getElementById("suspensionDuration").value;
  const reason = document.getElementById("suspensionReason").value.trim();

  try {
    const response = await fetch("api/user_management/suspend-user.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, duration, reason }),
    });

    const result = await response.json();

    if (result.success) {
      showToast("success", "User suspended successfully");
      modalManager.close("suspendModal");
      fetchUsers(); // Refresh the user list
    } else {
      showToast("error", result.error || "Failed to suspend user");
    }
  } catch (error) {
    console.error("Error suspending user:", error);
    showToast("error", "Failed to suspend user");
  }
}

function showUnsuspendModal(user) {
  const unsuspendBody = `
        <div class="space-y-4">
            <!-- User Info Banner -->
            <div class="bg-emerald-100 dark:bg-emerald-900/20 rounded-xl p-4 flex items-center gap-3">
                <div class="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white font-semibold">
                    ${getInitials(user.name)}
                </div>
                <div>
                    <p class="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                        Lifting Suspension For:
                    </p>
                    <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        ${user.name}
                    </p>
                </div>
            </div>

            ${
              user.suspensionReason
                ? `
                <!-- Current Suspension Info -->
                <div class="bg-[#f5f4f9] dark:bg-neutral-700 rounded-xl p-4">
                    <p class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">SUSPENSION REASON:</p>
                    <p class="text-sm text-gray-800 dark:text-gray-200">${
                      user.suspensionReason
                    }</p>
                    ${
                      user.suspendedUntil
                        ? `
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Suspended until: ${formatDate(user.suspendedUntil)}
                        </p>
                    `
                        : ""
                    }
                </div>
            `
                : ""
            }

            <p class="text-sm text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                Are you sure you want to lift the suspension for
                <span class="font-semibold text-emerald-600 dark:text-emerald-400">${
                  user.name
                }</span>?
                They will regain full access to their account immediately.
            </p>
        </div>
    `;

  modalManager.create({
    id: "unsuspendModal",
    icon: "uil-check-circle",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/20",
    title: "Lift Suspension",
    subtitle: "Restore access to this account",
    body: unsuspendBody,
    primaryButton: {
      text: "Lift Suspension",
      icon: "uil-check-circle",
      class:
        "bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700",
    },
    secondaryButton: {
      text: "Cancel",
    },
    onPrimary: () => confirmUnsuspendUser(user.userId),
  });

  modalManager.show("unsuspendModal");
}

async function confirmUnsuspendUser(userId) {
  try {
    const response = await fetch("api/user_management/unsuspend-user.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    const result = await response.json();

    if (result.success) {
      showToast("success", "Suspension lifted successfully");
      modalManager.close("unsuspendModal");
      fetchUsers(); // Refresh the user list
    } else {
      showToast("error", result.error || "Failed to lift suspension");
    }
  } catch (error) {
    console.error("Error lifting suspension:", error);
    showToast("error", "Failed to lift suspension");
  }
}