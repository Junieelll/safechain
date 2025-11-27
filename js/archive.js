let allItems = [
  {
    id: 1,
    type: "incident",
    title: "Fire Emergency #EMG-2024-1047",
    time: "2 hrs ago",
  },
  {
    id: 2,
    type: "incident",
    title: "Flood Alert #EMG-2024-1046",
    time: "3 hrs ago",
  },
  { id: 3, type: "user", title: "Pedro Martinez", time: "2 hrs ago" },
  {
    id: 4,
    type: "device",
    title: "Keychain Device #KC-00142",
    time: "2 hrs ago",
  },
  { id: 5, type: "user", title: "Maria Santos", time: "2 hrs ago" },
  {
    id: 6,
    type: "device",
    title: "Keychain Device #KC-00143",
    time: "2 hrs ago",
  },
];

let currentTab = "all";
let filteredItems = [...allItems];
let previousTabIndex = 0;
let isLoading = false;

const itemsContainer = document.getElementById("itemsContainer");
const itemsList = document.getElementById("itemsList");
const actionBar = document.getElementById("actionBar");
const selectedCount = document.getElementById("selectedCount");
const selectAllCheckbox = document.getElementById("selectAll");
const tabButtons = document.querySelectorAll(".tab-btn");
const tabIndicator = document.getElementById("tabIndicator");
const searchInput = document.getElementById("search");

const tabOrder = ["all", "incidents", "users", "devices"];

// Page load animations
function initPageAnimations() {
  const header = document.querySelector(".header");
  const tabsSection = document.querySelector(".rounded-lg.mb-4");
  const filterControls = document.querySelector(".bg-white.rounded-xl.flex");

  if (header) {
    header.classList.add("animate-fade-in-up", "stagger-1");
  }
  if (tabsSection) {
    tabsSection.classList.add("animate-fade-in-up", "stagger-2");
  }
  if (filterControls) {
    filterControls.classList.add("animate-fade-in-up", "stagger-3");
  }
}

// Loading skeleton
function showLoadingSkeleton() {
  itemsList.innerHTML = Array(3)
    .fill(0)
    .map(
      () => `
    <div class="px-6 py-5 flex items-center gap-4">
      <div class="skeleton w-5 h-5"></div>
      <div class="skeleton w-12 h-12 rounded-lg"></div>
      <div class="flex-1 space-y-2">
        <div class="skeleton h-4 w-3/4"></div>
        <div class="skeleton h-3 w-1/2"></div>
      </div>
      <div class="skeleton h-9 w-24"></div>
      <div class="skeleton h-9 w-24"></div>
    </div>
  `
    )
    .join("");
}

function getIconColor(type) {
  return {
    incident: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-700",
    user: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-700",
    device: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-700",
  }[type];
}

function getIcon(type) {
  if (type === "incident") {
    return '<i class="uil uil-exclamation-circle text-2xl text-red-600"></i>';
  } else if (type === "user") {
    return '<i class="uil uil-user text-2xl text-blue-600"></i>';
  } else {
    return '<i class="uil uil-mobile-android text-2xl text-green-600"></i>';
  }
}

function getBadge(type) {
  if (type === "incident") {
    return '<span class="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/40 dark:text-red-700 text-red-700 rounded-full">INCIDENT</span>';
  } else if (type === "user") {
    return '<span class="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/40 dark:text-blue-700 text-blue-700 rounded-full">USER</span>';
  } else {
    return '<span class="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-emerald-900/40 dark:text-emerald-700 text-green-700 rounded-full">DEVICE</span>';
  }
}

function filterItems(tab, skipAnimation = false) {
  if (isLoading) return;
  isLoading = true;

  const currentTabIndex = tabOrder.indexOf(tab);
  const isMovingRight = currentTabIndex > previousTabIndex;

  if (!skipAnimation) {
    const slideOutClass = isMovingRight ? "slide-out-left" : "slide-out-right";
    itemsContainer.classList.add(slideOutClass);
  }

  // Show loading skeleton
  setTimeout(
    () => {
      showLoadingSkeleton();
    },
    skipAnimation ? 0 : 250
  );

  setTimeout(
    () => {
      if (tab === "all") {
        filteredItems = [...allItems];
      } else if (tab === "incidents") {
        filteredItems = allItems.filter((item) => item.type === "incident");
      } else if (tab === "users") {
        filteredItems = allItems.filter((item) => item.type === "user");
      } else if (tab === "devices") {
        filteredItems = allItems.filter((item) => item.type === "device");
      }

      renderItems();

      if (!skipAnimation) {
        const slideOutClass = isMovingRight
          ? "slide-out-left"
          : "slide-out-right";
        const slideInClass = isMovingRight
          ? "slide-in-right"
          : "slide-in-left";

        itemsContainer.classList.remove(slideOutClass);
        itemsContainer.classList.add(slideInClass);

        setTimeout(() => {
          itemsContainer.classList.remove(slideInClass);
        }, 250);
      }

      updateActionBar();
      previousTabIndex = currentTabIndex;
      isLoading = false;
    },
    skipAnimation ? 300 : 550
  );
}

function renderItems() {
  if (filteredItems.length === 0) {
    itemsList.innerHTML = `
      <div class="px-6 py-12 text-center animate-scale-in">
        <i class="uil uil-inbox text-6xl text-gray-300 dark:text-neutral-300 mb-4"></i>
        <p class="text-gray-500 dark:text-neutral-200 text-lg font-medium">No items found</p>
        <p class="text-gray-400 dark:text-neutral-100 text-sm mt-2">Try adjusting your filters</p>
      </div>
    `;
    return;
  }

  itemsList.innerHTML = filteredItems
    .map(
      (item, index) => `
      <div class="item-row item-enter group px-6 py-5 hover:bg-gray-50 dark:hover:bg-neutral-900/50 transition-colors flex items-center gap-4 relative" style="animation-delay: ${
        index * 0.05
      }s">
          <input 
              type="checkbox" 
              class="item-checkbox w-5 h-5 appearance-none border-2 border-gray-300 rounded-md checked:bg-[#01AF78] checked:border-[#01AF78] focus:ring-2 focus:ring-emerald-100 focus:ring-offset-0 transition-all cursor-pointer bg-[length:10px_10px] bg-center bg-no-repeat checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOSIgdmlld0JveD0iMCAwIDEyIDkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgNEw0LjUgNy41TDExIDEiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')]" 
              data-id="${item.id}">
          <div class="w-12 h-12 rounded-lg ${getIconColor(
            item.type
          )} flex items-center justify-center transform transition-transform group-hover:scale-110">
              ${getIcon(item.type)}
          </div>
          <div class="flex-1">
              <h4 class="text-sm font-medium text-gray-900 dark:text-neutral-300">${item.title}</h4>
              <div class="flex items-center gap-3 mt-1">
                  ${getBadge(item.type)}
                  <span class="flex items-center gap-1 text-xs text-gray-500">
                      <i class="uil uil-clock"></i>
                      ${item.time}
                  </span>
              </div>
          </div>
          
          <div class="action-buttons opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2">
              <button 
                  class="restore-btn px-4 py-2 border border-[#01AF78] text-[#01AF78] text-xs font-medium rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/60 flex items-center gap-2 transition-all transform hover:scale-105"
                  data-id="${item.id}">
                  <i class="uil uil-redo text-sm"></i>
                  Restore
              </button>
              <button 
                  class="delete-btn px-4 py-2 border border-red-500 text-red-500 text-xs font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/60 flex items-center gap-2 transition-all transform hover:scale-105"
                  data-id="${item.id}">
                  <i class="uil uil-trash-alt text-sm"></i>
                  Delete
              </button>
          </div>
      </div>
  `
    )
    .join("");

  attachCheckboxListeners();
  attachActionButtonListeners();
}

function attachActionButtonListeners() {
  const restoreButtons = document.querySelectorAll(".restore-btn");
  restoreButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      const item = allItems.find((i) => i.id === id);
      if (item) showRestoreModal([item]);
    });
  });

  const deleteButtons = document.querySelectorAll(".delete-btn");
  deleteButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      const item = allItems.find((i) => i.id === id);
      if (item) showDeleteModal([item]);
    });
  });
}

function attachCheckboxListeners() {
  const checkboxes = document.querySelectorAll(".item-checkbox");
  checkboxes.forEach((cb) => {
    cb.addEventListener("change", updateActionBar);
  });
}

function updateActionBar() {
  const checkboxes = document.querySelectorAll(".item-checkbox");
  const checkedBoxes = document.querySelectorAll(".item-checkbox:checked");
  const count = checkedBoxes.length;

  selectedCount.textContent = count;

  if (count > 0) {
    if (actionBar.classList.contains("hidden")) {
      actionBar.classList.remove("hidden");
      void actionBar.offsetWidth;
      actionBar.classList.add("slide-up");
    }
  } else {
    actionBar.classList.remove("slide-up");
    actionBar.classList.add("slide-down");

    setTimeout(() => {
      actionBar.classList.add("hidden");
      actionBar.classList.remove("slide-down");
    }, 300);
  }

  selectAllCheckbox.checked =
    checkboxes.length > 0 && count === checkboxes.length;
}

function updateTabIndicator() {
  const activeTab = document.querySelector(
    `.tab-btn[data-tab="${currentTab}"]`
  );
  if (activeTab) {
    const { offsetLeft, offsetWidth } = activeTab;
    tabIndicator.style.left = `${offsetLeft}px`;
    tabIndicator.style.width = `${offsetWidth}px`;
  }
}

function updateTabCounts() {
  const counts = {
    all: allItems.length,
    incidents: allItems.filter((i) => i.type === "incident").length,
    users: allItems.filter((i) => i.type === "user").length,
    devices: allItems.filter((i) => i.type === "device").length,
  };

  tabButtons.forEach((btn) => {
    const tab = btn.dataset.tab;
    const countSpan = btn.querySelector(".tab-count");
    if (countSpan) {
      countSpan.textContent = counts[tab];
    }
  });
}

function updateTabStyles() {
  tabButtons.forEach((btn) => {
    const isActive = btn.dataset.tab === currentTab;
    const countSpan = btn.querySelector(".tab-count");

    if (isActive) {
      btn.classList.add("text-gray-900", "dark:text-neutral-300");
      btn.classList.remove("text-gray-600", "dark:text-neutral-500");
      countSpan.classList.add("bg-[#01AF78]", "text-white", "dark:bg-[#01AF78]", "dark:text-white");
      countSpan.classList.remove("bg-gray-300", "text-gray-700", "dark:bg-neutral-700", "dark:text-neutral-400");
    } else {
      btn.classList.add("text-gray-600", "dark:text-neutral-500");
      btn.classList.remove("text-gray-900", "dark:text-neutral-300");
      countSpan.classList.add("bg-gray-300", "text-gray-700", "dark:bg-neutral-700", "dark:text-neutral-400");
      countSpan.classList.remove("bg-[#01AF78]", "text-white", "dark:bg-[#01AF78]", "dark:text-white");
    }
  });

  updateTabIndicator();
}

// Search functionality with debounce
let searchTimeout;
searchInput.addEventListener("input", (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const query = e.target.value.toLowerCase();

    if (query === "") {
      filterItems(currentTab, true);
    } else {
      filteredItems = allItems.filter((item) =>
        item.title.toLowerCase().includes(query)
      );
      showLoadingSkeleton();
      setTimeout(() => {
        renderItems();
      }, 300);
    }
  }, 300);
});

// Tab switching
tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (currentTab !== btn.dataset.tab && !isLoading) {
      currentTab = btn.dataset.tab;
      updateTabStyles();
      filterItems(currentTab);
    }
  });
});

// Select all functionality
selectAllCheckbox.addEventListener("change", (e) => {
  const checkboxes = document.querySelectorAll(".item-checkbox");
  checkboxes.forEach((cb) => {
    cb.checked = e.target.checked;
  });
  updateActionBar();
});

// MODAL FUNCTIONS USING MODALMANAGER
function showRestoreModal(items) {
  const itemText = items.length === 1 ? items[0].title : `${items.length} items`;

  modalManager.create({
    id: 'restoreModal',
    icon: 'uil-redo',
    iconColor: 'text-[#01AF78]',
    iconBg: 'bg-emerald-50',
    title: 'Restore from Archive',
    subtitle: 'Item will be restored to its original location.',
    body: `
      <p class="text-xs text-gray-600 dark:text-neutral-300 text-center leading-relaxed">
        Are you sure you want to restore
        <span class="font-semibold text-[#01AF78]">${itemText}</span>?
        ${items.length === 1 ? 'This item' : 'These items'} will be moved back from the archive.
      </p>
    `,
    primaryButton: {
      text: 'Restore',
      icon: 'uil-redo',
      class: 'bg-[#01AF78] hover:bg-[#00965F]'
    },
    secondaryButton: {
      text: 'Cancel'
    },
    onPrimary: () => {
      confirmRestore(items);
    }
  });

  modalManager.show('restoreModal');
}

function showDeleteModal(items) {
  const itemText = items.length === 1 ? items[0].title : `${items.length} items`;

  modalManager.create({
    id: 'deleteModal',
    icon: 'uil-trash-alt',
    iconColor: 'text-red-600',
    iconBg: 'bg-red-50',
    title: 'Delete Permanently',
    subtitle: 'This action cannot be undone.',
    body: `
      <p class="text-xs text-gray-600 dark:text-neutral-300 text-center leading-relaxed">
        Are you sure you want to permanently delete
        <span class="font-semibold text-red-600">${itemText}</span>?
        ${items.length === 1 ? 'This item' : 'These items'} will be removed forever and cannot be recovered.
      </p>
    `,
    primaryButton: {
      text: 'Delete Forever',
      icon: 'uil-trash-alt',
      class: 'bg-red-500 hover:bg-red-600'
    },
    secondaryButton: {
      text: 'Cancel'
    },
    onPrimary: () => {
      confirmDelete(items);
    }
  });

  modalManager.show('deleteModal');
}

function showEmptyArchiveModal() {
  const totalItems = allItems.length;

  modalManager.create({
    id: 'emptyArchiveModal',
    icon: 'uil-trash-alt',
    iconColor: 'text-red-600',
    iconBg: 'bg-red-50',
    title: 'Empty Archive',
    subtitle: 'This will permanently delete all archived items.',
    showWarning: true,
    warningText: `All <strong>${totalItems}</strong> ${totalItems === 1 ? 'item' : 'items'} in the archive will be permanently deleted and cannot be recovered.`,
    body: `
      <p class="text-xs text-gray-600 dark:text-neutral-300 text-center leading-relaxed">
        Are you absolutely sure you want to empty the entire archive?
      </p>
    `,
    primaryButton: {
      text: 'Empty Archive',
      icon: 'uil-trash-alt',
      class: 'bg-red-500 hover:bg-red-600'
    },
    secondaryButton: {
      text: 'Cancel'
    },
    onPrimary: () => {
      confirmEmptyArchive(totalItems);
    }
  });

  modalManager.show('emptyArchiveModal');
}

function confirmRestore(items) {
  if (!items || items.length === 0) return;

  // Store item info
  const itemCount = items.length;
  const itemText = itemCount === 1 ? items[0].title : `${itemCount} items`;

  // Get IDs to remove
  const idsToRemove = items.map((item) => item.id);

  // Close modal
  modalManager.close('restoreModal');

  // Add exit animation for all items
  idsToRemove.forEach((id) => {
    const checkbox = document.querySelector(`.item-checkbox[data-id="${id}"]`);
    if (checkbox) {
      const row = checkbox.closest(".item-row");
      row.classList.add("item-exit");
    }
  });

  setTimeout(() => {
    // Remove from allItems
    idsToRemove.forEach((id) => {
      const index = allItems.findIndex((item) => item.id === id);
      if (index !== -1) {
        allItems.splice(index, 1);
      }
    });

    // Re-filter and update
    filterItems(currentTab, true);
    updateActionBar();
    updateTabCounts();
    
    // Show success toast
    showToast('success', `${itemText} restored successfully!`);
  }, 300);
}

function confirmDelete(items) {
  if (!items || items.length === 0) return;

  // Store item info
  const itemCount = items.length;
  const itemText = itemCount === 1 ? items[0].title : `${itemCount} items`;

  // Get IDs to remove
  const idsToRemove = items.map((item) => item.id);

  // Close modal
  modalManager.close('deleteModal');

  // Add exit animation for all items
  idsToRemove.forEach((id) => {
    const checkbox = document.querySelector(`.item-checkbox[data-id="${id}"]`);
    if (checkbox) {
      const row = checkbox.closest(".item-row");
      row.classList.add("item-exit");
    }
  });

  setTimeout(() => {
    // Remove from allItems
    idsToRemove.forEach((id) => {
      const index = allItems.findIndex((item) => item.id === id);
      if (index !== -1) {
        allItems.splice(index, 1);
      }
    });

    // Re-filter and update
    filterItems(currentTab, true);
    updateActionBar();
    updateTabCounts();
    
    // Show success toast
    showToast('success', `${itemText} deleted permanently!`);
  }, 300);
}

function confirmEmptyArchive(totalCount) {
  if (allItems.length === 0) return;

  // Close modal
  modalManager.close('emptyArchiveModal');

  // Add exit animation for all visible items
  const allRows = document.querySelectorAll(".item-row");
  allRows.forEach((row) => {
    row.classList.add("item-exit");
  });

  setTimeout(() => {
    // Clear all items
    allItems.splice(0, allItems.length);
    
    // Re-filter and update
    filterItems(currentTab, true);
    updateActionBar();
    updateTabCounts();
    
    // Show success toast
    showToast('success', `Archive emptied! ${totalCount} items deleted permanently.`);
  }, 300);
}

// Action buttons
document.getElementById("restoreBtn").addEventListener("click", () => {
  const checkedBoxes = document.querySelectorAll(".item-checkbox:checked");
  const items = Array.from(checkedBoxes).map((cb) => {
    const id = parseInt(cb.dataset.id);
    return allItems.find((i) => i.id === id);
  }).filter(Boolean);

  if (items.length > 0) {
    showRestoreModal(items);
  }
});

document.getElementById("deleteBtn").addEventListener("click", () => {
  const checkedBoxes = document.querySelectorAll(".item-checkbox:checked");
  const items = Array.from(checkedBoxes).map((cb) => {
    const id = parseInt(cb.dataset.id);
    return allItems.find((i) => i.id === id);
  }).filter(Boolean);

  if (items.length > 0) {
    showDeleteModal(items);
  }
});

// Restore All button (from filter controls)
const restoreAllBtn = document.querySelector('button:has(.uil-sync)');
if (restoreAllBtn) {
  restoreAllBtn.addEventListener("click", () => {
    if (filteredItems.length === 0) {
      showToast('info', 'No items to restore');
      return;
    }
    showRestoreModal([...filteredItems]);
  });
}

// Empty Archive button (from filter controls)
const emptyArchiveBtn = document.querySelector('button:has(.uil-trash-alt)');
if (emptyArchiveBtn) {
  emptyArchiveBtn.addEventListener("click", () => {
    if (allItems.length === 0) {
      showToast('info', 'Archive is already empty');
      return;
    }
    showEmptyArchiveModal();
  });
}

// Initialize on page load
window.addEventListener("DOMContentLoaded", () => {
  initPageAnimations();
  updateTabStyles();
  updateTabIndicator();

  // Show items container after slight delay for better animation
  itemsContainer.classList.add("animate-fade-in-up", "stagger-4");

  // Simulate loading initial data
  showLoadingSkeleton();
  setTimeout(() => {
    renderItems();
  }, 800);
});