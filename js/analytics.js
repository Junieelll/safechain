// Incident Trends Chart
const ctx1 = document.getElementById("incidentTrendsChart").getContext("2d");
new Chart(ctx1, {
  type: "line",
  data: {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
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
        labels: {
          color: "#6b7280",
          usePointStyle: true,
          padding: 5,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,

        ticks: {
          color: "#9ca3af",
          stepSize: 20,
        },

        grid: {
          color: "#e5e7eb",
          borderDash: [5, 5], // optional dotted grid
        },
      },

      x: {
        ticks: { color: "#9ca3af" },

        // ⭐ add left & right margin so points don’t touch edges
        offset: true,

        grid: { display: true },
      },
    },
  },
});


// Incident Types Chart
const ctx2 = document.getElementById("incidentTypesChart").getContext("2d");
new Chart(ctx2, {
  type: "doughnut",
  data: {
    labels: ["Fire", "Flood", "Crime"],
    datasets: [
      {
        data: [40, 35, 25],
        backgroundColor: ["#8b5cf6", "#22d3ee", "#fb7185"],
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
        labels: {
          color: "#6b7280",
          usePointStyle: true,
          padding: 15,
        },
      },
    },
  },
});

// Response Time Chart with TOP-ONLY rounded bars
const ctx3 = document.getElementById("responseTimeChart").getContext("2d");
new Chart(ctx3, {
  type: "bar",
  data: {
    labels: ["0-2 mins", "2-4 mins", "4-6 mins", "6+ mins"],
    datasets: [
      {
        label: "Incident",
        data: [45, 15, 55, 30],
        backgroundColor: "rgba(139, 92, 246, 1)",

        // ⭐ Top-only rounded corners
        borderRadius: { topLeft: 50, topRight: 50, bottomLeft: 0, bottomRight: 0 },

        borderSkipped: "bottom",   // ensures bottom stays flat
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
        labels: {
          color: "#6b7280",
          usePointStyle: true,
          padding: 15,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,

        // ⭐ Show only 0, 50, 100
        ticks: {
          color: "#9ca3af",
          stepSize: 50,
        },

        // ⭐ dotted grid lines
        grid: {
          color: "#e5e7eb",
          borderDash: [5, 5],
        },
      },
      x: {
        ticks: { color: "#9ca3af" },
        grid: {
          color: "#e5e7eb",
          borderDash: [5, 5],
        },
      },
    },
  },
});


// Peak Hours Chart with FULL rounded bars
const ctx4 = document.getElementById("peakHoursChart").getContext("2d");
new Chart(ctx4, {
  type: "bar",
  data: {
    labels: ["6AM", "9AM", "12PM", "3PM", "6PM", "9PM", "12AM"],
    datasets: [
      {
        label: "Incidents",
        data: [40, 28, 45, 48, 50, 32, 38],
        backgroundColor: "rgba(139, 92, 246, 1)",
        borderRadius: Number.MAX_VALUE,
        borderSkipped: false,
        barThickness: 50,
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
        labels: {
          color: "#6b7280",
          usePointStyle: true,
          padding: 15,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 50,
        ticks: {
          color: "#9ca3af",
          stepSize: 25, // set step size to 25
        },
        grid: {
          color: "#e5e7eb",
          borderDash: [5, 5], // make the grid lines dotted
        },
      },
      x: {
        ticks: { color: "#9ca3af" },
        grid: { display: false },grid: {
          color: "#e5e7eb",
          borderDash: [5, 5], // make the grid lines dotted
        },
      },
    },
  },
});

// Filter State Management
let filterState = {
  timePeriod: 'last7days',
  fromDate: '',
  toDate: '',
  incidentTypes: ['all'],
  status: ['all']
};

// Export and Filter Functionality
document.addEventListener('DOMContentLoaded', function() {
  const exportBtn = document.querySelector('.header-actions button:last-child');
  const filterBtn = document.querySelector('.header-actions button:first-child');
  
  // Export Report Function - Show Format Selection Modal
  exportBtn.addEventListener('click', function() {
    showExportModal();
  });
  
  // Filter Modal Functionality
  filterBtn.addEventListener('click', function() {
    showFilterModal();
  });
  
  // Show Export Format Selection Modal
  function showExportModal() {
    const modalId = modalManager.create({
      id: 'exportModal',
      icon: 'uil-download-alt',
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      title: 'Export Report',
      subtitle: 'Choose your preferred export format',
      body: `
        <div class="space-y-3">
          <button onclick="exportReport('csv')" class="export-option-btn w-full flex items-center gap-4 p-4 border-2 border-gray-200 dark:border-neutral-600 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group">
            <div class="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
              <i class="uil uil-file-alt text-2xl text-emerald-600"></i>
            </div>
            <div class="flex-1 text-left">
              <h4 class="text-sm font-semibold text-gray-800 dark:text-white">CSV Format</h4>
              <p class="text-xs text-gray-500 dark:text-gray-400">Comma-separated values for spreadsheets</p>
            </div>
            <i class="uil uil-arrow-right text-xl text-gray-400 group-hover:text-emerald-600 transition-colors"></i>
          </button>

          <button onclick="exportReport('pdf')" class="export-option-btn w-full flex items-center gap-4 p-4 border-2 border-gray-200 dark:border-neutral-600 rounded-xl hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group">
            <div class="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
              <i class="uil uil-file-download-alt text-2xl text-red-600"></i>
            </div>
            <div class="flex-1 text-left">
              <h4 class="text-sm font-semibold text-gray-800 dark:text-white">PDF Format</h4>
              <p class="text-xs text-gray-500 dark:text-gray-400">Formatted document with charts and tables</p>
            </div>
            <i class="uil uil-arrow-right text-xl text-gray-400 group-hover:text-red-600 transition-colors"></i>
          </button>

          <button onclick="exportReport('excel')" class="export-option-btn w-full flex items-center gap-4 p-4 border-2 border-gray-200 dark:border-neutral-600 rounded-xl hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group">
            <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
              <i class="uil uil-file-spreadsheet-alt text-2xl text-green-600"></i>
            </div>
            <div class="flex-1 text-left">
              <h4 class="text-sm font-semibold text-gray-800 dark:text-white">Excel Format</h4>
              <p class="text-xs text-gray-500 dark:text-gray-400">Microsoft Excel workbook with multiple sheets</p>
            </div>
            <i class="uil uil-arrow-right text-xl text-gray-400 group-hover:text-green-600 transition-colors"></i>
          </button>

          <button onclick="exportReport('json')" class="export-option-btn w-full flex items-center gap-4 p-4 border-2 border-gray-200 dark:border-neutral-600 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group">
            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
              <i class="uil uil-brackets-curly text-2xl text-blue-600"></i>
            </div>
            <div class="flex-1 text-left">
              <h4 class="text-sm font-semibold text-gray-800 dark:text-white">JSON Format</h4>
              <p class="text-xs text-gray-500 dark:text-gray-400">Raw data for developers and integrations</p>
            </div>
            <i class="uil uil-arrow-right text-xl text-gray-400 group-hover:text-blue-600 transition-colors"></i>
          </button>
        </div>
      `,
      secondaryButton: {
        text: 'Cancel'
      },
      onSecondary: () => {
        modalManager.close('exportModal');
      }
    });
    
    modalManager.show(modalId);
  }
  
  // Export Report Function
  window.exportReport = function(format) {
    modalManager.close('exportModal');
    
    // Show loading toast
    showToast('info', `Preparing ${format.toUpperCase()} export...`);
    
    setTimeout(() => {
      const reportData = {
        generatedDate: new Date().toLocaleDateString(),
        stats: {
          totalIncidents: 247,
          avgResponseTime: '2.4m',
          resolutionRate: '98.2%'
        },
        incidents: gatherIncidentData()
      };
      
      switch(format) {
        case 'csv':
          downloadCSV(reportData);
          break;
        case 'pdf':
          downloadPDF(reportData);
          break;
        case 'excel':
          downloadExcel(reportData);
          break;
        case 'json':
          downloadJSON(reportData);
          break;
      }
      
      showToast('success', `Report exported as ${format.toUpperCase()} successfully!`);
    }, 1500);
  };
  
  // Show Filter Modal with Dynamic UI
  function showFilterModal() {
    const modalId = modalManager.create({
      id: 'filterModal',
      icon: 'uil-filter',
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      title: 'Filter Analytics',
      subtitle: 'Apply filters to view specific analytics and device performance trends.',
      body: `
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
            <div class="grid grid-cols-3 gap-2">
              <button onclick="setTimePeriod('lastyear')" class="time-period-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${filterState.timePeriod === 'lastyear' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500'}" data-period="lastyear">
                Last Year
              </button>
            </div>
          </div>

          <!-- DATE RANGE -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">
                From Date
              </label>
              <div class="relative">
                <input type="date" id="fromDate" value="${filterState.fromDate}" class="w-full px-4 py-2.5 text-sm border-2 border-gray-300 dark:border-neutral-600 rounded-lg bg-gray-50 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all">
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2">
                To Date
              </label>
              <div class="relative">
                <input type="date" id="toDate" value="${filterState.toDate}" class="w-full px-4 py-2.5 text-sm border-2 border-gray-300 dark:border-neutral-600 rounded-lg bg-gray-50 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all">
              </div>
            </div>
          </div>

          <!-- INCIDENT TYPE -->
          <div>
            <label class="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-3">
              Incident Type
            </label>
            <div class="grid grid-cols-2 gap-2">
              <button onclick="toggleIncidentType('all')" class="incident-type-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${filterState.incidentTypes.includes('all') ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500'}" data-type="all">
                All Types
              </button>
              <button onclick="toggleIncidentType('crime')" class="incident-type-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${filterState.incidentTypes.includes('crime') ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500'}" data-type="crime">
                Crime
              </button>
              <button onclick="toggleIncidentType('flood')" class="incident-type-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${filterState.incidentTypes.includes('flood') ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500'}" data-type="flood">
                Flood
              </button>
              <button onclick="toggleIncidentType('fire')" class="incident-type-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${filterState.incidentTypes.includes('fire') ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500'}" data-type="fire">
                Fire
              </button>
            </div>
          </div>

          <!-- STATUS -->
          <div>
            <label class="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-3">
              Status
            </label>
            <div class="grid grid-cols-2 gap-2">
              <button onclick="toggleStatus('all')" class="status-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${filterState.status.includes('all') ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500'}" data-status="all">
                All Types
              </button>
              <button onclick="toggleStatus('responding')" class="status-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${filterState.status.includes('responding') ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500'}" data-status="responding">
                Responding
              </button>
              <button onclick="toggleStatus('resolved')" class="status-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${filterState.status.includes('resolved') ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500'}" data-status="resolved">
                Resolved
              </button>
              <button onclick="toggleStatus('pending')" class="status-btn px-4 py-2.5 text-xs font-medium rounded-lg border-2 transition-all ${filterState.status.includes('pending') ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-600 hover:border-emerald-500'}" data-status="pending">
                Pending
              </button>
            </div>
          </div>
        </div>
      `,
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
        updateFilterModalUI();
      }
    });
    
    modalManager.show(modalId);
  }
  
  // Time Period Selection
  window.setTimePeriod = function(period) {
    filterState.timePeriod = period;
    updateFilterModalUI();
  };
  
  // Toggle Incident Type
  window.toggleIncidentType = function(type) {
    if (type === 'all') {
      filterState.incidentTypes = ['all'];
    } else {
      // Remove 'all' if specific type is selected
      filterState.incidentTypes = filterState.incidentTypes.filter(t => t !== 'all');
      
      if (filterState.incidentTypes.includes(type)) {
        filterState.incidentTypes = filterState.incidentTypes.filter(t => t !== type);
      } else {
        filterState.incidentTypes.push(type);
      }
      
      // If no types selected, default to 'all'
      if (filterState.incidentTypes.length === 0) {
        filterState.incidentTypes = ['all'];
      }
    }
    updateFilterModalUI();
  };
  
  // Toggle Status
  window.toggleStatus = function(status) {
    if (status === 'all') {
      filterState.status = ['all'];
    } else {
      // Remove 'all' if specific status is selected
      filterState.status = filterState.status.filter(s => s !== 'all');
      
      if (filterState.status.includes(status)) {
        filterState.status = filterState.status.filter(s => s !== status);
      } else {
        filterState.status.push(status);
      }
      
      // If no status selected, default to 'all'
      if (filterState.status.length === 0) {
        filterState.status = ['all'];
      }
    }
    updateFilterModalUI();
  };
  
  // Update Filter Modal UI
  function updateFilterModalUI() {
    // Update from/to dates
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
    
    // Here you would implement actual filtering logic for:
    // 1. Filter table rows
    // 2. Update charts
    // 3. Update statistics
    
    showToast('success', 'Filters applied successfully!');
  }
  
  // Reset Filters
  function resetFilters() {
    filterState = {
      timePeriod: 'last7days',
      fromDate: '',
      toDate: '',
      incidentTypes: ['all'],
      status: ['all']
    };
    
    showToast('info', 'Filters have been reset');
  }
  
  // Gather incident data from table
  function gatherIncidentData() {
    const rows = document.querySelectorAll('tbody tr');
    const incidents = [];
    
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      incidents.push({
        id: cells[0].textContent,
        type: cells[1].textContent,
        resident: cells[2].textContent,
        location: cells[3].textContent,
        timeReported: cells[4].textContent,
        responseTime: cells[5].textContent,
        status: cells[6].textContent.trim()
      });
    });
    
    return incidents;
  }
  
  // Download Functions
  function downloadCSV(data) {
    let csv = 'SafeChain Analytics Report\n';
    csv += `Generated: ${data.generatedDate}\n\n`;
    csv += 'Summary Statistics\n';
    csv += `Total Incidents (30 days),${data.stats.totalIncidents}\n`;
    csv += `Average Response Time,${data.stats.avgResponseTime}\n`;
    csv += `Resolution Rate,${data.stats.resolutionRate}\n\n`;
    csv += 'Recent Emergency Incidents\n';
    csv += 'Incident ID,Type,Resident,Location,Time Reported,Response Time,Status\n';
    
    data.incidents.forEach(incident => {
      csv += `${incident.id},${incident.type},${incident.resident},"${incident.location}",${incident.timeReported},${incident.responseTime},${incident.status}\n`;
    });
    
    downloadFile(csv, 'text/csv', 'csv');
  }
  
  function downloadPDF(data) {
    const pdfContent = `SafeChain Analytics Report - PDF Format\nGenerated: ${data.generatedDate}`;
    downloadFile(pdfContent, 'application/pdf', 'pdf');
  }
  
  function downloadExcel(data) {
    const excelContent = `SafeChain Analytics Report - Excel Format\nGenerated: ${data.generatedDate}`;
    downloadFile(excelContent, 'application/vnd.ms-excel', 'xlsx');
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
});