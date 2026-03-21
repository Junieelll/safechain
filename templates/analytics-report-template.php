<?php
require_once '../config/conn.php';
require_once '../includes/auth_helper.php';

AuthChecker::requireAuth('/auth/login.php');

// ── Load all system settings from DB ─────────────────────────────────────
$settings = [];
$defaults = [
    'report_left_logo'       => '',
    'report_right_logo'      => '',
    'report_republic_line'   => 'REPUBLIC OF THE PHILIPPINES',
    'report_barangay_line'   => 'BARANGAY GULOD',
    'report_address_line'    => 'VILLAFLOR VILLAGE, DISTRICT V, QUEZON CITY',
    'report_tel_line'        => 'Tel. No. 8366-3198',
    'report_punong_name'     => 'REY ALDRIN S. TOLENTINO',
    'report_punong_position' => 'Punong Barangay',
    'report_officials'       => '[]',
    'report_secretary_name'  => 'MILA B. NARIO',
    'report_treasurer_name'  => 'LUNINGNING R. ARATAS',
    'report_sk_name'         => 'ALJOHN JAYZEL E. CLEMENTE, JMA',
    'report_footer_note'     => '',
];

try {
    $res = $conn->query("SELECT setting_key, setting_value FROM system_settings");
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $settings[$row['setting_key']] = $row['setting_value'];
        }
    }
} catch (Exception $e) { /* silently fall back to defaults */ }

// Merge defaults for any missing keys
$settings = array_merge($defaults, $settings);

// Parse officials JSON
$officials = json_decode($settings['report_officials'] ?? '[]', true);
if (!is_array($officials)) $officials = [];
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

    <!-- FAB -->
    <div class="fab-container open">
        <div class="fab-actions">
            <button class="fab-action-btn openBtn">
                <i class="uil uil-print"></i>
                <span>Print</span>
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

            <!-- Header — fully dynamic from settings -->
            <div class="header">
                <div class="header-left">
                    <?php if (!empty($settings['report_left_logo'])): ?>
                        <img src="<?= htmlspecialchars($settings['report_left_logo']) ?>" alt="Left Logo" />
                    <?php endif; ?>
                </div>
                <div class="header-center">
                    <div class="header-title">
                        <?= htmlspecialchars($settings['report_republic_line']) ?>
                    </div>
                    <div class="header-subtitle">
                        <?= htmlspecialchars($settings['report_barangay_line']) ?>
                    </div>
                    <div class="header-address">
                        <?= htmlspecialchars($settings['report_address_line']) ?>
                    </div>
                    <div class="header-tel">
                        <?= htmlspecialchars($settings['report_tel_line']) ?>
                    </div>
                </div>
                <div class="header-right">
                    <?php if (!empty($settings['report_right_logo'])): ?>
                        <img src="<?= htmlspecialchars($settings['report_right_logo']) ?>" alt="Right Logo" />
                    <?php endif; ?>
                </div>
            </div>

            <div class="main-content">

                <!-- Barangay Officials sidebar — fully dynamic from settings -->
                <aside class="barangay-officials">
                    <div class="barangay-captain">
                        <span class="official-name">
                            <?= htmlspecialchars($settings['report_punong_name']) ?>
                        </span>
                        <span class="position">
                            <?= htmlspecialchars($settings['report_punong_position']) ?>
                        </span>
                    </div>

                    <?php if (!empty($officials)): ?>
                        <div class="officials-section-title">Barangay Kagawad</div>
                        <?php foreach ($officials as $official): ?>
                            <div class="official-item">
                                <span class="official-name">
                                    <?= htmlspecialchars($official['name'] ?? '') ?>
                                </span>
                                <?php if (!empty($official['position'])): ?>
                                    <span class="position">
                                        <?= htmlspecialchars($official['position']) ?>
                                    </span>
                                <?php endif; ?>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>

                    <?php if (!empty($settings['report_sk_name'])): ?>
                        <div class="official-item">
                            <span class="official-name">
                                <?= htmlspecialchars($settings['report_sk_name']) ?>
                            </span>
                            <span class="position">SK Chairperson</span>
                        </div>
                    <?php endif; ?>

                    <?php if (!empty($settings['report_secretary_name'])): ?>
                        <div class="official-item">
                            <span class="official-name line-height-0">
                                <?= htmlspecialchars($settings['report_secretary_name']) ?>
                            </span>
                            <span class="position">Barangay Secretary</span>
                        </div>
                    <?php endif; ?>

                    <?php if (!empty($settings['report_treasurer_name'])): ?>
                        <div class="official-item">
                            <span class="official-name line-height-0">
                                <?= htmlspecialchars($settings['report_treasurer_name']) ?>
                            </span>
                            <span class="position">Barangay Treasurer</span>
                        </div>
                    <?php endif; ?>
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

        // ── Pagination ────────────────────────────────────────────
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

                const clone = el.cloneNode(true);
                probe.appendChild(clone);
                const elHeight = clone.offsetHeight + 8;
                probe.removeChild(clone);

                // Keep section-title with its next sibling together
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
            setTimeout(() => window.print(), 400);
        });

        // ── Download PDF ──────────────────────────────────────────
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