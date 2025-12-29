// Device data
const devices = [
  {
    id: "SC-KC-001",
    type: "node",
    owner: "Juan Dela Cruz",
    status: "Active",
    lastSeen: "2 mins ago",
  },
  {
    id: "SC-GW-001",
    type: "lora",
    location: "Maligaya Extension, Gulod, Quezon City",
    signal: "Excellent",
    lastSeen: "5 mins ago",
  },
  {
    id: "SC-KC-003",
    type: "node",
    owner: "Pedro Reyes",
    status: "Active",
    lastSeen: "1 min ago",
  },
  {
    id: "SC-GW-002",
    type: "lora",
    location: "Building A",
    signal: "Good",
    lastSeen: "3 mins ago",
  },
  {
    id: "SC-KC-005",
    type: "node",
    owner: "Carlos Mendoza",
    status: "Active",
    lastSeen: "10 mins ago",
  },
  {
    id: "SC-GW-003",
    type: "lora",
    location: "Barangay Hall",
    signal: "Weak",
    lastSeen: "7 mins ago",
  },
];

let currentView = localStorage.getItem("deviceViewMode") || "grid";
let searchQuery = "";
let selectedDeviceType = "AllTypes";
let isLoading = true;

// Update the getFilteredDevices function to include type filtering
function getFilteredDevices() {
  let filtered = devices;

  // Filter by device type
  if (selectedDeviceType !== "AllTypes") {
    if (selectedDeviceType === "NodeDevice") {
      filtered = filtered.filter((device) => device.type === "node");
    } else if (selectedDeviceType === "LoRaGateway") {
      filtered = filtered.filter((device) => device.type === "lora");
    }
  }

  // Filter by search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (device) =>
        device.id.toLowerCase().includes(query) ||
        (device.owner && device.owner.toLowerCase().includes(query)) ||
        (device.status && device.status.toLowerCase().includes(query)) ||
        (device.location && device.location.toLowerCase().includes(query))
    );
  }

  return filtered;
}

// Add event listeners for dropdown items
document.addEventListener("DOMContentLoaded", () => {
  const dropdownItems = document.querySelectorAll(".dropdown-item");
  const sortSelectedText = document.getElementById("sortSelectedText");
  const sortDropdownMenu = document.getElementById("sortDropdownMenu");
  const sortDropdownButton = document.getElementById("sortDropdownButton");
  const sortDropdownIcon = document.getElementById("sortDropdownIcon");

  dropdownItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();

      // Get the selected value
      const value = item.getAttribute("data-value");
      const text = item.textContent.trim();

      // Update the selected type
      selectedDeviceType = value;
      sortSelectedText.textContent = text;

      // Update active state
      dropdownItems.forEach((i) => {
        i.classList.remove(...activeDropdownClasses);
      });
      item.classList.add(...activeDropdownClasses);

      // Close dropdown
      sortDropdownMenu.classList.add("hidden");
      sortDropdownIcon.style.transform = "rotate(0deg)";

      // Show skeleton loading
      renderSkeletonLoading();

      // Re-render devices with new filter after a short delay
      setTimeout(() => {
        renderDevices();
      }, 500);
    });
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!sortDropdownButton.contains(e.target)) {
      sortDropdownMenu.classList.add("hidden");
      sortDropdownIcon.style.transform = "rotate(0deg)";
    }
  });
});

function handleSearch(event) {
  searchQuery = event.target.value;
  renderDevices();
}

function renderSkeletonLoading() {
  const container = document.getElementById("devicesContainer");

  if (currentView === "grid") {
    container.className =
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
    container.innerHTML = Array(6)
      .fill(0)
      .map(
        () => `
      <div class="bg-white dark:bg-neutral-800 rounded-3xl p-6 border-2 border-transparent shadow-[0_0_24px_rgba(0,0,0,0.10)] animate-pulse">
        <div class="flex items-start gap-4 mb-6">
          <div class="w-11 h-11 bg-gray-300 dark:bg-neutral-700 rounded-xl"></div>
          <div class="flex-1 min-w-0">
            <div class="h-4 bg-gray-300 dark:bg-neutral-700 rounded w-24 mb-2"></div>
            <div class="h-3 bg-gray-200 dark:bg-neutral-600 rounded w-32"></div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="flex gap-3 items-center">
            <div class="w-10 h-10 bg-gray-200 dark:bg-neutral-700 rounded-lg"></div>
            <div class="flex-1">
              <div class="h-3 bg-gray-200 dark:bg-neutral-600 rounded w-12 mb-1"></div>
              <div class="h-4 bg-gray-300 dark:bg-neutral-700 rounded w-16"></div>
            </div>
          </div>
          <div class="flex gap-3 items-center">
            <div class="w-10 h-10 bg-gray-200 dark:bg-neutral-700 rounded-lg"></div>
            <div class="flex-1">
              <div class="h-3 bg-gray-200 dark:bg-neutral-600 rounded w-16 mb-1"></div>
              <div class="h-4 bg-gray-300 dark:bg-neutral-700 rounded w-20"></div>
            </div>
          </div>
        </div>
        <div class="flex gap-3">
          <div class="flex-1 h-9 bg-gray-200 dark:bg-neutral-700 rounded-lg"></div>
          <div class="flex-1 h-9 bg-gray-200 dark:bg-neutral-700 rounded-lg"></div>
        </div>
      </div>
    `
      )
      .join("");
  } else {
    container.className = "flex flex-col gap-4";
    container.innerHTML = Array(6)
      .fill(0)
      .map(
        () => `
      <div class="bg-white dark:bg-neutral-800 rounded-3xl p-6 border-2 border-transparent shadow-[0_0_24px_rgba(0,0,0,0.10)] animate-pulse">
        <div class="flex items-center gap-6">
          <div class="w-11 h-11 bg-gray-300 dark:bg-neutral-700 rounded-xl"></div>
          <div class="flex-1 min-w-0">
            <div class="h-4 bg-gray-300 dark:bg-neutral-700 rounded w-24 mb-2"></div>
            <div class="h-3 bg-gray-200 dark:bg-neutral-600 rounded w-32"></div>
          </div>
          <div class="flex items-center gap-8">
            <div>
              <div class="h-3 bg-gray-200 dark:bg-neutral-600 rounded w-16 mb-2"></div>
              <div class="h-4 bg-gray-300 dark:bg-neutral-700 rounded w-12"></div>
            </div>
            <div>
              <div class="h-3 bg-gray-200 dark:bg-neutral-600 rounded w-20 mb-2"></div>
              <div class="h-4 bg-gray-300 dark:bg-neutral-700 rounded w-16"></div>
            </div>
          </div>
          <div class="flex gap-3">
            <div class="w-24 h-10 bg-gray-200 dark:bg-neutral-700 rounded-lg"></div>
            <div class="w-28 h-10 bg-gray-200 dark:bg-neutral-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    `
      )
      .join("");
  }
}

function renderDevices() {
  const container = document.getElementById("devicesContainer");
  const filteredDevices = getFilteredDevices();

  if (currentView === "grid") {
    container.className =
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";

    if (filteredDevices.length === 0) {
      container.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-12 text-gray-500 dark:text-neutral-400">
          <i class="uil uil-search text-6xl mb-4 opacity-50"></i>
          <p class="text-lg font-medium">No devices found</p>
          <p class="text-sm">Try adjusting your search criteria</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredDevices
      .map(
        (device) => `
          <div class="bg-white dark:bg-neutral-800 rounded-3xl p-6 border-2 border-transparent hover:border-emerald-400 shadow-[0_0_24px_rgba(0,0,0,0.10)] hover:shadow-[0_0_26px_rgba(39,194,145,0.36)] transition-all">
            <div class="flex items-start gap-4 mb-6">
              <div class="w-11 h-11 bg-[linear-gradient(141.34deg,#27C291_4.44%,#20A577_95.56%)] rounded-xl flex items-center justify-center flex-shrink-0">
                <i class="uil ${
                  device.type === "node"
                    ? "uil-mobile-android"
                    : "uil-wifi-router"
                } text-2xl text-white"></i>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-semibold text-gray-800 dark:text-neutral-300">${
                  device.id
                }</h3>
                <div class="flex items-center gap-1 text-xs text-gray-400 dark:text-neutral-300 mt-1">
                  <span>${
                    device.type === "node" ? "Node Device" : "LoRa Gateway"
                  }</span>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-6">
                <div class="flex gap-3 items-center">
                  <div class="flex items-center gap-2 text-2xl text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700 h-fit px-2 py-1 rounded-lg ">
                    <i class="uil ${
                      device.type === "node" ? "uil-user" : "uil-map-marker"
                    }"></i>
                  </div>
                  <div class="font-medium flex flex-col text-sm text-neutral-800 dark:text-neutral-200 min-w-0">
                  <span class="text-[#64748B]">${
                    device.type === "node" ? "OWNER" : "LOCATION"
                  }</span>
                  <span class="truncate">
                    ${device.type === "node" ? device.owner : device.location}
                  </span>
                  
                  </div>
                </div>

              <div class="flex gap-3 items-center">
                <div class="flex items-center gap-2 text-2xl text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700 h-fit px-2 py-1 rounded-lg ">
                  <i class="uil ${
                    device.type === "node"
                      ? "uil-info-circle"
                      : "uil-signal-alt-3"
                  }"></i>
                </div>
                <div class="font-medium flex flex-col text-sm text-neutral-800 dark:text-neutral-200">
                <span class="text-[#64748B]">${
                  device.type === "node" ? "STATUS" : "SIGNAL"
                }</span>
                  ${device.type === "node" ? device.status : device.signal}
                </div>
              </div>
            </div>

            <div class="flex gap-3">
              <button onclick="viewDevice('${
                device.id
              }')" class="flex-1 flex items-center justify-center gap-2 py-1.5 px-3 h-fit bg-transparent border-2 border-neutral-400 rounded-lg text-neutral-500 dark:text-neutral-400 dark:hover:text-emerald-600 hover:text-emerald-600 hover:border-emerald-400 transition-colors">
                <i class="uil uil-eye"></i>
                <span class="text-sm font-medium">View</span>
              </button>
              <button onclick="deactivateDevice('${
                device.id
              }')" class="flex-1 flex items-center justify-center gap-2 py-1.5 px-3 h-fit bg-transparent border-2 border-neutral-400 rounded-lg text-neutral-500 dark:text-neutral-400 dark:hover:text-red-600 dark:hover:border-red-600 hover:text-red-600 hover:border-red-400 transition-colors">
                <i class="uil uil-ban"></i>
                <span class="text-sm font-medium">Deactivate</span>
              </button>
            </div>
          </div>
        `
      )
      .join("");
  } else {
    container.className = "flex flex-col gap-4";

    if (filteredDevices.length === 0) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-neutral-400">
          <i class="uil uil-search text-6xl mb-4 opacity-50"></i>
          <p class="text-lg font-medium">No devices found</p>
          <p class="text-sm">Try adjusting your search criteria</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filteredDevices
      .map(
        (device) => `
          <div class="bg-white dark:bg-neutral-800 rounded-3xl p-6 border-2 border-transparent hover:border-emerald-400 shadow-[0_0_24px_rgba(0,0,0,0.10)] hover:shadow-[0_0_26px_rgba(39,194,145,0.36)] transition-shadow">
            <div class="flex items-center gap-6">
              <div class="w-11 h-11 bg-[linear-gradient(141.34deg,#27C291_4.44%,#20A577_95.56%)] rounded-xl flex items-center justify-center flex-shrink-0">
                <i class="uil ${
                  device.type === "node"
                    ? "uil-mobile-android"
                    : "uil-wifi-router"
                } text-2xl text-white"></i>
              </div>
              
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-semibold text-gray-800 dark:text-neutral-300">${
                  device.id
                }</h3>
                <div class="flex items-center gap-1 text-xs text-gray-400 dark:text-neutral-400 mt-1">
                  <span>${
                    device.type === "node" ? "Node Device" : "LoRa Gateway"
                  }</span>
                </div>
              </div>

              <div class="flex items-center gap-8">
                <div>
                    <div class="flex items-center justify-end gap-2 text-xs text-gray-500 dark:text-neutral-400 mb-2">
                      <i class="uil ${
                        device.type === "node"
                          ? "uil-user"
                          : "uil-map-marker"
                      }"></i>
                      <span>${
                        device.type === "node" ? "OWNER" : "LOCATION"
                      }</span>
                    </div>
                    <div class="font-medium text-gray-800 text-sm dark:text-neutral-300">${
                      device.type === "node" ? device.owner : device.location
                    }</div>
                </div>

                <div>
                    <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-400 mb-2">
                      <i class="uil ${
                        device.type === "node"
                          ? "uil-info-circle"
                          : "uil-signal-alt-3"
                      }"></i>
                      <span>${
                        device.type === "node" ? "STATUS" : "SIGNAL"
                      }</span>
                    </div>
                    <div class="font-medium text-gray-800 text-sm dark:text-neutral-300">${
                      device.type === "node" ? device.status : device.signal
                    }</div>
                </div>
              </div>

              <div class="flex gap-3 flex-shrink-0">
                <button onclick="viewDevice('${
                  device.id
                }')" class="flex items-center justify-center gap-2 py-2.5 px-6 bg-transparent border border-neutral-400 rounded-lg text-gray-700 dark:text-neutral-400 dark:hover:text-emerald-600 hover:text-emerald-600 hover:border-emerald-400 transition-colors">
                  <i class="uil uil-eye"></i>
                  <span class="text-sm font-medium">View</span>
                </button>
                <button onclick="deactivateDevice('${
                  device.id
                }')" class="flex items-center justify-center gap-2 py-2.5 px-6 bg-transparent border border-neutral-400 rounded-lg text-gray-700 dark:text-neutral-400 dark:hover:text-red-600 dark:hover:border-red-600 hover:text-red-600 hover:border-red-400 transition-colors">
                  <i class="uil uil-ban"></i>
                  <span class="text-sm font-medium">Deactivate</span>
                </button>
              </div>
            </div>
          </div>
        `
      )
      .join("");
  }
}

function setViewMode(mode) {
  currentView = mode;
  localStorage.setItem("deviceViewMode", mode);

  const gridBtn = document.getElementById("gridBtn");
  const listBtn = document.getElementById("listBtn");

  if (mode === "grid") {
    gridBtn.className =
      "p-3 w-[50px] h-[50px] flex items-center justify-center bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors";
    listBtn.className =
      "p-3 w-[50px] h-[50px] flex items-center justify-center bg-[#f4f5f9] dark:bg-neutral-700 text-emerald-500 dark:text-neutral-300 rounded-xl hover:bg-gray-50 transition-colors";
  } else {
    listBtn.className =
      "p-3 w-[50px] h-[50px] flex items-center justify-center bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors";
    gridBtn.className =
      "p-3 w-[50px] h-[50px] flex items-center justify-center bg-[#f4f5f9] dark:bg-neutral-700 text-emerald-500 dark:text-neutral-300 rounded-xl hover:bg-gray-50 transition-colors";
  }

  // Show skeleton loading when switching views
  renderSkeletonLoading();

  // Render actual devices after a short delay
  setTimeout(() => {
    renderDevices();
  }, 300);
}

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

function viewDevice(deviceId) {
  const device = devices.find((d) => d.id === deviceId);
  if (!device) return;

  modalManager.create({
    id: "viewDeviceModal",
    icon: "uil-mobile-android",
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/60",
    title: "Device Details",
    subtitle: "Detailed information for the selected keychain device.",
    body: `
      <div class="space-y-4">
        <!-- Green Device ID Banner -->
        <div class="bg-emerald-500 rounded-2xl p-6 text-white">
          <div class="flex items-center justify-center gap-3">
            <div class="bg-white/20 rounded-xl py-2.5 px-3">
              <i class="uil uil-mobile-android text-2xl"></i>
            </div>
            <div class="flex-1">
              <p class="text-xs font-medium opacity-90">DEVICE ID</p>
              <p class="text-lg font-semibold">${device.id}</p>
              <div class="flex items-center gap-2 text-xs">
                <i class="uil uil-user text-base"></i>
                <span>Linked to ${device.owner}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Info Grid -->
        <div class="grid grid-cols-2 gap-4">
          <!-- Assigned Date -->
          <div class="bg-[#F1F5F9] dark:bg-neutral-600 rounded-xl p-4">
            <div class="flex items-center gap-2 mb-2">
              <i class="uil uil-calendar-alt text-emerald-500"></i>
              <p class="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Assigned Date</p>
            </div>
            <p class="text-sm font-semibold text-gray-900 dark:text-neutral-300">October 19, 2025</p>
          </div>

          <!-- Contact Number -->
          <div class="bg-[#F1F5F9] dark:bg-neutral-600 rounded-xl p-4">
            <div class="flex items-center gap-2 mb-2">
              <i class="uil uil-phone text-emerald-500"></i>
              <p class="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Contact Number</p>
            </div>
            <p class="text-sm font-semibold text-gray-900 dark:text-neutral-300">+63 912 345 6789</p>
          </div>

          <!-- Address -->
          <div class="bg-[#F1F5F9] dark:bg-neutral-600 rounded-xl p-4">
            <div class="flex items-center gap-2 mb-2">
              <i class="uil uil-location-point text-emerald-500"></i>
              <p class="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Address</p>
            </div>
            <p class="text-sm font-semibold text-gray-900 dark:text-neutral-300">123 Forest Hill</p>
          </div>

          <!-- Last Seen -->
          <div class="bg-[#F1F5F9] dark:bg-neutral-600 rounded-xl p-4">
            <div class="flex items-center gap-2 mb-2">
              <i class="uil uil-clock text-emerald-500"></i>
              <p class="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Last Seen</p>
            </div>
            <p class="text-sm font-semibold text-gray-900 dark:text-neutral-300">${device.lastSeen}</p>
          </div>
        </div>

        <!-- Notes Section -->
        <div>
          <p class="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase mb-2">NOTES</p>
          <textarea 
            class="w-full h-24 px-4 py-3 bg-white dark:bg-neutral-600 dark:border-neutral-700 border-2 border-[#D5E7F9] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            placeholder="Add notes about this device..."
          ></textarea>
        </div>
      </div>
    `,
    primaryButton: {
      text: "Deactivate",
      icon: "uil-ban",
      class:
        "bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30",
    },
    secondaryButton: {
      text: "Close",
    },
    onPrimary: () => {
      console.log("Deactivating device:", deviceId);
      modalManager.close("viewDeviceModal");
      deactivateDevice(deviceId);
    },
    onSecondary: () => {
      modalManager.close("viewDeviceModal");
    },
  });

  modalManager.show("viewDeviceModal");
}

function deactivateDevice(deviceId) {
  const device = devices.find((d) => d.id === deviceId);
  if (!device) return;

  modalManager.create({
    id: "deactivateModal",
    icon: "uil-ban",
    iconColor: "text-red-600 dark:text-red-400",
    iconBg: "bg-red-100 dark:bg-red-900/60",
    title: "Deactivate Device",
    subtitle: deviceId,
    showWarning: true,
    warningText:
      "This device will be disconnected and will no longer send or receive data.",
    body: `
      <div class="text-sm text-center">
        <p class="mb-3">Are you sure you want to deactivate <strong>${device.id}</strong>?</p>
        <p class="text-xs text-gray-500">${device.type === "node" ? "Owner: " + device.owner : "Location: " + device.location }</p>
      </div>
    `,
    primaryButton: {
      text: "Deactivate",
      icon: "uil-ban",
      class: "bg-red-600 hover:bg-red-700",
    },
    secondaryButton: {
      text: "Cancel",
    },
    onPrimary: () => {
      console.log("Deactivating device:", deviceId);
      modalManager.close("deactivateModal");
      // Add your deactivation logic here
    },
    onSecondary: () => {
      modalManager.close("deactivateModal");
    },
  });

  modalManager.show("deactivateModal");
}

// Initialize on page load
function initialize() {
  // Show skeleton loading
  renderSkeletonLoading();

  // Set up search input listener
  const searchInput = document.querySelector(
    'input[placeholder="Search devices..."]'
  );
  if (searchInput) {
    searchInput.addEventListener("input", handleSearch);
  }

  // Simulate loading delay
  setTimeout(() => {
    isLoading = false;
    renderDevices();
    // Set initial view mode buttons
    setViewMode(currentView);
  }, 800);
}

// Initial render
initialize();
