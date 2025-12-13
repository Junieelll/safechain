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

// Data structure for different years
const chartDataByYear = {
  2024: {
    fire: [28, 35, 32, 38, 30, 22, 48, 47, 35, 15, 32, 38],
    flood: [32, 42, 38, 28, 12, 8, 28, 22, 18, 35, 38, 42],
    crime: [25, 12, 22, 18, 12, 25, 22, 25, 22, 15, 25, 18],
  },
  2023: {
    fire: [22, 28, 35, 31, 27, 19, 42, 39, 30, 12, 28, 35],
    flood: [28, 38, 35, 24, 10, 6, 25, 19, 15, 32, 35, 39],
    crime: [20, 10, 19, 15, 10, 22, 19, 22, 19, 12, 22, 15],
  },
  2022: {
    fire: [25, 30, 28, 35, 28, 20, 45, 43, 33, 14, 30, 36],
    flood: [30, 40, 36, 26, 11, 7, 26, 20, 16, 33, 36, 40],
    crime: [22, 11, 20, 16, 11, 23, 20, 23, 20, 13, 23, 16],
  },
  2021: {
    fire: [20, 26, 30, 33, 25, 18, 40, 38, 28, 11, 26, 33],
    flood: [26, 36, 33, 22, 9, 5, 22, 17, 13, 30, 33, 37],
    crime: [18, 9, 17, 13, 9, 20, 17, 20, 17, 10, 20, 13],
  },
  2020: {
    fire: [18, 24, 27, 30, 23, 16, 38, 35, 26, 10, 24, 30],
    flood: [24, 34, 30, 20, 8, 4, 20, 15, 11, 28, 30, 35],
    crime: [16, 8, 15, 11, 8, 18, 15, 18, 15, 9, 18, 11],
  },
};

// Historical incident data separated by type
const historicalIncidents = {
  fire: [
    { lat: 14.7145, lng: 121.0395, intensity: 0.9 },
    { lat: 14.7152, lng: 121.0418, intensity: 0.8 },
    { lat: 14.7138, lng: 121.0402, intensity: 0.85 },
    { lat: 14.7168, lng: 121.0391, intensity: 0.9 },
    { lat: 14.7129, lng: 121.0425, intensity: 0.75 },
    { lat: 14.7141, lng: 121.0387, intensity: 0.8 },
    { lat: 14.7156, lng: 121.0434, intensity: 0.85 },
    { lat: 14.7133, lng: 121.0396, intensity: 0.7 },
    { lat: 14.7171, lng: 121.0406, intensity: 0.88 },
    { lat: 14.7149, lng: 121.0443, intensity: 0.82 },
    { lat: 14.7137, lng: 121.0378, intensity: 0.9 },
  ],
  crime: [
    { lat: 14.7147, lng: 121.0411, intensity: 0.7 },
    { lat: 14.7159, lng: 121.0399, intensity: 0.75 },
    { lat: 14.7142, lng: 121.0428, intensity: 1.65 },
    { lat: 14.7136, lng: 121.0384, intensity: 0.7 },
    { lat: 14.7151, lng: 121.0407, intensity: 0.68 },
    { lat: 14.7128, lng: 121.0419, intensity: 1.72 },
    { lat: 14.7165, lng: 121.0393, intensity: 1.67 },
    { lat: 14.7144, lng: 121.0401, intensity: 0.73 },
    { lat: 14.7139, lng: 121.0415, intensity: 1.69 },
    { lat: 14.7158, lng: 121.0380, intensity: 0.71 },
    { lat: 14.7162, lng: 121.0429, intensity: 0.68 },
    { lat: 14.7131, lng: 121.0408, intensity: 1.74 },
  ],
  flood: [
    { lat: 14.7112, lng: 121.0431, intensity: 0.6 },
    { lat: 14.7148, lng: 121.0389, intensity: 0.65 },
    { lat: 14.7125, lng: 121.0404, intensity: 0.62 },
    { lat: 14.7161, lng: 121.0422, intensity: 1.58 },
    { lat: 14.7134, lng: 121.0412, intensity: 1.63 },
    { lat: 14.7119, lng: 121.0397, intensity: 1.61 },
    { lat: 14.7154, lng: 121.0385, intensity: 1.59 },
    { lat: 14.7127, lng: 121.0438, intensity: 0.64 },
    { lat: 14.7115, lng: 121.0413, intensity: 0.65 },
    { lat: 14.7123, lng: 121.0391, intensity: 0.6 },
  ]
};

// Heatmap layers for each type
const heatmapLayers = {
  fire: null,
  crime: null,
  flood: null
};

const heatmapVisible = {
  fire: true,
  crime: true,
  flood: true
};

// Function to generate heatmap data for specific type
function generateHeatmapData(type) {
  const heatData = [];
  
  // Add current incidents of this type
  if (incidentData[type]) {
    incidentData[type].forEach((incident) => {
      const intensity = type === 'fire' ? 1.0 : type === 'crime' ? 0.8 : 0.7;
      heatData.push([incident.lat, incident.lng, intensity]);
    });
  }
  
  // Add historical incidents of this type
  if (historicalIncidents[type]) {
    historicalIncidents[type].forEach((incident) => {
      heatData.push([incident.lat, incident.lng, incident.intensity]);
    });
  }
  
  return heatData;
}

// Heatmap configurations for each type
const heatmapConfigs = {
  fire: {
    radius: 30,
    blur: 20,
    maxZoom: 17,
    max: 1.0,
    minOpacity: 0.3,
    gradient: {
      0.0: 'rgba(255, 68, 68, 0)',      // Lightest, matches icon
      0.3: 'rgba(255, 68, 68, 0.35)',
      0.5: 'rgba(220, 40, 40, 0.55)',   // Slightly darker red
      0.7: 'rgba(200, 30, 30, 0.75)',
      0.9: 'rgba(170, 20, 20, 0.9)',
      1.0: 'rgba(140, 10, 10, 1)'       // Deep red for high intensity
    }
  },

  crime: {
    radius: 28,
    blur: 18,
    maxZoom: 17,
    max: 1.0,
    minOpacity: 0.3,
    gradient: {
      0.0: 'rgba(251, 191, 36, 0)',      // Light yellow (icon color)
      0.3: 'rgba(251, 191, 36, 0.35)',
      0.5: 'rgba(245, 158, 11, 0.55)',   // Deeper amber
      0.7: 'rgba(217, 119, 6, 0.75)',
      0.9: 'rgba(180, 83, 9, 0.9)',
      1.0: 'rgba(120, 50, 5, 1)'         // Darker brownish-orange
    }
  },

  flood: {
    radius: 32,
    blur: 22,
    maxZoom: 17,
    max: 1.0,
    minOpacity: 0.3,
    gradient: {
      0.0: 'rgba(59, 130, 246, 0)',
      0.3: 'rgba(59, 130, 246, 0.3)',
      0.5: 'rgba(37, 99, 235, 0.5)',
      0.7: 'rgba(29, 78, 216, 0.7)',
      0.9: 'rgba(30, 64, 175, 0.85)',
      1.0: 'rgba(23, 37, 84, 1)'
    }
  }
};

// Function to initialize individual heatmap
function initializeHeatmap(type) {
  const heatData = generateHeatmapData(type);
  heatmapLayers[type] = L.heatLayer(heatData, heatmapConfigs[type]).addTo(map);
}

// Update theme switcher to handle all heatmaps
function updateHeatmapsForTheme(isDark) {
  Object.keys(heatmapLayers).forEach(type => {
    if (heatmapLayers[type] && heatmapVisible[type]) {
      const heatData = generateHeatmapData(type);
      map.removeLayer(heatmapLayers[type]);
      
      // Adjust opacity for dark mode
      const config = { ...heatmapConfigs[type] };
      if (isDark) {
        config.minOpacity = 0.4;
      }
      
      heatmapLayers[type] = L.heatLayer(heatData, config).addTo(map);
    }
  });
}

function renderSkeletonLoading() {
  return `
    <div class="skeleton-loading">
      <div class="mb-6">
        <div class="bg-neutral-100 dark:bg-neutral-700 rounded-lg p-4 space-y-3">
          <div class="bg-neutral-300 dark:bg-neutral-600 animate-pulse h-9 w-36 rounded-xl mb-3"></div>
          <div class="flex justify-between">
            <div class="bg-neutral-300 dark:bg-neutral-600 animate-pulse h-3.5 w-24 rounded"></div>
            <div class="bg-neutral-300 dark:bg-neutral-600 animate-pulse h-3.5 w-32 rounded"></div>
          </div>
          <div class="flex justify-between">
            <div class="bg-neutral-300 dark:bg-neutral-600 animate-pulse h-3.5 w-28 rounded"></div>
            <div class="bg-neutral-300 dark:bg-neutral-600 animate-pulse h-3.5 w-20 rounded"></div>
          </div>
        </div>
      </div>

      <div class="mb-6">
        <div class="bg-neutral-300 dark:bg-neutral-600 animate-pulse h-5 w-40 rounded mb-3"></div>
        <div class="bg-neutral-100 dark:bg-neutral-700 rounded-lg p-4 space-y-3">
          <div class="flex justify-between">
            <div class="bg-neutral-300 dark:bg-neutral-600 animate-pulse h-3.5 w-16 rounded"></div>
            <div class="bg-neutral-300 dark:bg-neutral-600 animate-pulse h-3.5 w-36 rounded"></div>
          </div>
          <div class="flex justify-between">
            <div class="bg-neutral-300 dark:bg-neutral-600 animate-pulse h-3.5 w-20 rounded"></div>
            <div class="bg-neutral-300 dark:bg-neutral-600 animate-pulse h-3.5 w-40 rounded"></div>
          </div>
          <div class="flex justify-between">
            <div class="bg-neutral-300 dark:bg-neutral-600 animate-pulse h-3.5 w-16 rounded"></div>
            <div class="bg-neutral-300 dark:bg-neutral-600 animate-pulse h-3.5 w-24 rounded"></div>
          </div>
        </div>
      </div>

      <div class="mb-6">
        <div class="bg-neutral-300 dark:bg-neutral-600 animate-pulse h-5 w-36 rounded mb-3"></div>
        <div class="bg-neutral-100 dark:bg-neutral-700 rounded-lg p-4 space-y-3">
          <div class="flex justify-between">
            <div class="bg-neutral-300 dark:bg-neutral-600 animate-pulse h-3.5 w-20 rounded"></div>
            <div class="bg-neutral-300 dark:bg-neutral-600 animate-pulse h-3.5 w-48 rounded"></div>
          </div>
          <div class="flex justify-between">
            <div class="bg-neutral-300 dark:bg-neutral-600 animate-pulse h-3.5 w-20 rounded"></div>
            <div class="bg-neutral-300 dark:bg-neutral-600 animate-pulse h-3.5 w-28 rounded"></div>
          </div>
          <div class="flex justify-between">
            <div class="bg-neutral-300 dark:bg-neutral-600 animate-pulse h-3.5 w-12 rounded"></div>
            <div class="bg-neutral-300 dark:bg-neutral-600 animate-pulse h-3.5 w-32 rounded"></div>
          </div>
          <div class="flex justify-between">
            <div class="bg-neutral-300 dark:bg-neutral-600 animate-pulse h-3.5 w-24 rounded"></div>
            <div class="bg-neutral-300 dark:bg-neutral-600 animate-pulse h-3.5 w-40 rounded"></div>
          </div>
        </div>
      </div>

      <div class="mb-6">
        <div class="bg-neutral-300 dark:bg-neutral-600 animate-pulse h-5 w-32 rounded mb-3"></div>
        <div class="space-y-4">
          <div class="flex gap-3">
            <div class="bg-neutral-300 dark:bg-neutral-600 animate-pulse w-3 h-3 rounded-full"></div>
            <div class="flex-1">
              <div class="bg-neutral-300 dark:bg-neutral-600 animate-pulse h-3 w-16 rounded mb-2"></div>
              <div class="bg-neutral-300 dark:bg-neutral-600 animate-pulse h-3 w-full rounded"></div>
            </div>
          </div>
          <div class="flex gap-3">
            <div class="bg-neutral-300 dark:bg-neutral-600 animate-pulse w-3 h-3 rounded-full"></div>
            <div class="flex-1">
              <div class="bg-neutral-300 dark:bg-neutral-600 animate-pulse h-3 w-16 rounded mb-2"></div>
              <div class="bg-neutral-300 dark:bg-neutral-600 animate-pulse h-3 w-4/5 rounded"></div>
            </div>
          </div>
          <div class="flex gap-3">
            <div class="bg-neutral-300 dark:bg-neutral-600 animate-pulse w-3 h-3 rounded-full"></div>
            <div class="flex-1">
              <div class="bg-neutral-300 dark:bg-neutral-600 animate-pulse h-3 w-16 rounded mb-2"></div>
              <div class="bg-neutral-300 dark:bg-neutral-600 animate-pulse h-3 w-full rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderIncidentDetails(incident) {
  const colorClasses = {
    red: "bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-300",
    yellow:
      "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-300",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300",
  };

  return `
          <div class="mb-6">
            <div class="bg-[#F6F7F7] rounded-lg p-4 space-y-3 text-sm dark:bg-neutral-700">
              <div class="inline-flex items-center gap-2 ${
                colorClasses[incident.color]
              } px-3 py-2 rounded-lg">
                <i class="uil ${incident.icon} text-lg"></i>
                <span class="text-sm font-medium">${incident.type}</span>
              </div>
              <div class="flex justify-between">
                <p class="text-gray-500 dark:text-gray-300 mb-1">Incident ID</p>
                <p class="font-medium text-gray-800 dark:text-white/90">#${
                  incident.id
                }</p>
              </div>
              <div class="flex justify-between">
                <p class="text-gray-500 mb-1 dark:text-gray-300">Time Reported</p>
                <p class="font-medium text-gray-800 dark:text-white/90">${
                  incident.time
                }</p>
              </div>
            </div>
          </div>

          <div class="mb-6">
            <h3 class="text-sm font-semibold text-[#27C291] dark:text-emerald-600 uppercase tracking-wide mb-3">User Information</h3>
            <div class="bg-[#F6F7F7] rounded-lg p-4 space-y-3 text-sm dark:bg-neutral-700">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-300">Name</span>
                <span class="font-medium text-gray-700 dark:text-white/90">${
                  incident.user.name
                }</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-300">Contact</span>
                <span class="font-medium text-gray-700 dark:text-white/90">${
                  incident.user.contact
                }</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-300">User ID</span>
                <span class="font-medium text-gray-700 dark:text-white/90">${
                  incident.user.id
                }</span>
              </div>
            </div>
          </div>

          <div class="mb-6">
            <h3 class="text-sm font-semibold text-[#27C291] dark:text-emerald-600 uppercase tracking-wide mb-3">Location Details</h3>
            <div class="bg-[#F6F7F7] rounded-lg p-4 space-y-3 text-sm dark:bg-neutral-700">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-300">Address</span>
                <span class="font-medium text-gray-700 text-right dark:text-white/90">${
                  incident.location.address
                }</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-300">Barangay</span>
                <span class="font-medium text-gray-800 dark:text-white/90">${
                  incident.location.barangay
                }</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-300">City</span>
                <span class="font-medium text-gray-800 dark:text-white/90">${
                  incident.location.city
                }</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-300">Coordinates</span>
                <span class="font-medium text-gray-800 text-right dark:text-white/90">${
                  incident.location.coords
                }</span>
              </div>
            </div>
          </div>

          <div class="mb-6">
            <h3 class="text-sm font-semibold text-gray-700 dark:text-white/80 uppercase tracking-wide mb-3">Activity Timeline</h3>
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
                        ? '<div class="w-0.5 h-full bg-neutral-200"></div>'
                        : ""
                    }
                  </div>
                  <div class="flex-1 ${
                    index < incident.timeline.length - 1 ? "pb-4" : ""
                  }">
                    <p class="text-xs font-semibold text-gray-800 mb-1 dark:text-white/90">${
                      item.time
                    }</p>
                    <p class="text-xs text-gray-600 dark:text-gray-300">${
                      item.event
                    }</p>
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

const lightLayer = L.tileLayer(
  "assets/tiles/streets-v2/{z}/{x}/{y}.png",
  {
    attribution:
      '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>',
  }
);

const darkLayer = L.tileLayer(
  "assets/tiles/streets-v2-dark/{z}/{x}/{y}.png",
  {
    attribution:
      '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>',
  }
);

// Add the appropriate layer based on current theme
const currentTheme = document.documentElement.getAttribute("data-theme");
if (currentTheme === "dark") {
  darkLayer.addTo(map);
} else {
  lightLayer.addTo(map);
}

// Function to switch map theme
function switchMapTheme(isDark) {
  if (isDark) {
    map.removeLayer(lightLayer);
    map.addLayer(darkLayer);
  } else {
    map.removeLayer(darkLayer);
    map.addLayer(lightLayer);
  }
  
  // Update heatmaps for theme
  updateHeatmapsForTheme(isDark);
}

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

// Add all markers with staggered animation
setTimeout(() => {
  Object.keys(incidentData).forEach((type, typeIndex) => {
    incidentData[type].forEach((incident, incidentIndex) => {
      setTimeout(() => {
        const marker = L.marker([incident.lat, incident.lng], {
          icon: iconMap[type],
          opacity: 0,
        })
          .addTo(map)
          .bindPopup(
            `<strong>${incident.type}</strong><br>${incident.user.name}`
          );

        // Animate marker appearance
        setTimeout(() => {
          marker.setOpacity(1);
        }, 50);

        marker.on("click", () => {
          incidentContent.innerHTML = renderIncidentDetails(incident);
          if (isRightPanelCollapsed) {
            rightPanelToggle.click();
          }
        });

        markers[type].push(marker);
      }, typeIndex * 300 + incidentIndex * 150);
    });
  });
}, 1000);

// Initialize all heatmaps after markers are loaded
setTimeout(() => {
  initializeHeatmap("fire");
  initializeHeatmap("crime");
  initializeHeatmap("flood");
}, 2000);

// Heatmap toggle button handlers
const heatmapToggleButtons = document.querySelectorAll('[data-heatmap]');
heatmapToggleButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const heatmapType = btn.dataset.heatmap;
    
    btn.classList.toggle('active');
    heatmapVisible[heatmapType] = !heatmapVisible[heatmapType];
    
    if (heatmapVisible[heatmapType]) {
      if (heatmapLayers[heatmapType]) {
        heatmapLayers[heatmapType].addTo(map);
      }
    } else {
      if (heatmapLayers[heatmapType]) {
        map.removeLayer(heatmapLayers[heatmapType]);
      }
    }
  });
});

// Load default incident
incidentContent.innerHTML = renderSkeletonLoading();
setTimeout(() => {
  incidentContent.innerHTML = renderIncidentDetails(incidentData.fire[0]);
}, 1500); // Show skeleton for 1.5 seconds

document.getElementById("zoomIn").addEventListener("click", () => map.zoomIn());
document
  .getElementById("zoomOut")
  .addEventListener("click", () => map.zoomOut());

// Add this at the top with your other variables
let userLocationMarker = null;
let userLocationCircle = null;

// Create a blue dot icon for user location using Tailwind classes
const userLocationIcon = L.divIcon({
  className: "user-location-marker",
  html: `
    <div class="relative w-5 h-5">
      <div class="w-5 h-5 bg-blue-500 border-4 border-white rounded-full shadow-lg"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-blue-500/20 rounded-full animate-ping"></div>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Update the locate button functionality
document.getElementById("locate").addEventListener("click", () => {
  if (navigator.geolocation) {
    showToast('info', 'Getting your location...');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        // Remove existing user location marker and circle
        if (userLocationMarker) {
          map.removeLayer(userLocationMarker);
        }
        if (userLocationCircle) {
          map.removeLayer(userLocationCircle);
        }

        // Add accuracy circle
        userLocationCircle = L.circle([userLat, userLng], {
          color: '#3B82F6',
          fillColor: '#3B82F6',
          fillOpacity: 0.1,
          radius: accuracy,
          weight: 1,
        }).addTo(map);

        // Add user location marker with blue dot
        userLocationMarker = L.marker([userLat, userLng], {
          icon: userLocationIcon,
        })
          .addTo(map)
          .bindPopup(`
            <div class="p-2">
              <div class="font-semibold text-sm text-gray-800 dark:text-white mb-1">Your Location</div>
              <div class="text-xs text-gray-600 dark:text-gray-400">
                Accuracy: ±${Math.round(accuracy)}m
              </div>
            </div>
          `);

        // Center map on user location
        map.setView([userLat, userLng], 16);
        
        showToast('success', 'Location found!');
      },
      (error) => {
        let errorMessage = 'Could not get your location';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        
        showToast('error', errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  } else {
    showToast('error', 'Geolocation is not supported by your browser');
  }
});

// Filter buttons for markers (excluding heatmap buttons)
const filterButtons = document.querySelectorAll("[data-filter]");
filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const filter = btn.dataset.filter;
    // Skip heatmap toggle - it has its own handler
    if (filter === "heatmap") return;

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

// Heatmap menu toggle functionality
const heatmapMenuToggle = document.getElementById('heatmapMenuToggle');
const heatmapControlsContainer = document.getElementById('heatmapControlsContainer');
let isHeatmapMenuOpen = false;

heatmapMenuToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  isHeatmapMenuOpen = !isHeatmapMenuOpen;
  
  // Toggle container visibility
  heatmapControlsContainer.classList.toggle('hidden');
  heatmapControlsContainer.classList.toggle('flex');
  
  // Toggle button active state
  heatmapMenuToggle.classList.toggle('active');
  
  // Change icon
  const icon = heatmapMenuToggle.querySelector('i');
  if (isHeatmapMenuOpen) {
    icon.classList.remove('uil-ellipsis-h');
    icon.classList.add('uil-times');
  } else {
    icon.classList.remove('uil-times');
    icon.classList.add('uil-ellipsis-h');
  }
});

// Close heatmap menu when clicking outside
document.addEventListener('click', (e) => {
  if (isHeatmapMenuOpen && 
      !heatmapMenuToggle.contains(e.target) && 
      !heatmapControlsContainer.contains(e.target)) {
    
    // Close the menu
    isHeatmapMenuOpen = false;
    heatmapControlsContainer.classList.add('hidden');
    heatmapControlsContainer.classList.remove('flex');
    heatmapMenuToggle.classList.remove('active');
    
    // Reset icon
    const icon = heatmapMenuToggle.querySelector('i');
    icon.classList.remove('uil-times');
    icon.classList.add('uil-ellipsis-h');
  }
});

// Prevent clicks inside container from closing it
heatmapControlsContainer.addEventListener('click', (e) => {
  e.stopPropagation();
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
let emergencyChart;
setTimeout(() => {
  const ctx = document.getElementById("emergencyChart").getContext("2d");
  emergencyChart = new Chart(ctx, {
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
          data: chartDataByYear[2024].fire,
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
          data: chartDataByYear[2024].flood,
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
          data: chartDataByYear[2024].crime,
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
      animation: {
        duration: 2000,
        easing: "easeInOutQuart",
      },
      plugins: {
        legend: {
          display: true,
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 10,
            font: {
              size: 13,
            },
          },
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
}, 1100);

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
      opt.classList.remove(
        "active",
        "bg-[#01af78]/10",
        "font-medium",
        "text-emerald-600",
        "dark:text-emerald-700"
      );
    });
    option.classList.add(
      "active",
      "bg-[#01af78]/10",
      "font-medium",
      "text-emerald-600",
      "dark:text-emerald-700"
    );

    // Close dropdown
    yearDropdownMenu.classList.add("hidden");
    yearDropdownIcon.style.transform = "rotate(0deg)";

    // Update chart with data for selected year
    if (chartDataByYear[year]) {
      emergencyChart.data.datasets[0].data = chartDataByYear[year].fire;
      emergencyChart.data.datasets[1].data = chartDataByYear[year].flood;
      emergencyChart.data.datasets[2].data = chartDataByYear[year].crime;
      emergencyChart.update("active");
    }

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

function updateDateTime() {
  const now = new Date();

  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  const dateString = now.toLocaleDateString("en-US", options);
  const timeString = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const dateTimeElement = document.querySelector(".header p");
  if (dateTimeElement) {
    dateTimeElement.textContent = `${dateString}, ${timeString}`;
  }
}

// Update immediately on load
updateDateTime();

// Update every second
setInterval(updateDateTime, 1000);
