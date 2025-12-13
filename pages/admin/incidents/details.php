<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Incident Details</title>
    <base href="/safechain/">
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
  <body
    class="min-h-screen flex transition-all duration-300 dark:bg-neutral-900"
  >
    <?php include $_SERVER['DOCUMENT_ROOT'] . '/safechain/includes/sidebar.php'; ?>

    <main
      id="mainContent"
      class="transition-all duration-500 ease-in-out ml-[302px] flex-1 p-8 flex flex-col"
    >
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-neutral-400 mb-4">
            <a
              href="/incident.html"
              class="text-blue-500 hover:text-blue-700 transition-colors font-medium"
              >Incidents</a
            >
            <span>
              <i class="uil uil-angle-right"></i>
            </span>
            <span class="font-semibold">EMG-2024-1047</span>
          </div>
          <div class="flex justify-between items-center">
            <h1 class="text-xl font-semibold text-neutral-700 dark:text-neutral-300">
              Incident Details
            </h1>
            <button
              onclick="window.history.back()"
              class="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-200 rounded-lg text-gray-500 text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
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
              <div
                class="flex justify-between items-center pb-4 mb-5 border-b-2 border-gray-100 dark:border-neutral-600"
              >
                <h2
                  class="font-semibold text-neutral-600 flex items-center gap-2.5 dark:text-neutral-300"
                >
                  <i class="uil uil-info-circle text-2xl"></i>
                  Incident Overview
                </h2>
                <span
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-600 dark:bg-blue-800/20 dark:text-blue-400"
                  id="statusBadge"
                >
                  <span
                    class="w-2 h-2 rounded-full bg-blue-600 status-dot"
                  ></span>
                  Active Response
                </span>
              </div>

              <div
                class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm mb-5 bg-red-100 text-red-600 dark:bg-red-800/20 dark:text-red-400" 
              >
                <i class="uil uil-fire text-xl"></i>
                Fire Emergency
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div class="flex flex-col gap-1.5">
                  <span
                    class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider"
                    >Incident ID</span
                  >
                  <span class="text-sm font-semibold text-gray-900 dark:text-neutral-300"
                    >#EMG-2024-1047</span
                  >
                </div>
                <div class="flex flex-col gap-1.5">
                  <span
                    class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider"
                    >Date Reported</span
                  >
                  <span class="text-sm font-semibold text-gray-900 dark:text-neutral-300"
                    >October 10, 2025</span
                  >
                </div>
                <div class="flex flex-col gap-1.5">
                  <span
                    class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider"
                    >Time Reported</span
                  >
                  <span class="text-sm font-semibold text-gray-900 dark:text-neutral-300"
                    >2:34 PM</span
                  >
                </div>
              </div>

              <div>
                <span
                  class="block text-xs text-gray-500 dark:text-neutral-300 font-semibold uppercase tracking-wider mb-2.5"
                  >Description</span
                >
                <div
                  class="bg-gray-50 dark:bg-neutral-700 dark:border-blue-800 border-l-4 border-blue-500 p-4 rounded-lg text-xs leading-relaxed text-gray-600 dark:text-neutral-400"
                >
                  Fire reported in residential building on 3rd floor. Smoke
                  visible from street level. Multiple residents evacuating. Fire
                  appears to have started in kitchen area. Immediate response
                  required. No casualties reported at this time.
                </div>
              </div>
            </div>

            <!-- Location Card -->
            <div class="bg-white dark:bg-neutral-800 rounded-3xl p-7">
              <div
                class="flex justify-between items-center pb-4 mb-5 border-b-2 border-gray-100 dark:border-neutral-600"
              >
                <h2
                  class="text-base font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2.5"
                >
                  <i class="uil uil-map text-2xl"></i>
                  Location & Directions
                </h2>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                <div class="flex flex-col gap-1.5">
                  <span
                    class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider"
                    >Address</span
                  >
                  <span class="text-sm font-semibold text-gray-900 dark:text-neutral-300"
                    >123 Forest Hill</span
                  >
                </div>
                <div class="flex flex-col gap-1.5">
                  <span
                    class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider"
                    >Barangay</span
                  >
                  <span class="text-sm font-semibold text-gray-900 dark:text-neutral-300"
                    >Gulod</span
                  >
                </div>
                <div class="flex flex-col gap-1.5">
                  <span
                    class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider"
                    >City</span
                  >
                  <span class="text-sm font-semibold text-gray-900 dark:text-neutral-300"
                    >Quezon City, Metro Manila</span
                  >
                </div>
                <div class="flex flex-col gap-1.5">
                  <span
                    class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider"
                    >Coordinates</span
                  >
                  <span class="text-sm font-semibold text-gray-900 dark:text-neutral-300"
                    >14.716412° N, 121.040834° E</span
                  >
                </div>
              </div>

              <div class="h-96 rounded-xl overflow-hidden mt-4 relative">
                <div
                    class="zoom-controls flex flex-col gap-0.5 overflow-hidden p-0.5 absolute top-2.5 right-2.5 z-[999]"
                  >
                    <button
                      class="map-btn flex items-center justify-center dark:border-gray-600"
                      id="zoomIn"
                      title="Zoom in"
                    >
                      <i class="uil uil-plus"></i>
                    </button>
                    <button
                      class="map-btn flex items-center justify-center dark:border-gray-600"
                      id="zoomOut"
                      title="Zoom out"
                    >
                      <i class="uil uil-minus"></i>
                    </button>
                  </div>
                <div
                  class="absolute bottom-2.5 right-2.5 z-[999] flex flex-col gap-2"
                >
                  <button
                    id="toggleDirections"
                    onclick="toggleDirections()"
                    class="toggle-btn flex items-center dark:border-gray-600 gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium text-neutral-100 hover:-translate-y-0.5 hover:shadow-lg transition-all"
                  >
                    <i class="uil uil-map-marker text-2xl"></i>
                    Show Directions
                  </button>
                </div>
                <div id="incidentMap" class="h-full w-full"></div>
              </div>

              <div
                id="routeInfo"
                class="hidden bg-gray-50 dark:bg-neutral-600 rounded-lg p-3 mt-2.5"
              >
                <div class="flex justify-between mb-2 text-sm">
                  <span class="text-gray-500 dark:text-neutral-300 font-medium">Distance:</span>
                  <span class="text-gray-900 dark:text-neutral-300 font-semibold" id="routeDistance"
                    >-</span
                  >
                </div>
                <div class="flex justify-between mb-2 text-sm">
                  <span class="text-gray-500 dark:text-neutral-300  font-medium">Estimated Time:</span>
                  <span class="text-gray-900 dark:text-neutral-300 font-semibold" id="routeTime"
                    >-</span
                  >
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500 dark:text-neutral-300 font-medium">Route:</span>
                  <span class="text-gray-900 dark:text-neutral-300 font-semibold" id="routeName"
                    >-</span
                  >
                </div>
              </div>
            </div>

            <!-- Reporter Card -->
            <div class="bg-white dark:bg-neutral-800 rounded-3xl p-7">
              <div
                class="flex justify-between items-center pb-4 mb-5 border-b-2 border-gray-100 dark:border-neutral-600"
              >
                <h2
                  class="text-base font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2.5"
                >
                  <i class="uil uil-user text-2xl"></i>
                  Reported By
                </h2>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div class="flex flex-col gap-1.5">
                  <span
                    class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider"
                    >Name</span
                  >
                  <span class="text-sm font-semibold text-gray-900 dark:text-neutral-300"
                    >Maria Santos</span
                  >
                </div>
                <div class="flex flex-col gap-1.5">
                  <span
                    class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider"
                    >User ID</span
                  >
                  <span class="text-sm font-semibold text-gray-900 dark:text-neutral-300"
                    >USR-45821</span
                  >
                </div>
                <div class="flex flex-col gap-1.5">
                  <span
                    class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider"
                    >Contact Number</span
                  >
                  <span class="text-sm font-semibold text-gray-900 dark:text-neutral-300"
                    >+63 912 345 6789</span
                  >
                </div>
                <div class="flex flex-col gap-1.5">
                  <span
                    class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider"
                    >Email</span
                  >
                  <span class="text-sm font-semibold text-gray-900 dark:text-neutral-300"
                    >maria.santos@email.com</span
                  >
                </div>
                <div class="flex flex-col gap-1.5">
                  <span
                    class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider"
                    >Resident Since</span
                  >
                  <span class="text-sm font-semibold text-gray-900 dark:text-neutral-300"
                    >January 2022</span
                  >
                </div>
                <!--<div class="flex flex-col gap-1.5">
                  <span
                    class="text-xs text-emerald-500 font-semibold uppercase tracking-wider"
                    >Verification</span
                  >
                  <span class="text-sm font-semibold text-emerald-600"
                    >✓ Verified Resident</span
                  >
                </div>-->
              </div>
            </div>

            <!-- Attachments Card -->
            <div class="bg-white dark:bg-neutral-800 rounded-3xl p-7">
              <div
                class="flex justify-between items-center pb-4 mb-5 border-b-2 border-gray-100 dark:border-neutral-600"
              >
                <h2
                  class="text-base font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2.5"
                >
                  <i class="uil uil-image text-2xl"></i>
                  Evidence & Attachments
                </h2>
                <button
                  onclick="uploadEvidence()"
                  class="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg text-gray-500 text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  <i class="uil uil-upload text-base"></i>
                  Upload
                </button>
              </div>

              <div class="grid grid-cols-3 gap-2.5">
                <div
                  onclick="openImageModal('photo1')"
                  class="aspect-square bg-gray-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center cursor-pointer hover:scale-105 hover:shadow-md transition-all overflow-hidden"
                >
                  <i class="uil uil-image text-4xl text-gray-400"></i>
                </div>
                <div
                  onclick="openImageModal('photo2')"
                  class="aspect-square bg-gray-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center cursor-pointer hover:scale-105 hover:shadow-md transition-all overflow-hidden"
                >
                  <i class="uil uil-image text-4xl text-gray-400"></i>
                </div>
                <div
                  onclick="uploadEvidence()"
                  class="aspect-square bg-transparent border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-all"
                >
                  <i class="uil uil-plus text-4xl text-gray-400"></i>
                </div>
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
              <div
                class="flex justify-between items-center pb-4 mb-5 border-b-2 border-gray-100 dark:border-neutral-600"
              >
                <h2
                  class="text-base font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2.5"
                >
                  <i class="uil uil-bolt text-2xl"></i>
                  Quick Actions
                </h2>
              </div>

              <div class="space-y-2.5">
                <button
                  onclick="updateStatus()"
                  class="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl text-xs font-medium hover:bg-blue-600 hover:-translate-y-0.5 hover:shadow-lg transition-all"
                >
                  <i class="uil uil-pen text-lg"></i>
                  Update Status
                </button>

                <button
                  onclick="markAsResolved()"
                  class="w-full flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-medium hover:bg-emerald-600 hover:-translate-y-0.5 hover:shadow-lg transition-all"
                >
                  <i class="uil uil-check-circle text-lg"></i>
                  Mark as Resolved
                </button>

                <button
                  onclick="generateReport()"
                  class="w-full flex items-center justify-center gap-2 px-5 py-3 bg-white dark:bg-neutral-600 dark:hover:bg-neutral-700 dark:border-neutral-700 dark:text-neutral-300 text-gray-500 border-2 border-gray-200 rounded-xl text-xs font-medium hover:bg-gray-50 hover:-translate-y-0.5 hover:border-gray-300 transition-all"
                >
                  <i class="uil uil-file-download text-lg"></i>
                  Generate Report
                </button>
              </div>
            </div>

            <!-- Timeline Card -->
            <div class="bg-white dark:bg-neutral-800 rounded-3xl p-7">
              <div
                class="flex justify-between items-center pb-4 mb-5 border-b-2 border-gray-100 dark:border-neutral-600"
              >
                <h2
                  class="text-base font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2.5"
                >
                  <i class="uil uil-clock text-2xl"></i>
                  Activity Timeline
                </h2>
              </div>

              <div id="timeline" class="relative">
                <div class="relative pl-8 pb-6">
                  <div
                    class="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-blue-500 border-4 border-blue-100 dark:bg-blue-700 dark:border-blue-900" 
                  ></div>
                  <div
                    class="absolute left-[7px] top-5 w-0.5 h-full bg-gray-200 dark:bg-neutral-600"
                  ></div>
                  <div class="flex justify-between items-center mb-1">
                    <span class="font-semibold text-gray-900 dark:text-neutral-300 text-sm"
                      >Emergency Reported</span
                    >
                    <span class="text-xs text-gray-500">2:34 PM</span>
                  </div>
                  <div class="text-sm text-gray-500 leading-relaxed">
                    Fire emergency reported by resident
                  </div>
                  <div class="text-xs text-gray-500 mt-1">By: Maria Santos</div>
                </div>

                <div class="relative pl-8 pb-6">
                  <div
                    class="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-blue-500 border-4 border-blue-100 dark:bg-blue-700 dark:border-blue-900"
                  ></div>
                  <div
                    class="absolute left-[7px] top-5 w-0.5 h-full bg-gray-200 dark:bg-neutral-600"
                  ></div>
                  <div class="flex justify-between items-center mb-1">
                    <span class="font-semibold text-gray-900 dark:text-neutral-300 text-sm"
                      >Location Verified</span
                    >
                    <span class="text-xs text-gray-500">2:35 PM</span>
                  </div>
                  <div class="text-sm text-gray-500 leading-relaxed">
                    GPS coordinates and address confirmed
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    System: Auto-verified
                  </div>
                </div>

                <div class="relative pl-8 pb-6">
                  <div
                    class="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-blue-500 border-4 border-blue-100 dark:bg-blue-700 dark:border-blue-900"
                  ></div>
                  <div
                    class="absolute left-[7px] top-5 w-0.5 h-full bg-gray-200 dark:bg-neutral-600"
                  ></div>
                  <div class="flex justify-between items-center mb-1">
                    <span class="font-semibold text-gray-900 dark:text-neutral-300 text-sm"
                      >Fire Department Dispatched</span
                    >
                    <span class="text-xs text-gray-500">2:37 PM</span>
                  </div>
                  <div class="text-sm text-gray-500 leading-relaxed">
                    BFP Station 5 units en route to location
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    By: Admin Juan Dela Cruz
                  </div>
                </div>

                <div class="relative pl-8 pb-6">
                  <div
                    class="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-blue-500 border-4 border-blue-100 dark:bg-blue-700 dark:border-blue-900"
                  ></div>
                  <div
                    class="absolute left-[7px] top-5 w-0.5 h-full bg-gray-200 dark:bg-neutral-600"
                  ></div>
                  <div class="flex justify-between items-center mb-1">
                    <span class="font-semibold text-gray-900 dark:text-neutral-300 text-sm"
                      >First Responders Arrived</span
                    >
                    <span class="text-xs text-gray-500">2:45 PM</span>
                  </div>
                  <div class="text-sm text-gray-500 leading-relaxed">
                    Fire trucks on scene, evacuation in progress
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    By: BFP Team Alpha
                  </div>
                </div>

                <div class="relative pl-8">
                  <div
                    class="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-blue-500 border-4 border-blue-100 dark:bg-blue-400 dark:border-blue-900 animate-pulse"
                  ></div>
                  <div class="flex justify-between items-center mb-1">
                    <span class="font-semibold text-gray-900 dark:text-neutral-300 text-sm"
                      >Fire Suppression Ongoing</span
                    >
                    <span class="text-xs text-gray-500">2:52 PM</span>
                  </div>
                  <div class="text-sm text-gray-500 leading-relaxed">
                    Active firefighting operations, residents evacuated safely
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    By: BFP Team Alpha
                  </div>
                </div>
              </div>
            </div>

            <!-- Emergency Contacts Card -->
            <div class="bg-white dark:bg-neutral-800 rounded-3xl p-7">
              <div
                class="flex justify-between items-center pb-4 mb-5 border-b-2 border-gray-100 dark:border-neutral-600"
              >
                <h2
                  class="text-base font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2.5"
                >
                  <i class="uil uil-phone text-2xl"></i>
                  Emergency Contacts
                </h2>
              </div>

              <div class="grid grid-cols-2 gap-5">
                <div class="flex flex-col gap-1.5">
                  <span
                    class="text-xs text-neutral-500 dark:text-neutral-400 font-semibold uppercase tracking-wider"
                    >Emergency Hotline</span
                  >
                  <span class="text-sm font-semibold text-red-600 dark:text-neutral-200">911</span>
                </div>
                <div class="flex flex-col gap-1.5">
                  <span
                    class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider"
                    >Fire Department</span
                  >
                  <span class="text-sm font-semibold text-gray-900 dark:text-neutral-200"
                    >(02) 8426-0219</span
                  >
                </div>
                <div class="flex flex-col gap-1.5">
                  <span
                    class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider"
                    >Police (PNP)</span
                  >
                  <span class="text-sm font-semibold text-gray-900 dark:text-neutral-200"
                    >(02) 8722-0650</span
                  >
                </div>
                <div class="flex flex-col gap-1.5">
                  <span
                    class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider"
                    >Barangay Hall</span
                  >
                  <span class="text-sm font-semibold text-gray-900 dark:text-neutral-200"
                    >+63 917 555 1234</span
                  >
                </div>
                <div class="flex flex-col gap-1.5">
                  <span
                    class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider"
                    >Red Cross</span
                  >
                  <span class="text-sm font-semibold text-gray-900 dark:text-neutral-200">143</span>
                </div>
                <div class="flex flex-col gap-1.5">
                  <span
                    class="text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase tracking-wider"
                    >NDRRMC</span
                  >
                  <span class="text-sm font-semibold text-gray-900 dark:text-neutral-200"
                    >(02) 8911-1406</span
                  >
                </div>
              </div>
            </div>

            <!-- Admin Notes Card -->
            <div class="bg-white dark:bg-neutral-800 rounded-3xl p-7">
              <div
                class="flex justify-between items-center pb-4 mb-5 border-b-2 border-gray-100 dark:border-neutral-600"
              >
                <h2
                  class="text-base font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2.5"
                >
                  <i class="uil uil-comment-alt-notes text-2xl"></i>
                  Admin Notes & Updates
                </h2>
              </div>

              <div id="remarksList" class="flex flex-col gap-3 mb-4">
                <div class="bg-gray-50 dark:bg-neutral-700 rounded-lg p-3">
                  <div class="flex justify-between items-center mb-1.5">
                    <span class="font-semibold text-sm text-gray-900 dark:text-neutral-300"
                      >Admin - Juan Dela Cruz</span
                    >
                    <span class="text-xs text-gray-500 dark:text-neutral-300">2:50 PM</span>
                  </div>
                  <div class="text-xs text-gray-600 dark:text-neutral-400 leading-relaxed">
                    All residents evacuated safely. Coordinating with BFP for
                    damage assessment.
                  </div>
                </div>

                <div class="bg-gray-50 dark:bg-neutral-700 rounded-lg p-3">
                  <div class="flex justify-between items-center mb-1.5">
                    <span class="font-semibold text-sm text-gray-900 dark:text-neutral-300"
                      >Admin - Juan Dela Cruz</span
                    >
                    <span class="text-xs text-gray-500 dark:text-neutral-300">2:48 PM</span>
                  </div>
                  <div class="text-xs text-gray-600 dark:text-neutral-400 leading-relaxed">
                    Fire department on scene. Traffic being redirected. No
                    casualties reported.
                  </div>
                </div>
              </div>

              <div>
                <textarea
                  id="newRemark"
                  placeholder="Add admin notes or incident updates..."
                  class="w-full p-3 border-2 border-gray-200 rounded-lg dark:bg-neutral-600 dark:border-neutral-700 dark:text-neutral-300 text-sm resize-y min-h-[80px] mb-2.5 focus:outline-none focus:border-emerald-400"
                ></textarea>
                <button
                  onclick="addRemark()"
                  class="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-500 text-white rounded-xl text-xs font-medium hover:bg-blue-600 hover:-translate-y-0.5 hover:shadow-lg transition-all"
                >
                  <i class="uil uil-plus text-lg"></i>
                  Add Note
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Toast Container -->
      <div
        id="toastContainer"
        class="fixed top-4 right-4 z-50 space-y-3 max-w-md w-full"
      ></div>
    </main>

    <script src="assets/js/sidebar.js"></script>
    <script src="assets/js/toast.js"></script>
    <script src="assets/js/modal.js"></script>
    <script src="assets/js/incident-details.js"></script>
  </body>
</html>
