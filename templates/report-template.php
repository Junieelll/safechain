<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Incident Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, Helvetica, sans-serif; 
      font-size: 11px;
      line-height: 1.3;
      color: #000;
    }
    .container { 
      width: 100%; 
      padding: 15px;
    }
    
    /* Header styles */
    .header-table { 
      width: 100%; 
      margin-bottom: 8px;
    }
    .header-table td { 
      vertical-align: top;
    }
    .header-left { 
      width: 15%; 
      text-align: left;
    }
    .header-center { 
      width: 70%; 
      text-align: center;
    }
    .header-right { 
      width: 15%; 
      text-align: right;
    }
    .header-title { 
      font-size: 13px; 
      font-weight: bold; 
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .header-subtitle { 
      font-size: 12px; 
      font-weight: bold;
      margin-bottom: 2px;
    }
    .header-address { 
      font-size: 10px;
      margin-bottom: 1px;
    }
    .header-tel { 
      font-size: 10px;
      font-style: italic;
    }
    
    .separator { 
      border: none;
      border-top: 2px solid #000;
      margin: 8px 0;
    }
    
    /* Main content table */
    .main-table { 
      width: 100%;
      border-collapse: collapse;
    }
    .main-table td { 
      vertical-align: top;
      padding: 0;
    }
    .left-column { 
      width: 25%;
      border-right: 2px solid #000;
      padding-right: 10px;
    }
    .right-column { 
      width: 75%;
      padding-left: 12px;
    }
    
    /* Officials section */
    .officials-name { 
      font-size: 11px;
      font-style: italic;
      font-weight: bold;
      margin-bottom: 1px;
    }
    .officials-position { 
      font-size: 10px;
      font-style: italic;
      margin-left: 15px;
      margin-bottom: 8px;
    }
    .kagawad-header { 
      font-size: 11px;
      font-weight: bold;
      margin-bottom: 4px;
      margin-top: 4px;
    }
    .kagawad-name { 
      font-size: 10px;
      font-style: italic;
      margin-bottom: 3px;
    }
    
    /* Report sections */
    .report-header { 
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 3px;
    }
    .report-subheader { 
      font-size: 11px;
      margin-bottom: 2px;
    }
    .report-meta { 
      font-size: 11px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    
    .section { 
      margin-bottom: 10px;
    }
    .section-title { 
      font-size: 11px;
      font-weight: bold;
      font-style: italic;
      margin-bottom: 3px;
    }
    .section-content { 
      font-size: 10px;
      line-height: 1.4;
    }
    .section-content p { 
      margin-bottom: 2px;
    }
    
    /* Notes and timeline boxes */
    .info-box { 
      background-color: #f5f5f5;
      border: 1px solid #ddd;
      padding: 6px;
      margin-top: 4px;
    }
    .info-item { 
      margin-bottom: 6px;
      font-size: 10px;
    }
    .info-item-title { 
      font-weight: bold;
    }
    .info-item-date { 
      color: #666;
      font-size: 9px;
    }
    .info-item-content { 
      margin-top: 2px;
    }
    
    /* Footer */
    .footer { 
      text-align: center;
      margin-top: 20px;
      font-size: 10px;
    }
    .end-report { 
      text-align: center;
      font-size: 11px;
      font-weight: bold;
      margin-top: 12px;
    }
    
    /* Utility classes */
    .ml-4 { margin-left: 15px; }
    .mb-2 { margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="container">
    
    <!-- Header -->
    <table class="header-table">
      <tr>
        <td class="header-left">
          <div style="text-align: center; font-size: 9px; border: 1px solid #000; padding: 2px;"><img src="<?= __DIR__ . '/../assets/img/qc-logo.png' ?>" alt="logo" class="h-16 w-auto" /></div>
        </td>
        <td class="header-center">
          <div class="header-title">REPUBLIC OF THE PHILIPPINES</div>
          <div class="header-subtitle">BARANGAY GULOD</div>
          <div class="header-address">VILLAFLOR VILLAGE, DISTRICT V, QUEZON CITY</div>
          <div class="header-tel">Tel. No. 8366-3198</div>
        </td>
        <td class="header-right">
          <div style="text-align: center; font-size: 9px; border: 1px solid #000; padding: 2px;"><img src="<?= __DIR__ . '/../assets/img/gulod-logo.png' ?>" alt="logo" class="h-16 w-auto ml-auto" /></div>
        </td>
      </tr>
    </table>

    <hr class="separator">

    <!-- Main Content -->
    <table class="main-table">
      <tr>
        <!-- Left Column: Officials -->
        <td class="left-column">
          <div class="officials-name">REY ALDRIN S. TOLENTINO</div>
          <div class="officials-position">Punong Barangay</div>
          
          <div class="kagawad-header">BARANGAY KAGAWAD</div>
          
          <div class="kagawad-name">LOVELY ALPHINE S.<br>BIGLANG-AWA</div>
          <div class="kagawad-name">MARLON S. SERRANO</div>
          <div class="kagawad-name">SHERILL B. ACLE</div>
          <div class="kagawad-name">PERCIVAL M. CASTELLTORT</div>
          <div class="kagawad-name">EDGAR P. MABALOT</div>
          <div class="kagawad-name">NONITO D. GONZALES</div>
          <div class="kagawad-name">GLENDALE B. CLEMENTE</div>
          
          <div style="margin-top: 8px;">
            <div class="kagawad-name">ALJOHN JAYZIELE L.<br>BIGLANG-AWA</div>
            <div class="officials-position">SK Chairperson</div>
          </div>
          
          <div style="margin-top: 4px;">
            <div class="kagawad-name">MILA B. NARIO</div>
            <div class="officials-position">Barangay Secretary</div>
          </div>
          
          <div style="margin-top: 4px;">
            <div class="kagawad-name">LUNINGNING R. ARATAS</div>
            <div class="officials-position">Barangay Treasurer</div>
          </div>
        </td>

        <!-- Right Column: Report Content -->
        <td class="right-column">
          
          <!-- Report Header -->
          <div class="report-header">HAZARD REPORT: FLOOD EMERGENCY</div>
          <div class="report-subheader">TYPHOON "PEPITO"</div>
          <div class="report-meta">REPORTING BARANGAY: Barangay Gulod, Novaliches QC</div>

          <!-- I. EVENT OVERVIEW -->
          <div class="section">
            <div class="section-title">I. EVENT OVERVIEW</div>
            <div class="section-content">
              <p>- HAZARD TYPE: Flooding and Potential Landslides</p>
              <p>- CAUSE: Super Typhoon "PEPITO" (International Name: [Insert])</p>
              <p>- ALERT STATUS:</p>
              <p class="ml-4">- BDRRM Office: 24-Hour Standby</p>
              <p class="ml-4">- Disaster Brigade Team: Activated</p>
              <p class="ml-4">- Metro Manila/Central Luzon: Under Typhoon Warning</p>
            </div>
          </div>

          <!-- II. AFFECTED AREAS -->
          <div class="section">
            <div class="section-title">II. AFFECTED AREAS</div>
            <div class="section-content">
              <p>1. HIGH-RISK ZONES:</p>
              <p>- Tullahan Riverbanks: Informal Settler Families (ISFs) and shanties at risk of flooding/landslides.</p>
              <p>- Low-Lying Areas: Imminent flooding and soil instability.</p>
              <p>- Areas with Dangling Wires: Fire hazard due to damaged electrical lines.</p>
              <p class="mb-2">2. EPICENTER IMPACT:</p>
              <p>- Typhoon "PEPITO"'s eye trajectory directly affects the entire barangay.</p>
            </div>
          </div>

          <!-- III. IMMEDIATE ACTIONS TAKEN -->
          <div class="section">
            <div class="section-title">III. IMMEDIATE ACTIONS TAKEN</div>
            <div class="section-content">
              <p>1. 24-HOUR STAND-BY TEAMS:</p>
              <p>- BDRRM Personnel/Committee: Monitoring River levels, weather updates, and coordination.</p>
              <p>- Disaster Brigade Team: Deployed to high-risk zones for preemptive evacuation.</p>
              <p>- Evacuation Personnel: Mobilized to assist residents to Villaflor Barangay Hall Evacuation Center.</p>
              <p class="mb-2">2. CRITICAL MEASURES:</p>
              <p>- Preemptive Evacuation: ISFs along Tullahan River and landslide-prone areas prioritized.</p>
              <p>- Health/Medical Teams & BHWs: On standby with emergency medical supplies.</p>
              <p>- Logistics/Food Dept.: Food packs, water, and blankets pre-positioned at the Base Command Post (Villaflor Brgy. Hall).</p>
              <p>- Peace and Order Committee: Securing evacuation routes and preventing looting.</p>
              <p class="mb-2">3. EQUIPMENT READINESS:</p>
              <p>- Rescue boats, life vests, generators, and communication devices operational.</p>
            </div>
          </div>

          <!-- IV. REMARKS -->
          <div class="section">
            <div class="section-title">IV. REMARKS</div>
            <div class="section-content">
              <p>1. RISK ASSESSMENT:</p>
              <p>- Landslide Threat: High in elevated and deforested areas.</p>
            </div>
            
            <?php if (!empty($report_notes)): ?>
            <div class="info-box">
              <?php foreach ($report_notes as $n): ?>
                <div class="info-item">
                  <div class="info-item-title">
                    <?= htmlspecialchars($n['admin_name']) ?> 
                    <span class="info-item-date">(<?= htmlspecialchars($n['created_at']) ?>)</span>
                  </div>
                  <div class="info-item-content"><?= nl2br(htmlspecialchars($n['note'])) ?></div>
                </div>
              <?php endforeach; ?>
            </div>
            <?php endif; ?>
          </div>

          <!-- V. REMARKS (CONTINUED) -->
          <div class="section">
            <div class="section-title">V. REMARKS</div>
            <div class="section-content">
              <p>1. Risk Factors:</p>
              <p>- Proximity to La Mesa Dam and Angat River increases flooding risks.</p>
              <p>- Informal settlements in Area 4 and Area 2 lack flood-resilient infrastructure.</p>
              <p class="mb-2">2. Challenges:</p>
              <p>- Resistance from some residents to evacuate promptly.</p>
              <p>- Limited capacity of evacuation centers if dam overflow escalates.</p>
            </div>
          </div>

          <!-- VI. RECOMMENDATIONS -->
          <div class="section">
            <div class="section-title">VI. RECOMMENDATIONS</div>
            <div class="section-content">
              <p>1. Enhanced Monitoring:</p>
              <p>- 24/7 surveillance of La Mesa Dam and river water levels.</p>
              <p class="mb-2">2. Community Preparedness:</p>
              <p>- Conduct drills for dam-related flood scenarios.</p>
              <p>- Distribute emergency kits to high-risk households.</p>
              <p class="mb-2">3. Infrastructure Audit:</p>
              <p>- Assess and reinforce drainage systems in flood-prone zones.</p>
              <p class="mb-2">4. Resource Stockpiling:</p>
              <p>- Preposition food, water, and medical supplies at evacuation centers.</p>
            </div>
          </div>

          <!-- ATTACHMENTS -->
          <div class="section">
            <div class="section-title">ATTACHMENTS:</div>
            <div class="section-content">
              <p>- Evacuee registration logs.</p>
              <p>- QCDRRMO advisory on La Mesa Dam.</p>
            </div>
          </div>

          <!-- Timeline -->
          <?php if (!empty($report_timeline)): ?>
          <div class="section">
            <div class="section-title">TIMELINE:</div>
            <div class="info-box">
              <?php foreach ($report_timeline as $t): ?>
                <div class="info-item">
                  <div class="info-item-title">
                    <?= htmlspecialchars($t['title']) ?> 
                    <span class="info-item-date">(<?= htmlspecialchars($t['created_at']) ?>)</span>
                  </div>
                  <div class="info-item-content"><?= nl2br(htmlspecialchars($t['description'])) ?></div>
                </div>
              <?php endforeach; ?>
            </div>
          </div>
          <?php endif; ?>

          <div class="end-report">END OF REPORT.</div>

        </td>
      </tr>
    </table>

    <!-- Footer -->
    <div class="footer">
      <p>Prepared by: <strong><?= htmlspecialchars($report_incident['reporter_name'] ?: $report_incident['reporter']) ?></strong></p>
      <p style="margin-top: 8px; color: #666;">Barangay Gulod — Official Incident Report</p>
    </div>

  </div>
</body>
</html>