// ============================================
// SAFECHAIN DASHBOARD - CONFIGURATION
// ============================================

// Tell sidebar.js to back off — dashboard owns notifications on this page
window.__dashboardActive = true;

const API_BASE = "api/dashboard/";
// POLL_INTERVAL is declared in sidebar.js — reuse it here
const DASH_POLL_INTERVAL = window.POLL_INTERVAL || 3000;
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
    radius: 28, // Smaller radius for precise location
    blur: 20, // Smoother edges
    maxZoom: 15, // Helps intensity scale naturally when zooming
    max: 2.0, // Requires overlapping points to reach full intensity
    minOpacity: 0.3,
    gradient: {
      0.2: "rgba(255, 255, 0, 0.4)", // Outer: Yellow
      0.5: "rgba(255, 128, 0, 0.7)", // Mid: Orange
      0.8: "rgba(220, 38, 38, 0.9)", // Core: Red
      1.0: "rgba(100, 0, 0, 1.0)", // Extreme: Dark Red
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

// ============================================
// GEOFENCE FILTER
// ============================================

let geofenceEnabled = false;

function isInsideGulod(lat, lng) {
  const coords = gulodBoundary.geometry.coordinates[0];
  let inside = false;
  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const xi = coords[i][0], yi = coords[i][1];
    const xj = coords[j][0], yj = coords[j][1];
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function applyGeofenceUI() {
  const track  = document.getElementById('geofenceToggleTrack');
  const thumb  = document.getElementById('geofenceToggleThumb');
  const status = document.getElementById('geofenceStatus');
  if (!track) return;

  if (geofenceEnabled) {
    track.style.background = '#27C291';
    thumb.style.transform = 'translateX(18px)';
    status.textContent = 'On — Receive incidents on Brgy. Gulod only';
    if (typeof gulodBoundaryLayer !== 'undefined') gulodBoundaryLayer.addTo(map);
  } else {
    track.style.background = '';
    thumb.style.transform = 'translateX(0)';
    status.textContent = 'Off — Receive incidents on all areas';
    if (typeof gulodBoundaryLayer !== 'undefined' && map.hasLayer(gulodBoundaryLayer))
      map.removeLayer(gulodBoundaryLayer);
  }
}

async function loadGeofenceState() {
  try {
    const res = await fetch('api/settings/get.php?key=geofence_enabled');
    const data = await res.json();
    if (data.success) {
      geofenceEnabled = data.data.value === '1';  // ← was data.value
      applyGeofenceUI();
    }
  } catch (_) {}
}

async function toggleGeofence() {
  geofenceEnabled = !geofenceEnabled;
  applyGeofenceUI();

  try {
    await fetch('api/settings/toggle_geofence.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: geofenceEnabled }),
    });
  } catch (_) {
    showToast('error', 'Failed to save geofence setting');
  }

  updateMapMarkers();
  incidentContent.innerHTML = renderEmergencyList();
}

function applyGeofenceFilter(incidents) {
  if (!geofenceEnabled) return incidents;
  return incidents.filter(i =>
    i.lat && i.lng && isInsideGulod(parseFloat(i.lat), parseFloat(i.lng))
  );
}


async function fetchLiveIncidents() {
  try {
    const response = await fetch(`${API_BASE}get_incidents.php`);
    const result = await response.json();

    if (result.success) {
      const newCount = result.count.total;
      const prevCount = (incidentData.all || []).length;

      // ── Also check if any corroborator counts changed ──────
      const prevCorroSum = (incidentData.all || []).reduce(
        (sum, i) => sum + (i.confidence?.score ?? 1),
        0,
      );
      const newCorroSum = (result.all_incidents || []).reduce(
        (sum, i) => sum + (i.confidence?.score ?? 1),
        0,
      );

      // ── Also track rescue count changes ───────────────────
      const prevRescueSum = (incidentData.all || []).reduce(
        (sum, i) => sum + (i.rescue?.count ?? 0),
        0,
      );
      const newRescueSum = (result.all_incidents || []).reduce(
        (sum, i) => sum + (i.rescue?.count ?? 0),
        0,
      );

      // Update data FIRST
      incidentData = result.data;
      if (result.all_incidents) incidentData.all = result.all_incidents;
      if (result.heatmap) historicalIncidents = result.heatmap;
      lastUpdateTime = result.timestamp;

      const activeIds = new Set((result.all_incidents || []).map((i) => i.id));
      knownIncidentIds.forEach((id) => {
        if (!activeIds.has(id)) knownIncidentIds.delete(id);
      });
      localStorage.setItem(
        "knownIncidentIds",
        JSON.stringify([...knownIncidentIds]),
      );

      // Rebuild markers if count, corroborations, OR rescue status changed
      if (newCount !== prevCount || newCorroSum !== prevCorroSum || newRescueSum !== prevRescueSum) {
        updateMapMarkers();
      }

      updateAllHeatmaps();
      incidentContent.innerHTML = renderEmergencyList();

      // Check for new incidents and notify
      // Audio is handled by sidebar.js (playNotificationSound is available globally)
      ["fire", "crime", "flood"].forEach((type) => {
        if (result.data[type] && Array.isArray(result.data[type])) {
          result.data[type].forEach((incident) => {
            if (!knownIncidentIds.has(incident.id)) {
              knownIncidentIds.add(incident.id);
              localStorage.setItem(
                "knownIncidentIds",
                JSON.stringify([...knownIncidentIds]),
              );

              if (!isInitialLoad && typeof showToast === "function") {
                showToast(
                  "info",
                  `New ${type} incident: ${incident.user.name}`,
                );
                // playNotificationSound() lives in sidebar.js, available globally
                if (typeof playNotificationSound === "function") {
                  playNotificationSound();
                }
              }
            }
          });
        }
      });

      if (isInitialLoad) isInitialLoad = false;

      console.log(`✓ Updated at ${result.timestamp}`, result.count);
    }
  } catch (error) {
    console.error("Failed to fetch incidents:", error);
  }
}

// ============================================
// HEATMAP FUNCTIONS
// ============================================

function generateHeatmapData(type) {
  const heatData = [];

  // Your PHP file already pulls both active and historical incidents
  // into the 'heatmap' array and calculates the perfect intensity weight
  // based on severity level and age decay. We just need to plot it.

  if (historicalIncidents[type]) {
    historicalIncidents[type].forEach((incident) => {
      if (incident.lat && incident.lng && incident.intensity) {
        // Leaflet.heat accepts format: [lat, lng, intensity]
        heatData.push([incident.lat, incident.lng, incident.intensity]);
      }
    });
  }

  return heatData;
}

// ============================================
// DYNAMIC HEATMAP RENDERING
// ============================================

function updateAllHeatmaps() {
  const currentZoom = map.getZoom();
  const dynamicRadius = Math.min(50, Math.max(10, (currentZoom - 12) * 8));
  const dynamicBlur = Math.min(35, Math.max(10, dynamicRadius - 5));

  // Higher max at low zoom prevents saturation on dense clusters
  const dynamicMax = currentZoom >= 17 ? 1.5 : currentZoom >= 15 ? 2.5 : 4.0;

  ["fire", "crime", "flood"].forEach((type) => {
    if (heatmapLayers[type]) map.removeLayer(heatmapLayers[type]);
    if (heatmapVisible[type]) {
      const heatData = generateHeatmapData(type);
      const config = {
        ...heatmapConfigs[type],
        radius: dynamicRadius,
        blur: dynamicBlur,
        max: dynamicMax,
      };
      heatmapLayers[type] = L.heatLayer(heatData, config).addTo(map);
    }
  });
}

function updateHeatmapsForTheme(isDark) {
  const currentZoom = map.getZoom();
  const dynamicRadius = Math.max(10, (currentZoom - 12) * 8);
  const dynamicBlur = Math.max(10, dynamicRadius - 5);

  Object.keys(heatmapLayers).forEach((type) => {
    if (heatmapLayers[type] && heatmapVisible[type]) {
      const heatData = generateHeatmapData(type);
      map.removeLayer(heatmapLayers[type]);

      const config = {
        ...heatmapConfigs[type],
        radius: dynamicRadius,
        blur: dynamicBlur,
      };

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

const markerFiltersActive = {
  fire: true,
  crime: true,
  flood: true,
};

const coverageCircles = { fire: [], crime: [], flood: [] };

function updateMapMarkers() {
  // Clear existing markers AND coverage circles
  Object.keys(markers).forEach((type) => {
    markers[type].forEach((m) => map.removeLayer(m));
    markers[type] = [];
    coverageCircles[type].forEach((c) => map.removeLayer(c));
    coverageCircles[type] = [];
  });

  let incidentsToProcess = { fire: [], crime: [], flood: [] };

  if (incidentData.all && Array.isArray(incidentData.all)) {
    incidentData.all.forEach((incident) => {
      const t = incident.type.toLowerCase();
      if (t.includes("fire")) incidentsToProcess.fire.push(incident);
      else if (t.includes("crime")) incidentsToProcess.crime.push(incident);
      else if (t.includes("flood")) incidentsToProcess.flood.push(incident);
    });
  } else {
    incidentsToProcess = incidentData;
  }

  const circleColors = {
    fire: "#dc2626",
    crime: "#FBBF24",
    flood: "#3B82F6",
  };

  Object.keys(incidentsToProcess).forEach((type) => {
    if (!incidentsToProcess[type] || !Array.isArray(incidentsToProcess[type]))
      return;

    incidentsToProcess[type].forEach((incident) => {
      if (
        !incident.lat ||
        !incident.lng ||
        (incident.lat === 0 && incident.lng === 0)
      )
        return;

      const marker = L.marker([incident.lat, incident.lng], {
        icon: iconMap[type],
      });

      if (markerFiltersActive[type]) marker.addTo(map);

      marker.bindPopup(`
                <div class="p-2">
                    <strong class="text-sm">${incident.type}</strong><br>
                    <span class="text-xs">${incident.user.name}</span><br>
                    <span class="text-xs text-gray-600">${incident.time}</span>
                    ${
                      incident.confidence?.score > 1
                        ? `<br><span class="text-xs font-semibold">${incident.confidence.score} reports</span>`
                        : ""
                    }
                </div>
            `);

      marker.on("click", () => {
        if (
          typeof incidentContent !== "undefined" &&
          typeof renderIncidentDetails === "function"
        ) {
          incidentContent.innerHTML = renderIncidentDetails(incident);
          if (isRightPanelCollapsed) rightPanelToggle.click();
        }
      });

      markers[type].push(marker);

      // ── Coverage circle — realistic neighborhood scale ──────
      const hasRescue = incident.rescue?.count > 0;
      const color = circleColors[type];

      // Circle is always centered on the original reporter's location.
      // Corroborator points only influence the radius (how wide the
      // affected area is), not the center — so the circle doesn't drift.
      const circleCenter = [incident.lat, incident.lng];

      const reporterPoints = [[incident.lat, incident.lng]];

      (incident.corroborator_locations || [])
        .filter((c) => c.lat && c.lng && c.lat != 0 && c.lng != 0)
        .forEach((c) =>
          reporterPoints.push([parseFloat(c.lat), parseFloat(c.lng)]),
        );

      // ── Corroborator markers ──────────────────────────────────
      const corroIcon = L.divIcon({
        className: "",
        html: `<div style="
    width:28px; height:28px;
    background: rgba(255,255,255,0.9);
    border: 2.5px solid ${circleColors[type]};
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 6px rgba(0,0,0,0.25);
  ">
    <i class="uil uil-user" style="color:${circleColors[type]}; font-size:13px;"></i>
  </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      // Fix: filter zero/null coords before placing corroborator markers
      (incident.corroborator_locations || [])
        .filter((c) => c.lat && c.lng && c.lat != 0 && c.lng != 0)
        .forEach((corro) => {
          const corroMarker = L.marker([corro.lat, corro.lng], {
            icon: corroIcon,
          });

          corroMarker.bindPopup(`
    <div class="p-2">
      <strong class="text-xs">Corroborator</strong><br>
      <span class="text-xs">${corro.name}</span><br>
      <span class="text-xs text-gray-500">${incident.type}</span>
    </div>
  `);

          if (markerFiltersActive[type]) corroMarker.addTo(map);
          markers[type].push(corroMarker); // tracked so filters/clear still work
        });

      const maxDistMeters = Math.max(
        ...reporterPoints.map((p) => {
          const R = 6371000;
          const dLat = ((p[0] - circleCenter[0]) * Math.PI) / 180;
          const dLng = ((p[1] - circleCenter[1]) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((circleCenter[0] * Math.PI) / 180) *
              Math.cos((p[0] * Math.PI) / 180) *
              Math.sin(dLng / 2) ** 2;
          return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        }),
      );

      // Min radius matches receive_incident.php proximity thresholds.
      // Max radius caps the circle so it never balloons beyond the
      // grouping window even if corroborators are at the edge of it.
      const circleSizing = {
        fire:  { minRadius: 50,  maxRadius: 150 },
        crime: { minRadius: 30,  maxRadius: 80  },
        flood: { minRadius: 100, maxRadius: 300 },
      };
      const { minRadius, maxRadius } = circleSizing[type] || {
        minRadius: 50,
        maxRadius: 150,
      };
      const radius = Math.min(maxRadius, Math.max(minRadius, maxDistMeters + 10));

      const circle = L.circle(circleCenter, {
        color: hasRescue ? "#ef4444" : color,
        fillColor: hasRescue ? "#ef4444" : color,
        fillOpacity: hasRescue ? 0.25 : type === "crime" ? 0.08 : 0.15, // ← dimmer for crime
        opacity: hasRescue ? 0.7 : type === "crime" ? 0.35 : 0.5, // ← thinner border
        radius,
        dashArray: hasRescue ? "6, 4" : null,
        weight: hasRescue ? 2 : 1.5,
      });

      if (markerFiltersActive[type]) circle.addTo(map);
      coverageCircles[type].push(circle);
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
  }, DASH_POLL_INTERVAL);
}

// ============================================
// INITIALIZE POLLING
// ============================================

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => { startPolling(); loadGeofenceState(); });
} else {
  startPolling();
  loadGeofenceState();
}

// ============================================
// RENDER FUNCTIONS
// ============================================

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
  let allIncidents;

  if (incidentData.all && Array.isArray(incidentData.all)) {
    allIncidents = incidentData.all;
  } else {
    allIncidents = ["fire", "crime", "flood"].flatMap(
      (type) => incidentData[type] || [],
    );
    allIncidents.sort((a, b) => {
      const dateA = new Date(a.datetime || a.time);
      const dateB = new Date(b.datetime || b.time);
      return dateB - dateA;
    });
  }

  // Geofence only blocks receiving new incidents (handled server-side).
  // All saved incidents are always shown on map and list.

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

  // Confidence badge styles
  const confidenceStyles = {
    critical:
      "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-300",
    high: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-300",
    moderate:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-300",
    low: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border border-gray-300",
  };

  const confidenceIcons = {
    critical: "uil-fire",
    high: "uil-exclamation-triangle",
    moderate: "uil-users-alt",
    low: "uil-user",
  };
  return `
    <div class="space-y-4">
      ${allIncidents
        .map((incident) => {
          const confidence = incident.confidence || {
            score: 1,
            label: "Unverified",
            color: "low",
          };
          const rescue = incident.rescue || { count: 0, names: [] };
          const hasRescue = rescue.count > 0;
          const isHighConfidence = confidence.score >= 3;

          const cardClass = hasRescue
            ? "bg-red-50 dark:bg-red-950/30 border-2 border-red-500 dark:border-red-600 shadow-lg shadow-red-100 dark:shadow-red-900/30"
            : isHighConfidence
              ? "bg-white dark:bg-neutral-700 border-2 border-orange-400 dark:border-orange-600"
              : "bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-700";

          // Rescue banner — shown at the very top of the card if anyone needs rescue
          const rescueBanner = hasRescue
            ? `
  <div class="flex items-center gap-2 bg-red-500 text-white rounded-xl px-3 py-2">
    <i class="uil uil-ambulance text-lg shrink-0 animate-bounce"></i>
    <div class="flex-1 min-w-0">
      <p class="text-xs font-bold tracking-wide uppercase"> Rescue Needed</p>
      <p class="text-xs text-red-100">Still on scene — re-triggered device</p>
    </div>
    <span class="shrink-0 bg-white text-red-600 text-xs font-black px-2 py-0.5 rounded-full">
      ${rescue.count}
    </span>
  </div>
`
            : "";

          const confidenceBadge = hasRescue
            ? `
  <div class="flex items-center gap-1.5 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-400 px-2 py-1 rounded-lg text-xs font-bold">
    <i class="uil uil-redo text-sm"></i>
    <span>SOS</span>
  </div>
`
            : `
  <div class="flex items-center gap-1.5 ${confidenceStyles[confidence.color]} px-2 py-1 rounded-lg text-xs font-medium">
    <i class="uil ${confidenceIcons[confidence.color]} text-sm"></i>
    <span>${confidence.score} report${confidence.score > 1 ? "s" : ""}</span>
  </div>
`;

          return `
  <div onclick="focusIncidentOnMap('${incident.id}', ${incident.lat}, ${incident.lng}, '${incident.type}')"
    class="${cardClass} rounded-2xl p-4 space-y-3 text-sm cursor-pointer hover:shadow-lg transition-all duration-200">

    ${rescueBanner}

    <div class="flex items-start justify-between gap-2">
      <div class="inline-flex items-center gap-2 ${colorClasses[incident.color]} px-3 py-2 rounded-lg">
        <i class="uil ${incident.icon} text-lg"></i>
        <span class="text-sm font-medium">${incident.type}</span>
      </div>
      ${confidenceBadge}
    </div>

    <div class="flex justify-between items-center">
      <p class="text-gray-500 dark:text-gray-300 text-xs">Emergency Status</p>
      <span class="text-xs px-2 py-1 rounded-full font-medium ${statusColors[incident.status] || statusColors.pending}">
        ${incident.status ? incident.status.charAt(0).toUpperCase() + incident.status.slice(1) : "Pending"}
      </span>
    </div>

    <div class="flex justify-between">
      <p class="text-gray-500 dark:text-gray-300 text-xs">Time Reported</p>
      <p class="font-medium text-gray-800 dark:text-white/90 text-xs">${incident.time}</p>
    </div>

    <div class="flex justify-between">
      <p class="text-gray-500 dark:text-gray-300 text-xs">Reporter</p>
      <p class="font-medium text-gray-800 dark:text-white/90 text-xs">${incident.user.name}</p>
    </div>

    <div class="flex flex-col gap-2 mt-3 pt-3 border-t ${hasRescue ? "border-red-200 dark:border-red-800" : "border-gray-200 dark:border-gray-600"}">
  <button
    onclick="event.stopPropagation(); viewIncidentDetails('${incident.id}')"
    class="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium py-2.5 px-3 rounded-xl transition">
    <i class="uil uil-eye"></i> View Details
  </button>
</div>
  </div>
`;
        })
        .join("")}
    </div>
  `;
}

// ============================================
// MAP & PANEL SETUP
// ============================================

function focusIncidentOnMap(incidentId, lat, lng, type) {
  let markerType = null;
  const lowerType = type.toLowerCase();

  if (lowerType.includes("fire")) markerType = "fire";
  else if (lowerType.includes("crime")) markerType = "crime";
  else if (lowerType.includes("flood")) markerType = "flood";

  map.setView([lat, lng], 17, { animate: true, duration: 1.0 });

  setTimeout(() => {
    const incidentMarkers = markers[markerType];
    if (incidentMarkers && incidentMarkers.length > 0) {
      incidentMarkers.forEach((marker) => {
        const markerLatLng = marker.getLatLng();
        if (
          Math.abs(markerLatLng.lat - lat) < 0.00001 &&
          Math.abs(markerLatLng.lng - lng) < 0.00001
        ) {
          marker.openPopup();
        }
      });
    }
  }, 1000);
}

function viewIncidentDetails(incidentId) {
  window.location.href = `incidents/details?id=${encodeURIComponent(incidentId)}`;
}

const rightPanel = document.getElementById("rightPanel");
const rightPanelToggle = document.getElementById("rightPanelToggle");
const incidentContent = document.getElementById("incidentContent");
let isRightPanelCollapsed = false;

var map = L.map("map", { maxZoom: 21 }).setView([14.7158532, 121.0403842], 16);

const gulodBoundary = {"type":"Feature","properties":{"name":"Gulod"},"geometry":{"type":"Polygon","coordinates":[[[121.0334848,14.711682],[121.0334957,14.7115454],[121.0335308,14.7114846],[121.0335862,14.7114333],[121.0337882,14.7112641],[121.0339523,14.7111092],[121.0340751,14.7109148],[121.0341028,14.7108099],[121.0340604,14.7106753],[121.0339774,14.7105621],[121.0338543,14.7105114],[121.0336751,14.7104859],[121.0335323,14.710492],[121.033562,14.7101886],[121.0338342,14.709774],[121.0339713,14.7095436],[121.0345597,14.7094757],[121.0350814,14.7094277],[121.0362553,14.7093446],[121.0363582,14.7092669],[121.0364442,14.709162],[121.0366244,14.7089794],[121.036688,14.7089056],[121.03699,14.7091458],[121.0372903,14.7091637],[121.0375888,14.709336],[121.0382147,14.7094565],[121.0384845,14.709263],[121.03848,14.7091378],[121.0384375,14.7090308],[121.0387608,14.708583],[121.0387662,14.7084187],[121.0389081,14.7083563],[121.0396347,14.7080226],[121.0400809,14.7080861],[121.0401844,14.7080705],[121.0415248,14.7075016],[121.0415217,14.7066561],[121.0418078,14.7058151],[121.0419812,14.7052453],[121.0440479,14.7052824],[121.0454888,14.7052707],[121.0455003,14.704594],[121.0468975,14.7050443],[121.0474573,14.7053168],[121.0472436,14.7061441],[121.0472437,14.7061633],[121.0471759,14.7063696],[121.047172,14.7070541],[121.0468812,14.7074933],[121.0468267,14.7079836],[121.0467387,14.7084147],[121.0466027,14.7087975],[121.0465728,14.7088616],[121.0465237,14.708988],[121.0465472,14.7090729],[121.0466418,14.7091216],[121.0467319,14.7091885],[121.0467944,14.7093433],[121.0467645,14.709431],[121.0466762,14.7095276],[121.0464922,14.709637],[121.0459681,14.7097706],[121.0459465,14.7098262],[121.0459745,14.7099749],[121.0459659,14.7100253],[121.0460252,14.7100798],[121.045984,14.7102054],[121.0460574,14.7104115],[121.046219,14.7105981],[121.046361,14.7107014],[121.0467486,14.7109051],[121.0469001,14.7110597],[121.0470558,14.7112651],[121.0470603,14.7113701],[121.0468657,14.7118121],[121.04668,14.7120473],[121.0463628,14.7122458],[121.0461321,14.7125295],[121.0459071,14.712751],[121.04565,14.7128774],[121.0452638,14.7129189],[121.0449875,14.7128681],[121.0446371,14.7126643],[121.0444294,14.7125356],[121.0441094,14.7122657],[121.0436705,14.7119655],[121.0434184,14.7119718],[121.0432508,14.7120946],[121.0431034,14.7122324],[121.0429966,14.7123962],[121.0429383,14.7125755],[121.0429079,14.7127791],[121.0429966,14.7130402],[121.0431543,14.7133731],[121.0432095,14.7135],[121.0432103,14.7136163],[121.0430658,14.7139198],[121.0428879,14.7146356],[121.0428612,14.7148887],[121.0429258,14.7150544],[121.0430697,14.7151967],[121.0434241,14.7154815],[121.0438905,14.7157166],[121.0442338,14.7158245],[121.0443492,14.7159932],[121.0443099,14.7161024],[121.0441341,14.7162898],[121.0440041,14.7165224],[121.0438154,14.7173538],[121.0437188,14.717601],[121.0436498,14.7178396],[121.0434931,14.7184845],[121.0434293,14.7185908],[121.0433855,14.7186606],[121.0433491,14.718696],[121.0432445,14.7187068],[121.0430669,14.7186606],[121.0427013,14.7184907],[121.042527,14.7184298],[121.0421883,14.7183594],[121.0420877,14.7183753],[121.0418588,14.7185368],[121.0416664,14.7186873],[121.0414534,14.7188422],[121.0411207,14.7190733],[121.0409713,14.7190759],[121.0404672,14.7188598],[121.0401682,14.7187086],[121.039773,14.7184233],[121.0391703,14.7176617],[121.0390905,14.7175646],[121.0389286,14.7174147],[121.0388499,14.7173238],[121.0387788,14.7172294],[121.0387494,14.7171469],[121.0387334,14.7170159],[121.0387279,14.7168797],[121.0387239,14.7167954],[121.0386924,14.7167398],[121.0386199,14.7166645],[121.0383958,14.7164802],[121.0374912,14.7159739],[121.0374116,14.7159302],[121.0373821,14.7159069],[121.0373667,14.7158693],[121.0373533,14.7158368],[121.0373462,14.7157973],[121.0373377,14.7157255],[121.0373544,14.715513],[121.0373727,14.7153563],[121.0373694,14.7152856],[121.0373586,14.7152214],[121.0373378,14.7151652],[121.0372433,14.71503],[121.0370918,14.7148582],[121.0369087,14.7146629],[121.0368524,14.7146156],[121.0368115,14.7145884],[121.0367752,14.7145735],[121.0367116,14.7145637],[121.0366505,14.7145624],[121.0365533,14.7145683],[121.0361651,14.714615],[121.0357641,14.7146798],[121.0351744,14.7147687],[121.0351244,14.7147602],[121.0350697,14.7147391],[121.035004,14.7146952],[121.0348887,14.7145509],[121.0344099,14.7140667],[121.0342536,14.7138862],[121.0341839,14.7136913],[121.0341969,14.7135132],[121.0342312,14.7133827],[121.0342965,14.7132461],[121.0344816,14.7130565],[121.0345607,14.7129008],[121.0345812,14.7127621],[121.0345279,14.712633],[121.0341479,14.7122626],[121.0339345,14.712102],[121.0335527,14.7118143],[121.0334848,14.711682]]]}};

const gulodBoundaryLayer = L.geoJSON(gulodBoundary, {
  style: {
    color: "#1c7b5d",
    weight: 2,
    opacity: 0.8,
    fillColor: "#27C291",
    fillOpacity: 0.05,
    dashArray: "6 4",
  },
  interactive: false,
}); // not added to map yet — toggleGeofence controls this

map.on("zoomend", () => {
  updateAllHeatmaps();
});

const isOnline = navigator.onLine;

const lightTileUrl = isOnline
  ? "https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=2bXjFOI9q9BSiHQVwLb7"
  : "assets/tiles/street-v2/{z}/{x}/{y}.png";

const darkTileUrl = isOnline
  ? "https://api.maptiler.com/maps/streets-v2-dark/{z}/{x}/{y}.png?key=2bXjFOI9q9BSiHQVwLb7"
  : "assets/tiles/street-v2-dark/{z}/{x}/{y}.png";

const lightLayer = L.tileLayer(lightTileUrl, {
  maxZoom: 21,
  maxNativeZoom: 21,
  attribution:
    '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>',
}).on("tileerror", function (error, tile) {
  const matches = tile.tile.src.match(/\/(\d+)\/(\d+)\/(\d+)\.png/);
  if (matches) {
    const [, z, x, y] = matches;
    tile.tile.src = `assets/tiles/street-v2/${z}/${x}/${y}.png`;
  }
});

const darkLayer = L.tileLayer(darkTileUrl, {
  maxZoom: 21,
  maxNativeZoom: 21,
  attribution:
    '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>',
}).on("tileerror", function (error, tile) {
  const matches = tile.tile.src.match(/\/(\d+)\/(\d+)\/(\d+)\.png/);
  if (matches) {
    const [, z, x, y] = matches;
    tile.tile.src = `assets/tiles/street-v2-dark/${z}/${x}/${y}.png`;
  }
});

window.addEventListener("online", () => {
  lightLayer.setUrl(
    "https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=2bXjFOI9q9BSiHQVwLb7",
  );
  darkLayer.setUrl(
    "https://api.maptiler.com/maps/streets-v2-dark/{z}/{x}/{y}.png?key=2bXjFOI9q9BSiHQVwLb7",
  );
});

window.addEventListener("offline", () => {
  lightLayer.setUrl("assets/tiles/street-v2/{z}/{x}/{y}.png");
  darkLayer.setUrl("assets/tiles/street-v2-dark/{z}/{x}/{y}.png");
});

const currentTheme = document.documentElement.getAttribute("data-theme");
if (currentTheme === "dark") {
  darkLayer.addTo(map);
} else {
  lightLayer.addTo(map);
}

function switchMapTheme(isDark) {
  if (isDark) {
    map.removeLayer(lightLayer);
    map.addLayer(darkLayer);
  } else {
    map.removeLayer(darkLayer);
    map.addLayer(lightLayer);
  }
  updateHeatmapsForTheme(isDark);
}

// Restore geofence toggle UI from saved state
document.addEventListener('DOMContentLoaded', () => {
  const track  = document.getElementById('geofenceToggleTrack');
  const thumb  = document.getElementById('geofenceToggleThumb');
  const status = document.getElementById('geofenceStatus');
  if (track && thumb && status) applyGeofenceUI(track, thumb, status);
});

// ============================================
// HEATMAP TOGGLE BUTTONS
// ============================================

const heatmapToggleButtons = document.querySelectorAll("[data-heatmap]");
heatmapToggleButtons.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const heatmapType = btn.dataset.heatmap;

    btn.classList.toggle("active");
    heatmapVisible[heatmapType] = !heatmapVisible[heatmapType];

    if (heatmapVisible[heatmapType]) {
      if (heatmapLayers[heatmapType]) heatmapLayers[heatmapType].addTo(map);
    } else {
      if (heatmapLayers[heatmapType])
        map.removeLayer(heatmapLayers[heatmapType]);
    }
  });
});

// ============================================
// EMERGENCY LIST + PANEL INIT
// ============================================

incidentContent.innerHTML = renderSkeletonLoading();
setTimeout(() => {
  incidentContent.innerHTML = renderEmergencyList();
  if (isRightPanelCollapsed) rightPanelToggle.click();
}, 1500);

// ============================================
// ZOOM CONTROLS
// ============================================

document.getElementById("zoomIn").addEventListener("click", () => map.zoomIn());
document
  .getElementById("zoomOut")
  .addEventListener("click", () => map.zoomOut());

// ============================================
// USER LOCATION
// ============================================

let userLocationMarker = null;
let userLocationCircle = null;

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

document.getElementById("locate").addEventListener("click", () => {
  if (!navigator.geolocation) {
    showToast("error", "Geolocation is not supported by your browser");
    return;
  }

  showToast("info", "Getting your location...");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      if (userLocationMarker) map.removeLayer(userLocationMarker);
      if (userLocationCircle) map.removeLayer(userLocationCircle);

      userLocationCircle = L.circle([userLat, userLng], {
        color: "#3B82F6",
        fillColor: "#3B82F6",
        fillOpacity: 0.1,
        radius: accuracy,
        weight: 1,
      }).addTo(map);

      userLocationMarker = L.marker([userLat, userLng], {
        icon: userLocationIcon,
      }).addTo(map).bindPopup(`
          <div class="p-2">
            <div class="font-semibold text-sm text-gray-800 dark:text-white mb-1">Your Location</div>
            <div class="text-xs text-gray-600 dark:text-gray-400">Accuracy: ±${Math.round(accuracy)}m</div>
          </div>
        `);

      map.setView([userLat, userLng], 16);
      showToast("success", "Location found!");
    },
    (error) => {
      const messages = {
        [error.PERMISSION_DENIED]: "Location permission denied",
        [error.POSITION_UNAVAILABLE]: "Location information unavailable",
        [error.TIMEOUT]: "Location request timed out",
      };
      showToast("error", messages[error.code] || "Could not get your location");
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
  );
});

// ============================================
// MARKER FILTER BUTTONS
// ============================================

const filterButtons = document.querySelectorAll("[data-filter]");
filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const filter = btn.dataset.filter;
    if (filter === "heatmap") return;

    btn.classList.toggle("active");
    markerFiltersActive[filter] = btn.classList.contains("active");

    markers[filter].forEach((marker) => {
      if (markerFiltersActive[filter]) {
        marker.addTo(map);
      } else {
        map.removeLayer(marker);
      }
    });

    coverageCircles[filter].forEach((circle) => {
      if (markerFiltersActive[filter]) {
        circle.addTo(map);
      } else {
        map.removeLayer(circle);
      }
    });
  });
});

// ============================================
// HEATMAP MENU TOGGLE
// ============================================

const heatmapMenuToggle = document.getElementById("heatmapMenuToggle");
const heatmapControlsContainer = document.getElementById(
  "heatmapControlsContainer",
);
let isHeatmapMenuOpen = false;

heatmapMenuToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  isHeatmapMenuOpen = !isHeatmapMenuOpen;

  heatmapControlsContainer.classList.toggle("hidden");
  heatmapControlsContainer.classList.toggle("flex");
  heatmapMenuToggle.classList.toggle("active");

  const icon = heatmapMenuToggle.querySelector("i");
  icon.classList.toggle("uil-ellipsis-h", !isHeatmapMenuOpen);
  icon.classList.toggle("uil-times", isHeatmapMenuOpen);
});

document.addEventListener("click", (e) => {
  if (
    isHeatmapMenuOpen &&
    !heatmapMenuToggle.contains(e.target) &&
    !heatmapControlsContainer.contains(e.target)
  ) {
    isHeatmapMenuOpen = false;
    heatmapControlsContainer.classList.add("hidden");
    heatmapControlsContainer.classList.remove("flex");
    heatmapMenuToggle.classList.remove("active");

    const icon = heatmapMenuToggle.querySelector("i");
    icon.classList.remove("uil-times");
    icon.classList.add("uil-ellipsis-h");
  }
});

heatmapControlsContainer.addEventListener("click", (e) => e.stopPropagation());

// ============================================
// CHART.JS
// ============================================

async function fetchChartData(year) {
  try {
    const response = await fetch(
      `api/dashboard/get_chart_data.php?year=${year}`,
    );
    const result = await response.json();

    if (result.success && emergencyChart) {
      emergencyChart.data.datasets[0].data = result.data.fire;
      emergencyChart.data.datasets[1].data = result.data.flood;
      emergencyChart.data.datasets[2].data = result.data.crime;
      emergencyChart.update("active");

      // Populate year dropdown from real DB data on first load
      if (result.years && result.years.length > 0) {
        populateYearDropdown(result.years, year);
      }
    }
  } catch (error) {
    console.error("Failed to fetch chart data:", error);
  }
}

function populateYearDropdown(years, selectedYear) {
  // Only rebuild if count changed
  const existing = yearDropdownMenu.querySelectorAll(".year-option");
  if (existing.length === years.length) return;

  yearDropdownMenu.innerHTML = years
    .map(
      (y) => `
    <div class="year-option px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300/80 hover:bg-gray-100 dark:hover:bg-emerald-700/20 cursor-pointer transition-colors ${y == selectedYear ? "active bg-[#01af78]/10 font-medium text-emerald-600 dark:text-emerald-400" : ""}" data-year="${y}">
      ${y}
    </div>
  `,
    )
    .join("");

  // Re-attach click listeners to new elements
  yearDropdownMenu.querySelectorAll(".year-option").forEach((option) => {
    option.addEventListener("click", (e) => {
      e.stopPropagation();
      const year = option.dataset.year;

      selectedYearSpan.textContent = year;

      yearDropdownMenu.querySelectorAll(".year-option").forEach((opt) => {
        opt.classList.remove(
          "active",
          "bg-[#01af78]/10",
          "font-medium",
          "text-emerald-600",
          "dark:text-emerald-400",
        );
      });
      option.classList.add(
        "active",
        "bg-[#01af78]/10",
        "font-medium",
        "text-emerald-600",
        "dark:text-emerald-400",
      );

      yearDropdownMenu.classList.add("hidden");
      yearDropdownIcon.style.transform = "rotate(0deg)";

      fetchChartData(year);
    });
  });
}

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
          data: [],
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
          data: [],
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
          data: [],
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
      interaction: { mode: "index", intersect: false },
      animation: { duration: 2000, easing: "easeInOutQuart" },
      plugins: {
        legend: {
          display: true,
          labels: {
            usePointStyle: true,
            pointStyle: "circle",
            padding: 10,
            font: { size: 13 },
          },
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          padding: 12,
          cornerRadius: 8,
          titleFont: { size: 14, weight: "600" },
          bodyFont: { size: 13 },
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
          ticks: { stepSize: 25, color: "#94a3b8", font: { size: 12 } },
          grid: { color: "rgba(148, 163, 184, 0.15)", drawBorder: false },
        },
        x: {
          ticks: { color: "#94a3b8", font: { size: 12 } },
          grid: { display: false, drawBorder: false },
        },
      },
    },
  });

  // Set label and load current year data
  const currentYear = new Date().getFullYear();
  selectedYearSpan.textContent = currentYear;
  fetchChartData(currentYear);
}, 1100);

// ============================================
// YEAR DROPDOWN
// ============================================

const yearDropdownBtn = document.getElementById("yearDropdownBtn");
const yearDropdownMenu = document.getElementById("yearDropdownMenu");
const yearDropdownIcon = document.getElementById("yearDropdownIcon");
const selectedYearSpan = document.getElementById("selectedYear");

yearDropdownBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  yearDropdownMenu.classList.toggle("hidden");
  yearDropdownIcon.style.transform = yearDropdownMenu.classList.contains(
    "hidden",
  )
    ? "rotate(0deg)"
    : "rotate(180deg)";
});

document.addEventListener("click", (e) => {
  if (
    !yearDropdownBtn.contains(e.target) &&
    !yearDropdownMenu.contains(e.target)
  ) {
    yearDropdownMenu.classList.add("hidden");
    yearDropdownIcon.style.transform = "rotate(0deg)";
  }
});

// ============================================
// DATE/TIME DISPLAY
// ============================================

function updateDateTime() {
  const now = new Date();
  const dateString = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeString = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const dateTimeElement = document.querySelector("#currentDateTime");
  if (dateTimeElement) {
    dateTimeElement.textContent = `${dateString}, ${timeString}`;
  }
}

// ============================================
// LORA DEVICE MARKERS
// ============================================

const loraMarkers = { gateway: [], repeater: [] };
const loraCircles = { gateway: [], repeater: [] };
const loraVisible = { gateway: false, repeater: false };

const gatewayIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:35px;height:35px;
    background:linear-gradient(141.34deg,#27C291 4.44%,#20A577 95.56%);
    border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 8px rgba(0,0,0,.35);
    border:2px solid white;
  ">
    <i class="uil uil-wifi-router" style="color:white;font-size:16px;"></i>
  </div>`,
  iconSize: [35, 35],
  iconAnchor: [17, 17],
});

const repeaterIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:35px;height:35px;
    background:linear-gradient(141.34deg,#3B82F6 4.44%,#1D4ED8 95.56%);
    border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 8px rgba(0,0,0,.35);
    border:2px solid white;
  ">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white">
      <circle cx="12" cy="11" r="1.5"/>
      <path d="M12 12.5 L12 17" stroke="white" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      <path d="M9.5 8.5a3.5 3.5 0 0 0 0 5" stroke="white" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      <path d="M14.5 8.5a3.5 3.5 0 0 1 0 5" stroke="white" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      <path d="M7 6a6.5 6.5 0 0 0 0 10" stroke="white" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      <path d="M17 6a6.5 6.5 0 0 1 0 10" stroke="white" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    </svg>
  </div>`,
  iconSize: [35, 35],
  iconAnchor: [17, 17],
});

async function fetchLoraDevices() {
  try {
    const res = await fetch("api/devices/index.php?action=list");
    const json = await res.json();
    if (!json.success) return;

    // Clear existing
    ["gateway", "repeater"].forEach((type) => {
      loraMarkers[type].forEach((m) => map.removeLayer(m));
      loraCircles[type].forEach((c) => map.removeLayer(c));
      loraMarkers[type] = [];
      loraCircles[type] = [];
    });

    json.data.lora.forEach((device) => {
      if (!device.lat || !device.lng || device.status !== "active") return;

      const type = device.device_type === "gateway" ? "gateway" : "repeater";
      const icon = type === "gateway" ? gatewayIcon : repeaterIcon;
      const color = type === "gateway" ? "#27C291" : "#3B82F6";

      const marker = L.marker([device.lat, device.lng], { icon });
      marker.bindPopup(`
        <div style="min-width:160px">
          <div style="font-weight:600;font-size:13px;margin-bottom:4px">${device.device_id}</div>
          <div style="font-size:11px;color:#6b7280;margin-bottom:2px">${device.name}</div>
          <div style="font-size:11px;color:#6b7280">${device.location_label || ""}</div>
          <div style="font-size:11px;color:#6b7280">${device.coverage_radius || ""}m</div>
          <div style="font-size:11px;margin-top:6px">
            <span style="color:${color};font-weight:500">${type === "gateway" ? "Gateway" : "Repeater"}</span>
            · ${device.signal || "—"}
          </div>
        </div>
      `);

      if (loraVisible[type]) marker.addTo(map);
      loraMarkers[type].push(marker);

      // Coverage circle
      if (device.coverage_radius) {
        const circle = L.circle([device.lat, device.lng], {
          radius: device.coverage_radius,
          color,
          weight: 1.5,
          opacity: 0.6,
          fillColor: color,
          fillOpacity: 0.08,
        });
        if (loraVisible[type]) circle.addTo(map);
        loraCircles[type].push(circle);
      }
    });
  } catch (err) {
    console.error("[LoRa]", err);
  }
}

function toggleLoraLayer(type) {
  loraVisible[type] = !loraVisible[type];

  // Toggle markers and circles
  loraMarkers[type].forEach((m) =>
    loraVisible[type] ? m.addTo(map) : map.removeLayer(m),
  );
  loraCircles[type].forEach((c) =>
    loraVisible[type] ? c.addTo(map) : map.removeLayer(c),
  );

  // Toggle button active visual state
  const btn = document.getElementById(`${type}Toggle`);
  if (btn) btn.classList.toggle("active", loraVisible[type]);
}

// Fetch once on load
fetchLoraDevices();

updateDateTime();
setInterval(updateDateTime, 1000);