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
                    <div class="official-item"><span class="official-name">LOVEL V. ALINAJE</span><span class="position">BIGLANG-AWA</span></div>
                    <div class="official-item"><span class="official-name">MARLON S. SORIANO</span></div>
                    <div class="official-item"><span class="official-name">SHERILL B. AGLE</span></div>
                    <div class="official-item"><span class="official-name">PERCIVAL M. CASTELLFORT</span></div>
                    <div class="official-item"><span class="official-name">EDGAR P. BABALOT</span></div>
                    <div class="official-item"><span class="official-name">NONITO D. GONZALES</span></div>
                    <div class="official-item"><span class="official-name">GLENDEL B. CLEMENTE</span></div>
                    <div class="official-item"><span class="official-name">ALJOHN JAYZEL E. CLEMENTE, JMA</span><span class="position">SK Chairperson</span></div>
                    <div class="official-item"><span class="official-name line-height-0">MILA B. NARIO</span><span class="position">Barangay Secretary</span></div>
                    <div class="official-item"><span class="official-name line-height-0">LUNINGNING R. ARATAS</span><span class="position">Barangay Treasurer</span></div>
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
        const content  = sessionStorage.getItem("analyticsReportContent");
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
        const firstPage   = document.querySelector("#page-1");
        const container   = document.querySelector(".container");
        const MAX_CONTENT_HEIGHT = 850;

        function createNewPage() {
            const newPage    = firstPage.cloneNode(true);
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

  let pages         = [[]];
  let currentHeight = 0;
  let pageIndex     = 0;

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
        currentHeight    = 0;
      }

      pages[pageIndex].push(el.cloneNode(true));
      currentHeight += elHeight;
    } else {
      if (currentHeight + elHeight > MAX_CONTENT_HEIGHT && currentHeight > 0) {
        pageIndex++;
        pages[pageIndex] = [];
        currentHeight    = 0;
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
        const fab    = document.querySelector(".fab-container");
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
            const btn   = this;

            btn.innerHTML = '<i class="uil uil-spinner-alt"></i><span>Generating...</span>';
            btn.disabled  = true;
            fab.style.visibility = "hidden";

            try {
                const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

                for (let i = 0; i < pages.length; i++) {
                    const page = pages[i];
                    const originalStyle = page.getAttribute("style") || "";
                    page.style.width    = "794px";
                    page.style.height   = "1123px";
                    page.style.position = "fixed";
                    page.style.top      = "0";
                    page.style.left     = "0";
                    page.style.zIndex   = "-9999";

                    const canvas = await html2canvas(page, {
                        scale:           4,
                        useCORS:         true,
                        logging:         false,
                        backgroundColor: "#ffffff",
                        width:           794,
                        height:          1123,
                        windowWidth:     794,
                        windowHeight:    1123,
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
                btn.disabled  = false;
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
                    el.style.outline      = "1px dashed #3b82f6";
                    el.style.borderRadius = "3px";
                    el.style.minHeight    = "1em";
                    el.style.cursor       = "text";
                } else {
                    el.style.outline      = "";
                    el.style.borderRadius = "";
                    el.style.cursor       = "";
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
    });
    </script>
</body>
</html>