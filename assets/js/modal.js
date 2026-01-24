// Modal Template System
class ModalManager {
  constructor() {
    this.modals = new Map();
    this.initializeContainer();
  }

  initializeContainer() {
    if (!document.getElementById('modalContainer')) {
      const container = document.createElement('div');
      container.id = 'modalContainer';
      document.body.appendChild(container);
    }
  }

  create(config) {
    const {
      id,
      icon,
      iconColor,
      iconBg,
      title,
      subtitle,
      body,
      primaryButton,
      secondaryButton,
      tertiaryButton, // NEW: Add tertiary button config
      onPrimary,
      onSecondary,
      onTertiary, // NEW: Add tertiary callback
      showWarning = false,
      warningText = ''
    } = config;

    // Remove existing modal if it exists
    this.destroy(id);

    const modalHTML = `
      <!-- Modal Overlay -->
      <div
        id="${id}Overlay"
        class="hidden fixed inset-0 bg-black/40 dark:bg-black/60 z-50 transition-opacity duration-300 opacity-0"
      ></div>

      <!-- Modal -->
      <div
        id="${id}"
        class="hidden fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
               bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl z-[9999] 
               w-full max-w-lg transition-all duration-300 opacity-0 scale-95"
      >
        <!-- Modal Header -->
        <div class="flex items-center justify-between p-6 pb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center">
              <i class="uil ${icon} text-2xl ${iconColor}"></i>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-gray-800 dark:text-white">${title}</h3>
              ${
                subtitle
                  ? `<p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">${subtitle}</p>`
                  : ''
              }
            </div>
          </div>
        </div>

        <!-- Modal Body -->
        <div class="px-6 py-4">
          ${
            showWarning
              ? `
            <div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-4 mb-4">
              <div class="flex items-start gap-3">
                <i class="uil uil-exclamation-triangle text-red-600 dark:text-red-400 text-xl mt-0.5"></i>
                <div>
                  <p class="text-xs font-semibold text-red-800 dark:text-red-300 mb-1">
                    Warning: This action cannot be undone!
                  </p>
                  <p class="text-xs text-red-700 dark:text-red-400">${warningText}</p>
                </div>
              </div>
            </div>
          `
              : ''
          }

          <div id="${id}Body" class="modal-body text-gray-700 dark:text-neutral-300">
            ${body}
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex items-center gap-3 p-6 pt-4">
          
          ${
            tertiaryButton
              ? `
            <button
              id="${id}TertiaryBtn"
              class="flex-1 px-4 py-3.5 min-h-[45px] text-xs font-medium 
                     rounded-full transition-colors flex items-center justify-center gap-2
                     ${tertiaryButton.hidden ? 'hidden' : ''}
                     ${tertiaryButton.class || 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600'}"
            >
              ${
                tertiaryButton.icon
                  ? `<i class="uil ${tertiaryButton.icon} text-lg"></i>`
                  : ''
              }
              ${tertiaryButton.text}
            </button>
          `
              : ''
          }

          ${
            secondaryButton
              ? `
            <button
              id="${id}SecondaryBtn"
              class="flex-1 px-4 py-3.5 min-h-[45px] text-xs font-medium 
                     text-gray-600 dark:text-gray-300 
                     bg-white dark:bg-neutral-700 
                     border border-neutral-600 dark:border-neutral-600 
                     rounded-full hover:bg-gray-100 dark:hover:bg-neutral-600 transition-colors"
            >
              ${secondaryButton.text}
            </button>
          `
              : ''
          }

          ${
            primaryButton
              ? `
            <button
              id="${id}PrimaryBtn"
              class="flex-1 px-4 py-3.5 max-h-[45px] text-xs font-medium text-white 
                     rounded-full transition-colors flex items-center justify-center gap-2 
                     ${primaryButton.class || 'bg-[#01AF78] hover:bg-[#00965F] dark:bg-[#01AF78]/90 dark:hover:bg-[#01AF78]'}"
            >
              ${
                primaryButton.icon
                  ? `<i class="uil ${primaryButton.icon} text-lg"></i>`
                  : ''
              }
              ${primaryButton.text}
            </button>
          `
              : ''
          }

        </div>
      </div>
    `;

    // Insert into container
    const container = document.getElementById('modalContainer');
    const modalWrapper = document.createElement('div');
    modalWrapper.innerHTML = modalHTML;
    container.appendChild(modalWrapper);

    // Store modal data
    this.modals.set(id, {
      element: document.getElementById(id),
      overlay: document.getElementById(`${id}Overlay`),
      onPrimary,
      onSecondary,
      onTertiary // NEW: Store tertiary callback
    });

    this.attachEventListeners(id);

    return id;
  }

  attachEventListeners(id) {
    const modalData = this.modals.get(id);
    if (!modalData) return;

    const { overlay, onPrimary, onSecondary, onTertiary } = modalData;

    overlay.addEventListener('click', () => this.close(id));

    const primaryBtn = document.getElementById(`${id}PrimaryBtn`);
    if (primaryBtn && onPrimary) {
      primaryBtn.addEventListener('click', async () => {
        // Automatically handle loading state for async callbacks
        this.setButtonLoading(id, 'primary', true);
        
        try {
          const result = onPrimary();
          
          // If callback returns a promise, wait for it
          if (result instanceof Promise) {
            await result;
          }
          
          // Auto-close modal on success (unless callback explicitly returns false)
          if (result !== false) {
            this.close(id);
          }
        } catch (error) {
          console.error('Modal primary action error:', error);
          // Keep modal open on error and restore button
          this.setButtonLoading(id, 'primary', false);
        }
      });
    }

    const secondaryBtn = document.getElementById(`${id}SecondaryBtn`);
    if (secondaryBtn) {
      secondaryBtn.addEventListener('click', async () => {
        if (onSecondary) {
          this.setButtonLoading(id, 'secondary', true);
          
          try {
            const result = onSecondary();
            
            if (result instanceof Promise) {
              await result;
            }
            
            if (result !== false) {
              this.close(id);
            }
          } catch (error) {
            console.error('Modal secondary action error:', error);
            this.setButtonLoading(id, 'secondary', false);
          }
        } else {
          this.close(id);
        }
      });
    }

    // NEW: Attach tertiary button listener
    const tertiaryBtn = document.getElementById(`${id}TertiaryBtn`);
    if (tertiaryBtn && onTertiary) {
      tertiaryBtn.addEventListener('click', async () => {
        this.setButtonLoading(id, 'tertiary', true);
        
        try {
          const result = onTertiary();
          
          if (result instanceof Promise) {
            await result;
          }
          
          if (result !== false) {
            this.close(id);
          }
        } catch (error) {
          console.error('Modal tertiary action error:', error);
          this.setButtonLoading(id, 'tertiary', false);
        }
      });
    }
  }

  show(id) {
    const modalData = this.modals.get(id);
    if (!modalData) return;

    const { element, overlay } = modalData;

    overlay.classList.remove('hidden');
    element.classList.remove('hidden');

    setTimeout(() => {
      overlay.classList.remove('opacity-0');
      overlay.classList.add('opacity-100');
      element.classList.remove('opacity-0', 'scale-95');
      element.classList.add('opacity-100', 'scale-100');
    }, 10);
  }

  close(id) {
    const modalData = this.modals.get(id);
    if (!modalData) return;

    const { element, overlay } = modalData;

    overlay.classList.remove('opacity-100');
    overlay.classList.add('opacity-0');
    element.classList.remove('opacity-100', 'scale-100');
    element.classList.add('opacity-0', 'scale-95');

    setTimeout(() => {
      element.classList.add('hidden');
      overlay.classList.add('hidden');
    }, 300);
  }

  updateBody(id, content) {
    const bodyElement = document.getElementById(`${id}Body`);
    if (bodyElement) bodyElement.innerHTML = content;
  }

  // Set button loading state
  setButtonLoading(id, buttonType, isLoading) {
    const btnId = `${id}${buttonType.charAt(0).toUpperCase() + buttonType.slice(1)}Btn`;
    const button = document.getElementById(btnId);
    
    if (!button) return;
    
    if (isLoading) {
      button.disabled = true;
      button.classList.add('opacity-60', 'cursor-not-allowed', 'pointer-events-none');
      
      // Store original content
      button.dataset.originalContent = button.innerHTML;
      
      // Show loading spinner
      button.innerHTML = `
        <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Processing...</span>
      `;
    } else {
      button.disabled = false;
      button.classList.remove('opacity-60', 'cursor-not-allowed', 'pointer-events-none');
      
      // Restore original content
      if (button.dataset.originalContent) {
        button.innerHTML = button.dataset.originalContent;
        delete button.dataset.originalContent;
      }
    }
  }

  // NEW: Method to show tertiary button
  showTertiaryButton(id) {
    const tertiaryBtn = document.getElementById(`${id}TertiaryBtn`);
    if (tertiaryBtn) {
      tertiaryBtn.classList.remove('hidden');
    }
  }

  // NEW: Method to hide tertiary button
  hideTertiaryButton(id) {
    const tertiaryBtn = document.getElementById(`${id}TertiaryBtn`);
    if (tertiaryBtn) {
      tertiaryBtn.classList.add('hidden');
    }
  }

  destroy(id) {
    const modalData = this.modals.get(id);
    if (!modalData) return;

    const { element, overlay } = modalData;
    element?.remove();
    overlay?.remove();
    this.modals.delete(id);
  }

  destroyAll() {
    this.modals.forEach((_, id) => this.destroy(id));
  }
}

// Initialize global modal manager
const modalManager = new ModalManager();