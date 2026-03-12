<?php
require_once '../config/conn.php';
require_once '../includes/auth_helper.php';

AuthChecker::requireAuth('/auth/login.php');
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <title>Analytics Report — SafeChain</title>
    <base href="../../" />
    <link rel="stylesheet" href="assets/css/report-template.css" />
    <link rel="stylesheet" href="assets/unicons/line.css" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.heat/0.2.0/leaflet-heat.js"></script>
</head>

<body>
    <div id="editBanner">
        ✏️ Edit mode — click any text to modify it. Click <strong>Done Editing</strong> when finished.
    </div>

    <!-- FAB -->
    <div class="fab-container open">
        <div class="fab-actions">
            <button class="fab-action-btn openBtn">
                <i class="uil uil-print"></i>
                <span>Print</span>
            </button>
            <button class="fab-action-btn editBtn">
                <i class="uil uil-edit"></i>
                <span>Edit Content</span>
            </button>
            <button class="fab-action-btn downloadBtn">
                <i class="uil uil-import"></i>
                <span>Download as PDF</span>
            </button>
        </div>
        <button class="fab-main" id="fabToggle">
            <i class="uil uil-plus fab-icon-plus"></i>
            <i class="uil uil-times fab-icon-close"></i>
        </button>
    </div>

    <div class="container">
        <div class="a4" id="page-1">

            <!-- Header — identical to your incident report -->
            <div class="header">
                <div class="header-left">
                    <img src="assets/img/qc-logo.jpg" alt="" />
                </div>
                <div class="header-center">
                    <div class="header-title">REPUBLIC OF THE PHILIPPINES</div>
                    <div class="header-subtitle">BARANGAY GULOD</div>
                    <div class="header-address">VILLAFLOR VILLAGE, DISTRICT V, QUEZON CITY</div>
                    <div class="header-tel">Tel. No. 8366-3198</div>
                </div>
                <div class="header-right">
                    <img src="assets/img/gulod-logo.png" alt="" />
                </div>
            </div>

            <div class="main-content">

                <!-- Barangay Officials sidebar — same as incident report -->
                <aside class="barangay-officials">
                    <div class="barangay-captain">
                        <span class="official-name">REY ALDRIN S. TOLENTINO</span>
                        <span class="position">Punong Barangay</span>
                    </div>
                    <div class="officials-section-title">Barangay Kagawad</div>
                    <div class="official-item"><span class="official-name">LOVEL V. ALINAJE</span><span
                            class="position">BIGLANG-AWA</span></div>
                    <div class="official-item"><span class="official-name">MARLON S. SORIANO</span></div>
                    <div class="official-item"><span class="official-name">SHERILL B. AGLE</span></div>
                    <div class="official-item"><span class="official-name">PERCIVAL M. CASTELLFORT</span></div>
                    <div class="official-item"><span class="official-name">EDGAR P. BABALOT</span></div>
                    <div class="official-item"><span class="official-name">NONITO D. GONZALES</span></div>
                    <div class="official-item"><span class="official-name">GLENDEL B. CLEMENTE</span></div>
                    <div class="official-item"><span class="official-name">ALJOHN JAYZEL E. CLEMENTE, JMA</span><span
                            class="position">SK Chairperson</span></div>
                    <div class="official-item"><span class="official-name line-height-0">MILA B. NARIO</span><span
                            class="position">Barangay Secretary</span></div>
                    <div class="official-item"><span class="official-name line-height-0">LUNINGNING R.
                            ARATAS</span><span class="position">Barangay Treasurer</span></div>
                </aside>

                <!-- Content injected from sessionStorage -->
                <div class="content" id="main-content">
                    <!-- populated by JS below -->
                </div>

            </div>
        </div>
    </div>

    <script>
        document.addEventListener("DOMContentLoaded", function () {

            // ── Inject content from sessionStorage ───────────────────
            const content = sessionStorage.getItem("analyticsReportContent");
            const filename = sessionStorage.getItem("analyticsReportFilename") || "SafeChain_Analytics_Report";

            if (content) {
                document.getElementById("main-content").innerHTML = content;
                sessionStorage.removeItem("analyticsReportContent");
                sessionStorage.removeItem("analyticsReportFilename");
            } else {
                document.getElementById("main-content").innerHTML =
                    "<div class='list-item' style='color:red'>No analytics data found. Please export from the Analytics page.</div>";
            }

            // ── Pagination (identical to your incident report) ────────
            const mainContent = document.querySelector("#main-content");
            const firstPage = document.querySelector("#page-1");
            const container = document.querySelector(".container");
            const MAX_CONTENT_HEIGHT = 850;

            function createNewPage() {
                const newPage = firstPage.cloneNode(true);
                const newContent = newPage.querySelector(".content");
                newContent.innerHTML = "";
                newContent.style.backgroundImage = "none";
                newPage.style.marginTop = "20px";
                container.appendChild(newPage);
                return newContent;
            }

            function splitContent() {
                const allItems = Array.from(mainContent.children);

                const probe = document.createElement("div");
                probe.style.cssText = "position:fixed;top:0;left:-9999px;width:500px;visibility:hidden;";
                document.body.appendChild(probe);

                let pages = [[]];
                let currentHeight = 0;
                let pageIndex = 0;

                for (let i = 0; i < allItems.length; i++) {
                    const el = allItems[i];

                    // Measure current item
                    const clone = el.cloneNode(true);
                    probe.appendChild(clone);
                    const elHeight = clone.offsetHeight + 8;
                    probe.removeChild(clone);

                    // If it's a section-title, also measure the NEXT sibling so they
                    // are never separated — if both don't fit, push to next page together
                    if (el.classList.contains("section-title") && allItems[i + 1]) {
                        const nextClone = allItems[i + 1].cloneNode(true);
                        probe.appendChild(nextClone);
                        const nextHeight = nextClone.offsetHeight + 8;
                        probe.removeChild(nextClone);

                        const combinedHeight = elHeight + nextHeight;

                        if (currentHeight + combinedHeight > MAX_CONTENT_HEIGHT && currentHeight > 0) {
                            pageIndex++;
                            pages[pageIndex] = [];
                            currentHeight = 0;
                        }

                        pages[pageIndex].push(el.cloneNode(true));
                        currentHeight += elHeight;
                    } else {
                        if (currentHeight + elHeight > MAX_CONTENT_HEIGHT && currentHeight > 0) {
                            pageIndex++;
                            pages[pageIndex] = [];
                            currentHeight = 0;
                        }

                        pages[pageIndex].push(el.cloneNode(true));
                        currentHeight += elHeight;
                    }
                }

                document.body.removeChild(probe);

                // Render pages
                mainContent.innerHTML = "";
                pages[0].forEach((el) => mainContent.appendChild(el));

                for (let p = 1; p < pages.length; p++) {
                    const newContent = createNewPage();
                    pages[p].forEach((el) => newContent.appendChild(el));
                }
            }

            // ── FAB toggle ────────────────────────────────────────────
            const fab = document.querySelector(".fab-container");
            const toggle = document.getElementById("fabToggle");
            toggle.addEventListener("click", () => fab.classList.toggle("open"));

            // ── Print ─────────────────────────────────────────────────
            document.querySelector(".openBtn").addEventListener("click", () => {
                if (isEditing) document.querySelector(".editBtn").click();
                setTimeout(() => window.print(), 400);
            });

            // ── Download PDF (same logic as incident report) ──────────
            document.querySelector(".downloadBtn").addEventListener("click", async function () {
                const { jsPDF } = window.jspdf;
                const pages = document.querySelectorAll(".a4");
                const btn = this;

                btn.innerHTML = '<i class="uil uil-spinner-alt"></i><span>Generating...</span>';
                btn.disabled = true;
                fab.style.visibility = "hidden";

                try {
                    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

                    for (let i = 0; i < pages.length; i++) {
                        const page = pages[i];
                        const originalStyle = page.getAttribute("style") || "";
                        page.style.width = "794px";
                        page.style.height = "1123px";
                        page.style.position = "fixed";
                        page.style.top = "0";
                        page.style.left = "0";
                        page.style.zIndex = "-9999";

                        const canvas = await html2canvas(page, {
                            scale: 4,
                            useCORS: true,
                            logging: false,
                            backgroundColor: "#ffffff",
                            width: 794,
                            height: 1123,
                            windowWidth: 794,
                            windowHeight: 1123,
                        });

                        page.setAttribute("style", originalStyle);

                        const imgData = canvas.toDataURL("image/jpeg", 0.95);
                        if (i > 0) pdf.addPage("a4", "portrait");
                        pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
                    }

                    pdf.save(`${filename}.pdf`);

                } catch (err) {
                    console.error("PDF generation failed:", err);
                    alert("Failed to generate PDF. Please try again.");
                } finally {
                    fab.style.visibility = "visible";
                    btn.innerHTML = '<i class="uil uil-import"></i><span>Download as PDF</span>';
                    btn.disabled = false;
                }
            });

            // ── Edit toggle (same as incident report) ─────────────────
            let isEditing = false;
            const editableSelectors = [
                ".report-subtitle",
                ".section-content .list-item",
                ".section-title",
            ];

            document.querySelector(".editBtn").addEventListener("click", function () {
                isEditing = !isEditing;

                document.querySelectorAll(editableSelectors.join(",")).forEach((el) => {
                    el.contentEditable = isEditing ? "true" : "false";
                    if (isEditing) {
                        el.style.outline = "1px dashed #3b82f6";
                        el.style.borderRadius = "3px";
                        el.style.minHeight = "1em";
                        el.style.cursor = "text";
                    } else {
                        el.style.outline = "";
                        el.style.borderRadius = "";
                        el.style.cursor = "";
                    }
                });

                this.innerHTML = isEditing
                    ? '<i class="uil uil-check"></i><span>Done Editing</span>'
                    : '<i class="uil uil-edit"></i><span>Edit Content</span>';

                const banner = document.getElementById("editBanner");
                if (banner) banner.classList.toggle("visible", isEditing);
            });

            // ── Run split then optionally auto-download ───────────────
            window.addEventListener("load", () => {
                setTimeout(() => {
                    splitContent();

                    const urlParams = new URLSearchParams(window.location.search);
                    if (urlParams.get("autodownload") === "1") {
                        setTimeout(() => {
                            document.querySelector(".downloadBtn").click();
                        }, 500);
                    }
                }, 300);
            });

            // ── Render heatmap if data present ───────────────────────
            const heatmapDataRaw = sessionStorage.getItem("analyticsHeatmapData");
            if (heatmapDataRaw) {
                sessionStorage.removeItem("analyticsHeatmapData");

                const heatmapData = JSON.parse(heatmapDataRaw);
                const container = document.getElementById("heatmapReportContainer");

                if (container) {
                    // Init map
                    const heatmap = L.map(container, {
                        zoomControl: false,
                        attributionControl: false,
                        dragging: false,
                        scrollWheelZoom: false,
                        doubleClickZoom: false,
                        boxZoom: false,
                        keyboard: false,
                        touchZoom: false,
                    }).setView([14.7158532, 121.0403842], 15);

                    L.tileLayer(
                        "https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=2bXjFOI9q9BSiHQVwLb7",
                        { maxZoom: 21, crossOrigin: true }
                    ).addTo(heatmap);

                    // Boundary
                    const gulodBoundary = { "type": "Feature", "properties": { "name": "Gulod" }, "geometry": { "type": "Polygon", "coordinates": [[[121.0334848, 14.711682], [121.0334957, 14.7115454], [121.0335308, 14.7114846], [121.0335862, 14.7114333], [121.0337882, 14.7112641], [121.0339523, 14.7111092], [121.0340751, 14.7109148], [121.0341028, 14.7108099], [121.0340604, 14.7106753], [121.0339774, 14.7105621], [121.0338543, 14.7105114], [121.0336751, 14.7104859], [121.0335323, 14.710492], [121.033562, 14.7101886], [121.0338342, 14.709774], [121.0339713, 14.7095436], [121.0345597, 14.7094757], [121.0350814, 14.7094277], [121.0362553, 14.7093446], [121.0363582, 14.7092669], [121.0364442, 14.709162], [121.0366244, 14.7089794], [121.036688, 14.7089056], [121.03699, 14.7091458], [121.0372903, 14.7091637], [121.0375888, 14.709336], [121.0382147, 14.7094565], [121.0384845, 14.709263], [121.03848, 14.7091378], [121.0384375, 14.7090308], [121.0387608, 14.708583], [121.0387662, 14.7084187], [121.0389081, 14.7083563], [121.0396347, 14.7080226], [121.0400809, 14.7080861], [121.0401844, 14.7080705], [121.0415248, 14.7075016], [121.0415217, 14.7066561], [121.0418078, 14.7058151], [121.0419812, 14.7052453], [121.0440479, 14.7052824], [121.0454888, 14.7052707], [121.0455003, 14.704594], [121.0468975, 14.7050443], [121.0474573, 14.7053168], [121.0472436, 14.7061441], [121.0472437, 14.7061633], [121.0471759, 14.7063696], [121.047172, 14.7070541], [121.0468812, 14.7074933], [121.0468267, 14.7079836], [121.0467387, 14.7084147], [121.0466027, 14.7087975], [121.0465728, 14.7088616], [121.0465237, 14.708988], [121.0465472, 14.7090729], [121.0466418, 14.7091216], [121.0467319, 14.7091885], [121.0467944, 14.7093433], [121.0467645, 14.709431], [121.0466762, 14.7095276], [121.0464922, 14.709637], [121.0459681, 14.7097706], [121.0459465, 14.7098262], [121.0459745, 14.7099749], [121.0459659, 14.7100253], [121.0460252, 14.7100798], [121.045984, 14.7102054], [121.0460574, 14.7104115], [121.046219, 14.7105981], [121.046361, 14.7107014], [121.0467486, 14.7109051], [121.0469001, 14.7110597], [121.0470558, 14.7112651], [121.0470603, 14.7113701], [121.0468657, 14.7118121], [121.04668, 14.7120473], [121.0463628, 14.7122458], [121.0461321, 14.7125295], [121.0459071, 14.712751], [121.04565, 14.7128774], [121.0452638, 14.7129189], [121.0449875, 14.7128681], [121.0446371, 14.7126643], [121.0444294, 14.7125356], [121.0441094, 14.7122657], [121.0436705, 14.7119655], [121.0434184, 14.7119718], [121.0432508, 14.7120946], [121.0431034, 14.7122324], [121.0429966, 14.7123962], [121.0429383, 14.7125755], [121.0429079, 14.7127791], [121.0429966, 14.7130402], [121.0431543, 14.7133731], [121.0432095, 14.7135], [121.0432103, 14.7136163], [121.0430658, 14.7139198], [121.0428879, 14.7146356], [121.0428612, 14.7148887], [121.0429258, 14.7150544], [121.0430697, 14.7151967], [121.0434241, 14.7154815], [121.0438905, 14.7157166], [121.0442338, 14.7158245], [121.0443492, 14.7159932], [121.0443099, 14.7161024], [121.0441341, 14.7162898], [121.0440041, 14.7165224], [121.0438154, 14.7173538], [121.0437188, 14.717601], [121.0436498, 14.7178396], [121.0434931, 14.7184845], [121.0434293, 14.7185908], [121.0433855, 14.7186606], [121.0433491, 14.718696], [121.0432445, 14.7187068], [121.0430669, 14.7186606], [121.0427013, 14.7184907], [121.042527, 14.7184298], [121.0421883, 14.7183594], [121.0420877, 14.7183753], [121.0418588, 14.7185368], [121.0416664, 14.7186873], [121.0414534, 14.7188422], [121.0411207, 14.7190733], [121.0409713, 14.7190759], [121.0404672, 14.7188598], [121.0401682, 14.7187086], [121.039773, 14.7184233], [121.0391703, 14.7176617], [121.0390905, 14.7175646], [121.0389286, 14.7174147], [121.0388499, 14.7173238], [121.0387788, 14.7172294], [121.0387494, 14.7171469], [121.0387334, 14.7170159], [121.0387279, 14.7168797], [121.0387239, 14.7167954], [121.0386924, 14.7167398], [121.0386199, 14.7166645], [121.0383958, 14.7164802], [121.0374912, 14.7159739], [121.0374116, 14.7159302], [121.0373821, 14.7159069], [121.0373667, 14.7158693], [121.0373533, 14.7158368], [121.0373462, 14.7157973], [121.0373377, 14.7157255], [121.0373544, 14.715513], [121.0373727, 14.7153563], [121.0373694, 14.7152856], [121.0373586, 14.7152214], [121.0373378, 14.7151652], [121.0372433, 14.71503], [121.0370918, 14.7148582], [121.0369087, 14.7146629], [121.0368524, 14.7146156], [121.0368115, 14.7145884], [121.0367752, 14.7145735], [121.0367116, 14.7145637], [121.0366505, 14.7145624], [121.0365533, 14.7145683], [121.0361651, 14.714615], [121.0357641, 14.7146798], [121.0351744, 14.7147687], [121.0351244, 14.7147602], [121.0350697, 14.7147391], [121.035004, 14.7146952], [121.0348887, 14.7145509], [121.0344099, 14.7140667], [121.0342536, 14.7138862], [121.0341839, 14.7136913], [121.0341969, 14.7135132], [121.0342312, 14.7133827], [121.0342965, 14.7132461], [121.0344816, 14.7130565], [121.0345607, 14.7129008], [121.0345812, 14.7127621], [121.0345279, 14.712633], [121.0341479, 14.7122626], [121.0339345, 14.712102], [121.0335527, 14.7118143], [121.0334848, 14.711682]]] } };

                    L.geoJSON(gulodBoundary, {
                        style: {
                            color: "#1c7b5d",
                            weight: 2,
                            opacity: 0.8,
                            fillColor: "#27C291",
                            fillOpacity: 0.05,
                            dashArray: "6 4",
                        },
                        interactive: false,
                    }).addTo(heatmap);

                    // Heatmap configs — same as dashboard
                    const heatmapConfigs = {
                        fire: {
                            radius: 28, blur: 20, maxZoom: 15, max: 2.0, minOpacity: 0.3,
                            gradient: { 0.2: "rgba(255,255,0,0.4)", 0.5: "rgba(255,128,0,0.7)", 0.8: "rgba(220,38,38,0.9)", 1.0: "rgba(100,0,0,1.0)" },
                        },
                        crime: {
                            radius: 28, blur: 20, maxZoom: 15, max: 2.0, minOpacity: 0.3,
                            gradient: { 0.2: "rgba(255,240,120,0.4)", 0.5: "rgba(251,191,36,0.7)", 0.8: "rgba(217,119,6,0.9)", 1.0: "rgba(100,40,0,1.0)" },
                        },
                        flood: {
                            radius: 35, blur: 25, maxZoom: 15, max: 2.0, minOpacity: 0.3,
                            gradient: { 0.2: "rgba(150,200,255,0.4)", 0.5: "rgba(59,130,246,0.7)", 0.8: "rgba(29,78,216,0.9)", 1.0: "rgba(8,15,60,1.0)" },
                        },
                    };

                    ["fire", "crime", "flood"].forEach((type) => {
                        const points = (heatmapData[type] || []).map(p => [p.lat, p.lng, p.intensity]);
                        if (points.length > 0) {
                            L.heatLayer(points, heatmapConfigs[type]).addTo(heatmap);
                        }
                    });

                    heatmap.invalidateSize();
                }
            }
        });
    </script>
</body>

</html>