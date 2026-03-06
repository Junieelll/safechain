// assets/js/devices.js
// Dynamic device management — fetches from PHP API (session auth)
// Add LoRa modal uses Leaflet + Nominatim reverse geocoding

const API = '/api/devices/index.php';

let allDevices   = { nodes: [], lora: [] };
let currentView  = localStorage.getItem('deviceViewMode') || 'grid';
let searchQuery  = '';
let selectedType = 'AllTypes';

// Map state
let loraMap     = null;
let loraMarker  = null;
let pickedLat   = null;
let pickedLng   = null;

// ─────────────────────────────────────────────────────────────────────────────
// FETCH
// ─────────────────────────────────────────────────────────────────────────────
async function fetchDevices() {
  renderSkeletonLoading();
  try {
    const res  = await fetch(`${API}?action=list`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    allDevices = { nodes: json.data.nodes, lora: json.data.lora };
    updateStats(json.data.stats);
    renderDevices();
  } catch (err) {
    console.error('[Devices]', err);
    document.getElementById('devicesContainer').innerHTML = `
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
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('statTotal',     s.total);
  set('statNodes',     s.total_nodes);
  set('statLora',      s.total_lora);
  set('statGateways',  s.active_gateways);
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTER
// ─────────────────────────────────────────────────────────────────────────────
function getFiltered() {
  const q = searchQuery.toLowerCase();

  let nodes = allDevices.nodes.map(d => ({ ...d, _kind: 'node' }));
  let lora  = allDevices.lora.map(d => ({ ...d, _kind: 'lora' }));

  if (selectedType === 'NodeDevice')  lora  = [];
  if (selectedType === 'LoRaGateway') nodes = [];
  if (selectedType === 'Gateway')     lora  = lora.filter(d => d.device_type === 'gateway');
  if (selectedType === 'Repeater')    lora  = lora.filter(d => d.device_type === 'repeater');

  const all = [...nodes, ...lora];
  if (!q) return all;

  return all.filter(d =>
    [d.device_id, d.device_name, d.owner_name, d.location_label, d.signal, d.status, d.address]
      .filter(Boolean).join(' ').toLowerCase().includes(q)
  );
}

function handleSearch(e) {
  searchQuery = e.target.value;
  renderDevices();
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const signalColor = s => ({ Excellent: 'text-emerald-600', Good: 'text-blue-500', Fair: 'text-yellow-500', Weak: 'text-red-500' }[s] || 'text-gray-400');

const statusPill = s => ({
  active:      `<span class="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">Active</span>`,
  inactive:    `<span class="text-xs font-medium text-red-500 bg-red-50 dark:bg-red-900/40 px-2 py-0.5 rounded-full">Inactive</span>`,
  maintenance: `<span class="text-xs font-medium text-yellow-600 bg-yellow-50 dark:bg-yellow-900/40 px-2 py-0.5 rounded-full">Maintenance</span>`,
}[s] || '');

const batteryColor = b => b > 60 ? 'text-emerald-500' : b > 20 ? 'text-yellow-500' : 'text-red-500';

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
  const container = document.getElementById('devicesContainer');
  const filtered  = getFiltered();

  const empty = `
    <div class="${currentView === 'grid' ? 'col-span-full' : ''} flex flex-col items-center justify-center py-16 text-gray-400 dark:text-neutral-500">
      <i class="uil uil-search text-6xl mb-4 opacity-30"></i>
      <p class="text-lg font-medium">No devices found</p>
      <p class="text-sm">Try adjusting your search or filter</p>
    </div>`;

  if (currentView === 'grid') {
    container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    container.innerHTML = filtered.length ? filtered.map(gridCard).join('') : empty;
  } else {
    container.className = 'flex flex-col gap-4';
    container.innerHTML = filtered.length ? filtered.map(listCard).join('') : empty;
  }
}

function gridCard(d) {
  const isNode   = d._kind === 'node';
  const icon     = isNode ? 'uil-mobile-android' : (d.device_type === 'gateway' ? 'uil-wifi-router' : 'uil-broadcast');
  const typeLabel= isNode ? 'Node Device' : (d.device_type === 'gateway' ? 'LoRa Gateway' : 'LoRa Repeater');
  const col1Lbl  = isNode ? 'OWNER'    : 'LOCATION';
  const col1Icon = isNode ? 'uil-user' : 'uil-map-marker';
  const col1Val  = isNode ? (d.owner_name || 'Unassigned') : (d.location_label || '—');
  const col2Lbl  = isNode ? 'BATTERY'  : 'SIGNAL';
  const col2Icon = isNode ? 'uil-battery-bolt' : 'uil-signal-alt-3';
  const col2Val  = isNode
    ? `<span class="${batteryColor(d.battery)}">${d.battery ?? '—'}%</span>`
    : `<span class="${signalColor(d.signal)}">${d.signal || '—'}</span>`;
  const data     = enc(d);

  return `
    <div class="bg-white dark:bg-neutral-800 rounded-3xl p-6 border-2 border-transparent hover:border-emerald-400 shadow-[0_0_24px_rgba(0,0,0,0.10)] hover:shadow-[0_0_26px_rgba(39,194,145,0.36)] transition-all">
      <div class="flex items-start gap-4 mb-6">
        <div class="w-11 h-11 bg-[linear-gradient(141.34deg,#27C291_4.44%,#20A577_95.56%)] rounded-xl flex items-center justify-center flex-shrink-0">
          <i class="uil ${icon} text-2xl text-white"></i>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-neutral-300">${d.device_id}</h3>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-xs text-gray-400 dark:text-neutral-400">${typeLabel}</span>
            ${!isNode ? statusPill(d.status) : ''}
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
        <button onclick="confirmDeactivate(decodeURIComponent('${data}'))"
          class="flex-1 flex items-center justify-center gap-2 py-1.5 px-3 bg-transparent border-2 border-neutral-400 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-red-600 hover:border-red-400 transition-colors">
          <i class="uil uil-ban"></i><span class="text-xs font-medium">Deactivate</span>
        </button>
      </div>
    </div>`;
}

function listCard(d) {
  const isNode   = d._kind === 'node';
  const icon     = isNode ? 'uil-mobile-android' : (d.device_type === 'gateway' ? 'uil-wifi-router' : 'uil-broadcast');
  const typeLabel= isNode ? 'Node Device' : (d.device_type === 'gateway' ? 'LoRa Gateway' : 'LoRa Repeater');
  const col1Val  = isNode ? (d.owner_name || 'Unassigned') : (d.location_label || '—');
  const col1Lbl  = isNode ? 'OWNER' : 'LOCATION';
  const col2Val  = isNode
    ? `<span class="${batteryColor(d.battery)}">${d.battery ?? '—'}%</span>`
    : `<span class="${signalColor(d.signal)}">${d.signal || '—'}</span>`;
  const col2Lbl  = isNode ? 'BATTERY' : 'SIGNAL';
  const data     = enc(d);

  return `
    <div class="bg-white dark:bg-neutral-800 rounded-3xl p-5 border-2 border-transparent hover:border-emerald-400 shadow-[0_0_24px_rgba(0,0,0,0.10)] transition-all">
      <div class="flex items-center gap-5">
        <div class="w-11 h-11 bg-[linear-gradient(141.34deg,#27C291_4.44%,#20A577_95.56%)] rounded-xl flex items-center justify-center flex-shrink-0">
          <i class="uil ${icon} text-2xl text-white"></i>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-neutral-300">${d.device_id}</h3>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="text-xs text-gray-400 dark:text-neutral-400">${typeLabel}</span>
            ${!isNode ? statusPill(d.status) : ''}
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
          <button onclick="confirmDeactivate(decodeURIComponent('${data}'))"
            class="flex items-center gap-2 py-2 px-4 border border-neutral-400 rounded-xl text-gray-700 dark:text-neutral-400 hover:text-red-600 hover:border-red-400 transition-colors text-sm">
            <i class="uil uil-ban"></i><span class="hidden sm:inline">Deactivate</span>
          </button>
        </div>
      </div>
    </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────
function renderSkeletonLoading() {
  const c = document.getElementById('devicesContainer');
  const sk = `
    <div class="bg-white dark:bg-neutral-800 rounded-3xl p-6 border-2 border-transparent shadow-[0_0_24px_rgba(0,0,0,0.10)] animate-pulse">
      <div class="flex items-start gap-4 mb-6">
        <div class="w-11 h-11 bg-gray-200 dark:bg-neutral-700 rounded-xl"></div>
        <div class="flex-1"><div class="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-24 mb-2"></div><div class="h-3 bg-gray-100 dark:bg-neutral-600 rounded w-32"></div></div>
      </div>
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="h-12 bg-gray-100 dark:bg-neutral-700 rounded-lg"></div>
        <div class="h-12 bg-gray-100 dark:bg-neutral-700 rounded-lg"></div>
      </div>
      <div class="flex gap-3"><div class="flex-1 h-9 bg-gray-100 dark:bg-neutral-700 rounded-lg"></div><div class="flex-1 h-9 bg-gray-100 dark:bg-neutral-700 rounded-lg"></div></div>
    </div>`;
  c.className = currentView === 'grid'
    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
    : 'flex flex-col gap-4';
  c.innerHTML = Array(6).fill(sk).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEW MODE
// ─────────────────────────────────────────────────────────────────────────────
function setViewMode(mode) {
  currentView = mode;
  localStorage.setItem('deviceViewMode', mode);
  const on  = 'p-3 w-[50px] h-[50px] flex items-center justify-center bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors';
  const off = 'p-3 w-[50px] h-[50px] flex items-center justify-center bg-[#f4f5f9] dark:bg-neutral-700 text-emerald-500 dark:text-neutral-300 rounded-xl hover:bg-gray-50 transition-colors';
  document.getElementById('gridBtn').className = mode === 'grid' ? on : off;
  document.getElementById('listBtn').className = mode === 'list' ? on : off;
  renderSkeletonLoading();
  setTimeout(renderDevices, 300);
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEW DEVICE MODAL
// ─────────────────────────────────────────────────────────────────────────────
function viewDevice(raw) {
  const d = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const isNode = d._kind === 'node';

  if (isNode) {
    const meds = Array.isArray(d.medical_conditions) && d.medical_conditions.length
      ? d.medical_conditions.map(m =>
          `<span class="text-xs bg-red-50 dark:bg-red-900/30 text-red-600 px-2 py-0.5 rounded-full">${m}</span>`
        ).join(' ')
      : '<span class="text-xs text-gray-400">None on file</span>';

    modalManager.create({
      id: 'viewDeviceModal',
      icon: 'uil-mobile-android', iconColor: 'text-emerald-600', iconBg: 'bg-emerald-100 dark:bg-emerald-900/60',
      title: 'Node Device Details', subtitle: d.device_id,
      body: `
        <div class="space-y-4">
          <div class="bg-emerald-500 rounded-2xl p-5 text-white flex items-center gap-4">
            <div class="bg-white/20 rounded-xl p-2.5"><i class="uil uil-mobile-android text-2xl"></i></div>
            <div>
              <p class="text-xs opacity-80">DEVICE ID</p>
              <p class="text-lg font-semibold">${d.device_id}</p>
              <p class="text-xs opacity-80">${d.device_name || ''}</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            ${infoBox('uil-user',          'Owner',      d.owner_name   || 'Unassigned')}
            ${infoBox('uil-phone',         'Contact',    d.contact      || '—')}
            ${infoBox('uil-location-point','Address',    d.address      || '—')}
            ${infoBox('uil-battery-bolt',  'Battery',    (d.battery ?? '—') + '%')}
            ${infoBox('uil-calendar-alt',  'Registered', d.registered_date || '—')}
            ${infoBox('uil-bluetooth-b',   'BT Remote',  d.bt_remote_id || '—')}
          </div>
          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase mb-2">Medical Conditions</p>
            <div class="flex flex-wrap gap-2">${meds}</div>
          </div>
        </div>`,
      primaryButton:   { text: 'Deactivate', icon: 'uil-ban', class: 'bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-50' },
      secondaryButton: { text: 'Close' },
      onPrimary:   () => { modalManager.close('viewDeviceModal'); confirmDeactivate(d); },
      onSecondary: () => modalManager.close('viewDeviceModal'),
    });

  } else {
    const typeLabel = d.device_type === 'gateway' ? 'LoRa Gateway' : 'LoRa Repeater';
    modalManager.create({
      id: 'viewLoraModal',
      icon: 'uil-wifi-router', iconColor: 'text-emerald-600', iconBg: 'bg-emerald-100 dark:bg-emerald-900/60',
      title: typeLabel + ' Details', subtitle: d.device_id,
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
            ${infoBox('uil-map-marker',   'Location',   d.location_label || '—')}
            ${infoBox('uil-signal-alt-3', 'Signal',     d.signal || '—')}
            ${infoBox('uil-layer-group',  'Coverage',   (d.coverage_radius || '—') + 'm')}
            ${infoBox('uil-wifi',         'Frequency',  d.frequency || '—')}
            ${infoBox('uil-file-alt',     'Firmware',   d.firmware || '—')}
            ${infoBox('uil-calendar-alt', 'Installed',  d.install_date || '—')}
          </div>
          ${d.lat && d.lng ? `
          <div class="bg-[#F1F5F9] dark:bg-neutral-600 rounded-xl p-3">
            <p class="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase mb-1">Coordinates</p>
            <p class="text-sm text-gray-700 dark:text-neutral-300 font-mono">${parseFloat(d.lat).toFixed(6)}, ${parseFloat(d.lng).toFixed(6)}</p>
          </div>` : ''}
          ${d.notes ? `
          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase mb-1">Notes</p>
            <p class="text-sm text-gray-700 dark:text-neutral-300 bg-[#F1F5F9] dark:bg-neutral-600 rounded-xl p-3">${d.notes}</p>
          </div>` : ''}
        </div>`,
      primaryButton:   { text: 'Deactivate', icon: 'uil-ban', class: 'bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-50' },
      secondaryButton: { text: 'Close' },
      onPrimary:   () => { modalManager.close('viewLoraModal'); confirmDeactivate(d); },
      onSecondary: () => modalManager.close('viewLoraModal'),
    });
  }

  modalManager.show(isNode ? 'viewDeviceModal' : 'viewLoraModal');
}

// ─────────────────────────────────────────────────────────────────────────────
// DEACTIVATE
// ─────────────────────────────────────────────────────────────────────────────
function confirmDeactivate(raw) {
  const d = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const isNode = d._kind === 'node';

  modalManager.create({
    id: 'deactivateModal',
    icon: 'uil-ban', iconColor: 'text-red-600 dark:text-red-400', iconBg: 'bg-red-100 dark:bg-red-900/60',
    title: 'Deactivate Device', subtitle: d.device_id,
    showWarning: true,
    warningText: 'This device will be disconnected and will no longer send or receive data.',
    body: `
      <div class="text-sm text-center">
        <p class="mb-2">Are you sure you want to deactivate <strong>${d.device_id}</strong>?</p>
        <p class="text-xs text-gray-500">${isNode ? 'Owner: ' + (d.owner_name || 'Unknown') : 'Name: ' + d.name}</p>
      </div>`,
    primaryButton:   { text: 'Deactivate', icon: 'uil-ban', class: 'bg-red-600 hover:bg-red-700' },
    secondaryButton: { text: 'Cancel' },
    onPrimary: async () => {
      modalManager.close('deactivateModal');
      if (!isNode) {
        await doDeactivateLora(d.id);
      }
      // Node device deactivation: add your own endpoint if needed
    },
    onSecondary: () => modalManager.close('deactivateModal'),
  });
  modalManager.show('deactivateModal');
}

async function doDeactivateLora(id) {
  try {
    const res  = await fetch(`${API}?action=deactivate-lora`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const json = await res.json();
    if (json.success) {
      showToast('Device deactivated', 'success');
      fetchDevices();
    } else {
      showToast(json.message || 'Failed to deactivate', 'error');
    }
  } catch {
    showToast('Network error', 'error');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD LORA MODAL  (Leaflet map + Nominatim reverse geocode)
// ─────────────────────────────────────────────────────────────────────────────
function openAddLoraModal() {
  pickedLat = null;
  pickedLng = null;

  modalManager.create({
    id: 'addLoraModal',
    icon: 'uil-wifi-router', iconColor: 'text-emerald-600', iconBg: 'bg-emerald-100 dark:bg-emerald-900/60',
    title: 'Add LoRa Device', subtitle: 'Pin the location on the map',
    body: `
      <div class="space-y-4">
        <!-- Type + Name -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-medium text-gray-600 dark:text-neutral-400 uppercase mb-1 block">Device Type *</label>
            <select id="loraType" class="w-full px-3 py-2.5 bg-[#F1F5F9] dark:bg-neutral-700 dark:text-neutral-300 rounded-xl text-sm border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400">
              <option value="gateway">Gateway</option>
              <option value="repeater">Repeater</option>
            </select>
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

          <!-- Map container -->
          <div class="w-full h-56 rounded-2xl overflow-hidden border-2 border-[#D5E7F9] dark:border-neutral-600 relative">
            <div id="loraMapEl" class="w-full h-full"></div>
            <div id="mapHint" class="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity">
              <div class="bg-white/90 dark:bg-neutral-800/90 rounded-xl px-4 py-2 shadow text-xs text-gray-500 dark:text-neutral-400">
                <i class="uil uil-crosshair mr-1"></i> Tap to drop a pin
              </div>
            </div>
          </div>

          <!-- Reverse-geocoded address -->
          <div class="mt-2 relative">
            <i class="uil uil-map-marker absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none"></i>
            <input id="loraLabel" type="text" placeholder="Address auto-fills when you pin…"
              class="w-full pl-9 pr-3 py-2.5 bg-[#F1F5F9] dark:bg-neutral-700 dark:text-neutral-300 rounded-xl text-sm border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>
          <p id="loraCoords" class="text-xs text-gray-400 dark:text-neutral-500 mt-1 pl-1 h-4"></p>
        </div>

        <!-- Signal + Coverage -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-medium text-gray-600 dark:text-neutral-400 uppercase mb-1 block">Signal</label>
            <select id="loraSignal" class="w-full px-3 py-2.5 bg-[#F1F5F9] dark:bg-neutral-700 dark:text-neutral-300 rounded-xl text-sm border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400">
              <option value="Excellent">Excellent</option>
              <option value="Good" selected>Good</option>
              <option value="Fair">Fair</option>
              <option value="Weak">Weak</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600 dark:text-neutral-400 uppercase mb-1 block">Coverage Radius (m)</label>
            <input id="loraCoverage" type="number" value="300" min="50" max="2000"
              class="w-full px-3 py-2.5 bg-[#F1F5F9] dark:bg-neutral-700 dark:text-neutral-300 rounded-xl text-sm border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>
        </div>

        <!-- Frequency + Firmware -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-medium text-gray-600 dark:text-neutral-400 uppercase mb-1 block">Frequency</label>
            <input id="loraFreq" type="text" value="915 MHz"
              class="w-full px-3 py-2.5 bg-[#F1F5F9] dark:bg-neutral-700 dark:text-neutral-300 rounded-xl text-sm border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400" />
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
    primaryButton:   { text: 'Add Device', icon: 'uil-plus' },
    secondaryButton: { text: 'Cancel' },
    onPrimary:   submitAddLora,
    onSecondary: () => { destroyLoraMap(); modalManager.close('addLoraModal'); },
  });

  modalManager.show('addLoraModal');
  setTimeout(initLoraMap, 200); // wait for modal DOM
}

// ── Init Leaflet ──────────────────────────────────────────────────────────────
function initLoraMap() {
  const el = document.getElementById('loraMapEl');
  if (!el) return;

  const load = (cb) => {
    if (typeof L !== 'undefined') { cb(); return; }
    // Load CSS
    if (!document.getElementById('leaflet-css')) {
      const link = Object.assign(document.createElement('link'), {
        id: 'leaflet-css', rel: 'stylesheet',
        href: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
      });
      document.head.appendChild(link);
    }
    // Load JS
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    s.onload = cb;
    document.head.appendChild(s);
  };

  load(() => buildMap(el));
}

function buildMap(el) {
  if (loraMap) { loraMap.remove(); loraMap = null; loraMarker = null; }

  // Center on Gulod, Novaliches, QC
  loraMap = L.map(el, { zoomControl: true }).setView([14.7142, 121.0414], 15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(loraMap);

  loraMap.on('click', onMapClick);
}

async function onMapClick(e) {
  const { lat, lng } = e.latlng;
  pickedLat = lat;
  pickedLng = lng;

  // Custom pin icon
  const pinIcon = L.divIcon({
    html: `<div style="
      width:22px;height:22px;
      background:#27C291;
      border:3px solid #fff;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:0 2px 8px rgba(0,0,0,.3);
    "></div>`,
    iconSize:   [22, 22],
    iconAnchor: [11, 22],
    className:  '',
  });

  if (loraMarker) {
    loraMarker.setLatLng([lat, lng]);
  } else {
    loraMarker = L.marker([lat, lng], { icon: pinIcon }).addTo(loraMap);
  }

  // Hide hint
  const hint = document.getElementById('mapHint');
  if (hint) hint.style.opacity = '0';

  // Show raw coords
  const coordsEl = document.getElementById('loraCoords');
  if (coordsEl) coordsEl.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  // Reverse geocode with Nominatim
  const labelEl = document.getElementById('loraLabel');
  if (labelEl) {
    labelEl.value = 'Looking up address…';
    labelEl.disabled = true;
  }
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'SafeChain/1.0' } }
    );
    const data = await res.json();
    const addr = data.address || {};

    // Build a readable label: road + suburb/village + city + country
    const parts = [
      addr.road,
      addr.suburb || addr.village || addr.neighbourhood,
      addr.city   || addr.town || addr.municipality,
      addr.country,
    ].filter(Boolean);

    const label = parts.length ? parts.join(', ') : (data.display_name || '');
    if (labelEl) labelEl.value = label;
  } catch {
    if (labelEl) labelEl.value = '';
  } finally {
    if (labelEl) labelEl.disabled = false;
  }
}

function destroyLoraMap() {
  if (loraMap) { loraMap.remove(); loraMap = null; loraMarker = null; }
  pickedLat = null;
  pickedLng = null;
}

// ── Submit add lora ───────────────────────────────────────────────────────────
async function submitAddLora() {
  const errEl = document.getElementById('loraError');
  errEl.classList.add('hidden');

  const name     = document.getElementById('loraName')?.value.trim();
  const type     = document.getElementById('loraType')?.value;
  const label    = document.getElementById('loraLabel')?.value.trim();
  const signal   = document.getElementById('loraSignal')?.value;
  const coverage = parseInt(document.getElementById('loraCoverage')?.value || '300');
  const freq     = document.getElementById('loraFreq')?.value.trim();
  const firmware = document.getElementById('loraFirmware')?.value.trim();
  const notes    = document.getElementById('loraNotes')?.value.trim();

  // Client-side validation
  if (!name) {
    showFormError(errEl, 'Device name is required'); return;
  }
  if (pickedLat === null || pickedLng === null) {
    showFormError(errEl, 'Please tap the map to pin a location'); return;
  }

  // Disable button while submitting
  const btn = document.querySelector('[data-modal-primary="addLoraModal"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Adding…'; }

  try {
    const res  = await fetch(`${API}?action=add-lora`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, device_type: type, location_label: label,
        lat: pickedLat, lng: pickedLng,
        signal, coverage_radius: coverage,
        frequency: freq, firmware, notes,
        install_date: new Date().toISOString().split('T')[0],
      }),
    });
    const json = await res.json();

    if (json.success) {
      destroyLoraMap();
      modalManager.close('addLoraModal');
      showToast(`${json.data.device_id} added successfully`, 'success');
      fetchDevices(); // refresh list
    } else {
      const msg = json.errors ? json.errors.join(', ') : (json.message || 'Failed to add device');
      showFormError(errEl, msg);
    }
  } catch {
    showFormError(errEl, 'Network error — please try again');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Add Device'; }
  }
}

function showFormError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

// ─────────────────────────────────────────────────────────────────────────────
// DROPDOWN
// ─────────────────────────────────────────────────────────────────────────────
const activeDropdownClasses = [
  'bg-emerald-50','border-emerald-500','text-emerald-600',
  'dark:bg-emerald-700/20','dark:border-emerald-700/20','dark:text-emerald-300',
];

document.addEventListener('DOMContentLoaded', () => {
  const dropBtn  = document.getElementById('sortDropdownButton');
  const dropMenu = document.getElementById('sortDropdownMenu');
  const dropIcon = document.getElementById('sortDropdownIcon');
  const dropText = document.getElementById('sortSelectedText');

  if (dropBtn) {
    dropBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const hidden = dropMenu.classList.contains('hidden');
      dropMenu.classList.toggle('hidden', !hidden);
      dropIcon.style.transform = hidden ? 'rotate(180deg)' : 'rotate(0deg)';
    });
  }

  document.addEventListener('click', () => {
    if (dropMenu) {
      dropMenu.classList.add('hidden');
      dropIcon.style.transform = 'rotate(0deg)';
    }
  });

  document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedType = item.getAttribute('data-value');
      dropText.textContent = item.textContent.trim();

      document.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove(...activeDropdownClasses));
      item.classList.add(...activeDropdownClasses);

      dropMenu.classList.add('hidden');
      dropIcon.style.transform = 'rotate(0deg)';

      renderSkeletonLoading();
      setTimeout(renderDevices, 400);
    });
  });

  // Search
  const searchInput = document.querySelector('input[placeholder="Search devices..."]');
  if (searchInput) searchInput.addEventListener('input', handleSearch);

  // Initial load
  setViewMode(currentView);
  fetchDevices();
});