const incidentData = {
  fire: [
    {
      id: "EMG-2024-1047",
      type: "Fire Emergency",
      icon: "uil-fire",
      color: "red",
      time: "2:34 PM",
      user: {
        name: "Maria Santos",
        contact: "+63 912 345 6789",
        id: "USR-45821",
      },
      location: {
        address: "63 San Nicasio St., Villaflor",
        barangay: "Gulod",
        city: "Quezon City",
        coords: "14.6837° N, 121.0253° E",
      },
      lat: 14.716412,
      lng: 121.040834,
      timeline: [
        { time: "2:34 PM", event: "Emergency reported by Maria Santos" },
        { time: "2:35 PM", event: "Location verified" },
        {
          time: "2:36 PM",
          event: "Awaiting response team dispatch",
          pending: true,
        },
      ],
    },
    {
      id: "EMG-2024-1048",
      type: "Fire Alert",
      icon: "uil-fire",
      color: "red",
      time: "3:15 PM",
      user: {
        name: "Juan Cruz",
        contact: "+63 923 456 7890",
        id: "USR-45822",
      },
      location: {
        address: "45 Santol St., Bagong Silang",
        barangay: "Gulod",
        city: "Quezon City",
        coords: "14.6845° N, 121.0240° E",
      },
      lat: 14.711874,
      lng: 121.038715,
      timeline: [
        { time: "3:15 PM", event: "Smoke detected by Juan Cruz" },
        { time: "3:16 PM", event: "Fire department notified" },
      ],
    },
  ],
  crime: [
    {
      id: "EMG-2024-1049",
      type: "Crime Report",
      icon: "uil-shield-plus",
      color: "yellow",
      time: "1:20 PM",
      user: {
        name: "Pedro Reyes",
        contact: "+63 934 567 8901",
        id: "USR-45823",
      },
      location: {
        address: "28 Mahogany St., Villa Rosa",
        barangay: "Gulod",
        city: "Quezon City",
        coords: "14.6842° N, 121.0248° E",
      },
      lat: 14.714923,
      lng: 121.040745,
      timeline: [
        { time: "1:20 PM", event: "Theft reported by Pedro Reyes" },
        { time: "1:22 PM", event: "Police dispatch requested" },
      ],
    },
  ],
  flood: [
    {
      id: "EMG-2024-1050",
      type: "Flood Warning",
      icon: "uil-water",
      color: "blue",
      time: "4:05 PM",
      user: {
        name: "Ana Lopez",
        contact: "+63 945 678 9012",
        id: "USR-45824",
      },
      location: {
        address: "12 Riverside Ave., San Roque",
        barangay: "Gulod",
        city: "Quezon City",
        coords: "14.6830° N, 121.0265° E",
      },
      lat: 14.71162,
      lng: 121.043019,
      timeline: [
        { time: "4:05 PM", event: "Water level rising reported" },
        { time: "4:07 PM", event: "Evacuation alert issued" },
      ],
    },
    {
      id: "EMG-2024-1051",
      type: "Flood Alert",
      icon: "uil-water",
      color: "blue",
      time: "4:30 PM",
      user: {
        name: "Carlos Mendoza",
        contact: "+63 956 789 0123",
        id: "USR-45825",
      },
      location: {
        address: "89 Creek Lane, Nueva Vista",
        barangay: "Gulod",
        city: "Quezon City",
        coords: "14.6850° N, 121.0230° E",
      },
      lat: 14.714173,
      lng: 121.036679,
      timeline: [
        {
          time: "4:30 PM",
          event: "Heavy rainfall reported by Carlos Mendoza",
        },
        { time: "4:31 PM", event: "Monitoring in progress" },
      ],
    },
  ],
};

function renderIncidentDetails(incident) {
  const colorClasses = {
    red: "bg-red-50 text-red-600",
    yellow: "bg-yellow-50 text-yellow-600",
    blue: "bg-blue-50 text-blue-600",
  };

  return `
          <div class="mb-6">
            <div class="bg-[#F6F7F7] rounded-lg p-4 space-y-3 text-sm">
              <div class="inline-flex items-center gap-2 ${
                colorClasses[incident.color]
              } px-3 py-2 rounded-lg">
                <i class="uil ${incident.icon} text-lg"></i>
                <span class="text-sm font-medium">${incident.type}</span>
              </div>
              <div class="flex justify-between">
                <p class="text-gray-500 mb-1">Incident ID</p>
                <p class="font-medium text-gray-800">#${incident.id}</p>
              </div>
              <div class="flex justify-between">
                <p class="text-gray-500 mb-1">Time Reported</p>
                <p class="font-medium text-gray-800">${incident.time}</p>
              </div>
            </div>
          </div>

          <div class="mb-6">
            <h3 class="text-sm font-semibold text-[#27C291] uppercase tracking-wide mb-3">User Information</h3>
            <div class="bg-[#F6F7F7] rounded-lg p-4 space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Name</span>
                <span class="font-medium text-gray-800">${
                  incident.user.name
                }</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Contact</span>
                <span class="font-medium text-gray-800">${
                  incident.user.contact
                }</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">User ID</span>
                <span class="font-medium text-gray-800">${
                  incident.user.id
                }</span>
              </div>
            </div>
          </div>

          <div class="mb-6">
            <h3 class="text-sm font-semibold text-[#27C291] uppercase tracking-wide mb-3">Location Details</h3>
            <div class="bg-[#F6F7F7] rounded-lg p-4 space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Address</span>
                <span class="font-medium text-gray-800 text-right">${
                  incident.location.address
                }</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Barangay</span>
                <span class="font-medium text-gray-800">${
                  incident.location.barangay
                }</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">City</span>
                <span class="font-medium text-gray-800">${
                  incident.location.city
                }</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Coordinates</span>
                <span class="font-medium text-gray-800 text-right">${
                  incident.location.coords
                }</span>
              </div>
            </div>
          </div>

          <div class="mb-6">
            <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Activity Timeline</h3>
            <div class="space-y-4">
              ${incident.timeline
                .map(
                  (item, index) => `
                <div class="flex gap-3">
                  <div class="flex flex-col items-center">
                    <div class="w-3 h-3 rounded-full ${
                      item.pending ? "bg-gray-300" : "bg-[#27C291]"
                    } p-1 mb-1"></div>
                    ${
                      index < incident.timeline.length - 1
                        ? '<div class="w-0.5 h-full bg-gray-200"></div>'
                        : ""
                    }
                  </div>
                  <div class="flex-1 ${
                    index < incident.timeline.length - 1 ? "pb-4" : ""
                  }">
                    <p class="text-xs font-semibold text-gray-800 mb-1">${
                      item.time
                    }</p>
                    <p class="text-xs text-gray-600">${item.event}</p>
                  </div>
                </div>`
                )
                .join("")}
            </div>
          </div>
        `;
}

const rightPanel = document.getElementById("rightPanel");
const rightPanelToggle = document.getElementById("rightPanelToggle");
const incidentContent = document.getElementById("incidentContent");
let isRightPanelCollapsed = false;

var map = L.map("map").setView([14.7158532, 121.0403842], 16);

L.tileLayer(
  "https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=2bXjFOI9q9BSiHQVwLb7",
  {
    attribution:
      '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>',
  }
).addTo(map);

const fireIcon = L.divIcon({
  className:
    "custom-marker marker-fire rounded-full flex items-center justify-center",
  html: '<i class="uil uil-fire"></i>',
  iconSize: [35, 35],
  iconAnchor: [17, 17],
});

const crimeIcon = L.divIcon({
  className:
    "custom-marker marker-crime rounded-full flex items-center justify-center",
  html: '<i class="uil uil-shield-plus"></i>',
  iconSize: [35, 35],
  iconAnchor: [17, 17],
});

const floodIcon = L.divIcon({
  className:
    "custom-marker marker-flood rounded-full flex items-center justify-center",
  html: '<i class="uil uil-water"></i>',
  iconSize: [35, 35],
  iconAnchor: [17, 17],
});

const markers = {
  fire: [],
  crime: [],
  flood: [],
};

const iconMap = {
  fire: fireIcon,
  crime: crimeIcon,
  flood: floodIcon,
};

// Add all markers
Object.keys(incidentData).forEach((type) => {
  incidentData[type].forEach((incident) => {
    const marker = L.marker([incident.lat, incident.lng], {
      icon: iconMap[type],
    })
      .addTo(map)
      .bindPopup(`<strong>${incident.type}</strong><br>${incident.user.name}`);

    marker.on("click", () => {
      incidentContent.innerHTML = renderIncidentDetails(incident);
      if (isRightPanelCollapsed) {
        rightPanelToggle.click();
      }
    });

    markers[type].push(marker);
  });
});

// Load default incident
incidentContent.innerHTML = renderIncidentDetails(incidentData.fire[0]);

document.getElementById("zoomIn").addEventListener("click", () => map.zoomIn());
document
  .getElementById("zoomOut")
  .addEventListener("click", () => map.zoomOut());

document.getElementById("locate").addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      map.setView([position.coords.latitude, position.coords.longitude], 15);
    });
  } else {
    alert("Geolocation is not supported by your browser");
  }
});

const filterButtons = document.querySelectorAll("[data-filter]");
filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const filter = btn.dataset.filter;
    btn.classList.toggle("active");

    markers[filter].forEach((marker) => {
      if (btn.classList.contains("active")) {
        marker.addTo(map);
      } else {
        map.removeLayer(marker);
      }
    });
  });
});

rightPanelToggle.addEventListener("click", () => {
  isRightPanelCollapsed = !isRightPanelCollapsed;

  if (isRightPanelCollapsed) {
    rightPanel.style.transform = "translateX(100%)";
    mainContent.classList.remove("mr-[360px]");
    mainContent.classList.add("mr-0");
  } else {
    rightPanel.style.transform = "translateX(0)";
    mainContent.classList.remove("mr-0");
    mainContent.classList.add("mr-[360px]");
  }

  const icon = rightPanelToggle.querySelector("i");
  icon.classList.toggle("uil-angle-right", !isRightPanelCollapsed);
  icon.classList.toggle("uil-angle-left", isRightPanelCollapsed);

  setTimeout(() => map.invalidateSize(), 300);
});

// Chart.js Configuration
setTimeout(() => {
  const ctx = document.getElementById("emergencyChart").getContext("2d");
  const emergencyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      datasets: [
        {
          label: "Fire",
          data: [28, 35, 32, 38, 30, 22, 48, 47, 35, 15, 32, 38],
          borderColor: "#ff4444",
          backgroundColor: "rgba(255, 68, 68, 0.1)",
          tension: 0.4,
          fill: true,
          borderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: "#ff4444",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointHoverBackgroundColor: "#ff4444",
          pointHoverBorderColor: "#fff",
          pointHoverBorderWidth: 3,
        },
        {
          label: "Flood",
          data: [32, 42, 38, 28, 12, 8, 28, 22, 18, 35, 38, 42],
          borderColor: "#3B82F6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.4,
          fill: true,
          borderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: "#3B82F6",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointHoverBackgroundColor: "#3B82F6",
          pointHoverBorderColor: "#fff",
          pointHoverBorderWidth: 3,
        },
        {
          label: "Crime",
          data: [25, 12, 22, 18, 12, 25, 22, 25, 22, 15, 25, 18, 28],
          borderColor: "#FBBF24",
          backgroundColor: "rgba(251, 191, 36, 0.1)",
          tension: 0.4,
          fill: true,
          borderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: "#FBBF24",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointHoverBackgroundColor: "#FBBF24",
          pointHoverBorderColor: "#fff",
          pointHoverBorderWidth: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          padding: 12,
          cornerRadius: 8,
          titleFont: {
            size: 14,
            weight: "600",
          },
          bodyFont: {
            size: 13,
          },
          displayColors: true,
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 25,
            color: "#94a3b8",
            font: {
              size: 12,
            },
          },
          grid: {
            color: "rgba(148, 163, 184, 0.15)",
            drawBorder: false,
          },
        },
        x: {
          ticks: {
            color: "#94a3b8",
            font: {
              size: 12,
            },
          },
          grid: {
            display: false,
            drawBorder: false,
          },
        },
      },
    },
  });
}, 100);

// Year Dropdown Functionality
const yearDropdownBtn = document.getElementById("yearDropdownBtn");
const yearDropdownMenu = document.getElementById("yearDropdownMenu");
const yearDropdownIcon = document.getElementById("yearDropdownIcon");
const selectedYearSpan = document.getElementById("selectedYear");
const yearOptions = document.querySelectorAll(".year-option");

yearDropdownBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  yearDropdownMenu.classList.toggle("hidden");
  yearDropdownIcon.style.transform = yearDropdownMenu.classList.contains(
    "hidden"
  )
    ? "rotate(0deg)"
    : "rotate(180deg)";
});

yearOptions.forEach((option) => {
  option.addEventListener("click", (e) => {
    e.stopPropagation();
    const year = option.dataset.year;

    // Update selected year
    selectedYearSpan.textContent = year;

    // Update active state
    yearOptions.forEach((opt) => {
      opt.classList.remove("active", "bg-[#01af78]/10", "font-medium");
    });
    option.classList.add("active", "bg-[#01af78]/10", "font-medium");

    // Close dropdown
    yearDropdownMenu.classList.add("hidden");
    yearDropdownIcon.style.transform = "rotate(0deg)";

    // Generate random data for selected year
    const generateRandomData = () =>
      Array.from({ length: 12 }, () => Math.floor(Math.random() * 50) + 10);

    emergencyChart.data.datasets[0].data = generateRandomData();
    emergencyChart.data.datasets[1].data = generateRandomData();
    emergencyChart.data.datasets[2].data = generateRandomData();
    emergencyChart.update();

    console.log("Selected year:", year);
  });
});

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  if (
    !yearDropdownBtn.contains(e.target) &&
    !yearDropdownMenu.contains(e.target)
  ) {
    yearDropdownMenu.classList.add("hidden");
    yearDropdownIcon.style.transform = "rotate(0deg)";
  }
});
