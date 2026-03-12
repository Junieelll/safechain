// ============================================================
// FILTER STATE
// ============================================================

let filterState = {
  timePeriod: "last30days",
  fromDate: "",
  toDate: "",
  incidentTypes: ["all"],
  status: ["all"],
};

let exportConfig = {
  timeline: "last30days",
  fromDate: "",
  toDate: "",
  includeData: {
    summary: true,
    incidents: true,
    charts: false,
    heatmap: false,
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
      from: filters.fromDate,
      to: filters.toDate,
      types: filters.incidentTypes.join(","),
      status: filters.status.join(","),
    });

    const response = await fetch(`api/analytics/get_analytics.php?${params}`);
    const result = await response.json();

    if (!result.success) return;

    updateStatisticsCards(result.summary, result.changes);
    updateAllCharts(result);
    updateIncidentTable(result.tableData);
  } catch (err) {
    console.error("Analytics fetch error:", err);
  }
}

function updateStatisticsCards(summary, changes) {
  const totalEl = document.querySelector('[data-stat="total"]');
  const responseEl = document.querySelector('[data-stat="response"]');
  const resolutionEl = document.querySelector('[data-stat="resolution"]');

  if (totalEl) totalEl.textContent = summary.total;
  if (responseEl) responseEl.textContent = summary.avgResponseTime;
  if (resolutionEl) resolutionEl.textContent = summary.resolutionRate;

  if (changes) {
    updateBadge('[data-badge="total"]', changes.total);
    updateBadge('[data-badge="response"]', changes.avgResponseTime);
    updateBadge('[data-badge="resolution"]', changes.resolutionRate);
  }
}

function updateBadge(selector, changePercent) {
  const badge = document.querySelector(selector);
  if (!badge) return;

  // Hide badge if no change
  if (changePercent === 0) {
    badge.style.display = "none";
    return;
  }

  badge.style.display = "flex";

  const isPositive = changePercent >= 0;
  const absVal = Math.abs(changePercent);

  badge.className = `animate-pulse-custom flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold
    ${
      isPositive
        ? "bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-500 dark:from-emerald-950/60 dark:to-emerald-900/40 dark:text-emerald-400 dark:border dark:border-emerald-800/30"
        : "bg-gradient-to-br from-red-50 to-red-100 text-red-500 dark:from-red-950/60 dark:to-red-900/40 dark:text-red-400 dark:border dark:border-red-800/30"
    }`;

  badge.innerHTML = `<i class="uil uil-arrow-${isPositive ? "up" : "down"}"></i> ${absVal}%`;
}

function updateAllCharts(data) {
  // Trends
  if (chartInstances.incidentTrends) {
    chartInstances.incidentTrends.data.labels = data.trendLabels;
    chartInstances.incidentTrends.data.datasets[0].data = data.trendData;
    chartInstances.incidentTrends.update();
  }

  // Type distribution
  if (chartInstances.incidentTypes) {
    const colorMap = {
      fire: "#ef4444", // red
      crime: "#eab308", // yellow
      flood: "#3b82f6", // blue
    };

    const labels = Object.keys(data.typeDistribution).map(
      (t) => t.charAt(0).toUpperCase() + t.slice(1),
    );
    const colors = Object.keys(data.typeDistribution).map(
      (t) => colorMap[t.toLowerCase()] || "#8b5cf6",
    );

    chartInstances.incidentTypes.data.labels = labels;
    chartInstances.incidentTypes.data.datasets[0].data = Object.values(
      data.typeDistribution,
    );
    chartInstances.incidentTypes.data.datasets[0].backgroundColor = colors;
    chartInstances.incidentTypes.update();
  }

  // Response time
  if (chartInstances.responseTime) {
    chartInstances.responseTime.data.datasets[0].data = Object.values(
      data.responseDistribution,
    );
    chartInstances.responseTime.update();
  }

  // Peak hours
  if (chartInstances.peakHours) {
    const blocks = [
      [0, 1, 2, 3, 4, 5], // 12AM–5AM  (late night)
      [6, 7, 8, 9], // 6AM–9AM   (morning)
      [10, 11, 12], // 10AM–12PM (midday)
      [13, 14, 15, 16], // 1PM–4PM   (afternoon)
      [17, 18, 19, 20], // 5PM–8PM   (evening)
      [21, 22, 23], // 9PM–11PM  (night)
    ];
    chartInstances.peakHours.data.datasets[0].data = blocks.map((hours) =>
      hours.reduce((sum, h) => sum + (data.peakHours[h] || 0), 0),
    );
    chartInstances.peakHours.update();
  }
}

function updateIncidentTable(rows) {
  const tbody = document.querySelector("tbody");
  if (!tbody) return;

  if (!rows || rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-gray-400">No incidents found</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .map(
      (inc) => `
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
  `,
    )
    .join("");
}

function getStatusClass(status) {
  const classes = {
    Resolved:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    Responding:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    Pending:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  };
  return classes[status] || "";
}

// ============================================================
// CHART INITIALIZATION
// ============================================================

function initializeCharts() {
  const ctx1 = document.getElementById("incidentTrendsChart").getContext("2d");
  chartInstances.incidentTrends = new Chart(ctx1, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Incidents",
          data: [],
          borderColor: "#8b5cf6",
          backgroundColor: "rgba(139, 92, 246, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#fff",
          pointBorderColor: "#8b5cf6",
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: { color: "#6b7280", usePointStyle: true, padding: 5 },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: "#9ca3af", stepSize: 20 },
          grid: { color: "#e5e7eb", borderDash: [5, 5] },
        },
        x: {
          ticks: { color: "#9ca3af" },
          grid: { display: true },
        },
      },
    },
  });

  const ctx2 = document.getElementById("incidentTypesChart").getContext("2d");
  chartInstances.incidentTypes = new Chart(ctx2, {
    type: "doughnut",
    data: {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: [],
          borderWidth: 0,
          hoverOffset: 10,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: "60%",
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: { color: "#6b7280", usePointStyle: true, padding: 15 },
        },
      },
    },
  });

  const ctx3 = document.getElementById("responseTimeChart").getContext("2d");
  chartInstances.responseTime = new Chart(ctx3, {
    type: "bar",
    data: {
      labels: ["0-2 mins", "2-4 mins", "4-6 mins", "6+ mins"],
      datasets: [
        {
          label: "Incidents",
          data: [],
          backgroundColor: "rgba(139, 92, 246, 1)",
          borderRadius: {
            topLeft: 50,
            topRight: 50,
            bottomLeft: 0,
            bottomRight: 0,
          },
          borderSkipped: "bottom",
          barThickness: 60,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: { color: "#6b7280", usePointStyle: true, padding: 15 },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: "#9ca3af", stepSize: 20 },
          grid: { color: "#e5e7eb", borderDash: [5, 5] },
        },
        x: {
          ticks: { color: "#9ca3af" },
          grid: { color: "#e5e7eb", borderDash: [5, 5] },
        },
      },
    },
  });

  const ctx4 = document.getElementById("peakHoursChart").getContext("2d");
  chartInstances.peakHours = new Chart(ctx4, {
    type: "bar",
    data: {
      labels: [
        "12AM–5AM",
        "6AM–9AM",
        "10AM–12PM",
        "1PM–4PM",
        "5PM–8PM",
        "9PM–11PM",
      ],
      datasets: [
        {
          label: "Incidents",
          data: [],
          backgroundColor: [
            "rgba(139, 92, 246, 0.3)",
            "rgba(139, 92, 246, 0.5)",
            "rgba(139, 92, 246, 0.75)",
            "rgba(139, 92, 246, 1)",
            "rgba(139, 92, 246, 0.65)",
            "rgba(139, 92, 246, 0.4)",
          ],
          borderRadius: Number.MAX_VALUE,
          borderSkipped: false,
          barThickness: 52,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: { color: "#6b7280", usePointStyle: true, padding: 15 },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: "#9ca3af", stepSize: 5 },
          grid: { color: "#e5e7eb", borderDash: [5, 5] },
        },
        x: {
          ticks: { color: "#9ca3af" },
          grid: { color: "#e5e7eb", borderDash: [5, 5] },
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
    id: "filterModal",
    icon: "uil-filter",
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    title: "Filter Analytics",
    subtitle: "Apply filters to view specific analytics data",
    body: generateFilterModalBody(),
    primaryButton: {
      text: "Apply Filter",
      icon: "uil-check",
      class: "bg-[#01AF78] hover:bg-[#00965F]",
    },
    tertiaryButton: {
      text: "Reset",
      hidden: false,
      class:
        "bg-transparent border border-[#01AF78] text-[#01af78] hover:bg-emerald-500/20",
    },
    secondaryButton: { text: "Close" },
    onPrimary: () => {
      applyFilters();
      modalManager.close("filterModal");
    },
    onSecondary: () => modalManager.close("filterModal"),
    onTertiary: () => {
      resetFilters();
      modalManager.close("filterModal");
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
          <button onclick="setTimePeriod('last7days')" class="time-period-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${filterState.timePeriod === "last7days" ? "bg-emerald-500 text-white border-emerald-500" : "bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500"}" data-period="last7days">Last 7 Days</button>
          <button onclick="setTimePeriod('last30days')" class="time-period-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${filterState.timePeriod === "last30days" ? "bg-emerald-500 text-white border-emerald-500" : "bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500"}" data-period="last30days">Last 30 Days</button>
          <button onclick="setTimePeriod('last90days')" class="time-period-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${filterState.timePeriod === "last90days" ? "bg-emerald-500 text-white border-emerald-500" : "bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500"}" data-period="last90days">Last 90 Days</button>
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
  const types = ["all", "crime", "flood", "fire"];
  return types
    .map(
      (type) => `
    <button onclick="toggleIncidentType('${type}')" class="incident-type-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${filterState.incidentTypes.includes(type) ? "bg-emerald-500 text-white border-emerald-500" : "bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500"}" data-type="${type}">
      ${type.charAt(0).toUpperCase() + type.slice(1)}
    </button>
  `,
    )
    .join("");
}

window.setTimePeriod = function (period) {
  filterState.timePeriod = period;

  // Clear date range when a preset period is selected
  filterState.fromDate = "";
  filterState.toDate = "";

  // Also clear the DOM inputs
  const fromDate = document.getElementById("fromDate");
  const toDate = document.getElementById("toDate");
  if (fromDate) fromDate.value = "";
  if (toDate) toDate.value = "";

  updateFilterButtons();
};

window.toggleIncidentType = function (type) {
  if (type === "all") {
    filterState.incidentTypes = ["all"];
  } else {
    filterState.incidentTypes = filterState.incidentTypes.filter(
      (t) => t !== "all",
    );
    if (filterState.incidentTypes.includes(type)) {
      filterState.incidentTypes = filterState.incidentTypes.filter(
        (t) => t !== type,
      );
    } else {
      filterState.incidentTypes.push(type);
    }
    if (filterState.incidentTypes.length === 0)
      filterState.incidentTypes = ["all"];
  }
  updateFilterButtons();
};

window.toggleStatus = function (status) {
  if (status === "all") {
    filterState.status = ["all"];
  } else {
    filterState.status = filterState.status.filter((s) => s !== "all");
    if (filterState.status.includes(status)) {
      filterState.status = filterState.status.filter((s) => s !== status);
    } else {
      filterState.status.push(status);
    }
    if (filterState.status.length === 0) filterState.status = ["all"];
  }
  updateFilterButtons();
};

function updateFilterButtons() {
  const fromDate = document.getElementById("fromDate");
  const toDate = document.getElementById("toDate");
  if (fromDate && fromDate.value) filterState.fromDate = fromDate.value;
  if (toDate && toDate.value) filterState.toDate = toDate.value;

  document.querySelectorAll(".time-period-btn").forEach((btn) => {
    const period = btn.getAttribute("data-period");
    btn.className = `time-period-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${period === filterState.timePeriod ? "bg-emerald-500 text-white border-emerald-500" : "bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500"}`;
  });

  document.querySelectorAll(".incident-type-btn").forEach((btn) => {
    const type = btn.getAttribute("data-type");
    btn.className = `incident-type-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${filterState.incidentTypes.includes(type) ? "bg-emerald-500 text-white border-emerald-500" : "bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500"}`;
  });

  document.querySelectorAll(".status-btn").forEach((btn) => {
    const status = btn.getAttribute("data-status");
    btn.className = `status-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${filterState.status.includes(status) ? "bg-emerald-500 text-white border-emerald-500" : "bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500"}`;
  });
}

function applyFilters() {
  // Always grab latest date values before applying
  const fromDate = document.getElementById("fromDate");
  const toDate = document.getElementById("toDate");
  if (fromDate) filterState.fromDate = fromDate.value;
  if (toDate) filterState.toDate = toDate.value;

  // If dates are set, override time period to custom
  if (filterState.fromDate && filterState.toDate) {
    filterState.timePeriod = "custom";
  }

  fetchAnalytics(filterState);
}

function resetFilters() {
  filterState = {
    timePeriod: "last30days",
    fromDate: "",
    toDate: "",
    incidentTypes: ["all"],
    status: ["all"],
  };

  // Clear DOM inputs too
  const fromDate = document.getElementById("fromDate");
  const toDate = document.getElementById("toDate");
  if (fromDate) fromDate.value = "";
  if (toDate) toDate.value = "";

  fetchAnalytics(filterState);
}

// ============================================================
// EXPORT MODAL
// ============================================================

function showExportModal() {
  const modalId = modalManager.create({
    id: "exportModal",
    icon: "uil-download-alt",
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    title: "Export Analytics Report",
    subtitle: "Customize your export by selecting data and timeline",
    body: `
      <div class="space-y-6 max-h-[500px] overflow-y-auto pr-2">
        <!-- TIMELINE -->
        <div>
          <label class="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-3">
            <i class="uil uil-calendar-alt mr-1"></i> Export Timeline
          </label>
          <div class="grid grid-cols-2 gap-2 mb-3">
            ${["last7days", "last30days", "last90days", "custom"]
              .map(
                (t) => `
              <button onclick="setExportTimeline('${t}')" class="export-timeline-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${exportConfig.timeline === t ? "bg-emerald-500 text-white border-emerald-500" : "bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500"}" data-timeline="${t}">
                ${{ last7days: "Last 7 Days", last30days: "Last 30 Days", last90days: "Last 90 Days", custom: "Custom Range" }[t]}
              </button>
            `,
              )
              .join("")}
          </div>
          <div id="customDateRange" class="grid grid-cols-2 gap-3 ${exportConfig.timeline === "custom" ? "" : "hidden"}">
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
             {
               key: "summary",
               label: "Summary Statistics",
               desc: "Total incidents, response times, resolution rates",
               icon: "uil-chart-line",
               checked: true,
               pdfOnly: false,
             },
             {
               key: "incidents",
               label: "Incident Details",
               desc: "Complete incident records with timestamps",
               icon: "uil-file-info-alt",
               checked: true,
               pdfOnly: false,
             },
             {
               key: "charts",
               label: "Chart Data",
               desc: "Trend analysis and distribution data",
               icon: "uil-chart-pie",
               checked: false,
               pdfOnly: false,
             },
             {
               key: "heatmap",
               label: "Heatmap Snapshot",
               desc: "Gulod incident heatmap — fire, crime & flood hotspots",
               icon: "uil-map",
               checked: false,
               pdfOnly: true,
             },
           ]
             .map(
               (item) => `
                <label class="flex items-center p-3 border-2 ${item.pdfOnly ? "border-dashed border-gray-300 dark:border-neutral-500" : "border-gray-200 dark:border-neutral-600"} rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-all">
                  <input type="checkbox" id="export-${item.key}" ${item.checked ? "checked" : ""} onchange="toggleExportData('${item.key}')" class="w-5 h-5 appearance-none border-2 border-gray-300 rounded-md checked:bg-[#01AF78] checked:border-[#01AF78] focus:ring-2 focus:ring-emerald-100 transition-all cursor-pointer bg-[length:10px_10px] bg-center bg-no-repeat checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOSIgdmlld0JveD0iMCAwIDEyIDkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgNEw0LjUgNy41TDExIDEiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')]">
                  <div class="ml-3 flex-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-sm font-semibold text-gray-800 dark:text-white">${item.label}</span>
                      ${item.pdfOnly ? `<span class="text-[10px] font-bold bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 px-2 py-0.5 rounded-full uppercase tracking-wide">PDF only</span>` : ""}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">${item.desc}</div>
                  </div>
                  <i class="uil ${item.icon} text-xl text-gray-400"></i>
                </label>
              `,
             )
             .join("")}
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
    secondaryButton: { text: "Cancel", icon: "uil-times" },
    onSecondary: () => modalManager.close("exportModal"),
  });

  modalManager.show(modalId);
  updateExportSummary();
}

window.setExportTimeline = function (timeline) {
  exportConfig.timeline = timeline;

  const customDateRange = document.getElementById("customDateRange");
  if (customDateRange) {
    customDateRange.classList.toggle("hidden", timeline !== "custom");
  }

  document.querySelectorAll(".export-timeline-btn").forEach((btn) => {
    const t = btn.getAttribute("data-timeline");
    btn.className = `export-timeline-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${t === timeline ? "bg-emerald-500 text-white border-emerald-500" : "bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500"}`;
  });

  updateExportSummary();
};

window.updateExportDateRange = function () {
  const from = document.getElementById("exportFromDate");
  const to = document.getElementById("exportToDate");
  if (from) exportConfig.fromDate = from.value;
  if (to) exportConfig.toDate = to.value;
  updateExportSummary();
};

window.toggleExportData = function (dataType) {
  const checkbox = document.getElementById(`export-${dataType}`);
  if (checkbox) exportConfig.includeData[dataType] = checkbox.checked;
  updateExportSummary();
};

function updateExportSummary() {
  const summaryEl = document.getElementById("exportSummary");
  if (!summaryEl) return;

  const includedCount = Object.values(exportConfig.includeData).filter(
    (v) => v,
  ).length;
  const timelineMap = {
    last7days: "last 7 days",
    last30days: "last 30 days",
    last90days: "last 90 days",
  };
  const timelineText =
    exportConfig.timeline === "custom" &&
    exportConfig.fromDate &&
    exportConfig.toDate
      ? `from ${exportConfig.fromDate} to ${exportConfig.toDate}`
      : timelineMap[exportConfig.timeline] || "selected period";

  const selectedData = Object.keys(exportConfig.includeData)
    .filter((k) => exportConfig.includeData[k])
    .map((k) => k.charAt(0).toUpperCase() + k.slice(1))
    .join(", ");

  summaryEl.innerHTML = `
    <strong>${includedCount} data section${includedCount !== 1 ? "s" : ""}</strong> selected for export<br>
    <span class="text-blue-600 dark:text-blue-400">${selectedData || "None"}</span><br>
    Timeline: <strong>${timelineText}</strong>
  `;
}

let heatmapExportMap = null;

async function captureHeatmapImage() {
  return new Promise(async (resolve) => {
    // ── 1. Fetch heatmap data from the same API ──────────────
    let heatData = { fire: [], crime: [], flood: [] };
    try {
      const params = new URLSearchParams({
        period: exportConfig.timeline,
        from: exportConfig.fromDate,
        to: exportConfig.toDate,
        types: "all",
        status: "all",
      });
      const res = await fetch(`api/analytics/get_analytics.php?${params}`);
      const json = await res.json();

      // get_analytics doesn't return heatmap points — reuse get_incidents
      const incRes = await fetch("api/dashboard/get_incidents.php");
      const incJson = await incRes.json();
      if (incJson.success && incJson.heatmap) {
        heatData = incJson.heatmap;
      }
    } catch (e) {
      console.error("Heatmap data fetch failed:", e);
      resolve(null);
      return;
    }

    // ── 2. Init or reuse the hidden Leaflet map ──────────────
    const container = document.getElementById("heatmapExportContainer");
    const mapEl = document.getElementById("heatmapExportMap");

    container.style.visibility = "hidden";
    container.style.top = "-9999px";

    if (!heatmapExportMap) {
      heatmapExportMap = L.map("heatmapExportMap", {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
      }).setView([14.7158532, 121.0403842], 15);

      L.tileLayer(
        "https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=2bXjFOI9q9BSiHQVwLb7",
        { maxZoom: 21 },
      ).addTo(heatmapExportMap);

      // ── Gulod boundary ───────────────────────────────────
      const gulodBoundary = {
        type: "Feature",
        properties: { name: "Gulod" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [121.0334848, 14.711682],
              [121.0334957, 14.7115454],
              [121.0335308, 14.7114846],
              [121.0335862, 14.7114333],
              [121.0337882, 14.7112641],
              [121.0339523, 14.7111092],
              [121.0340751, 14.7109148],
              [121.0341028, 14.7108099],
              [121.0340604, 14.7106753],
              [121.0339774, 14.7105621],
              [121.0338543, 14.7105114],
              [121.0336751, 14.7104859],
              [121.0335323, 14.710492],
              [121.033562, 14.7101886],
              [121.0338342, 14.709774],
              [121.0339713, 14.7095436],
              [121.0345597, 14.7094757],
              [121.0350814, 14.7094277],
              [121.0362553, 14.7093446],
              [121.0363582, 14.7092669],
              [121.0364442, 14.709162],
              [121.0366244, 14.7089794],
              [121.036688, 14.7089056],
              [121.03699, 14.7091458],
              [121.0372903, 14.7091637],
              [121.0375888, 14.709336],
              [121.0382147, 14.7094565],
              [121.0384845, 14.709263],
              [121.03848, 14.7091378],
              [121.0384375, 14.7090308],
              [121.0387608, 14.708583],
              [121.0387662, 14.7084187],
              [121.0389081, 14.7083563],
              [121.0396347, 14.7080226],
              [121.0400809, 14.7080861],
              [121.0401844, 14.7080705],
              [121.0415248, 14.7075016],
              [121.0415217, 14.7066561],
              [121.0418078, 14.7058151],
              [121.0419812, 14.7052453],
              [121.0440479, 14.7052824],
              [121.0454888, 14.7052707],
              [121.0455003, 14.704594],
              [121.0468975, 14.7050443],
              [121.0474573, 14.7053168],
              [121.0472436, 14.7061441],
              [121.0472437, 14.7061633],
              [121.0471759, 14.7063696],
              [121.047172, 14.7070541],
              [121.0468812, 14.7074933],
              [121.0468267, 14.7079836],
              [121.0467387, 14.7084147],
              [121.0466027, 14.7087975],
              [121.0465728, 14.7088616],
              [121.0465237, 14.708988],
              [121.0465472, 14.7090729],
              [121.0466418, 14.7091216],
              [121.0467319, 14.7091885],
              [121.0467944, 14.7093433],
              [121.0467645, 14.709431],
              [121.0466762, 14.7095276],
              [121.0464922, 14.709637],
              [121.0459681, 14.7097706],
              [121.0459465, 14.7098262],
              [121.0459745, 14.7099749],
              [121.0459659, 14.7100253],
              [121.0460252, 14.7100798],
              [121.045984, 14.7102054],
              [121.0460574, 14.7104115],
              [121.046219, 14.7105981],
              [121.046361, 14.7107014],
              [121.0467486, 14.7109051],
              [121.0469001, 14.7110597],
              [121.0470558, 14.7112651],
              [121.0470603, 14.7113701],
              [121.0468657, 14.7118121],
              [121.04668, 14.7120473],
              [121.0463628, 14.7122458],
              [121.0461321, 14.7125295],
              [121.0459071, 14.712751],
              [121.04565, 14.7128774],
              [121.0452638, 14.7129189],
              [121.0449875, 14.7128681],
              [121.0446371, 14.7126643],
              [121.0444294, 14.7125356],
              [121.0441094, 14.7122657],
              [121.0436705, 14.7119655],
              [121.0434184, 14.7119718],
              [121.0432508, 14.7120946],
              [121.0431034, 14.7122324],
              [121.0429966, 14.7123962],
              [121.0429383, 14.7125755],
              [121.0429079, 14.7127791],
              [121.0429966, 14.7130402],
              [121.0431543, 14.7133731],
              [121.0432095, 14.7135],
              [121.0432103, 14.7136163],
              [121.0430658, 14.7139198],
              [121.0428879, 14.7146356],
              [121.0428612, 14.7148887],
              [121.0429258, 14.7150544],
              [121.0430697, 14.7151967],
              [121.0434241, 14.7154815],
              [121.0438905, 14.7157166],
              [121.0442338, 14.7158245],
              [121.0443492, 14.7159932],
              [121.0443099, 14.7161024],
              [121.0441341, 14.7162898],
              [121.0440041, 14.7165224],
              [121.0438154, 14.7173538],
              [121.0437188, 14.717601],
              [121.0436498, 14.7178396],
              [121.0434931, 14.7184845],
              [121.0434293, 14.7185908],
              [121.0433855, 14.7186606],
              [121.0433491, 14.718696],
              [121.0432445, 14.7187068],
              [121.0430669, 14.7186606],
              [121.0427013, 14.7184907],
              [121.042527, 14.7184298],
              [121.0421883, 14.7183594],
              [121.0420877, 14.7183753],
              [121.0418588, 14.7185368],
              [121.0416664, 14.7186873],
              [121.0414534, 14.7188422],
              [121.0411207, 14.7190733],
              [121.0409713, 14.7190759],
              [121.0404672, 14.7188598],
              [121.0401682, 14.7187086],
              [121.039773, 14.7184233],
              [121.0391703, 14.7176617],
              [121.0390905, 14.7175646],
              [121.0389286, 14.7174147],
              [121.0388499, 14.7173238],
              [121.0387788, 14.7172294],
              [121.0387494, 14.7171469],
              [121.0387334, 14.7170159],
              [121.0387279, 14.7168797],
              [121.0387239, 14.7167954],
              [121.0386924, 14.7167398],
              [121.0386199, 14.7166645],
              [121.0383958, 14.7164802],
              [121.0374912, 14.7159739],
              [121.0374116, 14.7159302],
              [121.0373821, 14.7159069],
              [121.0373667, 14.7158693],
              [121.0373533, 14.7158368],
              [121.0373462, 14.7157973],
              [121.0373377, 14.7157255],
              [121.0373544, 14.715513],
              [121.0373727, 14.7153563],
              [121.0373694, 14.7152856],
              [121.0373586, 14.7152214],
              [121.0373378, 14.7151652],
              [121.0372433, 14.71503],
              [121.0370918, 14.7148582],
              [121.0369087, 14.7146629],
              [121.0368524, 14.7146156],
              [121.0368115, 14.7145884],
              [121.0367752, 14.7145735],
              [121.0367116, 14.7145637],
              [121.0366505, 14.7145624],
              [121.0365533, 14.7145683],
              [121.0361651, 14.714615],
              [121.0357641, 14.7146798],
              [121.0351744, 14.7147687],
              [121.0351244, 14.7147602],
              [121.0350697, 14.7147391],
              [121.035004, 14.7146952],
              [121.0348887, 14.7145509],
              [121.0344099, 14.7140667],
              [121.0342536, 14.7138862],
              [121.0341839, 14.7136913],
              [121.0341969, 14.7135132],
              [121.0342312, 14.7133827],
              [121.0342965, 14.7132461],
              [121.0344816, 14.7130565],
              [121.0345607, 14.7129008],
              [121.0345812, 14.7127621],
              [121.0345279, 14.712633],
              [121.0341479, 14.7122626],
              [121.0339345, 14.712102],
              [121.0335527, 14.7118143],
              [121.0334848, 14.711682],
            ],
          ],
        },
      };

      L.geoJSON(gulodBoundary, {
        style: {
          color: "#1c7b5d",
          weight: 2,
          opacity: 0.8,
          fillColor: "#27C291",
          fillOpacity: 0.05,
          dashArray: "6 4",
        },
        interactive: false,
      }).addTo(heatmapExportMap);
    }

    // ── 3. Clear old heatmap layers then re-add fresh ones ───
    heatmapExportMap.eachLayer((layer) => {
      if (layer._heat) heatmapExportMap.removeLayer(layer);
    });

    const heatmapConfigs = {
      fire: {
        radius: 28,
        blur: 20,
        maxZoom: 15,
        max: 2.0,
        minOpacity: 0.3,
        gradient: {
          0.2: "rgba(255, 255, 0, 0.4)",
          0.5: "rgba(255, 128, 0, 0.7)",
          0.8: "rgba(220, 38, 38, 0.9)",
          1.0: "rgba(100, 0, 0, 1.0)",
        },
      },
      crime: {
        radius: 28,
        blur: 20,
        maxZoom: 15,
        max: 2.0,
        minOpacity: 0.3,
        gradient: {
          0.2: "rgba(255, 240, 120, 0.4)",
          0.5: "rgba(251, 191, 36, 0.7)",
          0.8: "rgba(217, 119, 6, 0.9)",
          1.0: "rgba(100, 40, 0, 1.0)",
        },
      },
      flood: {
        radius: 35,
        blur: 25,
        maxZoom: 15,
        max: 2.0,
        minOpacity: 0.3,
        gradient: {
          0.2: "rgba(150, 200, 255, 0.4)",
          0.5: "rgba(59, 130, 246, 0.7)",
          0.8: "rgba(29, 78, 216, 0.9)",
          1.0: "rgba(8, 15, 60, 1.0)",
        },
      },
    };

    ["fire", "crime", "flood"].forEach((type) => {
      const points = (heatData[type] || []).map((p) => [
        p.lat,
        p.lng,
        p.intensity,
      ]);
      if (points.length > 0) {
        L.heatLayer(points, heatmapConfigs[type]).addTo(heatmapExportMap);
      }
    });

    // ── 4. Invalidate size so Leaflet renders correctly ──────
    heatmapExportMap.invalidateSize();

    // ── 5. Wait for tiles + heatmap to render, then composite ─
    setTimeout(() => {
      try {
        // Create output canvas at map size
        const W = mapEl.offsetWidth || 900;
        const H = mapEl.offsetHeight || 600;
        const output = document.createElement("canvas");
        output.width = W;
        output.height = H;
        const ctx = output.getContext("2d");

        // White background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, W, H);

        // ── Draw all tile <img> elements ─────────────────────
        // Leaflet renders tiles as <img> inside .leaflet-tile-pane
        const tilePanes = mapEl.querySelectorAll(
          ".leaflet-tile-pane img.leaflet-tile",
        );
        tilePanes.forEach((img) => {
          if (!img.complete || img.naturalWidth === 0) return;
          // Get tile's position relative to the map container
          const tileContainer = img.closest(".leaflet-tile-container");
          const pane = img.closest(".leaflet-pane");

          // Parse transform from tile container and pane to get absolute position
          function getTranslate(el) {
            if (!el) return { x: 0, y: 0 };
            const t = el.style.transform || "";
            const m = t.match(/translate3d\(([^,]+)px,\s*([^,]+)px/);
            if (m) return { x: parseFloat(m[1]), y: parseFloat(m[2]) };
            const m2 = t.match(/translate\(([^,]+)px,\s*([^,]+)px/);
            if (m2) return { x: parseFloat(m2[1]), y: parseFloat(m2[2]) };
            return { x: 0, y: 0 };
          }

          const panePos = getTranslate(pane);
          const containerPos = getTranslate(tileContainer);
          const imgLeft = parseFloat(img.style.left) || 0;
          const imgTop = parseFloat(img.style.top) || 0;

          const x = panePos.x + containerPos.x + imgLeft;
          const y = panePos.y + containerPos.y + imgTop;

          try {
            ctx.drawImage(img, x, y, img.width, img.height);
          } catch (e) {
            // Tainted — skip this tile
          }
        });

        // ── Draw heatmap canvas layers ────────────────────────
        // Leaflet.heat renders onto <canvas> inside .leaflet-heatmap-layer
        // or directly inside .leaflet-overlay-pane
        const heatCanvases = mapEl.querySelectorAll("canvas");
        heatCanvases.forEach((c) => {
          if (c.width === 0 || c.height === 0) return;
          const pane = c.closest(".leaflet-pane");
          const pos = getTranslate(pane); // reuse helper above

          // Also check for canvas own transform
          function getTranslate(el) {
            if (!el) return { x: 0, y: 0 };
            const t = el.style.transform || "";
            const m = t.match(/translate3d\(([^,]+)px,\s*([^,]+)px/);
            if (m) return { x: parseFloat(m[1]), y: parseFloat(m[2]) };
            const m2 = t.match(/translate\(([^,]+)px,\s*([^,]+)px/);
            if (m2) return { x: parseFloat(m2[1]), y: parseFloat(m2[2]) };
            return { x: 0, y: 0 };
          }

          const panePos = getTranslate(c.closest(".leaflet-pane"));
          ctx.drawImage(c, panePos.x, panePos.y);
        });

        // ── Draw SVG boundary (GeoJSON) ───────────────────────
        const svgEl = mapEl.querySelector(".leaflet-overlay-pane svg");
        if (svgEl) {
          const svgData = new XMLSerializer().serializeToString(svgEl);
          const svgBlob = new Blob([svgData], {
            type: "image/svg+xml;charset=utf-8",
          });
          const svgUrl = URL.createObjectURL(svgBlob);
          const svgImg = new Image();
          svgImg.onload = () => {
            const pane = svgEl.closest(".leaflet-pane");
            const panePos = getTranslate(pane);
            ctx.drawImage(svgImg, panePos.x, panePos.y);
            URL.revokeObjectURL(svgUrl);
            resolve(output.toDataURL("image/jpeg", 0.92));
          };
          svgImg.onerror = () => {
            URL.revokeObjectURL(svgUrl);
            resolve(output.toDataURL("image/jpeg", 0.92));
          };
          svgImg.src = svgUrl;
        } else {
          resolve(output.toDataURL("image/jpeg", 0.92));
        }
      } catch (e) {
        console.error("Canvas composite failed:", e);
        resolve(null);
      }
    }, 3500); // wait for tiles + heatmap to render
  });
}

// ============================================================
// EXPORT EXECUTION
// ============================================================

window.executeExport = async function (format) {
  const hasData = Object.values(exportConfig.includeData).some((v) => v);
  if (!hasData) {
    showToast("warning", "Please select at least one data section to export");
    return;
  }

  if (
    exportConfig.timeline === "custom" &&
    (!exportConfig.fromDate || !exportConfig.toDate)
  ) {
    showToast(
      "warning",
      "Please select both from and to dates for custom range",
    );
    return;
  }

  modalManager.close("exportModal");
  showToast("info", `Preparing ${format.toUpperCase()} export...`);

  try {
    // Fetch real data for export
    const params = new URLSearchParams({
      period: exportConfig.timeline,
      from: exportConfig.fromDate,
      to: exportConfig.toDate,
      types: "all",
      status: "all",
    });

    const response = await fetch(`api/analytics/get_analytics.php?${params}`);
    const result = await response.json();

    if (!result.success) {
      showToast("error", "Failed to fetch export data");
      return;
    }

    const exportData = {
      metadata: {
        exportDateFormatted: new Date().toLocaleDateString(),
        timeline: exportConfig.timeline,
        fromDate: exportConfig.fromDate,
        toDate: exportConfig.toDate,
        recordCount: result.summary.total,
      },
    };

    if (exportConfig.includeData.summary) exportData.summary = result.summary;
    if (exportConfig.includeData.incidents)
      exportData.incidents = result.tableData;
    if (exportConfig.includeData.charts)
      exportData.charts = {
        typeDistribution: result.typeDistribution,
        responseDistribution: result.responseDistribution,
      };

    if (format === "csv") {
      downloadCSV(exportData);
    } else if (format === "pdf") {
      if (exportConfig.includeData.heatmap) {
        showToast("info", "Generating heatmap, please wait...");
        exportData.heatmapImage = await captureHeatmapImage();
        if (!exportData.heatmapImage) {
          showToast(
            "warning",
            "Heatmap capture failed — exporting without it.",
          );
        } else {
          showToast("success", "Heatmap captured!");
        }
      }
      downloadPDF(exportData);
    }

    showToast(
      "success",
      `Report exported as ${format.toUpperCase()} successfully!`,
    );
  } catch (err) {
    console.error("Export error:", err);
    showToast("error", "Export failed. Please try again.");
  }
};

// ============================================================
// DOWNLOAD FUNCTIONS
// ============================================================

function downloadCSV(data) {
  let csv = "SafeChain Analytics Report\n";
  csv += `Generated: ${data.metadata.exportDateFormatted}\n`;
  csv += `Timeline: ${data.metadata.timeline}\n`;
  csv += `Records: ${data.metadata.recordCount}\n\n`;

  if (data.summary) {
    csv += "=== SUMMARY STATISTICS ===\n";
    csv += "Metric,Value\n";
    csv += `Total Incidents,${data.summary.total}\n`;
    csv += `Average Response Time,${data.summary.avgResponseTime}\n`;
    csv += `Resolution Rate,${data.summary.resolutionRate}\n`;
    csv += `Resolved,${data.summary.resolved}\n`;
    csv += `Responding,${data.summary.responding}\n`;
    csv += `Pending,${data.summary.pending}\n\n`;
  }

  if (data.incidents) {
    csv += "=== INCIDENT DETAILS ===\n";
    csv += "ID,Type,Resident,Location,Time Reported,Response Time,Status\n";
    data.incidents.forEach((inc) => {
      csv += `${inc.id},${inc.type},"${inc.resident}","${inc.location}",${inc.timeReported},${inc.responseTime},${inc.status}\n`;
    });
    csv += "\n";
  }

  if (data.charts) {
    csv += "=== INCIDENT TYPE DISTRIBUTION ===\n";
    csv += "Type,Count\n";
    Object.entries(data.charts.typeDistribution).forEach(([type, count]) => {
      csv += `${type},${count}\n`;
    });
    csv += "\n";

    csv += "=== RESPONSE TIME DISTRIBUTION ===\n";
    csv += "Range,Count\n";
    Object.entries(data.charts.responseDistribution).forEach(
      ([range, count]) => {
        csv += `${range},${count}\n`;
      },
    );
    csv += "\n";
  }

  downloadFile(csv, "text/csv", "csv");
}

async function downloadPDF(data) {
  const meta = data.metadata || {};
  const summary = data.summary || {};
  const incidents = data.incidents || [];
  const charts = data.charts || {};

  const timelineLabel =
    {
      last7days: "Last 7 Days",
      last30days: "Last 30 Days",
      last90days: "Last 90 Days",
      custom: `${meta.fromDate || ""} to ${meta.toDate || ""}`,
    }[meta.timeline] ||
    meta.timeline ||
    "Selected Period";

  let sectionNum = 1;
  const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
  const sec = (title) =>
    `<div class="section-title">${roman[sectionNum++ - 1]}. ${title}</div>`;
  const resolvedIncidents = incidents.filter(
    (inc) => inc.status === "Resolved",
  );

  let contentHTML = `
    <div class="report-title">
      <span>ANALYTICS REPORT AND SUMMARY</span>
      <span>BARANGAY DISASTER RISK REDUCTION AND MANAGEMENT</span>
      <span>COUNCIL (BDRRMC)</span>
    </div>
    <div class="report-subtitle">PREPARED BY: SafeChain Analytics System</div>
    <div class="report-subtitle">REPORT DATE: ${meta.exportDateFormatted || new Date().toLocaleDateString()}</div>
    <div class="report-subtitle">PERIOD: ${timelineLabel} &nbsp;|&nbsp; Total Records: ${meta.recordCount ?? "N/A"}</div>

    ${sec("EXECUTIVE SUMMARY")}
    <div class="section-content indent">
      <div class="list-item">Total Incidents: <strong>${summary.total ?? "N/A"}</strong></div>
      <div class="list-item">Average Response Time: <strong>${summary.avgResponseTime ?? "N/A"}</strong></div>
      <div class="list-item">Resolution Rate: <strong>${summary.resolutionRate ?? "N/A"}</strong></div>
      <div class="list-item">Resolved: ${summary.resolved ?? 0}</div>
      <div class="list-item">Responding: ${summary.responding ?? 0}</div>
      <div class="list-item">Pending: ${summary.pending ?? 0}</div>
    </div>
  `;

  if (charts.typeDistribution && Object.keys(charts.typeDistribution).length) {
    contentHTML += `
      ${sec("INCIDENT TYPE DISTRIBUTION")}
      <div class="section-content indent">
        ${Object.entries(charts.typeDistribution)
          .map(
            ([type, count]) =>
              `<div class="list-item">${capitalize(type)}: <strong>${count} incident(s)</strong></div>`,
          )
          .join("")}
      </div>
    `;
  }

  if (
    charts.responseDistribution &&
    Object.keys(charts.responseDistribution).length
  ) {
    contentHTML += `
      ${sec("RESPONSE TIME DISTRIBUTION")}
      <div class="section-content indent">
        ${Object.entries(charts.responseDistribution)
          .map(
            ([range, count]) =>
              `<div class="list-item">${range}: <strong>${count} incident(s)</strong></div>`,
          )
          .join("")}
      </div>
    `;
  }

  if (resolvedIncidents.length) {
    contentHTML += sec("INCIDENT DETAILS");

    // Each incident is its own independent div — NOT nested inside a parent wrapper
    incidents.forEach((inc, i) => {
      contentHTML += `
      <div class="list-item">
        <strong>${i + 1}. ${esc(inc.id)}</strong> — ${esc(inc.type)}<br>
        &nbsp;&nbsp;&nbsp;Resident: ${esc(inc.resident)}<br>
        &nbsp;&nbsp;&nbsp;Location: ${esc(inc.location)}<br>
        &nbsp;&nbsp;&nbsp;Time Reported: ${esc(inc.timeReported)} &nbsp;|&nbsp; Response Time: ${esc(inc.responseTime)}<br>
      </div>
    `;
    });
  }

  if (data.heatmapImage) {
    contentHTML += `
    ${sec("INCIDENT HEATMAP — BARANGAY GULOD")}
    <div class="section-content indent">
      <div class="list-item" style="font-size:10px;color:#6b7280;margin-bottom:6px;">
        Heatmap generated at time of export. Shows fire, crime, and flood incident density within Barangay Gulod boundaries.
      </div>
      <img src="${data.heatmapImage}"
           style="width:100%;border-radius:8px;border:1px solid #e5e7eb;display:block;"
           alt="Barangay Gulod Incident Heatmap" />
    </div>
  `;
  }

  contentHTML += `
  <div class="section-title" style="margin-top:20px;text-align:center;">
    REPORT CLOSED — ${meta.exportDateFormatted || new Date().toLocaleDateString()}
  </div>
`;

  sessionStorage.setItem("analyticsReportContent", contentHTML);
  sessionStorage.setItem(
    "analyticsReportFilename",
    `SafeChain_Analytics_${new Date().toISOString().split("T")[0]}`,
  );

  const win = window.open(
    "templates/analytics-report-template.php?autodownload=1",
    "_blank",
  );

  if (!win) {
    showToast(
      "warning",
      "Popup was blocked — please allow popups and try again.",
    );
  }
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}

function esc(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function downloadFile(content, mimeType, extension) {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `SafeChain_Analytics_${new Date().toISOString().split("T")[0]}.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// ============================================================
// INIT
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  initializeCharts();
  fetchAnalytics(); // Load real data immediately

  const exportBtn = document.querySelector(".header-actions button:last-child");
  const filterBtn = document.querySelector(
    ".header-actions button:first-child",
  );
  if (exportBtn) exportBtn.addEventListener("click", showExportModal);
  if (filterBtn) filterBtn.addEventListener("click", showFilterModal);
});

// Fallback toast if not defined globally
if (typeof showToast === "undefined") {
  window.showToast = function (type, message) {
    console.log(`[${type.toUpperCase()}] ${message}`);
  };
}
