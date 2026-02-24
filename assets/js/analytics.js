// ============================================================
// FILTER STATE
// ============================================================

let filterState = {
  timePeriod: 'last30days',
  fromDate: '',
  toDate: '',
  incidentTypes: ['all'],
  status: ['all'],
};

let exportConfig = {
  timeline: 'last30days',
  fromDate: '',
  toDate: '',
  includeData: {
    summary: true,
    incidents: true,
    charts: false,
    deviceLogs: false,
    residents: false,
  },
};

let chartInstances = {
  incidentTrends: null,
  incidentTypes: null,
  responseTime: null,
  peakHours: null,
};

// ============================================================
// FETCH & RENDER
// ============================================================

async function fetchAnalytics(filters = filterState) {
  try {
    const params = new URLSearchParams({
      period: filters.timePeriod,
      from:   filters.fromDate,
      to:     filters.toDate,
      types:  filters.incidentTypes.join(','),
      status: filters.status.join(','),
    });

    const response = await fetch(`api/analytics/get_analytics.php?${params}`);
    const result   = await response.json();

    if (!result.success) return;

    updateStatisticsCards(result.summary, result.changes);
    updateAllCharts(result);
    updateIncidentTable(result.tableData);

  } catch (err) {
    console.error('Analytics fetch error:', err);
  }
}

function updateStatisticsCards(summary, changes) {
  const totalEl      = document.querySelector('[data-stat="total"]');
  const responseEl   = document.querySelector('[data-stat="response"]');
  const resolutionEl = document.querySelector('[data-stat="resolution"]');

  if (totalEl)      totalEl.textContent      = summary.total;
  if (responseEl)   responseEl.textContent   = summary.avgResponseTime;
  if (resolutionEl) resolutionEl.textContent = summary.resolutionRate;

  if (changes) {
    updateBadge('[data-badge="total"]',      changes.total);
    updateBadge('[data-badge="response"]',   changes.avgResponseTime);
    updateBadge('[data-badge="resolution"]', changes.resolutionRate);
  }
}

function updateBadge(selector, changePercent) {
  const badge = document.querySelector(selector);
  if (!badge) return;

  const isPositive = changePercent >= 0;
  const absVal = Math.abs(changePercent);

  badge.className = `animate-pulse-custom flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold
    ${isPositive
      ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-500 dark:from-emerald-950/60 dark:to-emerald-900/40 dark:text-emerald-400 dark:border dark:border-emerald-800/30'
      : 'bg-gradient-to-br from-red-50 to-red-100 text-red-500 dark:from-red-950/60 dark:to-red-900/40 dark:text-red-400 dark:border dark:border-red-800/30'}`;

  badge.innerHTML = `<i class="uil uil-arrow-${isPositive ? 'up' : 'down'}"></i> ${absVal}%`;
}

function updateAllCharts(data) {
  // Trends
  if (chartInstances.incidentTrends) {
    chartInstances.incidentTrends.data.labels           = data.trendLabels;
    chartInstances.incidentTrends.data.datasets[0].data = data.trendData;
    chartInstances.incidentTrends.update();
  }

  // Type distribution
  if (chartInstances.incidentTypes) {
    chartInstances.incidentTypes.data.labels           = Object.keys(data.typeDistribution).map(t => t.charAt(0).toUpperCase() + t.slice(1));
    chartInstances.incidentTypes.data.datasets[0].data = Object.values(data.typeDistribution);
    chartInstances.incidentTypes.update();
  }

  // Response time
  if (chartInstances.responseTime) {
    chartInstances.responseTime.data.datasets[0].data = Object.values(data.responseDistribution);
    chartInstances.responseTime.update();
  }

  // Peak hours
  if (chartInstances.peakHours) {
    chartInstances.peakHours.data.datasets[0].data = selectedHours.map(h => data.peakHours[h] || 0);
    chartInstances.peakHours.update();
  }
}

function updateIncidentTable(rows) {
  const tbody = document.querySelector('tbody');
  if (!tbody) return;

  if (!rows || rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-gray-400">No incidents found</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(inc => `
    <tr class="hover:bg-gray-50 dark:hover:bg-neutral-700/50">
      <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">${inc.id}</td>
      <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">${inc.type}</td>
      <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">${inc.resident}</td>
      <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">${inc.location}</td>
      <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">${inc.timeReported}</td>
      <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">${inc.responseTime}</td>
      <td class="px-6 py-4">
        <span class="px-3 py-1 inline-flex text-xs font-semibold rounded-full ${getStatusClass(inc.status)}">
          ${inc.status}
        </span>
      </td>
    </tr>
  `).join('');
}

function getStatusClass(status) {
  const classes = {
    Resolved:   'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    Responding: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    Pending:    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  };
  return classes[status] || '';
}

// ============================================================
// CHART INITIALIZATION
// ============================================================

function initializeCharts() {
  const ctx1 = document.getElementById('incidentTrendsChart').getContext('2d');
  chartInstances.incidentTrends = new Chart(ctx1, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Incidents',
        data: [],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 3, fill: true, tension: 0.4,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#8b5cf6',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true, position: 'bottom',
          labels: { color: '#6b7280', usePointStyle: true, padding: 5 },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: '#9ca3af', stepSize: 20 },
          grid: { color: '#e5e7eb', borderDash: [5, 5] },
        },
        x: {
          ticks: { color: '#9ca3af' },
          grid: { display: true },
        },
      },
    },
  });

  const ctx2 = document.getElementById('incidentTypesChart').getContext('2d');
  chartInstances.incidentTypes = new Chart(ctx2, {
    type: 'doughnut',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: ['#8b5cf6', '#22d3ee', '#fb7185'],
        borderWidth: 0,
        hoverOffset: 10,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '60%',
      plugins: {
        legend: {
          display: true, position: 'bottom',
          labels: { color: '#6b7280', usePointStyle: true, padding: 15 },
        },
      },
    },
  });

  const ctx3 = document.getElementById('responseTimeChart').getContext('2d');
  chartInstances.responseTime = new Chart(ctx3, {
    type: 'bar',
    data: {
      labels: ['0-2 mins', '2-4 mins', '4-6 mins', '6+ mins'],
      datasets: [{
        label: 'Incidents',
        data: [],
        backgroundColor: 'rgba(139, 92, 246, 1)',
        borderRadius: { topLeft: 50, topRight: 50, bottomLeft: 0, bottomRight: 0 },
        borderSkipped: 'bottom',
        barThickness: 60,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true, position: 'bottom',
          labels: { color: '#6b7280', usePointStyle: true, padding: 15 },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: '#9ca3af', stepSize: 20 },
          grid: { color: '#e5e7eb', borderDash: [5, 5] },
        },
        x: {
          ticks: { color: '#9ca3af' },
          grid: { color: '#e5e7eb', borderDash: [5, 5] },
        },
      },
    },
  });

  const ctx4 = document.getElementById('peakHoursChart').getContext('2d');
  chartInstances.peakHours = new Chart(ctx4, {
    type: 'bar',
    data: {
    labels: ['12AM','1AM','2AM','3AM','4AM','5AM','6AM','7AM','8AM','9AM','10AM','11AM',
         '12PM','1PM','2PM','3PM','4PM','5PM','6PM','7PM','8PM','9PM','10PM','11PM'],
      datasets: [{
        label: 'Incidents',
        data: [],
        backgroundColor: 'rgba(139, 92, 246, 1)',
        borderRadius: Number.MAX_VALUE,
        borderSkipped: false,
        barThickness: 18,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true, position: 'bottom',
          labels: { color: '#6b7280', usePointStyle: true, padding: 15 },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: '#9ca3af', stepSize: 5 },
          grid: { color: '#e5e7eb', borderDash: [5, 5] },
        },
        x: {
          ticks: { color: '#9ca3af' },
          grid: { color: '#e5e7eb', borderDash: [5, 5] },
        },
      },
    },
  });
}

// ============================================================
// FILTER MODAL
// ============================================================

function showFilterModal() {
  const modalId = modalManager.create({
    id: 'filterModal',
    icon: 'uil-filter',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    title: 'Filter Analytics',
    subtitle: 'Apply filters to view specific analytics data',
    body: generateFilterModalBody(),
    primaryButton: {
      text: 'Apply Filter',
      icon: 'uil-check',
      class: 'bg-[#01AF78] hover:bg-[#00965F]',
    },
    tertiaryButton: {
      text: 'Reset',
      hidden: false,
      class: 'bg-transparent border border-[#01AF78] text-[#01af78] hover:bg-emerald-500/20',
    },
    secondaryButton: { text: 'Close' },
    onPrimary: () => {
      applyFilters();
      modalManager.close('filterModal');
    },
    onSecondary: () => modalManager.close('filterModal'),
    onTertiary: () => {
      resetFilters();
      modalManager.close('filterModal');
    },
  });

  modalManager.show(modalId);
}

function generateFilterModalBody() {
  return `
    <div class="space-y-6">
      <!-- TIME PERIOD -->
      <div>
        <label class="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-3">Time Period</label>
        <div class="grid grid-cols-3 gap-2 mb-2">
          <button onclick="setTimePeriod('last7days')" class="time-period-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${filterState.timePeriod === 'last7days' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500'}" data-period="last7days">Last 7 Days</button>
          <button onclick="setTimePeriod('last30days')" class="time-period-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${filterState.timePeriod === 'last30days' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500'}" data-period="last30days">Last 30 Days</button>
          <button onclick="setTimePeriod('last90days')" class="time-period-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${filterState.timePeriod === 'last90days' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500'}" data-period="last90days">Last 90 Days</button>
        </div>
      </div>

      <!-- DATE RANGE -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">From Date</label>
          <input type="date" id="fromDate" value="${filterState.fromDate}" class="w-full px-4 py-2.5 text-sm border-2 border-gray-300 dark:border-neutral-600 rounded-lg bg-gray-50 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">To Date</label>
          <input type="date" id="toDate" value="${filterState.toDate}" class="w-full px-4 py-2.5 text-sm border-2 border-gray-300 dark:border-neutral-600 rounded-lg bg-gray-50 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
        </div>
      </div>

      <!-- INCIDENT TYPE -->
      <div>
        <label class="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-3">Incident Type</label>
        <div class="grid grid-cols-2 gap-2">
          ${generateIncidentTypeButtons()}
        </div>
      </div>
    </div>
  `;
}

function generateIncidentTypeButtons() {
  const types = ['all', 'crime', 'flood', 'fire'];
  return types.map(type => `
    <button onclick="toggleIncidentType('${type}')" class="incident-type-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${filterState.incidentTypes.includes(type) ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500'}" data-type="${type}">
      ${type.charAt(0).toUpperCase() + type.slice(1)}
    </button>
  `).join('');
}

window.setTimePeriod = function (period) {
  filterState.timePeriod = period;
  updateFilterButtons();
};

window.toggleIncidentType = function (type) {
  if (type === 'all') {
    filterState.incidentTypes = ['all'];
  } else {
    filterState.incidentTypes = filterState.incidentTypes.filter(t => t !== 'all');
    if (filterState.incidentTypes.includes(type)) {
      filterState.incidentTypes = filterState.incidentTypes.filter(t => t !== type);
    } else {
      filterState.incidentTypes.push(type);
    }
    if (filterState.incidentTypes.length === 0) filterState.incidentTypes = ['all'];
  }
  updateFilterButtons();
};

window.toggleStatus = function (status) {
  if (status === 'all') {
    filterState.status = ['all'];
  } else {
    filterState.status = filterState.status.filter(s => s !== 'all');
    if (filterState.status.includes(status)) {
      filterState.status = filterState.status.filter(s => s !== status);
    } else {
      filterState.status.push(status);
    }
    if (filterState.status.length === 0) filterState.status = ['all'];
  }
  updateFilterButtons();
};

function updateFilterButtons() {
  const fromDate = document.getElementById('fromDate');
  const toDate   = document.getElementById('toDate');
  if (fromDate) filterState.fromDate = fromDate.value;
  if (toDate)   filterState.toDate   = toDate.value;

  document.querySelectorAll('.time-period-btn').forEach(btn => {
    const period = btn.getAttribute('data-period');
    btn.className = `time-period-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${period === filterState.timePeriod ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500'}`;
  });

  document.querySelectorAll('.incident-type-btn').forEach(btn => {
    const type = btn.getAttribute('data-type');
    btn.className = `incident-type-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${filterState.incidentTypes.includes(type) ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500'}`;
  });

  document.querySelectorAll('.status-btn').forEach(btn => {
    const status = btn.getAttribute('data-status');
    btn.className = `status-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${filterState.status.includes(status) ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500'}`;
  });
}

function applyFilters() {
  fetchAnalytics(filterState);
}

function resetFilters() {
  filterState = {
    timePeriod: 'last30days',
    fromDate: '', toDate: '',
    incidentTypes: ['all'],
    status: ['all'],
  };
  fetchAnalytics(filterState);
}

// ============================================================
// EXPORT MODAL
// ============================================================

function showExportModal() {
  const modalId = modalManager.create({
    id: 'exportModal',
    icon: 'uil-download-alt',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    title: 'Export Analytics Report',
    subtitle: 'Customize your export by selecting data and timeline',
    body: `
      <div class="space-y-6 max-h-[500px] overflow-y-auto pr-2">
        <!-- TIMELINE -->
        <div>
          <label class="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-3">
            <i class="uil uil-calendar-alt mr-1"></i> Export Timeline
          </label>
          <div class="grid grid-cols-2 gap-2 mb-3">
            ${['last7days','last30days','last90days','custom'].map(t => `
              <button onclick="setExportTimeline('${t}')" class="export-timeline-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${exportConfig.timeline === t ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500'}" data-timeline="${t}">
                ${{ last7days: 'Last 7 Days', last30days: 'Last 30 Days', last90days: 'Last 90 Days', custom: 'Custom Range' }[t]}
              </button>
            `).join('')}
          </div>
          <div id="customDateRange" class="grid grid-cols-2 gap-3 ${exportConfig.timeline === 'custom' ? '' : 'hidden'}">
            <div>
              <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">From Date</label>
              <input type="date" id="exportFromDate" value="${exportConfig.fromDate}" class="w-full px-3 py-2 text-sm border-2 border-gray-300 dark:border-neutral-600 rounded-lg bg-gray-50 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-emerald-500" onchange="updateExportDateRange()">
            </div>
            <div>
              <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">To Date</label>
              <input type="date" id="exportToDate" value="${exportConfig.toDate}" class="w-full px-3 py-2 text-sm border-2 border-gray-300 dark:border-neutral-600 rounded-lg bg-gray-50 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-emerald-500" onchange="updateExportDateRange()">
            </div>
          </div>
        </div>

        <!-- DATA SELECTION -->
        <div>
          <label class="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-3">
            <i class="uil uil-database mr-1"></i> Select Data to Export
          </label>
          <div class="space-y-2">
            ${[
              { key: 'summary',    label: 'Summary Statistics',    desc: 'Total incidents, response times, resolution rates',   icon: 'uil-chart-line',      checked: true },
              { key: 'incidents',  label: 'Incident Details',       desc: 'Complete incident records with timestamps',           icon: 'uil-file-info-alt',   checked: true },
              { key: 'charts',     label: 'Chart Data',             desc: 'Trend analysis and distribution data',               icon: 'uil-chart-pie',       checked: false },
              { key: 'deviceLogs', label: 'Device Activity Logs',   desc: 'IoT device triggers and sensor data',                icon: 'uil-server',          checked: false },
              { key: 'residents',  label: 'Resident Information',   desc: 'Contact details and incident history',               icon: 'uil-users-alt',       checked: false },
            ].map(item => `
              <label class="flex items-center p-3 border-2 border-gray-200 dark:border-neutral-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-all">
                <input type="checkbox" id="export-${item.key}" ${item.checked ? 'checked' : ''} onchange="toggleExportData('${item.key}')" class="w-5 h-5 appearance-none border-2 border-gray-300 rounded-md checked:bg-[#01AF78] checked:border-[#01AF78] focus:ring-2 focus:ring-emerald-100 transition-all cursor-pointer bg-[length:10px_10px] bg-center bg-no-repeat checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOSIgdmlld0JveD0iMCAwIDEyIDkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgNEw0LjUgNy41TDExIDEiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')]">
                <div class="ml-3 flex-1">
                  <div class="text-sm font-semibold text-gray-800 dark:text-white">${item.label}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">${item.desc}</div>
                </div>
                <i class="uil ${item.icon} text-xl text-gray-400"></i>
              </label>
            `).join('')}
          </div>
        </div>

        <!-- EXPORT FORMAT -->
        <div>
          <label class="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-3">
            <i class="uil uil-file-alt mr-1"></i> Choose Export Format
          </label>
          <div class="grid grid-cols-2 gap-3">
            <button onclick="executeExport('csv')" class="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-neutral-600 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all">
              <div class="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                <i class="uil uil-file-alt text-xl text-emerald-600"></i>
              </div>
              <div class="flex-1 text-left">
                <div class="text-sm font-semibold text-gray-800 dark:text-white">CSV</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">Spreadsheet</div>
              </div>
            </button>
            <button onclick="executeExport('pdf')" class="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-neutral-600 rounded-xl hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
              <div class="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <i class="uil uil-file-download-alt text-xl text-red-600"></i>
              </div>
              <div class="flex-1 text-left">
                <div class="text-sm font-semibold text-gray-800 dark:text-white">PDF</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">Document</div>
              </div>
            </button>
          </div>
        </div>

        <!-- PREVIEW INFO -->
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div class="flex items-start gap-2">
            <i class="uil uil-info-circle text-blue-600 text-lg mt-0.5"></i>
            <div class="text-xs text-blue-800 dark:text-blue-300">
              <div class="font-semibold mb-1">Export Preview</div>
              <div id="exportSummary">Select data to see export details</div>
            </div>
          </div>
        </div>
      </div>
    `,
    secondaryButton: { text: 'Cancel', icon: 'uil-times' },
    onSecondary: () => modalManager.close('exportModal'),
  });

  modalManager.show(modalId);
  updateExportSummary();
}

window.setExportTimeline = function (timeline) {
  exportConfig.timeline = timeline;

  const customDateRange = document.getElementById('customDateRange');
  if (customDateRange) {
    customDateRange.classList.toggle('hidden', timeline !== 'custom');
  }

  document.querySelectorAll('.export-timeline-btn').forEach(btn => {
    const t = btn.getAttribute('data-timeline');
    btn.className = `export-timeline-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${t === timeline ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500'}`;
  });

  updateExportSummary();
};

window.updateExportDateRange = function () {
  const from = document.getElementById('exportFromDate');
  const to   = document.getElementById('exportToDate');
  if (from) exportConfig.fromDate = from.value;
  if (to)   exportConfig.toDate   = to.value;
  updateExportSummary();
};

window.toggleExportData = function (dataType) {
  const checkbox = document.getElementById(`export-${dataType}`);
  if (checkbox) exportConfig.includeData[dataType] = checkbox.checked;
  updateExportSummary();
};

function updateExportSummary() {
  const summaryEl = document.getElementById('exportSummary');
  if (!summaryEl) return;

  const includedCount = Object.values(exportConfig.includeData).filter(v => v).length;
  const timelineMap = { last7days: 'last 7 days', last30days: 'last 30 days', last90days: 'last 90 days' };
  const timelineText = (exportConfig.timeline === 'custom' && exportConfig.fromDate && exportConfig.toDate)
    ? `from ${exportConfig.fromDate} to ${exportConfig.toDate}`
    : timelineMap[exportConfig.timeline] || 'selected period';

  const selectedData = Object.keys(exportConfig.includeData)
    .filter(k => exportConfig.includeData[k])
    .map(k => k.charAt(0).toUpperCase() + k.slice(1))
    .join(', ');

  summaryEl.innerHTML = `
    <strong>${includedCount} data section${includedCount !== 1 ? 's' : ''}</strong> selected for export<br>
    <span class="text-blue-600 dark:text-blue-400">${selectedData || 'None'}</span><br>
    Timeline: <strong>${timelineText}</strong>
  `;
}

// ============================================================
// EXPORT EXECUTION
// ============================================================

window.executeExport = async function (format) {
  const hasData = Object.values(exportConfig.includeData).some(v => v);
  if (!hasData) {
    showToast('warning', 'Please select at least one data section to export');
    return;
  }

  if (exportConfig.timeline === 'custom' && (!exportConfig.fromDate || !exportConfig.toDate)) {
    showToast('warning', 'Please select both from and to dates for custom range');
    return;
  }

  modalManager.close('exportModal');
  showToast('info', `Preparing ${format.toUpperCase()} export...`);

  try {
    // Fetch real data for export
    const params = new URLSearchParams({
      period: exportConfig.timeline,
      from:   exportConfig.fromDate,
      to:     exportConfig.toDate,
      types:  'all',
      status: 'all',
    });

    const response = await fetch(`api/analytics/get_analytics.php?${params}`);
    const result   = await response.json();

    if (!result.success) {
      showToast('error', 'Failed to fetch export data');
      return;
    }

    const exportData = {
      metadata: {
        exportDateFormatted: new Date().toLocaleDateString(),
        timeline: exportConfig.timeline,
        fromDate: exportConfig.fromDate,
        toDate:   exportConfig.toDate,
        recordCount: result.summary.total,
      },
    };

    if (exportConfig.includeData.summary)   exportData.summary   = result.summary;
    if (exportConfig.includeData.incidents) exportData.incidents = result.tableData;
    if (exportConfig.includeData.charts)    exportData.charts    = { typeDistribution: result.typeDistribution, responseDistribution: result.responseDistribution };

    if (format === 'csv') downloadCSV(exportData);
    if (format === 'pdf') downloadPDF(exportData);

    showToast('success', `Report exported as ${format.toUpperCase()} successfully!`);

  } catch (err) {
    console.error('Export error:', err);
    showToast('error', 'Export failed. Please try again.');
  }
};

// ============================================================
// DOWNLOAD FUNCTIONS
// ============================================================

function downloadCSV(data) {
  let csv = 'SafeChain Analytics Report\n';
  csv += `Generated: ${data.metadata.exportDateFormatted}\n`;
  csv += `Timeline: ${data.metadata.timeline}\n`;
  csv += `Records: ${data.metadata.recordCount}\n\n`;

  if (data.summary) {
    csv += '=== SUMMARY STATISTICS ===\n';
    csv += 'Metric,Value\n';
    csv += `Total Incidents,${data.summary.total}\n`;
    csv += `Average Response Time,${data.summary.avgResponseTime}\n`;
    csv += `Resolution Rate,${data.summary.resolutionRate}\n`;
    csv += `Resolved,${data.summary.resolved}\n`;
    csv += `Responding,${data.summary.responding}\n`;
    csv += `Pending,${data.summary.pending}\n\n`;
  }

  if (data.incidents) {
    csv += '=== INCIDENT DETAILS ===\n';
    csv += 'ID,Type,Resident,Location,Time Reported,Response Time,Status\n';
    data.incidents.forEach(inc => {
      csv += `${inc.id},${inc.type},"${inc.resident}","${inc.location}",${inc.timeReported},${inc.responseTime},${inc.status}\n`;
    });
    csv += '\n';
  }

  if (data.charts) {
    csv += '=== INCIDENT TYPE DISTRIBUTION ===\n';
    csv += 'Type,Count\n';
    Object.entries(data.charts.typeDistribution).forEach(([type, count]) => {
      csv += `${type},${count}\n`;
    });
    csv += '\n';

    csv += '=== RESPONSE TIME DISTRIBUTION ===\n';
    csv += 'Range,Count\n';
    Object.entries(data.charts.responseDistribution).forEach(([range, count]) => {
      csv += `${range},${count}\n`;
    });
    csv += '\n';
  }

  downloadFile(csv, 'text/csv', 'csv');
}

function downloadPDF(data) {
  let content = 'SafeChain Analytics Report\n\n';
  content += `Generated: ${data.metadata.exportDateFormatted}\n`;
  content += `Timeline: ${data.metadata.timeline}\n`;
  content += `Total Records: ${data.metadata.recordCount}\n\n`;

  if (data.summary) {
    content += 'SUMMARY STATISTICS\n';
    content += `Total Incidents: ${data.summary.total}\n`;
    content += `Average Response Time: ${data.summary.avgResponseTime}\n`;
    content += `Resolution Rate: ${data.summary.resolutionRate}\n\n`;
  }

  content += 'Note: For full PDF with charts, integrate jsPDF library.\n';
  downloadFile(content, 'application/pdf', 'pdf');
}

function downloadFile(content, mimeType, extension) {
  const blob = new Blob([content], { type: mimeType });
  const url  = window.URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `SafeChain_Analytics_${new Date().toISOString().split('T')[0]}.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  initializeCharts();
  fetchAnalytics(); // Load real data immediately

  const exportBtn = document.querySelector('.header-actions button:last-child');
  const filterBtn = document.querySelector('.header-actions button:first-child');
  if (exportBtn) exportBtn.addEventListener('click', showExportModal);
  if (filterBtn) filterBtn.addEventListener('click', showFilterModal);
});

// Fallback toast if not defined globally
if (typeof showToast === 'undefined') {
  window.showToast = function (type, message) {
    console.log(`[${type.toUpperCase()}] ${message}`);
  };
}