// assets/js/devices.js
// Dynamic device management — fetches from PHP API (session auth)
// Add LoRa modal uses Leaflet + Nominatim reverse geocoding

const API = "api/devices/index.php";

let allDevices = { nodes: [], lora: [], authorized: [] };
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

    allDevices = {
      nodes: json.data.nodes,
      lora: json.data.lora,
      authorized: json.data.authorized,
    };
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
  set("statAuthorized", s.total_authorized);
  set("statGateways", s.active_gateways);
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTER
// ─────────────────────────────────────────────────────────────────────────────
function getFiltered() {
  const q = searchQuery.toLowerCase();

  let nodes = allDevices.nodes.map((d) => ({ ...d, _kind: "node" }));
  let lora = allDevices.lora.map((d) => ({ ...d, _kind: "lora" }));
  let authorized = (allDevices.authorized || []).map((d) => ({
    ...d,
    device_id: d.bt_remote_id,
    device_name: d.bt_remote_id,
    _kind: "authorized",
    status: "authorized",
  }));

  if (selectedType === "NodeDevice") {
    lora = [];
    authorized = [];
  }
  if (selectedType === "Gateway") {
    nodes = [];
    authorized = [];
    lora = lora.filter((d) => d.device_type === "gateway");
  }
  if (selectedType === "Repeater") {
    nodes = [];
    authorized = [];
    lora = lora.filter((d) => d.device_type === "repeater");
  }
  if (selectedType === "Authorized") {
    nodes = [];
    lora = [];
  }

  const all = [...nodes, ...lora, ...authorized];
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
    missing: `<span class="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-full flex items-center gap-1" style="animation:missingPulse 1.4s ease-in-out infinite;box-shadow:0 0 0 0 rgba(239,68,68,0.7);letter-spacing:0.04em;"><i class="uil uil-exclamation-circle" style="font-size:12px;"></i>MISSING</span>`,
    authorized: `<span class="text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">Authorized</span>`,
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
    : d._kind === "authorized"
      ? `<i class="uil uil-check-circle text-2xl text-white"></i>`
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
    : d._kind === "authorized"
      ? "Authorized Hardware"
      : d.device_type === "gateway"
        ? "LoRa Gateway"
        : "LoRa Repeater";
  const col1Lbl = isNode ? "OWNER" : d._kind === "authorized" ? "STATUS" : "LOCATION";
  const col1Icon = isNode ? "uil-user" : d._kind === "authorized" ? "uil-info-circle" : "uil-map-marker";
  const col1Val = isNode
    ? d.owner_name || "Unassigned"
    : d._kind === "authorized"
      ? "Ready for Registration"
      : d.location_label || "—";
  const col2Lbl = isNode ? "BATTERY" : d._kind === "authorized" ? "BATCH" : "SIGNAL";
  const col2Icon = isNode ? "uil-battery-bolt" : d._kind === "authorized" ? "uil-package" : "uil-signal-alt-3";
  const col2Val = isNode
    ? `<span class="${batteryColor(d.battery)}">${d.battery ?? "—"}%</span>`
    : d._kind === "authorized"
      ? `<span class="text-blue-500">${d.batch_number || "—"}</span>`
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
            ${!isNode ? statusPill(d.status) : (d.status === "missing" ? statusPill("missing") : "")}
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
    onPrimary: async () => {
      if (d._kind === "node") {
        await doReactivateNode(d.device_id);
      } else {
        await doReactivateLora(d.id);
      }
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
    : d._kind === "authorized"
      ? `<i class="uil uil-check-circle text-2xl text-white"></i>`
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
    : d._kind === "authorized"
      ? "Authorized Hardware"
      : d.device_type === "gateway"
        ? "LoRa Gateway"
        : "LoRa Repeater";
  const col1Val = isNode
    ? d.owner_name || "Unassigned"
    : d._kind === "authorized"
      ? "Ready for Registration"
      : d.location_label || "—";
  const col1Lbl = d._kind === "authorized" ? "STATUS" : (isNode ? "OWNER" : "LOCATION");
  const col2Val = isNode
    ? `<span class="${batteryColor(d.battery)}">${d.battery ?? "—"}%</span>`
    : d._kind === "authorized"
      ? `<span class="text-blue-500">${d.batch_number || "—"}</span>`
      : `<span class="${signalColor(d.signal)}">${d.signal || "—"}</span>`;
  const col2Lbl = d._kind === "authorized" ? "BATCH" : (isNode ? "BATTERY" : "SIGNAL");
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
            ${!isNode ? statusPill(d.status) : (d.status === "missing" ? statusPill("missing") : "")}
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
  const isAuth = d._kind === "authorized";

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
  } else if (isAuth) {
    modalManager.create({
      id: "viewAuthModal",
      icon: "uil-check-circle",
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100 dark:bg-blue-900/60",
      title: "Authorized Hardware Details",
      subtitle: d.bt_remote_id,
      body: `
        <div class="space-y-4">
          <div class="bg-blue-600 rounded-2xl p-5 text-white flex items-center gap-4">
            <div class="bg-white/20 rounded-xl p-2.5"><i class="uil uil-bluetooth-b text-2xl"></i></div>
            <div>
              <p class="text-xs opacity-80">MAC ADDRESS</p>
              <p class="text-lg font-semibold">${d.bt_remote_id}</p>
              <p class="text-xs opacity-80">Authorized Hardware</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            ${infoBox("uil-package", "Batch Number", d.batch_number || "—")}
            ${infoBox("uil-info-circle", "Status", "Ready for Registration")}
            ${infoBox("uil-calendar-alt", "Authorized On", d.created_at || "—")}
          </div>
          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30">
            <p class="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-2">
              <i class="uil uil-info-circle text-lg mt-0.5"></i>
              This device is whitelisted in the system and ready to be assigned to a resident via the registration process.
            </p>
          </div>
        </div>`,
      primaryButton: { text: "Print QR Label", icon: "uil-print", class: "bg-blue-600 hover:bg-blue-700" },
      secondaryButton: { text: "Close" },
      onPrimary: () => {
        showToast("info", "QR Label generator opening...");
        return false;
      },
      onSecondary: () => modalManager.close("viewAuthModal"),
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

  const modalId = isNode ? "viewDeviceModal" : isAuth ? "viewAuthModal" : "viewLoraModal";
  modalManager.show(modalId);

  if (!isNode && !isAuth && d.lat && d.lng) {
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
      if (isNode) {
        await doDeactivateNode(d.device_id);
      } else {
        await doDeactivateLora(d.id);
      }
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

async function doDeactivateNode(device_id) {
  try {
    const res = await fetch(`${API}?action=deactivate-node`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id }),
    });
    const json = await res.json();
    if (json.success) {
      showToast("success", "Node device deactivated");
      fetchDevices();
    } else {
      showToast("error", json.message || "Failed to deactivate");
    }
  } catch {
    showToast("error", "Network error");
  }
}

async function doReactivateNode(device_id) {
  try {
    const res = await fetch(`${API}?action=reactivate-node`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id }),
    });
    const json = await res.json();
    if (json.success) {
      modalManager.close("reactivateModal");
      showToast("success", "Node device reactivated");
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

// ─────────────────────────────────────────────────────────────────────────────
// ADD DEVICE — picker modal (choose LoRa vs SafeChain node)
// ─────────────────────────────────────────────────────────────────────────────
function openAddDeviceModal() {
  modalManager.create({
    id: "addDevicePickerModal",
    icon: "uil-plus-circle",
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/60",
    title: "Add Device",
    subtitle: "Choose the type of device to register",
    body: `
      <div class="grid grid-cols-2 gap-4 mt-2">
        <button onclick="openAddNodeModal()"
          class="group flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-neutral-200 dark:border-neutral-600
                 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all cursor-pointer">
          <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <i class="uil uil-mobile-android text-3xl text-white"></i>
          </div>
          <div class="text-center">
            <p class="text-sm font-semibold text-gray-800 dark:text-neutral-200">SafeChain Node</p>
            <p class="text-xs text-gray-400 dark:text-neutral-400 mt-1">Keychain ESP32 device — scan QR to authorize</p>
          </div>
          <span class="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
            <i class="uil uil-qrcode-scan text-base"></i> Scan QR
          </span>
        </button>
        <button onclick="_openLoraFromPicker()"
          class="group flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-neutral-200 dark:border-neutral-600
                 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all cursor-pointer">
          <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <i class="uil uil-wifi-router text-3xl text-white"></i>
          </div>
          <div class="text-center">
            <p class="text-sm font-semibold text-gray-800 dark:text-neutral-200">LoRa Device</p>
            <p class="text-xs text-gray-400 dark:text-neutral-400 mt-1">Gateway or repeater — configure location & frequency</p>
          </div>
          <span class="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <i class="uil uil-map-marker text-base"></i> Pin on Map
          </span>
        </button>
      </div>`,
    primaryButton: null,
    secondaryButton: { text: "Cancel" },
    onSecondary: () => modalManager.close("addDevicePickerModal"),
  });
  modalManager.show("addDevicePickerModal");
}

function _openLoraFromPicker() {
  modalManager.close("addDevicePickerModal");
  setTimeout(() => openAddLoraModal(), 150);
}

// ─────────────────────────────────────────────────────────────────────────────
// QR SCANNER STATE
// ─────────────────────────────────────────────────────────────────────────────
let _qrStream       = null;
let _qrAnimFrame    = null;
let _qrScanned      = false;
let _qrActiveTab    = "desktopCam";
let _phoneSessionId = null;
let _phoneTimer     = null;

// ─────────────────────────────────────────────────────────────────────────────
// ADD SAFECHAIN NODE MODAL
// ─────────────────────────────────────────────────────────────────────────────
function openAddNodeModal() {
  modalManager.close("addDevicePickerModal");
  _qrScanned      = false;
  _qrActiveTab    = "desktopCam";
  // One session for the whole modal — tab switches never change it,
  // so the phone link stays valid as long as the modal is open.
  _phoneSessionId = "sc-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);

  setTimeout(() => {
    modalManager.create({
      id: "addNodeModal",
      icon: "uil-qrcode-scan",
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100 dark:bg-blue-900/60",
      title: "Authorize SafeChain Node",
      subtitle: "Scan the QR code on the device or its packaging",
      body: `
        <div class="space-y-4">
          <!-- Tab switcher -->
          <div class="flex bg-[#F1F5F9] dark:bg-neutral-700 rounded-xl p-1 gap-1">
            <button id="nodeTab_desktopCam" onclick="_nodeTab('desktopCam')"
              class="flex-1 py-2 text-xs font-semibold rounded-lg transition-all bg-white dark:bg-neutral-600 text-gray-800 dark:text-neutral-200 shadow">
              <i class="uil uil-webcam mr-1"></i>Desktop Camera
            </button>
            <button id="nodeTab_phoneCam" onclick="_nodeTab('phoneCam')"
              class="flex-1 py-2 text-xs font-semibold rounded-lg transition-all text-gray-500 dark:text-neutral-400">
              <i class="uil uil-mobile-android mr-1"></i>Use Phone
            </button>
            <button id="nodeTab_manual" onclick="_nodeTab('manual')"
              class="flex-1 py-2 text-xs font-semibold rounded-lg transition-all text-gray-500 dark:text-neutral-400">
              <i class="uil uil-keyboard mr-1"></i>Manual
            </button>
          </div>

          <!-- Desktop Camera Panel -->
          <div id="nodePanel_desktopCam" class="space-y-3">
            <div id="_camWrap" class="relative bg-black rounded-2xl overflow-hidden" style="aspect-ratio:4/3;">
              <video id="_qrVideo" autoplay playsinline muted class="w-full h-full object-cover"></video>
              <canvas id="_qrCanvas" class="hidden absolute inset-0 w-full h-full"></canvas>
              <div id="_qrOverlay" class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div class="relative w-52 h-52">
                  <div class="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg"></div>
                  <div class="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg"></div>
                  <div class="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg"></div>
                  <div class="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-lg"></div>
                  <div style="position:absolute;left:8px;right:8px;height:2px;background:linear-gradient(90deg,transparent,#34d399,transparent);animation:_scanLine 2s ease-in-out infinite;"></div>
                </div>
                <p class="mt-3 text-xs text-white/70 bg-black/40 px-3 py-1 rounded-full">Point camera at QR code</p>
              </div>
              <div id="_qrNoCam" class="hidden absolute inset-0 flex flex-col items-center justify-center bg-neutral-900 gap-3 p-4">
                <i class="uil uil-camera-slash text-5xl text-neutral-500"></i>
                <p class="text-sm text-white font-medium text-center">Camera not available</p>
                <p class="text-xs text-neutral-400 text-center">Try "Use Phone" or enter MAC manually</p>
              </div>
              <div id="_qrSuccessFlash" class="hidden absolute inset-0 flex flex-col items-center justify-center bg-emerald-500/90 gap-2">
                <i class="uil uil-check-circle text-6xl text-white"></i>
                <p class="text-white font-bold text-sm" id="_qrSuccessTxt"></p>
              </div>
            </div>
            <div id="_camRow" class="flex items-center gap-2">
              <label class="text-xs text-gray-500 dark:text-neutral-400 shrink-0">Camera:</label>
              <select id="_camSelect" class="flex-1 text-xs bg-[#F1F5F9] dark:bg-neutral-700 dark:text-neutral-300 rounded-lg px-2 py-1.5 border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400"></select>
              <button onclick="_startQr()" id="_startQrBtn" class="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shrink-0">
                <i class="uil uil-play"></i> Start
              </button>
            </div>
          </div>

          <!-- Phone Camera Panel -->
          <div id="nodePanel_phoneCam" class="hidden space-y-3">
            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300">
              <i class="uil uil-info-circle mr-1"></i>
              Scan the QR below with your phone. Your phone will open a scanner page — use it to scan the device QR and the result will appear here automatically.
            </div>
            <div class="flex flex-col items-center gap-3 py-3">
              <div id="_phoneQrDiv" class="bg-white p-3 rounded-xl shadow-md inline-block"></div>
              <p id="_phoneQrStatus" class="text-xs text-gray-500 dark:text-neutral-400 text-center">Generating link…</p>
              <div id="_phonePolling" class="hidden flex items-center gap-2 text-xs text-emerald-600">
                <div class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> Waiting for phone scan…
              </div>
            </div>
          </div>

          <!-- Manual Panel -->
          <div id="nodePanel_manual" class="hidden space-y-3">
            <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-300">
              <i class="uil uil-exclamation-triangle mr-1"></i>
              Enter the Bluetooth MAC address printed on the device label (AA:BB:CC:DD:EE:FF)
            </div>
            <div>
              <label class="text-xs font-medium text-gray-600 dark:text-neutral-400 uppercase mb-1 block">MAC Address *</label>
              <input id="_manualMac" type="text" placeholder="AA:BB:CC:DD:EE:FF" maxlength="17"
                class="w-full px-3 py-2.5 bg-[#F1F5F9] dark:bg-neutral-700 dark:text-neutral-300 rounded-xl text-sm font-mono border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase"
                oninput="_fmtMac(this)" />
            </div>
            <div>
              <label class="text-xs font-medium text-gray-600 dark:text-neutral-400 uppercase mb-1 block">Batch Number <span class="font-normal normal-case text-gray-400">(optional)</span></label>
              <input id="_manualBatch" type="text" placeholder="e.g. BATCH-202506"
                class="w-full px-3 py-2.5 bg-[#F1F5F9] dark:bg-neutral-700 dark:text-neutral-300 rounded-xl text-sm border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>

          <!-- Scanned result (all tabs) -->
          <div id="_scannedBox" class="hidden bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-300 dark:border-emerald-700 rounded-xl p-4">
            <p class="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase mb-1 flex items-center gap-2">
              <i class="uil uil-check-circle text-base"></i> Device Detected
            </p>
            <p class="text-sm font-mono font-bold text-gray-800 dark:text-neutral-200" id="_scannedMac">—</p>
            <p class="text-xs text-gray-400 dark:text-neutral-400 mt-1" id="_scannedExtra"></p>
            <button onclick="_clearScan()" class="mt-2 text-xs text-red-400 hover:text-red-600 transition">
              <i class="uil uil-times-circle"></i> Clear & re-scan
            </button>
          </div>

          <div id="_nodeErr" class="hidden text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2"></div>
        </div>
        <style>
          @keyframes _scanLine {
            0%   { top:8px; opacity:0; }
            10%  { opacity:1; }
            90%  { opacity:1; }
            100% { top:calc(100% - 10px); opacity:0; }
          }
        </style>`,
      primaryButton: { text: "Authorize Device", icon: "uil-shield-check", class: "bg-blue-600 hover:bg-blue-700" },
      secondaryButton: { text: "Cancel" },
      onPrimary: () => { _submitNode(); return false; },
      onSecondary: () => { _stopQr(); _clearPhoneRelay(); modalManager.close("addNodeModal"); },
    });

    modalManager.show("addNodeModal");
    setTimeout(() => _initNodeModal(), 200);
  }, 150);
}

// ── Tab switching ─────────────────────────────────────────────────────────────
function _nodeTab(tab) {
  _qrActiveTab = tab;
  ["desktopCam", "phoneCam", "manual"].forEach((t) => {
    const btn   = document.getElementById(`nodeTab_${t}`);
    const panel = document.getElementById(`nodePanel_${t}`);
    if (!btn || !panel) return;
    const active = t === tab;
    btn.classList.toggle("bg-white",              active);
    btn.classList.toggle("dark:bg-neutral-600",   active);
    btn.classList.toggle("text-gray-800",         active);
    btn.classList.toggle("dark:text-neutral-200", active);
    btn.classList.toggle("shadow",                active);
    btn.classList.toggle("text-gray-500",         !active);
    btn.classList.toggle("dark:text-neutral-400", !active);
    panel.classList.toggle("hidden",              !active);
  });
  if (tab !== "desktopCam") _stopQr();
  // Leaving phoneCam: pause polling but keep the session so the QR on the
  // phone stays valid — no re-scan of the relay link needed.
  if (tab !== "phoneCam" && _phoneTimer) { clearInterval(_phoneTimer); _phoneTimer = null; }
  if (tab === "phoneCam") _initPhoneRelay();
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function _initNodeModal() {
  await _populateCams();
  _startQr();
}

async function _populateCams() {
  const sel = document.getElementById("_camSelect");
  if (!sel) return;
  try {
    const tmp = await navigator.mediaDevices.getUserMedia({ video: true });
    tmp.getTracks().forEach((t) => t.stop());
    const devs = await navigator.mediaDevices.enumerateDevices();
    const cams = devs.filter((d) => d.kind === "videoinput");
    sel.innerHTML = cams.length
      ? cams.map((c, i) => `<option value="${c.deviceId}">${c.label || "Camera " + (i + 1)}</option>`).join("")
      : `<option value="">No cameras found</option>`;
  } catch {
    sel.innerHTML = `<option value="">Camera access denied</option>`;
  }
}

// ── QR scanner ────────────────────────────────────────────────────────────────
async function _startQr() {
  _stopQr();
  _qrScanned = false;
  const video  = document.getElementById("_qrVideo");
  const noCam  = document.getElementById("_qrNoCam");
  const overlay= document.getElementById("_qrOverlay");
  const btn    = document.getElementById("_startQrBtn");
  const sel    = document.getElementById("_camSelect");
  if (!video) return;
  const deviceId = sel?.value;
  try {
    _qrStream = await navigator.mediaDevices.getUserMedia({
      video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: "environment" },
    });
    video.srcObject = _qrStream;
    await video.play();
    if (overlay) overlay.classList.remove("hidden");
    if (noCam)   noCam.classList.add("hidden");
    if (btn) { btn.innerHTML = `<i class="uil uil-stop-circle"></i> Stop`; btn.onclick = _stopQr; }
    _qrLoop();
  } catch {
    if (noCam)   noCam.classList.remove("hidden");
    if (overlay) overlay.classList.add("hidden");
  }
}

function _qrLoop() {
  const video  = document.getElementById("_qrVideo");
  const canvas = document.getElementById("_qrCanvas");
  if (!video || !canvas || _qrScanned) return;
  // jsQR may still be loading — keep looping until it arrives
  if (!window.jsQR) { _qrAnimFrame = requestAnimationFrame(_qrLoop); return; }
  const ctx = canvas.getContext("2d");
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const img  = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = window.jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
    if (code) { _handleQr(code.data); return; }
  }
  _qrAnimFrame = requestAnimationFrame(_qrLoop);
}

function _stopQr() {
  if (_qrAnimFrame) { cancelAnimationFrame(_qrAnimFrame); _qrAnimFrame = null; }
  if (_qrStream)    { _qrStream.getTracks().forEach((t) => t.stop()); _qrStream = null; }
  const btn = document.getElementById("_startQrBtn");
  if (btn) { btn.innerHTML = `<i class="uil uil-play"></i> Start`; btn.onclick = _startQr; }
}

// ── Parse QR ──────────────────────────────────────────────────────────────────
function _handleQr(raw) {
  if (_qrScanned) return;
  _qrScanned = true;
  _stopQr();
  let mac = "", batch = "", extra = "";
  try {
    const p = JSON.parse(raw);
    mac   = (p.mac || p.bt_mac || p.address || "").toUpperCase();
    batch = p.batch || p.batch_number || "";
    extra = p.model ? "Model: " + p.model : "";
  } catch {
    const u = raw.trim().toUpperCase();
    let s = u;
    for (const pfx of ["SC:", "SAFECHAIN:"]) { if (u.startsWith(pfx)) { s = u.slice(pfx.length); break; } }
    mac = s.replace(/[^A-F0-9]/g, "").match(/.{1,2}/g)?.join(":") ?? s;
  }
  if (!_validMac(mac)) {
    _nodeErr(`Invalid QR: "${raw.slice(0, 50)}"`);
    _qrScanned = false;
    setTimeout(() => _startQr(), 1500);
    return;
  }
  const flash = document.getElementById("_qrSuccessFlash");
  const ftxt  = document.getElementById("_qrSuccessTxt");
  if (_qrActiveTab === "desktopCam") {
    // Hide the Camera row IMMEDIATELY — Start button must not be clickable
    const camRow = document.getElementById("_camRow");
    if (camRow) camRow.classList.add("hidden");
  }
  if (flash) {
    if (ftxt) ftxt.textContent = mac;
    flash.classList.remove("hidden");
    setTimeout(() => {
      flash.classList.add("hidden");
      // Hide the video viewport after the flash animation finishes
      if (_qrActiveTab === "desktopCam") {
        const camWrap = document.getElementById("_camWrap");
        if (camWrap) camWrap.classList.add("hidden");
      }
    }, 1800);
  }
  _showScanned(mac, batch, extra);
}

function _validMac(mac) { return /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(mac); }

function _showScanned(mac, batch, extra) {
  const box = document.getElementById("_scannedBox");
  const mel = document.getElementById("_scannedMac");
  const eel = document.getElementById("_scannedExtra");
  if (mel) mel.textContent = mac;
  if (eel) eel.textContent = [batch ? "Batch: " + batch : "", extra].filter(Boolean).join("  ·  ");
  if (box) box.classList.remove("hidden");
  const mi = document.getElementById("_manualMac");
  const bi = document.getElementById("_manualBatch");
  if (mi) mi.value = mac;
  if (bi && batch) bi.value = batch;
  _hideNodeErr();
}

function _clearScan() {
  _qrScanned = false;
  // Hide the scanned result box
  const box = document.getElementById("_scannedBox");
  if (box) box.classList.add("hidden");
  // Clear manual input
  const mi = document.getElementById("_manualMac");
  if (mi) mi.value = "";
  // Always dismiss the success flash in case it's still animating
  const flash = document.getElementById("_qrSuccessFlash");
  if (flash) flash.classList.add("hidden");

  if (_qrActiveTab === "desktopCam") {
    // Restore camera wrap and controls row, then restart the scanner
    const camWrap = document.getElementById("_camWrap");
    const camRow  = document.getElementById("_camRow");
    if (camWrap) camWrap.classList.remove("hidden");
    if (camRow)  camRow.classList.remove("hidden");
    _startQr();
  } else if (_qrActiveTab === "phoneCam") {
    // Keep the SAME _phoneSessionId — the phone user's link stays valid.
    // Just clear the server-side stored MAC so polling won't re-detect the
    // old result, then rebuild the QR UI (same URL) and resume polling.
    if (_phoneTimer) { clearInterval(_phoneTimer); _phoneTimer = null; }
    const relayApi = window.location.origin + "/api/devices/qr_relay.php";
    // Tell the relay backend to wipe the stored MAC for this session
    fetch(relayApi, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session: _phoneSessionId }),
    }).catch(() => {});
    // Force _initPhoneRelay to re-render the QR widget (same URL, same session)
    const container = document.getElementById("_phoneQrDiv");
    if (container) { container.innerHTML = ""; delete container.dataset.sessionId; }
    const statusEl = document.getElementById("_phoneQrStatus");
    if (statusEl) statusEl.textContent = "Generating link…";
    const pollEl = document.getElementById("_phonePolling");
    if (pollEl) pollEl.classList.add("hidden");
    _initPhoneRelay();
  }
}

// ── Phone relay ───────────────────────────────────────────────────────────────
async function _initPhoneRelay() {
  // Stop any active poll timer — DON'T clear _phoneSessionId or the QR div
  // unless the session has actually changed (set by openAddNodeModal or _clearScan).
  if (_phoneTimer) { clearInterval(_phoneTimer); _phoneTimer = null; }

  const container = document.getElementById("_phoneQrDiv");
  const statusEl  = document.getElementById("_phoneQrStatus");
  const pollEl    = document.getElementById("_phonePolling");
  if (!container || !_phoneSessionId) return;

  const baseEl   = document.querySelector("base");
  const baseHref = baseEl ? baseEl.href : window.location.origin + "/";
  const phoneUrl = new URL("qr-scan-relay.php", baseHref).href + "?session=" + _phoneSessionId;
  const relayApi = window.location.origin + "/api/devices/qr_relay.php";

  // Only rebuild the QR code widget when the session ID has changed
  // (first open, or after _clearScan issued a new session).
  if (container.dataset.sessionId !== _phoneSessionId) {
    container.dataset.sessionId = _phoneSessionId;
    container.innerHTML = "";
    if (window.QRCode) {
      try {
        new window.QRCode(container, { text: phoneUrl, width: 180, height: 180, correctLevel: window.QRCode.CorrectLevel.M });
      } catch {}
    } else {
      container.innerHTML = `<p class="text-xs text-gray-500">QR lib not loaded</p>`;
    }
    if (statusEl) statusEl.innerHTML =
      `Scan with your phone, then scan the device QR.<br>` +
      `<a href="${phoneUrl}" target="_blank" class="text-blue-500 text-[10px] break-all hover:underline">${phoneUrl}</a>`;
  }

  // If a scan was already received on this session, don't restart polling
  if (_qrScanned) { if (pollEl) pollEl.classList.add("hidden"); return; }

  if (pollEl) pollEl.classList.remove("hidden");

  _phoneTimer = setInterval(async () => {
    try {
      const res  = await fetch(`${relayApi}?session=${_phoneSessionId}`);
      const json = await res.json();
      if (json.success && json.mac) {
        if (_phoneTimer) { clearInterval(_phoneTimer); _phoneTimer = null; }
        if (pollEl) pollEl.classList.add("hidden");
        // Show "received" state in place of the QR code
        const c = document.getElementById("_phoneQrDiv");
        if (c) c.innerHTML = `
          <div class="flex flex-col items-center gap-2 py-2">
            <div class="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center">
              <i class="uil uil-check text-white text-3xl"></i>
            </div>
            <p class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Phone scan received!</p>
          </div>`;
        const se = document.getElementById("_phoneQrStatus");
        if (se) se.textContent = "";
        _handleQr(json.mac);
      }
    } catch {}
  }, 2000);
}

function _clearPhoneRelay() {
  if (_phoneTimer) { clearInterval(_phoneTimer); _phoneTimer = null; }
  _phoneSessionId = null;
  const pollEl = document.getElementById("_phonePolling");
  if (pollEl) pollEl.classList.add("hidden");
}

// ── Submit ────────────────────────────────────────────────────────────────────
async function _submitNode() {
  const box = document.getElementById("_scannedBox");
  const mel = document.getElementById("_scannedMac");
  const mi  = document.getElementById("_manualMac");
  const bi  = document.getElementById("_manualBatch");
  let mac = "", batch = "";
  if (box && !box.classList.contains("hidden") && mel) {
    mac = mel.textContent.trim().toUpperCase();
    const ext = document.getElementById("_scannedExtra")?.textContent || "";
    batch = ext.includes("Batch:") ? ext.split("Batch:")[1].trim().split("·")[0].trim() : "";
  }
  if (!mac && _qrActiveTab === "manual" && mi) {
    mac   = mi.value.trim().toUpperCase().replace(/[^A-F0-9]/g, "").match(/.{1,2}/g)?.join(":") ?? "";
    batch = bi?.value.trim() || "";
  }
  if (!_validMac(mac)) {
    _nodeErr("Please scan a valid QR code or enter a MAC address (AA:BB:CC:DD:EE:FF).");
    modalManager.setButtonLoading("addNodeModal", "primary", false);
    return;
  }
  try {
    const res  = await fetch(`${API}?action=authorize-node`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bt_remote_id: mac, batch_number: batch || undefined }),
    });
    const json = await res.json();
    if (json.success) {
      _stopQr(); _clearPhoneRelay();
      modalManager.close("addNodeModal");
      showToast("success", `✓ ${mac} added to hardware whitelist. It will appear in the device list once a resident pairs it.`);
      fetchDevices();
    } else {
      _nodeErr(json.message || "Failed to authorize device.");
      modalManager.setButtonLoading("addNodeModal", "primary", false);
    }
  } catch {
    _nodeErr("Network error — please try again.");
    modalManager.setButtonLoading("addNodeModal", "primary", false);
  }
}

function _nodeErr(msg) { const e = document.getElementById("_nodeErr"); if (e) { e.textContent = msg; e.classList.remove("hidden"); } }
function _hideNodeErr() { const e = document.getElementById("_nodeErr"); if (e) e.classList.add("hidden"); }
function _fmtMac(input) {
  let v = input.value.replace(/[^0-9A-Fa-f]/g, "").toUpperCase();
  v = v.match(/.{1,2}/g)?.join(":") ?? v;
  input.value = v.slice(0, 17);
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
  const missingStyle = document.createElement("style");
  missingStyle.textContent = `
    @keyframes missingPulse {
      0%   { box-shadow: 0 0 0 0 rgba(239,68,68,0.7); background-color: rgb(239,68,68); }
      50%  { box-shadow: 0 0 0 6px rgba(239,68,68,0); background-color: rgb(220,38,38); }
      100% { box-shadow: 0 0 0 0 rgba(239,68,68,0);   background-color: rgb(239,68,68); }
    }
  `;
  document.head.appendChild(missingStyle);

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