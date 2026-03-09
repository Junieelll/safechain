// ── Avatar Crop via modalManager ───────────────────────────────────────────
// Place this script AFTER modal.js is loaded
// Requires: Cropper.js CDN (add to <head>)
//   <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.css" />
//   <script src="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.js"></script>

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

    // Reset so same file can be picked again
    e.target.value = '';
});

function openCropModal(imageSrc) {
    // Destroy any previous cropper instance
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

            <!-- Zoom slider -->
            <div class="flex items-center gap-3 mt-4">
                <i class="uil uil-search-minus text-slate-400 dark:text-slate-500 text-base flex-shrink-0"></i>
                <input
                    id="cropZoomSlider"
                    type="range" min="0.1" max="3" step="0.01" value="1"
                    oninput="cropperInstance && cropperInstance.zoomTo(parseFloat(this.value))"
                    class="flex-1 accent-[#27C291] h-1.5 rounded-full cursor-pointer"
                />
                <i class="uil uil-search-plus text-slate-400 dark:text-slate-500 text-base flex-shrink-0"></i>
            </div>
        `,
        primaryButton: {
            text: 'Apply & Upload',
            icon: 'uil-check',
        },
        secondaryButton: { text: 'Cancel' },

        onSecondary: () => {
            if (cropperInstance) {
                cropperInstance.destroy();
                cropperInstance = null;
            }
        },

        onPrimary: () => {
            // Return a Promise so modalManager shows loading spinner automatically
            return new Promise(async (resolve, reject) => {
                if (!cropperInstance) { reject(new Error('No cropper')); return; }

                // Get 400×400 cropped canvas
                const canvas = cropperInstance.getCroppedCanvas({
                    width: 400,
                    height: 400,
                    imageSmoothingEnabled: true,
                    imageSmoothingQuality: 'high',
                });

                // Optimistic local preview
                document.getElementById('avatarPreview').src = canvas.toDataURL('image/jpeg', 0.9);

                canvas.toBlob(async (blob) => {
                    const formData = new FormData();
                    formData.append('avatar', blob, 'avatar.jpg');

                    try {
                        const res  = await fetch('api/profile/upload-avatar.php', {
                            method: 'POST',
                            body: formData,
                        });
                        const data = await res.json();

                        if (data.success) {
                            const newUrl = data.data.profile_picture_url + '?t=' + Date.now();
                            document.getElementById('avatarPreview').src = newUrl;
                            currentUser.avatarUrl = newUrl;
                            showToast('success', 'Profile picture updated.');

                            cropperInstance.destroy();
                            cropperInstance = null;
                            resolve(); // closes modal + restores button
                        } else {
                            document.getElementById('avatarPreview').src = currentUser.avatarUrl;
                            showToast('error', data.message || 'Upload failed.');
                            reject(new Error(data.message)); // keeps modal open, restores button
                        }
                    } catch (err) {
                        document.getElementById('avatarPreview').src = currentUser.avatarUrl;
                        showToast('error', 'Something went wrong. Please try again.');
                        reject(err);
                    }
                }, 'image/jpeg', 0.92);
            });
        },
    });

    modalManager.show('avatarCropModal');

    // Init Cropper.js after the modal has rendered into the DOM
    requestAnimationFrame(() => {
        const img = document.getElementById('cropImage');
        if (!img) return;

        img.onload = () => initCropper(img);

        // If image is already loaded (cached), onload won't fire
        if (img.complete) initCropper(img);
    });
}

function initCropper(img) {
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
            if (slider) slider.value = zoom;
        },
        zoom(event) {
            const slider = document.getElementById('cropZoomSlider');
            if (slider) slider.value = event.detail.ratio;
        },
    });
}