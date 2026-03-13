<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);   
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SafeChain Test Generator</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 p-8">
    <div class="max-w-5xl mx-auto space-y-6">

        <!-- Header -->
        <div class="bg-white rounded-2xl shadow p-6">
            <h1 class="text-3xl font-bold text-gray-800 mb-1">🚨 SafeChain Test Generator</h1>
            <p class="text-gray-500 text-sm mb-4">Simulate LoRa device button presses, GPS updates, and corroboration scenarios</p>
            <div id="status" class="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p class="text-sm text-blue-800">⏳ Connecting to API...</p>
            </div>
        </div>

        <!-- Quick Generate -->
        <div class="bg-white rounded-2xl shadow p-6">
            <h2 class="text-lg font-bold text-gray-800 mb-4">⚡ Quick Generate (Random Device)</h2>
            <div class="grid grid-cols-3 gap-4 mb-4">
                <button onclick="generateIncident('fire')"
                    class="bg-red-500 hover:bg-red-600 text-white font-bold py-6 rounded-xl transition hover:scale-105 text-lg">
                    🔥<br><span class="text-sm">Fire Emergency</span>
                </button>
                <button onclick="generateIncident('crime')"
                    class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-6 rounded-xl transition hover:scale-105 text-lg">
                    🛡️<br><span class="text-sm">Crime Report</span>
                </button>
                <button onclick="generateIncident('flood')"
                    class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 rounded-xl transition hover:scale-105 text-lg">
                    🌊<br><span class="text-sm">Flood Alert</span>
                </button>
            </div>
            <button onclick="generateRandomIncidents(5)"
                class="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl w-full">
                🎲 Generate 5 Random Historical Incidents
            </button>
        </div>

        <!-- ── GEOFENCE TESTER ── -->
        <div class="bg-white rounded-2xl shadow p-6">
            <h2 class="text-lg font-bold text-gray-800 mb-1">🗺️ Geofence Tester</h2>
            <p class="text-sm text-gray-500 mb-4">
                Tests that incidents outside Gulod are rejected when geofence is ON, and accepted when OFF.
            </p>

            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1">Device</label>
                    <select id="geofenceDevice" class="w-full p-2.5 border rounded-lg text-sm">
                        <?php
                        include $_SERVER['DOCUMENT_ROOT'] . '/config/conn.php';
                        $query = "SELECT device_id, name FROM residents WHERE is_archived = 0 AND device_id != '' ORDER BY name";
                        $result = mysqli_query($conn, $query);
                        while ($row = mysqli_fetch_assoc($result)) {
                            echo "<option value='{$row['device_id']}'>{$row['name']} ({$row['device_id']})</option>";
                        }
                        mysqli_close($conn);
                        ?>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1">Incident Type</label>
                    <select id="geofenceType" class="w-full p-2.5 border rounded-lg text-sm">
                        <option value="fire">🔥 Fire</option>
                        <option value="crime">🛡️ Crime</option>
                        <option value="flood">🌊 Flood</option>
                    </select>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1">Latitude</label>
                    <input id="geofenceLat" type="number" step="any" value="14.719072"
                        class="w-full p-2.5 border rounded-lg text-sm font-mono" />
                </div>
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1">Longitude</label>
                    <input id="geofenceLng" type="number" step="any" value="121.030359"
                        class="w-full p-2.5 border rounded-lg text-sm font-mono" />
                </div>
            </div>

            <!-- Geofence state indicator -->
            <div id="geofenceStateBox" class="mb-4 p-3 rounded-xl border text-sm font-medium text-center">
                ⏳ Loading geofence state...
            </div>

            <div class="grid grid-cols-3 gap-3">
                <button onclick="sendGeofenceTest()"
                    class="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl transition">
                    🧪 Send Incident
                </button>
                <button onclick="setGeofence(true)"
                    class="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition">
                    ✅ Enable Geofence
                </button>
                <button onclick="setGeofence(false)"
                    class="bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 rounded-xl transition">
                    ⛔ Disable Geofence
                </button>
            </div>

            <div class="grid grid-cols-2 gap-3 mt-3">
                <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-700">
                    <strong>Geofence ON:</strong> Sending the default coordinates (14.719072, 121.030359) should be <strong>rejected</strong> — outside Gulod boundary.
                </div>
                <div class="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-700">
                    <strong>Geofence OFF:</strong> Same coordinates should be <strong>accepted</strong> and saved as a new incident.
                </div>
            </div>
        </div>

        <!-- ── CORROBORATION TESTER ── -->
        <div class="bg-white rounded-2xl shadow p-6">
            <h2 class="text-lg font-bold text-gray-800 mb-1">👥 Corroboration & Rescue Tester</h2>
            <p class="text-sm text-gray-500 mb-4">
                Tests the multi-reporter logic. First reporter creates the incident. 
                Second+ reporters within range corroborate it. 
                Same reporter pressing again triggers a rescue signal.
            </p>

            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1">Incident Type</label>
                    <select id="corroType" class="w-full p-2.5 border rounded-lg text-sm">
                        <option value="fire">🔥 Fire</option>
                        <option value="crime">🛡️ Crime</option>
                        <option value="flood">🌊 Flood</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1">Proximity Offset (meters)</label>
                    <select id="corroOffset" class="w-full p-2.5 border rounded-lg text-sm">
                        <option value="0.0003">~30m — Same block (will corroborate)</option>
                        <option value="0.0007" selected>~70m — Nearby (will corroborate)</option>
                        <option value="0.0015">~150m — Too far (new incident)</option>
                    </select>
                </div>
            </div>

            <!-- Reporter selector rows -->
            <div id="corroReporters" class="space-y-2 mb-4">
                <!-- Rows injected by JS -->
            </div>

            <button onclick="addReporterRow()"
                class="text-sm text-emerald-600 hover:text-emerald-700 font-medium mb-4 block">
                + Add another reporter
            </button>

            <div class="grid grid-cols-2 gap-3">
                <button onclick="runCorroborationTest()"
                    class="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded-xl transition">
                    🧪 Run Corroboration Test
                </button>
                <button onclick="runRescueTest()"
                    class="bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition">
                    🆘 Run Rescue Signal Test
                </button>
            </div>

            <!-- What each test does -->
            <div class="grid grid-cols-2 gap-3 mt-3">
                <div class="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-700">
                    <strong>Corroboration:</strong> Each selected resident sends an alert from nearby coordinates. 
                    All reports after the first should return <code>action: corroborated</code>.
                </div>
                <div class="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                    <strong>Rescue Signal:</strong> The first reporter sends an alert, then sends it <em>again</em>. 
                    The second send from the same device should return <code>needs_rescue: true</code>.
                </div>
            </div>
        </div>

        <!-- Moving User Simulation -->
        <div class="bg-white rounded-2xl shadow p-6">
            <h2 class="text-lg font-bold text-gray-800 mb-1">📍 Moving User Simulation</h2>
            <p class="text-sm text-gray-500 mb-4">Creates an incident then sends continuous GPS updates every 3 seconds.</p>

            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1">Device</label>
                    <select id="moveDevice" class="w-full p-2.5 border rounded-lg text-sm">
                        <?php
                        include $_SERVER['DOCUMENT_ROOT'] . '/config/conn.php';
                        $query = "SELECT device_id, name FROM residents WHERE is_archived = 0 AND device_id != '' ORDER BY name";
                        $result = mysqli_query($conn, $query);
                        while ($row = mysqli_fetch_assoc($result)) {
                            echo "<option value='{$row['device_id']}'>{$row['name']} ({$row['device_id']})</option>";
                        }
                        mysqli_close($conn);
                        ?>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1">Emergency Type</label>
                    <select id="moveType" class="w-full p-2.5 border rounded-lg text-sm">
                        <option value="fire">🔥 Fire</option>
                        <option value="crime">🛡️ Crime</option>
                        <option value="flood">🌊 Flood</option>
                    </select>
                </div>
            </div>

            <button id="movingBtn" onclick="toggleMovingIncident()"
                class="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl w-full mb-3 transition">
                ▶️ Start Moving Emergency (10 GPS updates)
            </button>

            <div id="movingStatus" class="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 hidden">
                <div class="flex items-center justify-between mb-1">
                    <span id="movingText">Preparing...</span>
                    <span id="movingProgress" class="font-bold text-indigo-600">0/10</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div id="progressBar" class="bg-indigo-500 h-2 rounded-full transition-all duration-300" style="width:0%"></div>
                </div>
            </div>
        </div>

        <!-- Response Log -->
        <div class="bg-white rounded-2xl shadow p-6">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-lg font-bold text-gray-800">📋 Response Log</h2>
                <button onclick="clearLog()" class="text-xs text-red-500 hover:text-red-700">Clear</button>
            </div>
            <div id="log" class="space-y-2 max-h-96 overflow-y-auto font-mono text-xs"></div>
        </div>

    </div>

    <script>
        const API_URL     = 'api/receive_incident.php';
        const GULOD_CENTER = { lat: 14.7158532, lng: 121.0403842 };

        // ── Residents loaded from PHP ──────────────────────────────────────────
        const ALL_RESIDENTS = <?php
            include $_SERVER['DOCUMENT_ROOT'] . '/config/conn.php';
            $rows = [];
            $r = mysqli_query($conn, "SELECT device_id, name FROM residents WHERE is_archived = 0 AND device_id != '' ORDER BY name");
            while ($row = mysqli_fetch_assoc($r)) $rows[] = $row;
            echo json_encode($rows);
            mysqli_close($conn);
        ?>;

        let movingInterval = null;
        let isMoving       = false;

        // ── Init ───────────────────────────────────────────────────────────────
        window.addEventListener('load', () => {
            checkAPIConnection();
            loadGeofenceStateUI();
            // Seed 2 reporter rows by default
            addReporterRow();
            addReporterRow();
        });

        // ── API health check ───────────────────────────────────────────────────
        async function checkAPIConnection() {
            const el = document.getElementById('status');
            try {
                const res    = await fetch('api/dashboard/get_incidents.php');
                const result = await res.json();
                if (result.success) {
                    el.innerHTML   = `<p class="text-sm text-green-800">✓ API connected — ${result.count.total} active incident(s)</p>`;
                    el.className   = 'bg-green-50 border border-green-200 rounded-xl p-3';
                } else throw new Error();
            } catch {
                el.innerHTML = '<p class="text-sm text-red-800">✗ Cannot reach API. Check your server.</p>';
                el.className = 'bg-red-50 border border-red-200 rounded-xl p-3';
            }
        }

        // ── Log helpers ────────────────────────────────────────────────────────
        function logMessage(message, type = 'info') {
            const colors = {
                success: 'bg-green-100 text-green-800 border-green-300',
                error:   'bg-red-100 text-red-800 border-red-300',
                info:    'bg-blue-100 text-blue-800 border-blue-300',
                warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                rescue:  'bg-red-200 text-red-900 border-red-500 font-bold animate-pulse',
            };
            const log   = document.getElementById('log');
            const entry = document.createElement('div');
            entry.className = `p-2.5 rounded-lg border ${colors[type] || colors.info}`;
            entry.innerHTML = `<span class="opacity-60">${new Date().toLocaleTimeString()}</span> — ${message}`;
            log.insertBefore(entry, log.firstChild);
        }

        function logJSON(label, obj, type = 'info') {
            logMessage(`${label}: <pre class="mt-1 whitespace-pre-wrap">${JSON.stringify(obj, null, 2)}</pre>`, type);
        }

        function clearLog() {
            document.getElementById('log').innerHTML = '';
            logMessage('Log cleared.', 'info');
        }

        // ── Coord helpers ──────────────────────────────────────────────────────
        function getRandomCoords(offsetRange = 0.005) {
            return {
                lat: GULOD_CENTER.lat + (Math.random() - 0.5) * offsetRange,
                lng: GULOD_CENTER.lng + (Math.random() - 0.5) * offsetRange,
            };
        }

        function getNearbyCoords(baseLat, baseLng, offsetDeg) {
            const offset = parseFloat(offsetDeg);
            return {
                lat: baseLat + (Math.random() - 0.5) * offset * 2,
                lng: baseLng + (Math.random() - 0.5) * offset * 2,
            };
        }

        // ── Core POST ──────────────────────────────────────────────────────────
        async function postIncident(payload) {
            const res    = await fetch(API_URL, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(payload),
            });
            return res.json();
        }

        // ── Quick generate ─────────────────────────────────────────────────────
        async function generateIncident(type) {
            const device = ALL_RESIDENTS[Math.floor(Math.random() * ALL_RESIDENTS.length)];
            if (!device) { logMessage('No residents found', 'error'); return; }

            const coords  = getRandomCoords();
            const result  = await postIncident({
                device_id: device.device_id,
                type:      'INCIDENT',
                button:    type,
                lat:       coords.lat,
                lng:       coords.lng,
                timestamp: Date.now(),
            });

            if (result.success) {
                const actionTag = result.action === 'corroborated'
                    ? `<span class="bg-orange-200 text-orange-800 px-1 rounded">CORROBORATED #${result.confidence_score}</span>`
                    : `<span class="bg-green-200 text-green-800 px-1 rounded">NEW</span>`;
                logMessage(`✓ ${type.toUpperCase()} ${actionTag} — ${result.incident_id} by ${result.reporter}`, 'success');
            } else {
                logMessage(`✗ ${result.message}`, 'error');
            }
            checkAPIConnection();
        }

        async function generateRandomIncidents(count) {
            logMessage(`Generating ${count} random incidents...`, 'info');
            const types = ['fire', 'crime', 'flood'];
            for (let i = 0; i < count; i++) {
                await generateIncident(types[Math.floor(Math.random() * types.length)]);
                await sleep(400);
            }
        }

        // ── Reporter rows ──────────────────────────────────────────────────────
        let reporterRowCount = 0;

        function addReporterRow() {
            const container = document.getElementById('corroReporters');
            const idx       = reporterRowCount++;
            const options   = ALL_RESIDENTS.map((r, i) =>
                `<option value="${r.device_id}" ${i === idx % ALL_RESIDENTS.length ? 'selected' : ''}>${r.name} (${r.device_id})</option>`
            ).join('');

            const row = document.createElement('div');
            row.id    = `reporter-row-${idx}`;
            row.className = 'flex items-center gap-2';
            row.innerHTML = `
                <span class="text-xs font-bold text-gray-400 w-6 text-center">${idx + 1}</span>
                <select class="flex-1 p-2 border rounded-lg text-sm reporter-select">${options}</select>
                ${idx > 1 ? `<button onclick="removeReporterRow(${idx})" class="text-red-400 hover:text-red-600 text-lg leading-none">×</button>` : '<span class="w-5"></span>'}
            `;
            container.appendChild(row);
        }

        function removeReporterRow(idx) {
            document.getElementById(`reporter-row-${idx}`)?.remove();
        }

        function getSelectedReporters() {
            return Array.from(document.querySelectorAll('.reporter-select'))
                .map(sel => sel.value)
                .filter(Boolean);
        }

        // ── Corroboration test ─────────────────────────────────────────────────
        async function runCorroborationTest() {
            const reporters = getSelectedReporters();
            if (reporters.length < 2) {
                logMessage('Add at least 2 reporters to test corroboration.', 'warning');
                return;
            }

            const type       = document.getElementById('corroType').value;
            const offsetDeg  = document.getElementById('corroOffset').value;
            const baseCoords = getRandomCoords(0.002);

            logMessage(`━━━ Starting Corroboration Test (${reporters.length} reporters, type: ${type}) ━━━`, 'info');

            for (let i = 0; i < reporters.length; i++) {
                const coords = i === 0
                    ? baseCoords
                    : getNearbyCoords(baseCoords.lat, baseCoords.lng, offsetDeg);

                const result = await postIncident({
                    device_id: reporters[i],
                    type:      'INCIDENT',
                    button:    type,
                    lat:       coords.lat,
                    lng:       coords.lng,
                    timestamp: Date.now(),
                });

                if (result.success) {
                    if (result.action === 'corroborated') {
                        const rescueFlag = result.needs_rescue
                            ? ' <span class="bg-red-500 text-white px-1 rounded">⚠️ RESCUE</span>'
                            : '';
                        logMessage(
                            `Reporter ${i + 1} (${reporters[i]}) → CORROBORATED — confidence: ${result.confidence_score}${rescueFlag}`,
                            result.needs_rescue ? 'rescue' : 'warning'
                        );
                    } else {
                        logMessage(
                            `Reporter ${i + 1} (${reporters[i]}) → NEW INCIDENT created: ${result.incident_id}`,
                            'success'
                        );
                    }
                } else {
                    logMessage(`Reporter ${i + 1} ✗ — ${result.message}`, 'error');
                }

                await sleep(600);
            }

            logMessage('━━━ Corroboration Test Complete ━━━', 'info');
            checkAPIConnection();
        }

        // ── Rescue signal test ─────────────────────────────────────────────────
        async function runRescueTest() {
            const reporters = getSelectedReporters();
            if (reporters.length < 1) {
                logMessage('Select at least 1 reporter.', 'warning');
                return;
            }

            const type       = document.getElementById('corroType').value;
            const device     = reporters[0];
            const baseCoords = getRandomCoords(0.002);

            logMessage(`━━━ Starting Rescue Signal Test — device: ${device} ━━━`, 'info');

            // Step 1: First press — creates new incident
            logMessage(`Step 1: First button press (should CREATE new incident)...`, 'info');
            const first = await postIncident({
                device_id: device,
                type:      'INCIDENT',
                button:    type,
                lat:       baseCoords.lat,
                lng:       baseCoords.lng,
                timestamp: Date.now(),
            });

            if (!first.success) {
                logMessage(`✗ Step 1 failed: ${first.message}`, 'error');
                return;
            }
            logMessage(`Step 1 ✓ — ${first.action === 'created' ? 'New incident: ' + first.incident_id : 'Corroborated: ' + first.incident_id}`, 'success');

            await sleep(1000);

            // Step 2: Same device presses again — should trigger rescue
            logMessage(`Step 2: Same device presses again (should trigger RESCUE signal)...`, 'info');
            const nearby = getNearbyCoords(baseCoords.lat, baseCoords.lng, 0.0005);
            const second = await postIncident({
                device_id: device,
                type:      'INCIDENT',
                button:    type,
                lat:       nearby.lat,
                lng:       nearby.lng,
                timestamp: Date.now(),
            });

            if (second.success) {
                if (second.needs_rescue) {
                    logMessage(
                        `⚠️ RESCUE SIGNAL CONFIRMED — ${device} needs rescue! confidence: ${second.confidence_score}`,
                        'rescue'
                    );
                } else {
                    logMessage(
                        `Step 2 returned success but needs_rescue was FALSE — check proximity/timing logic.`,
                        'warning'
                    );
                }
                logJSON('Full response', second, second.needs_rescue ? 'rescue' : 'warning');
            } else {
                logMessage(`✗ Step 2 failed: ${second.message}`, 'error');
            }

            logMessage('━━━ Rescue Signal Test Complete ━━━', 'info');
            checkAPIConnection();
        }

        // ── Moving simulation ──────────────────────────────────────────────────
        async function toggleMovingIncident() {
            isMoving ? stopMoving() : startMoving();
        }

        async function startMoving() {
            const device = document.getElementById('moveDevice').value;
            const type   = document.getElementById('moveType').value;
            const btn    = document.getElementById('movingBtn');

            isMoving = true;
            btn.textContent = '⏹️ Stop Simulation';
            btn.className   = 'bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl w-full mb-3 transition';
            document.getElementById('movingStatus').classList.remove('hidden');

            const startCoords = getRandomCoords();
            const first = await postIncident({
                device_id: device,
                type:      'INCIDENT',
                button:    type,
                lat:       startCoords.lat,
                lng:       startCoords.lng,
                timestamp: Date.now(),
            });

            if (!first.success) {
                logMessage(`✗ Failed to start: ${first.message}`, 'error');
                stopMoving();
                return;
            }
            logMessage(`✓ Created ${type} incident: ${first.incident_id} — starting GPS updates`, 'success');

            let updateCount = 0;
            let lat = startCoords.lat;
            let lng = startCoords.lng;

            movingInterval = setInterval(async () => {
                if (!isMoving) { clearInterval(movingInterval); return; }

                updateCount++;
                lat += (Math.random() - 0.5) * 0.0005;
                lng += (Math.random() - 0.5) * 0.0005;

                await postIncident({
                    device_id: device,
                    type:      'GPS_UPDATE',
                    button:    type,
                    lat, lng,
                    timestamp: Date.now(),
                });

                document.getElementById('movingText').textContent      = `(${lat.toFixed(6)}, ${lng.toFixed(6)})`;
                document.getElementById('movingProgress').textContent  = `${updateCount}/10`;
                document.getElementById('progressBar').style.width     = (updateCount * 10) + '%';
                logMessage(`→ GPS ${updateCount}/10 — (${lat.toFixed(6)}, ${lng.toFixed(6)})`, 'info');

                if (updateCount >= 10) {
                    stopMoving();
                    logMessage('✓ GPS simulation complete.', 'success');
                }
            }, 3000); // 3 seconds for testing (not 10)
        }

        function stopMoving() {
            isMoving = false;
            clearInterval(movingInterval);
            movingInterval = null;
            const btn = document.getElementById('movingBtn');
            btn.textContent = '▶️ Start Moving Emergency (10 GPS updates)';
            btn.className   = 'bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl w-full mb-3 transition';
            setTimeout(() => {
                document.getElementById('movingStatus').classList.add('hidden');
                document.getElementById('progressBar').style.width = '0%';
            }, 3000);
        }

        // ── Geofence tester ────────────────────────────────────────────────────
        async function loadGeofenceStateUI() {
            const box = document.getElementById('geofenceStateBox');
            try {
                const res  = await fetch('api/settings/get.php?key=geofence_enabled');
                const data = await res.json();
                const enabled = (data.data?.value ?? data.value) === '1';
                box.textContent = enabled ? '🟢 Geofence is currently ON — outside incidents will be rejected' : '🔴 Geofence is currently OFF — all incidents accepted';
                box.className   = `mb-4 p-3 rounded-xl border text-sm font-medium text-center ${enabled ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-red-50 border-red-300 text-red-800'}`;
            } catch {
                box.textContent = '⚠️ Could not load geofence state';
                box.className   = 'mb-4 p-3 rounded-xl border text-sm font-medium text-center bg-yellow-50 border-yellow-300 text-yellow-800';
            }
        }

        async function setGeofence(enabled) {
            try {
                const res  = await fetch('api/settings/toggle_geofence.php', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ enabled }),
                });
                const data = await res.json();
                if (data.success) {
                    logMessage(`✓ Geofence ${enabled ? 'ENABLED' : 'DISABLED'}`, enabled ? 'success' : 'warning');
                } else {
                    logMessage(`✗ Failed to set geofence: ${data.message}`, 'error');
                }
            } catch {
                logMessage('✗ Network error setting geofence', 'error');
            }
            loadGeofenceStateUI();
        }

        async function sendGeofenceTest() {
            const device = document.getElementById('geofenceDevice').value;
            const type   = document.getElementById('geofenceType').value;
            const lat    = parseFloat(document.getElementById('geofenceLat').value);
            const lng    = parseFloat(document.getElementById('geofenceLng').value);

            if (!device) { logMessage('No device selected', 'error'); return; }

            logMessage(`Sending ${type} incident at (${lat}, ${lng})...`, 'info');

            const result = await postIncident({ device_id: device, type: 'INCIDENT', button: type, lat, lng, timestamp: Date.now() });

            if (result.success) {
                logMessage(`✓ Incident ACCEPTED — ${result.action}: ${result.incident_id} by ${result.reporter}`, 'success');
            } else {
                logMessage(`✗ Incident REJECTED — ${result.message}`, 'error');
            }
            logJSON('Full response', result, result.success ? 'success' : 'error');
            loadGeofenceStateUI();
            checkAPIConnection();
        }

        // ── Util ───────────────────────────────────────────────────────────────
        function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

        logMessage('Test generator ready.', 'info');
    </script>
</body>
</html>