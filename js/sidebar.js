const sidebar = document.getElementById("sidebar");
const sidebarToggler = document.getElementById("sidebarToggler");
const primaryNav = document.getElementById("primaryNav");
const mainContent = document.getElementById("mainContent");

// Load saved state from localStorage
let isCollapsed = localStorage.getItem("sidebarCollapsed") === "true";

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

  document.querySelectorAll(".nav-link").forEach((link) => {
    if (isCollapsed) {
      link.classList.add("w-[50px]", "h-[50px]", "p-0", "justify-center");
    } else {
      link.classList.remove("w-[50px]", "h-[50px]", "p-0", "justify-center");
    }
    link.querySelector(".nav-label").classList.toggle("hidden", isCollapsed);
  });
}

// Apply initial state on page load
applySidebarState();

// Toggle sidebar and save state
sidebarToggler.addEventListener("click", () => {
  isCollapsed = !isCollapsed;
  
  // Save to localStorage
  localStorage.setItem("sidebarCollapsed", isCollapsed);
  
  applySidebarState();
});

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

document.getElementById("darkModeToggle").addEventListener("click", (e) => {
  e.preventDefault();
  const html = document.documentElement;
  
  // Toggle dark mode on html element
  if (html.getAttribute('data-theme') === 'dark') {
    html.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
    // Switch map theme if switchMapTheme function exists (only on dashboard page)
    if (typeof switchMapTheme === 'function') {
      switchMapTheme(false);
    }
  } else {
    html.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
    // Switch map theme if switchMapTheme function exists (only on dashboard page)
    if (typeof switchMapTheme === 'function') {
      switchMapTheme(true);
    }
  }

  const icon = document.getElementById("darkModeIcon");
  const label = document.getElementById("darkModeLabel");
  icon.classList.add("rotate");

  if (html.getAttribute('data-theme') === 'dark') {
    icon.classList.replace("uil-moon", "uil-sun");
    label.textContent = "Light Mode";
  } else {
    icon.classList.replace("uil-sun", "uil-moon");
    label.textContent = "Dark Mode";
  }

  setTimeout(() => icon.classList.remove("rotate"), 500);
});

// Load saved theme on page load
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
  const icon = document.getElementById("darkModeIcon");
  const label = document.getElementById("darkModeLabel");
  icon.classList.replace("uil-moon", "uil-sun");
  label.textContent = "Light Mode";
}

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