// Initialize Map
const incidentLocation = [14.716412, 121.040834];
const barangayHall = [14.712429, 121.038435];
let routingControl = null;
let directionsActive = false;
let selectedFiles = [];

const map = L.map("incidentMap").setView(incidentLocation, 15);

// Create both light and dark tile layers
const lightLayer = L.tileLayer(
  "https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=2bXjFOI9q9BSiHQVwLb7",
  {
    attribution: '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>',
  }
);

const darkLayer = L.tileLayer(
  "https://api.maptiler.com/maps/streets-v2-dark/{z}/{x}/{y}.png?key=2bXjFOI9q9BSiHQVwLb7",
  {
    attribution: '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>',
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
}

// Listen for theme changes from sidebar.js
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.attributeName === "data-theme") {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      switchMapTheme(isDark);
    }
  });
});

observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-theme"]
});

const fireIcon = L.divIcon({
  className: "custom-icon",
  html: '<div style="background: #dc2626; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"><i class="uil uil-fire text-2xl text-white"></i></div>',
  iconSize: [40, 40],
});

const startIcon = L.divIcon({
  className: "custom-icon",
  html: '<div style="background: #10b981; width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><i class="uil uil-map-marker text-lg text-white"></i></div>',
  iconSize: [35, 35],
});

const incidentMarker = L.marker(incidentLocation, { icon: fireIcon })
  .addTo(map)
  .bindPopup("<b>Fire Emergency Location</b><br>123 Forest Hill, Gulod, Quezon City");

const startMarker = L.marker(barangayHall, { icon: startIcon }).bindPopup(
  "<b>Barangay Hall</b><br>Starting Point"
);

L.circle(incidentLocation, {
  color: "#dc2626",
  fillColor: "#dc2626",
  fillOpacity: 0.1,
  radius: 200,
}).addTo(map);


document.getElementById("zoomIn").addEventListener("click", () => map.zoomIn());
document
  .getElementById("zoomOut")
  .addEventListener("click", () => map.zoomOut());

// Toggle Directions with Dynamic Route Name
function toggleDirections() {
  const btn = document.getElementById("toggleDirections");
  const routeInfo = document.getElementById("routeInfo");

  if (!directionsActive) {
    startMarker.addTo(map);

    routingControl = L.Routing.control({
      waypoints: [
        L.latLng(barangayHall[0], barangayHall[1]),
        L.latLng(incidentLocation[0], incidentLocation[1]),
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
        // Get road names from the instruction text
        if (instruction.road) {
          routeNames.push(instruction.road);
        }
      });

      // Remove duplicates and filter out empty strings
      const uniqueRoutes = [...new Set(routeNames)].filter(name => name && name.trim() !== '');

      // Create route display text
      let routeText = "Direct Route";
      if (uniqueRoutes.length > 0) {
        if (uniqueRoutes.length === 1) {
          routeText = `Via ${uniqueRoutes[0]}`;
        } else if (uniqueRoutes.length === 2) {
          routeText = `Via ${uniqueRoutes[0]} and ${uniqueRoutes[1]}`;
        } else {
          // Show first 2-3 main roads
          const mainRoads = uniqueRoutes.slice(0, 2);
          routeText = `Via ${mainRoads.join(", ")} and ${uniqueRoutes.length - 2} more`;
        }
      }

      // Update UI
      document.getElementById("routeDistance").textContent = distanceKm + " km";
      document.getElementById("routeTime").textContent = timeMin + " minutes";
      document.getElementById("routeName").textContent = routeText;

      routeInfo.classList.remove("hidden");

      // Optional: Log for debugging
      console.log("Route instructions:", instructions);
      console.log("Unique routes:", uniqueRoutes);
    });

    btn.innerHTML = '<i class="uil uil-times text-base"></i> Hide Directions';
    directionsActive = true;
    showToast('info', 'Directions displayed on map');
  } else {
    if (routingControl) {
      map.removeControl(routingControl);
      routingControl = null;
    }
    map.removeLayer(startMarker);
    routeInfo.classList.add("hidden");

    btn.innerHTML = '<i class="uil uil-map-marker text-base"></i> Show Directions';
    directionsActive = false;

    map.setView(incidentLocation, 15);
    showToast('info', 'Directions hidden');
  }
}

// Mark as Resolved
function markAsResolved() {
  modalManager.create({
    id: 'resolveModal',
    icon: 'uil-check-circle',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-100',
    title: 'Mark as Resolved',
    subtitle: 'Confirm incident resolution',
    body: '<p class="text-xs text-center px-2">Are you sure you want to mark this incident as <strong>RESOLVED</strong>? This will close the incident and update its status.</p>',
    showWarning: true,
    warningText: 'Once marked as resolved, this incident will be moved to the archive.',
    primaryButton: {
      text: 'Yes, Resolve',
      icon: 'uil-check',
      class: 'bg-emerald-500 hover:bg-emerald-600'
    },
    secondaryButton: {
      text: 'Cancel'
    },
    onPrimary: () => {
      const statusBadge = document.getElementById("statusBadge");
      statusBadge.className = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-600";
      statusBadge.innerHTML = '<span class="w-2 h-2 rounded-full bg-green-600 status-dot"></span> Resolved';

      addTimelineItem("Incident Marked as Resolved", "Incident successfully resolved by admin");
      showToast('success', 'Incident marked as RESOLVED');
      modalManager.close('resolveModal');
    }
  });

  modalManager.show('resolveModal');
}

// Update Status
function updateStatus() {
  modalManager.create({
    id: 'updateStatusModal',
    icon: 'uil-pen',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    title: 'Update Incident Status',
    subtitle: 'Change status and priority',
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
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Admin Notes</label>
          <textarea id="instructionsModal" rows="4" placeholder="Add notes about the status change..." class="w-full p-3 border-2 border-gray-200 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white rounded-lg text-sm resize-y focus:outline-none focus:border-blue-500"></textarea>
        </div>
      </div>
    `,
    primaryButton: {
      text: 'Update Status',
      icon: 'uil-check-circle'
    },
    secondaryButton: {
      text: 'Cancel'
    },
    onPrimary: () => {
      const status = document.getElementById("statusSelectModal");
      const priority = document.getElementById("prioritySelectModal");
      const notes = document.getElementById("instructionsModal");

      if (!status.value) {
        showToast('error', 'Please select a status');
        return;
      }

      const statusText = status.options[status.selectedIndex].text;
      const statusValue = status.value;
      const priorityText = priority.options[priority.selectedIndex].text;

      const statusBadge = document.getElementById("statusBadge");

      let bgColor = "", textColor = "", dotColor = "", statusDisplay = "";
      if (statusValue === "pending") {
        bgColor = "bg-yellow-100";
        textColor = "text-yellow-600";
        dotColor = "bg-yellow-600";
        statusDisplay = "Pending Response";
      } else if (statusValue === "responding") {
        bgColor = "bg-blue-100";
        textColor = "text-blue-600";
        dotColor = "bg-blue-600";
        statusDisplay = "Active Response";
      } else if (statusValue === "resolved") {
        bgColor = "bg-green-100";
        textColor = "text-green-600";
        dotColor = "bg-green-600";
        statusDisplay = "Resolved";
      }

      statusBadge.className = `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${bgColor} ${textColor}`;
      statusBadge.innerHTML = `<span class="w-2 h-2 rounded-full ${dotColor} status-dot"></span> ${statusDisplay}`;

      addTimelineItem("Status Updated", `Status: ${statusText} | Priority: ${priorityText}`);

      if (notes.value) {
        addTimelineItem("Admin Note Added", notes.value);
      }

      showToast('success', `Status updated to: ${statusText}`);
      modalManager.close('updateStatusModal');
    }
  });

  modalManager.show('updateStatusModal');
}

function uploadEvidence() {
  selectedFiles = [];
  
  modalManager.create({
    id: 'uploadEvidenceModal',
    icon: 'uil-upload',
    iconColor: 'text-purple-600 dark:text-purple-400',
    iconBg: 'bg-purple-100 dark:bg-purple-900/20',
    title: 'Upload Evidence',
    subtitle: 'Add photos, videos, or documents',
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
      text: 'Upload Files',
      icon: 'uil-check',
      class: 'bg-purple-500 hover:bg-purple-600'
    },
    secondaryButton: {
      text: 'Cancel'
    },
    onPrimary: () => {
      if (selectedFiles.length === 0) {
        showToast('error', 'Please select at least one file');
        return;
      }
      
      showToast('info', `Uploading ${selectedFiles.length} file(s)...`);
      
      setTimeout(() => {
        addTimelineItem("Evidence Uploaded", `Admin uploaded ${selectedFiles.length} file(s) as evidence`);
        showToast('success', `${selectedFiles.length} file(s) uploaded successfully`);
        
        // Add placeholder images to grid
        const grid = document.querySelector('.grid.grid-cols-3');
        if (grid && grid.children.length < 6) {
          selectedFiles.slice(0, 3 - (grid.children.length - 1)).forEach((file, index) => {
            const newImg = document.createElement('div');
            newImg.className = 'aspect-square bg-gray-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center cursor-pointer hover:scale-105 hover:shadow-md transition-all overflow-hidden';
            
            // Show different icons based on file type
            let iconClass = 'uil-image';
            if (file.type.startsWith('video/')) {
              iconClass = 'uil-video';
            } else if (file.type === 'application/pdf') {
              iconClass = 'uil-file-alt';
            } else if (file.type.includes('document') || file.type.includes('word')) {
              iconClass = 'uil-file-edit-alt';
            }
            
            newImg.innerHTML = `<i class="uil ${iconClass} text-4xl text-gray-400"></i>`;
            newImg.onclick = () => openImageModal(file.name);
            grid.insertBefore(newImg, grid.lastElementChild);
          });
        }
        
        modalManager.close('uploadEvidenceModal');
        selectedFiles = [];
      }, 1500);
    }
  });

  modalManager.show('uploadEvidenceModal');
}

function triggerFileInput() {
  document.getElementById('evidenceFileInput').click();
}

function handleFileSelection(event) {
  const files = Array.from(event.target.files);
  
  files.forEach(file => {
    // Check if file is already selected
    if (!selectedFiles.find(f => f.name === file.name && f.size === file.size)) {
      selectedFiles.push(file);
    }
  });
  
  updateFilesList();
  event.target.value = ''; // Reset input to allow selecting same file again
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  updateFilesList();
}

function updateFilesList() {
  const filesList = document.getElementById('selectedFilesList');
  const fileCountDisplay = document.getElementById('fileCountDisplay');
  const fileCount = document.getElementById('fileCount');
  
  if (selectedFiles.length === 0) {
    filesList.innerHTML = '<p class="text-center text-sm text-gray-500 dark:text-gray-400 py-4">No files selected</p>';
    fileCountDisplay.classList.add('hidden');
    return;
  }
  
  fileCountDisplay.classList.remove('hidden');
  fileCount.textContent = selectedFiles.length;
  
  filesList.innerHTML = selectedFiles.map((file, index) => {
    const sizeKB = (file.size / 1024).toFixed(1);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const displaySize = file.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;
    
    // Determine icon based on file type
    let iconClass = 'uil-image';
    let iconColor = 'text-purple-600';
    if (file.type.startsWith('video/')) {
      iconClass = 'uil-video';
      iconColor = 'text-blue-600';
    } else if (file.type === 'application/pdf') {
      iconClass = 'uil-file-alt';
      iconColor = 'text-red-600';
    } else if (file.type.includes('document') || file.type.includes('word')) {
      iconClass = 'uil-file-edit-alt';
      iconColor = 'text-blue-700';
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
  }).join('');
}

// Generate Report
function generateReport() {
  modalManager.create({
    id: 'reportModal',
    icon: 'uil-file-download',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    title: 'Generate Incident Report',
    subtitle: 'Export incident details',
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
      text: 'Download Report',
      icon: 'uil-download-alt'
    },
    secondaryButton: {
      text: 'Cancel'
    },
    onPrimary: () => {
      showToast('info', 'Generating incident report...');
      
      setTimeout(() => {
        showToast('success', 'Report downloaded successfully');
        addTimelineItem("Report Generated", "PDF report generated: #EMG-2024-1047");
        modalManager.close('reportModal');
      }, 1500);
    }
  });

  modalManager.show('reportModal');
}

// Open Image Modal
function openImageModal(imageId) {
  modalManager.create({
    id: 'imageModal',
    icon: 'uil-image',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-100',
    title: 'Evidence Photo',
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
      text: 'Close',
      icon: 'uil-times'
    },
    onPrimary: () => modalManager.close("imageModal")
  });

  modalManager.show('imageModal');
}

// Add Remark
function addRemark() {
  const remarkText = document.getElementById("newRemark").value.trim();

  if (!remarkText) {
    showToast('error', 'Please enter a note before submitting');
    return;
  }

  const now = new Date();
  const timeString = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const remarksList = document.getElementById("remarksList");
  const newRemark = document.createElement("div");
  newRemark.className = "bg-gray-50 dark:bg-neutral-700 rounded-lg p-3 opacity-0 transition-opacity duration-300";
  newRemark.innerHTML = `
    <div class="flex justify-between items-center mb-1.5">
      <span class="font-semibold text-sm text-gray-900 dark:text-white">Admin - Current User</span>
      <span class="text-xs text-gray-500 dark:text-gray-400">${timeString}</span>
    </div>
    <div class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">${remarkText}</div>
  `;

  remarksList.insertBefore(newRemark, remarksList.firstChild);
  
  setTimeout(() => {
    newRemark.classList.remove('opacity-0');
  }, 10);

  addTimelineItem("Admin Note Added", remarkText);

  document.getElementById("newRemark").value = "";

  showToast('success', 'Admin note added successfully');
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
  const existingItems = timeline.querySelectorAll('.relative.pl-8');
  if (existingItems.length > 0) {
    const lastItem = existingItems[existingItems.length - 1];
    // Remove animate-pulse from the previous last item's dot
    const lastDot = lastItem.querySelector('.animate-pulse');
    if (lastDot) {
      lastDot.classList.remove('animate-pulse');
    }
    // Add pb-6 and connector line to previous last item if it doesn't have them
    if (!lastItem.classList.contains('pb-6')) {
      lastItem.classList.add('pb-6');
      // Add connector line if it doesn't exist
      if (!lastItem.querySelector('.absolute.left-\\[7px\\]')) {
        const line = document.createElement('div');
        line.className = 'absolute left-[7px] top-5 w-0.5 h-full bg-gray-200 dark:bg-neutral-600';
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
    newItem.classList.remove('opacity-0');
  }, 10);
  
  setTimeout(() => {
    newItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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