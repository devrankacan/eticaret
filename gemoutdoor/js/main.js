/* ============================================================
   GEM OUTDOOR – Main JavaScript
   ============================================================ */

// ---- Navbar scroll effect ----
(function () {
  var navbar = document.getElementById('navbar');
  function onScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// ---- Mobile nav toggle ----
(function () {
  var toggle = document.getElementById('navToggle');
  var menu   = document.getElementById('navMenu');
  var spans  = toggle.querySelectorAll('span');

  toggle.addEventListener('click', function () {
    var isOpen = menu.classList.toggle('open');
    spans[0].style.transform = isOpen ? 'rotate(45deg) translate(5px, 5px)' : '';
    spans[1].style.opacity   = isOpen ? '0' : '';
    spans[2].style.transform = isOpen ? 'rotate(-45deg) translate(5px, -5px)' : '';
  });

  // Mobile: level-1 dropdown toggle
  document.querySelectorAll('.nav-item.has-dropdown > .nav-link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        this.closest('.nav-item').classList.toggle('open');
      }
    });
  });

  // Mobile: level-2 subdropdown toggle
  document.querySelectorAll('.has-subdropdown > a').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        this.closest('.has-subdropdown').classList.toggle('open');
      }
    });
  });

  document.addEventListener('click', function (e) {
    if (!menu.contains(e.target) && !toggle.contains(e.target)) {
      menu.classList.remove('open');
    }
  });
})();

// ---- Smooth scroll ----
document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
  anchor.addEventListener('click', function (e) {
    var target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      var navH = document.getElementById('navbar').offsetHeight;
      var top  = target.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top: top, behavior: 'smooth' });
      document.getElementById('navMenu').classList.remove('open');
    }
  });
});

// ---- Lightbox for certificates ----
(function () {
  var lightbox  = document.getElementById('lightbox');
  var lbImg     = document.getElementById('lightboxImg');
  var lbClose   = document.getElementById('lightboxClose');
  var lbBackdrop = document.getElementById('lightboxBackdrop');

  document.querySelectorAll('.lightbox-trigger').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      lbImg.src = this.getAttribute('data-img');
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeLightbox() {
    lightbox.classList.remove('open');
    lbImg.src = '';
    document.body.style.overflow = '';
  }

  if (lbClose)   lbClose.addEventListener('click', closeLightbox);
  if (lbBackdrop) lbBackdrop.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });
})();

// ---- Before/After Slider ----
(function () {
  var slider = document.getElementById('baSlider');
  if (!slider) return;

  var before    = document.getElementById('baBefore');
  var handle    = document.getElementById('baHandle');
  var beforeImg = slider.querySelector('.ba-img-before');
  var isDragging = false;

  // Keep the before-image the same pixel width as the slider
  // so overflow:hidden clips correctly at any handle position
  function syncImgWidth() {
    if (beforeImg) beforeImg.style.width = slider.offsetWidth + 'px';
  }
  syncImgWidth();
  window.addEventListener('resize', syncImgWidth);
  // Also sync after the after-image loads (it sets the slider height)
  var afterImg = slider.querySelector('.ba-img-after');
  if (afterImg) afterImg.addEventListener('load', syncImgWidth);

  function setPosition(clientX) {
    var rect = slider.getBoundingClientRect();
    var pct  = Math.min(Math.max((clientX - rect.left) / rect.width, 0.02), 0.98);
    var val  = (pct * 100).toFixed(2) + '%';
    before.style.width = val;
    handle.style.left  = val;
  }

  // Mouse
  handle.addEventListener('mousedown', function (e) { isDragging = true; e.preventDefault(); });
  slider.addEventListener('mousedown', function (e) { isDragging = true; e.preventDefault(); setPosition(e.clientX); });
  document.addEventListener('mousemove', function (e) { if (isDragging) setPosition(e.clientX); });
  document.addEventListener('mouseup',   function ()  { isDragging = false; });

  // Touch
  handle.addEventListener('touchstart', function (e) { isDragging = true; e.stopPropagation(); }, { passive: true });
  slider.addEventListener('touchstart', function (e) {
    isDragging = true;
    setPosition(e.touches[0].clientX);
  }, { passive: true });
  document.addEventListener('touchmove', function (e) {
    if (isDragging) {
      setPosition(e.touches[0].clientX);
    }
  }, { passive: true });
  document.addEventListener('touchend', function () { isDragging = false; });
})();

// ---- Video modal ----
(function () {
  var playBtn  = document.getElementById('videoPlayBtn');
  var modal    = document.getElementById('videoModal');
  var backdrop = document.getElementById('modalBackdrop');
  var closeBtn = document.getElementById('modalClose');
  var iframe   = document.getElementById('modalIframe');

  var VIDEO_ID = 'VPEnipL_oeI';

  function openModal() {
    iframe.src = 'https://www.youtube.com/embed/' + VIDEO_ID + '?autoplay=1&rel=0';
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    modal.classList.remove('open');
    iframe.src = '';
    document.body.style.overflow = '';
  }

  if (playBtn)  playBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
})();

// ---- Scroll reveal ----
(function () {
  var els = document.querySelectorAll('.cert-card, .shine-text-col, .shine-slider-col, .dealership-text-col, .dealership-info-col, .dealership-img-col');
  els.forEach(function (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  });
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  els.forEach(function (el) { obs.observe(el); });
})();
