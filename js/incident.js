// Type Dropdown
const typeDropdownButton = document.getElementById("typeDropdownButton");
const typeDropdownMenu = document.getElementById("typeDropdownMenu");
const typeDropdownIcon = document.getElementById("typeDropdownIcon");
const typeSelectedText = document.getElementById("typeSelectedText");
const typeDropdownItems = typeDropdownMenu.querySelectorAll(".dropdown-item");

// Status Dropdown
const statusDropdownButton = document.getElementById("statusDropdownButton");
const statusDropdownMenu = document.getElementById("statusDropdownMenu");
const statusDropdownIcon = document.getElementById("statusDropdownIcon");
const statusSelectedText = document.getElementById("statusSelectedText");
const statusDropdownItems =
  statusDropdownMenu.querySelectorAll(".dropdown-item");

// Date Dropdown
const dateButton = document.getElementById("dateButton");
const dateMenu = document.getElementById("dateMenu");
const dateIcon = document.getElementById("dateIcon");
const dateText = document.getElementById("dateText");
const quickDateButtons = document.querySelectorAll(".quick-date");
const customDates = document.getElementById("customDates");
const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");
const applyCustom = document.getElementById("applyCustom");
const clearDate = document.getElementById("clearDate");

// Clear Filter Button
const clearFilterBtn = document.getElementById("clearFilterBtn");

let selectedDateRange = null;
let selectedType = "all";
let selectedStatus = "all";

// Close all dropdowns
function closeAllDropdowns() {
  typeDropdownMenu.classList.add("hidden");
  typeDropdownIcon.style.transform = "rotate(0deg)";
  statusDropdownMenu.classList.add("hidden");
  statusDropdownIcon.style.transform = "rotate(0deg)";
  dateMenu.classList.add("hidden");
  dateIcon.style.transform = "rotate(0deg)";
}

// Update filter button visibility
function updateClearFilterButton() {
  const hasFilters = selectedType !== "all" || selectedStatus !== "all" || selectedDateRange !== null;
  
  if (hasFilters) {
    clearFilterBtn.classList.remove("hidden");
    // Trigger animation after removing hidden
    setTimeout(() => {
      clearFilterBtn.classList.remove("opacity-0");
      clearFilterBtn.classList.add("opacity-100");
    }, 10);
  } else {
    clearFilterBtn.classList.remove("opacity-100");
    clearFilterBtn.classList.add("opacity-0");
    // Hide after animation completes
    setTimeout(() => {
      clearFilterBtn.classList.add("hidden");
    }, 300);
  }
}

// Type Dropdown Toggle
typeDropdownButton.addEventListener("click", (e) => {
  e.stopPropagation();
  const isHidden = typeDropdownMenu.classList.contains("hidden");
  closeAllDropdowns();

  if (isHidden) {
    typeDropdownMenu.classList.remove("hidden");
    typeDropdownIcon.style.transform = "rotate(180deg)";
  }
});

// Type Dropdown Selection
typeDropdownItems.forEach((item) => {
  item.addEventListener("click", (e) => {
    const value = e.target.getAttribute("data-value");
    const text = e.target.textContent.trim();

    selectedType = value;
    typeSelectedText.textContent = text;

    typeDropdownItems.forEach((i) =>
      i.classList.remove("bg-emerald-50", "text-emerald-600")
    );
    e.target.classList.add("bg-emerald-50", "text-emerald-600");

    typeDropdownMenu.classList.add("hidden");
    typeDropdownIcon.style.transform = "rotate(0deg)";
    updateClearFilterButton();
  });
});

// Status Dropdown Toggle
statusDropdownButton.addEventListener("click", (e) => {
  e.stopPropagation();
  const isHidden = statusDropdownMenu.classList.contains("hidden");
  closeAllDropdowns();

  if (isHidden) {
    statusDropdownMenu.classList.remove("hidden");
    statusDropdownIcon.style.transform = "rotate(180deg)";
  }
});

// Status Dropdown Selection
statusDropdownItems.forEach((item) => {
  item.addEventListener("click", (e) => {
    const value = e.target.getAttribute("data-value");
    const text = e.target.textContent.trim();

    selectedStatus = value;
    statusSelectedText.textContent = text;

    statusDropdownItems.forEach((i) =>
      i.classList.remove("bg-emerald-50", "text-emerald-600")
    );
    e.target.classList.add("bg-emerald-50", "text-emerald-600");

    statusDropdownMenu.classList.add("hidden");
    statusDropdownIcon.style.transform = "rotate(0deg)";
    updateClearFilterButton();
  });
});

// Date Dropdown Toggle
dateButton.addEventListener("click", (e) => {
  e.stopPropagation();
  const isHidden = dateMenu.classList.contains("hidden");
  closeAllDropdowns();

  if (isHidden) {
    dateMenu.classList.remove("hidden");
    dateIcon.style.transform = "rotate(180deg)";
  }
});

// Quick date selections
quickDateButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const days = button.getAttribute("data-days");

    if (days === "custom") {
      customDates.classList.remove("hidden");
      quickDateButtons.forEach((btn) =>
        btn.classList.remove(
          "bg-emerald-50",
          "border-emerald-500",
          "text-emerald-600"
        )
      );
      button.classList.add(
        "bg-emerald-50",
        "border-emerald-500",
        "text-emerald-600"
      );
    } else {
      customDates.classList.add("hidden");
      const text = button.textContent;
      dateText.textContent = text;
      selectedDateRange = text;

      quickDateButtons.forEach((btn) =>
        btn.classList.remove(
          "bg-emerald-50",
          "border-emerald-500",
          "text-emerald-600"
        )
      );
      button.classList.add(
        "bg-emerald-50",
        "border-emerald-500",
        "text-emerald-600"
      );

      dateMenu.classList.add("hidden");
      dateIcon.style.transform = "rotate(0deg)";
      updateClearFilterButton();
    }
  });
});

// Apply custom date range
applyCustom.addEventListener("click", () => {
  if (startDate.value && endDate.value) {
    const start = new Date(startDate.value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const end = new Date(endDate.value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    dateText.textContent = `${start} - ${end}`;
    selectedDateRange = `${start} - ${end}`;
    dateMenu.classList.add("hidden");
    dateIcon.style.transform = "rotate(0deg)";
    updateClearFilterButton();
  }
});

// Clear date filter
clearDate.addEventListener("click", () => {
  dateText.textContent = "Date Range";
  selectedDateRange = null;
  startDate.value = "";
  endDate.value = "";
  customDates.classList.add("hidden");
  quickDateButtons.forEach((btn) =>
    btn.classList.remove(
      "bg-emerald-50",
      "border-emerald-500",
      "text-emerald-600"
    )
  );
  dateMenu.classList.add("hidden");
  dateIcon.style.transform = "rotate(0deg)";
  updateClearFilterButton();
});

// Clear All Filters
clearFilterBtn.addEventListener("click", () => {
  // Reset type
  selectedType = "all";
  typeSelectedText.textContent = "All Types";
  typeDropdownItems.forEach((i) =>
    i.classList.remove("bg-emerald-50", "text-emerald-600")
  );

  // Reset status
  selectedStatus = "all";
  statusSelectedText.textContent = "All Status";
  statusDropdownItems.forEach((i) =>
    i.classList.remove("bg-emerald-50", "text-emerald-600")
  );

  // Reset date
  dateText.textContent = "Date Range";
  selectedDateRange = null;
  startDate.value = "";
  endDate.value = "";
  customDates.classList.add("hidden");
  quickDateButtons.forEach((btn) =>
    btn.classList.remove(
      "bg-emerald-50",
      "border-emerald-500",
      "text-emerald-600"
    )
  );

  updateClearFilterButton();
});

// Close dropdowns when clicking outside
document.addEventListener("click", () => {
  closeAllDropdowns();
});

// Set max dates to today
const today = new Date().toISOString().split("T")[0];
startDate.max = today;
endDate.max = today;

startDate.addEventListener("change", () => {
  endDate.min = startDate.value;
});

// Initial update
updateClearFilterButton();
