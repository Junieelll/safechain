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

// ── Load all system settings from DB ─────────────────────────────────────
$settings = [];
$defaults = [
    'report_left_logo'      => '',
    'report_right_logo'     => '',
    'report_republic_line'  => 'REPUBLIC OF THE PHILIPPINES',
    'report_barangay_line'  => 'BARANGAY GULOD',
    'report_address_line'   => 'VILLAFLOR VILLAGE, DISTRICT V, QUEZON CITY',
    'report_tel_line'       => 'Tel. No. 8366-3198',
    'report_punong_name'    => 'REY ALDRIN S. TOLENTINO',
    'report_punong_position'=> 'Punong Barangay',
    'report_officials'      => '[]',
    'report_secretary_name' => 'MILA B. NARIO',
    'report_treasurer_name' => 'LUNINGNING R. ARATAS',
    'report_sk_name'        => 'ALJOHN JAYZEL E. CLEMENTE, JMA',
    'report_footer_note'    => '',
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

// ── Fetch incident + report details ──────────────────────────────────────
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
        ir.type_specific_data,
        DATE_FORMAT(ir.created_at, '%M %e, %Y') as report_date
    FROM incidents i
    LEFT JOIN incident_reports ir ON ir.incident_id = i.id
    LEFT JOIN residents r ON i.reporter = r.name
    WHERE i.id = '$incidentId' AND i.is_archived = 0
    LIMIT 1
";

$result  = mysqli_query($conn, $query);
$incident = mysqli_fetch_assoc($result);

if (!$incident) {
    header('Location: admin/incidents');
    exit;
}

// ── Fetch evidence attachments ───────────────────────────────────────────
$evidenceList = [];
$evResult = mysqli_query($conn, "
    SELECT file_name, file_type, file_path
    FROM incident_evidence
    WHERE incident_id = '$incidentId'
    ORDER BY uploaded_at ASC
");
if ($evResult) {
    while ($evRow = mysqli_fetch_assoc($evResult)) {
        // Only include images for the attachments page
        if (strpos($evRow['file_type'], 'image/') === 0) {
            $evidenceList[] = [
                'file_name' => $evRow['file_name'],
                'file_type' => $evRow['file_type'],
                'file_url'  => rtrim('https://safechain.site', '/') . '/' . $evRow['file_path'],
            ];
        }
    }
}

// Decode JSON fields
$actionsTaken    = json_decode($incident['actions_taken'] ?? '[]', true) ?: [];
$recommendations = $incident['recommendations'] ?? '';
$typeData        = json_decode($incident['type_specific_data'] ?? '{}', true) ?: [];

// Helper to get type_specific value with fallback
function td(array $data, string $key, string $fallback = 'N/A'): string
{
    $val = $data[$key] ?? null;
    if ($val === null || $val === '') return $fallback;
    if (is_bool($val)) return $val ? 'Yes' : 'No';
    return ucwords(str_replace('_', ' ', (string)$val));
}

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

                <!-- Report Content -->
                <div class="content" id="main-content">

                    <div class="report-title">
                        <span><?= $typeLabel ?> REPORT AND MANAGEMENT</span>
                        <span>BARANGAY DISASTER RISK REDUCTION AND MANAGEMENT</span>
                        <span>COUNCIL (BDRRMC)</span>
                    </div>
                    <div class="report-subtitle">PREPARED BY:
                        <?= htmlspecialchars($incident['submitted_by'] ?? $adminName) ?>
                    </div>

                    <!-- I. INCIDENT OVERVIEW -->
                    <div class="section-title">I. INCIDENT OVERVIEW</div>
                    <div class="section-content indent">
                        <div class="list-item">
                            Incident ID: <strong><?= htmlspecialchars($incident['id']) ?></strong>
                        </div>
                        <div class="list-item">
                            Date Reported: <?= htmlspecialchars($incident['date_reported']) ?> at
                            <?= htmlspecialchars($incident['time_reported']) ?>
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
                        <div class="list-item">
                            <?= nl2br(htmlspecialchars($incident['description'] ?? 'No description available.')) ?>
                        </div>
                    </div>

                    <!-- III. TYPE-SPECIFIC SECTION -->
                    <?php if ($incident['type'] === 'fire'): ?>
                        <div class="section-title">III. FIRE INCIDENT DETAILS</div>
                        <div class="section-content">
                            <div class="list-item">- Cause of Fire: <?= td($typeData, 'fire_cause') ?></div>
                            <?php if (!empty($typeData['fire_cause_other'])): ?>
                                <div class="list-item">&nbsp;&nbsp;&nbsp;(Specified:
                                    <?= htmlspecialchars($typeData['fire_cause_other']) ?>)
                                </div>
                            <?php endif; ?>
                            <div class="list-item">- Fire Origin / Room:
                                <?= htmlspecialchars($typeData['fire_origin'] ?? 'N/A') ?>
                            </div>
                            <div class="list-item">- Structure Type: <?= td($typeData, 'structure_type') ?>
                                <?php if (!empty($typeData['structure_type_other'])): ?>
                                    (<?= htmlspecialchars($typeData['structure_type_other']) ?>)
                                <?php endif; ?>
                            </div>
                            <div class="list-item">- Number of Structures Affected:
                                <?= htmlspecialchars($typeData['structures_affected'] ?? 'N/A') ?>
                            </div>
                            <div class="list-item">- Fire Spread Rate: <?= td($typeData, 'fire_spread_rate') ?></div>
                            <div class="list-item">- Hazmat Involved:
                                <?= isset($typeData['hazmat_involved']) ? ($typeData['hazmat_involved'] ? 'Yes' : 'No') : 'N/A' ?>
                            </div>
                            <div class="list-item">- Power Disconnected:
                                <?= isset($typeData['power_disconnected']) ? ($typeData['power_disconnected'] ? 'Yes' : 'No') : 'N/A' ?>
                            </div>
                            <div class="list-item">- Property Damage:
                                <?= ucfirst(htmlspecialchars($incident['property_damage'] ?? 'N/A')) ?>
                            </div>
                            <div class="list-item">- Estimated Cost of Damage:
                                ₱<?= number_format($incident['estimated_cost'] ?? 0, 2) ?></div>
                            <div class="list-item">- Casualties: <?= intval($incident['casualties']) ?></div>
                            <div class="list-item">- Injuries: <?= intval($incident['injuries']) ?></div>
                            <div class="list-item">- Persons Rescued: <?= intval($incident['rescued']) ?></div>
                            <div class="list-item">- Families Evacuated: <?= intval($incident['evacuated']) ?></div>
                            <div class="list-item">- Response Time: <?= intval($incident['response_time_minutes']) ?>
                                minutes</div>
                        </div>

                    <?php elseif ($incident['type'] === 'flood'): ?>
                        <div class="section-title">III. FLOOD INCIDENT DETAILS</div>
                        <div class="section-content">
                            <div class="list-item">- Flood Source: <?= td($typeData, 'flood_source') ?></div>
                            <div class="list-item">- Water Depth:
                                <?= htmlspecialchars($typeData['water_depth_meters'] ?? 'N/A') ?> meters
                            </div>
                            <div class="list-item">- Affected Area:
                                <?= htmlspecialchars($typeData['affected_area_sqm'] ?? 'N/A') ?> sqm
                            </div>
                            <div class="list-item">- Number of Households Affected:
                                <?= htmlspecialchars($typeData['households_affected'] ?? 'N/A') ?>
                            </div>
                            <div class="list-item">- Flood Level Trend: <?= td($typeData, 'flood_trend') ?></div>
                            <div class="list-item">- Road Accessibility: <?= td($typeData, 'road_accessibility') ?></div>
                            <div class="list-item">- Formal Evacuation Conducted:
                                <?= isset($typeData['evacuation_conducted']) ? ($typeData['evacuation_conducted'] ? 'Yes' : 'No') : 'N/A' ?>
                            </div>
                            <div class="list-item">- Persons Rescued: <?= intval($incident['rescued']) ?></div>
                            <div class="list-item">- Families Evacuated: <?= intval($incident['evacuated']) ?></div>
                            <div class="list-item">- Injuries: <?= intval($incident['injuries']) ?></div>
                            <div class="list-item">- Property Damage:
                                <?= ucfirst(htmlspecialchars($incident['property_damage'] ?? 'N/A')) ?>
                            </div>
                            <div class="list-item">- Estimated Cost of Damage:
                                ₱<?= number_format($incident['estimated_cost'] ?? 0, 2) ?></div>
                            <div class="list-item">- Response Time: <?= intval($incident['response_time_minutes']) ?>
                                minutes</div>
                        </div>

                    <?php elseif ($incident['type'] === 'crime'): ?>
                        <div class="section-title">III. CRIME INCIDENT DETAILS</div>
                        <div class="section-content">
                            <div class="list-item">- Crime Category: <?= td($typeData, 'crime_category') ?>
                                <?php if (!empty($typeData['crime_category_other'])): ?>
                                    (<?= htmlspecialchars($typeData['crime_category_other']) ?>)
                                <?php endif; ?>
                            </div>
                            <div class="list-item">- Modus Operandi: <?= td($typeData, 'modus_operandi') ?>
                                <?php if (!empty($typeData['modus_operandi_other'])): ?>
                                    (<?= htmlspecialchars($typeData['modus_operandi_other']) ?>)
                                <?php endif; ?>
                            </div>
                            <div class="list-item">- Number of Suspects:
                                <?= htmlspecialchars($typeData['suspect_count'] ?? 'N/A') ?>
                            </div>
                            <div class="list-item">- Suspect Description:
                                <?= htmlspecialchars($typeData['suspect_description'] ?? 'N/A') ?>
                            </div>
                            <div class="list-item">- Suspect Status: <?= td($typeData, 'suspect_status') ?></div>
                            <div class="list-item">- Number of Victims:
                                <?= htmlspecialchars($typeData['victim_count'] ?? 'N/A') ?>
                            </div>
                            <div class="list-item">- Referred to Authorities:
                                <?= td($typeData, 'referred_to_authorities') ?>
                            </div>
                            <div class="list-item">- Casualties: <?= intval($incident['casualties']) ?></div>
                            <div class="list-item">- Injuries: <?= intval($incident['injuries']) ?></div>
                            <div class="list-item">- Persons Assisted / Rescued: <?= intval($incident['rescued']) ?></div>
                            <div class="list-item">- Response Time: <?= intval($incident['response_time_minutes']) ?>
                                minutes</div>
                            <div class="list-item">- Resolution Status:
                                <?= ucwords(str_replace('_', ' ', $incident['resolution_status'] ?? 'N/A')) ?>
                            </div>
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
                        <div class="list-item">
                            <?= nl2br(htmlspecialchars($incident['summary'] ?? 'No summary available.')) ?>
                        </div>
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
                        <?php if (!empty($evidenceList)): ?>
                            ATTACHMENTS:
                            <?php foreach ($evidenceList as $ev): ?>
                                <div class="list-item" style="text-align:left; font-weight:normal; font-size:11px;">- <?= htmlspecialchars($ev['file_name']) ?></div>
                            <?php endforeach; ?>
                            <br>
                        <?php endif; ?>
                        END OF REPORT
                    </div>

                </div><!-- .content -->
            </div><!-- .main-content -->
        </div><!-- .a4 -->

    </div><!-- .container -->

    <?php if (!empty($evidenceList)): ?>
    <?php
        $chunks    = array_chunk($evidenceList, 2);
        $rowCount  = count($chunks);
        $rowHeight = $rowCount === 1 ? '490px' : ($rowCount === 2 ? '235px' : '150px');
    ?>
    <!-- OUTSIDE .container so JS pagination never touches this page -->
    <div class="a4" id="page-attachments" style="padding:40px 50px;box-sizing:border-box;margin-top:20px;">
        <div style="text-align:center;font-size:13px;font-weight:bold;letter-spacing:1px;margin-bottom:18px;border-bottom:2px solid #333;padding-bottom:10px;">
            PHOTO ATTACHMENTS &mdash; <?= htmlspecialchars($incident['id']) ?>
        </div>
        <div style="display:flex;flex-direction:column;gap:14px;">
            <?php foreach ($chunks as $row): ?>
            <div style="display:grid;grid-template-columns:repeat(<?= count($row) ?>,1fr);gap:14px;">
                <?php foreach ($row as $ev): ?>
                <div style="border:1px solid #ccc;border-radius:6px;overflow:hidden;display:flex;flex-direction:column;">
                    <img src="<?= htmlspecialchars($ev['file_url']) ?>"
                         alt="<?= htmlspecialchars($ev['file_name']) ?>"
                         style="width:100%;height:<?= $rowHeight ?>;object-fit:contain;display:block;background:#f5f5f5;" />
                    <div style="padding:5px 8px;font-size:10px;color:#555;background:#f9f9f9;border-top:1px solid #eee;text-align:center;">
                        <?= htmlspecialchars($ev['file_name']) ?>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
            <?php endforeach; ?>
        </div>
    </div>
    <?php endif; ?>

    <script>
        document.addEventListener("DOMContentLoaded", function () {
            const mainContent = document.querySelector("#main-content");
            const firstPage   = document.querySelector("#page-1");
            const container   = document.querySelector(".container");
            const MAX_CONTENT_HEIGHT = 700;

            function createNewPage() {
                const newPage    = firstPage.cloneNode(true);
                const newContent = newPage.querySelector(".content");
                newContent.innerHTML = "";
                newContent.style.backgroundImage = "none";
                newPage.style.marginTop = "20px";
                container.appendChild(newPage); // always inside .container
                return newContent;
            }

            function splitContent() {
                const allItems = Array.from(mainContent.children);
                let pages = [[]];
                let currentPageHeight = 0;
                let currentPageIndex  = 0;

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

                // Always move attachments page to very end of body after pagination settles
                const attachPage = document.getElementById("page-attachments");
                if (attachPage) document.body.appendChild(attachPage);
            }

            // FAB toggle
            const fab    = document.querySelector(".fab-container");
            const toggle = document.getElementById("fabToggle");
            toggle.addEventListener("click", () => fab.classList.toggle("open"));

            // Print
            document.querySelector(".openBtn").addEventListener("click", () => {
                setTimeout(() => window.print(), 400);
            });

            // Download PDF
            document.querySelector(".downloadBtn").addEventListener("click", async function () {
                const { jsPDF } = window.jspdf;
                const pages = document.querySelectorAll(".a4");
                const btn   = this;

                btn.innerHTML = '<i class="uil uil-spinner-alt"></i><span>Generating...</span>';
                btn.disabled  = true;
                fab.style.visibility = "hidden";

                try {
                    const pdf = new jsPDF({
                        orientation: "portrait",
                        unit: "mm",
                        format: "a4"
                    });

                    const A4_WIDTH_MM  = 210;
                    const A4_HEIGHT_MM = 297;

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
                        pdf.addImage(imgData, "JPEG", 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM);
                    }

                    pdf.save(`IncidentReport_<?= $incident['id'] ?>.pdf`);

                } catch (err) {
                    console.error("PDF generation failed:", err);
                    alert("Failed to generate PDF. Please try again.");
                } finally {
                    fab.style.visibility = "visible";
                    btn.innerHTML = '<i class="uil uil-import"></i><span>Download as PDF</span>';
                    btn.disabled  = false;
                }
            });

            window.addEventListener("load", () => setTimeout(splitContent, 300));

            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get("autodownload") === "1") {
                window.addEventListener("load", () => {
                    setTimeout(() => document.querySelector(".downloadBtn").click(), 800);
                });
            }
        });
    </script>
</body>

</html>