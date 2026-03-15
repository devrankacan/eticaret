/* ============================================================
   GEM OUTDOOR – Main JavaScript
   ============================================================ */

// ---- CONFIG: YouTube video IDs (also editable via admin panel config) ----
const HERO_VIDEO_ID    = (window.GEM_CONFIG && window.GEM_CONFIG.hero && window.GEM_CONFIG.hero.videoId) || '_C7p3nY3hiw';
const PRODUCT_VIDEO_ID = (window.GEM_CONFIG && window.GEM_CONFIG.videoSection && window.GEM_CONFIG.videoSection.videoId) || 'VPEnipL_oeI';

// ---- Navbar scroll effect ----
(function () {
  const navbar = document.getElementById('navbar');
  function onScroll() {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// ---- Mobile nav toggle ----
(function () {
  const toggle = document.getElementById('navToggle');
  const menu   = document.getElementById('navMenu');

  toggle.addEventListener('click', function () {
    menu.classList.toggle('open');
    const isOpen = menu.classList.contains('open');
    toggle.setAttribute('aria-expanded', isOpen);
    // Animate hamburger → X
    const spans = toggle.querySelectorAll('span');
    if (isOpen) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity   = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity   = '';
      spans[2].style.transform = '';
    }
  });

  // Mobile dropdown toggles
  document.querySelectorAll('.nav-item.has-dropdown .nav-link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        const item = this.closest('.nav-item');
        item.classList.toggle('open');
      }
    });
  });

  // Close menu on outside click
  document.addEventListener('click', function (e) {
    if (!menu.contains(e.target) && !toggle.contains(e.target)) {
      menu.classList.remove('open');
    }
  });
})();

// ---- Hero YouTube video ID injection ----
(function () {
  if (HERO_VIDEO_ID === 'YOUTUBE_VIDEO_ID') return; // Skip if not configured
  const iframe = document.getElementById('heroVideo');
  if (iframe) {
    iframe.src = 'https://www.youtube.com/embed/' + HERO_VIDEO_ID +
      '?autoplay=1&mute=1&loop=1&playlist=' + HERO_VIDEO_ID +
      '&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1';
  }
})();

// ---- Video section modal ----
(function () {
  const playBtn   = document.getElementById('videoPlayBtn');
  const modal     = document.getElementById('videoModal');
  const backdrop  = document.getElementById('modalBackdrop');
  const closeBtn  = document.getElementById('modalClose');
  const iframe    = document.getElementById('modalIframe');

  function openModal() {
    // Prefer config-applied video ID (set by config-apply.js), fallback to constants
    const videoId = window._GEM_VIDEO_ID || PRODUCT_VIDEO_ID || HERO_VIDEO_ID;

    if (!videoId) {
      alert('Video URL henüz ayarlanmamış.');
      return;
    }

    iframe.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1&rel=0';
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    iframe.src = '';
    document.body.style.overflow = '';
  }

  if (playBtn) playBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });
})();

// ---- Smooth scroll for anchor links ----
document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const navH = document.getElementById('navbar').offsetHeight;
      const top  = target.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top: top, behavior: 'smooth' });
      // Close mobile menu if open
      document.getElementById('navMenu').classList.remove('open');
    }
  });
});

// ---- Before / After Slider ----
(function () {
  const slider  = document.getElementById('baSlider');
  const after   = document.getElementById('baAfter');
  const handle  = document.getElementById('baHandle');
  if (!slider || !after || !handle) return;

  let dragging = false;

  function setPosition(x) {
    const rect = slider.getBoundingClientRect();
    let pct = (x - rect.left) / rect.width;
    pct = Math.max(0.02, Math.min(0.98, pct));
    const pctRight = 1 - pct;
    after.style.clipPath = 'inset(0 ' + (pctRight * 100).toFixed(2) + '% 0 0)';
    handle.style.left = (pct * 100).toFixed(2) + '%';
  }

  slider.addEventListener('mousedown', function (e) { dragging = true; setPosition(e.clientX); });
  window.addEventListener('mousemove', function (e) { if (dragging) setPosition(e.clientX); });
  window.addEventListener('mouseup', function () { dragging = false; });

  slider.addEventListener('touchstart', function (e) { dragging = true; setPosition(e.touches[0].clientX); }, { passive: true });
  window.addEventListener('touchmove', function (e) { if (dragging) setPosition(e.touches[0].clientX); }, { passive: true });
  window.addEventListener('touchend', function () { dragging = false; });
})();

// ---- Scroll reveal animation ----
(function () {
  const elements = document.querySelectorAll(
    '.cert-card, .shine-text-col, .shine-images-col, .dealership-text-col, .dealership-info-col, .dealership-img-col, .app-img-col, .app-text-col'
  );

  elements.forEach(function (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  });

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  elements.forEach(function (el) { observer.observe(el); });
})();
