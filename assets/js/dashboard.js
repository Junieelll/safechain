// ============================================
// SAFECHAIN DASHBOARD - CONFIGURATION
// ============================================

const API_BASE = "api/";
const POLL_INTERVAL = 3000; // Poll every 3 seconds
let lastUpdateTime = null;
let pollingActive = true;

// Store incident data
let incidentData = {
  fire: [],
  crime: [],
  flood: [],
};

// Historical incidents for heatmap (from database)
let historicalIncidents = {
  fire: [],
  crime: [],
  flood: [],
};

// ============================================
// HEATMAP CONFIGURATION
// ============================================

const heatmapLayers = {
  fire: null,
  crime: null,
  flood: null,
};

const heatmapVisible = {
  fire: true,
  crime: true,
  flood: true,
};

const heatmapConfigs = {
  fire: {
    radius: 30,
    blur: 20,
    maxZoom: 17,
    max: 1.0,
    minOpacity: 0.3,
    gradient: {
      0.0: "rgba(255, 68, 68, 0)",
      0.3: "rgba(255, 68, 68, 0.35)",
      0.5: "rgba(220, 40, 40, 0.55)",
      0.7: "rgba(200, 30, 30, 0.75)",
      0.9: "rgba(170, 20, 20, 0.9)",
      1.0: "rgba(140, 10, 10, 1)",
    },
  },
  crime: {
    radius: 28,
    blur: 18,
    maxZoom: 17,
    max: 1.0,
    minOpacity: 0.3,
    gradient: {
      0.0: "rgba(251, 191, 36, 0)",
      0.3: "rgba(251, 191, 36, 0.35)",
      0.5: "rgba(245, 158, 11, 0.55)",
      0.7: "rgba(217, 119, 6, 0.75)",
      0.9: "rgba(180, 83, 9, 0.9)",
      1.0: "rgba(120, 50, 5, 1)",
    },
  },
  flood: {
    radius: 32,
    blur: 22,
    maxZoom: 17,
    max: 1.0,
    minOpacity: 0.3,
    gradient: {
      0.0: "rgba(59, 130, 246, 0)",
      0.3: "rgba(59, 130, 246, 0.3)",
      0.5: "rgba(37, 99, 235, 0.5)",
      0.7: "rgba(29, 78, 216, 0.7)",
      0.9: "rgba(30, 64, 175, 0.85)",
      1.0: "rgba(23, 37, 84, 1)",
    },
  },
};

// ============================================
// API FUNCTIONS
// ============================================

async function fetchLiveIncidents() {
  try {
    // Always fetch all incidents (no time filter)
    const url = `${API_BASE}get_incidents.php`;

    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      // Update incident data
      incidentData = result.data;

      // Update historical heatmap data from database
      if (result.heatmap) {
        historicalIncidents = result.heatmap;
      }

      lastUpdateTime = result.timestamp;

      // Update UI
      updateMapMarkers();
      updateAllHeatmaps();
      incidentContent.innerHTML = renderEmergencyList();

      // Check for new incidents
      checkForNewIncidents(result.data);

      console.log(`✓ Updated at ${result.timestamp}`, result.count);
    }
  } catch (error) {
    console.error("Failed to fetch incidents:", error);
  }
}

// ============================================
// NOTIFICATION SYSTEM
// ============================================

// Add at the top with other initializations
let notificationAudio = null;
let audioInitialized = false;

// Initialize audio on first user interaction with the page
function initializeAudio() {
  if (!audioInitialized) {
    notificationAudio = new Audio("assets/sounds/alert.mp3");
    notificationAudio.volume = 0.7;
    notificationAudio.load();
    audioInitialized = true;
    console.log("✓ Audio initialized");
  }
}

// Listen for ANY user interaction to enable audio
["click", "keydown", "touchstart"].forEach((event) => {
  document.addEventListener(event, initializeAudio, { once: true });
});

let knownIncidentIds = new Set(
  JSON.parse(localStorage.getItem("knownIncidentIds") || "[]")
);
let isInitialLoad = true; // Flag to track first load

function checkForNewIncidents(data) {
  ["fire", "crime", "flood"].forEach((type) => {
    data[type].forEach((incident) => {
      if (!knownIncidentIds.has(incident.id)) {
        knownIncidentIds.add(incident.id);

        // Save to localStorage
        localStorage.setItem(
          "knownIncidentIds",
          JSON.stringify([...knownIncidentIds])
        );

        // Only show notification if NOT initial load
        if (!isInitialLoad && typeof showToast === "function") {
          const typeColors = {
            fire: "info",
            crime: "info",
            flood: "info",
          };
          showToast(
            typeColors[type],
            `New ${type} incident: ${incident.user.name}`
          );
          playNotificationSound();
        }
      }
    });
  });

  // After first check, mark as no longer initial load
  if (isInitialLoad) {
    isInitialLoad = false;
  }
}

function playNotificationSound() {
  // Initialize audio if not done yet (fallback)
  if (!audioInitialized) {
    initializeAudio();
  }

  if (notificationAudio) {
    notificationAudio.currentTime = 0; // Reset to beginning
    notificationAudio.play().catch((e) => {
      console.warn("Audio autoplay blocked. User interaction needed first.");
    });

    // Stop after 3 seconds
    setTimeout(() => {
      notificationAudio.pause();
      notificationAudio.currentTime = 0; // Reset for next play
    }, 3000);
  }
}

// ============================================
// HEATMAP FUNCTIONS
// ============================================

function generateHeatmapData(type) {
  const heatData = [];

  // Current active incidents (high intensity)
  if (incidentData[type]) {
    incidentData[type].forEach((incident) => {
      const intensity = type === "fire" ? 1.0 : type === "crime" ? 0.8 : 0.7;
      heatData.push([incident.lat, incident.lng, intensity]);
    });
  }

  // Historical incidents from database (varied intensity based on age)
  if (historicalIncidents[type]) {
    historicalIncidents[type].forEach((incident) => {
      heatData.push([incident.lat, incident.lng, incident.intensity]);
    });
  }

  return heatData;
}

function updateAllHeatmaps() {
  ["fire", "crime", "flood"].forEach((type) => {
    // Remove old layer
    if (heatmapLayers[type]) {
      map.removeLayer(heatmapLayers[type]);
    }

    // Add new layer if visible
    if (heatmapVisible[type]) {
      const heatData = generateHeatmapData(type);
      heatmapLayers[type] = L.heatLayer(heatData, heatmapConfigs[type]).addTo(
        map
      );
    }
  });
}

function updateHeatmapsForTheme(isDark) {
  Object.keys(heatmapLayers).forEach((type) => {
    if (heatmapLayers[type] && heatmapVisible[type]) {
      const heatData = generateHeatmapData(type);
      map.removeLayer(heatmapLayers[type]);

      const config = { ...heatmapConfigs[type] };
      if (isDark) {
        config.minOpacity = 0.4;
      }

      heatmapLayers[type] = L.heatLayer(heatData, config).addTo(map);
    }
  });
}

// ============================================
// MAP MARKERS
// ============================================

const markers = { fire: [], crime: [], flood: [] };

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

const iconMap = {
  fire: fireIcon,
  crime: crimeIcon,
  flood: floodIcon,
};

function updateMapMarkers() {
  // Clear existing markers
  Object.keys(markers).forEach((type) => {
    markers[type].forEach((marker) => map.removeLayer(marker));
    markers[type] = [];
  });

  // Add new markers
  Object.keys(incidentData).forEach((type) => {
    incidentData[type].forEach((incident) => {
      const marker = L.marker([incident.lat, incident.lng], {
        icon: iconMap[type],
      }).addTo(map).bindPopup(`
          <div class="p-2">
            <strong class="text-sm">${incident.type}</strong><br>
            <span class="text-xs">${incident.user.name}</span><br>
            <span class="text-xs text-gray-600">${incident.time}</span>
          </div>
        `);

      marker.on("click", () => {
        if (
          typeof incidentContent !== "undefined" &&
          typeof renderIncidentDetails === "function"
        ) {
          incidentContent.innerHTML = renderIncidentDetails(incident);
          if (isRightPanelCollapsed) {
            rightPanelToggle.click();
          }
        }
      });

      markers[type].push(marker);
    });
  });
}

// ============================================
// POLLING
// ============================================

function startPolling() {
  pollingActive = true;
  fetchLiveIncidents(); // Initial fetch

  setInterval(() => {
    if (pollingActive) {
      fetchLiveIncidents();
    }
  }, POLL_INTERVAL);
}

// Pause polling when page hidden (saves resources)
// document.addEventListener('visibilitychange', () => {
//   pollingActive = !document.hidden;
//   if (pollingActive) {
//     fetchLiveIncidents();
//   }
// });

// ============================================
// INITIALIZE
// ============================================

// Start polling when page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startPolling);
} else {
  startPolling();
}

console.log(
  "SafeChain Dashboard initialized - Polling every " +
    POLL_INTERVAL / 1000 +
    " seconds"
);

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

function renderEmergencyList() {
  // Collect all incidents into a single array
  const allIncidents = [];

  ["fire", "crime", "flood"].forEach((type) => {
    if (incidentData[type] && incidentData[type].length > 0) {
      allIncidents.push(...incidentData[type]);
    }
  });

  // Sort by time (newest first)
  allIncidents.sort((a, b) => new Date(b.time) - new Date(a.time));

  // If no incidents
  if (allIncidents.length === 0) {
    return `
      <div class="flex flex-col items-center justify-center h-full text-center p-6">
        <i class="uil uil-inbox text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
        <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Active Emergencies</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">There are currently no active incidents to display.</p>
      </div>
    `;
  }

  const colorClasses = {
    red: "bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-300",
    yellow:
      "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-300",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300",
  };

  const statusColors = {
    pending:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
    responding:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    resolved:
      "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  };

  return `
    <div class="space-y-4">
      ${allIncidents
        .map(
          (incident) => `
        <div class="bg-[#FFFFFF] border border-neutral-300 rounded-2xl p-4 space-y-3 text-sm dark:bg-neutral-700">
          <!-- Emergency Type Badge -->
          <div class="inline-flex items-center gap-2 ${
            colorClasses[incident.color]
          } px-3 py-2 rounded-lg">
            <i class="uil ${incident.icon} text-lg"></i>
            <span class="text-sm font-medium">${incident.type}</span>
          </div>

          <!-- Status -->
          <div class="flex justify-between items-center">
            <p class="text-gray-500 dark:text-gray-300 text-xs">Emergency Status</p>
            <span class="text-xs px-2 py-1 rounded-full font-medium ${
              statusColors[incident.status] || statusColors.pending
            }">
              ${
                incident.status
                  ? incident.status.charAt(0).toUpperCase() +
                    incident.status.slice(1)
                  : "Pending"
              }
            </span>
          </div>

          <!-- Time Reported -->
          <div class="flex justify-between">
            <p class="text-gray-500 dark:text-gray-300 text-xs">Time Reported</p>
            <p class="font-medium text-gray-800 dark:text-white/90 text-xs">${
              incident.time
            }</p>
          </div>

          <!-- Reporter Name -->
          <div class="flex justify-between">
            <p class="text-gray-500 dark:text-gray-300 text-xs">Reporter</p>
            <p class="font-medium text-gray-800 dark:text-white/90 text-xs">${
              incident.user.name
            }</p>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
            <button 
              onclick="viewIncidentDetails('${incident.id}')" 
              class="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium py-2.5 px-3 rounded-xl transition">
              <i class="uil uil-eye"></i> View Details
            </button>
            <button 
              onclick="notifyResponders('${incident.id}')" 
              class="flex-1 bg-transparent hover:bg-emerald-200/50 border border-emerald-400 dark:border-emerald-600 text-emerald-500 text-xs font-medium py-2.5 px-3 rounded-xl transition">
              <i class="uil uil-bell"></i> Notify Responders
            </button>
          </div>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

function viewIncidentDetails(incidentId) {
  window.location.href = `admin/incidents/details?id=${encodeURIComponent(incidentId)}`;
}

function notifyResponders(incidentId) {
  // TODO: Implement notification logic
  showToast("info", "Notify Responders feature coming soon...");
  console.log("Notify responders for incident:", incidentId);
}

const rightPanel = document.getElementById("rightPanel");
const rightPanelToggle = document.getElementById("rightPanelToggle");
const incidentContent = document.getElementById("incidentContent");
let isRightPanelCollapsed = false;

var map = L.map("map").setView([14.7158532, 121.0403842], 16);

const lightLayer = L.tileLayer("assets/tiles/streets-v2/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>',
});

const darkLayer = L.tileLayer("assets/tiles/streets-v2-dark/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>',
});

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
          // Zoom to marker location
          map.setView([incident.lat, incident.lng], 17);

          // Open marker popup
          marker.openPopup();
        });

        markers[type].push(marker);
      }, typeIndex * 300 + incidentIndex * 150);
    });
  });
}, 1000);

// Heatmap toggle button handlers
const heatmapToggleButtons = document.querySelectorAll("[data-heatmap]");
heatmapToggleButtons.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const heatmapType = btn.dataset.heatmap;

    btn.classList.toggle("active");
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

// Load emergency list
incidentContent.innerHTML = renderSkeletonLoading();
setTimeout(() => {
  incidentContent.innerHTML = renderEmergencyList();
  
  // Make sure panel is always visible
  if (isRightPanelCollapsed) {
    rightPanelToggle.click();
  }
}, 1500);

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
    showToast("info", "Getting your location...");

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
          color: "#3B82F6",
          fillColor: "#3B82F6",
          fillOpacity: 0.1,
          radius: accuracy,
          weight: 1,
        }).addTo(map);

        // Add user location marker with blue dot
        userLocationMarker = L.marker([userLat, userLng], {
          icon: userLocationIcon,
        }).addTo(map).bindPopup(`
            <div class="p-2">
              <div class="font-semibold text-sm text-gray-800 dark:text-white mb-1">Your Location</div>
              <div class="text-xs text-gray-600 dark:text-gray-400">
                Accuracy: ±${Math.round(accuracy)}m
              </div>
            </div>
          `);

        // Center map on user location
        map.setView([userLat, userLng], 16);

        showToast("success", "Location found!");
      },
      (error) => {
        let errorMessage = "Could not get your location";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }

        showToast("error", errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  } else {
    showToast("error", "Geolocation is not supported by your browser");
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
const heatmapMenuToggle = document.getElementById("heatmapMenuToggle");
const heatmapControlsContainer = document.getElementById(
  "heatmapControlsContainer"
);
let isHeatmapMenuOpen = false;

heatmapMenuToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  isHeatmapMenuOpen = !isHeatmapMenuOpen;

  // Toggle container visibility
  heatmapControlsContainer.classList.toggle("hidden");
  heatmapControlsContainer.classList.toggle("flex");

  // Toggle button active state
  heatmapMenuToggle.classList.toggle("active");

  // Change icon
  const icon = heatmapMenuToggle.querySelector("i");
  if (isHeatmapMenuOpen) {
    icon.classList.remove("uil-ellipsis-h");
    icon.classList.add("uil-times");
  } else {
    icon.classList.remove("uil-times");
    icon.classList.add("uil-ellipsis-h");
  }
});

// Close heatmap menu when clicking outside
document.addEventListener("click", (e) => {
  if (
    isHeatmapMenuOpen &&
    !heatmapMenuToggle.contains(e.target) &&
    !heatmapControlsContainer.contains(e.target)
  ) {
    // Close the menu
    isHeatmapMenuOpen = false;
    heatmapControlsContainer.classList.add("hidden");
    heatmapControlsContainer.classList.remove("flex");
    heatmapMenuToggle.classList.remove("active");

    // Reset icon
    const icon = heatmapMenuToggle.querySelector("i");
    icon.classList.remove("uil-times");
    icon.classList.add("uil-ellipsis-h");
  }
});

// Prevent clicks inside container from closing it
heatmapControlsContainer.addEventListener("click", (e) => {
  e.stopPropagation();
});

// rightPanelToggle.addEventListener("click", () => {
//   isRightPanelCollapsed = !isRightPanelCollapsed;

//   if (isRightPanelCollapsed) {
//     rightPanel.style.transform = "translateX(100%)";
//     mainContent.classList.remove("mr-[360px]");
//     mainContent.classList.add("mr-0");
//   } else {
//     rightPanel.style.transform = "translateX(0)";
//     mainContent.classList.remove("mr-0");
//     mainContent.classList.add("mr-[360px]");
//   }

//   const icon = rightPanelToggle.querySelector("i");
//   icon.classList.toggle("uil-angle-right", !isRightPanelCollapsed);
//   icon.classList.toggle("uil-angle-left", isRightPanelCollapsed);

//   setTimeout(() => map.invalidateSize(), 300);
// });

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
            pointStyle: "circle",
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
