
/* ─────────────────────────────────────────────────────────────────
   MEDIA REGISTRY  (stores full media arrays keyed by post ID)
───────────────────────────────────────────────────────────────── */
var _scMediaRegistry = {};

function scRegisterMedia(postId, mediaArray) {
  _scMediaRegistry[String(postId)] = mediaArray;
}

/* ─────────────────────────────────────────────────────────────────
   BUILD GRID HTML
   Call: buildMediaGrid(mediaArray, postId)
   Returns an HTML string — drop it directly into your template.
───────────────────────────────────────────────────────────────── */
function buildMediaGrid(media, postId) {
  var pid = String(postId);
  var MAX_VISIBLE = 5;
  var total = media.length;
  var visible = media.slice(0, MAX_VISIBLE);
  var overflow = total - MAX_VISIBLE; // positive when there are hidden images

  // Always register the FULL media array so the lightbox can show all items
  scRegisterMedia(pid, media);

  // ── single tile helper ────────────────────
  function tile(item, index, extraClass, overlay) {
    extraClass = extraClass || "";
    overlay = overlay || "";
    var isVideo = item.type === "video";
    var base = typeof BASE_URL !== "undefined" ? BASE_URL : "";
    var src = base + item.src;

    var inner = isVideo
      ? '<video src="' +
        src +
        '" class="sc-media-tile__media" preload="metadata" muted playsinline></video>' +
        '<div class="sc-media-tile__play-icon">&#9654;</div>'
      : '<img src="' +
        src +
        '" alt="media" class="sc-media-tile__media" loading="lazy">';

    return (
      '<div class="sc-media-tile ' +
      extraClass +
      '"' +
      ' data-index="' +
      index +
      '"' +
      ' data-post-id="' +
      pid +
      '"' +
      " onclick=\"scLightboxOpen('" +
      pid +
      "', " +
      index +
      ')">' +
      inner +
      overlay +
      "</div>"
    );
  }

  // ── 1 image ───────────────────────────────
  if (total === 1) {
    return (
      '<div class="sc-media-grid sc-media-grid--1">' +
      tile(media[0], 0) +
      "</div>"
    );
  }

  // ── 2 images ──────────────────────────────
  if (total === 2) {
    return (
      '<div class="sc-media-grid sc-media-grid--2">' +
      tile(media[0], 0) +
      tile(media[1], 1) +
      "</div>"
    );
  }

  // ── 3 images ──────────────────────────────
  if (total === 3) {
    return (
      '<div class="sc-media-grid sc-media-grid--3">' +
      tile(media[0], 0, "sc-media-tile--tall") +
      '<div class="sc-media-grid__col">' +
      tile(media[1], 1) +
      tile(media[2], 2) +
      "</div>" +
      "</div>"
    );
  }

  // ── 4 images ──────────────────────────────
  if (total === 4) {
    return (
      '<div class="sc-media-grid sc-media-grid--4">' +
      tile(media[0], 0) +
      tile(media[1], 1) +
      tile(media[2], 2) +
      tile(media[3], 3) +
      "</div>"
    );
  }

  // ── 5+ images ─────────────────────────────
  var tilesHtml = "";
  for (var i = 0; i < visible.length; i++) {
    var isLast = i === MAX_VISIBLE - 1 && overflow > 0;
    var overlay = isLast
      ? '<div class="sc-media-tile__overflow">+' +
        (overflow + 1) +
        " more</div>"
      : "";
    tilesHtml += tile(media[i], i, "", overlay);
  }

  return '<div class="sc-media-grid sc-media-grid--5">' + tilesHtml + "</div>";
}

/* ─────────────────────────────────────────────────────────────────
   INJECT CSS  (runs once, inlines everything needed)
───────────────────────────────────────────────────────────────── */
(function injectCSS() {
  if (document.getElementById("sc-media-grid-styles")) return;

  var style = document.createElement("style");
  style.id = "sc-media-grid-styles";
  style.textContent = [
    /* ── Grid Containers ── */
    ".sc-media-grid{display:grid;gap:3px;border-radius:12px;overflow:hidden;margin-top:14px;}",
    ".sc-media-grid--1{grid-template-columns:1fr;max-height:480px;}",
    ".sc-media-grid--2{grid-template-columns:1fr 1fr;height:280px;}",
    ".sc-media-grid--3{grid-template-columns:1fr 1fr;height:300px;}",
    ".sc-media-grid--3 .sc-media-grid__col{display:flex;flex-direction:column;gap:3px;}",
    ".sc-media-grid--4{grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;height:320px;}",
    ".sc-media-grid--5{grid-template-columns:1fr 1fr 1fr;grid-template-rows:180px 180px;}",
    ".sc-media-grid--5 .sc-media-tile:nth-child(1){grid-column:span 2;}",
    ".sc-media-grid--5 .sc-media-tile:nth-child(2){grid-column:span 1;}",

    /* ── Tile ── */
    ".sc-media-tile{position:relative;overflow:hidden;background:#111;cursor:pointer;}",
    ".sc-media-tile--tall{height:100%;}",
    ".sc-media-tile__media{width:100%;height:100%;object-fit:cover;display:block;transition:transform .28s ease;}",
    ".sc-media-tile:hover .sc-media-tile__media{transform:scale(1.05);}",

    /* Video play icon */
    ".sc-media-tile__play-icon{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;font-size:48px;color:rgba(255,255,255,.85);text-shadow:0 2px 12px rgba(0,0,0,.7);}",

    /* +N more overlay */
    ".sc-media-tile__overflow{position:absolute;inset:0;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;color:#fff;font-size:26px;font-weight:600;letter-spacing:-.5px;pointer-events:none;}",

    /* ── Lightbox backdrop ── */
    "#scLightbox{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.96);display:none;flex-direction:column;align-items:center;justify-content:center;}",
    "#scLightbox.sc-active{display:flex;}",

    /* Top bar */
    ".sc-lb-bar{position:absolute;top:0;left:0;right:0;height:58px;display:flex;align-items:center;justify-content:space-between;padding:0 18px;background:linear-gradient(to bottom,rgba(0,0,0,.75),transparent);z-index:2;}",
    ".sc-lb-counter{color:rgba(255,255,255,.65);font-size:13px;font-weight:500;letter-spacing:.4px;}",
    ".sc-lb-actions{display:flex;gap:8px;}",
    ".sc-lb-btn{width:38px;height:38px;border:none;border-radius:50%;background:rgba(255,255,255,.12);color:#fff;font-size:17px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .18s;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);}",
    ".sc-lb-btn:hover{background:rgba(255,255,255,.26);}",

    /* Stage */
    ".sc-lb-stage{position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;overflow:hidden;}",
    ".sc-lb-media-wrap{display:flex;align-items:center;justify-content:center;user-select:none;cursor:grab;}",
    ".sc-lb-media-wrap.sc-dragging{cursor:grabbing;}",
    ".sc-lb-media-wrap img,.sc-lb-media-wrap video{max-width:90vw;max-height:86vh;object-fit:contain;border-radius:6px;box-shadow:0 8px 56px rgba(0,0,0,.7);pointer-events:none;user-select:none;transform-origin:center;transition:transform .22s cubic-bezier(.2,.8,.3,1);}",

    /* Nav arrows */
    ".sc-lb-nav{position:absolute;top:50%;transform:translateY(-50%);width:48px;height:48px;border:none;border-radius:50%;background:rgba(255,255,255,.13);color:#fff;font-size:28px;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:3;transition:background .18s,transform .18s;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);}",
    ".sc-lb-nav:hover{background:rgba(255,255,255,.28);transform:translateY(-50%) scale(1.1);}",
    ".sc-lb-nav:disabled{opacity:.18;pointer-events:none;}",
    ".sc-lb-nav--prev{left:16px;}",
    ".sc-lb-nav--next{right:16px;}",

    /* Thumbnail strip */
    ".sc-lb-thumbs{position:absolute;bottom:18px;left:0;right:0;display:flex;justify-content:center;gap:6px;z-index:2;padding:0 16px;flex-wrap:nowrap;overflow-x:auto;max-width:100%;}",
    ".sc-lb-thumb{width:46px;height:46px;border-radius:7px;overflow:hidden;border:2px solid transparent;cursor:pointer;opacity:.5;transition:opacity .18s,border-color .18s;flex-shrink:0;}",
    ".sc-lb-thumb img,.sc-lb-thumb video{width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;}",
    ".sc-lb-thumb.sc-active-thumb{border-color:#fff;opacity:1;}",
    ".sc-lb-thumb:hover{opacity:.82;}",

    /* Zoom badge */
    ".sc-lb-zoom-badge{position:absolute;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.55);color:#fff;font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;pointer-events:none;opacity:0;transition:opacity .3s;white-space:nowrap;z-index:4;}",
    ".sc-lb-zoom-badge.sc-visible{opacity:1;}",

    /* Slide animations */
    "@keyframes scSlideInRight{from{opacity:0;transform:translateX(44px)}to{opacity:1;transform:translateX(0)}}",
    "@keyframes scSlideInLeft{from{opacity:0;transform:translateX(-44px)}to{opacity:1;transform:translateX(0)}}",
    "@keyframes scFadeIn{from{opacity:0}to{opacity:1}}",
    ".sc-anim-right{animation:scSlideInRight .22s ease forwards;}",
    ".sc-anim-left{animation:scSlideInLeft  .22s ease forwards;}",
    ".sc-anim-fade{animation:scFadeIn        .22s ease forwards;}",
  ].join("\n");

  document.head.appendChild(style);
})();

/* ─────────────────────────────────────────────────────────────────
   INJECT LIGHTBOX HTML  (once DOM is ready)
───────────────────────────────────────────────────────────────── */
function _scInjectLightbox() {
  if (document.getElementById("scLightbox")) return;

  var lb = document.createElement("div");
  lb.id = "scLightbox";
  lb.setAttribute("role", "dialog");
  lb.setAttribute("aria-modal", "true");
  lb.innerHTML =
    '<div class="sc-lb-bar">' +
    '<span class="sc-lb-counter" id="scLbCounter">1 / 1</span>' +
    '<div class="sc-lb-actions">' +
    '<button class="sc-lb-btn" onclick="scLightboxZoom(-0.25)" title="Zoom out (-)"<i class="uil uil-search-plus"></i></button>' +
    '<button class="sc-lb-btn" onclick="scLightboxZoom(+0.25)" title="Zoom in (+)">&#43;</button>' +
    '<button class="sc-lb-btn" onclick="scLightboxZoom(0,true)" title="Reset zoom (0)" style="font-size:11px;letter-spacing:-.5px">1:1</button>' +
    '<button class="sc-lb-btn" onclick="scLightboxClose()" title="Close (Esc)">&#10005;</button>' +
    "</div>" +
    "</div>" +
    '<div class="sc-lb-stage" id="scLbStage">' +
    '<button class="sc-lb-nav sc-lb-nav--prev" id="scLbPrev" onclick="scLightboxNav(-1)" title="Previous (\u2190)">&#8249;</button>' +
    '<div class="sc-lb-media-wrap" id="scLbWrap"></div>' +
    '<button class="sc-lb-nav sc-lb-nav--next" id="scLbNext" onclick="scLightboxNav(+1)" title="Next (\u2192)">&#8250;</button>' +
    "</div>" +
    '<div class="sc-lb-thumbs" id="scLbThumbs"></div>' +
    '<div class="sc-lb-zoom-badge" id="scLbZoomBadge">100%</div>';

  document.body.appendChild(lb);

  // Close on backdrop / stage click
  lb.addEventListener("click", function (e) {
    if (e.target === lb || e.target.id === "scLbStage") scLightboxClose();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", _scInjectLightbox);
} else {
  _scInjectLightbox();
}

/* ─────────────────────────────────────────────────────────────────
   LIGHTBOX STATE
───────────────────────────────────────────────────────────────── */
var _scLbMedia = [];
var _scLbIndex = 0;
var _scLbZoom = 1;
var _scLbDrag = { active: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0 };
var _scZoomTimer = null;
var _scTouchStartX = 0;

/* ─────────────────────────────────────────────────────────────────
   PUBLIC API
───────────────────────────────────────────────────────────────── */

/** Open the lightbox for a given post at the given media index */
function scLightboxOpen(postId, index) {
  var media = _scMediaRegistry[String(postId)];
  if (!media || media.length === 0) return;

  _scLbMedia = media;
  _scLbIndex = index;
  _scLbZoom = 1;
  _scLbDrag = { active: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0 };

  var lb = document.getElementById("scLightbox");
  if (!lb) {
    _scInjectLightbox();
    lb = document.getElementById("scLightbox");
  }

  lb.classList.add("sc-active");
  document.body.style.overflow = "hidden";

  _scBuildThumbs();
  _scShowSlide(index, 0);
}

/** Close the lightbox */
function scLightboxClose() {
  var lb = document.getElementById("scLightbox");
  if (lb) lb.classList.remove("sc-active");
  document.body.style.overflow = "";
  _scResetWrapTransform();
}

/** Move to an adjacent slide. dir: -1 = previous, +1 = next */
function scLightboxNav(dir) {
  var next = _scLbIndex + dir;
  if (next < 0 || next >= _scLbMedia.length) return;
  _scLbZoom = 1;
  _scResetWrapTransform();
  _scShowSlide(next, dir);
}

/** Zoom the current image. Pass reset=true to snap back to 100% */
function scLightboxZoom(delta, reset) {
  if (reset) {
    _scLbZoom = 1;
    _scResetWrapTransform();
  } else {
    _scLbZoom = Math.min(4, Math.max(0.5, _scLbZoom + delta));
  }

  var el = document.querySelector("#scLbWrap img, #scLbWrap video");
  if (el) el.style.transform = "scale(" + _scLbZoom + ")";

  // Show the zoom % badge briefly
  var badge = document.getElementById("scLbZoomBadge");
  if (badge) {
    badge.textContent = Math.round(_scLbZoom * 100) + "%";
    badge.classList.add("sc-visible");
    clearTimeout(_scZoomTimer);
    _scZoomTimer = setTimeout(function () {
      badge.classList.remove("sc-visible");
    }, 1400);
  }
}

/* ─────────────────────────────────────────────────────────────────
   INTERNAL HELPERS
───────────────────────────────────────────────────────────────── */

function _scShowSlide(index, dir) {
  var wrap = document.getElementById("scLbWrap");
  if (!wrap) return;

  var item = _scLbMedia[index];
  var base = typeof BASE_URL !== "undefined" ? BASE_URL : "";
  var src = base + item.src;

  var mediaHtml =
    item.type === "video"
      ? '<video src="' +
        src +
        '" controls autoplay style="max-width:90vw;max-height:86vh;border-radius:6px;pointer-events:auto;"></video>'
      : '<img src="' + src + '" alt="Image ' + (index + 1) + '">';

  wrap.innerHTML = mediaHtml;

  // Trigger slide animation
  wrap.classList.remove("sc-anim-right", "sc-anim-left", "sc-anim-fade");
  void wrap.offsetWidth; // force reflow
  if (dir > 0) wrap.classList.add("sc-anim-right");
  else if (dir < 0) wrap.classList.add("sc-anim-left");
  else wrap.classList.add("sc-anim-fade");

  _scLbIndex = index;

  // Update counter
  var counter = document.getElementById("scLbCounter");
  if (counter) counter.textContent = index + 1 + " / " + _scLbMedia.length;

  // Update nav arrow states
  var prev = document.getElementById("scLbPrev");
  var next = document.getElementById("scLbNext");
  if (prev) prev.disabled = index === 0;
  if (next) next.disabled = index === _scLbMedia.length - 1;

  // Highlight active thumbnail
  var thumbEls = document.querySelectorAll(".sc-lb-thumb");
  thumbEls.forEach(function (t, i) {
    var active = i === index;
    t.classList.toggle("sc-active-thumb", active);
    if (active)
      t.scrollIntoView({
        inline: "center",
        block: "nearest",
        behavior: "smooth",
      });
  });

  // Enable drag-to-pan
  _scSetupDrag(wrap);
}

function _scBuildThumbs() {
  var strip = document.getElementById("scLbThumbs");
  if (!strip) return;
  var base = typeof BASE_URL !== "undefined" ? BASE_URL : "";

  strip.innerHTML = _scLbMedia
    .map(function (item, i) {
      var src = base + item.src;
      var inner =
        item.type === "video"
          ? '<video src="' + src + '" muted preload="metadata"></video>'
          : '<img src="' + src + '" alt="">';
      return (
        '<div class="sc-lb-thumb" data-idx="' + i + '">' + inner + "</div>"
      );
    })
    .join("");

  // Delegated click handler
  strip.onclick = function (e) {
    var t = e.target.closest(".sc-lb-thumb");
    if (!t) return;
    var idx = parseInt(t.getAttribute("data-idx"), 10);
    if (!isNaN(idx) && idx !== _scLbIndex) {
      _scLbZoom = 1;
      _scResetWrapTransform();
      _scShowSlide(idx, idx > _scLbIndex ? 1 : -1);
    }
  };
}

function _scResetWrapTransform() {
  var wrap = document.getElementById("scLbWrap");
  if (wrap) wrap.style.transform = "";
  _scLbDrag.offsetX = 0;
  _scLbDrag.offsetY = 0;
}

function _scSetupDrag(wrap) {
  wrap.onmousedown = function (e) {
    if (_scLbZoom <= 1) return;
    e.preventDefault();
    _scLbDrag.active = true;
    _scLbDrag.startX = e.clientX - _scLbDrag.offsetX;
    _scLbDrag.startY = e.clientY - _scLbDrag.offsetY;
    wrap.classList.add("sc-dragging");
  };
}

/* ─────────────────────────────────────────────────────────────────
   GLOBAL EVENT LISTENERS
───────────────────────────────────────────────────────────────── */

// Mouse drag pan
document.addEventListener("mousemove", function (e) {
  if (!_scLbDrag.active) return;
  var wrap = document.getElementById("scLbWrap");
  if (!wrap) return;
  _scLbDrag.offsetX = e.clientX - _scLbDrag.startX;
  _scLbDrag.offsetY = e.clientY - _scLbDrag.startY;
  wrap.style.transform =
    "translate(" + _scLbDrag.offsetX + "px, " + _scLbDrag.offsetY + "px)";
});

document.addEventListener("mouseup", function () {
  if (!_scLbDrag.active) return;
  _scLbDrag.active = false;
  var wrap = document.getElementById("scLbWrap");
  if (wrap) wrap.classList.remove("sc-dragging");
});

// Touch swipe to navigate
document.addEventListener(
  "touchstart",
  function (e) {
    var lb = document.getElementById("scLightbox");
    if (!lb || !lb.classList.contains("sc-active")) return;
    _scTouchStartX = e.touches[0].clientX;
  },
  { passive: true },
);

document.addEventListener(
  "touchend",
  function (e) {
    var lb = document.getElementById("scLightbox");
    if (!lb || !lb.classList.contains("sc-active")) return;
    var dx = e.changedTouches[0].clientX - _scTouchStartX;
    if (Math.abs(dx) > 50) scLightboxNav(dx < 0 ? 1 : -1);
  },
  { passive: true },
);

// Keyboard shortcuts
document.addEventListener("keydown", function (e) {
  var lb = document.getElementById("scLightbox");
  if (!lb || !lb.classList.contains("sc-active")) return;
  if (e.key === "ArrowLeft") scLightboxNav(-1);
  else if (e.key === "ArrowRight") scLightboxNav(+1);
  else if (e.key === "Escape") scLightboxClose();
  else if (e.key === "+" || e.key === "=") scLightboxZoom(+0.25);
  else if (e.key === "-") scLightboxZoom(-0.25);
  else if (e.key === "0") scLightboxZoom(0, true);
});

// Scroll wheel zoom
document.addEventListener(
  "wheel",
  function (e) {
    var lb = document.getElementById("scLightbox");
    if (!lb || !lb.classList.contains("sc-active")) return;
    e.preventDefault();
    scLightboxZoom(e.deltaY < 0 ? 0.1 : -0.1);
  },
  { passive: false },
);
