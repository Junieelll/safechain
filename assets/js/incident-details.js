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

let eventSource = null;
let reconnectTimer = null;

function startSSE() {
  if (eventSource) eventSource.close();

  eventSource = new EventSource(
    `api/incident_details/sse_incident.php?incident_id=${incidentId}`,
  );

  eventSource.addEventListener("timeline", (e) =>
    renderTimeline(JSON.parse(e.data)),
  );
  eventSource.addEventListener("notes", (e) => renderNotes(JSON.parse(e.data)));
  eventSource.addEventListener("evidence", (e) =>
    renderEvidenceGrid(JSON.parse(e.data)),
  );

  eventSource.addEventListener("timeline_update", (e) =>
    appendTimelineItems(JSON.parse(e.data)),
  );
  eventSource.addEventListener("notes_update", (e) =>
    appendNoteItems(JSON.parse(e.data)),
  );
  eventSource.addEventListener("evidence_update", (e) =>
    appendEvidenceItems(JSON.parse(e.data)),
  );

  eventSource.addEventListener("heartbeat", () => {
    /* alive */
  });

  eventSource.onerror = () => {
    eventSource.close();
    eventSource = null;

    // Retry with backoff — max 10s
    const delay = Math.min((reconnectTimer?._delay || 1000) * 2, 10000);
    console.warn(`SSE disconnected. Reconnecting in ${delay / 1000}s...`);

    reconnectTimer = setTimeout(() => {
      reconnectTimer._delay = delay;
      startSSE();
    }, delay);
  };

  // Reset backoff on successful open
  eventSource.onopen = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    console.log("SSE connected");
  };
}

// Append helpers (so existing items don't re-render/flicker)
function appendTimelineItems(newItems) {
  const timeline = document.getElementById("timeline");
  const empty = timeline.querySelector("p");
  if (empty) empty.remove();

  // Remove pulse from current first item
  const existing = timeline.querySelector(".relative.pl-8");
  if (existing) {
    existing.querySelector(".animate-pulse")?.classList.remove("animate-pulse");
  }

  newItems.forEach((item) => {
    const div = document.createElement("div");
    div.className = "relative pl-8 pb-6";
    div.innerHTML = `
      <div class="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-blue-500 border-4 border-blue-100 dark:border-blue-900 animate-pulse"></div>
      <div class="flex justify-between items-center mb-1">
        <span class="font-semibold text-gray-900 dark:text-neutral-300 text-sm">${item.title}</span>
        <span class="text-xs text-gray-500">${item.time ?? item.created_at}</span>
      </div>
      <div class="text-sm text-gray-500 leading-relaxed">${item.description}</div>
      <div class="text-xs text-gray-500 mt-1">By: ${item.actor}</div>
    `;
    timeline.insertBefore(div, timeline.firstChild);
  });
}

function appendNoteItems(newNotes) {
  const list = document.getElementById("remarksList");
  const empty = list.querySelector("p");
  if (empty) empty.remove();

  newNotes.forEach((note) => {
    const div = document.createElement("div");
    div.className = "bg-gray-50 dark:bg-neutral-700 rounded-lg p-3";
    div.innerHTML = `
      <div class="flex justify-between items-center mb-1.5">
        <span class="font-semibold text-sm text-gray-900 dark:text-neutral-300">${note.admin_name}</span>
        <span class="text-xs text-gray-500 dark:text-neutral-300">${note.time ?? note.created_at}</span>
      </div>
      <div class="text-xs text-gray-600 dark:text-neutral-400 leading-relaxed">${note.note}</div>
    `;
    list.appendChild(div);
  });
}

function appendEvidenceItems(newEvidence) {
  const grid = document.getElementById("evidenceGrid");

  // Filter out already-rendered items ← key fix
  const toAdd = newEvidence.filter((ev) => !renderedEvidenceIds.has(ev.id));
  if (toAdd.length === 0) return; // nothing new, skip

  const empty = grid.querySelector(".col-span-3");
  if (empty) empty.remove();

  const addTile = grid.lastElementChild;
  if (addTile) grid.removeChild(addTile);

  toAdd.forEach((ev) => {
    grid.insertAdjacentHTML("beforeend", buildEvidenceTile(ev));
    renderedEvidenceIds.add(ev.id); // ← track it
  });

  grid.insertAdjacentHTML(
    "beforeend",
    `
    <div onclick="uploadEvidence()"
         class="aspect-square bg-transparent border-2 border-dashed border-gray-300 dark:border-neutral-600 
                rounded-lg flex flex-col items-center justify-center cursor-pointer 
                hover:border-gray-400 dark:hover:border-neutral-400 transition-all">
      <i class="uil uil-plus text-4xl text-gray-400"></i>
      <span class="text-xs text-gray-400 mt-1">Add</span>
    </div>
  `,
  );

  updateEvidenceCount(renderedEvidenceIds.size);
}

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
    const response = await fetch("api/incident_details/get_current_admin.php");
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

async function fetchIncidentDetails() {
  try {
    const response = await fetch(
      `api/incident_details/fetch_incident_details.php?id=${incidentId}`,
    );
    const result = await response.json();

    if (result.success) {
      currentIncident = result.data;
      populateIncidentDetails(result.data);
      fetchIncidentNotes();
      fetchIncidentTimeline();
      fetchEvidence();
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

// ─── Evidence ────────────────────────────────────────────────────────────────

async function fetchEvidence() {
  try {
    const response = await fetch(
      `api/incident_details/fetch_evidence.php?incident_id=${incidentId}`,
    );
    const result = await response.json();
    if (result.success) renderEvidenceGrid(result.data);
  } catch (err) {
    console.error("Evidence fetch error:", err);
  }
}

// Track rendered evidence IDs
const renderedEvidenceIds = new Set();

function renderEvidenceGrid(evidenceList) {
  const grid = document.getElementById("evidenceGrid");
  if (!grid) return;

  grid.innerHTML = "";
  renderedEvidenceIds.clear();

  if (evidenceList.length === 0) {
    grid.innerHTML = `
      <div class="col-span-3 py-8 flex flex-col items-center justify-center text-gray-400 dark:text-neutral-500">
        <i class="uil uil-image-slash text-4xl mb-2"></i>
        <p class="text-xs">No evidence uploaded yet</p>
      </div>
    `;
  } else {
    evidenceList.forEach((ev) => {
      grid.insertAdjacentHTML("beforeend", buildEvidenceTile(ev));
      renderedEvidenceIds.add(ev.id);
    });

    // Add tile only shown when evidence exists
    grid.insertAdjacentHTML(
      "beforeend",
      `
      <div onclick="uploadEvidence()"
           class="aspect-square bg-transparent border-2 border-dashed border-gray-300 dark:border-neutral-600 
                  rounded-lg flex flex-col items-center justify-center cursor-pointer 
                  hover:border-gray-400 dark:hover:border-neutral-400 transition-all">
        <i class="uil uil-plus text-4xl text-gray-400"></i>
        <span class="text-xs text-gray-400 mt-1">Add</span>
      </div>
    `,
    );
  }

  updateEvidenceCount(evidenceList.length);
}

function updateEvidenceCount(count) {
  const badge = document.getElementById("evidenceCount");
  if (badge) badge.textContent = count;
}

function buildEvidenceTile(ev) {
  const isImage = ev.file_type.startsWith("image/");
  const isVideo = ev.file_type.startsWith("video/");
  const isAudio = ev.file_type.startsWith("audio/");

  let preview = `<i class="uil uil-file text-4xl text-gray-400"></i>`;
  if (isImage) {
    preview = `<img src="${ev.file_url}" alt="${ev.file_name}" class="w-full h-full object-cover" />`;
  } else if (isVideo) {
    preview = `<i class="uil uil-play-circle text-4xl text-gray-400"></i>`;
  } else if (isAudio) {
    preview = `<i class="uil uil-music text-4xl text-gray-400"></i>`;
  }

  // Encode ev safely for inline onclick
  const evEncoded = encodeURIComponent(JSON.stringify(ev));

  return `
    <div class="relative group aspect-square bg-gray-100 dark:bg-neutral-700 rounded-lg 
                flex items-center justify-center cursor-pointer 
                hover:scale-105 hover:shadow-md transition-all overflow-hidden"
         onclick="openEvidenceModal(decodeURIComponent('${evEncoded}'))">
      ${preview}
      <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 
                  transition-opacity flex flex-col items-center justify-center gap-1 p-2">
        <p class="text-white text-xs font-medium text-center line-clamp-2">${ev.file_name}</p>
        <p class="text-white/60 text-[10px]">${ev.uploaded_by}</p>
      </div>
      <button onclick="event.stopPropagation(); confirmDeleteEvidence(${ev.id}, '${ev.file_name.replace(/'/g, "\\'")}')"
              class="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 rounded-full 
                     flex items-center justify-center opacity-0 group-hover:opacity-100 
                     transition-opacity hover:bg-red-600 z-10">
        <i class="uil uil-times text-white text-xs"></i>
      </button>
    </div>
  `;
}

function openEvidenceModal(evRaw) {
  const ev = typeof evRaw === "string" ? JSON.parse(evRaw) : evRaw;
  const isImage = ev.file_type.startsWith("image/");
  const isVideo = ev.file_type.startsWith("video/");
  const isAudio = ev.file_type.startsWith("audio/");

  let previewBody = "";
  if (isImage) {
    previewBody = `<img src="${ev.file_url}" alt="${ev.file_name}" class="max-h-96 max-w-full rounded-lg object-contain mx-auto" />`;
  } else if (isVideo) {
    previewBody = `<video src="${ev.file_url}" controls class="max-h-96 max-w-full rounded-lg mx-auto"></video>`;
  } else if (isAudio) {
    previewBody = `
      <div class="flex flex-col items-center gap-4 py-6">
        <i class="uil uil-music text-6xl text-gray-400"></i>
        <audio src="${ev.file_url}" controls class="w-full"></audio>
      </div>`;
  } else {
    previewBody = `
      <div class="flex flex-col items-center gap-3 py-6">
        <i class="uil uil-file-alt text-6xl text-gray-400"></i>
        <p class="text-sm text-gray-600 dark:text-gray-400">${ev.file_name}</p>
      </div>`;
  }

  modalManager.create({
    id: "evidenceViewModal",
    icon: "uil-image",
    iconColor: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-100 dark:bg-purple-900/20",
    title: "Evidence Viewer",
    subtitle: ev.file_name,
    body: `
      <div class="space-y-3">
        ${previewBody}
        <div class="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-100 dark:border-neutral-600">
          <div>
            <span class="text-gray-500 dark:text-neutral-400">Uploaded by</span>
            <p class="font-semibold text-gray-800 dark:text-neutral-200">${ev.uploaded_by}</p>
          </div>
          <div>
            <span class="text-gray-500 dark:text-neutral-400">Uploaded at</span>
            <p class="font-semibold text-gray-800 dark:text-neutral-200">${ev.uploaded_at}</p>
          </div>
        </div>
      </div>
    `,
    primaryButton: {
      text: "Download",
      icon: "uil-download-alt",
      class: "bg-purple-500 hover:bg-purple-600",
    },
    secondaryButton: { text: "Close" },
    onPrimary: () => {
      const a = document.createElement("a");
      a.href = ev.file_url;
      a.download = ev.file_name;
      a.click();
      modalManager.close("evidenceViewModal");
    },
  });

  modalManager.show("evidenceViewModal");
}

function confirmDeleteEvidence(evidenceId, fileName) {
  modalManager.create({
    id: "deleteEvidenceModal",
    icon: "uil-trash-alt",
    iconColor: "text-red-600 dark:text-red-400",
    iconBg: "bg-red-100 dark:bg-red-900/60",
    title: "Delete Evidence",
    subtitle: "This action cannot be undone",
    body: `<p class="text-xs text-center px-2">Are you sure you want to delete <strong>${fileName}</strong>? The file will be permanently removed.</p>`,
    showWarning: true,
    warningText: "This will permanently delete the file from the server.",
    primaryButton: {
      text: "Yes, Delete",
      icon: "uil-trash-alt",
      class: "bg-red-500 hover:bg-red-600",
    },
    secondaryButton: { text: "Cancel" },
    onPrimary: async () => {
      await deleteEvidence(evidenceId);
      modalManager.close("deleteEvidenceModal");
    },
  });

  modalManager.show("deleteEvidenceModal");
}

async function deleteEvidence(evidenceId) {
  try {
    const response = await fetch(
      `api/incident_details/fetch_evidence.php?incident_id=${incidentId}&id=${evidenceId}`,
      { method: "DELETE" },
    );
    const result = await response.json();

    if (result.success) {
      showToast("success", "Evidence deleted");
      fetchEvidence();
    } else {
      showToast("error", result.error || "Failed to delete evidence");
    }
  } catch (err) {
    showToast("error", "Failed to delete evidence");
  }
}

// Fetch incident notes
async function fetchIncidentNotes() {
  try {
    const response = await fetch(
      `api/incident_details/fetch_incident_notes.php?incident_id=${incidentId}`,
    );
    const result = await response.json();

    if (result.success) {
      renderNotes(result.data);
    }
  } catch (error) {
    console.error("Fetch notes error:", error);
  }
}

// Track rendered note IDs (same pattern as evidence)
const renderedNoteIds = new Set();

function renderNotes(notes) {
  const remarksList = document.getElementById("remarksList");
  remarksList.innerHTML = "";
  renderedNoteIds.clear();

  if (notes.length === 0) {
    remarksList.innerHTML =
      '<p class="text-center text-sm text-gray-500 dark:text-gray-400 py-4">No admin notes yet</p>';
    return;
  }

  notes.forEach((note) => {
    const div = document.createElement("div");
    div.className = "bg-gray-50 dark:bg-neutral-700 rounded-lg p-3";
    div.innerHTML = `
      <div class="flex justify-between items-center mb-1.5">
        <span class="font-semibold text-sm text-gray-900 dark:text-neutral-300">${note.admin_name}</span>
        <span class="text-xs text-gray-500 dark:text-neutral-300">${note.time ?? note.created_at}</span>
      </div>
      <div class="text-xs text-gray-600 dark:text-neutral-400 leading-relaxed">${note.note}</div>
    `;
    remarksList.appendChild(div);
    renderedNoteIds.add(note.id);
  });
}

// appendNoteItems — prepend instead of append
function appendNoteItems(newNotes) {
  const list = document.getElementById("remarksList");
  const empty = list.querySelector("p");
  if (empty) empty.remove();

  const toAdd = newNotes.filter((note) => !renderedNoteIds.has(note.id));
  if (toAdd.length === 0) return;

  toAdd.forEach((note) => {
    const div = document.createElement("div");
    div.className = "bg-gray-50 dark:bg-neutral-700 rounded-lg p-3";
    div.innerHTML = `
      <div class="flex justify-between items-center mb-1.5">
        <span class="font-semibold text-sm text-gray-900 dark:text-neutral-300">${note.admin_name}</span>
        <span class="text-xs text-gray-500 dark:text-neutral-300">${note.time ?? note.created_at}</span>
      </div>
      <div class="text-xs text-gray-600 dark:text-neutral-400 leading-relaxed">${note.note}</div>
    `;
    // ← prepend so newest is at top
    list.insertBefore(div, list.firstChild);
    renderedNoteIds.add(note.id);
  });
}

// Fetch incident timeline
async function fetchIncidentTimeline() {
  try {
    const response = await fetch(
      `api/incident_details/fetch_incident_timeline.php?incident_id=${incidentId}`,
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
      const isFirst = index === 0; // first in DESC = most recent
      return `
      <div class="relative pl-8 ${index !== timelineItems.length - 1 ? "pb-6" : ""}">
        <div class="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-blue-500 border-4 border-blue-100 dark:bg-blue-700 dark:border-blue-900 ${
          isFirst ? "animate-pulse" : ""
        }"></div>
        ${
          index !== timelineItems.length - 1
            ? '<div class="absolute left-[7px] top-5 w-0.5 h-full bg-gray-200 dark:bg-neutral-600"></div>'
            : ""
        }
        <div class="flex justify-between items-center mb-1">
          <span class="font-semibold text-gray-900 dark:text-neutral-300 text-sm">${item.title}</span>
          <span class="text-xs text-gray-500">${item.time}</span>
        </div>
        <div class="text-sm text-gray-500 leading-relaxed">${item.description}</div>
        <div class="text-xs text-gray-500 mt-1">By: ${item.actor}</div>
      </div>
    `;
    })
    .join("");
}

function updateActionButtons(status, hasReport) {
  const generateReportBtn = document.getElementById("generateReportBtn");
  const forceResolveBtn = document.getElementById("forceResolveBtn");
  const quickActionsCard = document.getElementById("quickActionsCard");

  const reportVisible = !!hasReport;
  const forceResolveVisible = !forceResolveBtn?.classList.contains("hidden");

  if (reportVisible) {
    generateReportBtn.classList.remove("hidden");
  } else {
    generateReportBtn.classList.add("hidden");
  }

  // Hide the entire card if no buttons are visible
  if (!reportVisible && !forceResolveVisible) {
    quickActionsCard?.classList.add("hidden");
  } else {
    quickActionsCard?.classList.remove("hidden");
  }
}

async function getAddressFromCoordinates(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { "User-Agent": "SafeChain/1.0" } },
    );
    const data = await response.json();
    const a = data.address ?? {};

    console.log("Nominatim address:", a); // remove after confirming

    return {
      street: a.road ?? a.pedestrian ?? a.path ?? "N/A",
      barangay: a.suburb ?? a.village ?? a.neighbourhood ?? a.quarter ?? "N/A",
      city: a.city ?? a.town ?? a.municipality ?? "N/A",
    };
  } catch (err) {
    console.error(err);
    return { street: "N/A", barangay: "N/A", city: "N/A" };
  }
}

// Populate the page with incident data
async function populateIncidentDetails(incident) {
  // Update breadcrumb and title
  document.getElementById("breadcrumbIncidentId").textContent = incident.id;

  // Update incident overview
  document.querySelector(".inline-flex.items-center.gap-2.px-4").innerHTML = `
    <i class="uil uil-${getIncidentIcon(incident.type)} text-xl"></i>
    ${getIncidentTypeLabel(incident.type)}
  `;

  document.querySelector(".inline-flex.items-center.gap-2.px-4").className =
    `inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm mb-5 ${getIncidentTypeColor(
      incident.type,
    )}`;

  // Update incident details
  document.querySelectorAll(
    ".grid.grid-cols-1.md\\:grid-cols-2.gap-5",
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

  updateStatusBadge(incident.status);
  populateResponderBanner(incident);
  updateActionButtons(incident.status, !!incident.report_description);

  // Hide description label + box if no report
  const descriptionSection = document.getElementById("descriptionSection");
  const descriptionBox = document.querySelector(
    ".bg-gray-50.dark\\:bg-neutral-700.border-l-4.border-blue-500",
  );

  if (incident.report_description) {
    descriptionBox.textContent = incident.report_description;
    descriptionSection?.classList.remove("hidden");
  } else {
    descriptionSection?.classList.add("hidden");
  }

  // ── Medical Conditions ────────────────────────────────────────────────────
  const medCard = document.getElementById("medicalConditionsCard");
  const medContainer = document.getElementById("medicalBadgesContainer");

  const conditions = incident.medical_conditions;

  if (Array.isArray(conditions) && conditions.length > 0) {
    medContainer.innerHTML = conditions
      .map(
        (condition) => `
        <span class="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold 
                      bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 
                      border border-red-200 dark:border-red-800">
          <i class="uil uil-heartbeat mr-1.5 text-sm"></i>
          ${condition}
        </span>
      `,
      )
      .join("");
    medCard.classList.remove("hidden");
  } else {
    medCard.classList.add("hidden");
  }

  const geocodedAddress =
    incident.lat && incident.lng
      ? await getAddressFromCoordinates(incident.lat, incident.lng)
      : "N/A";

  // Update location details (keep static for now, but you can make this dynamic too)
  if (incident.lat && incident.lng) {
    const { street, barangay, city } = await getAddressFromCoordinates(
      incident.lat,
      incident.lng,
    );
    document.getElementById("locationAddress").textContent = street;
    document.getElementById("locationBarangay").textContent = barangay;
    document.getElementById("locationCity").textContent = city;
  } else {
    document.getElementById("locationAddress").textContent = "N/A";
    document.getElementById("locationBarangay").textContent = "N/A";
    document.getElementById("locationCity").textContent = "N/A";
  }

  document.getElementById("coordinates").textContent =
    incident.lat && incident.lng ? `${incident.lat}, ${incident.lng}` : "N/A";

  // Update reporter details
  if (incident.reporter_name) {
    // Fetch address from coordinates

    document.querySelectorAll(
      ".grid.grid-cols-1.md\\:grid-cols-2.gap-5",
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

  // ── Seed responder marker from DB location (shown immediately on load) ───
  if (incident.status === 'responding' && incident.responder_location) {
    const loc = incident.responder_location;
    // Retry until placeOrMoveMarker is ready (assigned by Pusher IIFE)
    let seedAttempts = 0;
    const seedInterval = setInterval(() => {
      if (window.placeOrMoveMarker) {
        clearInterval(seedInterval);
        window.placeOrMoveMarker(loc.latitude, loc.longitude);
        window.updateLastSeenLabel?.(loc.updated_at);
        // Fit map to show both responder and incident marker
        if (incidentMarker) {
          const bounds = L.latLngBounds(
            [loc.latitude, loc.longitude],
            incidentMarker.getLatLng()
          );
          map.fitBounds(bounds.pad(0.3));
        }
      } else if (++seedAttempts > 20) {
        clearInterval(seedInterval); // give up after 2s
      }
    }, 100);
  }
}

async function forceResolve() {
  modalManager.create({
    id: "forceResolveModal",
    icon: "uil-exclamation-triangle",
    iconColor: "text-orange-600 dark:text-orange-400",
    iconBg: "bg-orange-100 dark:bg-orange-900/60",
    title: "Force Resolve Incident",
    subtitle: "Admin override — use only when responder is unreachable",
    body: `
      <p class="text-xs text-center px-2 mb-3">
        This incident has been in <strong>responding</strong> status for over 6 hours. 
        Force resolving will close it administratively.
      </p>
      <textarea id="forceResolveReason" rows="3" 
        placeholder="Reason for force resolving..."
        class="w-full p-3 border-2 border-gray-200 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white rounded-lg text-sm resize-none focus:outline-none focus:border-orange-500"></textarea>
    `,
    showWarning: true,
    warningText: "This will override the responder's active session.",
    primaryButton: {
      text: "Force Resolve",
      icon: "uil-check",
      class: "bg-orange-500 hover:bg-orange-600",
    },
    secondaryButton: { text: "Cancel" },
    onPrimary: async () => {
      const reason = document.getElementById("forceResolveReason").value.trim();
      if (!reason) {
        showToast("error", "Please provide a reason");
        return;
      }

      try {
        const response = await fetch(
          "api/incident_details/update_incident_status.php",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: incidentId,
              status: "resolved",
              admin_name: currentAdminName,
              notes: `[Force Resolved by Admin] ${reason}`,
            }),
          },
        );

        const result = await response.json();
        if (result.success) {
          updateStatusBadge("resolved");
          document.getElementById("forceResolveBtn").classList.add("hidden");
          showToast("success", "Incident force resolved");
          fetchIncidentTimeline();
          fetchIncidentNotes();
        } else {
          showToast("error", result.error || "Failed to force resolve");
        }
      } catch (err) {
        showToast("error", "Failed to force resolve");
      }

      modalManager.close("forceResolveModal");
    },
  });

  modalManager.show("forceResolveModal");
}

function populateResponderBanner(incident) {
  const banner = document.getElementById("responderBanner");
  const nameEl = document.getElementById("responderName");
  const statusEl = document.getElementById("responderStatus");
  const avatarImg = document.getElementById("responderAvatar");
  const avatarFallback = document.getElementById("responderAvatarFallback");
  const forceResolveBtn = document.getElementById("forceResolveBtn");

  // Show banner only if someone is assigned
  if (!incident.dispatched_to) {
    banner.classList.add("hidden");
    forceResolveBtn.classList.add("hidden");
    return;
  }

  banner.classList.remove("hidden");
  nameEl.textContent =
    incident.responder_name ?? incident.dispatched_by ?? incident.dispatched_to;

  if (incident.status === "responding") {
    statusEl.textContent = "Currently responding";
    statusEl.className = "text-xs text-blue-600 dark:text-blue-400";
    const trackBtn = document.getElementById("trackResponderBtn");
    if (trackBtn) { trackBtn.style.display = "flex"; }
  } else if (incident.status === "resolved") {
    statusEl.textContent = "Resolved this incident";
    statusEl.className = "text-xs text-green-500 dark:text-green-400";
    const trackBtn = document.getElementById("trackResponderBtn");
    if (trackBtn) { trackBtn.style.display = "none"; }
  }

  // Avatar
  if (incident.responder_avatar) {
    avatarImg.src = `https://safechain.site/${incident.responder_avatar}`;
    avatarImg.classList.remove("hidden");
    avatarFallback.classList.add("hidden");
  } else {
    avatarImg.classList.add("hidden");
    avatarFallback.classList.remove("hidden");
  }

  // Force Resolve: only when stuck responding > 6 hours
  if (incident.status === "responding" && incident.dispatched_at) {
    const dispatchedAt = new Date(incident.dispatched_at);
    const hoursElapsed =
      (Date.now() - dispatchedAt.getTime()) / (1000 * 60 * 60);
    if (hoursElapsed >= 6) {
      forceResolveBtn.classList.remove("hidden");
    }
  }
}

// ✅ NEW FUNCTION: Update map with incident location and icon
function updateIncidentMap(incident) {
  const incidentLocation = [parseFloat(incident.lat), parseFloat(incident.lng)];

  map.setView(incidentLocation, 16);

  if (incidentMarker) map.removeLayer(incidentMarker);

  if (window.corroboratorMarkers) {
    window.corroboratorMarkers.forEach((m) => map.removeLayer(m));
  }
  if (window.corroboratorCircles) {
    window.corroboratorCircles.forEach((c) => map.removeLayer(c));
  }
  window.corroboratorMarkers = [];
  window.corroboratorCircles = [];

  map.eachLayer((layer) => {
    if (layer instanceof L.Circle) map.removeLayer(layer);
  });

  const iconMap = { fire: fireIcon, flood: floodIcon, crime: crimeIcon };
  const circleColors = { fire: "#dc2626", flood: "#3B82F6", crime: "#FBBF24" };
  const circleColor = circleColors[incident.type] || "#dc2626";
  const hasRescue = incident.rescue?.count > 0;

  // ── Main incident marker ──────────────────────────────────────────
  incidentMarker = L.marker(incidentLocation, {
    icon: iconMap[incident.type] || fireIcon,
  }).addTo(map).bindPopup(`
            <div class="p-1">
                <p class="font-bold text-sm">${getIncidentTypeLabel(incident.type)}</p>
                <p class="text-xs text-gray-500">${incident.reporter} — Original Report</p>
                <p class="text-xs text-gray-400">${incident.location}</p>
            </div>
        `);

  // ── Corroborator markers ──────────────────────────────────────────
  const corroborators = (incident.corroborator_locations || []).filter(
    (c) => c.lat != 0 && c.lng != 0,
  );

  corroborators.forEach((c) => {
    const pos = [parseFloat(c.lat), parseFloat(c.lng)];
    const isRescue = c.needs_rescue == 1;

    const corroIcon = L.divIcon({
      className: "",
      html: `
                <div style="
                    position: relative;
                    width: 32px; height: 32px;
                ">
                    ${
                      isRescue
                        ? `
                        <div style="
                            position: absolute; top: 0; left: 0;
                            width: 32px; height: 32px;
                            border-radius: 50%;
                            background: rgba(239,68,68,0.3);
                            animation: ping 1s cubic-bezier(0,0,0.2,1) infinite;
                        "></div>
                    `
                        : ""
                    }
                    <div style="
                        position: absolute; top: 0; left: 0;
                        width: 32px; height: 32px;
                        background: ${isRescue ? "#ef4444" : "#6b7280"};
                        border-radius: 50%;
                        display: flex; align-items: center; justify-content: center;
                        border: 3px solid white;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    ">
                        <i class="uil ${isRescue ? "uil-ambulance" : "uil-user"}"
                           style="color:white; font-size:14px;"></i>
                    </div>
                </div>
            `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const medConditions =
      c.medical_conditions?.length > 0
        ? `<p class="text-xs text-amber-600 mt-1">⚠️ ${c.medical_conditions.join(", ")}</p>`
        : "";

    const marker = L.marker(pos, { icon: corroIcon }).addTo(map).bindPopup(`
                <div class="p-1">
                    <p class="font-bold text-sm ${isRescue ? "text-red-600" : ""}">${c.name}</p>
                    ${
                      isRescue
                        ? '<p class="text-xs font-semibold text-red-500">🆘 Needs Rescue</p>'
                        : '<p class="text-xs text-gray-500">Corroborating Reporter</p>'
                    }
                    ${c.contact ? `<p class="text-xs text-gray-400">${c.contact}</p>` : ""}
                    ${medConditions}
                </div>
            `);

    window.corroboratorMarkers.push(marker);
  });

  // ── Coverage circle based on ACTUAL spread between all reporters ──
  if (corroborators.length > 0) {
    // Collect all reporter coordinates including original
    const allPoints = [
      incidentLocation,
      ...corroborators.map((c) => [parseFloat(c.lat), parseFloat(c.lng)]),
    ];

    // Find centroid (average of all points)
    const centroid = allPoints
      .reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0])
      .map((v) => v / allPoints.length);

    // Find max distance from centroid to any reporter (in meters)
    const maxDistMeters = Math.max(
      ...allPoints.map((p) => {
        const R = 6371000; // Earth radius in meters
        const dLat = ((p[0] - centroid[0]) * Math.PI) / 180;
        const dLng = ((p[1] - centroid[1]) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((centroid[0] * Math.PI) / 180) *
            Math.cos((p[0] * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      }),
    );

    // Add a small buffer (10m) so the circle isn't edge-to-edge tight
    // Also enforce a minimum of 25m so single-location corroborations
    // still show a visible circle
    const radius = Math.max(25, maxDistMeters + 10);

    const coverageCircle = L.circle(centroid, {
      color: hasRescue ? "#ef4444" : circleColor,
      fillColor: hasRescue ? "#ef4444" : circleColor,
      fillOpacity: hasRescue ? 0.25 : 0.15,
      opacity: hasRescue ? 0.7 : 0.5,
      radius,
      dashArray: hasRescue ? "6, 4" : null,
      weight: hasRescue ? 2 : 1.5,
    }).addTo(map);

    window.corroboratorCircles.push(coverageCircle);

    // Fit map to show all markers with padding
    map.fitBounds(L.latLngBounds(allPoints).pad(0.3));
  } else {
    // Only original reporter — small fixed circle
    const coverageCircle = L.circle(incidentLocation, {
      color: hasRescue ? "#ef4444" : circleColor,
      fillColor: hasRescue ? "#ef4444" : circleColor,
      fillOpacity: 0.15,
      opacity: 0.5,
      radius: 25,
      weight: 1.5,
    }).addTo(map);

    window.corroboratorCircles.push(coverageCircle);
  }


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
let selectedFiles = [];

const map = L.map("incidentMap", { maxZoom: 21 }).setView(incidentLocation, 16);

const isOnline = navigator.onLine;

// Determine tile URLs based on online status
const lightTileUrl = isOnline
  ? "https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=XTXjcHDPMSRZi9uVEw8c"
  : "assets/tiles/street-v2/{z}/{x}/{y}.png";

const darkTileUrl = isOnline
  ? "https://api.maptiler.com/maps/streets-v2-dark/{z}/{x}/{y}.png?key=XTXjcHDPMSRZi9uVEw8c"
  : "assets/tiles/street-v2-dark/{z}/{x}/{y}.png";

// Create tile layers with error fallback
const lightLayer = L.tileLayer(lightTileUrl, {
  maxZoom: 21,
  maxNativeZoom: 21,
  attribution:
    '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>',
}).on("tileerror", function (error, tile) {
  const url = tile.tile.src;
  const matches = url.match(/\/(\d+)\/(\d+)\/(\d+)\.png/);

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
  const url = tile.tile.src;
  const matches = url.match(/\/(\d+)\/(\d+)\/(\d+)\.png/);

  if (matches) {
    const [, z, x, y] = matches;
    tile.tile.src = `assets/tiles/street-v2-dark/${z}/${x}/${y}.png`;
  }
});

// Listen for online/offline changes and update both layers
window.addEventListener("online", () => {
  lightLayer.setUrl(
    "https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=XTXjcHDPMSRZi9uVEw8c",
  );
  darkLayer.setUrl(
    "https://api.maptiler.com/maps/streets-v2-dark/{z}/{x}/{y}.png?key=XTXjcHDPMSRZi9uVEw8c",
  );
});

window.addEventListener("offline", () => {
  lightLayer.setUrl("assets/tiles/street-v2/{z}/{x}/{y}.png");
  darkLayer.setUrl("assets/tiles/street-v2-dark/{z}/{x}/{y}.png");
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

// Initialize marker variables
let incidentMarker = null;

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
        const response = await fetch(
          "api/incident_details/update_incident_status.php",
          {
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
          },
        );

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
        const response = await fetch(
          "api/incident_details/update_incident_status.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: incidentId,
              status: "resolved",
              admin_name: `Admin ${currentAdminName}`,
            }),
          },
        );

        const result = await response.json();

        if (result.success) {
          updateStatusBadge("resolved");
          showToast("success", "Incident marked as RESOLVED");

          // Refresh timeline to show new entry
          fetchIncidentTimeline();
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
        <div class="border-2 border-dashed border-gray-300 dark:border-neutral-600 rounded-lg p-6 text-center 
                    hover:border-purple-400 dark:hover:border-purple-500 transition-colors cursor-pointer" 
             onclick="document.getElementById('evidenceFileInput').click()">
          <i class="uil uil-cloud-upload text-5xl text-gray-400 mb-3"></i>
          <p class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Click to browse files</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Images, Videos, PDF, DOC, DOCX (max 50MB)</p>
        </div>

        <input type="file" id="evidenceFileInput" 
               accept="image/*,video/*,.pdf,.doc,.docx" 
               multiple class="hidden" 
               onchange="handleFileSelection(event)">

        <div id="selectedFilesList" class="space-y-2 max-h-52 overflow-y-auto"></div>

        <!-- Upload progress (shown during upload) -->
        <div id="uploadProgress" class="hidden">
          <div class="flex justify-between text-xs text-gray-500 dark:text-neutral-400 mb-1">
            <span id="uploadFileName">Uploading...</span>
            <span id="uploadPercent">0%</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-neutral-600 rounded-full h-1.5">
            <div id="uploadProgressBar" class="bg-purple-500 h-1.5 rounded-full transition-all duration-200" style="width:0%"></div>
          </div>
        </div>
      </div>
    `,
    primaryButton: {
      text: "Upload Files",
      icon: "uil-check",
      class: "bg-purple-500 hover:bg-purple-600",
    },
    secondaryButton: { text: "Cancel" },
    onPrimary: async () => {
      if (selectedFiles.length === 0) {
        showToast("error", "Please select at least one file");
        return;
      }
      await uploadSelectedFiles();
      modalManager.close("uploadEvidenceModal");
    },
  });

  modalManager.show("uploadEvidenceModal");
}

async function uploadSelectedFiles() {
  const progress = document.getElementById("uploadProgress");
  const bar = document.getElementById("uploadProgressBar");
  const percent = document.getElementById("uploadPercent");
  const fileName = document.getElementById("uploadFileName");

  let successCount = 0;

  for (const file of selectedFiles) {
    progress.classList.remove("hidden");
    fileName.textContent = file.name;
    bar.style.width = "0%";
    percent.textContent = "0%";

    const formData = new FormData();
    formData.append("file", file);

    try {
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(
          "POST",
          `api/incident_details/upload_evidence.php?incident_id=${incidentId}`,
        );

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            bar.style.width = pct + "%";
            percent.textContent = pct + "%";
          }
        };

        xhr.onload = () => {
          try {
            const result = JSON.parse(xhr.responseText);
            result.success
              ? resolve(result.data)
              : reject(new Error(result.error));
          } catch {
            reject(new Error("Invalid server response"));
          }
        };

        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(formData);
      });

      successCount++;
    } catch (err) {
      showToast("error", `Failed to upload ${file.name}: ${err.message}`);
    }
  }

  progress.classList.add("hidden");

  if (successCount > 0) {
    showToast("success", `${successCount} file(s) uploaded successfully`);
    fetchEvidence(); // refresh the grid
    fetchIncidentTimeline(); // log it in the timeline
  }

  selectedFiles = [];
}

function handleFileSelection(event) {
  const files = Array.from(event.target.files);
  files.forEach((file) => {
    if (
      !selectedFiles.find((f) => f.name === file.name && f.size === file.size)
    ) {
      selectedFiles.push(file);
    }
  });
  updateFilesList();
  event.target.value = "";
}

function updateFilesList() {
  const filesList = document.getElementById("selectedFilesList");
  if (!filesList) return;

  if (selectedFiles.length === 0) {
    filesList.innerHTML =
      '<p class="text-center text-sm text-gray-500 dark:text-gray-400 py-4">No files selected</p>';
    return;
  }

  filesList.innerHTML = selectedFiles
    .map((file, index) => {
      const size =
        file.size > 1024 * 1024
          ? (file.size / (1024 * 1024)).toFixed(2) + " MB"
          : (file.size / 1024).toFixed(1) + " KB";

      let iconClass = "uil-image",
        iconColor = "text-purple-600";
      if (file.type.startsWith("video/")) {
        iconClass = "uil-video";
        iconColor = "text-blue-600";
      } else if (file.type === "application/pdf") {
        iconClass = "uil-file-alt";
        iconColor = "text-red-600";
      } else if (file.type.includes("word")) {
        iconClass = "uil-file-edit-alt";
        iconColor = "text-blue-700";
      }

      return `
      <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-700 rounded-lg group">
        <i class="uil ${iconClass} text-2xl ${iconColor} flex-shrink-0"></i>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">${file.name}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">${size}</p>
        </div>
        <button onclick="removeFile(${index})"
                class="flex-shrink-0 p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
          <i class="uil uil-times text-lg text-red-600 dark:text-red-400"></i>
        </button>
      </div>
    `;
    })
    .join("");
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  updateFilesList();
}

// Generate Report
function generateReport() {
  modalManager.create({
    id: "reportModal",
    icon: "uil-file-download",
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
    title: "Generate Incident Report",
    subtitle: "Export incident details as PDF",
    body: `
      <div class="space-y-3">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          This will generate a printable PDF using the Barangay report template.
        </p>
        <div class="space-y-2">
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300">Action</label>
          <div class="flex gap-2">
            <button id="openReportBtn"
              class="w-1/2 px-4 py-2 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600 transition-all">
              Open & Print
            </button>
            <button id="downloadReportBtn"
              class="w-1/2 px-4 py-2 bg-white dark:bg-neutral-700 dark:text-neutral-300 border border-gray-200 dark:border-neutral-600 rounded-lg text-xs hover:bg-gray-50 transition-all">
              Download PDF
            </button>
          </div>
        </div>
      </div>
    `,
    primaryButton: { text: "Close" },
    secondaryButton: { text: "Cancel" },
    onPrimary: () => modalManager.close("reportModal"),
  });

  modalManager.show("reportModal");

  setTimeout(() => {
    const reportUrl = `api/incident_details/generate_report.php?id=${encodeURIComponent(incidentId)}&admin_name=${encodeURIComponent(currentAdminName)}`;

    // Open & Print — opens the report page, user prints from there
    document.getElementById("openReportBtn")?.addEventListener("click", () => {
      window.open(reportUrl, "_blank");
      modalManager.close("reportModal");
      showToast("success", "Report opened in a new tab");
    });

    // Download PDF — opens in hidden iframe, clicks the download button automatically
    document
      .getElementById("downloadReportBtn")
      ?.addEventListener("click", () => {
        window.open(reportUrl + "&autodownload=1", "_blank");
        modalManager.close("reportModal");
        showToast("info", "PDF download will start in the new tab");
      });
  }, 50);
}

async function addRemark() {
  const remarkText = document.getElementById("newRemark").value.trim();

  if (!remarkText) {
    showToast("error", "Please enter a note before submitting");
    return;
  }

  try {
    const response = await fetch("api/incident_details/add_incident_note.php", {
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
      //fetchIncidentNotes();
      //fetchIncidentTimeline();
    } else {
      showToast("error", "Failed to add note: " + result.error);
    }
  } catch (error) {
    console.error("Add note error:", error);
    showToast("error", "Failed to add note");
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
  startSSE();
});


// ── Track responder button ────────────────────────────────────────────────────
let trackingActive = false;

function trackResponder() {
  const btn = document.getElementById("trackResponderBtn");

  if (!responderMarker) {
    showToast("info", "Waiting for responder location...");
    return;
  }

  if (!trackingActive) {
    // Pan map to responder and keep following
    trackingActive = true;
    btn.innerHTML = '<i class="uil uil-map-marker-slash"></i> Stop';
    btn.classList.replace("bg-blue-500", "bg-red-500");
    btn.classList.replace("hover:bg-blue-600", "hover:bg-red-600");
    map.setView(responderMarker.getLatLng(), 17);
    showToast("success", "Tracking responder location");
  } else {
    // Stop tracking — pan back to incident so admin sees the full picture
    trackingActive = false;
    btn.innerHTML = '<i class="uil uil-location-arrow"></i> Track';
    btn.classList.replace("bg-red-500", "bg-blue-500");
    btn.classList.replace("hover:bg-red-600", "hover:bg-blue-600");
    if (incidentMarker && window.responderMarker) {
      const bounds = L.latLngBounds(
        incidentMarker.getLatLng(),
        window.responderMarker.getLatLng()
      );
      map.fitBounds(bounds.pad(0.3));
    } else if (incidentMarker) {
      map.setView(incidentMarker.getLatLng(), 16);
    }
    showToast("info", "Stopped tracking");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PUSHER — Real-time responder location tracking
// Only activates when incident status is "responding"
// ═══════════════════════════════════════════════════════════════════════════

(function initResponderTracking() {
  // responderMarker is module-scoped so we can move it on each update
  let responderMarker = null;
  let pusherChannel  = null;
  let pusherInstance = null;

  // ── Inject pulsing dot CSS once ────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .responder-ring {
      position: absolute;
      inset: -6px;
      border-radius: 50%;
      border: 3px solid rgba(59,130,246,0.6);
      animation: responder-pulse 1.8s infinite;
      pointer-events: none;
    }
    @keyframes responder-pulse {
      0%   { transform: scale(0.9); opacity: 1; }
      70%  { transform: scale(1.3); opacity: 0; }
      100% { transform: scale(0.9); opacity: 0; }
    }
    .responder-label {
      background: #1D4ED8;
      color: white;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 99px;
      white-space: nowrap;
      margin-top: 3px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    }
  `;
  document.head.appendChild(style);

  function makeResponderIcon() {
    const avatar   = currentIncident?.responder_avatar;
    const name     = currentIncident?.responder_name ?? currentIncident?.dispatched_by ?? 'Responder';
    const innerHtml = avatar
      ? `<img src="https://safechain.site/${avatar}"
              style="width:42px;height:42px;border-radius:50%;object-fit:cover;
                     border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);" />`
      : `<div style="width:42px;height:42px;border-radius:50%;background:#3B82F6;
                     border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);
                     display:flex;align-items:center;justify-content:center;">
           <i class="uil uil-user" style="color:white;font-size:18px;"></i>
         </div>`;

    return L.divIcon({
      className: '',
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;">
          <div class="responder-ping" style="position:relative;width:42px;height:42px;">
            <div class="responder-ring"></div>
            ${innerHtml}
          </div>
          <div class="responder-label">${name}</div>
        </div>`,
      iconSize:   [80, 62],
      iconAnchor: [40, 21],
    });
  }

  function placeOrMoveMarker(lat, lng) {
    const latlng = [lat, lng];
    if (responderMarker) {
      responderMarker.setLatLng(latlng);
    } else {
      const name = currentIncident?.responder_name ?? currentIncident?.dispatched_by ?? 'Responder';
      responderMarker = L.marker(latlng, { icon: makeResponderIcon() })
        .addTo(map)
        .bindPopup(`<b>${name}</b><br><span style="font-size:11px;color:#6b7280;">Live location</span>`);
    }
  }

  let lastPingTime = null;
  let liveTickInterval = null;

  function updateLastSeenLabel(updatedAt) {
    lastPingTime = new Date(updatedAt);
    const el = document.getElementById('responderStatus');
    if (!el) return;
    el.className = 'text-xs text-blue-500 dark:text-blue-400 font-medium';

    // Start ticking if not already
    if (!liveTickInterval) {
      liveTickInterval = setInterval(() => {
        if (!lastPingTime) return;
        const el = document.getElementById('responderStatus');
        if (!el) return;
        const secAgo = Math.floor((Date.now() - lastPingTime.getTime()) / 1000);
        if (secAgo < 5) {
          el.textContent = '● Live — just now';
        } else if (secAgo < 60) {
          el.textContent = `● Live — ${secAgo}s ago`;
        } else {
          el.textContent = `● Live — ${Math.floor(secAgo / 60)}m ago`;
        }
      }, 1000);
    }

    // Show "just now" immediately on ping
    el.textContent = '● Live — just now';
  }

  function startPusher(incident) {
    if (incident.status !== 'responding') return;

    pusherInstance = new Pusher('e5c099a8d626646ef327', { cluster: 'ap1' });
    pusherChannel  = pusherInstance.subscribe('incident.' + incident.id);

    pusherChannel.bind('responder.location', function (payload) {
      placeOrMoveMarker(payload.latitude, payload.longitude);
      updateLastSeenLabel(payload.updated_at);
      // Pan map to follow responder if tracking is active
      if (trackingActive) {
        map.setView([payload.latitude, payload.longitude]);
      }
    });

    console.log('[Pusher] Subscribed to incident.' + incident.id);
  }

  function stopPusher() {
    if (pusherChannel && pusherInstance) {
      pusherChannel.unbind_all();
      pusherInstance.unsubscribe(pusherChannel.name);
    }
    pusherInstance?.disconnect();
    pusherInstance = null;
    pusherChannel  = null;
    if (liveTickInterval) {
      clearInterval(liveTickInterval);
      liveTickInterval = null;
    }
  }

  // Expose functions immediately so seed call in populateIncidentDetails can use them
  window.placeOrMoveMarker   = placeOrMoveMarker;
  window.updateLastSeenLabel = updateLastSeenLabel;
  Object.defineProperty(window, 'responderMarker', { get: () => responderMarker });

  // ── Wait for fetchIncidentDetails to populate currentIncident ─────────────
  // fetchIncidentDetails() sets currentIncident then calls populateIncidentDetails()
  // We hook in right after by polling until currentIncident is available.
  let attempts = 0;
  const waitForIncident = setInterval(function () {
    if (currentIncident) {
      clearInterval(waitForIncident);
      startPusher(currentIncident);
    } else if (++attempts > 40) {  // give up after ~4 seconds
      clearInterval(waitForIncident);
    }
  }, 100);

  // ── Clean up on page unload ───────────────────────────────────────────────
  window.addEventListener('beforeunload', stopPusher);
})();