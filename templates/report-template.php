<?php
/**
 * templates/report-template.php
 * Dynamic individual incident report template.
 * Variables expected from generate_report.php:
 *   $report_incident  – associative array from incidents + residents JOIN
 *   $report_notes     – array of incident_notes rows
 *   $report_timeline  – array of incident_timeline rows
 *   $report_data      – associative array from incident_reports (may be null)
 */

// Helper: safely echo HTML-escaped value or a dash
function val($v, $fallback = '—') {
    $v = trim((string)$v);
    return $v !== '' ? htmlspecialchars($v) : $fallback;
}

$i     = $report_incident;
$rep   = $report_data ?? [];          // mobile responder report (may be empty)
$notes = $report_notes ?? [];
$tl    = $report_timeline ?? [];

// Derived helpers
$incidentType = ucfirst($i['type'] ?? 'Unknown');
$typeIcon = [
    'fire'  => '🔥',
    'flood' => '🌊',
    'crime' => '🚨',
][$i['type']] ?? '⚠️';

$statusLabel = [
    'pending'    => 'Pending',
    'responding' => 'Responding',
    'resolved'   => 'Resolved',
][$i['status']] ?? ucfirst($i['status'] ?? '—');

$statusColor = [
    'pending'    => '#f59e0b',
    'responding' => '#3b82f6',
    'resolved'   => '#10b981',
][$i['status']] ?? '#6b7280';

// Responder report fields
$severityLabel = ucfirst(str_replace('_', ' ', $rep['severity_level'] ?? ''));
$resolutionLabel = ucfirst(str_replace('_', ' ', $rep['resolution_status'] ?? ''));
$actionsTaken = [];
if (!empty($rep['actions_taken'])) {
    $decoded = json_decode($rep['actions_taken'], true);
    if (is_array($decoded)) $actionsTaken = $decoded;
}
$responseTeam = [];
if (!empty($rep['response_team'])) {
    $decoded = json_decode($rep['response_team'], true);
    if (is_array($decoded)) $responseTeam = $decoded;
}

// Response time formatting
function formatTime($mins, $secs) {
    $mins = (int)$mins;
    $secs = (int)$secs;
    if ($mins === 0 && $secs === 0) return '—';
    $parts = [];
    if ($mins > 0) $parts[] = "{$mins} min";
    if ($secs > 0) $parts[] = "{$secs} sec";
    return implode(' ', $parts);
}

$responseTime   = formatTime($rep['response_time_minutes'] ?? 0, $rep['response_time_seconds'] ?? 0);
$resolutionTime = formatTime($rep['resolution_time_minutes'] ?? 0, $rep['resolution_time_seconds'] ?? 0);

$generatedAt = date('F j, Y \a\t h:i A');
$adminName   = htmlspecialchars($report_admin_name ?? 'Admin');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Incident Report – <?= val($i['id']) ?></title>
  <style>
    /* ── Reset & Base ─────────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      color: #111;
      background: #fff;
    }

    /* ── Page wrapper ─────────────────────────────────────────── */
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 14mm 16mm 14mm 16mm;
    }

    /* ── Header ───────────────────────────────────────────────── */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px double #1a3a6b;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }
    .header img { width: 70px; height: 70px; object-fit: contain; }
    .header-center { text-align: center; flex: 1; padding: 0 12px; }
    .header-center .republic  { font-size: 9pt; letter-spacing: 1px; }
    .header-center .brgy      { font-size: 13pt; font-weight: bold; letter-spacing: 1px; }
    .header-center .address   { font-size: 8.5pt; color: #444; }
    .header-center .tel       { font-size: 8.5pt; color: #444; }

    /* ── Report title block ───────────────────────────────────── */
    .report-title-block {
      text-align: center;
      margin: 10px 0 14px;
      border: 1.5px solid #1a3a6b;
      border-radius: 4px;
      padding: 8px 12px;
      background: #f0f4ff;
    }
    .report-title-block .main-title {
      font-size: 13pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #1a3a6b;
    }
    .report-title-block .sub-title { font-size: 9pt; color: #444; margin-top: 3px; }

    /* ── Status badge ─────────────────────────────────────────── */
    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 9pt;
      font-weight: bold;
      color: #fff;
    }

    /* ── Two-column meta grid ─────────────────────────────────── */
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 20px;
      margin-bottom: 14px;
    }
    .meta-item { display: flex; flex-direction: column; gap: 1px; }
    .meta-label {
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #555;
      font-weight: bold;
    }
    .meta-value { font-size: 10pt; font-weight: bold; color: #111; }

    /* ── Section ──────────────────────────────────────────────── */
    .section { margin-bottom: 12px; }
    .section-title {
      font-size: 10.5pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: #1a3a6b;
      color: #fff;
      padding: 4px 10px;
      margin-bottom: 8px;
      border-radius: 2px;
    }
    .section-body { padding: 0 4px; }

    /* ── Info rows ────────────────────────────────────────────── */
    .info-row {
      display: flex;
      gap: 8px;
      margin-bottom: 5px;
      font-size: 10pt;
    }
    .info-label {
      min-width: 160px;
      font-weight: bold;
      color: #333;
    }
    .info-value { color: #111; flex: 1; }

    /* ── Description box ──────────────────────────────────────── */
    .description-box {
      background: #f8f9fa;
      border-left: 4px solid #1a3a6b;
      padding: 8px 12px;
      font-size: 10pt;
      line-height: 1.5;
      border-radius: 0 4px 4px 0;
      color: #222;
    }

    /* ── Stats grid ───────────────────────────────────────────── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      margin-bottom: 10px;
    }
    .stat-box {
      border: 1px solid #ccc;
      border-radius: 4px;
      text-align: center;
      padding: 6px 4px;
    }
    .stat-num { font-size: 16pt; font-weight: bold; color: #1a3a6b; }
    .stat-lbl { font-size: 7.5pt; color: #555; text-transform: uppercase; }

    /* ── Severity chips ───────────────────────────────────────── */
    .chip {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 20px;
      font-size: 9pt;
      font-weight: bold;
      border: 1px solid;
    }
    .chip-minor    { background:#d1fae5; color:#065f46; border-color:#6ee7b7; }
    .chip-moderate { background:#fef3c7; color:#92400e; border-color:#fcd34d; }
    .chip-severe   { background:#fee2e2; color:#991b1b; border-color:#fca5a5; }
    .chip-critical { background:#fce7f3; color:#9d174d; border-color:#f9a8d4; }

    /* ── Actions list ─────────────────────────────────────────── */
    .action-list { list-style: none; padding: 0; }
    .action-list li {
      padding: 3px 0 3px 16px;
      position: relative;
      font-size: 10pt;
      border-bottom: 1px dotted #ddd;
    }
    .action-list li:last-child { border-bottom: none; }
    .action-list li::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
    }

    /* ── Timeline ─────────────────────────────────────────────── */
    .timeline { list-style: none; padding: 0; }
    .tl-item {
      display: flex;
      gap: 10px;
      padding: 5px 0;
      border-bottom: 1px dotted #ddd;
      font-size: 9.5pt;
    }
    .tl-item:last-child { border-bottom: none; }
    .tl-dot {
      width: 10px; height: 10px;
      background: #1a3a6b;
      border-radius: 50%;
      margin-top: 4px;
      flex-shrink: 0;
    }
    .tl-content { flex: 1; }
    .tl-title { font-weight: bold; color: #1a3a6b; }
    .tl-desc  { color: #444; font-size: 9pt; }
    .tl-meta  { color: #888; font-size: 8pt; }

    /* ── Admin notes ──────────────────────────────────────────── */
    .note-item {
      background: #fffdf0;
      border-left: 3px solid #f59e0b;
      padding: 5px 10px;
      margin-bottom: 6px;
      border-radius: 0 4px 4px 0;
      font-size: 9.5pt;
    }
    .note-meta { font-size: 8pt; color: #888; margin-top: 2px; }

    /* ── Signature block ──────────────────────────────────────── */
    .signature-block {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-top: 30px;
    }
    .sig-line {
      border-top: 1px solid #333;
      padding-top: 4px;
      text-align: center;
      font-size: 9pt;
    }
    .sig-name { font-weight: bold; font-size: 10pt; }

    /* ── Footer ───────────────────────────────────────────────── */
    .footer {
      margin-top: 20px;
      border-top: 1px solid #ccc;
      padding-top: 6px;
      display: flex;
      justify-content: space-between;
      font-size: 7.5pt;
      color: #888;
    }

    /* ── Empty state ──────────────────────────────────────────── */
    .empty-text { color: #aaa; font-style: italic; font-size: 9.5pt; padding: 6px 0; }

    /* ── Print ────────────────────────────────────────────────── */
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { margin: 0; padding: 10mm 14mm; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- ══ HEADER ══════════════════════════════════════════════════ -->
  <div class="header">
    <img src="../../assets/img/qc-logo.jpg" alt="QC Logo" />
    <div class="header-center">
      <div class="republic">REPUBLIC OF THE PHILIPPINES</div>
      <div class="brgy">BARANGAY GULOD</div>
      <div class="address">VILLAFLOR VILLAGE, DISTRICT V, QUEZON CITY</div>
      <div class="tel">Tel. No. 8366-3198</div>
    </div>
    <img src="../../assets/img/gulod-logo.png" alt="Gulod Logo" />
  </div>

  <!-- ══ REPORT TITLE ════════════════════════════════════════════ -->
  <div class="report-title-block">
    <div class="main-title"><?= $typeIcon ?> <?= $incidentType ?> Incident Report</div>
    <div class="sub-title">
      Barangay Disaster Risk Reduction and Management Council (BDRRMC) &nbsp;|&nbsp;
      Report No.: <strong><?= val($i['id']) ?></strong>
    </div>
  </div>

  <!-- ══ SECTION I: INCIDENT OVERVIEW ════════════════════════════ -->
  <div class="section">
    <div class="section-title">I. Incident Overview</div>
    <div class="section-body">
      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">Incident ID</span>
          <span class="meta-value"><?= val($i['id']) ?></span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Status</span>
          <span class="meta-value">
            <span class="status-badge" style="background:<?= $statusColor ?>;"><?= $statusLabel ?></span>
          </span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Date Reported</span>
          <span class="meta-value"><?= val($i['date_reported']) ?></span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Time Reported</span>
          <span class="meta-value"><?= val($i['time_reported']) ?></span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Incident Type</span>
          <span class="meta-value"><?= $typeIcon ?> <?= $incidentType ?></span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Severity Level</span>
          <span class="meta-value">
            <?php if ($severityLabel): ?>
              <span class="chip chip-<?= htmlspecialchars($rep['severity_level'] ?? '') ?>"><?= val($severityLabel) ?></span>
            <?php else: echo '—'; endif; ?>
          </span>
        </div>
      </div>
    </div>
  </div>

  <!-- ══ SECTION II: LOCATION ════════════════════════════════════ -->
  <div class="section">
    <div class="section-title">II. Location Details</div>
    <div class="section-body">
      <div class="info-row">
        <span class="info-label">Address:</span>
        <span class="info-value"><?= val($i['location']) ?></span>
      </div>
      <div class="info-row">
        <span class="info-label">Barangay / City:</span>
        <span class="info-value">Gulod, Novaliches, Quezon City, Metro Manila</span>
      </div>
      <?php if (!empty($i['lat']) && $i['lat'] != 0): ?>
      <div class="info-row">
        <span class="info-label">Coordinates:</span>
        <span class="info-value"><?= val($i['lat']) ?>, <?= val($i['lng']) ?></span>
      </div>
      <?php endif; ?>
    </div>
  </div>

  <!-- ══ SECTION III: REPORTER ════════════════════════════════════ -->
  <div class="section">
    <div class="section-title">III. Reported By</div>
    <div class="section-body">
      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">Name</span>
          <span class="meta-value"><?= val($i['reporter_name'] ?: $i['reporter']) ?></span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Resident ID</span>
          <span class="meta-value"><?= val($i['reporter_id']) ?></span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Contact Number</span>
          <span class="meta-value"><?= val($i['reporter_contact']) ?></span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Address</span>
          <span class="meta-value"><?= val($i['reporter_address']) ?></span>
        </div>
        <?php if (!empty($i['resident_since'])): ?>
        <div class="meta-item">
          <span class="meta-label">Resident Since</span>
          <span class="meta-value"><?= val($i['resident_since']) ?></span>
        </div>
        <?php endif; ?>
      </div>
    </div>
  </div>

  <!-- ══ SECTION IV: RESPONDER REPORT (if available) ═════════════ -->
  <?php if (!empty($rep)): ?>
  <div class="section">
    <div class="section-title">IV. Responder Field Report</div>
    <div class="section-body">

      <?php if (!empty($rep['description'])): ?>
      <div class="info-row"><span class="info-label">Description:</span></div>
      <div class="description-box" style="margin-bottom:10px;"><?= htmlspecialchars($rep['description']) ?></div>
      <?php endif; ?>

      <!-- Stats -->
      <div class="stats-grid" style="margin-bottom:10px;">
        <div class="stat-box">
          <div class="stat-num"><?= (int)($rep['casualties'] ?? 0) ?></div>
          <div class="stat-lbl">Casualties</div>
        </div>
        <div class="stat-box">
          <div class="stat-num"><?= (int)($rep['injuries'] ?? 0) ?></div>
          <div class="stat-lbl">Injuries</div>
        </div>
        <div class="stat-box">
          <div class="stat-num"><?= (int)($rep['rescued'] ?? 0) ?></div>
          <div class="stat-lbl">Rescued</div>
        </div>
        <div class="stat-box">
          <div class="stat-num"><?= (int)($rep['evacuated'] ?? 0) ?></div>
          <div class="stat-lbl">Evacuated</div>
        </div>
      </div>

      <div class="info-row">
        <span class="info-label">Property Damage:</span>
        <span class="info-value"><?= val(ucfirst($rep['property_damage'] ?? '')) ?></span>
      </div>
      <?php if (!empty($rep['estimated_cost']) && $rep['estimated_cost'] > 0): ?>
      <div class="info-row">
        <span class="info-label">Estimated Cost:</span>
        <span class="info-value">₱ <?= number_format((float)$rep['estimated_cost'], 2) ?></span>
      </div>
      <?php endif; ?>
      <div class="info-row">
        <span class="info-label">Response Time:</span>
        <span class="info-value"><?= $responseTime ?></span>
      </div>
      <div class="info-row">
        <span class="info-label">Resolution Time:</span>
        <span class="info-value"><?= $resolutionTime ?></span>
      </div>
      <div class="info-row">
        <span class="info-label">Resolution Status:</span>
        <span class="info-value"><?= val($resolutionLabel) ?></span>
      </div>
      <?php if (!empty($rep['submitted_by'])): ?>
      <div class="info-row">
        <span class="info-label">Submitted By:</span>
        <span class="info-value"><?= val($rep['submitted_by']) ?></span>
      </div>
      <?php endif; ?>

      <!-- Response Team -->
      <?php if (!empty($responseTeam)): ?>
      <div class="info-row" style="margin-top:6px;">
        <span class="info-label">Response Team:</span>
        <span class="info-value"><?= htmlspecialchars(implode(', ', $responseTeam)) ?></span>
      </div>
      <?php endif; ?>

      <!-- Actions Taken -->
      <?php if (!empty($actionsTaken)): ?>
      <div style="margin-top:8px;">
        <div class="info-label" style="margin-bottom:4px;">Actions Taken:</div>
        <ul class="action-list">
          <?php foreach ($actionsTaken as $action): ?>
            <li><?= htmlspecialchars($action) ?></li>
          <?php endforeach; ?>
        </ul>
      </div>
      <?php endif; ?>

      <!-- Summary -->
      <?php if (!empty($rep['summary'])): ?>
      <div style="margin-top:8px;">
        <div class="info-label" style="margin-bottom:4px;">Summary:</div>
        <div class="description-box"><?= htmlspecialchars($rep['summary']) ?></div>
      </div>
      <?php endif; ?>

      <!-- Recommendations -->
      <?php if (!empty($rep['recommendations'])): ?>
      <div style="margin-top:8px;">
        <div class="info-label" style="margin-bottom:4px;">Recommendations:</div>
        <div class="description-box"><?= htmlspecialchars($rep['recommendations']) ?></div>
      </div>
      <?php endif; ?>

      <!-- Follow-up -->
      <?php if (!empty($rep['follow_up_required'])): ?>
      <div class="info-row" style="margin-top:8px;">
        <span class="info-label">Follow-up Required:</span>
        <span class="info-value" style="color:#ef4444; font-weight:bold;">YES</span>
      </div>
      <?php if (!empty($rep['follow_up_notes'])): ?>
      <div class="description-box" style="border-color:#ef4444;"><?= htmlspecialchars($rep['follow_up_notes']) ?></div>
      <?php endif; ?>
      <?php endif; ?>

    </div>
  </div>
  <?php else: ?>
  <!-- No field report yet -->
  <div class="section">
    <div class="section-title">IV. Responder Field Report</div>
    <div class="section-body">
      <p class="empty-text">No responder field report has been submitted for this incident yet.</p>
    </div>
  </div>
  <?php endif; ?>

  <!-- ══ SECTION V: ACTIVITY TIMELINE ════════════════════════════ -->
  <div class="section">
    <div class="section-title">V. Activity Timeline</div>
    <div class="section-body">
      <?php if (empty($tl)): ?>
        <p class="empty-text">No timeline entries recorded.</p>
      <?php else: ?>
        <ul class="timeline">
          <?php foreach ($tl as $entry): ?>
          <li class="tl-item">
            <div class="tl-dot"></div>
            <div class="tl-content">
              <div class="tl-title"><?= val($entry['title']) ?></div>
              <?php if (!empty($entry['description'])): ?>
              <div class="tl-desc"><?= htmlspecialchars($entry['description']) ?></div>
              <?php endif; ?>
              <div class="tl-meta">
                <?= val($entry['actor']) ?> &nbsp;·&nbsp; <?= val($entry['created_at']) ?>
              </div>
            </div>
          </li>
          <?php endforeach; ?>
        </ul>
      <?php endif; ?>
    </div>
  </div>

  <!-- ══ SECTION VI: ADMIN NOTES ══════════════════════════════════ -->
  <div class="section">
    <div class="section-title">VI. Admin Notes &amp; Updates</div>
    <div class="section-body">
      <?php if (empty($notes)): ?>
        <p class="empty-text">No admin notes recorded for this incident.</p>
      <?php else: ?>
        <?php foreach ($notes as $note): ?>
        <div class="note-item">
          <div><?= htmlspecialchars($note['note']) ?></div>
          <div class="note-meta">
            Added by <strong><?= val($note['admin_name']) ?></strong> on <?= val($note['created_at']) ?>
          </div>
        </div>
        <?php endforeach; ?>
      <?php endif; ?>
    </div>
  </div>

  <!-- ══ SECTION VII: DISPATCH DETAILS ═══════════════════════════ -->
  <?php if (!empty($i['dispatched_to'])): ?>
  <div class="section">
    <div class="section-title">VII. Dispatch Details</div>
    <div class="section-body">
      <div class="info-row">
        <span class="info-label">Dispatched To:</span>
        <span class="info-value"><?= val($i['dispatched_to']) ?></span>
      </div>
      <?php if (!empty($i['dispatched_by'])): ?>
      <div class="info-row">
        <span class="info-label">Dispatched By:</span>
        <span class="info-value"><?= val($i['dispatched_by']) ?></span>
      </div>
      <?php endif; ?>
      <?php if (!empty($i['dispatched_at'])): ?>
      <div class="info-row">
        <span class="info-label">Dispatched At:</span>
        <span class="info-value"><?= val(date('F j, Y h:i A', strtotime($i['dispatched_at']))) ?></span>
      </div>
      <?php endif; ?>
    </div>
  </div>
  <?php endif; ?>

  <!-- ══ SIGNATURES ════════════════════════════════════════════════ -->
  <div class="signature-block">
    <div>
      <div class="sig-line">
        <div class="sig-name">REY ALDRIN S. TOLENTINO</div>
        <div>Punong Barangay</div>
      </div>
    </div>
    <div>
      <div class="sig-line">
        <div class="sig-name"><?= $adminName ?></div>
        <div>Report Prepared By</div>
      </div>
    </div>
  </div>

  <!-- ══ FOOTER ═════════════════════════════════════════════════════ -->
  <div class="footer">
    <span>Barangay Gulod BDRRMC &nbsp;|&nbsp; SafeChain Incident Management System</span>
    <span>Generated: <?= $generatedAt ?></span>
  </div>

</div>
</body>
</html>