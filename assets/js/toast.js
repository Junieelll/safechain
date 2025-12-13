let toastId = 0;

function showToast(type, message, duration = 5000) {
    const id = `toast-${toastId++}`;
    const container = document.getElementById('toastContainer');

    // Toast colors and icons
    const config = {
        success: {
            bg: 'bg-[#27C291]',
            iconColor: '#27C291',
            icon: 'uil-check'
        },
        error: {
            bg: 'bg-[#E4595C]',
            iconColor: '#E4595C',
            icon: 'uil-times'
        },
        info: {
            bg: 'bg-[#2563EB]',
            iconColor: '#2563EB',
            icon: 'uil-info'
        }
    };

    const { bg, iconColor, icon } = config[type] || config.info;

    // Create toast element
    const toast = document.createElement('div');
    toast.id = id;
    toast.className = `${bg} rounded-2xl shadow-lg p-4 flex items-center justify-between gap-3 toast-enter`;
    toast.innerHTML = `
        <div class="flex items-center gap-3 flex-1">
            <div class="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
                <!-- Outer Timer Circle (white stroke) -->
                <svg class="absolute w-12 h-12 transform -rotate-90">
                    <circle
                        cx="24"
                        cy="24"
                        r="22"
                        stroke="rgba(255, 255, 255, 0.3)"
                        stroke-width="4"
                        fill="none"
                    />
                    <circle
                        cx="24"
                        cy="24"
                        r="22"
                        stroke="white"
                        stroke-width="4"
                        fill="none"
                        stroke-dasharray="138"
                        stroke-dashoffset="0"
                        class="countdown-circle"
                        style="animation-duration: ${duration}ms;"
                    />
                </svg>
                
                <!-- Inner White Circle with Icon -->
                <div class="absolute w-7 h-7 bg-white rounded-full flex items-center justify-center">
                    <i class="${icon} text-xl" style="color: ${iconColor};"></i>
                </div>
            </div>
            <span class="text-white text-sm font-medium flex-1">${message}</span>
        </div>
        <button
            onclick="closeToast('${id}')"
            class="text-white hover:bg-white/10 rounded-lg p-1 transition-colors flex-shrink-0"
        >
            <i class="uil uil-times text-xl"></i>
        </button>
    `;

    container.appendChild(toast);

    // Auto remove after duration
    setTimeout(() => {
        closeToast(id);
    }, duration);
}

function closeToast(id) {
    const toast = document.getElementById(id);
    if (!toast) return;

    toast.classList.remove('toast-enter');
    toast.classList.add('toast-exit');

    setTimeout(() => {
        toast.remove();
    }, 300);
}

// Make functions global
window.showToast = showToast;
window.closeToast = closeToast;