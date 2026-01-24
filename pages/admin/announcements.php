<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SafeChain | Announcements</title>
    <base href="/safechain/" />
    <link rel="stylesheet" href="assets/unicons/line.css" />
    <script src="assets/js/tailwind/tailwind.min.js"></script>
    <link href="assets/css/font.css" rel="stylesheet" />
    <link rel="stylesheet" href="assets/css/sidebar.css" />
    <link rel="stylesheet" href="assets/css/toast.css" />
    <link rel="stylesheet" href="assets/css/page-load-animation.css" />
    <link rel="icon" type="image/x-icon" href="assets/img/logo.png">
    <script>
        tailwind.config = {
            darkMode: ["class", '[data-theme="dark"]'],
        };
    </script>
</head>

<body class="min-h-screen flex transition-all duration-300 dark:bg-neutral-900">
    <?php include $_SERVER['DOCUMENT_ROOT'] . '/safechain/includes/sidebar.php'; ?>

    <main id="mainContent" class="transition-all duration-500 ease-in-out ml-[302px] flex-1 p-8">
        <div class="w-full">
            <div class="max-w-[950px] mx-auto">
                <!-- Header -->
                <div class="mb-8">
                    <h1 class="text-2xl font-semibold text-gray-900 mb-1">Announcements</h1>
                    <p class="text-sm text-gray-500">Post an official announcement for the community</p>
                </div>

                <!-- Simple Collapsed Card (Default State) -->
                <div class="bg-white rounded-3xl p-4 mb-6 cursor-pointer transition-all duration-300 opacity-100 scale-100"
                    id="collapsedCard" onclick="expandPostCard()">
                    <div class="flex items-center gap-3">
                        <img src="https://ui-avatars.com/api/?name=Juan+Dela+Cruz&background=f97316&color=fff&size=128"
                            alt="Avatar" class="w-10 h-10 rounded-full object-cover flex-shrink-0">
                        <div class="flex-1 text-gray-500 flex justify-center gap-3">
                            <span class="bg-[#f5f5f5] py-4 px-3 rounded-xl text-xs w-full">Share an important update
                                with the community...</span>
                            <i class="uil uil-pen text-xl grid items-center"></i>
                        </div>
                    </div>
                </div>

                <!-- Expanded Card (Hidden by Default) -->
                <div class="bg-white rounded-3xl p-6 mb-6 hidden opacity-0 scale-95 transition-all duration-300"
                    id="expandedCard">
                    <div class="flex justify-between items-center mb-4">
                        <div class="text-sm font-semibold text-gray-900">Create a post</div>
                        <button type="button"
                            class="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
                            onclick="collapsePostCard()">
                            <i class="uil uil-times text-xl"></i>
                        </button>
                    </div>

                    <form id="announcementForm">
                        <textarea
                            class="w-full px-3.5 py-3 bg-[#f5f5f5] rounded-xl text-sm resize-none min-h-[100px] mb-4 text-gray-900 focus:outline-none transition-colors"
                            id="content" placeholder="Share an important update with the community..."></textarea>
                        <!-- Preview Container -->
                        <div id="previewContainer" class="mb-4"></div>

                        <!-- Link Input (hidden by default) -->
                        <input type="text" id="linkUrl"
                            class="hidden w-full px-3 py-2.5 rounded-md text-sm mb-4 bg-[#f5f5f5] focus:outline-none focus:bg-white transition-colors"
                            placeholder="https://example.com">

                        <div class="flex justify-between items-center">
                            <div class="flex gap-2">
                                <button type="button"
                                    class="flex items-center gap-1.5 px-3 py-2 bg-[#f5f5f5] rounded-full text-[13px] text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                    onclick="openMediaModal()">
                                    <i class="uil uil-image text-lg"></i>
                                    <span class="hidden sm:inline">Image</span>
                                </button>
                                <button type="button"
                                    class="flex items-center gap-1.5 px-3 py-2 bg-[#f5f5f5] rounded-full text-[13px] text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                    onclick="openMediaModal('video')">
                                    <i class="uil uil-video text-lg"></i>
                                    <span class="hidden sm:inline">Video</span>
                                </button>
                                <button type="button"
                                    class="flex items-center gap-1.5 px-3 py-2 bg-[#f5f5f5] rounded-full text-[13px] text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                    onclick="toggleLinkInput()">
                                    <i class="uil uil-link text-lg"></i>
                                    <span class="hidden sm:inline">Link</span>
                                </button>
                            </div>
                            <button type="submit" id="publishBtn"
                                class="bg-emerald-500 text-white px-6 py-2.5 flex gap-2 items-center justify-center rounded-full text-sm font-semibold hover:bg-emerald-600 transition-colors">
                                <i class="uil uil-message text-[17px]"></i>
                                Publish
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Announcements Feed -->
                <div class="flex flex-col gap-4" id="announcementsFeed">
                    <div class="text-center py-16 text-gray-400">
                        <i class="uil uil-spinner-alt animate-spin text-5xl mb-4 opacity-40"></i>
                        <p class="text-sm">Loading announcements...</p>
                    </div>
                </div>
            </div>

            <!-- Media Upload Modal -->
            <div class="fixed inset-0 bg-black/50 z-50 hidden items-center justify-center p-4" id="mediaModal">
                <div class="bg-white rounded-2xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto shadow-2xl">
                    <div class="flex justify-between items-center px-6 py-5 border-b border-gray-200">
                        <h2 class="text-lg font-semibold" id="mediaModalTitle">Upload Images</h2>
                        <button
                            class="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
                            onclick="closeMediaModal()">
                            <i class="uil uil-times text-2xl"></i>
                        </button>
                    </div>
                    <div class="p-6">
                        <!-- Upload Area -->
                        <div class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mb-4 hover:border-emerald-400 transition-colors cursor-pointer"
                            onclick="document.getElementById('mediaInput').click()">
                            <i class="uil uil-cloud-upload text-5xl text-gray-400 mb-3"></i>
                            <p class="text-gray-600 font-medium mb-1">Click to upload or drag and drop</p>
                            <p class="text-sm text-gray-500" id="mediaInputHint">PNG, JPG, GIF up to 10MB</p>
                            <input type="file" id="mediaInput" accept="image/*" multiple class="hidden"
                                onchange="handleMediaUpload(event)">
                        </div>

                        <!-- Preview Grid -->
                        <div id="mediaPreviewGrid" class="grid grid-cols-2 gap-3 mb-4"></div>

                        <button
                            class="w-full bg-emerald-500 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-emerald-600 transition-colors"
                            onclick="addMediaToPost()">Add to Post</button>
                    </div>
                </div>
            </div>
        </div>
        <div id="toastContainer" class="fixed top-4 right-4 z-50 space-y-3 max-w-md w-full"></div>
    </main>

    <script>
        // Base URL configuration - adjust this to match your project structure
        const BASE_URL = '/safechain/'; // Change this if your project is in a different folder

        let currentMediaFiles = []; // Store actual File objects
        let currentMediaPreviews = []; // Store preview data URLs
        let currentMediaType = 'image';

        // Format timestamp
        function formatTime(timestamp) {
            const date = new Date(timestamp);
            const now = new Date();
            const diff = Math.floor((now - date) / 1000);

            if (diff < 60) return 'Just now';
            if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
            if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;

            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        // Format number
        function formatNumber(num) {
            if (num >= 1000) {
                return (num / 1000).toFixed(1) + 'K';
            }
            return num.toString();
        }

        // Load announcements from database
        async function loadAnnouncements() {
            try {
                const response = await fetch('api/announcements/get.php');
                const data = await response.json();

                if (data.success) {
                    renderAnnouncements(data.announcements);
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                console.error('Error loading announcements:', error);
                document.getElementById('announcementsFeed').innerHTML = `
                    <div class="text-center py-16 text-red-400">
                        <i class="uil uil-exclamation-triangle text-5xl mb-4 opacity-40"></i>
                        <h3 class="text-xl font-semibold text-red-600 mb-2">Error loading announcements</h3>
                        <p class="text-sm">${error.message}</p>
                    </div>
                `;
            }
        }

        // Render announcements
        function renderAnnouncements(announcements) {
            const feed = document.getElementById('announcementsFeed');

            if (announcements.length === 0) {
                feed.innerHTML = `
                    <div class="text-center py-16 text-gray-400">
                        <i class="uil uil-megaphone text-5xl mb-4 opacity-40"></i>
                        <h3 class="text-xl font-semibold text-gray-600 mb-2">No announcements yet</h3>
                        <p class="text-sm">Be the first to share something with the community!</p>
                    </div>
                `;
                return;
            }

            feed.innerHTML = announcements.map(announcement => `
                <div class="bg-white rounded-3xl p-6 shadow-sm">
                    <div class="flex gap-3 mb-4">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(announcement.author_name)}&background=f97316&color=fff&size=128" 
                             alt="Avatar" class="w-10 h-10 rounded-full object-cover flex-shrink-0">
                        <div class="flex-1">
                            <div class="font-semibold text-[15px] text-gray-900">${announcement.author_name}</div>
                            <div class="text-[13px] text-gray-500">${formatTime(announcement.created_at)}</div>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <div class="text-gray-700 leading-relaxed text-[15px] whitespace-pre-wrap break-words">${announcement.content}</div>
                        
                        ${announcement.media && announcement.media.length > 0 ? `
                            <div class="mt-4 grid ${announcement.media.length === 1 ? 'grid-cols-1' : announcement.media.length === 2 ? 'grid-cols-2' : announcement.media.length === 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-2">
                                ${announcement.media.map((item, index) => `
                                    <div class="rounded-lg overflow-hidden ${announcement.media.length === 3 && index === 0 ? 'col-span-3' : ''}">
                                        ${item.type === 'video' ? `
                                            <video src="${BASE_URL}${item.src}" controls class="w-full block"></video>
                                        ` : `
                                            <img src="${BASE_URL}${item.src}" alt="Announcement media" class="w-full block object-cover ${announcement.media.length > 1 ? 'h-48' : ''}">
                                        `}
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        
                        ${announcement.link ? `
                            <a href="${announcement.link}" target="_blank" class="mt-4 flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3.5 no-underline hover:bg-emerald-100 transition-colors">
                                <i class="uil uil-link-alt text-emerald-500 text-lg"></i>
                                <div class="text-emerald-600 text-sm break-all">${announcement.link}</div>
                            </a>
                        ` : ''}
                    </div>
                    
                    <div class="flex gap-4 pt-3.5 border-t border-gray-100">
                        <div class="flex items-center gap-1.5 text-gray-500 text-[13px]">
                            <i class="uil uil-eye text-base"></i>
                            ${formatNumber(announcement.views)} views
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Media Modal functions
        function openMediaModal(type = 'image') {
            currentMediaType = type;
            const modal = document.getElementById('mediaModal');
            const title = document.getElementById('mediaModalTitle');
            const hint = document.getElementById('mediaInputHint');
            const input = document.getElementById('mediaInput');

            title.textContent = type === 'video' ? 'Upload Videos' : 'Upload Images';
            hint.textContent = type === 'video' ? 'MP4, WebM up to 50MB' : 'PNG, JPG, GIF up to 10MB';
            input.accept = type === 'video' ? 'video/*' : 'image/*';

            modal.classList.remove('hidden');
            modal.classList.add('flex');
            document.body.style.overflow = 'hidden';
        }

        function closeMediaModal() {
            const modal = document.getElementById('mediaModal');
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            document.body.style.overflow = 'auto';

            document.getElementById('mediaPreviewGrid').innerHTML = '';
            document.getElementById('mediaInput').value = '';
        }

        function handleMediaUpload(event) {
            const files = Array.from(event.target.files);
            const grid = document.getElementById('mediaPreviewGrid');
            grid.innerHTML = ''; // Clear existing previews

            files.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const isVideo = file.type.startsWith('video/');

                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'relative rounded-lg overflow-hidden border border-gray-200';
                    itemDiv.innerHTML = `
                        ${isVideo ? `
                            <video src="${e.target.result}" class="w-full h-32 object-cover"></video>
                        ` : `
                            <img src="${e.target.result}" class="w-full h-32 object-cover">
                        `}
                        <button type="button" class="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-gray-900 text-white rounded-full text-sm hover:bg-red-600 transition-colors" onclick="removeMediaFromGrid(this, ${index})">
                            <i class="uil uil-times"></i>
                        </button>
                    `;
                    grid.appendChild(itemDiv);
                };
                reader.readAsDataURL(file);
            });

            // Store the actual files for later upload
            currentMediaFiles = files;
        }

        function removeMediaFromGrid(button, index) {
            button.closest('.relative').remove();
            currentMediaFiles.splice(index, 1);
        }

        function addMediaToPost() {
            currentMediaPreviews = [];

            currentMediaFiles.forEach(file => {
                const reader = new FileReader();
                reader.onload = function (e) {
                    currentMediaPreviews.push({
                        type: file.type.startsWith('video/') ? 'video' : 'image',
                        src: e.target.result
                    });
                    updatePostPreview();
                };
                reader.readAsDataURL(file);
            });

            closeMediaModal();
        }

        function updatePostPreview() {
            const container = document.getElementById('previewContainer');

            if (currentMediaPreviews.length === 0) {
                container.innerHTML = '';
                return;
            }

            container.innerHTML = `
                <div class="grid ${currentMediaPreviews.length === 1 ? 'grid-cols-1' : currentMediaPreviews.length === 2 ? 'grid-cols-2' : 'grid-cols-3'} gap-2 mb-4">
                    ${currentMediaPreviews.map((item, index) => `
                        <div class="relative rounded-lg overflow-hidden border border-gray-200">
                            ${item.type === 'video' ? `
                                <video src="${item.src}" class="w-full h-32 object-cover"></video>
                            ` : `
                                <img src="${item.src}" class="w-full h-32 object-cover">
                            `}
                            <button type="button" class="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-gray-900 text-white rounded-full text-sm hover:bg-red-600 transition-colors" onclick="removeMediaFromPost(${index})">
                                <i class="uil uil-times"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        function removeMediaFromPost(index) {
            currentMediaPreviews.splice(index, 1);
            currentMediaFiles.splice(index, 1);
            updatePostPreview();
        }

        // Handle link input
        function toggleLinkInput() {
            const linkInput = document.getElementById('linkUrl');
            linkInput.classList.toggle('hidden');
            if (!linkInput.classList.contains('hidden')) {
                linkInput.focus();
            }
        }

        // Expand/Collapse post card functions
        function expandPostCard() {
            const collapsedCard = document.getElementById('collapsedCard');
            const expandedCard = document.getElementById('expandedCard');

            // Fade out collapsed card
            collapsedCard.classList.add('opacity-0', 'scale-95');

            setTimeout(() => {
                collapsedCard.classList.add('hidden');
                expandedCard.classList.remove('hidden');

                // Trigger reflow
                expandedCard.offsetHeight;

                // Fade in expanded card
                expandedCard.classList.remove('opacity-0', 'scale-95');
                expandedCard.classList.add('opacity-100', 'scale-100');

                // Focus on textarea after animation
                setTimeout(() => {
                    document.getElementById('content').focus();
                }, 150);
            }, 300);
        }

        function collapsePostCard() {
            const collapsedCard = document.getElementById('collapsedCard');
            const expandedCard = document.getElementById('expandedCard');

            // Fade out expanded card
            expandedCard.classList.remove('opacity-100', 'scale-100');
            expandedCard.classList.add('opacity-0', 'scale-95');

            setTimeout(() => {
                expandedCard.classList.add('hidden');
                collapsedCard.classList.remove('hidden');

                // Trigger reflow
                collapsedCard.offsetHeight;

                // Fade in collapsed card
                collapsedCard.classList.remove('opacity-0', 'scale-95');
                collapsedCard.classList.add('opacity-100', 'scale-100');

                // Reset form after animation
                document.getElementById('announcementForm').reset();
                currentMediaFiles = [];
                currentMediaPreviews = [];
                document.getElementById('previewContainer').innerHTML = '';
                document.getElementById('linkUrl').classList.add('hidden');
            }, 300);
        }

        // Helper function to clear error states
        function clearFieldError(fieldId) {
            const field = document.getElementById(fieldId);
            field.classList.remove('border-2', 'border-red-500', 'focus:border-red-500', 'ring-4', 'ring-red-500/20');

            // Remove error message if exists
            const errorMsg = document.getElementById(`${fieldId}-error`);
            if (errorMsg) {
                errorMsg.remove();
            }
        }

        // Helper function to show field error
        function showFieldError(fieldId, message) {
            const field = document.getElementById(fieldId);
            field.classList.add('border-2', 'border-red-500', 'focus:border-red-500', 'ring-4', 'ring-red-500/20');

            // Remove existing error message if any
            const existingError = document.getElementById(`${fieldId}-error`);
            if (existingError) {
                existingError.remove();
            }

            // Create and insert error message
            const errorMsg = document.createElement('div');
            errorMsg.id = `${fieldId}-error`;
            errorMsg.className = 'text-red-500 text-xs mt-1 flex items-center gap-1';
            errorMsg.innerHTML = `
        <i class="uil uil-exclamation-triangle"></i>
        <span>${message}</span>
    `;
            field.parentElement.insertBefore(errorMsg, field.nextSibling);
        }

        // Add input listeners to clear errors when user types
        document.getElementById('content').addEventListener('input', function () {
            clearFieldError('content');
        });

        document.getElementById('linkUrl').addEventListener('input', function () {
            clearFieldError('linkUrl');
        });

        // Replace your form submission handler with this updated version:

        document.getElementById('announcementForm').addEventListener('submit', async function (e) {
            e.preventDefault();

            const content = document.getElementById('content').value.trim();
            const linkUrl = document.getElementById('linkUrl').value.trim();
            const publishBtn = document.getElementById('publishBtn');
            const linkInput = document.getElementById('linkUrl');

            // Clear previous errors
            clearFieldError('content');
            clearFieldError('linkUrl');

            // Check if there's any content: text, media, or link
            const hasContent = content.length > 0;
            const hasMedia = currentMediaFiles.length > 0;
            const hasLink = linkUrl.length > 0;

            // If link input is visible but empty, show error
            if (!linkInput.classList.contains('hidden') && !hasLink) {
                showFieldError('linkUrl', 'Please enter a link URL or remove the link field');
                return;
            }

            // Validate: Must have at least one type of content
            if (!hasContent && !hasMedia && !hasLink) {
                showFieldError('content', 'Please add some content, media, or a link');
                return;
            }

            // Create FormData
            const formData = new FormData();

            // Only append content if it exists
            if (content) {
                formData.append('content', content);
            }

            if (linkUrl) {
                // Auto-prepend https:// if no protocol
                const link = linkUrl.match(/^https?:\/\//i) ? linkUrl : 'https://' + linkUrl;
                formData.append('link', link);
            }

            // Add media files
            currentMediaFiles.forEach((file, index) => {
                formData.append('media[]', file);
            });

            // Disable button and show loading
            const originalHTML = publishBtn.innerHTML;
            publishBtn.disabled = true;
            publishBtn.innerHTML = `
        <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Publishing...</span>
    `;

            try {
                const response = await fetch('api/announcements/create.php', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    showToast('Announcement published successfully!', 'success');
                    collapsePostCard();
                    loadAnnouncements(); // Reload announcements
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                console.error('Error creating announcement:', error);
                showToast(error.message || 'Failed to publish announcement', 'error');
            } finally {
                // Restore button
                publishBtn.disabled = false;
                publishBtn.innerHTML = originalHTML;
            }
        });

        
        // Close modal on background click
        document.getElementById('mediaModal').addEventListener('click', function (e) {
            if (e.target === this) {
                closeMediaModal();
            }
        });

        // Close modal on Escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                const modal = document.getElementById('mediaModal');
                if (!modal.classList.contains('hidden')) {
                    closeMediaModal();
                }
            }
        });

        // Initialize
        loadAnnouncements();
    </script>
    <script src="assets/js/sidebar.js"></script>
    <script src="assets/js/toast.js"></script>
    <script src="assets/js/modal.js"></script>
</body>

</html>