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

const API_NODES = "api/devices/get_nodes.php";
const API_LORA = "api/devices/lora_devices.php";

let currentTab = "nodes",
  currentView = localStorage.getItem("deviceViewMode") || "grid";
let searchQuery = "",
  selectedFilter = "AllTypes";
let nodeDevices = [],
  loraDevices = [];

let selectedDeviceType = "AllTypes";
let isLoading = true;

async function loadNodeDevices() {
  try {
    const res = await fetch(API_NODES);
    const data = await res.json();
    if (data.success) nodeDevices = data.data;
    else throw new Error(data.message);
  } catch (e) {
    console.error(e);
    showToast("error", "Failed to load keychain devices.");
  }
  renderNodeCards();
}

async function loadLoraDevices() {
  const c = document.getElementById("loraTableContainer");
  renderLoraSkeletonRows(c);
  try {
    const res = await fetch(API_LORA);
    const data = await res.json();
    if (data.success) loraDevices = data.data;
    else throw new Error(data.message);
  } catch (e) {
    console.error(e);
    showToast("error", "Failed to load LoRa devices.");
  }
  renderLoraTable();
}

function switchTab(tab) {
  currentTab = tab;
  const nT = document.getElementById("nodeTab"),
    lT = document.getElementById("loraTab");
  const nS = document.getElementById("nodeSection"),
    lS = document.getElementById("loraSection");
  const on = [
    "border-b-2",
    "border-emerald-500",
    "text-emerald-600",
    "dark:text-emerald-400",
    "font-semibold",
  ];
  const off = ["text-gray-500", "dark:text-neutral-400"];
  if (tab === "nodes") {
    nT.classList.add(...on);
    nT.classList.remove(...off);
    lT.classList.remove(...on);
    lT.classList.add(...off);
    nS.classList.remove("hidden");
    lS.classList.add("hidden");
  } else {
    lT.classList.add(...on);
    lT.classList.remove(...off);
    nT.classList.remove(...on);
    nT.classList.add(...off);
    lS.classList.remove("hidden");
    nS.classList.add("hidden");
    if (!loraDevices.length) loadLoraDevices();
    else renderLoraTable();
  }
}

function batteryBar(level) {
  const p = Math.max(0, Math.min(100, level ?? 0));
  const col =
    p > 60 ? "bg-emerald-500" : p > 20 ? "bg-yellow-400" : "bg-red-500";
  const ico =
    p > 60
      ? "uil-battery-bolt"
      : p > 20
        ? "uil-battery-empty"
        : "uil-battery-slash";
  const tc =
    p > 60 ? "text-emerald-500" : p > 20 ? "text-yellow-400" : "text-red-500";
  return `<div class="flex items-center gap-1.5"><i class="uil ${ico} text-base ${tc}"></i><div class="flex-1 h-1.5 bg-gray-200 dark:bg-neutral-600 rounded-full overflow-hidden w-16"><div class="${col} h-full rounded-full" style="width:${p}%"></div></div><span class="text-xs font-medium text-gray-600 dark:text-neutral-400">${p}%</span></div>`;
}

function statusBadgeNode(s) {
  const c = {
    active:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    inactive: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    unassigned:
      "bg-gray-100 text-gray-600 dark:bg-neutral-700 dark:text-neutral-400",
  };
  const l = {
    active: "Active",
    inactive: "Inactive",
    unassigned: "Unassigned",
  };
  return `<span class="px-2 py-0.5 rounded-full text-xs font-medium ${c[s] || c.unassigned}">${l[s] || s}</span>`;
}

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
        (device.location && device.location.toLowerCase().includes(query)),
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

function renderSkeletonNodes() {
  const c = document.getElementById("devicesContainer");
  c.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
  c.innerHTML = Array(6)
    .fill(0)
    .map(
      () => `
    <div class="bg-white dark:bg-neutral-800 rounded-3xl p-6 border-2 border-transparent shadow-[0_0_24px_rgba(0,0,0,0.10)] animate-pulse">
      <div class="flex items-start gap-3 mb-5">
        <div class="w-11 h-11 bg-gray-300 dark:bg-neutral-700 rounded-xl"></div>
        <div class="flex-1"><div class="h-4 bg-gray-300 dark:bg-neutral-700 rounded w-24 mb-2"></div><div class="h-3 bg-gray-200 dark:bg-neutral-600 rounded w-32"></div></div>
        <div class="h-5 bg-gray-200 dark:bg-neutral-700 rounded-full w-14"></div>
      </div>
      <div class="space-y-3 mb-5">
        ${Array(4)
          .fill(0)
          .map(
            () =>
              `<div class="flex gap-2.5 items-center"><div class="w-7 h-7 bg-gray-200 dark:bg-neutral-700 rounded-lg flex-shrink-0"></div><div class="flex-1"><div class="h-2 bg-gray-200 dark:bg-neutral-700 rounded w-10 mb-1"></div><div class="h-3 bg-gray-300 dark:bg-neutral-600 rounded w-28"></div></div></div>`,
          )
          .join("")}
      </div>
      <div class="flex gap-3"><div class="flex-1 h-9 bg-gray-200 dark:bg-neutral-700 rounded-lg"></div><div class="flex-1 h-9 bg-gray-200 dark:bg-neutral-700 rounded-lg"></div></div>
    </div>`,
    )
    .join("");
}

function renderNodeCards() {
  const container = document.getElementById("devicesContainer");
  let filtered = nodeDevices;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (d) =>
        String(d.device_id).includes(q) ||
        (d.device_name || "").toLowerCase().includes(q) ||
        (d.resident_name || "").toLowerCase().includes(q) ||
        (d.address || "").toLowerCase().includes(q) ||
        (d.contact || "").toLowerCase().includes(q) ||
        (d.status || "").toLowerCase().includes(q),
    );
  }

  const empty = (full) =>
    `<div class="${full ? "col-span-full " : ""}flex flex-col items-center justify-center py-12 text-gray-500 dark:text-neutral-400"><i class="uil uil-search text-6xl mb-4 opacity-50"></i><p class="text-lg font-medium">No devices found</p><p class="text-sm">Try adjusting your search</p></div>`;

  if (currentView === "grid") {
    container.className =
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
    if (!filtered.length) {
      container.innerHTML = empty(true);
      return;
    }
    container.innerHTML = filtered
      .map(
        (d) => `
      <div class="bg-white dark:bg-neutral-800 rounded-3xl p-6 border-2 border-transparent hover:border-emerald-400 shadow-[0_0_24px_rgba(0,0,0,0.10)] hover:shadow-[0_0_26px_rgba(39,194,145,0.36)] transition-all">
        <div class="flex items-start gap-3 mb-5">
          <div class="w-11 h-11 bg-[linear-gradient(141.34deg,#27C291_4.44%,#20A577_95.56%)] rounded-xl flex items-center justify-center flex-shrink-0"><i class="uil uil-mobile-android text-2xl text-white"></i></div>
          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-semibold text-gray-800 dark:text-neutral-200 truncate">${d.device_name || "SafeChain Device"}</h3>
            <p class="text-xs font-mono text-gray-400 dark:text-neutral-500">ID: ${d.device_id}</p>
          </div>
          ${statusBadgeNode(d.status)}
        </div>
        <div class="space-y-2.5 mb-5">
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0"><i class="uil uil-user text-sm text-neutral-500 dark:text-neutral-400"></i></div>
            <div class="min-w-0 flex-1"><p class="text-[10px] text-gray-400 dark:text-neutral-500 uppercase font-medium">Owner</p><p class="text-xs font-semibold text-gray-800 dark:text-neutral-200 truncate">${d.resident_name || "—"}</p></div>
          </div>
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0"><i class="uil uil-location-point text-sm text-neutral-500 dark:text-neutral-400"></i></div>
            <div class="min-w-0 flex-1"><p class="text-[10px] text-gray-400 dark:text-neutral-500 uppercase font-medium">Address</p><p class="text-xs text-gray-700 dark:text-neutral-300 truncate" title="${d.address || ""}">${d.address || "—"}</p></div>
          </div>
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0"><i class="uil uil-battery-bolt text-sm text-neutral-500 dark:text-neutral-400"></i></div>
            <div class="min-w-0 flex-1"><p class="text-[10px] text-gray-400 dark:text-neutral-500 uppercase font-medium mb-0.5">Battery</p>${batteryBar(d.battery)}</div>
          </div>
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0"><i class="uil uil-calendar-alt text-sm text-neutral-500 dark:text-neutral-400"></i></div>
            <div class="min-w-0 flex-1"><p class="text-[10px] text-gray-400 dark:text-neutral-500 uppercase font-medium">Assigned</p><p class="text-xs text-gray-700 dark:text-neutral-300">${d.assigned_at ? new Date(d.assigned_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</p></div>
          </div>
        </div>
        <div class="flex gap-2">
          <button onclick="viewNodeDevice(${d.device_id})" class="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 border-2 border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-emerald-600 hover:border-emerald-400 transition-colors text-xs font-medium"><i class="uil uil-eye"></i> View</button>
          <button onclick="unlinkDevice(${d.device_id})" class="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 border-2 border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-red-500 hover:border-red-400 transition-colors text-xs font-medium"><i class="uil uil-link-broken"></i> Unlink</button>
        </div>
      </div>`,
      )
      .join("");
  } else {
    container.className = "flex flex-col gap-3";
    if (!filtered.length) {
      container.innerHTML = empty(false);
      return;
    }
    container.innerHTML = filtered
      .map(
        (d) => `
      <div class="bg-white dark:bg-neutral-800 rounded-2xl px-5 py-4 border-2 border-transparent hover:border-emerald-400 shadow-[0_0_24px_rgba(0,0,0,0.08)] transition-all">
        <div class="flex items-center gap-5">
          <div class="w-10 h-10 bg-[linear-gradient(141.34deg,#27C291_4.44%,#20A577_95.56%)] rounded-xl flex items-center justify-center flex-shrink-0"><i class="uil uil-mobile-android text-xl text-white"></i></div>
          <div class="w-40 min-w-0 flex-shrink-0">
            <p class="text-sm font-semibold text-gray-800 dark:text-neutral-200 truncate">${d.device_name || "SafeChain Device"}</p>
            <p class="text-xs font-mono text-gray-400 dark:text-neutral-500">ID: ${d.device_id}</p>
          </div>
          <div class="flex-1 min-w-0 hidden sm:block"><p class="text-[10px] text-gray-400 uppercase font-medium">Owner</p><p class="text-xs font-semibold text-gray-800 dark:text-neutral-300 truncate">${d.resident_name || "—"}</p></div>
          <div class="flex-1 min-w-0 hidden md:block"><p class="text-[10px] text-gray-400 uppercase font-medium">Address</p><p class="text-xs text-gray-700 dark:text-neutral-300 truncate" title="${d.address || ""}">${d.address || "—"}</p></div>
          <div class="w-36 flex-shrink-0 hidden lg:block"><p class="text-[10px] text-gray-400 uppercase font-medium mb-0.5">Battery</p>${batteryBar(d.battery)}</div>
          <div class="flex-shrink-0">${statusBadgeNode(d.status)}</div>
          <div class="flex gap-2 flex-shrink-0">
            <button onclick="viewNodeDevice(${d.device_id})" class="flex items-center gap-1.5 py-2 px-4 border border-neutral-300 dark:border-neutral-600 rounded-lg text-gray-600 dark:text-neutral-400 hover:text-emerald-600 hover:border-emerald-400 transition-colors text-xs font-medium"><i class="uil uil-eye"></i> View</button>
            <button onclick="unlinkDevice(${d.device_id})" class="flex items-center gap-1.5 py-2 px-4 border border-neutral-300 dark:border-neutral-600 rounded-lg text-gray-600 dark:text-neutral-400 hover:text-red-500 hover:border-red-400 transition-colors text-xs font-medium"><i class="uil uil-link-broken"></i> Unlink</button>
          </div>
        </div>
      </div>`,
      )
      .join("");
  }
}

function viewNodeDevice(deviceId) {
  const d = nodeDevices.find((n) => n.device_id == deviceId);
  if (!d) return;
  const medHtml = d.medical_conditions?.length
    ? d.medical_conditions
        .map(
          (m) =>
            `<span class="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">${m}</span>`,
        )
        .join(" ")
    : `<span class="text-xs text-gray-400 italic">None on record</span>`;

  modalManager.create({
    id: "viewDeviceModal",
    icon: "uil-mobile-android",
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/60",
    title: "Device Details",
    subtitle: "Keychain device and resident information.",
    body: `
      <div class="space-y-4">
        <div class="bg-[linear-gradient(141.34deg,#27C291_4.44%,#20A577_95.56%)] rounded-2xl p-5 text-white">
          <div class="flex items-center gap-4">
            <div class="bg-white/20 rounded-xl p-2.5 flex-shrink-0"><i class="uil uil-mobile-android text-2xl"></i></div>
            <div class="flex-1 min-w-0">
              <p class="text-xs opacity-80 uppercase font-medium">${d.device_name || "SafeChain Device"}</p>
              <p class="text-base font-bold">Device #${d.device_id}</p>
              ${d.resident_name ? `<p class="text-xs opacity-90 mt-0.5"><i class="uil uil-user mr-1"></i>Linked to ${d.resident_name}</p>` : `<p class="text-xs opacity-70 mt-0.5">Not linked to any resident</p>`}
            </div>
            ${statusBadgeNode(d.status)}
          </div>
        </div>
        <div>
          <p class="text-xs font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-wide mb-2">Device Info</p>
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-gray-50 dark:bg-neutral-700/50 rounded-xl p-3 col-span-2"><p class="text-[10px] text-gray-400 uppercase font-medium mb-1">Bluetooth Remote ID</p><p class="text-xs font-mono font-medium text-gray-800 dark:text-neutral-200 break-all">${d.bt_remote_id || "—"}</p></div>
            <div class="bg-gray-50 dark:bg-neutral-700/50 rounded-xl p-3"><p class="text-[10px] text-gray-400 uppercase font-medium mb-1.5">Battery</p>${batteryBar(d.battery)}</div>
            <div class="bg-gray-50 dark:bg-neutral-700/50 rounded-xl p-3"><p class="text-[10px] text-gray-400 uppercase font-medium mb-1">Assigned Date</p><p class="text-xs font-medium text-gray-800 dark:text-neutral-200">${d.assigned_at ? new Date(d.assigned_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</p></div>
          </div>
        </div>
        ${
          d.resident_id
            ? `
        <div>
          <p class="text-xs font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-wide mb-2">Resident Info</p>
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-gray-50 dark:bg-neutral-700/50 rounded-xl p-3"><p class="text-[10px] text-gray-400 uppercase font-medium mb-1">Full Name</p><p class="text-xs font-semibold text-gray-800 dark:text-neutral-200">${d.resident_name || "—"}</p></div>
            <div class="bg-gray-50 dark:bg-neutral-700/50 rounded-xl p-3"><p class="text-[10px] text-gray-400 uppercase font-medium mb-1">Contact</p><p class="text-xs font-medium text-gray-800 dark:text-neutral-200">${d.contact || "—"}</p></div>
            <div class="bg-gray-50 dark:bg-neutral-700/50 rounded-xl p-3 col-span-2"><p class="text-[10px] text-gray-400 uppercase font-medium mb-1">Address</p><p class="text-xs text-gray-800 dark:text-neutral-200">${d.address || "—"}</p></div>
            <div class="bg-gray-50 dark:bg-neutral-700/50 rounded-xl p-3 col-span-2"><p class="text-[10px] text-gray-400 uppercase font-medium mb-1.5">Medical Conditions</p><div class="flex flex-wrap gap-1.5">${medHtml}</div></div>
          </div>
        </div>`
            : ""
        }
      </div>`,
    primaryButton: {
      text: "Unlink Device",
      icon: "uil-link-broken",
      class:
        "bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30",
    },
    secondaryButton: { text: "Close" },
    onPrimary: () => {
      modalManager.close("viewDeviceModal");
      unlinkDevice(deviceId);
    },
    onSecondary: () => modalManager.close("viewDeviceModal"),
  });
  modalManager.show("viewDeviceModal");
}

function unlinkDevice(deviceId) {
  const d = nodeDevices.find((n) => n.device_id == deviceId);
  if (!d) return;
  modalManager.create({
    id: "unlinkModal",
    icon: "uil-link-broken",
    iconColor: "text-red-600 dark:text-red-400",
    iconBg: "bg-red-100 dark:bg-red-900/60",
    title: "Unlink Device",
    subtitle: `Device #${d.device_id}`,
    showWarning: true,
    warningText:
      "This device will be unlinked from its resident. The device record stays but appears as unassigned.",
    body: `<div class="text-sm text-center space-y-2"><p>Unlink <strong>Device #${d.device_id}</strong>${d.resident_name ? ` from <strong>${d.resident_name}</strong>` : ""}?</p>${d.device_name ? `<p class="text-xs text-gray-500">Label: ${d.device_name}</p>` : ""}</div>`,
    primaryButton: {
      text: "Unlink",
      icon: "uil-link-broken",
      class: "bg-red-600 hover:bg-red-700",
    },
    secondaryButton: { text: "Cancel" },
    onPrimary: async () => {
      try {
        await fetch(API_NODES, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ device_id: deviceId }),
        });
      } catch {}
      const dev = nodeDevices.find((n) => n.device_id == deviceId);
      if (dev) {
        dev.resident_id = null;
        dev.resident_name = null;
        dev.status = "unassigned";
      }
      showToast("success", `Device #${deviceId} unlinked.`);
      modalManager.close("unlinkModal");
      renderNodeCards();
    },
    onSecondary: () => modalManager.close("unlinkModal"),
  });
  modalManager.show("unlinkModal");
}

function renderLoraSkeletonRows(c) {
  c.innerHTML = `<div class="overflow-x-auto animate-pulse"><table class="w-full text-sm"><thead><tr class="border-b border-gray-200 dark:border-neutral-700">${Array(
    8,
  )
    .fill(0)
    .map(
      () =>
        `<th class="py-3 px-4"><div class="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-16"></div></th>`,
    )
    .join("")}</tr></thead><tbody>${Array(4)
    .fill(0)
    .map(
      () =>
        `<tr class="border-b border-gray-100 dark:border-neutral-700/50"><td class="py-4 px-4"><div class="flex items-center gap-3"><div class="w-9 h-9 bg-gray-200 dark:bg-neutral-700 rounded-xl"></div><div><div class="h-3 bg-gray-300 dark:bg-neutral-600 rounded w-20 mb-1.5"></div><div class="h-2.5 bg-gray-200 dark:bg-neutral-700 rounded w-24"></div></div></div></td>${Array(
          6,
        )
          .fill(0)
          .map(
            () =>
              `<td class="py-4 px-4"><div class="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-20"></div></td>`,
          )
          .join(
            "",
          )}<td class="py-4 px-4"><div class="h-8 bg-gray-200 dark:bg-neutral-700 rounded-lg w-24 ml-auto"></div></td></tr>`,
    )
    .join("")}</tbody></table></div>`;
}

function renderLoraTable() {
  const container = document.getElementById("loraTableContainer");
  let filtered = loraDevices;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (d) =>
        (d.id || d.device_id || "").toLowerCase().includes(q) ||
        (d.name || "").toLowerCase().includes(q) ||
        (d.location_label || "").toLowerCase().includes(q) ||
        (d.signal || "").toLowerCase().includes(q) ||
        (d.status || "").toLowerCase().includes(q),
    );
  }
  if (!filtered.length) {
    container.innerHTML = `<div class="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-neutral-500"><i class="uil uil-wifi-router text-6xl mb-4 opacity-40"></i><p class="text-lg font-medium">No LoRa devices found</p><p class="text-sm">Add a gateway or repeater to get started.</p></div>`;
    return;
  }
  const sB = (s) => {
    const c = {
      Excellent:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
      Good: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
      Fair: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
      Weak: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    };
    return `<span class="px-2 py-0.5 rounded-full text-xs font-medium ${c[s] || "bg-gray-100 text-gray-600"}">${s}</span>`;
  };
  const stB = (s) => {
    const c = {
      active:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
      inactive: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
      maintenance:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    };
    return `<span class="px-2 py-0.5 rounded-full text-xs font-medium ${c[s] || "bg-gray-100"}">${s.charAt(0).toUpperCase() + s.slice(1)}</span>`;
  };
  const tB = (t) =>
    t === "gateway"
      ? `<span class="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">Gateway</span>`
      : `<span class="px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">Repeater</span>`;

  container.innerHTML = `<div class="overflow-x-auto"><table class="w-full text-sm">
    <thead><tr class="border-b border-gray-200 dark:border-neutral-700">
      ${["Device", "Type", "Location", "Coordinates", "Signal", "Status", "Last Seen", "Actions"].map((h, i) => `<th class="text-${i === 7 ? "right" : "left"} py-3 px-4 text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide">${h}</th>`).join("")}
    </tr></thead>
    <tbody class="divide-y divide-gray-100 dark:divide-neutral-700/60">
      ${filtered
        .map((d) => {
          const did = d.id || d.device_id;
          return `<tr class="hover:bg-gray-50 dark:hover:bg-neutral-700/40 transition-colors group">
          <td class="py-4 px-4"><div class="flex items-center gap-3"><div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${d.device_type === "gateway" ? "bg-purple-100 dark:bg-purple-900/40" : "bg-cyan-100 dark:bg-cyan-900/40"}"><i class="uil ${d.device_type === "gateway" ? "uil-wifi-router text-purple-600 dark:text-purple-400" : "uil-repeat text-cyan-600 dark:text-cyan-400"} text-lg"></i></div><div><p class="font-semibold text-gray-800 dark:text-neutral-200 text-xs">${did}</p><p class="text-xs text-gray-500 dark:text-neutral-400">${d.name}</p></div></div></td>
          <td class="py-4 px-4">${tB(d.device_type)}</td>
          <td class="py-4 px-4">${d.lat && d.lng ? `<div class="flex items-center gap-1.5"><i class="uil uil-map-marker text-emerald-500"></i><span class="text-xs text-gray-700 dark:text-neutral-300 max-w-[150px] truncate" title="${d.location_label || ""}">${d.location_label || ""}</span></div>` : `<span class="text-xs text-gray-400 dark:text-neutral-500 italic">Not pinned</span>`}</td>
          <td class="py-4 px-4">${d.lat && d.lng ? `<span class="font-mono text-xs text-gray-600 dark:text-neutral-400">${parseFloat(d.lat).toFixed(5)}, ${parseFloat(d.lng).toFixed(5)}</span>` : `<span class="text-gray-400 text-xs">—</span>`}</td>
          <td class="py-4 px-4">${sB(d.signal)}</td>
          <td class="py-4 px-4">${stB(d.status)}</td>
          <td class="py-4 px-4 text-xs text-gray-500 dark:text-neutral-400">${d.last_seen || "—"}</td>
          <td class="py-4 px-4"><div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onclick="openPinLocationModal('${did}')" class="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-emerald-400 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"><i class="uil uil-map-marker-plus"></i> Pin</button>
            <button onclick="openEditLoraModal('${did}')" class="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-600 text-gray-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"><i class="uil uil-setting"></i> Config</button>
            <button onclick="deactivateLora('${did}')" class="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-red-300 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><i class="uil uil-ban"></i></button>
          </div></td>
        </tr>`;
        })
        .join("")}
    </tbody></table></div>`;
}

let addPinMap = null,
  addPinMarker = null,
  addPinLat = null,
  addPinLng = null;

function openAddLoraModal() {
  addPinLat = null;
  addPinLng = null;
  modalManager.create({
    id: "addLoraModal",
    icon: "uil-plus-circle",
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/60",
    title: "Add LoRa Device",
    subtitle: "Register a new gateway or repeater.",
    body: `<div class="space-y-4">
      <div>
        <label class="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-2 block">Device Type <span class="text-red-500">*</span></label>
        <div class="grid grid-cols-2 gap-3">
          <label class="cursor-pointer"><input type="radio" name="addDeviceType" value="gateway" class="sr-only peer"><div class="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 dark:border-neutral-600 peer-checked:border-purple-500 peer-checked:bg-purple-50 dark:peer-checked:bg-purple-900/20 transition-all"><div class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0"><i class="uil uil-wifi-router text-purple-600 dark:text-purple-400 text-lg"></i></div><div><p class="text-sm font-semibold text-gray-800 dark:text-neutral-200">Gateway</p><p class="text-xs text-gray-500">Main barangay</p></div></div></label>
          <label class="cursor-pointer"><input type="radio" name="addDeviceType" value="repeater" class="sr-only peer" checked><div class="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 dark:border-neutral-600 peer-checked:border-cyan-500 peer-checked:bg-cyan-50 dark:peer-checked:bg-cyan-900/20 transition-all"><div class="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center flex-shrink-0"><i class="uil uil-repeat text-cyan-600 dark:text-cyan-400 text-lg"></i></div><div><p class="text-sm font-semibold text-gray-800 dark:text-neutral-200">Repeater</p><p class="text-xs text-gray-500">Signal extender</p></div></div></label>
        </div>
      </div>
      <div><label class="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 block">Device Name <span class="text-red-500">*</span></label><input type="text" id="addName" placeholder="e.g. Repeater North" class="w-full px-3 py-2.5 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl text-sm text-gray-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 block">Signal Strength</label><select id="addSignal" class="w-full px-3 py-2.5 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl text-sm text-gray-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"><option>Excellent</option><option selected>Good</option><option>Fair</option><option>Weak</option></select></div>
        <div><label class="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 block">Coverage Radius (m)</label><input type="number" id="addCoverage" value="300" min="50" max="2000" class="w-full px-3 py-2.5 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl text-sm text-gray-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"></div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 block">Firmware Version</label><input type="text" id="addFirmware" placeholder="e.g. v2.1.4" class="w-full px-3 py-2.5 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl text-sm text-gray-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"></div>
        <div><label class="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 block">Frequency Band</label><select id="addFrequency" class="w-full px-3 py-2.5 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl text-sm text-gray-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"><option selected>915 MHz</option><option>868 MHz</option><option>433 MHz</option></select></div>
      </div>
      <div><label class="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 block">Installation Date</label><input type="date" id="addInstallDate" value="${new Date().toISOString().split("T")[0]}" class="w-full px-3 py-2.5 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl text-sm text-gray-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"></div>
      <div>
        <label class="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1 block">Pin Location on Map <span class="text-red-500">*</span></label>
        <p class="text-xs text-gray-400 dark:text-neutral-500 mb-2">Click on the map to drop a pin for this device.</p>
        <div id="addPinStatus" class="flex items-center gap-2 mb-2 text-xs text-amber-600 dark:text-amber-400"><i class="uil uil-map-marker text-base"></i><span>No location pinned yet</span></div>
        <div id="addMapEl" class="w-full h-52 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-neutral-600"></div>
        <div class="mt-2"><label class="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1 block">Location Label</label><input type="text" id="addLocationLabel" placeholder="Auto-fills from pin, or type manually" class="w-full px-3 py-2.5 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl text-sm text-gray-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"></div>
      </div>
      <div><label class="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 block">Notes</label><textarea id="addNotes" rows="2" placeholder="Optional remarks..." class="w-full px-3 py-2.5 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl text-sm text-gray-800 dark:text-neutral-200 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"></textarea></div>
    </div>`,
    primaryButton: {
      text: "Add Device",
      icon: "uil-check",
      class: "bg-emerald-600 hover:bg-emerald-700 text-white",
    },
    secondaryButton: { text: "Cancel" },
    onPrimary: () => submitAddDevice(),
    onSecondary: () => {
      modalManager.close("addLoraModal");
      destroyAddMap();
    },
  });
  modalManager.show("addLoraModal");
  setTimeout(() => initAddMap(), 250);
}

function initAddMap() {
  if (addPinMap) {
    addPinMap.remove();
    addPinMap = null;
  }
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const tile = isDark
    ? "https://api.maptiler.com/maps/streets-v2-dark/{z}/{x}/{y}.png?key=2bXjFOI9q9BSiHQVwLb7"
    : "https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=2bXjFOI9q9BSiHQVwLb7";
  addPinMap = L.map("addMapEl").setView([14.7158532, 121.0403842], 15);
  L.tileLayer(tile, { maxZoom: 21, attribution: "© MapTiler" }).addTo(
    addPinMap,
  );
  const pinIcon = L.divIcon({
    className: "",
    html: `<div style="width:32px;height:32px;background:linear-gradient(141deg,#27C291,#20A577);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
  addPinMap.on("click", ({ latlng: { lat, lng } }) => {
    addPinLat = lat;
    addPinLng = lng;
    if (addPinMarker) addPinMap.removeLayer(addPinMarker);
    addPinMarker = L.marker([lat, lng], { icon: pinIcon }).addTo(addPinMap);
    document.getElementById("addPinStatus").innerHTML =
      `<i class="uil uil-check-circle text-base text-emerald-500"></i><span class="text-emerald-600 dark:text-emerald-400">Pinned at ${lat.toFixed(5)}, ${lng.toFixed(5)}</span>`;
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    )
      .then((r) => r.json())
      .then((d) => {
        const el = document.getElementById("addLocationLabel");
        if (el && !el.value)
          el.value = d.display_name.split(",").slice(0, 4).join(",").trim();
      })
      .catch(() => {});
  });
}

function destroyAddMap() {
  if (addPinMap) {
    addPinMap.remove();
    addPinMap = null;
    addPinMarker = null;
  }
  addPinLat = null;
  addPinLng = null;
}

async function submitAddDevice() {
  const name = document.getElementById("addName")?.value.trim();
  const deviceType = document.querySelector(
    'input[name="addDeviceType"]:checked',
  )?.value;
  if (!name) {
    showToast("error", "Device name is required.");
    return;
  }
  if (!deviceType) {
    showToast("error", "Please select a device type.");
    return;
  }
  if (!addPinLat || !addPinLng) {
    showToast("error", "Please pin a location on the map.");
    return;
  }
  const payload = {
    device_type: deviceType,
    name,
    location_label: document.getElementById("addLocationLabel")?.value.trim(),
    lat: addPinLat,
    lng: addPinLng,
    signal: document.getElementById("addSignal")?.value,
    status: "active",
    coverage_radius:
      parseInt(document.getElementById("addCoverage")?.value) || 300,
    firmware: document.getElementById("addFirmware")?.value.trim(),
    frequency: document.getElementById("addFrequency")?.value,
    install_date: document.getElementById("addInstallDate")?.value,
    notes: document.getElementById("addNotes")?.value.trim(),
  };
  try {
    const res = await fetch(API_LORA, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      showToast("success", `Device ${data.device_id} added!`);
      modalManager.close("addLoraModal");
      destroyAddMap();
      loraDevices = [];
      await loadLoraDevices();
    } else showToast("error", data.message || "Failed to add device.");
  } catch {
    showToast("error", "Could not connect to server.");
  }
}

let editPinMap = null,
  editPinMarker = null,
  editPinLat = null,
  editPinLng = null;

function openPinLocationModal(deviceId) {
  const d = loraDevices.find((x) => (x.id || x.device_id) === deviceId);
  if (!d) return;

  editPinLat = d.lat || null;
  editPinLng = d.lng || null;

  modalManager.create({
    id: "pinLocationModal",
    icon: "uil-map-marker-plus",
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/60",
    title: "Update Pin Location",
    subtitle: `${d.name} — ${deviceId}`,
    body: `<div class="space-y-4">
      <div class="flex items-center gap-3 bg-gray-50 dark:bg-neutral-700/50 rounded-xl p-3">
        <i class="uil uil-map-marker text-emerald-500 text-xl"></i>
        <div>
          <p class="text-xs text-gray-500 dark:text-neutral-400">Current Location</p>
          <p class="text-sm font-medium text-gray-800 dark:text-neutral-200">${d.location_label || "Not pinned yet"}</p>
        </div>
      </div>

      <div>
        <p class="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">
          Click on the map to move the pin
        </p>
        <div id="editMapEl" class="w-full h-60 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-neutral-600"></div>
      </div>

      <div id="editPinStatus" class="flex items-center gap-2 text-xs ${d.lat ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}">
        <i class="uil ${d.lat ? "uil-check-circle" : "uil-map-marker"} text-base"></i>
        <span>${d.lat ? `Pinned at ${parseFloat(d.lat).toFixed(5)}, ${parseFloat(d.lng).toFixed(5)}` : "No location — click the map"}</span>
      </div>

      <div>
        <label class="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1 block">
          Location Label
        </label>
        <input type="text" id="editLocationLabel" value="${d.location_label || ""}" placeholder="Address or landmark"
        class="w-full px-3 py-2.5 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl text-sm text-gray-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">
      </div>
    </div>`,
    primaryButton: {
      text: "Save Location",
      icon: "uil-check",
      class: "bg-emerald-600 hover:bg-emerald-700 text-white",
    },
    secondaryButton: { text: "Cancel" },
    onPrimary: () => savePinLocation(deviceId),
    onSecondary: () => {
      modalManager.close("pinLocationModal");
      destroyEditMap();
    },
  });

  modalManager.show("pinLocationModal");
  setTimeout(() => initEditMap(d), 250);
}

function initEditMap(d) {
  if (editPinMap) {
    editPinMap.remove();
    editPinMap = null;
  }

  const center =
    d.lat != null && d.lng != null ? [d.lat, d.lng] : [14.7158532, 121.0403842];

  const isDark = document.documentElement.getAttribute("data-theme") === "dark";

  const tile = isDark
    ? "https://api.maptiler.com/maps/streets-v2-dark/{z}/{x}/{y}.png?key=2bXjFOI9q9BSiHQVwLb7"
    : "https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=2bXjFOI9q9BSiHQVwLb7";

  editPinMap = L.map("editMapEl").setView(center, 16);

  L.tileLayer(tile, {
    maxZoom: 21,
    attribution: "© MapTiler",
  }).addTo(editPinMap);

  const pinIcon = L.divIcon({
    className: "",
    html: `<div style="width:32px;height:32px;background:linear-gradient(141deg,#27C291,#20A577);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

  if (d.lat != null && d.lng != null) {
    editPinMarker = L.marker([d.lat, d.lng], { icon: pinIcon }).addTo(
      editPinMap,
    );
  }

  editPinMap.on("click", ({ latlng: { lat, lng } }) => {
    editPinLat = lat;
    editPinLng = lng;

    if (editPinMarker) editPinMap.removeLayer(editPinMarker);

    editPinMarker = L.marker([lat, lng], { icon: pinIcon }).addTo(editPinMap);

    document.getElementById("editPinStatus").innerHTML =
      `<i class="uil uil-check-circle text-base text-emerald-500"></i>
       <span class="text-emerald-600 dark:text-emerald-400">
       Pinned at ${lat.toFixed(5)}, ${lng.toFixed(5)}
       </span>`;

    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    )
      .then((r) => r.json())
      .then((data) => {
        const el = document.getElementById("editLocationLabel");
        if (el && data.display_name) {
          el.value = data.display_name.split(",").slice(0, 4).join(",").trim();
        }
      })
      .catch(() => {});
  });
}

function destroyEditMap() {
  if (editPinMap) {
    editPinMap.remove();
    editPinMap = null;
    editPinMarker = null;
  }
}

async function savePinLocation(deviceId) {
  if (!editPinLat || !editPinLng) {
    showToast("error", "Please pin a location first.");
    return;
  }
  const label = document.getElementById("editLocationLabel")?.value.trim();
  try {
    const res = await fetch(API_LORA, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        device_id: deviceId,
        lat: editPinLat,
        lng: editPinLng,
        location_label: label,
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
  } catch {}
  const d = loraDevices.find((x) => (x.id || x.device_id) === deviceId);
  if (d) {
    d.lat = editPinLat;
    d.lng = editPinLng;
    d.location_label = label;
  }
  showToast("success", "Location saved!");
  modalManager.close("pinLocationModal");
  destroyEditMap();
  renderLoraTable();
}

function openEditLoraModal(deviceId) {
  const d = loraDevices.find((x) => (x.id || x.device_id) === deviceId);
  if (!d) return;
  modalManager.create({
    id: "editLoraModal",
    icon: "uil-setting",
    iconColor: "text-gray-600 dark:text-neutral-400",
    iconBg: "bg-gray-100 dark:bg-neutral-700",
    title: "Edit Device Config",
    subtitle: `${d.name} — ${deviceId}`,
    body: `<div class="space-y-4">
      <div><label class="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 block">Device Name</label><input type="text" id="editName" value="${d.name}" class="w-full px-3 py-2.5 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl text-sm text-gray-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 block">Signal Strength</label><select id="editSignal" class="w-full px-3 py-2.5 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl text-sm text-gray-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">${["Excellent", "Good", "Fair", "Weak"].map((s) => `<option ${d.signal === s ? "selected" : ""}>${s}</option>`).join("")}</select></div>
        <div><label class="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 block">Status</label><select id="editStatus" class="w-full px-3 py-2.5 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl text-sm text-gray-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">${["active", "inactive", "maintenance"].map((s) => `<option value="${s}" ${d.status === s ? "selected" : ""}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join("")}</select></div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 block">Coverage Radius (m)</label><input type="number" id="editCoverage" value="${d.coverage_radius || 300}" min="50" max="2000" class="w-full px-3 py-2.5 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl text-sm text-gray-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"></div>
        <div><label class="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 block">Firmware</label><input type="text" id="editFirmware" value="${d.firmware || ""}" placeholder="e.g. v2.1.4" class="w-full px-3 py-2.5 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl text-sm text-gray-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"></div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 block">Frequency</label><select id="editFrequency" class="w-full px-3 py-2.5 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl text-sm text-gray-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">${["915 MHz", "868 MHz", "433 MHz"].map((f) => `<option ${d.frequency === f ? "selected" : ""}>${f}</option>`).join("")}</select></div>
        <div><label class="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 block">Install Date</label><input type="date" id="editInstallDate" value="${d.install_date || ""}" class="w-full px-3 py-2.5 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl text-sm text-gray-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"></div>
      </div>
      <div><label class="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 block">Notes</label><textarea id="editNotes" rows="2" class="w-full px-3 py-2.5 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl text-sm text-gray-800 dark:text-neutral-200 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500">${d.notes || ""}</textarea></div>
    </div>`,
    primaryButton: {
      text: "Save Config",
      icon: "uil-check",
      class: "bg-emerald-600 hover:bg-emerald-700 text-white",
    },
    secondaryButton: { text: "Cancel" },
    onPrimary: () => saveDeviceConfig(deviceId),
    onSecondary: () => modalManager.close("editLoraModal"),
  });
  modalManager.show("editLoraModal");
}

async function saveDeviceConfig(deviceId) {
  const payload = {
    device_id: deviceId,
    name: document.getElementById("editName")?.value.trim(),
    signal: document.getElementById("editSignal")?.value,
    status: document.getElementById("editStatus")?.value,
    coverage_radius:
      parseInt(document.getElementById("editCoverage")?.value) || 300,
    firmware: document.getElementById("editFirmware")?.value.trim(),
    frequency: document.getElementById("editFrequency")?.value,
    install_date: document.getElementById("editInstallDate")?.value,
    notes: document.getElementById("editNotes")?.value.trim(),
  };
  try {
    const res = await fetch(API_LORA, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
  } catch {}
  const d = loraDevices.find((x) => (x.id || x.device_id) === deviceId);
  if (d) Object.assign(d, payload);
  showToast("success", "Device config updated!");
  modalManager.close("editLoraModal");
  renderLoraTable();
}

// ============================================
// DEACTIVATE LORA
// ============================================
function deactivateLora(deviceId) {
  const d = loraDevices.find((x) => (x.id || x.device_id) === deviceId);
  if (!d) return;
  modalManager.create({
    id: "deactivateModal",
    icon: "uil-ban",
    iconColor: "text-red-600 dark:text-red-400",
    iconBg: "bg-red-100 dark:bg-red-900/60",
    title: "Deactivate Device",
    subtitle: deviceId,
    showWarning: true,
    warningText:
      "This device will be set to inactive and will no longer relay data.",
    body: `<div class="text-sm text-center"><p class="mb-2">Deactivate <strong>${deviceId}</strong>?</p><p class="text-xs text-gray-500">${d.name}${d.location_label ? " · " + d.location_label : ""}</p></div>`,
    primaryButton: {
      text: "Deactivate",
      icon: "uil-ban",
      class: "bg-red-600 hover:bg-red-700",
    },
    secondaryButton: { text: "Cancel" },
    onPrimary: async () => {
      try {
        await fetch(API_LORA, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ device_id: deviceId }),
        });
      } catch {}
      if (d) d.status = "inactive";
      showToast("success", `${deviceId} deactivated.`);
      modalManager.close("deactivateModal");
      renderLoraTable();
    },
    onSecondary: () => modalManager.close("deactivateModal"),
  });
  modalManager.show("deactivateModal");
}

// ============================================
// SEARCH + DROPDOWN + VIEW MODE
// ============================================
function setupSearch() {
  const input = document.querySelector(
    'input[placeholder="Search devices..."]',
  );
  if (!input) return;
  input.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    currentTab === "nodes" ? renderNodeCards() : renderLoraTable();
  });
}

function setupDropdown() {
  const items = document.querySelectorAll(".dropdown-item");
  const selText = document.getElementById("sortSelectedText");
  const menu = document.getElementById("sortDropdownMenu");
  const icon = document.getElementById("sortDropdownIcon");
  const btn = document.getElementById("sortDropdownButton");
  const active = [
    "bg-emerald-50",
    "border-emerald-500",
    "text-emerald-600",
    "dark:bg-emerald-700/20",
    "dark:border-emerald-700/20",
    "dark:text-emerald-300",
  ];
  items.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      selectedFilter = item.getAttribute("data-value");
      selText.textContent = item.textContent.trim();
      items.forEach((i) => i.classList.remove(...active));
      item.classList.add(...active);
      menu.classList.add("hidden");
      icon.style.transform = "rotate(0deg)";
      currentTab === "nodes" ? renderNodeCards() : renderLoraTable();
    });
  });
  btn?.addEventListener("click", (e) => {
    e.stopPropagation();
    const hidden = menu.classList.contains("hidden");
    menu.classList.toggle("hidden", !hidden);
    icon.style.transform = hidden ? "rotate(180deg)" : "rotate(0deg)";
  });
  document.addEventListener("click", () => {
    menu?.classList.add("hidden");
    if (icon) icon.style.transform = "rotate(0deg)";
  });
}

function setViewMode(mode, rerender = true) {
  currentView = mode;
  localStorage.setItem("deviceViewMode", mode);
  const g = document.getElementById("gridBtn"),
    l = document.getElementById("listBtn");
  const on =
    "p-3 w-[50px] h-[50px] flex items-center justify-center bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors";
  const off =
    "p-3 w-[50px] h-[50px] flex items-center justify-center bg-[#f4f5f9] dark:bg-neutral-700 text-emerald-500 dark:text-neutral-300 rounded-xl hover:bg-gray-50 transition-colors";
  if (mode === "grid") {
    g.className = on;
    l.className = off;
  } else {
    l.className = on;
    g.className = off;
  }
  if (rerender && currentTab === "nodes") {
    renderSkeletonNodes();
    setTimeout(() => renderNodeCards(), 300);
  }
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
    `,
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
    `,
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
                  <div class="font-medium flex flex-col text-xs text-neutral-800 dark:text-neutral-200 min-w-0">
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
                <div class="font-medium flex flex-col text-xs text-neutral-800 dark:text-neutral-200">
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
                <span class="text-xs font-medium">View</span>
              </button>
              <button onclick="deactivateDevice('${
                device.id
              }')" class="flex-1 flex items-center justify-center gap-2 py-1.5 px-3 h-fit bg-transparent border-2 border-neutral-400 rounded-lg text-neutral-500 dark:text-neutral-400 dark:hover:text-red-600 dark:hover:border-red-600 hover:text-red-600 hover:border-red-400 transition-colors">
                <i class="uil uil-ban"></i>
                <span class="text-xs font-medium">Deactivate</span>
              </button>
            </div>
          </div>
        `,
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
                        device.type === "node" ? "uil-user" : "uil-map-marker"
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
        `,
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

  // Check if it's a LoRa Gateway
  if (device.type === "lora") {
    modalManager.create({
      id: "viewGatewayModal",
      icon: "uil-wifi-router",
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/60",
      title: "Gateway Details",
      subtitle: "Detailed information for the selected LoRa gateway.",
      body: `
        <div class="space-y-4">
          <!-- Green Gateway ID Banner -->
          <div class="bg-emerald-500 rounded-2xl p-6 text-white">
            <div class="flex items-center justify-center gap-3">
              <div class="bg-white/20 rounded-xl py-2.5 px-3">
                <i class="uil uil-wifi-router text-2xl"></i>
              </div>
              <div class="flex-1">
                <p class="text-xs font-medium opacity-90">GATEWAY ID</p>
                <p class="text-lg font-semibold">${device.id}</p>
                <div class="flex items-center gap-2 text-xs">
                  <i class="uil uil-map-marker text-base"></i>
                  <span>Located at ${device.location}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Info Grid -->
          <div class="grid grid-cols-2 gap-4">
            <!-- Signal Strength -->
            <div class="bg-[#F1F5F9] dark:bg-neutral-600 rounded-xl p-4">
              <div class="flex items-center gap-2 mb-2">
                <i class="uil uil-signal-alt-3 text-emerald-500"></i>
                <p class="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Signal Strength</p>
              </div>
              <p class="text-sm font-semibold text-gray-900 dark:text-neutral-300">${device.signal}</p>
            </div>

            <!-- Installation Date -->
            <div class="bg-[#F1F5F9] dark:bg-neutral-600 rounded-xl p-4">
              <div class="flex items-center gap-2 mb-2">
                <i class="uil uil-calendar-alt text-emerald-500"></i>
                <p class="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Installation Date</p>
              </div>
              <p class="text-sm font-semibold text-gray-900 dark:text-neutral-300">September 15, 2025</p>
            </div>

            <!-- Coverage Area -->
            <div class="bg-[#F1F5F9] dark:bg-neutral-600 rounded-xl p-4">
              <div class="flex items-center gap-2 mb-2">
                <i class="uil uil-layer-group text-emerald-500"></i>
                <p class="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">Coverage Area</p>
              </div>
              <p class="text-sm font-semibold text-gray-900 dark:text-neutral-300">500m radius</p>
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
              placeholder="Add notes about this gateway..."
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
        console.log("Deactivating gateway:", deviceId);
        modalManager.close("viewGatewayModal");
        deactivateDevice(deviceId);
      },
      onSecondary: () => {
        modalManager.close("viewGatewayModal");
      },
    });

    modalManager.show("viewGatewayModal");
    return;
  }

  // Original node device modal code stays here
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
        <p class="text-xs text-gray-500">${device.type === "node" ? "Owner: " + device.owner : "Location: " + device.location}</p>
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
    'input[placeholder="Search devices..."]',
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

document.addEventListener("DOMContentLoaded", () => {
  setupSearch();
  setupDropdown();
  setViewMode(currentView, false);
  renderSkeletonNodes();
  loadNodeDevices();
});

// Initial render
initialize();
