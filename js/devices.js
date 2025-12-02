// Device data
const devices = [
  {
    id: "SC-KC-001",
    owner: "Juan Dela Cruz",
    status: "Active",
    lastSeen: "2 mins ago",
  },
  {
    id: "SC-KC-002",
    owner: "Maria Santos",
    status: "Active",
    lastSeen: "5 mins ago",
  },
  {
    id: "SC-KC-003",
    owner: "Pedro Reyes",
    status: "Active",
    lastSeen: "1 min ago",
  },
  {
    id: "SC-KC-004",
    owner: "Ana Garcia",
    status: "Active",
    lastSeen: "3 mins ago",
  },
  {
    id: "SC-KC-005",
    owner: "Carlos Mendoza",
    status: "Active",
    lastSeen: "10 mins ago",
  },
  {
    id: "SC-KC-006",
    owner: "Lisa Rodriguez",
    status: "Active",
    lastSeen: "7 mins ago",
  },
];

let currentView = "grid";

function getSignalColor(signal) {
  if (signal === "Strong") return "bg-teal-500";
  if (signal === "Medium") return "bg-yellow-500";
  return "bg-red-500";
}

function getSignalBars(signal) {
  if (signal === "Strong") return 3;
  if (signal === "Medium") return 2;
  return 1;
}

function renderDevices() {
  const container = document.getElementById("devicesContainer");

  if (currentView === "grid") {
    container.className =
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
    container.innerHTML = devices
      .map(
        (device) => `
          <div class="bg-white dark:bg-neutral-800 rounded-3xl p-6 border-2 border-transparent hover:border-emerald-400 shadow-[0_0_24px_rgba(0,0,0,0.10)] hover:shadow-[0_0_26px_rgba(39,194,145,0.36)] transition-all">
            <div class="flex items-start gap-4 mb-6">
              <div class="w-11 h-11 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <i class="uil uil-mobile-android text-2xl text-white"></i>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-semibold text-gray-800 dark:text-neutral-300">${
                  device.id
                }</h3>
                <div class="flex items-center gap-1 text-xs text-gray-400 dark:text-neutral-300 mt-1">
                  <i class="uil uil-user"></i>
                  <span>${device.owner}</span>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-6">
                <div class="flex gap-3 items-center justify-center">
                  <div class="flex items-center gap-2 text-2xl text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700 h-fit px-2 py-1 rounded-lg ">
                    <i class="uil uil-info-circle"></i>
                  </div>
                  <div class="font-medium flex flex-col text-sm text-neutral-800 dark:text-neutral-200">
                  <span class="text-[#64748B]">Status</span>
                  ${device.status}
                  </div>
                </div>

              <div class="flex gap-3 items-center justify-center">
                <div class="flex items-center gap-2 text-2xl text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700 h-fit px-2 py-1 rounded-lg ">
                  <i class="uil uil-clock"></i>
                </div>
                <div class="font-medium flex flex-col text-sm text-neutral-800 dark:text-neutral-200">
                <span class="text-[#64748B]">LAST SEEN</span>
                ${device.lastSeen}
                </div>
              </div>
            </div>

            <div class="flex gap-3">
              <button onclick="viewDevice('${device.id}')" class="flex-1 flex items-center justify-center gap-2 py-1.5 px-3 h-fit bg-transparent border-2 border-neutral-400 rounded-lg text-neutral-500 dark:text-neutral-400 dark:hover:text-emerald-600 hover:text-emerald-600 hover:border-emerald-400 transition-colors">
                <i class="uil uil-eye"></i>
                <span class="text-sm font-medium">View</span>
              </button>
              <button onclick="deactivateDevice('${device.id}')" class="flex-1 flex items-center justify-center gap-2 py-1.5 px-3 h-fit bg-transparent border-2 border-neutral-400 rounded-lg text-neutral-500 dark:text-neutral-400 dark:hover:text-red-600 dark:hover:border-red-600 hover:text-red-600 hover:border-red-400 transition-colors">
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
    container.innerHTML = devices
      .map(
        (device) => `
          <div class="bg-white dark:bg-neutral-800 rounded-3xl p-6 border-2 border-transparent hover:border-emerald-400 shadow-[0_0_24px_rgba(0,0,0,0.10)] hover:shadow-[0_0_26px_rgba(39,194,145,0.36)] transition-shadow">
            <div class="flex items-center gap-6">
              <div class="w-11 h-11 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <i class="uil uil-mobile-android text-2xl text-white"></i>
              </div>
              
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-semibold text-gray-800 dark:text-neutral-300">${
                  device.id
                }</h3>
                <div class="flex items-center gap-1 text-xs text-gray-400 dark:text-neutral-400 mt-1">
                  <i class="uil uil-user"></i>
                  <span>${device.owner}</span>
                </div>
              </div>

              <div class="flex items-center gap-8">
                <div>
                    <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-400 mb-2">
                      <i class="uil uil-info-circle"></i>
                      <span>STATUS</span>
                    </div>
                    <div class="font-medium text-gray-800 text-sm dark:text-neutral-300">${
                      device.status
                    }</div>
                </div>

                <div>
                  <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-400 mb-2">
                    <i class="uil uil-clock"></i>
                    <span>LAST SEEN</span>
                  </div>
                  <div class="font-medium text-gray-800 text-sm dark:text-neutral-300">${
                    device.lastSeen
                  }</div>
                </div>
              </div>

              <div class="flex gap-3 flex-shrink-0">
                <button onclick="viewDevice('${device.id}')" class="flex items-center justify-center gap-2 py-2.5 px-6 bg-transparent border border-neutral-400 rounded-lg text-gray-700 dark:text-neutral-400 dark:hover:text-emerald-600 hover:text-emerald-600 hover:border-emerald-400 transition-colors">
                  <i class="uil uil-eye"></i>
                  <span class="text-sm font-medium">View</span>
                </button>
                <button onclick="deactivateDevice('${device.id}')" class="flex items-center justify-center gap-2 py-2.5 px-6 bg-transparent border border-neutral-400 rounded-lg text-gray-700 dark:text-neutral-400 dark:hover:text-red-600 dark:hover:border-red-600 hover:text-red-600 hover:border-red-400 transition-colors">
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

  const gridBtn = document.getElementById("gridBtn");
  const listBtn = document.getElementById("listBtn");

  if (mode === "grid") {
    gridBtn.className =
      "p-3 w-[50px] h-[50px] flex items-center justify-center bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors";
    listBtn.className =
      "p-3 w-[50px] h-[50px] flex items-center justify-center bg-white dark:bg-neutral-600 dark:text-neutral-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors";
  } else {
    listBtn.className =
      "p-3 w-[50px] h-[50px] flex items-center justify-center bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors";
    gridBtn.className =
      "p-3 w-[50px] h-[50px] flex items-center justify-center bg-white dark:bg-neutral-600 dark:text-neutral-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors";
  }

  renderDevices();
}

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
      class: "bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30",
    },
    secondaryButton: {
      text: "Close",
    },
    onPrimary: () => {
      // Handle deactivation logic here
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
        <p class="text-xs text-gray-500">Owner: ${device.owner}</p>
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

// Initial render
renderDevices();
