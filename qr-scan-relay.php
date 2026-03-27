<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <title>SafeChain — QR Scanner</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f172a;
      color: #fff;
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .logo { font-size: 13px; font-weight: 700; color: #27C291; letter-spacing: 2px; margin-bottom: 8px; }
    h1 { font-size: 17px; font-weight: 700; margin-bottom: 4px; }
    p  { font-size: 12px; color: #94a3b8; margin-bottom: 20px; text-align: center; }

    .cam-wrap {
      position: relative;
      width: 100%;
      max-width: 380px;
      border-radius: 20px;
      overflow: hidden;
      background: #000;
      aspect-ratio: 4/3;
    }
    video, canvas { width: 100%; height: 100%; object-fit: cover; display: block; }
    canvas { position: absolute; inset: 0; display: none; }

    .overlay {
      position: absolute; inset: 0;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      pointer-events: none;
    }
    .brackets {
      position: relative; width: 200px; height: 200px;
    }
    .br { position: absolute; width: 32px; height: 32px; border-color: #27C291; border-style: solid; }
    .br-tl { top:0;    left:0;  border-width: 4px 0 0 4px; border-radius: 8px 0 0 0; }
    .br-tr { top:0;    right:0; border-width: 4px 4px 0 0; border-radius: 0 8px 0 0; }
    .br-bl { bottom:0; left:0;  border-width: 0 0 4px 4px; border-radius: 0 0 0 8px; }
    .br-br { bottom:0; right:0; border-width: 0 4px 4px 0; border-radius: 0 0 8px 0; }
    .scan-line {
      position: absolute; left: 8px; right: 8px; height: 2px;
      background: linear-gradient(90deg, transparent, #27C291, transparent);
      animation: scan 2s ease-in-out infinite;
    }
    @keyframes scan {
      0%   { top: 8px;             opacity: 0; }
      10%  { opacity: 1; }
      90%  { opacity: 1; }
      100% { top: calc(100% - 8px); opacity: 0; }
    }
    .hint { margin-top: 12px; font-size: 11px; color: rgba(255,255,255,.6);
            background: rgba(0,0,0,.4); padding: 4px 12px; border-radius: 20px; }

    .success-flash {
      position: absolute; inset: 0;
      background: rgba(39,194,145,.9);
      display: none;
      flex-direction: column;
      align-items: center; justify-content: center;
      gap: 8px;
    }
    .success-flash.show { display: flex; }
    .checkmark { font-size: 56px; }
    .success-mac { font-size: 14px; font-weight: 700; font-family: monospace; }

    .result-box {
      display: none;
      width: 100%; max-width: 380px;
      margin-top: 16px;
      background: #1e293b;
      border: 2px solid #27C291;
      border-radius: 16px;
      padding: 16px;
    }
    .result-box.show { display: block; }
    .result-label { font-size: 10px; color: #27C291; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
    .result-mac   { font-size: 18px; font-weight: 800; font-family: monospace; color: #fff; }
    .result-sub   { font-size: 11px; color: #64748b; margin-top: 4px; }
    .result-btn   {
      margin-top: 12px; width: 100%;
      padding: 12px; border: none; border-radius: 12px;
      background: #27C291; color: #fff;
      font-size: 14px; font-weight: 700; cursor: pointer;
    }
    .result-btn:active { opacity: 0.8; }
    .rescan-btn {
      margin-top: 8px; width: 100%; padding: 10px; border: 2px solid #334155;
      border-radius: 12px; background: transparent; color: #94a3b8;
      font-size: 13px; cursor: pointer;
    }

    .error-msg { color: #f87171; font-size: 12px; margin-top: 10px; text-align: center; line-height: 1.6; }
    .sent-msg  { color: #27C291;  font-size: 13px; margin-top: 12px; text-align: center; font-weight: 600; }
    .hidden    { display: none !important; }

    /* HTTPS warning banner */
    .https-warn {
      width: 100%; max-width: 380px;
      background: #fef3c7; border: 2px solid #f59e0b;
      border-radius: 14px; padding: 14px 16px;
      color: #92400e; font-size: 12px; text-align: center;
      line-height: 1.6;
    }
    .https-warn strong { display: block; font-size: 13px; margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="logo">SAFECHAIN</div>
  <h1>Scan Device QR</h1>
  <p>Point your phone's camera at the QR code<br>on the SafeChain keychain device</p>

  <!-- HTTPS / secure-context warning (shown if needed) -->
  <div id="httpsWarn" class="https-warn hidden">
    <strong>⚠️ Secure Connection Required</strong>
    Camera access requires HTTPS. Please ask your admin to open this link over a secure (https://) connection.
  </div>

  <div class="cam-wrap" id="camWrap">
    <video id="vid" autoplay playsinline muted></video>
    <canvas id="cvs"></canvas>

    <div class="overlay" id="overlay">
      <div class="brackets">
        <div class="br br-tl"></div>
        <div class="br br-tr"></div>
        <div class="br br-bl"></div>
        <div class="br br-br"></div>
        <div class="scan-line"></div>
      </div>
      <div class="hint">Aim at device QR code</div>
    </div>

    <div class="success-flash" id="successFlash">
      <div class="checkmark">✓</div>
      <div class="success-mac" id="successMac"></div>
    </div>
  </div>

  <div class="result-box" id="resultBox">
    <div class="result-label">✓ Device Scanned</div>
    <div class="result-mac" id="resultMac">—</div>
    <div class="result-sub" id="resultSub"></div>
    <button class="result-btn" id="sendBtn" onclick="sendResult()">Send to Admin Dashboard</button>
    <button class="rescan-btn" onclick="rescan()">Scan Again</button>
  </div>

  <div class="error-msg" id="errMsg"></div>
  <div class="sent-msg hidden" id="sentMsg">✓ Sent! You can close this page.</div>

  <script>
    const SESSION = new URLSearchParams(location.search).get("session") || "";

    // ── Build an absolute URL for the relay API so it works regardless of
    //    which subdirectory this page is served from.
    //    The qr_relay.php is always at <origin>/api/devices/qr_relay.php
    const RELAY_URL = window.location.origin + "/api/devices/qr_relay.php";

    let stream, raf, scanned = false, scannedMac = "", scannedBatch = "";

    // ── HTTPS / getUserMedia availability check ──────────────────────────────
    function checkSecureContext() {
      // isSecureContext is false on plain HTTP (except localhost)
      if (!window.isSecureContext || !navigator.mediaDevices) {
        document.getElementById("httpsWarn").classList.remove("hidden");
        document.getElementById("camWrap").classList.add("hidden");
        return false;
      }
      return true;
    }

    async function init() {
      if (!checkSecureContext()) return;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        const vid = document.getElementById("vid");
        vid.srcObject = stream;
        await vid.play();
        tick();
      } catch (e) {
        // Give the user a specific, actionable message instead of the generic one
        let msg = "Camera error — please try again.";
        if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
          msg = "Camera permission denied. Go to your browser settings, allow camera for this site, then reload.";
        } else if (e.name === "NotFoundError" || e.name === "DevicesNotFoundError") {
          msg = "No camera found on this device.";
        } else if (e.name === "NotReadableError" || e.name === "TrackStartError") {
          msg = "Camera is in use by another app. Close it and reload this page.";
        } else if (e.name === "OverconstrainedError") {
          // Rear camera not available — fall back to any camera
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const vid = document.getElementById("vid");
            vid.srcObject = stream;
            await vid.play();
            tick();
            return;
          } catch (e2) {
            msg = "Could not access any camera: " + e2.message;
          }
        } else {
          msg = "Camera error: " + e.message;
        }
        document.getElementById("errMsg").textContent = msg;
      }
    }

    function tick() {
      const vid = document.getElementById("vid");
      const cvs = document.getElementById("cvs");

      // Safety guard — jsQR should be loaded by now, but double-check
      if (!window.jsQR) { raf = requestAnimationFrame(tick); return; }

      const ctx = cvs.getContext("2d");

      if (vid.readyState === vid.HAVE_ENOUGH_DATA && !scanned) {
        cvs.width  = vid.videoWidth;
        cvs.height = vid.videoHeight;
        ctx.drawImage(vid, 0, 0, cvs.width, cvs.height);
        const img  = ctx.getImageData(0, 0, cvs.width, cvs.height);
        const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });

        if (code) {
          handleResult(code.data);
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    }

    function handleResult(raw) {
      scanned = true;
      cancelAnimationFrame(raf);
      // Stop camera stream
      if (stream) stream.getTracks().forEach(t => t.stop());

      let mac = "", batch = "", extra = "";
      try {
        const p = JSON.parse(raw);
        mac   = (p.mac || p.bt_mac || p.address || "").toUpperCase();
        batch = p.batch || p.batch_number || "";
        extra = p.model ? "Model: " + p.model : "";
      } catch {
        const u = raw.trim().toUpperCase();
        let s = u;
        ["SC:", "SAFECHAIN:"].forEach(pfx => { if (u.startsWith(pfx)) s = u.slice(pfx.length); });
        mac = s.replace(/[^A-F0-9]/g, "").match(/.{1,2}/g)?.join(":") ?? s;
      }

      if (!/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(mac)) {
        document.getElementById("errMsg").textContent = `Invalid QR: "${raw.slice(0, 50)}"`;
        scanned = false;
        // Restart camera
        init();
        return;
      }

      scannedMac   = mac;
      scannedBatch = batch;

      // Show success flash inside the cam-wrap
      const flash = document.getElementById("successFlash");
      document.getElementById("successMac").textContent = mac;
      flash.classList.add("show");

      // After flash: HIDE the camera view entirely, show the result card
      setTimeout(() => {
        flash.classList.remove("show");
        document.getElementById("camWrap").classList.add("hidden"); // ← FIX: hide scanner
        document.getElementById("resultMac").textContent = mac;
        document.getElementById("resultSub").textContent = batch ? "Batch: " + batch : (extra || "");
        document.getElementById("resultBox").classList.add("show");
      }, 1600);
    }

    async function sendResult() {
      if (!SESSION) {
        document.getElementById("errMsg").textContent = "No session ID in URL. Please re-scan the QR from the admin dashboard.";
        return;
      }
      const btn = document.getElementById("sendBtn");
      btn.textContent = "Sending…";
      btn.disabled = true;

      try {
        const res  = await fetch(RELAY_URL, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ session: SESSION, mac: scannedMac, batch: scannedBatch }),
        });
        const json = await res.json();
        if (json.success) {
          document.getElementById("resultBox").classList.remove("show");
          document.getElementById("sentMsg").classList.remove("hidden");
        } else {
          btn.textContent = "Send to Admin Dashboard";
          btn.disabled = false;
          document.getElementById("errMsg").textContent = json.message || "Failed to send.";
        }
      } catch {
        btn.textContent = "Send to Admin Dashboard";
        btn.disabled = false;
        document.getElementById("errMsg").textContent = "Network error. Try again.";
      }
    }

    function rescan() {
      scanned    = false;
      scannedMac = "";
      document.getElementById("resultBox").classList.remove("show");
      document.getElementById("camWrap").classList.remove("hidden"); // show camera again
      document.getElementById("errMsg").textContent = "";
      init();
    }

    // Load jsQR dynamically and only call init() once it's ready.
    // Primary: jsDelivr  (cdnjs path 404s for jsQR 1.4.0)
    // Fallback: unpkg
    (function loadJsQR() {
      const URLS = [
        'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js',
        'https://unpkg.com/jsqr@1.4.0/dist/jsQR.min.js',
      ];
      let idx = 0;
      function tryNext() {
        if (idx >= URLS.length) {
          document.getElementById('errMsg').textContent =
            'Failed to load QR scanner library. Check your internet connection and reload.';
          return;
        }
        const s = document.createElement('script');
        s.src = URLS[idx++];
        s.onload = () => init();
        s.onerror = () => tryNext();
        document.head.appendChild(s);
      }
      tryNext();
    })();
  </script>
</body>
</html>