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
    <div class="max-w-5xl mx-auto">
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h1 class="text-3xl font-bold text-gray-800 mb-2">🚨 SafeChain Test Incident Generator</h1>
            <p class="text-gray-600 mb-4">Generate test incidents to simulate LoRa device button presses</p>
            
            <!-- Status -->
            <div id="status" class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <p class="text-sm text-blue-800">⏳ Initializing...</p>
            </div>
        </div>

        <!-- Quick Test Buttons -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4">Quick Generate</h2>
            <div class="grid grid-cols-3 gap-4 mb-4">
                <button onclick="generateIncident('fire')" 
                        class="bg-red-500 hover:bg-red-600 text-white font-bold py-6 px-6 rounded-lg transition transform hover:scale-105">
                    🔥<br>Fire Emergency
                </button>
                <button onclick="generateIncident('crime')" 
                        class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-6 px-6 rounded-lg transition transform hover:scale-105">
                    🛡️<br>Crime Report
                </button>
                <button onclick="generateIncident('flood')" 
                        class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 px-6 rounded-lg transition transform hover:scale-105">
                    🌊<br>Flood Alert
                </button>
            </div>
            <button onclick="generateRandomIncidents(5)" 
                    class="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg w-full">
                🎲 Generate 5 Random Historical Incidents
            </button>
        </div>

        <!-- Moving User Simulation -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4">📍 Simulate Moving User (Continuous GPS)</h2>
            <p class="text-sm text-gray-600 mb-4">This simulates a user pressing an emergency button and moving around. Location updates every 10 seconds.</p>
            
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Select Device</label>
                    <select id="moveDevice" class="w-full p-3 border rounded-lg">
                        <?php
                         include $_SERVER['DOCUMENT_ROOT'] . '/config/conn.php'; 
                        $query = "SELECT device_id, name FROM residents WHERE is_archived = 0 ORDER BY name";
                        $result = mysqli_query($conn, $query);
                        while ($row = mysqli_fetch_assoc($result)) {
                            echo "<option value='{$row['device_id']}'>{$row['name']} ({$row['device_id']})</option>";
                        }
                        mysqli_close($conn);
                        ?>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Emergency Type</label>
                    <select id="moveType" class="w-full p-3 border rounded-lg">
                        <option value="fire">🔥 Fire</option>
                        <option value="crime">🛡️ Crime</option>
                        <option value="flood">🌊 Flood</option>
                    </select>
                </div>
            </div>
            
            <button id="movingBtn" onclick="toggleMovingIncident()" 
                    class="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg w-full mb-3">
                ▶️ Start Moving Emergency (10 GPS updates)
            </button>
            
            <div id="movingStatus" class="bg-gray-50 rounded p-3 text-sm text-gray-600 hidden">
                <div class="flex items-center justify-between">
                    <span id="movingText">Preparing...</span>
                    <span id="movingProgress" class="font-bold">0/10</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div id="progressBar" class="bg-purple-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
            </div>
        </div>

        <!-- Response Log -->
        <div class="bg-white rounded-lg shadow-lg p-6">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold text-gray-800">📋 Response Log</h2>
                <button onclick="clearLog()" class="text-sm text-red-600 hover:text-red-800">Clear Log</button>
            </div>
            <div id="log" class="space-y-2 max-h-96 overflow-y-auto"></div>
        </div>
    </div>

    <script>
        const API_URL = 'api/receive_incident.php';
        const GULOD_CENTER = { lat: 14.7158532, lng: 121.0403842 };
        const OFFSET_RANGE = 0.005; // ~500 meters
        
        let movingInterval = null;
        let isMoving = false;
        
        // Check API connection on load
        window.addEventListener('load', () => {
            checkAPIConnection();
        });
        
        async function checkAPIConnection() {
            const status = document.getElementById('status');
            try {
                const response = await fetch('api/dashboard/get_incidents.php');
                const result = await response.json();
                if (result.success) {
                    status.innerHTML = '<p class="text-sm text-green-800">✓ Connected to API | Total incidents: ' + result.count.total + '</p>';
                    status.className = 'bg-green-50 border border-green-200 rounded-lg p-3 mb-6';
                } else {
                    throw new Error('API returned error');
                }
            } catch (error) {
                status.innerHTML = '<p class="text-sm text-red-800">✗ Cannot connect to API. Make sure XAMPP is running!</p>';
                status.className = 'bg-red-50 border border-red-200 rounded-lg p-3 mb-6';
            }
        }
        
        function logMessage(message, type = 'info') {
            const log = document.getElementById('log');
            const colors = {
                success: 'bg-green-100 text-green-800 border-green-300',
                error: 'bg-red-100 text-red-800 border-red-300',
                info: 'bg-blue-100 text-blue-800 border-blue-300',
                warning: 'bg-yellow-100 text-yellow-800 border-yellow-300'
            };
            
            const entry = document.createElement('div');
            entry.className = `p-3 rounded border ${colors[type]} text-sm animate-fade-in`;
            entry.innerHTML = `<strong>${new Date().toLocaleTimeString()}</strong> - ${message}`;
            log.insertBefore(entry, log.firstChild);
        }
        
        function clearLog() {
            document.getElementById('log').innerHTML = '';
            logMessage('Log cleared', 'info');
        }
        
        function getRandomCoords() {
            return {
                lat: GULOD_CENTER.lat + (Math.random() - 0.5) * OFFSET_RANGE,
                lng: GULOD_CENTER.lng + (Math.random() - 0.5) * OFFSET_RANGE
            };
        }
        
        async function generateIncident(type) {
            const devices = Array.from(document.getElementById('moveDevice').options).map(opt => opt.value);
            const device = devices[Math.floor(Math.random() * devices.length)];
            const coords = getRandomCoords();
            
            const payload = {
                device_id: device,
                type: 'INCIDENT',
                button: type,
                lat: coords.lat,
                lng: coords.lng,
                speed: Math.random() * 5,
                satellites: Math.floor(Math.random() * 5) + 4,
                timestamp: Date.now()
            };
            
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    logMessage(`✓ Created ${type} incident: ${result.incident_id} by ${result.reporter} at (${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)})`, 'success');
                    checkAPIConnection(); // Update count
                } else {
                    logMessage(`✗ Failed: ${result.message}`, 'error');
                }
            } catch (error) {
                logMessage(`✗ Error: ${error.message}`, 'error');
            }
        }
        
        async function generateRandomIncidents(count) {
            logMessage(`Generating ${count} random incidents...`, 'info');
            const types = ['fire', 'crime', 'flood'];
            
            for (let i = 0; i < count; i++) {
                const type = types[Math.floor(Math.random() * types.length)];
                await generateIncident(type);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        async function toggleMovingIncident() {
            if (isMoving) {
                stopMoving();
            } else {
                startMoving();
            }
        }
        
        async function startMoving() {
            const device = document.getElementById('moveDevice').value;
            const type = document.getElementById('moveType').value;
            const btn = document.getElementById('movingBtn');
            const statusDiv = document.getElementById('movingStatus');
            
            isMoving = true;
            btn.textContent = '⏹️ Stop Moving Emergency';
            btn.className = 'bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg w-full mb-3';
            statusDiv.classList.remove('hidden');
            
            // Create initial incident
            const startCoords = getRandomCoords();
            const initialPayload = {
                device_id: device,
                type: 'INCIDENT',
                button: type,
                lat: startCoords.lat,
                lng: startCoords.lng,
                speed: 2.5,
                satellites: 8,
                timestamp: Date.now()
            };
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(initialPayload)
            });
            
            const result = await response.json();
            
            if (!result.success) {
                logMessage(`✗ Failed to start: ${result.message}`, 'error');
                stopMoving();
                return;
            }
            
            logMessage(`✓ Started moving ${type} incident: ${result.incident_id}`, 'success');
            
            // GPS updates
            let updateCount = 0;
            let currentLat = startCoords.lat;
            let currentLng = startCoords.lng;
            
            movingInterval = setInterval(async () => {
                if (!isMoving) {
                    clearInterval(movingInterval);
                    return;
                }
                
                updateCount++;
                
                // Move in small random increments
                currentLat += (Math.random() - 0.5) * 0.0005;
                currentLng += (Math.random() - 0.5) * 0.0005;
                
                const updatePayload = {
                    device_id: device,
                    type: 'GPS_UPDATE',
                    button: type,
                    lat: currentLat,
                    lng: currentLng,
                    speed: 1 + Math.random() * 3,
                    satellites: Math.floor(Math.random() * 4) + 6,
                    timestamp: Date.now()
                };
                
                await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatePayload)
                });
                
                document.getElementById('movingText').textContent = `Location: (${currentLat.toFixed(6)}, ${currentLng.toFixed(6)})`;
                document.getElementById('movingProgress').textContent = `${updateCount}/10`;
                document.getElementById('progressBar').style.width = (updateCount * 10) + '%';
                
                logMessage(`→ GPS Update ${updateCount}/10: (${currentLat.toFixed(6)}, ${currentLng.toFixed(6)})`, 'info');
                
                if (updateCount >= 10) {
                    stopMoving();
                    logMessage(`✓ Completed 10 GPS updates`, 'success');
                }
            }, 10000); // 10 seconds
        }
        
        function stopMoving() {
            isMoving = false;
            if (movingInterval) {
                clearInterval(movingInterval);
                movingInterval = null;
            }
            
            const btn = document.getElementById('movingBtn');
            btn.textContent = '▶️ Start Moving Emergency (10 GPS updates)';
            btn.className = 'bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg w-full mb-3';
            
            setTimeout(() => {
                document.getElementById('movingStatus').classList.add('hidden');
                document.getElementById('progressBar').style.width = '0%';
            }, 3000);
        }
        
        // Initial log
        logMessage('Test generator ready! Click buttons above to simulate incidents.', 'info');
    </script>
</body>
</html>