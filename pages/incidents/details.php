<?php
// incident_details.php
require_once __DIR__ . '/../../config/conn.php';
require_once __DIR__ . '/../../includes/auth_helper.php';

// Require authentication - only admin and operator can view incident details
AuthChecker::requireAuth('/auth/login');

// Get current user info
$currentUserName = AuthChecker::getName();
$currentUserId = AuthChecker::getUserId();
$currentUserRole = AuthChecker::getUserRole();
?>

<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <base href="../../" />
  <title>Incident Details</title>
  <link rel="stylesheet" href="assets/unicons/line.css" />
  <link rel="stylesheet" href="assets/css/leaflet/leaflet.css" />
  <script src="assets/js/tailwind/tailwind.min.js"></script>
  <link rel="stylesheet" href="assets/css/toast.css" />
  <link href="assets/css/font.css" rel="stylesheet" />
  <link rel="stylesheet" href="assets/css/sidebar.css" />
  <link rel="stylesheet" href="assets/css/page-load-animation.css" />
  <link rel="stylesheet" href="assets/css/incident-details.css" />
  <script>
    tailwind.config = {
      darkMode: ["class", '[data-theme="dark"]'],
    };
  </script>
  <script src="assets/js/leaflet/leaflet.js"></script>
  <script src="assets/js/leaflet/leaflet-routing-machine.min.js"></script>
  <link rel="icon" type="image/x-icon" href="assets/img/logo.png">
</head>

<body class="min-h-screen flex transition-all duration-300 dark:bg-neutral-900"
  data-admin-name="<?php echo htmlspecialchars($currentUserName); ?>"
  data-user-id="<?php echo htmlspecialchars($currentUserId); ?>"
  data-user-role="<?php echo htmlspecialchars($currentUserRole); ?>">
  <?php include $_SERVER['DOCUMENT_ROOT'] . '/includes/sidebar.php'; ?>

  <main id="mainContent" class="transition-all duration-500 ease-in-out ml-[302px] flex-1 p-8 flex flex-col">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-neutral-400 mb-4">
          <a href="incident" class="text-blue-500 hover:text-blue-700 transition-colors font-medium">Incidents</a>
          <span>
            <i class="uil uil-angle-right"></i>
          </span>
          <span class="font-semibold" id="breadcrumbIncidentId">Loading...</span>
        </div>
        <div class="flex justify-between items-center">
          <h1 class="text-xl font-semibold text-neutral-700 dark:text-neutral-300">
            Incident Details
          </h1>
          <button onclick="window.history.back()"
            class="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-200 rounded-lg text-gray-500 text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all">
            <i class="uil uil-arrow-left text-lg"></i>
            Back to Incidents
          </button>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-7">
        <!-- Left Column (2/3) -->
        <div class="lg:col-span-2 space-y-7">
          <!-- Overview Card -->
          <div class="bg-white dark:bg-neutral-800 rounded-3xl p-7">
            <div class="flex justify-between items-center pb-4 mb-5 border-b-2 border-gray-100 dark:border-neutral-600">
              <h2 class="font-semibold text-neutral-600 flex items-center gap-2.5 dark:text-neutral-300">
                <i class="uil uil-info-circle text-2xl"></i>
                Incident Overview
              </h2>
              <span
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800/20 dark:text-gray-400"
                id="statusBadge">
                <span class="w-2 h-2 rounded-full bg-gray-600 status-dot"></span>
                <i class="uil uil-ellipsis-h"></i>
              </span>
            </div>

            <div
              class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm mb-5 bg-red-100 text-red-600 dark:bg-red-800/20 dark:text-red-400">
              <i class="uil uil-fire text-xl"></i>
              Fire Emergency
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div class="flex flex-col gap-1.5">
                <span
                  class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">Incident
                  ID</span>
                <span class="text-sm font-semibold text-gray-900 dark:text-neutral-300"><i
                    class="uil uil-ellipsis-h"></i></span>
              </div>
              <div class="flex flex-col gap-1.5">
                <span class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">Date
                  Reported</span>
                <span class="text-sm font-semibold text-gray-900 dark:text-neutral-300"><i
                    class="uil uil-ellipsis-h"></i></span>
              </div>
              <div class="flex flex-col gap-1.5">
                <span class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">Time
                  Reported</span>
                <span class="text-sm font-semibold text-gray-900 dark:text-neutral-300"><i
                    class="uil uil-ellipsis-h"></i></span>
              </div>
            </div>

            <div id="descriptionSection">
              <span
                class="block text-xs text-gray-500 dark:text-neutral-300 font-semibold uppercase tracking-wider mb-2.5">Description</span>
              <div id="descriptionBox"
                class="bg-gray-50 dark:bg-neutral-700 border-l-4 border-blue-500 p-4 mb-5 rounded-lg text-sm text-gray-600 dark:text-neutral-400 leading-relaxed">
              </div>
            </div>
          </div>

          <!-- Location Card -->
          <div class="bg-white dark:bg-neutral-800 rounded-3xl p-7">
            <div class="flex justify-between items-center pb-4 mb-5 border-b-2 border-gray-100 dark:border-neutral-600">
              <h2 class="text-base font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2.5">
                <i class="uil uil-map text-2xl"></i>
                Location & Directions
              </h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
              <div class="flex flex-col gap-1.5">
                <span
                  class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">Address</span>
                <span id="locationAddress" class="text-sm font-semibold text-gray-900 dark:text-neutral-300">—</span>
              </div>
              <div class="flex flex-col gap-1.5">
                <span
                  class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">Barangay</span>
                <span id="locationBarangay" class="text-sm font-semibold text-gray-900 dark:text-neutral-300">—</span>
              </div>
              <div class="flex flex-col gap-1.5">
                <span
                  class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">City</span>
                <span id="locationCity" class="text-sm font-semibold text-gray-900 dark:text-neutral-300">—</span>
              </div>
              <div class="flex flex-col gap-1.5">
                <span
                  class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">Coordinates</span>
                <span id="coordinates" class="text-sm font-semibold text-gray-900 dark:text-neutral-300">—</span>
              </div>
            </div>

            <div class="h-96 rounded-xl overflow-hidden mt-4 relative">
              <div class="zoom-controls flex flex-col gap-0.5 overflow-hidden p-0.5 absolute top-2.5 right-2.5 z-[999]">
                <button class="map-btn flex items-center justify-center dark:border-gray-600" id="zoomIn"
                  title="Zoom in">
                  <i class="uil uil-plus"></i>
                </button>
                <button class="map-btn flex items-center justify-center dark:border-gray-600" id="zoomOut"
                  title="Zoom out">
                  <i class="uil uil-minus"></i>
                </button>
              </div>
              <div class="absolute bottom-2.5 right-2.5 z-[999] flex flex-col gap-2">
                <button id="toggleDirections" onclick="toggleDirections()"
                  class="toggle-btn flex items-center dark:border-gray-600 gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium text-neutral-100 hover:-translate-y-0.5 hover:shadow-lg transition-all">
                  <i class="uil uil-map-marker text-2xl"></i>
                  Show Directions
                </button>
              </div>
              <div id="incidentMap" class="h-full w-full"></div>
            </div>

            <div id="routeInfo" class="hidden bg-gray-50 dark:bg-neutral-600 rounded-lg p-3 mt-2.5">
              <div class="flex justify-between mb-2 text-sm">
                <span class="text-gray-500 dark:text-neutral-300 font-medium">Distance:</span>
                <span class="text-gray-900 dark:text-neutral-300 font-semibold" id="routeDistance">-</span>
              </div>
              <div class="flex justify-between mb-2 text-sm">
                <span class="text-gray-500 dark:text-neutral-300  font-medium">Estimated Time:</span>
                <span class="text-gray-900 dark:text-neutral-300 font-semibold" id="routeTime">-</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-500 dark:text-neutral-300 font-medium">Route:</span>
                <span class="text-gray-900 dark:text-neutral-300 font-semibold" id="routeName">-</span>
              </div>
            </div>
          </div>

          <!-- Reporter Card -->
          <div class="bg-white dark:bg-neutral-800 rounded-3xl p-7">
            <div class="flex justify-between items-center pb-4 mb-5 border-b-2 border-gray-100 dark:border-neutral-600">
              <h2 class="text-base font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2.5">
                <i class="uil uil-user text-2xl"></i>
                Reported By
              </h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div class="flex flex-col gap-1.5">
                <span
                  class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">Name</span>
                <span class="text-sm font-semibold text-gray-900 dark:text-neutral-300"><i
                    class="uil uil-ellipsis-h"></i></span>
              </div>
              <div class="flex flex-col gap-1.5">
                <span class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">User
                  ID</span>
                <span class="text-sm font-semibold text-gray-900 dark:text-neutral-300"><i
                    class="uil uil-ellipsis-h"></i></span>
              </div>
              <div class="flex flex-col gap-1.5">
                <span class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">Contact
                  Number</span>
                <span class="text-sm font-semibold text-gray-900 dark:text-neutral-300"><i
                    class="uil uil-ellipsis-h"></i></span>
              </div>
              <div class="flex flex-col gap-1.5">
                <span
                  class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">Address</span>
                <span class="text-sm font-semibold text-gray-900 dark:text-neutral-300"><i
                    class="uil uil-ellipsis-h"></i></span>
              </div>
              <div class="flex flex-col gap-1.5">
                <span
                  class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">Resident
                  Since</span>
                <span class="text-sm font-semibold text-gray-900 dark:text-neutral-300"><i
                    class="uil uil-ellipsis-h"></i></span>
              </div>
            </div>
          </div>

          <!-- Attachments Card -->
          <div class="bg-white dark:bg-neutral-800 rounded-3xl p-7">
            <div class="flex justify-between items-center pb-4 mb-5 border-b-2 border-gray-100 dark:border-neutral-600">
              <h2 class="text-base font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2.5">
                <i class="uil uil-image text-2xl"></i>
                Evidence & Attachments
                <span id="evidenceCount"
                  class="text-xs font-medium bg-gray-100 dark:bg-neutral-700 text-gray-500 dark:text-neutral-400 px-2 py-0.5 rounded-full">0</span>
              </h2>
              <button onclick="uploadEvidence()"
                class="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg text-gray-500 text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer">
                <i class="uil uil-upload text-base"></i>
                Upload
              </button>
            </div>

            <!-- Upload progress bar -->
            <div id="uploadProgress" class="hidden mb-4">
              <div class="flex justify-between text-xs text-gray-500 dark:text-neutral-400 mb-1">
                <span id="uploadFileName">Uploading...</span>
                <span id="uploadPercent">0%</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-1.5">
                <div id="uploadProgressBar" class="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                  style="width: 0%"></div>
              </div>
            </div>

            <!-- Evidence Grid -->
            <div id="evidenceGrid" class="grid grid-cols-3 gap-2.5">
              <!-- Populated by JS -->
            </div>

            <p class="text-xs text-gray-500 dark:text-neutral-400 text-center mt-2.5">
              Admin can upload photos/evidence from the scene
            </p>
          </div>
        </div>

        <!-- Right Column (1/3) -->
        <div class="space-y-7">
          <!-- Actions Card -->
          <div class="bg-white dark:bg-neutral-800 rounded-3xl p-7">
            <div class="flex justify-between items-center pb-4 mb-5 border-b-2 border-gray-100 dark:border-neutral-600">
              <h2 class="text-base font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2.5">
                <i class="uil uil-bolt text-2xl"></i>
                Quick Actions
              </h2>
            </div>

            <!-- Responder Info Banner (hidden by default) -->
            <div id="responderBanner" class="hidden mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p class="text-xs text-blue-500 dark:text-blue-400 font-semibold uppercase tracking-wider mb-2">
                Assigned Responder
              </p>
              <div class="flex items-center gap-3">
                <img id="responderAvatar" src="" alt="" class="w-9 h-9 rounded-full object-cover hidden" />
                <div id="responderAvatarFallback"
                  class="w-9 h-9 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center">
                  <i class="uil uil-user text-blue-500 dark:text-blue-300"></i>
                </div>
                <div>
                  <p id="responderName" class="text-sm font-semibold text-gray-900 dark:text-neutral-200">—</p>
                  <p id="responderStatus" class="text-xs text-gray-500 dark:text-neutral-400">—</p>
                </div>
              </div>
            </div>

            <div class="space-y-2.5">
              <!-- Force Resolve: only shown when stuck responding -->
              <button id="forceResolveBtn" onclick="forceResolve()" class="hidden
                  w-full flex items-center justify-center gap-2 px-5 py-3 
                  bg-orange-500 hover:bg-orange-600 text-white rounded-xl 
                  text-xs font-medium hover:-translate-y-0.5 hover:shadow-lg transition-all">
                <i class="uil uil-exclamation-triangle text-lg"></i> Force Resolve
              </button>

              <button id="generateReportBtn" onclick="generateReport()"
                class="w-full flex items-center justify-center gap-2 px-5 py-3 bg-white dark:bg-neutral-600 dark:hover:bg-neutral-700 dark:border-neutral-700 dark:text-neutral-300 text-gray-500 border-2 border-gray-200 rounded-xl text-xs font-medium hover:bg-gray-50 hover:-translate-y-0.5 hover:border-gray-300 transition-all">
                <i class="uil uil-file-download text-lg"></i> Generate Report
              </button>
            </div>
          </div>

          <!-- Timeline Card -->
          <div class="bg-white dark:bg-neutral-800 rounded-3xl p-7 ">
            <div class="flex justify-between items-center pb-4 mb-5 border-b-2 border-gray-100 dark:border-neutral-600">
              <h2 class="text-base font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2.5">
                <i class="uil uil-clock text-2xl"></i>
                Activity Timeline
              </h2>
            </div>

            <div id="timeline" class="relative max-h-[500px] overflow-y-auto mb-3 pr-3">
            </div>
          </div>

          <!-- Emergency Contacts Card -->
          <div class="bg-white dark:bg-neutral-800 rounded-3xl p-7">
            <div class="flex justify-between items-center pb-4 mb-5 border-b-2 border-gray-100 dark:border-neutral-600">
              <h2 class="text-base font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2.5">
                <i class="uil uil-phone text-2xl"></i>
                Emergency Contacts
              </h2>
            </div>

            <div class="grid grid-cols-2 gap-5">
              <div class="flex flex-col gap-1.5">
                <span
                  class="text-xs text-neutral-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">Emergency
                  Hotline</span>
                <span class="text-sm font-semibold text-red-600 dark:text-neutral-200">122</span>
              </div>
              <div class="flex flex-col gap-1.5">
                <span class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">Fire
                  Department</span>
                <span class="text-sm font-semibold text-gray-900 dark:text-neutral-200">(02) 8426-0219</span>
              </div>
              <div class="flex flex-col gap-1.5">
                <span class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">Police
                  (PNP)</span>
                <span class="text-sm font-semibold text-gray-900 dark:text-neutral-200">(02) 8722-0650</span>
              </div>
              <div class="flex flex-col gap-1.5">
                <span
                  class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">Barangay
                  Hall</span>
                <span class="text-sm font-semibold text-gray-900 dark:text-neutral-200">+63 917 555 1234</span>
              </div>
              <div class="flex flex-col gap-1.5">
                <span class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">Red
                  Cross</span>
                <span class="text-sm font-semibold text-gray-900 dark:text-neutral-200">143</span>
              </div>
              <div class="flex flex-col gap-1.5">
                <span
                  class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">NDRRMC</span>
                <span class="text-sm font-semibold text-gray-900 dark:text-neutral-200">(02) 8911-1406</span>
              </div>
            </div>
          </div>

          <!-- Admin Notes Card -->
          <div class="bg-white dark:bg-neutral-800 rounded-3xl p-7">
            <div class="flex justify-between items-center pb-4 mb-5 border-b-2 border-gray-100 dark:border-neutral-600">
              <h2 class="text-base font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2.5">
                <i class="uil uil-comment-alt-notes text-2xl"></i>
                Admin Notes & Updates
              </h2>
            </div>

            <div id="remarksList" class="flex flex-col gap-3 mb-4 max-h-[250px] overflow-y-auto mb-3 pr-3">

            </div>

            <div>
              <textarea id="newRemark" placeholder="Add admin notes or incident updates..."
                class="w-full p-3 border-2 border-gray-200 rounded-lg dark:bg-neutral-600 dark:border-neutral-700 dark:text-neutral-300 text-sm resize-y min-h-[80px] mb-2.5 focus:outline-none focus:border-emerald-400"></textarea>
              <button onclick="addRemark()"
                class="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-500 text-white rounded-xl text-xs font-medium hover:bg-blue-600 hover:-translate-y-0.5 hover:shadow-lg transition-all">
                <i class="uil uil-plus text-lg"></i>
                Add Note
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Container -->
    <div id="toastContainer" class="fixed top-4 right-4 z-50 space-y-3 max-w-md w-full"></div>
  </main>

  <script src="assets/js/sidebar.js"></script>
  <script src="assets/js/toast.js"></script>
  <script src="assets/js/modal.js"></script>
  <script src="assets/js/incident-details.js"></script>
</body>

</html>