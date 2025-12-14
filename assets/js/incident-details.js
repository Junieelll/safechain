// Get incident ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const incidentId = urlParams.get("id");

let currentIncident = null;

if (!incidentId) {
  showToast("error", "No incident ID provided");
  setTimeout(() => {
    window.location.href = "admin/incidents";
  }, 2000);
}

// Get current admin name from session using AuthChecker
let currentAdminName = "Admin";
let currentUserId = "";
let currentUserRole = "";

// Set admin name from session/PHP on page load
async function getCurrentAdminName() {
  try {
    // First, try to get from data attributes (immediate, no API call needed)
    const bodyElement = document.body;
    if (bodyElement.dataset.adminName) {
      currentAdminName = bodyElement.dataset.adminName;
      currentUserId = bodyElement.dataset.userId || "";
      currentUserRole = bodyElement.dataset.userRole || "";
      console.log("Current admin loaded from HTML:", currentAdminName);
      return;
    }

    // Fallback: Fetch from API if data attributes not available
    const response = await fetch("api/get_current_admin.php");
    const result = await response.json();

    if (result.success) {
      currentAdminName = result.admin_name || "Admin";
      currentUserId = result.user_id;
      currentUserRole = result.role;
      console.log("Current admin loaded from API:", currentAdminName);
    } else {
      console.error("Failed to get admin info:", result.error);
    }
  } catch (error) {
    console.error("Error getting admin name:", error);
  }
}

// Fetch and populate incident details
async function fetchIncidentDetails() {
  try {
    const response = await fetch(
      `api/fetch_incident_details.php?id=${incidentId}`
    );
    const result = await response.json();

    if (result.success) {
      populateIncidentDetails(result.data);
    } else {
      showToast("error", "Failed to load incident: " + result.error);
      setTimeout(() => {
        window.location.href = "admin/incidents";
      }, 2000);
    }
  } catch (error) {
    console.error("Fetch error:", error);
    showToast("error", "Failed to connect to server");
  }
}

async function fetchIncidentDetails() {
  try {
    const response = await fetch(
      `api/fetch_incident_details.php?id=${incidentId}`
    );
    const result = await response.json();

    if (result.success) {
      currentIncident = result.data;
      populateIncidentDetails(result.data);
      fetchIncidentNotes();
      fetchIncidentTimeline();
      updateActionButtons(result.data.status, result.data.dispatched_to);
    } else {
      showToast("error", "Failed to load incident: " + result.error);
      setTimeout(() => {
        window.location.href = "admin/incidents";
      }, 2000);
    }
  } catch (error) {
    console.error("Fetch error:", error);
    showToast("error", "Failed to connect to server");
  }
}

// Fetch incident notes
async function fetchIncidentNotes() {
  try {
    const response = await fetch(
      `api/fetch_incident_notes.php?incident_id=${incidentId}`
    );
    const result = await response.json();

    if (result.success) {
      renderNotes(result.data);
    }
  } catch (error) {
    console.error("Fetch notes error:", error);
  }
}

// Render notes
function renderNotes(notes) {
  const remarksList = document.getElementById("remarksList");

  if (notes.length === 0) {
    remarksList.innerHTML =
      '<p class="text-center text-sm text-gray-500 dark:text-gray-400 py-4">No admin notes yet</p>';
    return;
  }

  remarksList.innerHTML = notes
    .map(
      (note) => `
    <div class="bg-gray-50 dark:bg-neutral-700 rounded-lg p-3">
      <div class="flex justify-between items-center mb-1.5">
        <span class="font-semibold text-sm text-gray-900 dark:text-neutral-300">${note.admin_name}</span>
        <span class="text-xs text-gray-500 dark:text-neutral-300">${note.time}</span>
      </div>
      <div class="text-xs text-gray-600 dark:text-neutral-400 leading-relaxed">${note.note}</div>
    </div>
  `
    )
    .join("");
}

// Fetch incident timeline
async function fetchIncidentTimeline() {
  try {
    const response = await fetch(
      `api/fetch_incident_timeline.php?incident_id=${incidentId}`
    );
    const result = await response.json();

    if (result.success) {
      renderTimeline(result.data);
    }
  } catch (error) {
    console.error("Fetch timeline error:", error);
  }
}

// Render timeline
function renderTimeline(timelineItems) {
  const timeline = document.getElementById("timeline");

  if (timelineItems.length === 0) {
    timeline.innerHTML =
      '<p class="text-center text-sm text-gray-500 dark:text-gray-400 py-4">No activity yet</p>';
    return;
  }

  timeline.innerHTML = timelineItems
    .map((item, index) => {
      const isLast = index === timelineItems.length - 1;
      return `
      <div class="relative pl-8 ${!isLast ? "pb-6" : ""}">
        <div class="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-blue-500 border-4 border-blue-100 dark:bg-blue-700 dark:border-blue-900 ${
          isLast ? "animate-pulse" : ""
        }"></div>
        ${
          !isLast
            ? '<div class="absolute left-[7px] top-5 w-0.5 h-full bg-gray-200 dark:bg-neutral-600"></div>'
            : ""
        }
        <div class="flex justify-between items-center mb-1">
          <span class="font-semibold text-gray-900 dark:text-neutral-300 text-sm">${
            item.title
          }</span>
          <span class="text-xs text-gray-500">${item.time}</span>
        </div>
        <div class="text-sm text-gray-500 leading-relaxed">${
          item.description
        }</div>
        <div class="text-xs text-gray-500 mt-1">By: ${item.actor}</div>
      </div>
    `;
    })
    .join("");
}

// Update action buttons based on status
function updateActionButtons(status, dispatchedTo) {
  const actionsCard = document.querySelector(
    ".bg-white.dark\\:bg-neutral-800.rounded-3xl.p-7 .space-y-2\\.5"
  );

  let buttons = "";

  // Show dispatch button only if not yet dispatched
  if (!dispatchedTo) {
    buttons += `
      <button
        onclick="showDispatchModal()"
        class="w-full flex items-center justify-center gap-2 px-5 py-3 bg-purple-500 dark:bg-purple-600 dark:hover:bg-purple-700 text-white rounded-xl text-xs font-medium hover:bg-purple-600 hover:-translate-y-0.5 hover:shadow-lg transition-all">
        <i class="uil uil-telegram-alt text-lg"></i>
        Dispatch Emergency Responders
      </button>
    `;
  }

  // Always show update status
  buttons += `
    <button
      onclick="updateStatus()"
      class="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl text-xs font-medium hover:bg-blue-600 hover:-translate-y-0.5 hover:shadow-lg transition-all">
      <i class="uil uil-pen text-lg"></i>
      Update Status
    </button>
  `;

  // Show mark as resolved only if not resolved
  if (status !== "resolved") {
    buttons += `
      <button
        onclick="markAsResolved()"
        class="w-full flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-medium hover:bg-emerald-600 hover:-translate-y-0.5 hover:shadow-lg transition-all">
        <i class="uil uil-check-circle text-lg"></i>
        Mark as Resolved
      </button>
    `;
  }

  buttons += `
    <button
      onclick="generateReport()"
      class="w-full flex items-center justify-center gap-2 px-5 py-3 bg-white dark:bg-neutral-600 dark:hover:bg-neutral-700 dark:border-neutral-700 dark:text-neutral-300 text-gray-500 border-2 border-gray-200 rounded-xl text-xs font-medium hover:bg-gray-50 hover:-translate-y-0.5 hover:border-gray-300 transition-all">
      <i class="uil uil-file-download text-lg"></i>
      Generate Report
    </button>
  `;

  actionsCard.innerHTML = buttons;
}

// Function to generate dynamic incident description
function generateIncidentDescription(incident) {
  const type = incident.type.toLowerCase();
  const location = incident.location;
  const date = incident.date_reported;
  const time = incident.time_reported;
  const barangay = "Gulod"; // You can make this dynamic too if you have it in the data
  
  // Time-based context
  const hour = parseInt(time.split(':')[0]);
  const period = hour >= 6 && hour < 12 ? "morning" : 
                 hour >= 12 && hour < 18 ? "afternoon" : 
                 hour >= 18 && hour < 21 ? "evening" : "night";
  
  // Day context
  const reportDate = new Date(date);
  const today = new Date();
  const isToday = reportDate.toDateString() === today.toDateString();
  const dateContext = isToday ? "today" : `on ${date}`;
  
  // Description templates based on incident type
  const descriptions = {
    fire: [
      `Fire emergency reported ${dateContext} at ${time} in ${location}, Barangay ${barangay}. `,
      `Incident occurred during ${period} hours. `,
      `Smoke and flames visible from the area. `,
      `Immediate response required to prevent spread to nearby structures. `,
      `Residents in the vicinity have been alerted and evacuation procedures initiated. `,
      `Fire department has been notified for immediate deployment. `,
      `Initial assessment indicates potential structural damage. `,
      `No casualties confirmed at the time of reporting.`
    ],
    flood: [
      `Flood emergency reported ${dateContext} at ${time} in ${location}, Barangay ${barangay}. `,
      `Water levels rising during ${period} hours. `,
      `Multiple households affected by flooding in the immediate area. `,
      `Road access may be limited due to water accumulation. `,
      `Residents advised to move to higher ground and secure valuables. `,
      `Local authorities monitoring water levels closely. `,
      `Emergency response teams preparing evacuation support if needed. `,
      `Weather conditions being assessed for potential worsening.`
    ],
    crime: [
      `Crime incident reported ${dateContext} at ${time} in ${location}, Barangay ${barangay}. `,
      `Incident occurred during ${period} hours. `,
      `Immediate police response requested for the area. `,
      `Scene is being secured to preserve evidence. `,
      `Witnesses present and providing initial statements. `,
      `Additional security measures being implemented in the vicinity. `,
      `Investigation unit has been dispatched to the location. `,
      `Residents in the area advised to remain vigilant and report any suspicious activity.`
    ]
  };
  
  // Get the appropriate description array
  const descArray = descriptions[type] || descriptions.fire;
  
  // Randomly select 4-6 sentences for variety
  const numSentences = Math.floor(Math.random() * 3) + 4; // 4-6 sentences
  const selectedSentences = [];
  
  // Always include first sentence (main context)
  selectedSentences.push(descArray[0]);
  
  // Randomly select from remaining sentences
  const remainingSentences = descArray.slice(1);
  const shuffled = remainingSentences.sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < Math.min(numSentences - 1, shuffled.length); i++) {
    selectedSentences.push(shuffled[i]);
  }
  
  return selectedSentences.join('');
}

// Populate the page with incident data
function populateIncidentDetails(incident) {
  // Update breadcrumb and title
  document.getElementById("breadcrumbIncidentId").textContent = incident.id;

  // Update incident overview
  document.querySelector(".inline-flex.items-center.gap-2.px-4").innerHTML = `
    <i class="uil uil-${getIncidentIcon(incident.type)} text-xl"></i>
    ${getIncidentTypeLabel(incident.type)}
  `;

  document.querySelector(
    ".inline-flex.items-center.gap-2.px-4"
  ).className = `inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm mb-5 ${getIncidentTypeColor(
    incident.type
  )}`;

  // Update status badge
  updateStatusBadge(incident.status);

  // Update incident details
  document.querySelectorAll(
    ".grid.grid-cols-1.md\\:grid-cols-2.gap-5"
  )[0].innerHTML = `
    <div class="flex flex-col gap-1.5">
      <span class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">Incident ID</span>
      <span class="text-sm font-semibold text-gray-900 dark:text-neutral-300">#${incident.id}</span>
    </div>
    <div class="flex flex-col gap-1.5">
      <span class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">Date Reported</span>
      <span class="text-sm font-semibold text-gray-900 dark:text-neutral-300">${incident.date_reported}</span>
    </div>
    <div class="flex flex-col gap-1.5">
      <span class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">Time Reported</span>
      <span class="text-sm font-semibold text-gray-900 dark:text-neutral-300">${incident.time_reported}</span>
    </div>
  `;

  const descriptionBox = document.querySelector('.bg-gray-50.dark\\:bg-neutral-700.border-l-4.border-blue-500');
  if (descriptionBox) {
    const generatedDescription = generateIncidentDescription(incident);
    descriptionBox.textContent = generatedDescription;
  }

  // Update location details (keep static for now, but you can make this dynamic too)
  const locationGrid = document.querySelectorAll(
    ".grid.grid-cols-1.md\\:grid-cols-2.gap-5"
  )[1];
  locationGrid.querySelector("span.text-sm.font-semibold").textContent =
    incident.location;

  document.getElementById(
    "coordinates"
  ).textContent = `${incident.lat}, ${incident.lng}`;

  // Update reporter details
  if (incident.reporter_name) {
    document.querySelectorAll(
      ".grid.grid-cols-1.md\\:grid-cols-2.gap-5"
    )[2].innerHTML = `
      <div class="flex flex-col gap-1.5">
        <span class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">Name</span>
        <span class="text-sm font-semibold text-gray-900 dark:text-neutral-300">${
          incident.reporter_name
        }</span>
      </div>
      <div class="flex flex-col gap-1.5">
        <span class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">User ID</span>
        <span class="text-sm font-semibold text-gray-900 dark:text-neutral-300">${
          incident.reporter_user_id || "N/A"
        }</span>
      </div>
      <div class="flex flex-col gap-1.5">
        <span class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">Contact Number</span>
        <span class="text-sm font-semibold text-gray-900 dark:text-neutral-300">${
          incident.reporter_contact || "N/A"
        }</span>
      </div>
      <div class="flex flex-col gap-1.5">
        <span class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">Address</span>
        <span class="text-sm font-semibold text-gray-900 dark:text-neutral-300">${
          incident.reporter_address || "N/A"
        }</span>
      </div>
      <div class="flex flex-col gap-1.5">
        <span class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">Resident Since</span>
        <span class="text-sm font-semibold text-gray-900 dark:text-neutral-300">${
          incident.resident_since
        }</span>
      </div>
    `;
  }

  // ✅ NEW: Update map location and marker dynamically
  if (incident.lat && incident.lng) {
    updateIncidentMap(incident);
  }
}

// ✅ NEW FUNCTION: Update map with incident location and icon
function updateIncidentMap(incident) {
  const incidentLocation = [parseFloat(incident.lat), parseFloat(incident.lng)];

  // Update map view
  map.setView(incidentLocation, 16);

  // Remove existing incident marker
  if (incidentMarker) {
    map.removeLayer(incidentMarker);
  }

  // Get the appropriate icon based on incident type
  const iconMap = {
    fire: fireIcon,
    flood: floodIcon,
    crime: crimeIcon,
  };

  const markerIcon = iconMap[incident.type] || fireIcon;

  // Add new marker with correct icon
  incidentMarker = L.marker(incidentLocation, { icon: markerIcon })
    .addTo(map)
    .bindPopup(
      `<b>${getIncidentTypeLabel(incident.type)}</b><br>${incident.location}`
    );

  // Remove existing circles
  map.eachLayer((layer) => {
    if (layer instanceof L.Circle) {
      map.removeLayer(layer);
    }
  });

  // Get circle color based on incident type
  const circleColors = {
    fire: "#dc2626",
    flood: "#3B82F6",
    crime: "#FBBF24",
  };

  const circleColor = circleColors[incident.type] || "#dc2626";

  // Add new circle at incident location
  L.circle(incidentLocation, {
    color: circleColor,
    fillColor: circleColor,
    fillOpacity: 0.3,
    radius: 40,
  }).addTo(map);

  // Update the barangay hall start marker position if needed
  startMarker.setLatLng(barangayHall);
}

// Helper functions
function getIncidentIcon(type) {
  const icons = {
    fire: "fire",
    flood: "water",
    crime: "shield-exclamation",
  };
  return icons[type] || "exclamation-triangle";
}

function getIncidentTypeLabel(type) {
  const labels = {
    fire: "Fire Emergency",
    flood: "Flood Alert",
    crime: "Crime Incident",
  };
  return labels[type] || "Emergency";
}

function getIncidentTypeColor(type) {
  const colors = {
    fire: "bg-red-100 text-red-600 dark:bg-red-800/20 dark:text-red-400",
    flood: "bg-blue-100 text-blue-600 dark:bg-blue-800/20 dark:text-blue-400",
    crime:
      "bg-yellow-100 text-yellow-600 dark:bg-yellow-800/20 dark:text-yellow-400",
  };
  return colors[type] || "bg-gray-100 text-gray-600";
}

function updateStatusBadge(status) {
  const statusBadge = document.getElementById("statusBadge");
  let bgColor = "",
    textColor = "",
    dotColor = "",
    statusDisplay = "";

  if (status === "pending") {
    bgColor = "bg-yellow-100 dark:bg-yellow-900/60";
    textColor = "text-yellow-600 dark:text-yellow-400";
    dotColor = "bg-yellow-600 dark:bg-yellow-400";
    statusDisplay = "Pending Response";
  } else if (status === "responding") {
    bgColor = "bg-blue-100 dark:bg-blue-900/60";
    textColor = "text-blue-600 dark:text-blue-400";
    dotColor = "bg-blue-600 dark:bg-blue-400";
    statusDisplay = "Active Response";
  } else if (status === "resolved") {
    bgColor = "bg-green-100 dark:bg-green-900/60";
    textColor = "text-green-600 dark:text-green-400";
    dotColor = "bg-green-600 dark:bg-green-400";
    statusDisplay = "Resolved";
  }

  statusBadge.className = `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${bgColor} ${textColor}`;
  statusBadge.innerHTML = `<span class="w-2 h-2 rounded-full ${dotColor} status-dot"></span> ${statusDisplay}`;
}

// Initialize Map
const incidentLocation = [14.716412, 121.040834];
const barangayHall = [14.712429, 121.038435];
let routingControl = null;
let directionsActive = false;
let selectedFiles = [];

const map = L.map("incidentMap").setView(incidentLocation, 16);

// Create both light and dark tile layers
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
}

// Listen for theme changes from sidebar.js
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.attributeName === "data-theme") {
      const isDark =
        document.documentElement.getAttribute("data-theme") === "dark";
      switchMapTheme(isDark);
    }
  });
});

observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-theme"],
});

// Define all icon styles (add these after your map initialization)
const fireIcon = L.divIcon({
  className: "custom-icon",
  html: '<div style="background: #dc2626; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"><i class="uil uil-fire text-2xl text-white"></i></div>',
  iconSize: [40, 40],
});

const floodIcon = L.divIcon({
  className: "custom-icon",
  html: '<div style="background: #3B82F6; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"><i class="uil uil-water text-2xl text-white"></i></div>',
  iconSize: [40, 40],
});

const crimeIcon = L.divIcon({
  className: "custom-icon",
  html: '<div style="background: #FBBF24; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"><i class="uil uil-shield-plus text-2xl text-white"></i></div>',
  iconSize: [40, 40],
});

const startIcon = L.divIcon({
  className: "custom-icon",
  html: '<div style="background: #10b981; width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><i class="uil uil-map-marker text-lg text-white"></i></div>',
  iconSize: [35, 35],
});

// Initialize marker variables
let incidentMarker = null;
const startMarker = L.marker(barangayHall, { icon: startIcon }).bindPopup(
  "<b>Barangay Hall</b><br>Starting Point"
);

// Updated Toggle Directions function
function toggleDirections() {
  const btn = document.getElementById("toggleDirections");
  const routeInfo = document.getElementById("routeInfo");

  if (!directionsActive) {
    // Check if incident marker exists
    if (!incidentMarker) {
      showToast(
        "error",
        "Cannot calculate directions: No incident location available"
      );
      return;
    }

    // Get the current incident location from the marker
    const incidentLocation = incidentMarker.getLatLng();

    startMarker.addTo(map);

    routingControl = L.Routing.control({
      waypoints: [
        L.latLng(barangayHall[0], barangayHall[1]),
        L.latLng(incidentLocation.lat, incidentLocation.lng),
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      lineOptions: {
        styles: [{ color: "#10B981", opacity: 0.8, weight: 6 }],
      },
      createMarker: function () {
        return null;
      },
    }).addTo(map);

    routingControl.on("routesfound", function (e) {
      const routes = e.routes;
      const summary = routes[0].summary;
      const instructions = routes[0].instructions;

      // Calculate distance and time
      const distanceKm = (summary.totalDistance / 1000).toFixed(2);
      const timeMin = Math.round(summary.totalTime / 60);

      // Extract dynamic route names from instructions
      const routeNames = [];
      instructions.forEach((instruction) => {
        if (instruction.road) {
          routeNames.push(instruction.road);
        }
      });

      // Remove duplicates and filter out empty strings
      const uniqueRoutes = [...new Set(routeNames)].filter(
        (name) => name && name.trim() !== ""
      );

      // Create route display text
      let routeText = "Direct Route";
      if (uniqueRoutes.length > 0) {
        if (uniqueRoutes.length === 1) {
          routeText = `Via ${uniqueRoutes[0]}`;
        } else if (uniqueRoutes.length === 2) {
          routeText = `Via ${uniqueRoutes[0]} and ${uniqueRoutes[1]}`;
        } else {
          const mainRoads = uniqueRoutes.slice(0, 2);
          routeText = `Via ${mainRoads.join(", ")} and ${
            uniqueRoutes.length - 2
          } more`;
        }
      }

      // Update UI
      document.getElementById("routeDistance").textContent = distanceKm + " km";
      document.getElementById("routeTime").textContent = timeMin + " minutes";
      document.getElementById("routeName").textContent = routeText;

      routeInfo.classList.remove("hidden");
    });

    btn.innerHTML = '<i class="uil uil-times text-base"></i> Hide Directions';
    directionsActive = true;
    showToast("info", "Directions displayed on map");
  } else {
    if (routingControl) {
      map.removeControl(routingControl);
      routingControl = null;
    }
    map.removeLayer(startMarker);
    routeInfo.classList.add("hidden");

    btn.innerHTML =
      '<i class="uil uil-map-marker text-base"></i> Show Directions';
    directionsActive = false;

    // Re-center on incident if marker exists
    if (incidentMarker) {
      const incidentLocation = incidentMarker.getLatLng();
      map.setView([incidentLocation.lat, incidentLocation.lng], 15);
    }

    showToast("info", "Directions hidden");
  }
}

document.getElementById("zoomIn").addEventListener("click", () => map.zoomIn());
document
  .getElementById("zoomOut")
  .addEventListener("click", () => map.zoomOut());

// Update Status Function
async function updateStatus() {
  modalManager.create({
    id: "updateStatusModal",
    icon: "uil-pen",
    iconColor: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-100 dark:bg-blue-900/60",
    title: "Update Incident Status",
    subtitle: "Change status and priority",
    body: `
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Change Status To</label>
          <select id="statusSelectModal" class="w-full p-3 border-2 border-gray-200 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white rounded-lg text-sm focus:outline-none focus:border-blue-500">
            <option value="">Select status...</option>
            <option value="pending">Pending - Awaiting Dispatch</option>
            <option value="responding">Active Response - On Scene</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Admin Notes (Optional)</label>
          <textarea id="instructionsModal" rows="4" placeholder="Add notes about the status change..." class="w-full p-3 border-2 border-gray-200 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white rounded-lg text-sm resize-y focus:outline-none focus:border-blue-500"></textarea>
        </div>
      </div>
    `,
    primaryButton: {
      text: "Update Status",
      icon: "uil-check-circle",
    },
    secondaryButton: {
      text: "Cancel",
    },
    onPrimary: async () => {
      const status = document.getElementById("statusSelectModal");
      const notes = document.getElementById("instructionsModal");

      if (!status.value) {
        showToast("error", "Please select a status");
        return;
      }

      try {
        const response = await fetch("api/update_incident_status.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: incidentId,
            status: status.value,
            admin_name: `Admin ${currentAdminName}`,
            notes: notes.value.trim(),
          }),
        });

        const result = await response.json();

        if (result.success) {
          const statusText = status.options[status.selectedIndex].text;
          updateStatusBadge(status.value);

          showToast("success", `Status updated to: ${statusText}`);

          // Refresh timeline and notes to show new entries
          fetchIncidentTimeline();
          if (notes.value.trim()) {
            fetchIncidentNotes();
          }
        } else {
          showToast("error", "Failed to update status: " + result.error);
        }
      } catch (error) {
        console.error("Update error:", error);
        showToast("error", "Failed to update status");
      }

      modalManager.close("updateStatusModal");
    },
  });

  modalManager.show("updateStatusModal");
}

// Update Mark as Resolved function
async function markAsResolved() {
  modalManager.create({
    id: "resolveModal",
    icon: "uil-check-circle",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/60",
    title: "Mark as Resolved",
    subtitle: "Confirm incident resolution",
    body: '<p class="text-xs text-center px-2">Are you sure you want to mark this incident as <strong>RESOLVED</strong>? This will close the incident and update its status.</p>',
    showWarning: true,
    warningText:
      "Marking this incident as resolved will finalize it and update its status. This action cannot be undone.",
    primaryButton: {
      text: "Yes, Resolve",
      icon: "uil-check",
      class: "bg-emerald-500 hover:bg-emerald-600",
    },
    secondaryButton: {
      text: "Cancel",
    },
    onPrimary: async () => {
      try {
        const response = await fetch("api/update_incident_status.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: incidentId,
            status: "resolved",
            admin_name: `Admin ${currentAdminName}`,
          }),
        });

        const result = await response.json();

        if (result.success) {
          updateStatusBadge("resolved");
          showToast("success", "Incident marked as RESOLVED");

          // Refresh timeline to show new entry
          fetchIncidentTimeline();

          // Update action buttons
          updateActionButtons("resolved", currentIncident?.dispatched_to);
        } else {
          showToast("error", "Failed to update status: " + result.error);
        }
      } catch (error) {
        console.error("Update error:", error);
        showToast("error", "Failed to update status");
      }

      modalManager.close("resolveModal");
    },
  });

  modalManager.show("resolveModal");
}

function uploadEvidence() {
  selectedFiles = [];

  modalManager.create({
    id: "uploadEvidenceModal",
    icon: "uil-upload",
    iconColor: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-100 dark:bg-purple-900/20",
    title: "Upload Evidence",
    subtitle: "Add photos, videos, or documents",
    body: `
      <div class="space-y-4">
        <div class="border-2 border-dashed border-gray-300 dark:border-neutral-600 rounded-lg p-6 text-center hover:border-purple-400 dark:hover:border-purple-500 transition-colors cursor-pointer" onclick="triggerFileInput()">
          <i class="uil uil-cloud-upload text-5xl text-gray-400 mb-3"></i>
          <p class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Click to browse files</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Images, Videos, PDF, DOC, DOCX</p>
        </div>
        
        <input type="file" id="evidenceFileInput" accept="image/*,video/*,.pdf,.doc,.docx" multiple class="hidden" onchange="handleFileSelection(event)">
        
        <div id="selectedFilesList" class="space-y-2 max-h-64 overflow-y-auto">
          <!-- Selected files will appear here -->
        </div>
        
        <div id="fileCountDisplay" class="text-xs text-gray-500 dark:text-gray-400 text-center hidden">
          <span id="fileCount">0</span> file(s) selected
        </div>
      </div>
    `,
    primaryButton: {
      text: "Upload Files",
      icon: "uil-check",
      class: "bg-purple-500 hover:bg-purple-600",
    },
    secondaryButton: {
      text: "Cancel",
    },
    onPrimary: () => {
      if (selectedFiles.length === 0) {
        showToast("error", "Please select at least one file");
        return;
      }

      showToast("info", `Uploading ${selectedFiles.length} file(s)...`);

      setTimeout(() => {
        addTimelineItem(
          "Evidence Uploaded",
          `Admin uploaded ${selectedFiles.length} file(s) as evidence`
        );
        showToast(
          "success",
          `${selectedFiles.length} file(s) uploaded successfully`
        );

        // Add placeholder images to grid
        const grid = document.querySelector(".grid.grid-cols-3");
        if (grid && grid.children.length < 6) {
          selectedFiles
            .slice(0, 3 - (grid.children.length - 1))
            .forEach((file, index) => {
              const newImg = document.createElement("div");
              newImg.className =
                "aspect-square bg-gray-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center cursor-pointer hover:scale-105 hover:shadow-md transition-all overflow-hidden";

              // Show different icons based on file type
              let iconClass = "uil-image";
              if (file.type.startsWith("video/")) {
                iconClass = "uil-video";
              } else if (file.type === "application/pdf") {
                iconClass = "uil-file-alt";
              } else if (
                file.type.includes("document") ||
                file.type.includes("word")
              ) {
                iconClass = "uil-file-edit-alt";
              }

              newImg.innerHTML = `<i class="uil ${iconClass} text-4xl text-gray-400"></i>`;
              newImg.onclick = () => openImageModal(file.name);
              grid.insertBefore(newImg, grid.lastElementChild);
            });
        }

        modalManager.close("uploadEvidenceModal");
        selectedFiles = [];
      }, 1500);
    },
  });

  modalManager.show("uploadEvidenceModal");
}

function triggerFileInput() {
  document.getElementById("evidenceFileInput").click();
}

function handleFileSelection(event) {
  const files = Array.from(event.target.files);

  files.forEach((file) => {
    // Check if file is already selected
    if (
      !selectedFiles.find((f) => f.name === file.name && f.size === file.size)
    ) {
      selectedFiles.push(file);
    }
  });

  updateFilesList();
  event.target.value = ""; // Reset input to allow selecting same file again
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  updateFilesList();
}

function updateFilesList() {
  const filesList = document.getElementById("selectedFilesList");
  const fileCountDisplay = document.getElementById("fileCountDisplay");
  const fileCount = document.getElementById("fileCount");

  if (selectedFiles.length === 0) {
    filesList.innerHTML =
      '<p class="text-center text-sm text-gray-500 dark:text-gray-400 py-4">No files selected</p>';
    fileCountDisplay.classList.add("hidden");
    return;
  }

  fileCountDisplay.classList.remove("hidden");
  fileCount.textContent = selectedFiles.length;

  filesList.innerHTML = selectedFiles
    .map((file, index) => {
      const sizeKB = (file.size / 1024).toFixed(1);
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const displaySize =
        file.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;

      // Determine icon based on file type
      let iconClass = "uil-image";
      let iconColor = "text-purple-600";
      if (file.type.startsWith("video/")) {
        iconClass = "uil-video";
        iconColor = "text-blue-600";
      } else if (file.type === "application/pdf") {
        iconClass = "uil-file-alt";
        iconColor = "text-red-600";
      } else if (file.type.includes("document") || file.type.includes("word")) {
        iconClass = "uil-file-edit-alt";
        iconColor = "text-blue-700";
      }

      return `
      <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-700 rounded-lg group hover:bg-gray-100 dark:hover:bg-neutral-600 transition-colors">
        <div class="flex-shrink-0">
          <i class="uil ${iconClass} text-2xl ${iconColor}"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">${file.name}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">${displaySize}</p>
        </div>
        <button onclick="removeFile(${index})" class="flex-shrink-0 p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors group-hover:opacity-100 opacity-0">
          <i class="uil uil-times text-lg text-red-600 dark:text-red-400"></i>
        </button>
      </div>
    `;
    })
    .join("");
}

// Generate Report
function generateReport() {
  modalManager.create({
    id: "reportModal",
    icon: "uil-file-download",
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
    title: "Generate Incident Report",
    subtitle: "Export incident details",
    body: `
      <div class="space-y-3">
        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-700 rounded-lg">
          <span class="text-xs font-medium">Report ID:</span>
          <span class="text-xs font-semibold">#EMG-2024-1047</span>
        </div>
        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-700 rounded-lg">
          <span class="text-xs font-medium">Format:</span>
          <span class="text-xs font-semibold">PDF Document</span>
        </div>
        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-700 rounded-lg">
          <span class="text-xs font-medium">Status:</span>
          <span class="text-xs text-emerald-600 font-semibold">Ready to Download</span>
        </div>
      </div>
    `,
    primaryButton: {
      text: "Download Report",
      icon: "uil-download-alt",
    },
    secondaryButton: {
      text: "Cancel",
    },
    onPrimary: () => {
      showToast("info", "Generating incident report...");

      setTimeout(() => {
        showToast("success", "Report downloaded successfully");
        addTimelineItem(
          "Report Generated",
          "PDF report generated: #EMG-2024-1047"
        );
        modalManager.close("reportModal");
      }, 1500);
    },
  });

  modalManager.show("reportModal");
}

// Open Image Modal
function openImageModal(imageId) {
  modalManager.create({
    id: "imageModal",
    icon: "uil-image",
    iconColor: "text-purple-600",
    iconBg: "bg-purple-100",
    title: "Evidence Photo",
    subtitle: imageId,
    body: `
      <div class="bg-gray-100 dark:bg-neutral-700 aspect-video rounded-lg flex items-center justify-center">
        <div class="text-center">
          <i class="uil uil-image text-6xl text-gray-400 mb-3"></i>
          <p class="text-sm text-gray-600 dark:text-gray-400">Image preview: ${imageId}</p>
          <p class="text-xs text-gray-500 dark:text-gray-500 mt-2">Full resolution image would display here</p>
        </div>
      </div>
      <div class="mt-4 space-y-2 text-xs">
        <div class="flex justify-between">
          <span class="text-gray-500">File:</span>
          <span class="font-semibold">${imageId}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">Uploaded:</span>
          <span class="font-semibold">${new Date().toLocaleString()}</span>
        </div>
      </div>
    `,
    primaryButton: {
      text: "Close",
      icon: "uil-times",
    },
    onPrimary: () => modalManager.close("imageModal"),
  });

  modalManager.show("imageModal");
}

async function addRemark() {
  const remarkText = document.getElementById("newRemark").value.trim();

  if (!remarkText) {
    showToast("error", "Please enter a note before submitting");
    return;
  }

  try {
    const response = await fetch("api/add_incident_note.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        incident_id: incidentId,
        note: remarkText,
        admin_name: `Admin ${currentAdminName}`,
      }),
    });

    const result = await response.json();

    if (result.success) {
      document.getElementById("newRemark").value = "";
      showToast("success", "Admin note added successfully");
      // Refresh notes and timeline
      fetchIncidentNotes();
      fetchIncidentTimeline();
    } else {
      showToast("error", "Failed to add note: " + result.error);
    }
  } catch (error) {
    console.error("Add note error:", error);
    showToast("error", "Failed to add note");
  }
}

// Update dispatch function to use proper admin name
async function showDispatchModal() {
  try {
    const response = await fetch("api/fetch_emergency_responders.php");
    const result = await response.json();

    if (!result.success) {
      showToast("error", "Failed to load emergency responders");
      return;
    }

    const responders = result.data;

    modalManager.create({
      id: "dispatchModal",
      icon: "uil-telegram-alt",
      iconColor: "text-purple-600 dark:text-purple-400",
      iconBg: "bg-purple-100 dark:bg-purple-900/60",
      title: "Dispatch Emergency Responders",
      subtitle: "Select team to dispatch",
      body: `
        <div class="space-y-3">
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Select Emergency Responder</label>
          <select id="responderSelect" class="w-full p-3 border-2 border-gray-200 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white rounded-lg text-sm focus:outline-none focus:border-blue-500">
            <option value="">Choose responder...</option>
            ${responders
              .map(
                (r) => `
              <option value="${r.id}" data-name="${r.name}">
                ${r.name} - ${r.type.toUpperCase()} (${r.contact})
              </option>
            `
              )
              .join("")}
          </select>
          
          <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mt-3">
            <div class="flex gap-2">
              <i class="uil uil-info-circle text-yellow-600 dark:text-yellow-400 text-lg flex-shrink-0"></i>
              <p class="text-xs text-yellow-800 dark:text-yellow-300">
                The selected team will be notified and dispatched to the incident location immediately.
              </p>
            </div>
          </div>
        </div>
      `,
      primaryButton: {
        text: "Dispatch Now",
        icon: "uil-telegram-alt",
        class: "bg-purple-500 hover:bg-purple-600",
      },
      secondaryButton: {
        text: "Cancel",
      },
      onPrimary: async () => {
        const select = document.getElementById("responderSelect");

        if (!select.value) {
          showToast("error", "Please select an emergency responder");
          return;
        }

        try {
          const response = await fetch("api/dispatch_responders.php", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              incident_id: incidentId,
              responder_id: select.value,
              admin_name: `Admin ${currentAdminName}`,
            }),
          });

          const result = await response.json();

          if (result.success) {
            showToast(
              "success",
              `${result.responder} dispatched successfully!`
            );
            modalManager.close("dispatchModal");
            // Refresh page data
            fetchIncidentDetails();
          } else {
            showToast("error", "Failed to dispatch: " + result.error);
          }
        } catch (error) {
          console.error("Dispatch error:", error);
          showToast("error", "Failed to dispatch responders");
        }
      },
    });

    modalManager.show("dispatchModal");
  } catch (error) {
    console.error("Error loading responders:", error);
    showToast("error", "Failed to load emergency responders");
  }
}

// Add Timeline Item
function addTimelineItem(title, content) {
  const timeline = document.getElementById("timeline");
  const now = new Date();
  const timeString = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  // Check if there are existing items to update the last one
  const existingItems = timeline.querySelectorAll(".relative.pl-8");
  if (existingItems.length > 0) {
    const lastItem = existingItems[existingItems.length - 1];
    // Remove animate-pulse from the previous last item's dot
    const lastDot = lastItem.querySelector(".animate-pulse");
    if (lastDot) {
      lastDot.classList.remove("animate-pulse");
    }
    // Add pb-6 and connector line to previous last item if it doesn't have them
    if (!lastItem.classList.contains("pb-6")) {
      lastItem.classList.add("pb-6");
      // Add connector line if it doesn't exist
      if (!lastItem.querySelector(".absolute.left-\\[7px\\]")) {
        const line = document.createElement("div");
        line.className =
          "absolute left-[7px] top-5 w-0.5 h-full bg-gray-200 dark:bg-neutral-600";
        lastItem.insertBefore(line, lastItem.firstChild);
      }
    }
  }

  const newItem = document.createElement("div");
  newItem.className = "relative pl-8 opacity-0 transition-opacity duration-300";
  newItem.innerHTML = `
    <div class="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-blue-500 border-4 border-blue-100 dark:border-blue-900 animate-pulse"></div>
    
    <div class="flex justify-between items-center mb-1">
      <span class="font-semibold text-gray-900 dark:text-white text-sm">${title}</span>
      <span class="text-xs text-gray-500 dark:text-gray-400">${timeString}</span>
    </div>
    <div class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">${content}</div>
    <div class="text-xs text-gray-500 dark:text-gray-500 mt-1">By: Current Admin</div>
  `;

  timeline.appendChild(newItem);

  setTimeout(() => {
    newItem.classList.remove("opacity-0");
  }, 10);

  setTimeout(() => {
    newItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, 100);
}

// Optional: Update duration timer
setInterval(() => {
  const durationElement = document.getElementById("duration");
  if (durationElement) {
    const currentMinutes = parseInt(durationElement.textContent);
    durationElement.textContent = currentMinutes + 1 + " minutes";
  }
}, 60000);

document.addEventListener("DOMContentLoaded", () => {
  getCurrentAdminName();
  fetchIncidentDetails();
});
