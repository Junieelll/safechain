// ============================================================================
// DUMMY DATA GENERATION
// ============================================================================

// Generate realistic incident data
const INCIDENT_TYPES = ['Fire', 'Flood', 'Crime'];
const STATUSES = ['Resolved'];
const LOCATIONS = [
  'Block A, Unit 101', 'Block B, Unit 205', 'Block C, Unit 312', 
  'Block D, Unit 410', 'Block E, Unit 508', 'Main Gate Area',
  'Parking Lot B', 'Community Center', 'Swimming Pool Area',
  'Block F, Unit 615', 'Block G, Unit 720', 'Playground Zone'
];
const RESIDENTS = [
  'John Smith', 'Maria Garcia', 'Wei Chen', 'Sarah Johnson',
  'Ahmed Hassan', 'Emily Brown', 'Carlos Rodriguez', 'Lisa Anderson',
  'Michael Chang', 'Jennifer Lee', 'David Kim', 'Patricia Wilson'
];

// Generate incidents for the past 90 days
function generateIncidentData(days = 90) {
  const incidents = [];
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  let idCounter = 1000;
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    // Random number of incidents per day (0-5)
    const incidentsPerDay = Math.floor(Math.random() * 6);
    
    for (let i = 0; i < incidentsPerDay; i++) {
      const hour = Math.floor(Math.random() * 24);
      const minute = Math.floor(Math.random() * 60);
      const reportTime = new Date(d);
      reportTime.setHours(hour, minute, 0, 0);
      
      const responseMinutes = Math.floor(Math.random() * 15) + 1; // 1-15 minutes
      const responseTime = new Date(reportTime);
      responseTime.setMinutes(responseTime.getMinutes() + responseMinutes);
      
      const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
      const resolvedTime = status === 'Resolved' 
        ? new Date(responseTime.getTime() + (Math.random() * 3600000)) // +1 hour max
        : null;
      
      incidents.push({
        id: `INC-${idCounter++}`,
        type: INCIDENT_TYPES[Math.floor(Math.random() * INCIDENT_TYPES.length)],
        resident: RESIDENTS[Math.floor(Math.random() * RESIDENTS.length)],
        location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
        timeReported: reportTime,
        timeResponded: responseTime,
        timeResolved: resolvedTime,
        responseTime: `${responseMinutes}m`,
        status: status,
        description: generateDescription(),
        priority: Math.random() > 0.7 ? 'High' : Math.random() > 0.4 ? 'Medium' : 'Low',
        assignedTo: `Responder ${Math.floor(Math.random() * 10) + 1}`,
        deviceId: `DEV-${Math.floor(Math.random() * 50) + 1}`
      });
    }
  }
  
  return incidents.sort((a, b) => b.timeReported - a.timeReported);
}

function generateDescription() {
  const descriptions = [
    'Emergency situation requiring immediate attention',
    'Routine incident handled according to protocol',
    'False alarm, situation resolved quickly',
    'Multiple units dispatched to location',
    'Resident requested emergency assistance',
    'Automated alert triggered from device',
    'Community safety incident reported',
    'Environmental hazard detected and addressed'
  ];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

// Global incident database
const INCIDENT_DATABASE = generateIncidentData(90);

// ============================================================================
// DATA ANALYTICS & CALCULATIONS
// ============================================================================

class AnalyticsEngine {
  constructor(incidents) {
    this.allIncidents = incidents;
    this.filteredIncidents = incidents;
  }
  
  applyFilters(filters) {
    this.filteredIncidents = this.allIncidents.filter(incident => {
      // Time period filter
      const incidentDate = incident.timeReported;
      const now = new Date();
      let timeMatch = true;
      
      if (filters.timePeriod !== 'custom') {
        const daysAgo = {
          'last7days': 7,
          'last30days': 30,
          'last90days': 90,
          'lastyear': 365
        }[filters.timePeriod];
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
        timeMatch = incidentDate >= cutoffDate;
      } else if (filters.fromDate && filters.toDate) {
        const fromDate = new Date(filters.fromDate);
        const toDate = new Date(filters.toDate);
        toDate.setHours(23, 59, 59, 999);
        timeMatch = incidentDate >= fromDate && incidentDate <= toDate;
      }
      
      // Incident type filter
      const typeMatch = filters.incidentTypes.includes('all') || 
                       filters.incidentTypes.includes(incident.type.toLowerCase());
      
      // Status filter
      const statusMatch = filters.status.includes('all') || 
                         filters.status.includes(incident.status.toLowerCase());
      
      return timeMatch && typeMatch && statusMatch;
    });
    
    return this.filteredIncidents;
  }
  
  getStatistics() {
    const incidents = this.filteredIncidents;
    
    // Calculate response times in minutes
    const responseTimes = incidents
      .filter(i => i.timeResponded)
      .map(i => (i.timeResponded - i.timeReported) / 60000); // Convert to minutes
    
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;
    
    const resolvedCount = incidents.filter(i => i.status === 'Resolved').length;
    const resolutionRate = incidents.length > 0
      ? (resolvedCount / incidents.length) * 100
      : 0;
    
    return {
      totalIncidents: incidents.length,
      avgResponseTime: `${avgResponseTime.toFixed(1)}m`,
      avgResponseTimeMinutes: avgResponseTime,
      resolutionRate: `${resolutionRate.toFixed(1)}%`,
      resolutionRatePercent: resolutionRate,
      resolvedIncidents: resolvedCount,
      respondingIncidents: incidents.filter(i => i.status === 'Responding').length,
      pendingIncidents: incidents.filter(i => i.status === 'Pending').length
    };
  }
  
  getTrendData() {
    const incidents = this.filteredIncidents;
    const weeks = {};
    
    incidents.forEach(incident => {
      const weekKey = this.getWeekKey(incident.timeReported);
      weeks[weekKey] = (weeks[weekKey] || 0) + 1;
    });
    
    return weeks;
  }
  
  getIncidentTypeDistribution() {
    const distribution = {};
    this.filteredIncidents.forEach(incident => {
      distribution[incident.type] = (distribution[incident.type] || 0) + 1;
    });
    return distribution;
  }
  
  getResponseTimeDistribution() {
    const distribution = {
      '0-2 mins': 0,
      '2-4 mins': 0,
      '4-6 mins': 0,
      '6+ mins': 0
    };
    
    this.filteredIncidents.forEach(incident => {
      const responseMinutes = parseInt(incident.responseTime);
      if (responseMinutes <= 2) distribution['0-2 mins']++;
      else if (responseMinutes <= 4) distribution['2-4 mins']++;
      else if (responseMinutes <= 6) distribution['4-6 mins']++;
      else distribution['6+ mins']++;
    });
    
    return distribution;
  }
  
  getPeakHoursData() {
    const hours = Array(24).fill(0);
    
    this.filteredIncidents.forEach(incident => {
      const hour = incident.timeReported.getHours();
      hours[hour]++;
    });
    
    return hours;
  }
  
  getWeekKey(date) {
    const start = new Date(date.getFullYear(), 0, 1);
    const diff = date - start;
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const weekNumber = Math.floor(diff / oneWeek);
    return `Week ${weekNumber}`;
  }
}

// Initialize analytics engine
const analyticsEngine = new AnalyticsEngine(INCIDENT_DATABASE);

// ============================================================================
// CHART MANAGEMENT
// ============================================================================

let chartInstances = {
  incidentTrends: null,
  incidentTypes: null,
  responseTime: null,
  peakHours: null
};

function initializeCharts() {
  // Incident Trends Chart
  const ctx1 = document.getElementById("incidentTrendsChart").getContext("2d");
  chartInstances.incidentTrends = new Chart(ctx1, {
    type: "line",
    data: {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
      datasets: [{
        label: "Incidents",
        data: [52, 75, 93, 85],
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
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: { color: "#6b7280", usePointStyle: true, padding: 5 }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { color: "#9ca3af", stepSize: 20 },
          grid: { color: "#e5e7eb", borderDash: [5, 5] }
        },
        x: {
          ticks: { color: "#9ca3af" },
          offset: true,
          grid: { display: true }
        }
      }
    }
  });

  // Incident Types Chart
  const ctx2 = document.getElementById("incidentTypesChart").getContext("2d");
  chartInstances.incidentTypes = new Chart(ctx2, {
    type: "doughnut",
    data: {
      labels: ["Fire", "Flood", "Crime"],
      datasets: [{
        data: [40, 35, 25],
        backgroundColor: ["#8b5cf6", "#22d3ee", "#fb7185"],
        borderWidth: 0,
        hoverOffset: 10,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: "60%",
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: { color: "#6b7280", usePointStyle: true, padding: 15 }
        }
      }
    }
  });

  // Response Time Chart
  const ctx3 = document.getElementById("responseTimeChart").getContext("2d");
  chartInstances.responseTime = new Chart(ctx3, {
    type: "bar",
    data: {
      labels: ["0-2 mins", "2-4 mins", "4-6 mins", "6+ mins"],
      datasets: [{
        label: "Incident",
        data: [45, 15, 55, 30],
        backgroundColor: "rgba(139, 92, 246, 1)",
        borderRadius: { topLeft: 50, topRight: 50, bottomLeft: 0, bottomRight: 0 },
        borderSkipped: "bottom",
        barThickness: 60,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: { color: "#6b7280", usePointStyle: true, padding: 15 }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { color: "#9ca3af", stepSize: 50 },
          grid: { color: "#e5e7eb", borderDash: [5, 5] }
        },
        x: {
          ticks: { color: "#9ca3af" },
          grid: { color: "#e5e7eb", borderDash: [5, 5] }
        }
      }
    }
  });

  // Peak Hours Chart
  const ctx4 = document.getElementById("peakHoursChart").getContext("2d");
  chartInstances.peakHours = new Chart(ctx4, {
    type: "bar",
    data: {
      labels: ["6AM", "9AM", "12PM", "3PM", "6PM", "9PM", "12AM"],
      datasets: [{
        label: "Incidents",
        data: [40, 28, 45, 48, 50, 32, 38],
        backgroundColor: "rgba(139, 92, 246, 1)",
        borderRadius: Number.MAX_VALUE,
        borderSkipped: false,
        barThickness: 50,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: { color: "#6b7280", usePointStyle: true, padding: 15 }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 50,
          ticks: { color: "#9ca3af", stepSize: 25 },
          grid: { color: "#e5e7eb", borderDash: [5, 5] }
        },
        x: {
          ticks: { color: "#9ca3af" },
          grid: { color: "#e5e7eb", borderDash: [5, 5] }
        }
      }
    }
  });
}

function updateCharts() {
  const stats = analyticsEngine.getStatistics();
  const typeDistribution = analyticsEngine.getIncidentTypeDistribution();
  const responseDistribution = analyticsEngine.getResponseTimeDistribution();
  const peakHours = analyticsEngine.getPeakHoursData();
  
  // Update statistics cards
  updateStatisticsCards(stats);
  
  // Update Incident Types Chart
  if (chartInstances.incidentTypes) {
    const types = Object.keys(typeDistribution);
    const values = Object.values(typeDistribution);
    chartInstances.incidentTypes.data.labels = types;
    chartInstances.incidentTypes.data.datasets[0].data = values;
    chartInstances.incidentTypes.update();
  }
  
  // Update Response Time Chart
  if (chartInstances.responseTime) {
    chartInstances.responseTime.data.datasets[0].data = Object.values(responseDistribution);
    chartInstances.responseTime.update();
  }
  
  // Update Peak Hours Chart
  if (chartInstances.peakHours) {
    const selectedHours = [6, 9, 12, 15, 18, 21, 0];
    const hourData = selectedHours.map(h => peakHours[h]);
    chartInstances.peakHours.data.datasets[0].data = hourData;
    chartInstances.peakHours.update();
  }
}

function updateStatisticsCards(stats) {
  // Update the stats in the UI
  const totalElement = document.querySelector('[data-stat="total"]');
  const responseElement = document.querySelector('[data-stat="response"]');
  const resolutionElement = document.querySelector('[data-stat="resolution"]');
  
  if (totalElement) totalElement.textContent = stats.totalIncidents;
  if (responseElement) responseElement.textContent = stats.avgResponseTime;
  if (resolutionElement) resolutionElement.textContent = stats.resolutionRate;
}

// ============================================================================
// FILTER STATE MANAGEMENT
// ============================================================================

let filterState = {
  timePeriod: 'last30days',
  fromDate: '',
  toDate: '',
  incidentTypes: ['all'],
  status: ['all']
};

// ============================================================================
// EXPORT CONFIGURATION
// ============================================================================

let exportConfig = {
  timeline: 'last30days',
  fromDate: '',
  toDate: '',
  includeData: {
    summary: true,
    incidents: true,
    charts: false,
    deviceLogs: false,
    residents: false
  }
};

// ============================================================================
// MODAL & UI MANAGEMENT
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
  // Initialize charts
  initializeCharts();
  
  const exportBtn = document.querySelector('.header-actions button:last-child');
  const filterBtn = document.querySelector('.header-actions button:first-child');
  
  if (exportBtn) {
    exportBtn.addEventListener('click', showExportModal);
  }
  
  if (filterBtn) {
    filterBtn.addEventListener('click', showFilterModal);
  }
});

// ============================================================================
// EXPORT MODAL - NEW IMPROVED VERSION
// ============================================================================

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
        <!-- TIMELINE SELECTION -->
        <div>
          <label class="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-3">
            <i class="uil uil-calendar-alt mr-1"></i> Export Timeline
          </label>
          <div class="grid grid-cols-2 gap-2 mb-3">
            <button onclick="setExportTimeline('last7days')" class="export-timeline-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${exportConfig.timeline === 'last7days' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500'}" data-timeline="last7days">
              Last 7 Days
            </button>
            <button onclick="setExportTimeline('last30days')" class="export-timeline-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${exportConfig.timeline === 'last30days' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500'}" data-timeline="last30days">
              Last 30 Days
            </button>
            <button onclick="setExportTimeline('last90days')" class="export-timeline-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${exportConfig.timeline === 'last90days' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500'}" data-timeline="last90days">
              Last 90 Days
            </button>
            <button onclick="setExportTimeline('custom')" class="export-timeline-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${exportConfig.timeline === 'custom' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500'}" data-timeline="custom">
              Custom Range
            </button>
          </div>
          
          <!-- CUSTOM DATE RANGE -->
          <div id="customDateRange" class="grid grid-cols-2 gap-3 ${exportConfig.timeline === 'custom' ? '' : 'hidden'}">
            <div>
              <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">From Date</label>
              <input type="date" id="exportFromDate" value="${exportConfig.fromDate}" class="w-full px-3 py-2 text-sm border-2 border-gray-300 dark:border-neutral-600 rounded-lg bg-gray-50 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" onchange="updateExportDateRange()">
            </div>
            <div>
              <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">To Date</label>
              <input type="date" id="exportToDate" value="${exportConfig.toDate}" class="w-full px-3 py-2 text-sm border-2 border-gray-300 dark:border-neutral-600 rounded-lg bg-gray-50 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" onchange="updateExportDateRange()">
            </div>
          </div>
        </div>

        <!-- DATA SELECTION -->
        <div>
          <label class="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-3">
            <i class="uil uil-database mr-1"></i> Select Data to Export
          </label>
          <div class="space-y-2">
            <!-- Summary Statistics -->
            <label class="flex items-center p-3 border-2 border-gray-200 dark:border-neutral-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-all">
              <input type="checkbox" id="export-summary" checked onchange="toggleExportData('summary')" class="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500">
              <div class="ml-3 flex-1">
                <div class="text-sm font-semibold text-gray-800 dark:text-white">Summary Statistics</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">Total incidents, response times, resolution rates</div>
              </div>
              <i class="uil uil-chart-line text-xl text-gray-400"></i>
            </label>

            <!-- Incident Details -->
            <label class="flex items-center p-3 border-2 border-gray-200 dark:border-neutral-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-all">
              <input type="checkbox" id="export-incidents" checked onchange="toggleExportData('incidents')" class="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500">
              <div class="ml-3 flex-1">
                <div class="text-sm font-semibold text-gray-800 dark:text-white">Incident Details</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">Complete incident records with timestamps</div>
              </div>
              <i class="uil uil-file-info-alt text-xl text-gray-400"></i>
            </label>

            <!-- Chart Data -->
            <label class="flex items-center p-3 border-2 border-gray-200 dark:border-neutral-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-all">
              <input type="checkbox" id="export-charts" onchange="toggleExportData('charts')" class="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500">
              <div class="ml-3 flex-1">
                <div class="text-sm font-semibold text-gray-800 dark:text-white">Chart Data</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">Trend analysis and distribution data</div>
              </div>
              <i class="uil uil-chart-pie text-xl text-gray-400"></i>
            </label>

            <!-- Device Logs -->
            <label class="flex items-center p-3 border-2 border-gray-200 dark:border-neutral-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-all">
              <input type="checkbox" id="export-deviceLogs" onchange="toggleExportData('deviceLogs')" class="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500">
              <div class="ml-3 flex-1">
                <div class="text-sm font-semibold text-gray-800 dark:text-white">Device Activity Logs</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">IoT device triggers and sensor data</div>
              </div>
              <i class="uil uil-server text-xl text-gray-400"></i>
            </label>

            <!-- Resident Information -->
            <label class="flex items-center p-3 border-2 border-gray-200 dark:border-neutral-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-all">
              <input type="checkbox" id="export-residents" onchange="toggleExportData('residents')" class="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500">
              <div class="ml-3 flex-1">
                <div class="text-sm font-semibold text-gray-800 dark:text-white">Resident Information</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">Contact details and incident history</div>
              </div>
              <i class="uil uil-users-alt text-xl text-gray-400"></i>
            </label>
          </div>
        </div>

        <!-- EXPORT FORMAT -->
        <div>
          <label class="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-3">
            <i class="uil uil-file-alt mr-1"></i> Choose Export Format
          </label>
          <div class="grid grid-cols-2 gap-3">
            <button onclick="executeExport('csv')" class="export-format-btn flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-neutral-600 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group">
              <div class="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                <i class="uil uil-file-alt text-xl text-emerald-600"></i>
              </div>
              <div class="flex-1 text-left">
                <div class="text-sm font-semibold text-gray-800 dark:text-white">CSV</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">Spreadsheet</div>
              </div>
            </button>

            <button onclick="executeExport('excel')" class="export-format-btn flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-neutral-600 rounded-xl hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group">
              <div class="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <i class="uil uil-file-spreadsheet-alt text-xl text-green-600"></i>
              </div>
              <div class="flex-1 text-left">
                <div class="text-sm font-semibold text-gray-800 dark:text-white">Excel</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">Workbook</div>
              </div>
            </button>

            <button onclick="executeExport('pdf')" class="export-format-btn flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-neutral-600 rounded-xl hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group">
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

        <!-- ESTIMATED SIZE INFO -->
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
    secondaryButton: {
      text: 'Cancel',
      icon: 'uil-times'
    },
    onSecondary: () => {
      modalManager.close('exportModal');
    }
  });
  
  modalManager.show(modalId);
  updateExportSummary();
}

// Export Timeline Selection
window.setExportTimeline = function(timeline) {
  exportConfig.timeline = timeline;
  
  // Show/hide custom date range
  const customDateRange = document.getElementById('customDateRange');
  if (customDateRange) {
    if (timeline === 'custom') {
      customDateRange.classList.remove('hidden');
    } else {
      customDateRange.classList.add('hidden');
    }
  }
  
  // Update button styles
  document.querySelectorAll('.export-timeline-btn').forEach(btn => {
    const btnTimeline = btn.getAttribute('data-timeline');
    if (btnTimeline === timeline) {
      btn.className = 'export-timeline-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all bg-emerald-500 text-white border-emerald-500';
    } else {
      btn.className = 'export-timeline-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500';
    }
  });
  
  updateExportSummary();
};

// Update Export Date Range
window.updateExportDateRange = function() {
  const fromDate = document.getElementById('exportFromDate');
  const toDate = document.getElementById('exportToDate');
  
  if (fromDate) exportConfig.fromDate = fromDate.value;
  if (toDate) exportConfig.toDate = toDate.value;
  
  updateExportSummary();
};

// Toggle Export Data Selection
window.toggleExportData = function(dataType) {
  const checkbox = document.getElementById(`export-${dataType}`);
  if (checkbox) {
    exportConfig.includeData[dataType] = checkbox.checked;
  }
  updateExportSummary();
};

// Update Export Summary
function updateExportSummary() {
  const summaryElement = document.getElementById('exportSummary');
  if (!summaryElement) return;
  
  // Calculate included data count
  const includedCount = Object.values(exportConfig.includeData).filter(v => v).length;
  
  // Get timeline text
  let timelineText = '';
  if (exportConfig.timeline === 'custom' && exportConfig.fromDate && exportConfig.toDate) {
    timelineText = `from ${exportConfig.fromDate} to ${exportConfig.toDate}`;
  } else {
    const timelineMap = {
      'last7days': 'last 7 days',
      'last30days': 'last 30 days',
      'last90days': 'last 90 days'
    };
    timelineText = timelineMap[exportConfig.timeline] || 'selected period';
  }
  
  // Get selected data types
  const selectedData = Object.keys(exportConfig.includeData)
    .filter(key => exportConfig.includeData[key])
    .map(key => key.charAt(0).toUpperCase() + key.slice(1))
    .join(', ');
  
  summaryElement.innerHTML = `
    <strong>${includedCount} data section${includedCount !== 1 ? 's' : ''}</strong> selected for export <br>
    <span class="text-blue-600 dark:text-blue-400">${selectedData || 'None'}</span><br>
    Timeline: <strong>${timelineText}</strong>
  `;
}

// ============================================================================
// EXECUTE EXPORT
// ============================================================================

window.executeExport = function(format) {
  // Validate selection
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
  
  setTimeout(() => {
    const exportData = prepareExportData();
    
    switch(format) {
      case 'csv':
        downloadCSV(exportData);
        break;
      case 'excel':
        downloadExcel(exportData);
        break;
      case 'pdf':
        downloadPDF(exportData);
        break;
      case 'json':
        downloadJSON(exportData);
        break;
    }
    
    showToast('success', `Report exported as ${format.toUpperCase()} successfully!`);
  }, 1500);
};

// ============================================================================
// PREPARE EXPORT DATA
// ============================================================================

function prepareExportData() {
  // Apply timeline filter to get incidents
  const tempFilter = {
    timePeriod: exportConfig.timeline,
    fromDate: exportConfig.fromDate,
    toDate: exportConfig.toDate,
    incidentTypes: ['all'],
    status: ['all']
  };
  
  analyticsEngine.applyFilters(tempFilter);
  const incidents = analyticsEngine.filteredIncidents;
  const stats = analyticsEngine.getStatistics();
  
  const exportData = {
    metadata: {
      exportDate: new Date().toISOString(),
      exportDateFormatted: new Date().toLocaleDateString(),
      timeline: exportConfig.timeline,
      fromDate: exportConfig.fromDate,
      toDate: exportConfig.toDate,
      recordCount: incidents.length
    }
  };
  
  // Include selected data sections
  if (exportConfig.includeData.summary) {
    exportData.summary = {
      totalIncidents: stats.totalIncidents,
      avgResponseTime: stats.avgResponseTime,
      avgResponseTimeMinutes: stats.avgResponseTimeMinutes,
      resolutionRate: stats.resolutionRate,
      resolutionRatePercent: stats.resolutionRatePercent,
      resolvedIncidents: stats.resolvedIncidents,
      respondingIncidents: stats.respondingIncidents,
      pendingIncidents: stats.pendingIncidents
    };
  }
  
  if (exportConfig.includeData.incidents) {
    exportData.incidents = incidents.map(inc => ({
      id: inc.id,
      type: inc.type,
      resident: inc.resident,
      location: inc.location,
      timeReported: inc.timeReported.toISOString(),
      timeReportedFormatted: inc.timeReported.toLocaleString(),
      timeResponded: inc.timeResponded ? inc.timeResponded.toISOString() : null,
      timeResolved: inc.timeResolved ? inc.timeResolved.toISOString() : null,
      responseTime: inc.responseTime,
      status: inc.status,
      description: inc.description,
      priority: inc.priority,
      assignedTo: inc.assignedTo,
      deviceId: inc.deviceId
    }));
  }
  
  if (exportConfig.includeData.charts) {
    exportData.charts = {
      incidentTypeDistribution: analyticsEngine.getIncidentTypeDistribution(),
      responseTimeDistribution: analyticsEngine.getResponseTimeDistribution(),
      peakHoursData: analyticsEngine.getPeakHoursData()
    };
  }
  
  if (exportConfig.includeData.deviceLogs) {
    exportData.deviceLogs = generateDeviceLogs(incidents);
  }
  
  if (exportConfig.includeData.residents) {
    exportData.residents = generateResidentInfo(incidents);
  }
  
  return exportData;
}

function generateDeviceLogs(incidents) {
  return incidents.map(inc => ({
    deviceId: inc.deviceId,
    incidentId: inc.id,
    timestamp: inc.timeReported.toISOString(),
    triggerType: 'automatic',
    sensorStatus: 'active',
    batteryLevel: Math.floor(Math.random() * 30) + 70 + '%',
    signalStrength: Math.floor(Math.random() * 30) + 70 + '%'
  }));
}

function generateResidentInfo(incidents) {
  const residentMap = new Map();
  
  incidents.forEach(inc => {
    if (!residentMap.has(inc.resident)) {
      residentMap.set(inc.resident, {
        name: inc.resident,
        location: inc.location,
        totalIncidents: 0,
        incidentTypes: {},
        lastIncident: inc.timeReported
      });
    }
    
    const resident = residentMap.get(inc.resident);
    resident.totalIncidents++;
    resident.incidentTypes[inc.type] = (resident.incidentTypes[inc.type] || 0) + 1;
    
    if (inc.timeReported > resident.lastIncident) {
      resident.lastIncident = inc.timeReported;
    }
  });
  
  return Array.from(residentMap.values()).map(r => ({
    ...r,
    lastIncident: r.lastIncident.toISOString()
  }));
}

// ============================================================================
// DOWNLOAD FUNCTIONS
// ============================================================================

function downloadCSV(data) {
  let csv = 'SafeChain Analytics Report - CSV Export\n';
  csv += `Generated: ${data.metadata.exportDateFormatted}\n`;
  csv += `Timeline: ${data.metadata.timeline}\n`;
  csv += `Records: ${data.metadata.recordCount}\n\n`;
  
  // Summary Section
  if (data.summary) {
    csv += '=== SUMMARY STATISTICS ===\n';
    csv += 'Metric,Value\n';
    csv += `Total Incidents,${data.summary.totalIncidents}\n`;
    csv += `Average Response Time,${data.summary.avgResponseTime}\n`;
    csv += `Resolution Rate,${data.summary.resolutionRate}\n`;
    csv += `Resolved Incidents,${data.summary.resolvedIncidents}\n`;
    csv += `Responding Incidents,${data.summary.respondingIncidents}\n`;
    csv += `Pending Incidents,${data.summary.pendingIncidents}\n\n`;
  }
  
  // Incidents Section
  if (data.incidents) {
    csv += '=== INCIDENT DETAILS ===\n';
    csv += 'ID,Type,Resident,Location,Time Reported,Response Time,Status,Priority,Assigned To,Device ID,Description\n';
    data.incidents.forEach(inc => {
      csv += `${inc.id},${inc.type},"${inc.resident}","${inc.location}",${inc.timeReportedFormatted},${inc.responseTime},${inc.status},${inc.priority},${inc.assignedTo},${inc.deviceId},"${inc.description}"\n`;
    });
    csv += '\n';
  }
  
  // Charts Section
  if (data.charts) {
    csv += '=== CHART DATA ===\n';
    csv += 'Incident Type Distribution\n';
    csv += 'Type,Count\n';
    Object.entries(data.charts.incidentTypeDistribution).forEach(([type, count]) => {
      csv += `${type},${count}\n`;
    });
    csv += '\n';
    
    csv += 'Response Time Distribution\n';
    csv += 'Range,Count\n';
    Object.entries(data.charts.responseTimeDistribution).forEach(([range, count]) => {
      csv += `${range},${count}\n`;
    });
    csv += '\n';
  }
  
  // Device Logs Section
  if (data.deviceLogs) {
    csv += '=== DEVICE ACTIVITY LOGS ===\n';
    csv += 'Device ID,Incident ID,Timestamp,Trigger Type,Sensor Status,Battery,Signal\n';
    data.deviceLogs.forEach(log => {
      csv += `${log.deviceId},${log.incidentId},${log.timestamp},${log.triggerType},${log.sensorStatus},${log.batteryLevel},${log.signalStrength}\n`;
    });
    csv += '\n';
  }
  
  // Residents Section
  if (data.residents) {
    csv += '=== RESIDENT INFORMATION ===\n';
    csv += 'Name,Location,Total Incidents,Last Incident\n';
    data.residents.forEach(res => {
      csv += `"${res.name}","${res.location}",${res.totalIncidents},${res.lastIncident}\n`;
    });
  }
  
  downloadFile(csv, 'text/csv', 'csv');
}

function downloadExcel(data) {
  // For a real implementation, you would use a library like SheetJS (xlsx)
  // This is a simplified version
  let content = 'SafeChain Analytics Report - Excel Format\n\n';
  content += `Generated: ${data.metadata.exportDateFormatted}\n`;
  content += `Timeline: ${data.metadata.timeline}\n`;
  content += `Records: ${data.metadata.recordCount}\n\n`;
  content += 'Note: This is a simplified export. For full Excel functionality, integrate SheetJS library.\n';
  
  downloadFile(content, 'application/vnd.ms-excel', 'xlsx');
}

function downloadPDF(data) {
  // For a real implementation, you would use a library like jsPDF
  let content = 'SafeChain Analytics Report\n\n';
  content += `Generated: ${data.metadata.exportDateFormatted}\n`;
  content += `Timeline: ${data.metadata.timeline}\n`;
  content += `Total Records: ${data.metadata.recordCount}\n\n`;
  
  if (data.summary) {
    content += 'SUMMARY STATISTICS\n';
    content += `Total Incidents: ${data.summary.totalIncidents}\n`;
    content += `Average Response Time: ${data.summary.avgResponseTime}\n`;
    content += `Resolution Rate: ${data.summary.resolutionRate}\n\n`;
  }
  
  content += 'Note: This is a simplified PDF. For full PDF functionality with charts, integrate jsPDF library.\n';
  
  downloadFile(content, 'application/pdf', 'pdf');
}

function downloadJSON(data) {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, 'application/json', 'json');
}

function downloadFile(content, mimeType, extension) {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SafeChain_Analytics_${new Date().toISOString().split('T')[0]}.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// ============================================================================
// FILTER MODAL
// ============================================================================

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
      class: 'bg-[#01AF78] hover:bg-[#00965F]'
    },
    secondaryButton: {
      text: 'Reset'
    },
    onPrimary: () => {
      applyFilters();
      modalManager.close('filterModal');
    },
    onSecondary: () => {
      resetFilters();
      showFilterModal(); // Refresh modal with reset values
    }
  });
  
  modalManager.show(modalId);
}

function generateFilterModalBody() {
  return `
    <div class="space-y-6">
      <!-- TIME PERIOD -->
      <div>
        <label class="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-3">
          Time Period
        </label>
        <div class="grid grid-cols-3 gap-2 mb-2">
          <button onclick="setTimePeriod('last7days')" class="time-period-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${filterState.timePeriod === 'last7days' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500'}" data-period="last7days">
            Last 7 Days
          </button>
          <button onclick="setTimePeriod('last30days')" class="time-period-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${filterState.timePeriod === 'last30days' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500'}" data-period="last30days">
            Last 30 Days
          </button>
          <button onclick="setTimePeriod('last90days')" class="time-period-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${filterState.timePeriod === 'last90days' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500'}" data-period="last90days">
            Last 90 Days
          </button>
        </div>
      </div>

      <!-- DATE RANGE -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">
            From Date
          </label>
          <input type="date" id="fromDate" value="${filterState.fromDate}" class="w-full px-4 py-2.5 text-sm border-2 border-gray-300 dark:border-neutral-600 rounded-lg bg-gray-50 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">
            To Date
          </label>
          <input type="date" id="toDate" value="${filterState.toDate}" class="w-full px-4 py-2.5 text-sm border-2 border-gray-300 dark:border-neutral-600 rounded-lg bg-gray-50 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
        </div>
      </div>

      <!-- INCIDENT TYPE -->
      <div>
        <label class="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-3">
          Incident Type
        </label>
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

// Time Period Selection
window.setTimePeriod = function(period) {
  filterState.timePeriod = period;
  updateFilterButtons();
};

// Toggle Incident Type
window.toggleIncidentType = function(type) {
  if (type === 'all') {
    filterState.incidentTypes = ['all'];
  } else {
    filterState.incidentTypes = filterState.incidentTypes.filter(t => t !== 'all');
    
    if (filterState.incidentTypes.includes(type)) {
      filterState.incidentTypes = filterState.incidentTypes.filter(t => t !== type);
    } else {
      filterState.incidentTypes.push(type);
    }
    
    if (filterState.incidentTypes.length === 0) {
      filterState.incidentTypes = ['all'];
    }
  }
  updateFilterButtons();
};

// Toggle Status
window.toggleStatus = function(status) {
  if (status === 'all') {
    filterState.status = ['all'];
  } else {
    filterState.status = filterState.status.filter(s => s !== 'all');
    
    if (filterState.status.includes(status)) {
      filterState.status = filterState.status.filter(s => s !== status);
    } else {
      filterState.status.push(status);
    }
    
    if (filterState.status.length === 0) {
      filterState.status = ['all'];
    }
  }
  updateFilterButtons();
};

function updateFilterButtons() {
  // Update date inputs
  const fromDate = document.getElementById('fromDate');
  const toDate = document.getElementById('toDate');
  if (fromDate) filterState.fromDate = fromDate.value;
  if (toDate) filterState.toDate = toDate.value;
  
  // Update time period buttons
  document.querySelectorAll('.time-period-btn').forEach(btn => {
    const period = btn.getAttribute('data-period');
    if (period === filterState.timePeriod) {
      btn.className = 'time-period-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all bg-emerald-500 text-white border-emerald-500';
    } else {
      btn.className = 'time-period-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500';
    }
  });
  
  // Update incident type buttons
  document.querySelectorAll('.incident-type-btn').forEach(btn => {
    const type = btn.getAttribute('data-type');
    if (filterState.incidentTypes.includes(type)) {
      btn.className = 'incident-type-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all bg-emerald-500 text-white border-emerald-500';
    } else {
      btn.className = 'incident-type-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500';
    }
  });
  
  // Update status buttons
  document.querySelectorAll('.status-btn').forEach(btn => {
    const status = btn.getAttribute('data-status');
    if (filterState.status.includes(status)) {
      btn.className = 'status-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all bg-emerald-500 text-white border-emerald-500';
    } else {
      btn.className = 'status-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500';
    }
  });
}

// Apply Filters
function applyFilters() {
  console.log('Applied Filters:', filterState);
  
  analyticsEngine.applyFilters(filterState);
  updateCharts();
  updateIncidentTable();
  
  showToast('success', 'Filters applied successfully!');
}

// Reset Filters
function resetFilters() {
  filterState = {
    timePeriod: 'last30days',
    fromDate: '',
    toDate: '',
    incidentTypes: ['all'],
    status: ['all']
  };
  
  showToast('info', 'Filters have been reset');
}

// Update Incident Table
function updateIncidentTable() {
  const tbody = document.querySelector('tbody');
  if (!tbody) return;
  
  const incidents = analyticsEngine.filteredIncidents.slice(0, 10); // Show first 10
  
  tbody.innerHTML = incidents.map(inc => `
    <tr class="hover:bg-gray-50 dark:hover:bg-neutral-700/50">
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">${inc.id}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${inc.type}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${inc.resident}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${inc.location}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${inc.timeReported.toLocaleString()}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${inc.responseTime}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(inc.status)}">
          ${inc.status}
        </span>
      </td>
    </tr>
  `).join('');
}

function getStatusClass(status) {
  const classes = {
    'Resolved': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'Responding': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
  };
  return classes[status] || '';
}

// ============================================================================
// UTILITY: Toast Notification (if not already defined)
// ============================================================================

if (typeof showToast === 'undefined') {
  window.showToast = function(type, message) {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // Implement actual toast notification here
  };
}