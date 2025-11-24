// Sort Dropdown
const typeDropdownButton = document.getElementById("sortDropdownButton");
const typeDropdownMenu = document.getElementById("sortDropdownMenu");
const typeDropdownIcon = document.getElementById("sortDropdownIcon");
const typeSelectedText = document.getElementById("sortSelectedText");
const typeDropdownItems = typeDropdownMenu.querySelectorAll(".dropdown-item");

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
    currentPage = 1;
    renderTable();
    updateClearFilterButton();
  });
});

// Close all dropdowns
function closeAllDropdowns() {
  typeDropdownMenu.classList.add("hidden");
  typeDropdownIcon.style.transform = "rotate(0deg)";
}

// Close dropdowns when clicking outside
document.addEventListener("click", () => {
  closeAllDropdowns();
});