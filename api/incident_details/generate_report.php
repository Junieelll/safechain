<?php
session_start();
require_once '../../config/conn.php';
require_once '../../includes/auth_helper.php';

AuthChecker::requireAuth('/auth/login.php');

$incidentId = isset($_GET['id']) ? mysqli_real_escape_string($conn, $_GET['id']) : null;

if (!$incidentId) {
    header('Location: admin/incidents');
    exit;
}

// Fetch incident + report details
$query = "
    SELECT 
        i.id, i.type, i.location, i.status,
        DATE_FORMAT(i.date_time, '%M %e, %Y') as date_reported,
        DATE_FORMAT(i.date_time, '%h:%i %p') as time_reported,
        i.latitude as lat, i.longitude as lng,
        r.name as reporter_name,
        r.contact as reporter_contact,
        r.address as reporter_address,
        ir.description,
        ir.severity_level,
        ir.casualties,
        ir.injuries,
        ir.rescued,
        ir.evacuated,
        ir.property_damage,
        ir.estimated_cost,
        ir.response_time_minutes,
        ir.actions_taken,
        ir.resolution_status,
        ir.summary,
        ir.recommendations,
        ir.follow_up_notes,
        ir.submitted_by,
        DATE_FORMAT(ir.created_at, '%M %e, %Y') as report_date
    FROM incidents i
    LEFT JOIN incident_reports ir ON ir.incident_id = i.id
    LEFT JOIN residents r ON i.reporter = r.name
    WHERE i.id = '$incidentId' AND i.is_archived = 0
    LIMIT 1
";

$result = mysqli_query($conn, $query);
$incident = mysqli_fetch_assoc($result);

if (!$incident) {
    header('Location: admin/incidents');
    exit;
}

// Decode JSON fields
$actionsTaken = json_decode($incident['actions_taken'] ?? '[]', true) ?: [];
$recommendations = $incident['recommendations'] ?? '';

// Type-specific labels
$typeLabels = [
    'fire'  => 'FIRE INCIDENT',
    'flood' => 'FLOOD INCIDENT',
    'crime' => 'CRIME INCIDENT',
];
$typeLabel = $typeLabels[$incident['type']] ?? 'INCIDENT';

$adminName = isset($_GET['admin_name']) ? htmlspecialchars($_GET['admin_name']) : AuthChecker::getName();
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <title><?= $typeLabel ?> Report - <?= htmlspecialchars($incident['id']) ?></title>
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

            <!-- Header -->
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

                <!-- Barangay Officials sidebar (same for all types) -->
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

                <!-- Report Content -->
                <div class="content" id="main-content">

                    <div class="report-title">
                        <span><?= $typeLabel ?> REPORT AND MANAGEMENT</span>
                        <span>BARANGAY DISASTER RISK REDUCTION AND MANAGEMENT</span>
                        <span>COUNCIL (BDRRMC)</span>
                    </div>
                    <div class="report-subtitle">PREPARED BY: <?= htmlspecialchars($incident['submitted_by'] ?? $adminName) ?></div>
                    <div class="report-subtitle">APPROVED BY: Ka. Marlon Soriano</div>

                    <!-- I. INCIDENT OVERVIEW -->
                    <div class="section-title">I. INCIDENT OVERVIEW</div>
                    <div class="section-content indent">
                        <div class="list-item">
                            Incident ID: <strong><?= htmlspecialchars($incident['id']) ?></strong>
                        </div>
                        <div class="list-item">
                            Date Reported: <?= htmlspecialchars($incident['date_reported']) ?> at <?= htmlspecialchars($incident['time_reported']) ?>
                        </div>
                        <div class="list-item">
                            Location: <?= htmlspecialchars($incident['location']) ?>
                        </div>
                        <div class="list-item">
                            Reported By: <?= htmlspecialchars($incident['reporter_name'] ?? 'N/A') ?>
                            <?php if ($incident['reporter_contact']): ?>
                                — Contact: <?= htmlspecialchars($incident['reporter_contact']) ?>
                            <?php endif; ?>
                        </div>
                        <div class="list-item">
                            Severity Level: <?= ucfirst(htmlspecialchars($incident['severity_level'] ?? 'N/A')) ?>
                        </div>
                        <div class="list-item">
                            Status: <?= ucfirst(htmlspecialchars($incident['status'])) ?>
                        </div>
                    </div>

                    <!-- II. INCIDENT DESCRIPTION -->
                    <div class="section-title">II. INCIDENT DESCRIPTION</div>
                    <div class="section-content">
                        <div class="list-item"><?= nl2br(htmlspecialchars($incident['description'] ?? 'No description available.')) ?></div>
                    </div>

                    <!-- III. TYPE-SPECIFIC SECTION -->
                    <?php if ($incident['type'] === 'fire'): ?>
                        <div class="section-title">III. FIRE INCIDENT DETAILS</div>
                        <div class="section-content">
                            <div class="list-item">- Property Damage: <?= ucfirst(htmlspecialchars($incident['property_damage'] ?? 'N/A')) ?></div>
                            <div class="list-item">- Estimated Cost of Damage: ₱<?= number_format($incident['estimated_cost'] ?? 0, 2) ?></div>
                            <div class="list-item">- Casualties: <?= intval($incident['casualties']) ?></div>
                            <div class="list-item">- Injuries: <?= intval($incident['injuries']) ?></div>
                            <div class="list-item">- Families Evacuated: <?= intval($incident['evacuated']) ?></div>
                            <div class="list-item">- Response Time: <?= intval($incident['response_time_minutes']) ?> minutes</div>
                        </div>

                    <?php elseif ($incident['type'] === 'flood'): ?>
                        <div class="section-title">III. FLOOD INCIDENT DETAILS</div>
                        <div class="section-content">
                            <div class="list-item">- Affected Families: <?= intval($incident['evacuated']) ?></div>
                            <div class="list-item">- Persons Rescued: <?= intval($incident['rescued']) ?></div>
                            <div class="list-item">- Injuries: <?= intval($incident['injuries']) ?></div>
                            <div class="list-item">- Property Damage: <?= ucfirst(htmlspecialchars($incident['property_damage'] ?? 'N/A')) ?></div>
                            <div class="list-item">- Estimated Cost of Damage: ₱<?= number_format($incident['estimated_cost'] ?? 0, 2) ?></div>
                            <div class="list-item">- Response Time: <?= intval($incident['response_time_minutes']) ?> minutes</div>
                        </div>

                    <?php elseif ($incident['type'] === 'crime'): ?>
                        <div class="section-title">III. CRIME INCIDENT DETAILS</div>
                        <div class="section-content">
                            <div class="list-item">- Casualties: <?= intval($incident['casualties']) ?></div>
                            <div class="list-item">- Injuries: <?= intval($incident['injuries']) ?></div>
                            <div class="list-item">- Persons Rescued/Assisted: <?= intval($incident['rescued']) ?></div>
                            <div class="list-item">- Response Time: <?= intval($incident['response_time_minutes']) ?> minutes</div>
                            <div class="list-item">- Resolution Status: <?= ucwords(str_replace('_', ' ', $incident['resolution_status'] ?? 'N/A')) ?></div>
                        </div>
                    <?php endif; ?>

                    <!-- IV. ACTIONS TAKEN -->
                    <div class="section-title">IV. ACTIONS TAKEN</div>
                    <div class="section-content">
                        <?php if (!empty($actionsTaken)): ?>
                            <?php foreach ($actionsTaken as $i => $action): ?>
                                <div class="list-item"><?= ($i + 1) ?>. <?= htmlspecialchars($action) ?></div>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <div class="list-item">No actions recorded.</div>
                        <?php endif; ?>
                    </div>

                    <!-- V. SUMMARY -->
                    <div class="section-title">V. SUMMARY</div>
                    <div class="section-content">
                        <div class="list-item"><?= nl2br(htmlspecialchars($incident['summary'] ?? 'No summary available.')) ?></div>
                    </div>

                    <!-- VI. RECOMMENDATIONS -->
                    <?php if (!empty($recommendations)): ?>
                        <div class="section-title">VI. RECOMMENDATIONS</div>
                        <div class="section-content">
                            <div class="list-item"><?= nl2br(htmlspecialchars($recommendations)) ?></div>
                        </div>
                    <?php endif; ?>

                    <!-- VII. FOLLOW-UP -->
                    <?php if (!empty($incident['follow_up_notes'])): ?>
                        <div class="section-title">VII. FOLLOW-UP NOTES</div>
                        <div class="section-content">
                            <div class="list-item"><?= nl2br(htmlspecialchars($incident['follow_up_notes'])) ?></div>
                        </div>
                    <?php endif; ?>

                    <div class="section-title" style="margin-top: 20px; text-align: center">
                        REPORT CLOSED — <?= htmlspecialchars($incident['report_date'] ?? $incident['date_reported']) ?>
                    </div>

                </div><!-- .content -->
            </div><!-- .main-content -->
        </div><!-- .a4 -->
    </div><!-- .container -->

    <script>
        document.addEventListener("DOMContentLoaded", function() {
            const mainContent = document.querySelector("#main-content");
            const firstPage = document.querySelector("#page-1");
            const container = document.querySelector(".container");
            const MAX_CONTENT_HEIGHT = 700;

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
                let pages = [
                    []
                ];
                let currentPageHeight = 0;
                let currentPageIndex = 0;

                allItems.forEach((item) => {
                    const clone = item.cloneNode(true);
                    mainContent.appendChild(clone);
                    const itemHeight = clone.offsetHeight;
                    clone.remove();

                    if (currentPageHeight + itemHeight > MAX_CONTENT_HEIGHT && currentPageHeight > 0) {
                        currentPageIndex++;
                        pages[currentPageIndex] = [];
                        currentPageHeight = 0;
                    }

                    pages[currentPageIndex].push(item.cloneNode(true));
                    currentPageHeight += itemHeight;
                });

                mainContent.innerHTML = "";
                if (pages[0]) pages[0].forEach((item) => mainContent.appendChild(item));
                for (let i = 1; i < pages.length; i++) {
                    const newContent = createNewPage();
                    pages[i].forEach((item) => newContent.appendChild(item));
                }
            }

            // FAB toggle
            const fab = document.querySelector(".fab-container");
            const toggle = document.getElementById("fabToggle");
            toggle.addEventListener("click", () => fab.classList.toggle("open"));

            // Print
            document.querySelector(".openBtn").addEventListener("click", () => {
                if (isEditing) document.querySelector(".editBtn").click();
                window.print();
            });

            // Download PDF
            document.querySelector(".downloadBtn").addEventListener("click", async function() {
                const {
                    jsPDF
                } = window.jspdf;
                const pages = document.querySelectorAll(".a4");
                const btn = this;

                btn.innerHTML = '<i class="uil uil-spinner-alt"></i><span>Generating...</span>';
                btn.disabled = true;
                fab.style.visibility = "hidden";

                try {
                    const pdf = new jsPDF({
                        orientation: "portrait",
                        unit: "mm",
                        format: "a4"
                    });
                    const pageWidthMm = 210;
                    const pageHeightMm = 297;

                    for (let i = 0; i < pages.length; i++) {
                        const canvas = await html2canvas(pages[i], {
                            scale: 2,
                            useCORS: true,
                            logging: false,
                            backgroundColor: "#ffffff",
                        });

                        const imgData = canvas.toDataURL("image/jpeg", 0.95);
                        const ratio = pageWidthMm / canvas.width;
                        const imgHeightMm = canvas.height * ratio;

                        if (i > 0) pdf.addPage("letter", "portrait");
                        pdf.addImage(imgData, "JPEG", 0, 0, pageWidthMm, Math.min(imgHeightMm, pageHeightMm));
                    }

                    pdf.save(`IncidentReport_<?= $incident['id'] ?>.pdf`);

                } catch (err) {
                    console.error("PDF generation failed:", err);
                    alert("Failed to generate PDF. Please try again.");
                } finally {
                    fab.style.visibility = "visible";
                    btn.innerHTML = '<i class="uil uil-import"></i><span>Download as PDF</span>';
                    btn.disabled = false;
                }
            });

            // ── Edit Toggle ───────────────────────────────────────────────
            let isEditing = false;

            // Elements that make sense to edit
            const editableSelectors = [
                ".report-subtitle",
                ".section-content .list-item",
                ".section-title",
            ];

            document.querySelector(".editBtn").addEventListener("click", function() {
                isEditing = !isEditing;

                // Toggle contenteditable on all editable elements across all pages
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

                // Update button label
                this.innerHTML = isEditing ?
                    '<i class="uil uil-check"></i><span>Done Editing</span>' :
                    '<i class="uil uil-edit"></i><span>Edit Content</span>';

                // Show/hide edit hint banner
                const banner = document.getElementById("editBanner");
                if (banner) banner.classList.toggle("hidden", !isEditing);
            });

            window.addEventListener("load", () => setTimeout(splitContent, 300));

            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get("autodownload") === "1") {
                window.addEventListener("load", () => {
                    setTimeout(() => {
                        document.querySelector(".downloadBtn").click();
                    }, 800);
                });
            }
        });
    </script>
</body>

</html>