<?php
require_once '../config/conn.php';
require_once '../includes/auth_helper.php';
AuthChecker::requireAuth('/auth/login.php');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Heatmap Capture</title>
  <base href="../../" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 900px; height: 600px; overflow: hidden; background: #fff; }
    #map { width: 900px; height: 600px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map("map", {
      zoomControl: false,
      attributionControl: false,
      maxZoom: 21,
    }).setView([14.7158532, 121.0403842], 16);

    L.tileLayer(
      "https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=2bXjFOI9q9BSiHQVwLb7",
      { maxZoom: 21, maxNativeZoom: 21 }
    ).addTo(map);

    const heatmapConfigs = {
      fire: {
        radius: 28, blur: 20, maxZoom: 15, max: 2.0, minOpacity: 0.3,
        gradient: {
          0.2: "rgba(255, 255, 0, 0.4)",
          0.5: "rgba(255, 128, 0, 0.7)",
          0.8: "rgba(220, 38, 38, 0.9)",
          1.0: "rgba(100, 0, 0, 1.0)",
        },
      },
      crime: {
        radius: 28, blur: 20, maxZoom: 15, max: 2.0, minOpacity: 0.3,
        gradient: {
          0.2: "rgba(255, 240, 120, 0.4)",
          0.5: "rgba(251, 191, 36, 0.7)",
          0.8: "rgba(217, 119, 6, 0.9)",
          1.0: "rgba(100, 40, 0, 1.0)",
        },
      },
      flood: {
        radius: 35, blur: 25, maxZoom: 15, max: 2.0, minOpacity: 0.3,
        gradient: {
          0.2: "rgba(150, 200, 255, 0.4)",
          0.5: "rgba(59, 130, 246, 0.7)",
          0.8: "rgba(29, 78, 216, 0.9)",
          1.0: "rgba(8, 15, 60, 1.0)",
        },
      },
    };

    async function loadAndRender() {
      try {
        const res = await fetch("api/dashboard/get_incidents.php");
        const data = await res.json();

        if (!data.success || !data.heatmap) return;

        ["fire", "crime", "flood"].forEach((type) => {
          const points = (data.heatmap[type] || [])
            .filter((p) => p.lat && p.lng && p.intensity)
            .map((p) => [p.lat, p.lng, p.intensity]);

          if (points.length === 0) return;

          L.heatLayer(points, heatmapConfigs[type]).addTo(map);
        });

      } catch (e) {
        console.error("Heatmap load failed:", e);
      }
    }

    // ── BroadcastChannel listener ─────────────────────────────
    const channel = new BroadcastChannel("safechain_heatmap_export");

    channel.addEventListener("message", async (event) => {
      if (event.data?.type !== "REQUEST_HEATMAP") return;

      // Wait a moment for tiles to settle before capturing
      await new Promise((r) => setTimeout(r, 500));

      try {
        const canvas = await html2canvas(document.getElementById("map"), {
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          allowTaint: false,
          width: 900,
          height: 600,
        });
        channel.postMessage({
          type: "HEATMAP_RESULT",
          image: canvas.toDataURL("image/jpeg", 0.85),
        });
      } catch (e) {
        channel.postMessage({ type: "HEATMAP_RESULT", image: null });
      }
    });

    // Load heatmap data on page ready
    window.addEventListener("load", () => {
      // Wait for base tiles to load before fetching data
      map.once("load", loadAndRender);
      // Fallback if 'load' doesn't fire
      setTimeout(loadAndRender, 1500);
    });
  </script>
</body>
</html>