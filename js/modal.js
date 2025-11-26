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
      onPrimary,
      onSecondary,
      showWarning = false,
      warningText = ''
    } = config;

    // Remove existing modal if it exists
    this.destroy(id);

    const modalHTML = `
      <!-- Modal Overlay -->
      <div
        id="${id}Overlay"
        class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 opacity-0"
      ></div>

      <!-- Modal -->
      <div
        id="${id}"
        class="hidden fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-2xl z-[999] w-full max-w-lg transition-all duration-300 opacity-0 scale-95"
      >
        <!-- Modal Header -->
        <div class="flex items-center justify-between p-6 pb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center">
              <i class="uil ${icon} text-2xl ${iconColor}"></i>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-gray-800">${title}</h3>
              ${subtitle ? `<p class="text-xs text-gray-500 mt-0.5">${subtitle}</p>` : ''}
            </div>
          </div>
        </div>

        <!-- Modal Body -->
        <div class="px-6 py-4">
          ${showWarning ? `
            <div class="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <div class="flex items-start gap-3">
                <i class="uil uil-exclamation-triangle text-red-600 text-xl mt-0.5"></i>
                <div>
                  <p class="text-xs font-semibold text-red-800 mb-1">Warning: This action cannot be undone!</p>
                  <p class="text-xs text-red-700">${warningText}</p>
                </div>
              </div>
            </div>
          ` : ''}
          <div id="${id}Body" class="modal-body">
            ${body}
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex items-center gap-3 p-6 pt-4">
          ${secondaryButton ? `
            <button
              id="${id}SecondaryBtn"
              class="flex-1 px-4 py-3.5 min-h-[45px] text-xs font-medium text-[#64748B] bg-white border border-[#96A9C4] rounded-full hover:bg-gray-200 transition-colors"
            >
              ${secondaryButton.text}
            </button>
          ` : ''}
          ${primaryButton ? `
            <button
              id="${id}PrimaryBtn"
              class="flex-1 px-4 py-3.5 max-h-[45px] text-xs font-medium text-white rounded-full transition-colors flex items-center justify-center gap-2 ${primaryButton.class || 'bg-[#01AF78] hover:bg-[#00965F]'}"
            >
              ${primaryButton.icon ? `<i class="uil ${primaryButton.icon} text-lg"></i>` : ''}
              ${primaryButton.text}
            </button>
          ` : ''}
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
      onSecondary
    });

    // Attach event listeners
    this.attachEventListeners(id);

    return id;
  }

  attachEventListeners(id) {
    const modalData = this.modals.get(id);
    if (!modalData) return;

    const { overlay, onPrimary, onSecondary } = modalData;

    // Close on overlay click
    overlay.addEventListener('click', () => this.close(id));

    // Primary button
    const primaryBtn = document.getElementById(`${id}PrimaryBtn`);
    if (primaryBtn && onPrimary) {
      primaryBtn.addEventListener('click', () => {
        onPrimary();
      });
    }

    // Secondary button
    const secondaryBtn = document.getElementById(`${id}SecondaryBtn`);
    if (secondaryBtn) {
      secondaryBtn.addEventListener('click', () => {
        if (onSecondary) {
          onSecondary();
        } else {
          this.close(id);
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
    if (bodyElement) {
      bodyElement.innerHTML = content;
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