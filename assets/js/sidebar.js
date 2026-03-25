const sidebar = document.getElementById("sidebar");
const sidebarToggler = document.getElementById("sidebarToggler");
const primaryNav = document.getElementById("primaryNav");
const mainContent = document.getElementById("mainContent");

// --- Smooth Page Transitions ---
window.redirectWithTransition = function (href) {
  document.body.classList.add("page-exit");
  setTimeout(() => {
    window.location.href = href;
  }, 400);
};

// Load saved state from localStorage
let isCollapsed = localStorage.getItem("sidebarCollapsed") === "true";

// Load saved group states
function getGroupState(groupId) {
  const saved = localStorage.getItem(`navGroup_${groupId}`);
  return saved !== null ? saved === "true" : null;
}

function saveGroupState(groupId, isOpen) {
  localStorage.setItem(`navGroup_${groupId}`, isOpen);
}

function applySidebarState() {
  if (isCollapsed) {
    sidebar.classList.remove("w-[270px]");
    sidebar.classList.add("w-[80px]", "sidebar-collapsed");
    mainContent.classList.remove("ml-[302px]");
    mainContent.classList.add("ml-[112px]");
  } else {
    sidebar.classList.remove("w-[80px]", "sidebar-collapsed");
    sidebar.classList.add("w-[270px]");
    mainContent.classList.remove("ml-[112px]");
    mainContent.classList.add("ml-[302px]");
  }

  document.querySelectorAll("#logoText, #userInfo").forEach((el) => {
    el.classList.toggle("hidden", isCollapsed);
  });

  const icon = sidebarToggler.querySelector("i");
  icon.style.transform = isCollapsed ? "rotate(180deg)" : "rotate(0deg)";
  sidebarToggler.style.transform = isCollapsed
    ? "translate(-4px, 65px)"
    : "translate(0, 0)";
  primaryNav.style.transform = isCollapsed
    ? "translateY(65px)"
    : "translateY(15px)";

  const userBtn = document.getElementById("userProfileBtn");
  if (isCollapsed) {
    userBtn.classList.add("justify-center", "p-2", "w-[50px]", "h-[50px]");
    userBtn.classList.remove("gap-3", "py-3", "px-3.5");
  } else {
    userBtn.classList.remove("justify-center", "p-2", "w-[50px]", "h-[50px]");
    userBtn.classList.add("gap-3", "py-3", "px-3.5");
  }

  // Handle regular nav links
  document.querySelectorAll(".nav-item .nav-link").forEach((link) => {
    if (isCollapsed) {
      link.classList.add("w-[50px]", "h-[50px]", "p-0", "justify-center");
    } else {
      link.classList.remove("w-[50px]", "h-[50px]", "p-0", "justify-center");
    }
    const label = link.querySelector(".nav-label");
    if (label) {
      label.classList.toggle("hidden", isCollapsed);
    }
  });

  // Handle group toggles in collapsed state
  document.querySelectorAll(".nav-group-toggle").forEach((toggle) => {
    if (isCollapsed) {
      toggle.classList.add("w-[50px]", "h-[50px]", "p-0", "justify-center");
      const arrow = toggle.querySelector(".group-arrow");
      if (arrow) arrow.classList.add("hidden");
      const label = toggle.querySelector(".nav-label");
      if (label) label.classList.add("hidden");
    } else {
      toggle.classList.remove("w-[50px]", "h-[50px]", "p-0", "justify-center");
      const arrow = toggle.querySelector(".group-arrow");
      if (arrow) arrow.classList.remove("hidden");
      const label = toggle.querySelector(".nav-label");
      if (label) label.classList.remove("hidden");
    }
  });

  // Collapse all groups when sidebar is collapsed
  if (isCollapsed) {
    document.querySelectorAll(".nav-group-items").forEach((groupItems) => {
      groupItems.style.maxHeight = "0";
    });
  }
}

// Initialize group states
function initializeGroups() {
  document.querySelectorAll(".nav-group-toggle").forEach((toggle) => {
    const groupId = toggle.dataset.group;
    const defaultOpen = toggle.dataset.defaultOpen === "true";
    const savedState = getGroupState(groupId);
    const shouldOpen = savedState !== null ? savedState : defaultOpen;

    const groupItems = toggle.nextElementSibling.nextElementSibling;
    const arrow = toggle.querySelector(".group-arrow");

    if (shouldOpen && !isCollapsed) {
      groupItems.style.maxHeight = groupItems.scrollHeight + "px";
      arrow.style.transform = "rotate(180deg)";
    }
  });
}

// Toggle group - FIXED VERSION
function toggleGroup(toggle) {
  // When collapsed, expand the sidebar instead of trying to toggle the group
  if (isCollapsed) {
    isCollapsed = false;
    localStorage.setItem("sidebarCollapsed", false);
    applySidebarState();
    setTimeout(() => {
      initializeGroups();
      // After expanding, open the clicked group
      const groupId = toggle.dataset.group;
      const groupItems = toggle.nextElementSibling.nextElementSibling;
      const arrow = toggle.querySelector(".group-arrow");
      groupItems.style.maxHeight = groupItems.scrollHeight + "px";
      arrow.style.transform = "rotate(180deg)";
      saveGroupState(groupId, true);
    }, 300);
    return;
  }

  const groupId = toggle.dataset.group;
  const groupItems = toggle.nextElementSibling.nextElementSibling;
  const arrow = toggle.querySelector(".group-arrow");
  const isOpen =
    groupItems.style.maxHeight && groupItems.style.maxHeight !== "0px";

  if (isOpen) {
    groupItems.style.maxHeight = "0";
    arrow.style.transform = "rotate(0deg)";
    saveGroupState(groupId, false);
  } else {
    groupItems.style.maxHeight = groupItems.scrollHeight + "px";
    arrow.style.transform = "rotate(180deg)";
    saveGroupState(groupId, true);
  }
}

// Apply initial state on page load
applySidebarState();
initializeGroups();

// Toggle sidebar and save state
sidebarToggler.addEventListener("click", () => {
  isCollapsed = !isCollapsed;
  localStorage.setItem("sidebarCollapsed", isCollapsed);
  applySidebarState();

  if (!isCollapsed) {
    setTimeout(initializeGroups, 300);
  }
});

// Group toggle handlers
document.querySelectorAll(".nav-group-toggle").forEach((toggle) => {
  toggle.addEventListener("click", (e) => {
    e.preventDefault();
    toggleGroup(toggle);
  });
});

// Tooltip handlers for regular nav items
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("mouseenter", () => {
    if (isCollapsed) {
      const tooltip = item.querySelector(".nav-tooltip");
      if (tooltip) {
        tooltip.style.opacity = "1";
        tooltip.style.left = "calc(100% + 15px)";
      }
    }
  });

  item.addEventListener("mouseleave", () => {
    if (isCollapsed) {
      const tooltip = item.querySelector(".nav-tooltip");
      if (tooltip) {
        tooltip.style.opacity = "0";
        tooltip.style.left = "calc(100% + 20px)";
      }
    }
  });
});

// Tooltip handlers for group toggles
document.querySelectorAll(".nav-group").forEach((group) => {
  group.addEventListener("mouseenter", () => {
    if (isCollapsed) {
      const tooltip = group.querySelector(".nav-tooltip");
      if (tooltip) {
        tooltip.style.opacity = "1";
        tooltip.style.left = "calc(100% + 15px)";
      }
    }
  });

  group.addEventListener("mouseleave", () => {
    if (isCollapsed) {
      const tooltip = group.querySelector(".nav-tooltip");
      if (tooltip) {
        tooltip.style.opacity = "0";
        tooltip.style.left = "calc(100% + 20px)";
      }
    }
  });
});

// Dark mode toggle
document.getElementById("darkModeToggle").addEventListener("click", (e) => {
  e.preventDefault();
  const html = document.documentElement;

  if (html.getAttribute("data-theme") === "dark") {
    html.removeAttribute("data-theme");
    localStorage.setItem("theme", "light");
    if (typeof switchMapTheme === "function") {
      switchMapTheme(false);
    }
  } else {
    html.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
    if (typeof switchMapTheme === "function") {
      switchMapTheme(true);
    }
  }

  const icon = document.getElementById("darkModeIcon");
  const label = document.getElementById("darkModeLabel");
  icon.classList.add("rotate");

  if (html.getAttribute("data-theme") === "dark") {
    icon.classList.replace("uil-moon", "uil-sun");
    label.textContent = "Light Mode";
  } else {
    icon.classList.replace("uil-sun", "uil-moon");
    label.textContent = "Dark Mode";
  }

  setTimeout(() => icon.classList.remove("rotate"), 500);
});

// Load saved theme on page load
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  document.documentElement.setAttribute("data-theme", "dark");
  const icon = document.getElementById("darkModeIcon");
  const label = document.getElementById("darkModeLabel");
  icon.classList.replace("uil-moon", "uil-sun");
  label.textContent = "Light Mode";
}

// User profile dropdown
const userProfileBtn = document.getElementById("userProfileBtn");
const userDropdown = document.getElementById("userDropdown");

userProfileBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  userDropdown.classList.toggle("hidden");

  if (isCollapsed) {
    userDropdown.style.left = "100%";
    userDropdown.style.marginLeft = "10px";
    userDropdown.style.bottom = "0";
    userDropdown.style.marginBottom = "0";
  } else {
    userDropdown.style.left = "0";
    userDropdown.style.marginLeft = "0";
    userDropdown.style.bottom = "100%";
    userDropdown.style.marginBottom = "8px";
  }
});

document.addEventListener("click", () => userDropdown.classList.add("hidden"));
userDropdown.addEventListener("click", (e) => e.stopPropagation());

const POLL_INTERVAL = 3000;

let knownIncidentIds = new Set(
  JSON.parse(localStorage.getItem("knownIncidentIds") || "[]"),
);
let isInitialLoad = true;

// ── Sound config (populated by loadSoundSettings) ────────────────────────
let soundConfig = {
  src: "/assets/sounds/alert.mp3", // fallback default
  volume: 0.7,
  duration: 3000, // ms
};
let soundSettingsLoaded = false;

// ── Audio instance ────────────────────────────────────────────────────────
let notificationAudio = null;
let audioInitialized = false;
let testStopTimer = null;

/**
 * Fetch sound settings from the backend once.
 * Called immediately and re-called lazily if it failed the first time.
 */
async function loadSoundSettings() {
  try {
    const res = await fetch("api/settings/sound.php");
    const data = await res.json();
    if (data.success && data.data) {
      soundConfig.src = data.data.src || "/assets/sounds/alert.mp3";
      soundConfig.volume = data.data.volume ?? 0.7;
      soundConfig.duration = (data.data.duration ?? 3) * 1000;
    }
    soundSettingsLoaded = true;
  } catch (e) {
    // Network error — keep defaults, retry on next play
    soundSettingsLoaded = false;
  }
}

// Kick off settings load immediately (non-blocking)
loadSoundSettings();

/**
 * (Re)build the Audio object using the current soundConfig.
 * Safe to call multiple times — disposes the old instance first.
 */
function buildAudio() {
  if (notificationAudio) {
    notificationAudio.pause();
    notificationAudio.src = "";
    notificationAudio = null;
  }
  notificationAudio = new Audio(soundConfig.src);
  notificationAudio.volume = soundConfig.volume;
  notificationAudio.load();
  audioInitialized = true;
}

/**
 * Warm up the audio context on first user gesture (required by browsers).
 */
function initializeAudio() {
  if (audioInitialized) return;
  buildAudio();
  notificationAudio.volume = 0; 
  notificationAudio.play()
    .then(() => {
      notificationAudio.pause();
      notificationAudio.currentTime = 0;
      notificationAudio.volume = soundConfig.volume;
    })
    .catch(() => {});
}

initializeAudio();
["click", "keydown", "touchstart"].forEach((evt) => {
  document.addEventListener(evt, initializeAudio, { once: true });
});

/**
 * Play the notification sound for soundConfig.duration ms then stop.
 */
async function playNotificationSound() {
  if (!soundSettingsLoaded) await loadSoundSettings();

  if (!audioInitialized || notificationAudio?.src !== soundConfig.src) {
    buildAudio();
  }

  if (!notificationAudio) return;

  notificationAudio.volume = soundConfig.volume;
  notificationAudio.currentTime = 0;
  notificationAudio.loop = true; // ← loop it
  notificationAudio.play().catch(() => {});

  if (testStopTimer) clearTimeout(testStopTimer);
  testStopTimer = setTimeout(() => {
    notificationAudio.loop = false; // ← stop looping then pause
    notificationAudio.pause();
    notificationAudio.currentTime = 0;
  }, soundConfig.duration);
}

// ── Incident polling ──────────────────────────────────────────────────────
async function checkNewIncidents() {
  if (isInitialLoad) isInitialLoad = false;
  if (window.__dashboardActive) return;

  try {
    const response = await fetch("api/dashboard/get_incidents.php");
    const result = await response.json();

    if (result.success) {
      // Sync — remove IDs no longer in DB
      const activeIds = new Set(
        ["fire", "crime", "flood"].flatMap((t) =>
          (result.data[t] || []).map((i) => i.id),
        ),
      );
      knownIncidentIds.forEach((id) => {
        if (!activeIds.has(id)) knownIncidentIds.delete(id);
      });
      localStorage.setItem(
        "knownIncidentIds",
        JSON.stringify([...knownIncidentIds]),
      );

      ["fire", "crime", "flood"].forEach((type) => {
        (result.data[type] || []).forEach((incident) => {
          if (!knownIncidentIds.has(incident.id)) {
            knownIncidentIds.add(incident.id);
            localStorage.setItem(
              "knownIncidentIds",
              JSON.stringify([...knownIncidentIds]),
            );
            if (!isInitialLoad && typeof showToast === "function") {
              showToast("info", `New ${type} incident: ${incident.user.name}`);
              playNotificationSound();
            }
          }
        });
      });
    }
  } catch (error) {
    console.error("Sidebar polling error:", error);
  }
}

setInterval(checkNewIncidents, POLL_INTERVAL);
checkNewIncidents();
