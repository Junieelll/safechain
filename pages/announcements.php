<?php
// Get user info from session or database
$user_name = $_SESSION['name'] ?? 'User';
$user_id = $_SESSION['user_id'] ?? 'usr-2025-001';
$encoded_name = urlencode($user_name);

// Generate unique color based on user ID
function getUserColor($user_id)
{
    $colors = [
        'f97316', // Orange
        '3b82f6', // Blue
        'ef4444', // Red
        '10b981', // Green
        '8b5cf6', // Purple
        'f59e0b', // Amber
        'ec4899', // Pink
        '06b6d4', // Cyan
        '84cc16', // Lime
        '6366f1', // Indigo
        '14b8a6', // Teal
        'f43f5e', // Rose
    ];

    // Extract numeric part from user_id (e.g., "usr-2025-001" -> 001)
    preg_match('/\d+$/', $user_id, $matches);
    $numeric_id = isset($matches[0]) ? (int) $matches[0] : 1;

    // Use numeric_id to pick a consistent color
    $index = $numeric_id % count($colors);
    return $colors[$index];
}

$avatar_color = getUserColor($user_id);
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SafeChain | Announcements</title>
    <base href="../" />
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
    <?php include $_SERVER['DOCUMENT_ROOT'] . '/includes/sidebar.php'; ?>

    <main id="mainContent" class="transition-all duration-500 ease-in-out ml-[302px] flex-1 p-8">
        <div class="w-full">
            <div class="max-w-[950px] mx-auto">
                <!-- Header -->
                <div class="mb-8">
                    <h1 class="text-2xl font-semibold text-gray-900 mb-1 dark:text-gray-200">Announcements</h1>
                    <p class="text-sm text-gray-500 dark:text-gray-300">Post an official announcement for the community</p>
                </div>

                <!-- Simple Collapsed Card (Default State) -->
                <div class="bg-white dark:bg-neutral-800 rounded-3xl p-4 mb-6 cursor-pointer transition-all duration-300 opacity-100 scale-100"
                    id="collapsedCard" onclick="expandPostCard()">
                    <div class="flex items-center gap-3">
                        <img src="https://ui-avatars.com/api/?name=<?php echo $encoded_name; ?>&background=<?php echo $avatar_color; ?>&color=fff&size=128"
                            alt="Avatar" class="w-10 h-10 rounded-full object-cover flex-shrink-0">
                        <div class="flex-1 text-gray-500 dark:text-gray-300 flex justify-center gap-3">
                            <span class="bg-[#f5f5f5] dark:bg-neutral-700 py-4 px-3 rounded-xl text-xs w-full">Share an important update
                                with the community...</span>
                            <i class="uil uil-pen text-xl grid items-center"></i>
                        </div>
                    </div>
                </div>

                <!-- Expanded Card (Hidden by Default) -->
                <div class="bg-white dark:bg-neutral-800 rounded-3xl p-6 mb-6 hidden opacity-0 scale-95 transition-all duration-300"
                    id="expandedCard">
                    <div class="flex justify-between items-center mb-4">
                        <div class="text-sm font-semibold text-gray-900 dark:text-gray-100">Create a post</div>
                        <button type="button"
                            class="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-red-900/50 transition-colors"
                            onclick="collapsePostCard()">
                            <i class="uil uil-times text-xl"></i>
                        </button>
                    </div>

                    <form id="announcementForm">
                        <textarea
                            class="w-full px-3.5 py-3 bg-[#f5f5f5] dark:bg-neutral-700 rounded-xl text-sm resize-none min-h-[100px] mb-4 text-gray-900 dark:text-gray-200 focus:outline-none transition-colors"
                            id="content" placeholder="Share an important update with the community..."></textarea>
                        <!-- Preview Container -->
                        <div id="previewContainer" class="mb-4"></div>

                        <!-- Link Input (hidden by default) -->
                        <input type="text" id="linkUrl"
                            class="hidden w-full px-3 py-2.5 rounded-md text-sm mb-4 bg-[#f5f5f5] dark:bg-neutral-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:bg-white dark:focus:bg-neutral-900 transition-colors"
                            placeholder="https://example.com">

                        <div class="flex justify-between items-center">
                            <div class="flex gap-2">
                                <button type="button"
                                    class="flex items-center gap-1.5 px-3 py-2 bg-[#f5f5f5] dark:bg-neutral-700 rounded-full text-[13px] text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 transition-colors"
                                    onclick="openMediaModal()">
                                    <i class="uil uil-image text-lg"></i>
                                    <span class="hidden sm:inline">Image</span>
                                </button>
                                <button type="button"
                                    class="flex items-center gap-1.5 px-3 py-2 bg-[#f5f5f5] dark:bg-neutral-700 rounded-full text-[13px] text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 transition-colors"
                                    onclick="openMediaModal('video')">
                                    <i class="uil uil-video text-lg"></i>
                                    <span class="hidden sm:inline">Video</span>
                                </button>
                                <button type="button"
                                    class="flex items-center gap-1.5 px-3 py-2 bg-[#f5f5f5] dark:bg-neutral-700 rounded-full text-[13px] text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 transition-colors"
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

        </div>
        <div id="toastContainer" class="fixed top-4 right-4 z-50 space-y-3 max-w-md w-full"></div>
    </main>

    <script>
        // Base URL configuration - adjust this to match your project structure
        const BASE_URL = '/'; // Change this if your project is in a different folder
        
        // Current logged-in user ID from PHP session
        const CURRENT_USER_ID = '<?php echo $user_id; ?>';

        let currentMediaFiles = []; // Store actual File objects
        let currentMediaPreviews = []; // Store preview data URLs
        let currentMediaType = 'image';

        // Generate user color from user ID (matches PHP function)
        function getUserColor(userId) {
            const colors = [
                'f97316', // Orange
                '3b82f6', // Blue
                'ef4444', // Red
                '10b981', // Green
                '8b5cf6', // Purple
                'f59e0b', // Amber
                'ec4899', // Pink
                '06b6d4', // Cyan
                '84cc16', // Lime
                '6366f1', // Indigo
                '14b8a6', // Teal
                'f43f5e', // Rose
            ];

            // Extract numeric part from user_id (e.g., "usr-2025-001" -> 001)
            const matches = userId.match(/\d+$/);
            const numericId = matches ? parseInt(matches[0]) : 1;

            // Use numericId to pick a consistent color
            const index = numericId % colors.length;
            return colors[index];
        }

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

    feed.innerHTML = announcements.map(announcement => {
        const authorColor = getUserColor(announcement.user_id || 'USR-2025-001');
        const isAuthor = announcement.user_id === CURRENT_USER_ID;

        return `
        <div class="bg-white dark:bg-neutral-800 rounded-3xl p-6 shadow-sm">
            <div class="flex gap-3 mb-4">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(announcement.author_name)}&background=${authorColor}&color=fff&size=128" 
                     alt="Avatar" class="w-10 h-10 rounded-full object-cover flex-shrink-0">
                <div class="flex-1">
                    <div class="font-semibold text-[15px] text-gray-900 dark:text-gray-200">${announcement.author_name}</div>
                    <div class="text-[13px] text-gray-500 dark:text-gray-300">${formatTime(announcement.created_at)}</div>
                </div>
                ${isAuthor ? `
                    <div class="relative">
                        <button onclick="toggleDropdown(${announcement.id})" class="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
                            <i class="uil uil-ellipsis-v text-xl"></i>
                        </button>
                        <div id="dropdown-${announcement.id}" class="hidden absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-10">
                            <button onclick="editAnnouncement(${announcement.id})" class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-950/20 flex items-center gap-2">
                                <i class="uil uil-edit text-lg"></i>
                                <span>Edit</span>
                            </button>
                            <button onclick="deleteAnnouncement(${announcement.id})" class="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2">
                                <i class="uil uil-trash-alt text-lg"></i>
                                <span>Delete</span>
                            </button>
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <div class="mb-4">
                <div class="text-gray-700 dark:text-gray-200 leading-relaxed text-[15px] whitespace-pre-wrap break-words">${announcement.content}</div>
                
                ${announcement.media && announcement.media.length > 0 ? renderMediaGrid(announcement.media, announcement.id) : ''}
                
                ${announcement.link ? `
                    <a href="${announcement.link}" target="_blank" class="mt-4 flex items-center gap-2.5 bg-emerald-50 dark:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-600 rounded-lg px-4 py-3.5 no-underline hover:bg-emerald-100 dark:hover:bg-emerald-800 transition-colors">
                        <i class="uil uil-link-alt text-emerald-500 text-lg"></i>
                        <div class="text-emerald-600 text-sm break-all">${announcement.link}</div>
                    </a>
                ` : ''}
            </div>
            
            <div class="flex gap-4 pt-3.5 border-t border-gray-100 dark:border-gray-700">
                <div class="flex items-center gap-1.5 text-gray-500 dark:text-gray-300 text-[13px]">
                    <i class="uil uil-eye text-base"></i>
                    ${formatNumber(announcement.views)} views
                </div>
            </div>
        </div>
        `;
    }).join('');
}
        
        function renderMediaGrid(media, announcementId) {
    const count = media.length;
    const maxVisible = 5;
    const visibleMedia = media.slice(0, maxVisible);
    const remaining = count - maxVisible;

    let gridClass = '';
    let itemClasses = [];

    if (count === 1) {
        gridClass = 'grid-cols-1';
        itemClasses = ['col-span-1 h-72'];
    } else if (count === 2) {
        gridClass = 'grid-cols-2';
        itemClasses = ['h-56', 'h-56'];
    } else if (count === 3) {
        gridClass = 'grid-cols-2';
        itemClasses = ['col-span-2 h-56', 'h-48', 'h-48'];
    } else if (count === 4) {
        gridClass = 'grid-cols-2';
        itemClasses = ['h-48', 'h-48', 'h-48', 'h-48'];
    } else {
        // 5+: first image spans 2 cols, rest fill row
        gridClass = 'grid-cols-2';
        itemClasses = ['col-span-2 h-56', 'h-44', 'h-44', 'h-44', 'h-44'];
    }

    const items = visibleMedia.map((item, index) => {
        const isLast = index === visibleMedia.length - 1 && remaining > 0;
        const heightClass = itemClasses[index] || 'h-44';

        return `
            <div class="relative rounded-xl overflow-hidden cursor-pointer ${heightClass} ${itemClasses[index]?.includes('col-span') ? itemClasses[index].split(' ')[0] : ''}"
                 onclick="openLightbox(${announcementId}, ${index})">
                ${item.type === 'video' ? `
                    <video src="${BASE_URL}${item.src}" class="w-full h-full object-cover"></video>
                    <div class="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div class="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                            <i class="uil uil-play text-gray-800 text-xl ml-0.5"></i>
                        </div>
                    </div>
                ` : `
                    <img src="${BASE_URL}${item.src}" alt="Media" class="w-full h-full object-cover transition-transform duration-300 hover:scale-105">
                `}
                ${isLast ? `
                    <div class="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
                        <span class="text-white text-2xl font-bold">+${remaining}</span>
                    </div>
                ` : ''}
                <div class="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200 rounded-xl"></div>
            </div>
        `;
    }).join('');

    return `
        <div class="mt-3 grid ${gridClass} gap-1.5" data-announcement-id="${announcementId}" data-media='${JSON.stringify(media)}'>
            ${items}
        </div>
    `;
}

// Lightbox state
let lightboxMedia = [];
let lightboxIndex = 0;

function openLightbox(announcementId, startIndex) {
    const grid = document.querySelector(`[data-announcement-id="${announcementId}"]`);
    lightboxMedia = JSON.parse(grid.dataset.media);
    lightboxIndex = startIndex;

    // Create lightbox if not exists
    if (!document.getElementById('lightboxModal')) {
        const lb = document.createElement('div');
        lb.id = 'lightboxModal';
        lb.className = 'fixed inset-0 z-50 bg-black/95 flex items-center justify-center';
        lb.innerHTML = `
            <button onclick="closeLightbox()" class="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10">
                <i class="uil uil-times text-2xl"></i>
            </button>
            <div class="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium" id="lightboxCounter"></div>
            <button onclick="lightboxPrev()" class="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all z-10" id="lightboxPrevBtn">
                <i class="uil uil-angle-left text-2xl"></i>
            </button>
            <div class="max-w-4xl max-h-[85vh] w-full px-16 flex items-center justify-center" id="lightboxContent"></div>
            <button onclick="lightboxNext()" class="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all z-10" id="lightboxNextBtn">
                <i class="uil uil-angle-right text-2xl"></i>
            </button>
        `;
        lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
        document.body.appendChild(lb);
    }

    updateLightbox();
    document.getElementById('lightboxModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Keyboard navigation
    document.addEventListener('keydown', lightboxKeyHandler);
}

function updateLightbox() {
    const item = lightboxMedia[lightboxIndex];
    const content = document.getElementById('lightboxContent');
    const counter = document.getElementById('lightboxCounter');
    const prevBtn = document.getElementById('lightboxPrevBtn');
    const nextBtn = document.getElementById('lightboxNextBtn');

    counter.textContent = `${lightboxIndex + 1} / ${lightboxMedia.length}`;
    prevBtn.style.opacity = lightboxIndex === 0 ? '0.3' : '1';
    nextBtn.style.opacity = lightboxIndex === lightboxMedia.length - 1 ? '0.3' : '1';

    content.style.opacity = '0';
    setTimeout(() => {
        content.innerHTML = item.type === 'video'
            ? `<video src="${BASE_URL}${item.src}" controls autoplay class="max-w-full max-h-[80vh] rounded-xl shadow-2xl"></video>`
            : `<img src="${BASE_URL}${item.src}" alt="Media" class="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl">`;
        content.style.opacity = '1';
        content.style.transition = 'opacity 0.2s ease';
    }, 150);
}

function lightboxPrev() {
    if (lightboxIndex > 0) { lightboxIndex--; updateLightbox(); }
}

function lightboxNext() {
    if (lightboxIndex < lightboxMedia.length - 1) { lightboxIndex++; updateLightbox(); }
}

function lightboxKeyHandler(e) {
    if (e.key === 'ArrowLeft') lightboxPrev();
    if (e.key === 'ArrowRight') lightboxNext();
    if (e.key === 'Escape') closeLightbox();
}

function closeLightbox() {
    document.getElementById('lightboxModal').classList.add('hidden');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', lightboxKeyHandler);
}

        // Media Modal functions
        function openMediaModal(type = 'image') {
            currentMediaType = type;
            const isVideo = type === 'video';
            
            // Create dynamic modal
            modalManager.create({
                id: 'mediaUploadModal',
                icon: isVideo ? 'uil-video' : 'uil-image',
                iconColor: 'text-emerald-600 dark:text-emerald-500',
                iconBg: 'bg-emerald-100 dark:bg-emerald-900/60',
                title: isVideo ? 'Upload Videos' : 'Upload Images',
                subtitle: isVideo ? 'MP4, WebM up to 50MB' : 'PNG, JPG, GIF up to 10MB',
                body: `
                    <!-- File Input (hidden) -->
                    <input type="file" id="mediaInput" accept="${isVideo ? 'video/*' : 'image/*'}" multiple class="hidden">
                    
                    <!-- Upload Area -->
                    <div class="border-2 border-dashed border-gray-300 dark:border-neutral-600 rounded-xl p-8 text-center mb-4 hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors cursor-pointer"
                        onclick="document.getElementById('mediaInput').click()">
                        <i class="uil uil-cloud-upload text-5xl text-gray-400 dark:text-gray-500 mb-3"></i>
                        <p class="text-gray-600 dark:text-gray-300 font-medium mb-1">Click to upload or drag and drop</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            ${isVideo ? 'MP4, WebM up to 50MB' : 'PNG, JPG, GIF up to 10MB'}
                        </p>
                    </div>

                    <!-- Preview Grid -->
                    <div id="mediaPreviewGrid" class="grid grid-cols-2 gap-3 mb-4"></div>
                `,
                primaryButton: {
                    text: 'Add to Post',
                    icon: 'uil-check',
                    class: 'bg-emerald-500 hover:bg-emerald-600'
                },
                secondaryButton: {
                    text: 'Cancel'
                },
                onPrimary: () => {
                    addMediaToPost();
                },
                onSecondary: () => {
                    // Clear selections on cancel
                    currentMediaFiles = [];
                    document.getElementById('mediaInput').value = '';
                    document.getElementById('mediaPreviewGrid').innerHTML = '';
                }
            });

            modalManager.show('mediaUploadModal');

            // Attach file input change handler
            setTimeout(() => {
                const input = document.getElementById('mediaInput');
                if (input) {
                    input.addEventListener('change', handleMediaUpload);
                }
            }, 100);
        }

        function closeMediaModal() {
            modalManager.close('mediaUploadModal');
        }


        function handleMediaUpload(event) {
            const files = Array.from(event.target.files);
            
            if (files.length === 0) return;
            
            const grid = document.getElementById('mediaPreviewGrid');
            if (!grid) return;
            
            grid.innerHTML = ''; // Clear existing previews

            // Store the files immediately
            currentMediaFiles = files;

            files.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const isVideo = file.type.startsWith('video/');

                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'relative rounded-lg overflow-hidden border border-gray-200 dark:border-neutral-600';
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
        }

        function removeMediaFromGrid(button, index) {
            button.closest('.relative').remove();
            currentMediaFiles.splice(index, 1);
        }

        function addMediaToPost() {
            // Files are already stored in currentMediaFiles from handleMediaUpload
            // Just update the preview and close the modal
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

            // Debug logging
            console.log('Form validation:', { 
                hasContent, 
                hasMedia, 
                hasLink, 
                filesCount: currentMediaFiles.length,
                files: currentMediaFiles
            });

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
                    currentMediaFiles = [];
                    currentMediaPreviews = [];
                    collapsePostCard();
                    loadAnnouncements();
                }
                else {
                    throw new Error(data.message);
                }
            } catch (error) {
                console.error('Error creating announcement:', error);
                showToast('error', error.message || 'Failed to publish announcement');
            } finally {
                // Restore button
                publishBtn.disabled = false;
                publishBtn.innerHTML = originalHTML;
            }
        });


        // Initialize
        loadAnnouncements();

        // Toggle dropdown menu
        function toggleDropdown(announcementId) {
            const dropdown = document.getElementById(`dropdown-${announcementId}`);
            const isHidden = dropdown.classList.contains('hidden');
            
            // Close all other dropdowns
            document.querySelectorAll('[id^="dropdown-"]').forEach(dd => {
                dd.classList.add('hidden');
            });
            
            // Toggle current dropdown
            if (isHidden) {
                dropdown.classList.remove('hidden');
            }
        }

        // Close dropdowns when clicking outside
        document.addEventListener('click', function(event) {
            if (!event.target.closest('[id^="dropdown-"]') && !event.target.closest('button[onclick^="toggleDropdown"]')) {
                document.querySelectorAll('[id^="dropdown-"]').forEach(dd => {
                    dd.classList.add('hidden');
                });
            }
        });

        // Edit announcement function
        function editAnnouncement(announcementId) {
            // Close dropdown
            document.getElementById(`dropdown-${announcementId}`).classList.add('hidden');
            
            // TODO: Implement edit functionality
            showToast('info', 'Edit functionality coming soon!');
            console.log('Edit announcement:', announcementId);
        }

        // Delete announcement function
        async function deleteAnnouncement(announcementId) {
            // Close dropdown
            document.getElementById(`dropdown-${announcementId}`).classList.add('hidden');
            
            // Show delete modal
            modalManager.create({
                id: 'deleteAnnouncementModal',
                icon: 'uil-trash-alt',
                iconColor: 'text-red-600 dark:text-red-700',
                iconBg: 'bg-red-100 dark:bg-red-900/60',
                title: 'Delete Announcement',
                subtitle: 'This action cannot be undone.',
                body: `
                    <p class="text-xs text-gray-600 dark:text-neutral-300 text-center leading-relaxed">
                        Are you sure you want to permanently delete
                        <span class="font-semibold text-red-600">this announcement</span>?
                        This announcement will be removed forever and cannot be recovered.
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
                onPrimary: async () => {
                    await confirmDeleteAnnouncement(announcementId);
                }
            });

            modalManager.show('deleteAnnouncementModal');
        }

        // Confirm and execute deletion
        async function confirmDeleteAnnouncement(announcementId) {
            try {
                const response = await fetch(`api/announcements/delete.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ id: announcementId })
                });

                const data = await response.json();

                if (data.success) {
                    showToast('success', 'Announcement deleted successfully');
                    loadAnnouncements(); // Reload the feed
                    modalManager.close('deleteAnnouncementModal');
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                console.error('Error deleting announcement:', error);
                showToast('error', error.message || 'Failed to delete announcement');
            }
        }
    </script>
    <script src="assets/js/sidebar.js"></script>
    <script src="assets/js/toast.js"></script>
    <script src="assets/js/modal.js"></script>
</body>

</html>