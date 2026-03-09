// ── Avatar Crop via modalManager ───────────────────────────────────────────
// Load AFTER modal.js. Requires Cropper.js CDN in <head>.

let cropperInstance = null;

document.getElementById('avatarInput').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showToast('error', 'Please select an image file.');
        e.target.value = '';
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showToast('error', 'File too large. Max 10 MB.');
        e.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = ev => openCropModal(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
});

function openCropModal(imageSrc) {
    if (cropperInstance) {
        cropperInstance.destroy();
        cropperInstance = null;
    }

    modalManager.create({
        id: 'avatarCropModal',
        icon: 'uil-crop-alt',
        iconColor: 'text-emerald-500 dark:text-emerald-400',
        iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
        title: 'Crop Profile Photo',
        subtitle: 'Drag to reposition · Scroll or pinch to zoom',
        body: `
            <div class="w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-neutral-900" style="max-height:300px;">
                <img id="cropImage" src="${imageSrc}" alt="Crop" class="block max-w-full" />
            </div>
            <div class="flex items-center gap-3 mt-4">
                <i class="uil uil-search-minus text-slate-400 dark:text-slate-500 text-base flex-shrink-0"></i>
                <input
                    id="cropZoomSlider"
                    type="range" min="0.1" max="3" step="0.01" value="1"
                    class="flex-1 accent-[#27C291] h-1.5 rounded-full cursor-pointer"
                />
                <i class="uil uil-search-plus text-slate-400 dark:text-slate-500 text-base flex-shrink-0"></i>
            </div>
        `,
        primaryButton: { text: 'Apply & Upload', icon: 'uil-check' },
        secondaryButton: { text: 'Cancel' },

        onSecondary: () => {
            if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }
        },

        onPrimary: () => {
            return new Promise((resolve, reject) => {
                if (!cropperInstance) {
                    showToast('error', 'Cropper not ready, please wait.');
                    reject(new Error('No cropper'));
                    return;
                }

                const canvas = cropperInstance.getCroppedCanvas({
                    width: 400,
                    height: 400,
                    imageSmoothingEnabled: true,
                    imageSmoothingQuality: 'high',
                });

                if (!canvas) {
                    showToast('error', 'Could not process image.');
                    reject(new Error('getCroppedCanvas returned null'));
                    return;
                }

                // Optimistic local preview
                document.getElementById('avatarPreview').src = canvas.toDataURL('image/jpeg', 0.9);

                canvas.toBlob(async (blob) => {
                    if (!blob) {
                        showToast('error', 'Could not process image.');
                        reject(new Error('toBlob returned null'));
                        return;
                    }

                    const formData = new FormData();
                    formData.append('avatar', blob, 'avatar.jpg');

                    try {
                        const res  = await fetch('api/profile/upload-avatar.php', { method: 'POST', body: formData });
                        const data = await res.json();

                        if (data.success) {
                            const newUrl = data.data.profile_picture_url + '?t=' + Date.now();
                            document.getElementById('avatarPreview').src = newUrl;
                            currentUser.avatarUrl = newUrl;
                            showToast('success', 'Profile picture updated.');
                            cropperInstance.destroy();
                            cropperInstance = null;
                            resolve();
                        } else {
                            document.getElementById('avatarPreview').src = currentUser.avatarUrl;
                            showToast('error', data.message || 'Upload failed.');
                            reject(new Error(data.message));
                        }
                    } catch (err) {
                        document.getElementById('avatarPreview').src = currentUser.avatarUrl;
                        showToast('error', 'Something went wrong.');
                        reject(err);
                    }
                }, 'image/jpeg', 0.92);
            });
        },
    });

    modalManager.show('avatarCropModal');

    // Wait for modal animation (300ms) + a little buffer before init
    setTimeout(() => {
        const img = document.getElementById('cropImage');
        if (!img) return;
        if (img.complete && img.naturalWidth > 0) {
            initCropper(img);
        } else {
            img.onload = () => initCropper(img);
        }
    }, 350);
}

function initCropper(img) {
    if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }

    cropperInstance = new Cropper(img, {
        aspectRatio: 1,
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 0.85,
        restore: false,
        guides: true,
        center: true,
        highlight: false,
        cropBoxMovable: false,
        cropBoxResizable: false,
        toggleDragModeOnDblclick: false,
        ready() {
            const canvasData = cropperInstance.getCanvasData();
            const zoom = canvasData.width / canvasData.naturalWidth;
            const slider = document.getElementById('cropZoomSlider');
            if (slider) {
                slider.value = zoom;
                // Attach here so it's always bound to the live instance
                slider.addEventListener('input', function () {
                    if (cropperInstance) cropperInstance.zoomTo(parseFloat(this.value));
                });
            }
        },
        zoom(event) {
            const slider = document.getElementById('cropZoomSlider');
            if (slider) slider.value = event.detail.ratio;
        },
    });
}