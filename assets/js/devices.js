// assets/js/devices.js
// Dynamic device management — fetches from PHP API (session auth)
// Add LoRa modal uses Leaflet + Nominatim reverse geocoding

const API = "api/devices/index.php";

let allDevices = { nodes: [], lora: [] };
let currentView = localStorage.getItem("deviceViewMode") || "grid";
let searchQuery = "";
let selectedType = "AllTypes";

let devicePage = 1;
const deviceItemsPerPage = 9;

// Map state
let loraMap = null;
let loraMarker = null;
let pickedLat = null;
let pickedLng = null;

// ─────────────────────────────────────────────────────────────────────────────
// FETCH
// ─────────────────────────────────────────────────────────────────────────────
async function fetchDevices() {
  renderSkeletonLoading();
  try {
    const res = await fetch(`${API}?action=list`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    allDevices = { nodes: json.data.nodes, lora: json.data.lora };
    updateStats(json.data.stats);
    renderDevices();
  } catch (err) {
    console.error("[Devices]", err);
    document.getElementById("devicesContainer").innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-16 text-red-400">
        <i class="uil uil-exclamation-triangle text-5xl mb-3 opacity-60"></i>
        <p class="font-medium">Failed to load devices</p>
        <button onclick="fetchDevices()" class="mt-3 text-sm text-emerald-600 hover:underline">Retry</button>
      </div>`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────────────────────
function updateStats(s) {
  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  };
  set("statTotal", s.total);
  set("statNodes", s.total_nodes);
  set("statLora", s.total_lora);
  set("statGateways", s.active_gateways);
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTER
// ─────────────────────────────────────────────────────────────────────────────
function getFiltered() {
  const q = searchQuery.toLowerCase();

  let nodes = allDevices.nodes.map((d) => ({ ...d, _kind: "node" }));
  let lora = allDevices.lora.map((d) => ({ ...d, _kind: "lora" }));

  if (selectedType === "NodeDevice") lora = [];
  if (selectedType === "Gateway") {
    nodes = [];
    lora = lora.filter((d) => d.device_type === "gateway");
  }
  if (selectedType === "Repeater") {
    nodes = [];
    lora = lora.filter((d) => d.device_type === "repeater");
  }

  const all = [...nodes, ...lora];
  if (!q) return all;

  return all.filter((d) =>
    [
      d.device_id,
      d.device_name,
      d.owner_name,
      d.location_label,
      d.signal,
      d.status,
      d.address,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q),
  );
}

function handleSearch(e) {
  searchQuery = e.target.value;
  devicePage = 1;
  renderDevices();
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const signalColor = (s) =>
  ({
    Excellent: "text-emerald-600",
    Good: "text-blue-500",
    Fair: "text-yellow-500",
    Weak: "text-red-500",
  })[s] || "text-gray-400";

const statusPill = (s) =>
  ({
    active: `<span class="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">Active</span>`,
    inactive: `<span class="text-xs font-medium text-red-500 bg-red-50 dark:bg-red-900/40 px-2 py-0.5 rounded-full">Inactive</span>`,
    maintenance: `<span class="text-xs font-medium text-yellow-600 bg-yellow-50 dark:bg-yellow-900/40 px-2 py-0.5 rounded-full">Maintenance</span>`,
  })[s] || "";

const batteryColor = (b) =>
  b > 60 ? "text-emerald-500" : b > 20 ? "text-yellow-500" : "text-red-500";

function infoBox(icon, label, value) {
  return `
    <div class="bg-[#F1F5F9] dark:bg-neutral-600 rounded-xl p-3">
      <div class="flex items-center gap-2 mb-1">
        <i class="uil ${icon} text-emerald-500 text-base"></i>
        <p class="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">${label}</p>
      </div>
      <p class="text-sm font-semibold text-gray-900 dark:text-neutral-300 truncate" title="${value}">${value}</p>
    </div>`;
}

// Safely encode device data for inline onclick
function enc(d) {
  return encodeURIComponent(JSON.stringify(d));
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER
// ─────────────────────────────────────────────────────────────────────────────
function renderDevices() {
  const container = document.getElementById("devicesContainer");
  const filtered = getFiltered();
  const totalPages = Math.ceil(filtered.length / deviceItemsPerPage);
  const startIndex = (devicePage - 1) * deviceItemsPerPage;
  const pageData = filtered.slice(startIndex, startIndex + deviceItemsPerPage);

  const empty = `
    <div class="${currentView === "grid" ? "col-span-full" : ""} flex flex-col items-center justify-center py-16 text-gray-400 dark:text-neutral-500">
      <i class="uil uil-search text-6xl mb-4 opacity-30"></i>
      <p class="text-lg font-medium">No devices found</p>
      <p class="text-sm">Try adjusting your search or filter</p>
    </div>`;

  container.style.opacity = "0";

  setTimeout(() => {
    if (currentView === "grid") {
      container.className =
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
      container.innerHTML = pageData.length
        ? pageData.map(gridCard).join("")
        : empty;
    } else {
      container.className = "flex flex-col gap-4";
      container.innerHTML = pageData.length
        ? pageData.map(listCard).join("")
        : empty;
    }
    container.style.opacity = "1";
    renderDevicePagination(totalPages);
  }, 800);
}

function renderDevicePagination(totalPages) {
  const paginationContainer = document.getElementById("devicePagination");
  if (!paginationContainer) return;

  if (totalPages <= 1) {
    paginationContainer.innerHTML = "";
    return;
  }

  let html = `
    <button onclick="changeDevicePage(${devicePage - 1})"
      class="w-9 h-9 flex items-center justify-center rounded-full bg-[#F1F5F9] dark:bg-neutral-700 text-gray-600 dark:text-neutral-400 hover:bg-emerald-50 hover:text-emerald-500 dark:hover:bg-emerald-700/20 transition-colors shadow-sm ${devicePage === 1 ? "opacity-50 cursor-not-allowed" : ""}"
      ${devicePage === 1 ? "disabled" : ""}>
      <i class="uil uil-angle-left text-xl"></i>
    </button>
    <div class="bg-[#F1F5F9] dark:bg-neutral-700 rounded-full p-1 flex items-center gap-1">`;

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      html += `
        <button onclick="changeDevicePage(${i})"
          class="w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
            devicePage === i
              ? "bg-emerald-500 text-white shadow-md"
              : "text-neutral-700 dark:text-neutral-400 hover:bg-emerald-50 hover:text-emerald-500 dark:hover:bg-emerald-700/20"
          }">
          ${i}
        </button>`;
    }
  } else {
    html += `
      <button onclick="changeDevicePage(1)"
        class="w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
          devicePage === 1
            ? "bg-emerald-500 text-white shadow-md"
            : "text-neutral-700 dark:text-neutral-400 hover:bg-emerald-50 hover:text-emerald-500 dark:hover:bg-emerald-700/20"
        }">1</button>`;

    if (devicePage > 3)
      html += `<span class="px-2 text-gray-500 font-medium text-sm">...</span>`;

    let start = Math.max(2, devicePage - 1);
    let end = Math.min(totalPages - 1, devicePage + 1);
    if (devicePage <= 3) end = 4;
    if (devicePage >= totalPages - 2) start = totalPages - 3;

    for (let i = start; i <= end; i++) {
      html += `
        <button onclick="changeDevicePage(${i})"
          class="w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
            devicePage === i
              ? "bg-emerald-500 text-white shadow-md"
              : "text-neutral-700 dark:text-neutral-400 hover:bg-emerald-50 hover:text-emerald-500 dark:hover:bg-emerald-700/20"
          }">
          ${i}
        </button>`;
    }

    if (devicePage < totalPages - 2)
      html += `<span class="px-2 text-gray-500 font-medium text-sm">...</span>`;

    html += `
      <button onclick="changeDevicePage(${totalPages})"
        class="w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
          devicePage === totalPages
            ? "bg-emerald-500 text-white shadow-md"
            : "text-neutral-700 dark:text-neutral-400 hover:bg-emerald-50 hover:text-emerald-500 dark:hover:bg-emerald-700/20"
        }">${totalPages}</button>`;
  }

  html += `
    </div>
    <button onclick="changeDevicePage(${devicePage + 1})"
      class="w-9 h-9 flex items-center justify-center rounded-full bg-[#F1F5F9] dark:bg-neutral-700 text-gray-600 dark:text-neutral-400 hover:bg-emerald-50 hover:text-emerald-500 dark:hover:bg-emerald-700/20 transition-colors shadow-sm ${devicePage === totalPages ? "opacity-50 cursor-not-allowed" : ""}"
      ${devicePage === totalPages ? "disabled" : ""}>
      <i class="uil uil-angle-right text-xl"></i>
    </button>`;

  paginationContainer.innerHTML = html;
}

function changeDevicePage(page) {
  const totalPages = Math.ceil(getFiltered().length / deviceItemsPerPage);
  if (page < 1 || page > totalPages) return;
  devicePage = page;
  renderDevices();
}

function gridCard(d) {
  const isNode = d._kind === "node";
  const iconEl = isNode
    ? `<i class="uil uil-mobile-android text-2xl text-white"></i>`
    : d.device_type === "gateway"
      ? `<i class="uil uil-wifi-router text-2xl text-white"></i>`
      : `<svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
     <!-- Center dot -->
    <circle cx="12" cy="11" r="1.5"/>
    <!-- Vertical line -->
    <path d="M12 12.5 L12 17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    <!-- Inner waves -->
    <path d="M9.5 8.5a3.5 3.5 0 0 0 0 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    <path d="M14.5 8.5a3.5 3.5 0 0 1 0 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    <!-- Outer waves -->
    <path d="M7 6a6.5 6.5 0 0 0 0 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    <path d="M17 6a6.5 6.5 0 0 1 0 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>
   </svg>`;
  const typeLabel = isNode
    ? "Node Device"
    : d.device_type === "gateway"
      ? "LoRa Gateway"
      : "LoRa Repeater";
  const col1Lbl = isNode ? "OWNER" : "LOCATION";
  const col1Icon = isNode ? "uil-user" : "uil-map-marker";
  const col1Val = isNode
    ? d.owner_name || "Unassigned"
    : d.location_label || "—";
  const col2Lbl = isNode ? "BATTERY" : "SIGNAL";
  const col2Icon = isNode ? "uil-battery-bolt" : "uil-signal-alt-3";
  const col2Val = isNode
    ? `<span class="${batteryColor(d.battery)}">${d.battery ?? "—"}%</span>`
    : `<span class="${signalColor(d.signal)}">${d.signal || "—"}</span>`;
  const data = enc(d);

  const isInactive = d.status === "inactive";
  const actionBtn = isInactive
    ? `<button onclick="confirmReactivate(decodeURIComponent('${data}'))"
      class="flex-1 flex items-center justify-center gap-2 py-1.5 px-3 bg-transparent border-2 border-neutral-400 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-emerald-600 hover:border-emerald-400 transition-colors">
      <i class="uil uil-refresh"></i><span class="text-xs font-medium">Reactivate</span>
    </button>`
    : `<button onclick="confirmDeactivate(decodeURIComponent('${data}'))"
      class="flex-1 flex items-center justify-center gap-2 py-1.5 px-3 bg-transparent border-2 border-neutral-400 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-red-600 hover:border-red-400 transition-colors">
      <i class="uil uil-ban"></i><span class="text-xs font-medium">Deactivate</span>
    </button>`;

  return `
    <div class="bg-white dark:bg-neutral-800 rounded-3xl p-6 border-2 border-transparent hover:border-emerald-400 shadow-[0_0_24px_rgba(0,0,0,0.10)] hover:shadow-[0_0_26px_rgba(39,194,145,0.36)] transition-all">
      <div class="flex items-start gap-4 mb-6">
        <div class="w-11 h-11 bg-[linear-gradient(141.34deg,#27C291_4.44%,#20A577_95.56%)] rounded-xl flex items-center justify-center flex-shrink-0">
          ${iconEl}
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-neutral-300">${d.device_id}</h3>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-xs text-gray-400 dark:text-neutral-400">${typeLabel}</span>
            ${!isNode ? statusPill(d.status) : ""}
          </div>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="flex gap-3 items-center">
          <div class="flex items-center text-xl text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded-lg">
            <i class="uil ${col1Icon}"></i>
          </div>
          <div class="flex flex-col text-xs text-neutral-800 dark:text-neutral-200 min-w-0">
            <span class="text-[#64748B]">${col1Lbl}</span>
            <span class="truncate font-medium">${col1Val}</span>
          </div>
        </div>
        <div class="flex gap-3 items-center">
          <div class="flex items-center text-xl text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded-lg">
            <i class="uil ${col2Icon}"></i>
          </div>
          <div class="flex flex-col text-xs text-neutral-800 dark:text-neutral-200">
            <span class="text-[#64748B]">${col2Lbl}</span>
            <span class="font-medium">${col2Val}</span>
          </div>
        </div>
      </div>
        <div class="flex gap-3">
          <button onclick="viewDevice(decodeURIComponent('${data}'))"
            class="flex-1 flex items-center justify-center gap-2 py-1.5 px-3 bg-transparent border-2 border-neutral-400 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-emerald-600 hover:border-emerald-400 transition-colors">
            <i class="uil uil-eye"></i><span class="text-xs font-medium">View</span>
          </button>
          ${
            !isNode
              ? `
          <button onclick="openEditLoraModal(decodeURIComponent('${data}'))"
            class="flex-1 flex items-center justify-center gap-2 py-1.5 px-3 bg-transparent border-2 border-neutral-400 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-blue-600 hover:border-blue-400 transition-colors">
            <i class="uil uil-edit"></i><span class="text-xs font-medium">Edit</span>
          </button>`
              : actionBtn
          }
        </div>
    </div>`;
}

function confirmReactivate(raw) {
  const d = typeof raw === "string" ? JSON.parse(raw) : raw;

  modalManager.create({
    id: "reactivateModal",
    icon: "uil-refresh",
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/60",
    title: "Reactivate Device",
    subtitle: d.device_id,
    body: `
      <div class="text-sm text-center">
        <p class="mb-2">Are you sure you want to reactivate <strong>${d.device_id}</strong>?</p>
        <p class="text-xs text-gray-500">Name: ${d.name}</p>
      </div>`,
    primaryButton: {
      text: "Reactivate",
      icon: "uil-refresh",
      class: "bg-emerald-500 hover:bg-emerald-600",
    },
    secondaryButton: { text: "Cancel" },
    onPrimary: () => {
      doReactivateLora(d.id);
      return false;
    },
    onSecondary: () => modalManager.close("reactivateModal"),
  });
  modalManager.show("reactivateModal");
}

async function doReactivateLora(id) {
  try {
    const res = await fetch(`${API}?action=reactivate-lora`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const json = await res.json();
    if (json.success) {
      modalManager.close("reactivateModal");
      showToast("success", "Device reactivated");
      fetchDevices();
    } else {
      showToast("error", json.message || "Failed to reactivate");
      modalManager.setButtonLoading("reactivateModal", "primary", false);
    }
  } catch {
    showToast("error", "Network error");
    modalManager.setButtonLoading("reactivateModal", "primary", false);
  }
}

function openEditLoraModal(raw) {
  const d = typeof raw === "string" ? JSON.parse(raw) : raw;

  pickedLat = d.lat ? parseFloat(d.lat) : null;
  pickedLng = d.lng ? parseFloat(d.lng) : null;

  const customDropdown = (id, options, defaultVal) => {
    const activeOpt = options.find((o) => o.value === defaultVal) || options[0];
    return `
      <div class="relative" id="${id}Wrapper">
        <button type="button" id="${id}Btn"
          class="w-full bg-[#F1F5F9] dark:bg-neutral-700 h-[43.2px] rounded-xl px-3 py-2.5 border-2 border-transparent text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-emerald-400 transition">
          <span id="${id}Text" class="text-sm text-gray-700 dark:text-neutral-300 flex items-center gap-2">
            ${activeOpt.label}
          </span>
          <i id="${id}Icon" class="uil uil-angle-down text-xl text-gray-400 dark:text-gray-300 transition-transform duration-200"></i>
        </button>
        <div id="${id}Menu"
          class="hidden absolute z-[99999] w-full mt-1 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl shadow-lg overflow-hidden">
          <div class="py-1">
            ${options
              .map(
                (o) => `
              <button type="button"
                class="${id}-option text-sm w-full text-left px-4 py-2.5 flex items-center gap-2
                       text-gray-700 dark:text-white/85
                       hover:bg-emerald-50 dark:hover:bg-emerald-700/20 hover:text-emerald-600 transition
                       ${o.value === defaultVal ? "bg-emerald-50 dark:bg-emerald-700/20 text-emerald-600 dark:text-emerald-300 font-medium" : ""}"
                data-value="${o.value}">
                ${o.label}
              </button>`,
              )
              .join("")}
          </div>
        </div>
        <input type="hidden" id="${id}Val" value="${defaultVal}" />
      </div>`;
  };

  const typeOptions = [
    { value: "gateway", label: "Gateway" },
    { value: "repeater", label: "Repeater" },
  ];
  const freqOptions = [
    { value: "433 MHz", label: "433 MHz" },
    { value: "868 MHz", label: "868 MHz" },
    { value: "915 MHz", label: "915 MHz" },
    { value: "923 MHz", label: "923 MHz" },
  ];

  modalManager.create({
    id: "editLoraModal",
    icon: "uil-edit",
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100 dark:bg-blue-900/60",
    title: "Edit LoRa Device",
    subtitle: d.device_id,
    body: `
      <div class="space-y-4">

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-medium text-gray-600 dark:text-neutral-400 uppercase mb-1 block">Device Type *</label>
            ${customDropdown("editLoraType", typeOptions, d.device_type || "gateway")}
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600 dark:text-neutral-400 uppercase mb-1 block">Device Name *</label>
            <input id="editLoraName" type="text" value="${d.name || ""}"
              class="w-full px-3 py-2.5 bg-[#F1F5F9] dark:bg-neutral-700 dark:text-neutral-300 rounded-xl text-sm border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>
        </div>

        <!-- Map -->
        <div>
          <label class="text-xs font-medium text-gray-600 dark:text-neutral-400 uppercase mb-1 block">
            Pin Location *
            <span class="normal-case font-normal text-gray-400 ml-1">— tap to move pin</span>
          </label>
          <div class="w-full h-72 rounded-2xl overflow-hidden border-2 border-[#D5E7F9] dark:border-neutral-600 relative">
            <div id="editLoraMapEl" class="w-full h-full"></div>
            <div class="absolute top-3 right-3 z-[1000] flex flex-col gap-0.5 overflow-hidden p-0.5">
              <button id="editLoraZoomIn" type="button"
                class="w-10 h-10 flex items-center justify-center bg-black/30 backdrop-blur-md border border-white/20 text-white hover:bg-black/45 transition-all duration-200 rounded-t-full shadow-md">
                <i class="uil uil-plus text-xl"></i>
              </button>
              <button id="editLoraZoomOut" type="button"
                class="w-10 h-10 flex items-center justify-center bg-black/30 backdrop-blur-md border border-white/20 text-white hover:bg-black/45 transition-all duration-200 rounded-b-full shadow-md">
                <i class="uil uil-minus text-xl"></i>
              </button>
            </div>
          </div>
          <div class="mt-2 relative">
            <i class="uil uil-map-marker absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none"></i>
            <input id="editLoraLabel" type="text" value="${d.location_label || ""}"
              class="w-full pl-9 pr-3 py-2.5 bg-[#F1F5F9] dark:bg-neutral-700 dark:text-neutral-300 rounded-xl text-sm border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>
          <p id="editLoraCoords" class="text-xs text-gray-400 dark:text-neutral-500 mt-1 pl-1 h-4">
            ${d.lat && d.lng ? `${parseFloat(d.lat).toFixed(6)}, ${parseFloat(d.lng).toFixed(6)}` : ""}
          </p>
        </div>

        <!-- Coverage -->
        <div>
          <label class="text-xs font-medium text-gray-600 dark:text-neutral-400 uppercase mb-1 block">Coverage Radius (m)</label>
          <input id="editLoraCoverage" type="number" value="${d.coverage_radius || 300}" min="50" max="2000"
            class="w-full px-3 py-2.5 bg-[#F1F5F9] dark:bg-neutral-700 dark:text-neutral-300 rounded-xl text-sm border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-medium text-gray-600 dark:text-neutral-400 uppercase mb-1 block">Frequency</label>
            ${customDropdown("editLoraFreq", freqOptions, d.frequency || "915 MHz")}
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600 dark:text-neutral-400 uppercase mb-1 block">Firmware</label>
            <input id="editLoraFirmware" type="text" value="${d.firmware || ""}"
              class="w-full px-3 py-2.5 bg-[#F1F5F9] dark:bg-neutral-700 dark:text-neutral-300 rounded-xl text-sm border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>
        </div>

        <div>
          <label class="text-xs font-medium text-gray-600 dark:text-neutral-400 uppercase mb-1 block">Notes</label>
          <textarea id="editLoraNotes" rows="2"
            class="w-full px-3 py-2.5 bg-[#F1F5F9] dark:bg-neutral-700 dark:text-neutral-300 rounded-xl text-sm border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none">${d.notes || ""}</textarea>
        </div>

      </div>`,
    primaryButton: { text: "Save Changes", icon: "uil-check" },
    secondaryButton: { text: "Cancel" },
    onPrimary: () => {
      const name = document.getElementById("editLoraName")?.value.trim();
      if (!name) {
        showToast("error", "Device name is required");
        modalManager.setButtonLoading("editLoraModal", "primary", false);
        return false;
      }
      if (pickedLat === null || pickedLng === null) {
        showToast("error", "Please pin a location on the map");
        modalManager.setButtonLoading("editLoraModal", "primary", false);
        return false;
      }
      submitEditLora(d.id);
      return false;
    },
    onSecondary: () => {
      destroyLoraMap();
      modalManager.close("editLoraModal");
    },
  });

  modalManager.show("editLoraModal");
  setTimeout(() => {
    initEditLoraMap(d);
    initEditModalDropdowns();
  }, 200);
}

function initEditLoraMap(d) {
  const el = document.getElementById("editLoraMapEl");
  if (!el) return;

  const build = () => {
    buildMap(el); // reuses your existing buildMap()

    const startLat = d.lat ? parseFloat(d.lat) : 14.7142;
    const startLng = d.lng ? parseFloat(d.lng) : 121.0414;
    loraMap.setView([startLat, startLng], 16);

    // Override onMapClick to target edit fields
    loraMap.off("click", onMapClick);
    loraMap.on("click", onEditMapClick);

    document
      .getElementById("editLoraZoomIn")
      ?.addEventListener("click", (e) => {
        e.stopPropagation();
        loraMap.zoomIn();
      });
    document
      .getElementById("editLoraZoomOut")
      ?.addEventListener("click", (e) => {
        e.stopPropagation();
        loraMap.zoomOut();
      });

    // Place existing pin
    if (d.lat && d.lng) {
      const pinIcon = L.divIcon({
        html: `<div style="width:22px;height:22px;background:#EF4444;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,.3);position:relative;">
          <div style="width:7px;height:7px;background:white;border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(45deg);opacity:0.9;"></div>
        </div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 22],
        className: "",
      });
      loraMarker = L.marker([parseFloat(d.lat), parseFloat(d.lng)], {
        icon: pinIcon,
      }).addTo(loraMap);
    }
  };

  if (typeof L !== "undefined") {
    build();
  } else {
    if (!document.getElementById("leaflet-css")) {
      const link = Object.assign(document.createElement("link"), {
        id: "leaflet-css",
        rel: "stylesheet",
        href: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css",
      });
      document.head.appendChild(link);
    }
    const s = document.createElement("script");
    s.src =
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    s.onload = build;
    document.head.appendChild(s);
  }
}

async function onEditMapClick(e) {
  const { lat, lng } = e.latlng;
  pickedLat = lat;
  pickedLng = lng;

  const pinIcon = L.divIcon({
    html: `<div style="width:22px;height:22px;background:#EF4444;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,.3);position:relative;">
      <div style="width:7px;height:7px;background:white;border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(45deg);opacity:0.9;"></div>
    </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    className: "",
  });

  if (loraMarker) {
    loraMarker.setLatLng([lat, lng]);
  } else {
    loraMarker = L.marker([lat, lng], { icon: pinIcon }).addTo(loraMap);
  }

  const coordsEl = document.getElementById("editLoraCoords");
  if (coordsEl) coordsEl.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  const labelEl = document.getElementById("editLoraLabel");
  if (labelEl) {
    labelEl.value = "Looking up address…";
    labelEl.disabled = true;
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { "Accept-Language": "en", "User-Agent": "SafeChain/1.0" } },
    );
    const data = await res.json();
    const addr = data.address || {};
    const parts = [
      addr.road,
      addr.suburb || addr.village || addr.neighbourhood,
      addr.city || addr.town || addr.municipality,
      addr.country,
    ].filter(Boolean);
    if (labelEl)
      labelEl.value = parts.length ? parts.join(", ") : data.display_name || "";
  } catch {
    if (labelEl) labelEl.value = "";
  } finally {
    if (labelEl) labelEl.disabled = false;
  }
}

function initEditModalDropdowns() {
  const initOne = (id) => {
    const btn = document.getElementById(`${id}Btn`);
    const menu = document.getElementById(`${id}Menu`);
    const icon = document.getElementById(`${id}Icon`);
    const text = document.getElementById(`${id}Text`);
    const hidden = document.getElementById(`${id}Val`);
    if (!btn) return;

    const activeOn = [
      "bg-emerald-50",
      "dark:bg-emerald-700/20",
      "text-emerald-600",
      "dark:text-emerald-300",
      "font-medium",
    ];

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      ["editLoraType", "editLoraFreq"].forEach((other) => {
        if (other !== id) {
          document.getElementById(`${other}Menu`)?.classList.add("hidden");
          const oi = document.getElementById(`${other}Icon`);
          if (oi) oi.style.transform = "rotate(0deg)";
        }
      });
      const isHidden = menu.classList.contains("hidden");
      menu.classList.toggle("hidden", !isHidden);
      icon.style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
    });

    menu.querySelectorAll(`.${id}-option`).forEach((opt) => {
      opt.addEventListener("click", (e) => {
        e.stopPropagation();
        hidden.value = opt.dataset.value;
        text.innerHTML = opt.dataset.value;
        menu
          .querySelectorAll(`.${id}-option`)
          .forEach((o) => o.classList.remove(...activeOn));
        opt.classList.add(...activeOn);
        menu.classList.add("hidden");
        icon.style.transform = "rotate(0deg)";
      });
    });
  };

  initOne("editLoraType");
  initOne("editLoraFreq");

  document.addEventListener("click", function closeEditDropdowns(e) {
    ["editLoraType", "editLoraFreq"].forEach((id) => {
      const wrapper = document.getElementById(`${id}Wrapper`);
      if (wrapper && !wrapper.contains(e.target)) {
        document.getElementById(`${id}Menu`)?.classList.add("hidden");
        const icon = document.getElementById(`${id}Icon`);
        if (icon) icon.style.transform = "rotate(0deg)";
      }
    });
    if (!document.getElementById("editLoraTypBtn")) {
      document.removeEventListener("click", closeEditDropdowns);
    }
  });
}

async function submitEditLora(id) {
  const name = document.getElementById("editLoraName")?.value.trim();
  const type = document.getElementById("editLoraTypeVal")?.value;
  const label = document.getElementById("editLoraLabel")?.value.trim();
  const coverage = parseInt(
    document.getElementById("editLoraCoverage")?.value || "300",
  );
  const freq = document.getElementById("editLoraFreqVal")?.value.trim();
  const firmware = document.getElementById("editLoraFirmware")?.value.trim();
  const notes = document.getElementById("editLoraNotes")?.value.trim();

  try {
    const res = await fetch(`${API}?action=edit-lora`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        name,
        device_type: type,
        location_label: label,
        lat: pickedLat,
        lng: pickedLng,
        coverage_radius: coverage,
        frequency: freq,
        firmware,
        notes,
      }),
    });
    const json = await res.json();

    if (json.success) {
      destroyLoraMap();
      modalManager.close("editLoraModal");
      showToast("success", "Device updated successfully");
      fetchDevices();
    } else {
      const msg = json.errors
        ? json.errors.join(", ")
        : json.message || "Failed to update";
      showToast("error", msg);
      modalManager.setButtonLoading("editLoraModal", "primary", false);
    }
  } catch {
    showToast("error", "Network error — please try again");
    modalManager.setButtonLoading("editLoraModal", "primary", false);
  }
}

function listCard(d) {
  const isNode = d._kind === "node";
  const iconEl = isNode
    ? `<i class="uil uil-mobile-android text-2xl text-white"></i>`
    : d.device_type === "gateway"
      ? `<i class="uil uil-wifi-router text-2xl text-white"></i>`
      : `<svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
     <!-- Center dot -->
    <circle cx="12" cy="11" r="1.5"/>
    <!-- Vertical line -->
    <path d="M12 12.5 L12 17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    <!-- Inner waves -->
    <path d="M9.5 8.5a3.5 3.5 0 0 0 0 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    <path d="M14.5 8.5a3.5 3.5 0 0 1 0 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    <!-- Outer waves -->
    <path d="M7 6a6.5 6.5 0 0 0 0 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    <path d="M17 6a6.5 6.5 0 0 1 0 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>
   </svg>`;
  const typeLabel = isNode
    ? "Node Device"
    : d.device_type === "gateway"
      ? "LoRa Gateway"
      : "LoRa Repeater";
  const col1Val = isNode
    ? d.owner_name || "Unassigned"
    : d.location_label || "—";
  const col1Lbl = isNode ? "OWNER" : "LOCATION";
  const col2Val = isNode
    ? `<span class="${batteryColor(d.battery)}">${d.battery ?? "—"}%</span>`
    : `<span class="${signalColor(d.signal)}">${d.signal || "—"}</span>`;
  const col2Lbl = isNode ? "BATTERY" : "SIGNAL";
  const data = enc(d);
  const isInactive = d.status === "inactive";
  const actionBtn = isInactive
    ? `<button onclick="confirmReactivate(decodeURIComponent('${data}'))"
      class="flex-1 flex items-center justify-center gap-2 py-1.5 px-3 bg-transparent border-2 border-neutral-400 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-emerald-600 hover:border-emerald-400 transition-colors">
      <i class="uil uil-refresh"></i><span class="text-xs font-medium">Reactivate</span>
    </button>`
    : `<button onclick="confirmDeactivate(decodeURIComponent('${data}'))"
      class="flex-1 flex items-center justify-center gap-2 py-1.5 px-3 bg-transparent border-2 border-neutral-400 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-red-600 hover:border-red-400 transition-colors">
      <i class="uil uil-ban"></i><span class="text-xs font-medium">Deactivate</span>
    </button>`;

  return `
    <div class="bg-white dark:bg-neutral-800 rounded-3xl p-5 border-2 border-transparent hover:border-emerald-400 shadow-[0_0_24px_rgba(0,0,0,0.10)] transition-all">
      <div class="flex items-center gap-5">
        <div class="w-11 h-11 bg-[linear-gradient(141.34deg,#27C291_4.44%,#20A577_95.56%)] rounded-xl flex items-center justify-center flex-shrink-0">
          ${iconEl}
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-neutral-300">${d.device_id}</h3>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="text-xs text-gray-400 dark:text-neutral-400">${typeLabel}</span>
            ${!isNode ? statusPill(d.status) : ""}
          </div>
        </div>
        <div class="hidden md:flex items-center gap-10">
          <div>
            <div class="text-xs text-gray-500 dark:text-neutral-400 mb-0.5">${col1Lbl}</div>
            <div class="text-sm font-medium text-gray-800 dark:text-neutral-300 max-w-[160px] truncate">${col1Val}</div>
          </div>
          <div>
            <div class="text-xs text-gray-500 dark:text-neutral-400 mb-0.5">${col2Lbl}</div>
            <div class="text-sm font-medium">${col2Val}</div>
          </div>
        </div>
        <div class="flex gap-2 flex-shrink-0">
          <button onclick="viewDevice(decodeURIComponent('${data}'))"
            class="flex items-center gap-2 py-2 px-4 border border-neutral-400 rounded-xl text-gray-700 dark:text-neutral-400 hover:text-emerald-600 hover:border-emerald-400 transition-colors text-sm">
            <i class="uil uil-eye"></i><span class="hidden sm:inline">View</span>
          </button>
          ${actionBtn}
        </div>
      </div>
    </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────
function renderSkeletonLoading() {
  const c = document.getElementById("devicesContainer");
  c.style.opacity = "0";

  setTimeout(() => {
    if (currentView === "grid") {
      c.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
      c.innerHTML = Array(6)
        .fill(null)
        .map(
          (_, i) => `
        <div class="bg-white dark:bg-neutral-800 rounded-3xl p-6 border-2 border-transparent shadow-[0_0_24px_rgba(0,0,0,0.10)]">
          <div class="flex items-start gap-4 mb-6">
            <div class="w-11 h-11 bg-gray-200 dark:bg-neutral-700 rounded-xl animate-pulse"></div>
            <div class="flex-1">
              <div class="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-24 mb-2 animate-pulse"></div>
              <div class="h-3 bg-gray-100 dark:bg-neutral-600 rounded w-32 animate-pulse"></div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="h-12 bg-gray-100 dark:bg-neutral-700 rounded-lg animate-pulse"></div>
            <div class="h-12 bg-gray-100 dark:bg-neutral-700 rounded-lg animate-pulse"></div>
          </div>
          <div class="flex gap-3">
            <div class="flex-1 h-9 bg-gray-100 dark:bg-neutral-700 rounded-lg animate-pulse"></div>
            <div class="flex-1 h-9 bg-gray-100 dark:bg-neutral-700 rounded-lg animate-pulse"></div>
          </div>
        </div>`,
        )
        .join("");
    } else {
      c.className = "flex flex-col gap-4";
      c.innerHTML = Array(5)
        .fill(null)
        .map(
          (_, i) => `
        <div class="bg-white dark:bg-neutral-800 rounded-3xl p-5 border-2 border-transparent shadow-[0_0_24px_rgba(0,0,0,0.10)]">
          <div class="flex items-center gap-5">
            <div class="w-11 h-11 bg-gray-200 dark:bg-neutral-700 rounded-xl flex-shrink-0 animate-pulse"></div>
            <div class="flex-1 min-w-0">
              <div class="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-28 mb-2 animate-pulse"></div>
              <div class="h-3 bg-gray-100 dark:bg-neutral-600 rounded w-20 animate-pulse"></div>
            </div>
            <div class="hidden md:flex items-center gap-10">
              <div>
                <div class="h-3 bg-gray-100 dark:bg-neutral-600 rounded w-12 mb-2 animate-pulse"></div>
                <div class="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-28 animate-pulse"></div>
              </div>
              <div>
                <div class="h-3 bg-gray-100 dark:bg-neutral-600 rounded w-12 mb-2 animate-pulse"></div>
                <div class="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-16 animate-pulse"></div>
              </div>
            </div>
            <div class="flex gap-2 flex-shrink-0">
              <div class="h-9 w-20 bg-gray-100 dark:bg-neutral-700 rounded-xl animate-pulse"></div>
              <div class="h-9 w-24 bg-gray-100 dark:bg-neutral-700 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </div>`,
        )
        .join("");
    }

    c.style.opacity = "1";
  }, 100);
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEW MODE
// ─────────────────────────────────────────────────────────────────────────────
function setViewMode(mode) {
  currentView = mode;
  localStorage.setItem("deviceViewMode", mode);
  const on =
    "p-3 w-[50px] h-[50px] flex items-center justify-center bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors";
  const off =
    "p-3 w-[50px] h-[50px] flex items-center justify-center bg-[#f4f5f9] dark:bg-neutral-700 text-emerald-500 dark:text-neutral-300 rounded-xl hover:bg-gray-50 transition-colors";
  document.getElementById("gridBtn").className = mode === "grid" ? on : off;
  document.getElementById("listBtn").className = mode === "list" ? on : off;
  renderSkeletonLoading();
  setTimeout(renderDevices, 300);
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEW DEVICE MODAL
// ─────────────────────────────────────────────────────────────────────────────
function viewDevice(raw) {
  const d = typeof raw === "string" ? JSON.parse(raw) : raw;
  const isNode = d._kind === "node";

  if (isNode) {
    const meds =
      Array.isArray(d.medical_conditions) && d.medical_conditions.length
        ? d.medical_conditions
            .map(
              (m) =>
                `<span class="text-xs bg-red-50 dark:bg-red-900/30 text-red-600 px-2 py-0.5 rounded-full">${m}</span>`,
            )
            .join(" ")
        : '<span class="text-xs text-gray-400">None on file</span>';

    modalManager.create({
      id: "viewDeviceModal",
      icon: "uil-mobile-android",
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/60",
      title: "Node Device Details",
      subtitle: d.device_id,
      body: `
        <div class="space-y-4">
          <div class="bg-emerald-500 rounded-2xl p-5 text-white flex items-center gap-4">
            <div class="bg-white/20 rounded-xl p-2.5"><i class="uil uil-mobile-android text-2xl"></i></div>
            <div>
              <p class="text-xs opacity-80">DEVICE ID</p>
              <p class="text-lg font-semibold">${d.device_id}</p>
              <p class="text-xs opacity-80">${d.device_name || ""}</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            ${infoBox("uil-user", "Owner", d.owner_name || "Unassigned")}
            ${infoBox("uil-phone", "Contact", d.contact || "—")}
            ${infoBox("uil-location-point", "Address", d.address || "—")}
            ${infoBox("uil-battery-bolt", "Battery", (d.battery ?? "—") + "%")}
            ${infoBox("uil-calendar-alt", "Registered", d.registered_date || "—")}
            ${infoBox("uil-bluetooth-b", "BT Remote", d.bt_remote_id || "—")}
          </div>
          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase mb-2">Medical Conditions</p>
            <div class="flex flex-wrap gap-2">${meds}</div>
          </div>
        </div>`,
      primaryButton: {
        text: "Deactivate",
        icon: "uil-ban",
        class:
          "bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-50",
      },
      secondaryButton: { text: "Close" },
      onPrimary: () => {
        modalManager.close("viewDeviceModal");
        confirmDeactivate(d);
      },
      onSecondary: () => modalManager.close("viewDeviceModal"),
    });
  } else {
    const typeLabel =
      d.device_type === "gateway" ? "LoRa Gateway" : "LoRa Repeater";
    modalManager.create({
      id: "viewLoraModal",
      icon: "uil-wifi-router",
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/60",
      title: typeLabel + " Details",
      subtitle: d.device_id,
      body: `
        <div class="space-y-4">
          <div class="bg-emerald-500 rounded-2xl p-5 text-white flex items-center gap-4">
            <div class="bg-white/20 rounded-xl p-2.5"><i class="uil uil-wifi-router text-2xl"></i></div>
            <div class="flex-1">
              <p class="text-xs opacity-80">DEVICE ID</p>
              <p class="text-lg font-semibold">${d.device_id}</p>
              <p class="text-xs opacity-80">${d.name}</p>
            </div>
            ${statusPill(d.status)}
          </div>
          <div class="grid grid-cols-2 gap-3">
            ${infoBox("uil-map-marker", "Location", d.location_label || "—")}
            ${infoBox("uil-signal-alt-3", "Signal", d.signal || "—")}
            ${infoBox("uil-layer-group", "Coverage", (d.coverage_radius || "—") + "m")}
            ${infoBox("uil-wifi", "Frequency", d.frequency || "—")}
            ${infoBox("uil-file-alt", "Firmware", d.firmware || "—")}
            ${infoBox("uil-calendar-alt", "Installed", d.install_date || "—")}
          </div>
          ${
            d.lat && d.lng
              ? `
<div>
  <p class="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase mb-1">Location</p>
  <div class="w-full h-80 rounded-2xl overflow-hidden border-2 border-[#D5E7F9] dark:border-neutral-600 relative">
    <div id="viewLoraMapEl" class="w-full h-full"></div>
    <div class="absolute top-3 right-3 z-[1000] flex flex-col gap-0.5 overflow-hidden p-0.5">
      <button id="viewLoraZoomIn" type="button"
        class="w-10 h-10 flex items-center justify-center bg-black/30 backdrop-blur-md border border-white/20 text-white hover:bg-black/45 transition-all duration-200 rounded-t-full shadow-md">
        <i class="uil uil-plus text-xl"></i>
      </button>
      <button id="viewLoraZoomOut" type="button"
        class="w-10 h-10 flex items-center justify-center bg-black/30 backdrop-blur-md border border-white/20 text-white hover:bg-black/45 transition-all duration-200 rounded-b-full shadow-md">
        <i class="uil uil-minus text-xl"></i>
      </button>
    </div>
  </div>
</div>`
              : ""
          }
          ${
            d.notes
              ? `
          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase mb-1">Notes</p>
            <p class="text-sm text-gray-700 dark:text-neutral-300 bg-[#F1F5F9] dark:bg-neutral-600 rounded-xl p-3">${d.notes}</p>
          </div>`
              : ""
          }
        </div>`,
      primaryButton: {
        text: "Deactivate",
        icon: "uil-ban",
        class:
          "bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-50",
      },
      secondaryButton: { text: "Close" },
      onPrimary: () => {
        modalManager.close("viewLoraModal");
        confirmDeactivate(d);
      },
      onSecondary: () => modalManager.close("viewLoraModal"),
    });
  }

  modalManager.show(isNode ? "viewDeviceModal" : "viewLoraModal");

  if (!isNode && d.lat && d.lng) {
    setTimeout(() => initViewLoraMap(d), 200); // wait for 300ms modal animation to finish
  }
}

function initViewLoraMap(d) {
  const el = document.getElementById("viewLoraMapEl");
  if (!el) return;

  const build = () => {
    buildMap(el);

    loraMap.setView([d.lat, d.lng], 16);
    loraMap.doubleClickZoom.disable();
    loraMap.touchZoom.disable();
    loraMap.off("click", onMapClick);

    const zoomIn = document.getElementById("viewLoraZoomIn");
    const zoomOut = document.getElementById("viewLoraZoomOut");
    if (zoomIn)
      zoomIn.addEventListener("click", (e) => {
        e.stopPropagation();
        loraMap.zoomIn();
      });
    if (zoomOut)
      zoomOut.addEventListener("click", (e) => {
        e.stopPropagation();
        loraMap.zoomOut();
      });

    const pinIcon = L.divIcon({
      html: `<div style="
        width:36px;height:36px;
        background:linear-gradient(141.34deg,#27C291 4.44%,#20A577 95.56%);
        border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 2px 8px rgba(0,0,0,.3);
      ">
        ${
          d.device_type === "gateway"
            ? `<i class="uil uil-wifi-router" style="color:white;font-size:18px;"></i>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white">
              <circle cx="12" cy="11" r="1.5"/>
              <path d="M12 12.5 L12 17" stroke="white" stroke-width="1.8" stroke-linecap="round" fill="none"/>
              <path d="M9.5 8.5a3.5 3.5 0 0 0 0 5" stroke="white" stroke-width="1.8" stroke-linecap="round" fill="none"/>
              <path d="M14.5 8.5a3.5 3.5 0 0 1 0 5" stroke="white" stroke-width="1.8" stroke-linecap="round" fill="none"/>
              <path d="M7 6a6.5 6.5 0 0 0 0 10" stroke="white" stroke-width="1.8" stroke-linecap="round" fill="none"/>
              <path d="M17 6a6.5 6.5 0 0 1 0 10" stroke="white" stroke-width="1.8" stroke-linecap="round" fill="none"/>
             </svg>`
        }
      </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      className: "",
    });

    L.marker([d.lat, d.lng], { icon: pinIcon }).addTo(loraMap);

    if (d.coverage_radius) {
      L.circle([d.lat, d.lng], {
        radius: d.coverage_radius,
        color: "#3B82F6",
        weight: 2,
        opacity: 0.8,
        fillColor: "#3B82F6",
        fillOpacity: 0.15,
      }).addTo(loraMap);
    }
  };

  // Same guard as initLoraMap
  if (typeof L !== "undefined") {
    build();
  } else {
    if (!document.getElementById("leaflet-css")) {
      const link = Object.assign(document.createElement("link"), {
        id: "leaflet-css",
        rel: "stylesheet",
        href: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css",
      });
      document.head.appendChild(link);
    }
    const s = document.createElement("script");
    s.src =
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    s.onload = build;
    document.head.appendChild(s);
  }
}
// ─────────────────────────────────────────────────────────────────────────────
// DEACTIVATE
// ─────────────────────────────────────────────────────────────────────────────
function confirmDeactivate(raw) {
  const d = typeof raw === "string" ? JSON.parse(raw) : raw;
  const isNode = d._kind === "node";

  modalManager.create({
    id: "deactivateModal",
    icon: "uil-ban",
    iconColor: "text-red-600 dark:text-red-400",
    iconBg: "bg-red-100 dark:bg-red-900/60",
    title: "Deactivate Device",
    subtitle: d.device_id,
    showWarning: true,
    warningText:
      "This device will be disconnected and will no longer send or receive data.",
    body: `
      <div class="text-sm text-center">
        <p class="mb-2">Are you sure you want to deactivate <strong>${d.device_id}</strong>?</p>
        <p class="text-xs text-gray-500">${isNode ? "Owner: " + (d.owner_name || "Unknown") : "Name: " + d.name}</p>
      </div>`,
    primaryButton: {
      text: "Deactivate",
      icon: "uil-ban",
      class: "bg-red-600 hover:bg-red-700",
    },
    secondaryButton: { text: "Cancel" },
    onPrimary: async () => {
      modalManager.close("deactivateModal");
      if (!isNode) {
        await doDeactivateLora(d.id);
      }
      // Node device deactivation: add your own endpoint if needed
    },
    onSecondary: () => modalManager.close("deactivateModal"),
  });
  modalManager.show("deactivateModal");
}

async function doDeactivateLora(id) {
  try {
    const res = await fetch(`${API}?action=deactivate-lora`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const json = await res.json();
    if (json.success) {
      showToast("success", "Device deactivated");
      fetchDevices();
    } else {
      showToast(json.message || "Failed to deactivate", "error");
    }
  } catch {
    showToast("Network error", "error");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD LORA MODAL  (Leaflet map + Nominatim reverse geocode)
// ─────────────────────────────────────────────────────────────────────────────
function openAddLoraModal() {
  pickedLat = null;
  pickedLng = null;

  // Reusable dropdown HTML builder
  const customDropdown = (id, options, defaultVal) => {
    const activeOpt = options.find((o) => o.value === defaultVal) || options[0];
    return `
      <div class="relative" id="${id}Wrapper">
        <button type="button" id="${id}Btn"
          class="w-full bg-[#F1F5F9] dark:bg-neutral-700 h-[43.2px] rounded-xl px-3 py-2.5 border-2 border-transparent text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-emerald-400 transition">
          <span id="${id}Text" class="text-sm text-gray-700 dark:text-neutral-300 flex items-center gap-2">
            ${activeOpt.dot ? `<span class="w-2 h-2 rounded-full ${activeOpt.dot} flex-shrink-0"></span>` : ""}
            ${activeOpt.label}
          </span>
          <i id="${id}Icon" class="uil uil-angle-down text-xl text-gray-400 dark:text-gray-300 transition-transform duration-200"></i>
        </button>
        <div id="${id}Menu"
          class="hidden absolute z-[99999] w-full mt-1 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl shadow-lg overflow-hidden">
          <div class="py-1">
            ${options
              .map(
                (o) => `
              <button type="button"
                class="${id}-option text-sm w-full text-left px-4 py-2.5 flex items-center gap-2
                       text-gray-700 dark:text-white/85
                       hover:bg-emerald-50 dark:hover:bg-emerald-700/20 hover:text-emerald-600 transition
                       ${o.value === defaultVal ? "bg-emerald-50 dark:bg-emerald-700/20 text-emerald-600 dark:text-emerald-300 font-medium" : ""}"
                data-value="${o.value}"
                ${o.dot ? `data-dot="${o.dot}"` : ""}>
                ${o.dot ? `<span class="w-2 h-2 rounded-full ${o.dot} flex-shrink-0"></span>` : ""}
                ${o.label}
              </button>`,
              )
              .join("")}
          </div>
        </div>
        <input type="hidden" id="${id}Val" value="${defaultVal}" />
      </div>`;
  };

  const typeOptions = [
    { value: "gateway", label: "Gateway" },
    { value: "repeater", label: "Repeater" },
  ];

  const freqOptions = [
    { value: "433 MHz", label: "433 MHz" },
    { value: "868 MHz", label: "868 MHz" },
    { value: "915 MHz", label: "915 MHz" },
    { value: "923 MHz", label: "923 MHz" },
  ];

  modalManager.create({
    id: "addLoraModal",
    icon: "uil-wifi-router",
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/60",
    title: "Add LoRa Device",
    subtitle: "Pin the location on the map",
    body: `
      <div class="space-y-4">

        <!-- Type + Name -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-medium text-gray-600 dark:text-neutral-400 uppercase mb-1 block">Device Type *</label>
            ${customDropdown("loraType", typeOptions, "gateway")}
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600 dark:text-neutral-400 uppercase mb-1 block">Device Name *</label>
            <input id="loraName" type="text" placeholder="e.g. Main Gateway"
              class="w-full px-3 py-2.5 bg-[#F1F5F9] dark:bg-neutral-700 dark:text-neutral-300 rounded-xl text-sm border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>
        </div>

        <!-- Map -->
        <div>
          <label class="text-xs font-medium text-gray-600 dark:text-neutral-400 uppercase mb-1 block">
            Pin Location *
            <span class="normal-case font-normal text-gray-400 ml-1">— tap the map to place a pin</span>
          </label>
          <div class="w-full h-72 rounded-2xl overflow-hidden border-2 border-[#D5E7F9] dark:border-neutral-600 relative">
            <div id="loraMapEl" class="w-full h-full"></div>
            <!-- Zoom controls -->
            <div class="absolute top-3 right-3 z-[1000] flex flex-col gap-0.5 overflow-hidden p-0.5">
              <button id="loraZoomIn" type="button" title="Zoom in"
                class="w-10 h-10 flex items-center justify-center bg-black/30 backdrop-blur-md border border-white/20 text-white hover:bg-black/45 hover:-translate-y-0.5 transition-all duration-200 rounded-t-full shadow-md">
                <i class="uil uil-plus text-xl"></i>
              </button>
              <button id="loraZoomOut" type="button" title="Zoom out"
                class="w-10 h-10 flex items-center justify-center bg-black/30 backdrop-blur-md border border-white/20 text-white hover:bg-black/45 hover:-translate-y-0.5 transition-all duration-200 rounded-b-full shadow-md">
                <i class="uil uil-minus text-xl"></i>
              </button>
            </div>
            <!-- Hint -->
            <div id="mapHint" class="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity">
              <div class="bg-white/90 dark:bg-neutral-800/90 rounded-xl px-4 py-2 shadow text-xs text-gray-500 dark:text-neutral-400">
                <i class="uil uil-crosshair mr-1"></i> Tap to drop a pin
              </div>
            </div>
          </div>
          <!-- Address -->
          <div class="mt-2 relative">
            <i class="uil uil-map-marker absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none"></i>
            <input id="loraLabel" type="text" placeholder="Address auto-fills when you pin…"
              class="w-full pl-9 pr-3 py-2.5 bg-[#F1F5F9] dark:bg-neutral-700 dark:text-neutral-300 rounded-xl text-sm border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>
          <p id="loraCoords" class="text-xs text-gray-400 dark:text-neutral-500 mt-1 pl-1 h-4"></p>
        </div>

        <!-- Coverage -->
        <div>
          <label class="text-xs font-medium text-gray-600 dark:text-neutral-400 uppercase mb-1 block">Coverage Radius (m)</label>
          <input id="loraCoverage" type="number" value="300" min="50" max="2000"
            class="w-full px-3 py-2.5 bg-[#F1F5F9] dark:bg-neutral-700 dark:text-neutral-300 rounded-xl text-sm border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </div>

        <!-- Frequency + Firmware -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-medium text-gray-600 dark:text-neutral-400 uppercase mb-1 block">Frequency</label>
            ${customDropdown("loraFreq", freqOptions, "915 MHz")}
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600 dark:text-neutral-400 uppercase mb-1 block">Firmware</label>
            <input id="loraFirmware" type="text" placeholder="e.g. v2.1.4"
              class="w-full px-3 py-2.5 bg-[#F1F5F9] dark:bg-neutral-700 dark:text-neutral-300 rounded-xl text-sm border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>
        </div>

        <!-- Notes -->
        <div>
          <label class="text-xs font-medium text-gray-600 dark:text-neutral-400 uppercase mb-1 block">Notes</label>
          <textarea id="loraNotes" rows="2" placeholder="Optional notes…"
            class="w-full px-3 py-2.5 bg-[#F1F5F9] dark:bg-neutral-700 dark:text-neutral-300 rounded-xl text-sm border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"></textarea>
        </div>

        <div id="loraError" class="hidden text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2"></div>
      </div>`,
    primaryButton: { text: "Add Device", icon: "uil-plus" },
    secondaryButton: { text: "Cancel" },
    onPrimary: () => {
      const name = document.getElementById("loraName")?.value.trim();

      if (!name) {
        showToast("error", "Device name is required");
        modalManager.setButtonLoading("addLoraModal", "primary", false);
        return false;
      }
      if (pickedLat === null || pickedLng === null) {
        showToast("error", "Please tap the map to pin a location");
        modalManager.setButtonLoading("addLoraModal", "primary", false);
        return false;
      }

      submitAddLora(); // fire async separately, don't await
      return false; // always prevent auto-close — submitAddLora closes manually on success
    },
    onSecondary: () => {
      destroyLoraMap();
      modalManager.close("addLoraModal");
    },
  });

  modalManager.show("addLoraModal");
  setTimeout(() => {
    initLoraMap();
    initModalDropdowns();
  }, 200);
}

// ── Modal custom dropdowns (type, signal, freq) ──────────────────────────────
function initModalDropdowns() {
  // Generic initializer — works for any dropdown built by customDropdown()
  const initOne = (id) => {
    const btn = document.getElementById(`${id}Btn`);
    const menu = document.getElementById(`${id}Menu`);
    const icon = document.getElementById(`${id}Icon`);
    const text = document.getElementById(`${id}Text`);
    const hidden = document.getElementById(`${id}Val`);
    if (!btn) return;

    const activeOn = [
      "bg-emerald-50",
      "dark:bg-emerald-700/20",
      "text-emerald-600",
      "dark:text-emerald-300",
      "font-medium",
    ];
    const activeOff = activeOn;

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      // Close all other modal dropdowns first
      ["loraType", "loraSignal", "loraFreq"].forEach((other) => {
        if (other !== id) {
          document.getElementById(`${other}Menu`)?.classList.add("hidden");
          const oi = document.getElementById(`${other}Icon`);
          if (oi) oi.style.transform = "rotate(0deg)";
        }
      });
      const isHidden = menu.classList.contains("hidden");
      menu.classList.toggle("hidden", !isHidden);
      icon.style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
    });

    menu.querySelectorAll(`.${id}-option`).forEach((opt) => {
      opt.addEventListener("click", (e) => {
        e.stopPropagation();
        const val = opt.dataset.value;
        const dot = opt.dataset.dot || "";

        hidden.value = val;

        // Update button label (with dot if present)
        text.innerHTML = dot
          ? `<span class="w-2 h-2 rounded-full ${dot} flex-shrink-0"></span>${val}`
          : val;

        // Active state
        menu
          .querySelectorAll(`.${id}-option`)
          .forEach((o) => o.classList.remove(...activeOff));
        opt.classList.add(...activeOn);

        menu.classList.add("hidden");
        icon.style.transform = "rotate(0deg)";
      });
    });
  };

  initOne("loraType");
  initOne("loraFreq");

  // Close all on outside click
  document.addEventListener("click", function closeModalDropdowns(e) {
    ["loraType", "loraSignal", "loraFreq"].forEach((id) => {
      const wrapper = document.getElementById(`${id}Wrapper`);
      if (wrapper && !wrapper.contains(e.target)) {
        document.getElementById(`${id}Menu`)?.classList.add("hidden");
        const icon = document.getElementById(`${id}Icon`);
        if (icon) icon.style.transform = "rotate(0deg)";
      }
    });
    if (!document.getElementById("loraTypBtn")) {
      document.removeEventListener("click", closeModalDropdowns);
    }
  });

  // Zoom controls
  const zIn = document.getElementById("loraZoomIn");
  const zOut = document.getElementById("loraZoomOut");
  if (zIn)
    zIn.addEventListener("click", (e) => {
      e.stopPropagation();
      loraMap?.zoomIn();
    });
  if (zOut)
    zOut.addEventListener("click", (e) => {
      e.stopPropagation();
      loraMap?.zoomOut();
    });
}

// ── Init Leaflet ──────────────────────────────────────────────────────────────
function initLoraMap() {
  const el = document.getElementById("loraMapEl");
  if (!el) return;

  // Leaflet is already loaded by the page (same as dashboard) — just build the map
  if (typeof L !== "undefined") {
    buildMap(el);
  } else {
    if (!document.getElementById("leaflet-css")) {
      const link = Object.assign(document.createElement("link"), {
        id: "leaflet-css",
        rel: "stylesheet",
        href: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css",
      });
      document.head.appendChild(link);
    }
    const s = document.createElement("script");
    s.src =
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    s.onload = () => buildMap(el);
    document.head.appendChild(s);
  }
}

function buildMap(el) {
  if (loraMap) {
    loraMap.remove();
    loraMap = null;
    loraMarker = null;
  }

  const MAPTILER_KEY = "XTXjcHDPMSRZi9uVEw8c";
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";

  const onlineTile = isDark
    ? `https://api.maptiler.com/maps/streets-v2-dark/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`
    : `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`;

  const offlineTile = isDark
    ? "assets/tiles/street-v2-dark/{z}/{x}/{y}.png"
    : "assets/tiles/street-v2/{z}/{x}/{y}.png";

  loraMap = L.map(el, { zoomControl: false, maxZoom: 21 }).setView(
    [14.7142, 121.0414],
    15,
  );

  const tileLayer = L.tileLayer(navigator.onLine ? onlineTile : offlineTile, {
    maxZoom: 21,
    maxNativeZoom: 21,
    attribution:
      '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>',
  })
    .on("tileerror", function (error, tile) {
      const matches = tile.tile.src.match(/\/(\d+)\/(\d+)\/(\d+)\.png/);
      if (matches) {
        const [, z, x, y] = matches;
        tile.tile.src = isDark
          ? `assets/tiles/street-v2-dark/${z}/${x}/${y}.png`
          : `assets/tiles/street-v2/${z}/${x}/${y}.png`;
      }
    })
    .addTo(loraMap);

  window.addEventListener("online", () => tileLayer.setUrl(onlineTile));
  window.addEventListener("offline", () => tileLayer.setUrl(offlineTile));

  loraMap.on("click", onMapClick);
}

async function onMapClick(e) {
  const { lat, lng } = e.latlng;
  pickedLat = lat;
  pickedLng = lng;

  // Custom pin icon
  const pinIcon = L.divIcon({
    html: `<div style="
    width:22px;height:22px;
    background:#EF4444;
    border:3px solid #fff;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    box-shadow:0 2px 8px rgba(0,0,0,.3);
    position:relative;
  ">
    <div style="
      width:7px;height:7px;
      background:white;
      border-radius:50%;
      position:absolute;
      top:50%;left:50%;
      transform:translate(-50%,-50%) rotate(45deg);
      opacity:0.9;
    "></div>
  </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    className: "",
  });

  if (loraMarker) {
    loraMarker.setLatLng([lat, lng]);
  } else {
    loraMarker = L.marker([lat, lng], { icon: pinIcon }).addTo(loraMap);
  }

  // Draw / update coverage circle
  const radiusM = parseInt(
    document.getElementById("loraCoverage")?.value || "300",
  );

  // Hide hint
  const hint = document.getElementById("mapHint");
  if (hint) hint.style.opacity = "0";

  // Show raw coords
  const coordsEl = document.getElementById("loraCoords");
  if (coordsEl) coordsEl.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  // Reverse geocode with Nominatim
  const labelEl = document.getElementById("loraLabel");
  if (labelEl) {
    labelEl.value = "Looking up address…";
    labelEl.disabled = true;
  }
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { "Accept-Language": "en", "User-Agent": "SafeChain/1.0" } },
    );
    const data = await res.json();
    const addr = data.address || {};

    // Build a readable label: road + suburb/village + city + country
    const parts = [
      addr.road,
      addr.suburb || addr.village || addr.neighbourhood,
      addr.city || addr.town || addr.municipality,
      addr.country,
    ].filter(Boolean);

    const label = parts.length ? parts.join(", ") : data.display_name || "";
    if (labelEl) labelEl.value = label;
  } catch {
    if (labelEl) labelEl.value = "";
  } finally {
    if (labelEl) labelEl.disabled = false;
  }
}

function destroyLoraMap() {
  if (loraMap) {
    loraMap.remove();
    loraMap = null;
    loraMarker = null;
    loraCircle = null;
  }
  pickedLat = null;
  pickedLng = null;
}

// ── Submit add lora ───────────────────────────────────────────────────────────
async function submitAddLora() {
  const name = document.getElementById("loraName")?.value.trim();
  const type = document.getElementById("loraTypeVal")?.value;
  const label = document.getElementById("loraLabel")?.value.trim();
  const coverage = parseInt(
    document.getElementById("loraCoverage")?.value || "300",
  );
  const freq = document.getElementById("loraFreqVal")?.value.trim();
  const firmware = document.getElementById("loraFirmware")?.value.trim();
  const notes = document.getElementById("loraNotes")?.value.trim();

  try {
    const res = await fetch(`${API}?action=add-lora`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        device_type: type,
        location_label: label,
        lat: pickedLat,
        lng: pickedLng,
        signal: "Good",
        coverage_radius: coverage,
        frequency: freq,
        firmware,
        notes,
        install_date: new Date().toISOString().split("T")[0],
      }),
    });
    const json = await res.json();

    if (json.success) {
      destroyLoraMap();
      modalManager.close("addLoraModal");
      showToast("success", `${json.data.device_id} added successfully`);
      fetchDevices();
    } else {
      const msg = json.errors
        ? json.errors.join(", ")
        : json.message || "Failed to add device";
      showToast("error", msg);
      modalManager.setButtonLoading("addLoraModal", "primary", false);
    }
  } catch {
    showToast("error", "Network error — please try again");
    modalManager.setButtonLoading("addLoraModal", "primary", false);
  }
}

function showFormError(el, msg) {
  el.textContent = msg;
  el.classList.remove("hidden");
}

// ─────────────────────────────────────────────────────────────────────────────
// DROPDOWN
// ─────────────────────────────────────────────────────────────────────────────
const activeDropdownClasses = [
  "bg-emerald-50",
  "border-emerald-500",
  "text-emerald-600",
  "dark:bg-emerald-700/20",
  "dark:border-emerald-700/20",
  "dark:text-emerald-300",
];

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("devicesContainer").style.transition =
    "opacity 0.3s ease-in-out";
  const dropBtn = document.getElementById("sortDropdownButton");
  const dropMenu = document.getElementById("sortDropdownMenu");
  const dropIcon = document.getElementById("sortDropdownIcon");
  const dropText = document.getElementById("sortSelectedText");

  if (dropBtn) {
    dropBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const hidden = dropMenu.classList.contains("hidden");
      dropMenu.classList.toggle("hidden", !hidden);
      dropIcon.style.transform = hidden ? "rotate(180deg)" : "rotate(0deg)";
    });
  }

  document.addEventListener("click", () => {
    if (dropMenu) {
      dropMenu.classList.add("hidden");
      dropIcon.style.transform = "rotate(0deg)";
    }
  });

  document.querySelectorAll(".dropdown-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      selectedType = item.getAttribute("data-value");
      dropText.textContent = item.textContent.trim();

      document
        .querySelectorAll(".dropdown-item")
        .forEach((i) => i.classList.remove(...activeDropdownClasses));
      item.classList.add(...activeDropdownClasses);

      dropMenu.classList.add("hidden");
      dropIcon.style.transform = "rotate(0deg)";

      renderSkeletonLoading();
      devicePage = 1;
      setTimeout(renderDevices, 400);
    });
  });
 
  // Search
  const searchInput = document.querySelector(
    'input[placeholder="Search devices..."]',
  );
  if (searchInput) searchInput.addEventListener("input", handleSearch);

  // Initial load
  setViewMode(currentView);
  fetchDevices();
});
