const allItems = [
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

      const itemsContainer = document.getElementById("itemsContainer");
      const itemsList = document.getElementById("itemsList");
      const actionBar = document.getElementById("actionBar");
      const selectedCount = document.getElementById("selectedCount");
      const selectAllCheckbox = document.getElementById("selectAll");
      const tabButtons = document.querySelectorAll(".tab-btn");
      const tabIndicator = document.getElementById("tabIndicator");

      const tabOrder = ["all", "incidents", "users", "devices"];

      function getIconColor(type) {
        return {
          incident: "bg-red-100",
          user: "bg-blue-100",
          device: "bg-green-100",
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
          return '<span class="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">INCIDENT</span>';
        } else if (type === "user") {
          return '<span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">USER</span>';
        } else {
          return '<span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">DEVICE</span>';
        }
      }

      function filterItems(tab) {
        const currentTabIndex = tabOrder.indexOf(tab);
        const isMovingRight = currentTabIndex > previousTabIndex;

        // Determine animation direction based on tab position
        const slideOutClass = isMovingRight
          ? "slide-out-left"
          : "slide-out-right";
        const slideInClass = isMovingRight ? "slide-in-right" : "slide-in-left";

        // Add slide out animation to entire container
        itemsContainer.classList.add(slideOutClass);

        setTimeout(() => {
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

          // Add slide in animation to entire container
          itemsContainer.classList.remove(slideOutClass);
          itemsContainer.classList.add(slideInClass);

          setTimeout(() => {
            itemsContainer.classList.remove(slideInClass);
          }, 250);

          updateActionBar();
          previousTabIndex = currentTabIndex;
        }, 250);
      }

      function updateTabStyles() {
        tabButtons.forEach((btn) => {
          const isActive = btn.dataset.tab === currentTab;
          const countSpan = btn.querySelector(".tab-count");

          if (isActive) {
            btn.classList.add("text-gray-900", "border-slate-900");
            btn.classList.remove("text-gray-600", "border-transparent");
            countSpan.classList.add("bg-[#01AF78]", "text-white");
            countSpan.classList.remove("bg-gray-300", "text-gray-700");
          } else {
            btn.classList.add("text-gray-600", "border-transparent");
            btn.classList.remove("text-gray-900", "border-slate-900");
            countSpan.classList.add("bg-gray-300", "text-gray-700");
            countSpan.classList.remove("bg-green-500", "text-white");
          }
        });
      }

      function renderItems() {
        if (filteredItems.length === 0) {
          itemsList.innerHTML =
            '<div class="px-6 py-12 text-center text-gray-500">No items found</div>';
          return;
        }

        itemsList.innerHTML = filteredItems
          .map(
            (item) => `
          <div class="item-row group px-6 py-5 hover:bg-gray-50 transition-colors flex items-center gap-4 relative">
              <input 
                  type="checkbox" 
                  class="item-checkbox w-5 h-5 appearance-none border-2 border-gray-300 rounded-md checked:bg-[#01AF78] checked:border-[#01AF78] focus:ring-2 focus:ring-emerald-100 focus:ring-offset-0 transition-all cursor-pointer bg-[length:10px_10px] bg-center bg-no-repeat checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOSIgdmlld0JveD0iMCAwIDEyIDkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgNEw0LjUgNy41TDExIDEiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')]" 
                  data-id="${item.id}">
              <div class="w-12 h-12 rounded-lg ${getIconColor(
                item.type
              )} flex items-center justify-center">
                  ${getIcon(item.type)}
              </div>
              <div class="flex-1">
                  <h4 class="text-sm font-medium text-gray-900">${
                    item.title
                  }</h4>
                  <div class="flex items-center gap-3 mt-1">
                      ${getBadge(item.type)}
                      <span class="flex items-center gap-1 text-xs text-gray-500">
                          <i class="uil uil-clock"></i>
                          ${item.time}
                      </span>
                  </div>
              </div>
              
              <!-- Hover Action Buttons -->
              <div class="action-buttons opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2">
                  <button 
                      class="restore-btn px-4 py-2 border border-[#01AF78] text-[#01AF78] text-xs font-medium rounded-lg hover:bg-emerald-50 flex items-center gap-2 transition-all ease-in duration-200"
                      data-id="${item.id}">
                      <i class="uil uil-redo text-sm"></i>
                      Restore
                  </button>
                  <button 
                      class="delete-btn px-4 py-2 border border-red-500 text-red-500 text-xs font-medium rounded-lg hover:bg-red-50 flex items-center gap-2 transition-all"
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
        // Restore buttons
        const restoreButtons = document.querySelectorAll(".restore-btn");
        restoreButtons.forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const item = allItems.find((i) => i.id == id);
            alert(`Restoring: ${item.title}`);
            // Add your restore logic here
          });
        });

        // Delete buttons
        const deleteButtons = document.querySelectorAll(".delete-btn");
        deleteButtons.forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const item = allItems.find((i) => i.id == id);
            if (
              confirm(
                `Are you sure you want to permanently delete "${item.title}"?`
              )
            ) {
              alert(`Deleting: ${item.title}`);
              // Add your delete logic here
            }
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
        const checkedBoxes = document.querySelectorAll(
          ".item-checkbox:checked"
        );
        const count = checkedBoxes.length;

        selectedCount.textContent = count;

        if (count > 0) {
          if (actionBar.classList.contains("hidden")) {
            actionBar.classList.remove("hidden");
            // Force reflow to restart animation
            void actionBar.offsetWidth;
            actionBar.classList.add("slide-up");
          }
        } else {
          // Remove slide-up and add slide-down
          actionBar.classList.remove("slide-up");
          actionBar.classList.add("slide-down");

          // Wait for animation to finish before hiding
          setTimeout(() => {
            actionBar.classList.add("hidden");
            actionBar.classList.remove("slide-down");
          }, 300); // Match animation duration (0.3s = 300ms)
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

      function updateTabStyles() {
        tabButtons.forEach((btn) => {
          const isActive = btn.dataset.tab === currentTab;
          const countSpan = btn.querySelector(".tab-count");

          if (isActive) {
            btn.classList.add("text-gray-900");
            btn.classList.remove("text-gray-600");
            countSpan.classList.add("bg-[#01AF78]", "text-white");
            countSpan.classList.remove("bg-gray-300", "text-gray-700");
          } else {
            btn.classList.add("text-gray-600");
            btn.classList.remove("text-gray-900");
            countSpan.classList.add("bg-gray-300", "text-gray-700");
            countSpan.classList.remove("bg-[#01AF78]", "text-white");
          }
        });

        updateTabIndicator();
      }

      // Tab switching with animation
      tabButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          if (currentTab !== btn.dataset.tab) {
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

      // Action buttons
      document.getElementById("restoreBtn").addEventListener("click", () => {
        const checkedBoxes = document.querySelectorAll(
          ".item-checkbox:checked"
        );
        const ids = Array.from(checkedBoxes).map((cb) => cb.dataset.id);
        alert(`Restoring items: ${ids.join(", ")}`);
      });

      document.getElementById("deleteBtn").addEventListener("click", () => {
        if (
          confirm(
            "Are you sure you want to permanently delete the selected items?"
          )
        ) {
          const checkedBoxes = document.querySelectorAll(
            ".item-checkbox:checked"
          );
          const ids = Array.from(checkedBoxes).map((cb) => cb.dataset.id);
          alert(`Deleting items: ${ids.join(", ")}`);
        }
      });

      // Initialize
      updateTabStyles();
      updateTabIndicator();
      renderItems();