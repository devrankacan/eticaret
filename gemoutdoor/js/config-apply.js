// GEM Outdoor – Config Apply
// index.html yüklendiğinde çalışır; localStorage (admin panelden) veya config.js değerlerini uygular

(function () {
  function deepMerge(target, source) {
    const result = JSON.parse(JSON.stringify(target));
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else if (source[key] !== undefined && source[key] !== null) {
        result[key] = source[key];
      }
    }
    return result;
  }

  function getConfig() {
    const base = window.GEM_CONFIG || {};
    const saved = localStorage.getItem('gem_config');
    if (saved) {
      try { return deepMerge(base, JSON.parse(saved)); }
      catch (e) { return base; }
    }
    return base;
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el && val !== undefined && val !== '') el.textContent = val;
  }

  function setHtml(id, val) {
    const el = document.getElementById(id);
    if (el && val !== undefined && val !== '') el.innerHTML = val;
  }

  function uploads() { try { return JSON.parse(localStorage.getItem('gem_uploads') || '{}'); } catch(e) { return {}; } }
  function resolveImg(url) { if (!url) return url; const u = uploads(); return u[url] || url; }

  function setAttr(id, attr, val) {
    const el = document.getElementById(id);
    if (el && val !== undefined && val !== '') el.setAttribute(attr, val);
  }
  function setImgSrc(id, url) {
    const el = document.getElementById(id);
    if (el && url) el.src = resolveImg(url);
  }

  function setHref(id, val) {
    const el = document.getElementById(id);
    if (el && val !== undefined && val !== '') el.href = val;
  }

  function applyConfig(cfg) {
    // ── SITE ──────────────────────────────────────────
    if (cfg.site) {
      if (cfg.site.title) document.title = cfg.site.title;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && cfg.site.metaDescription) metaDesc.content = cfg.site.metaDescription;
      setText('cfg-logo-gem', cfg.site.logoGem);
      setText('cfg-logo-outdoor', cfg.site.logoOutdoor);
    }

    // ── HERO ──────────────────────────────────────────
    if (cfg.hero) {
      const h = cfg.hero;
      if (h.videoId) {
        const src = `https://www.youtube.com/embed/${h.videoId}?autoplay=1&mute=1&loop=1&playlist=${h.videoId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1`;
        setAttr('cfg-hero-video', 'src', src);
      }
      setText('cfg-hero-eyebrow', h.eyebrow);
      setText('cfg-hero-title', h.title);
      setText('cfg-hero-title-hl', h.titleHighlight);
      setText('cfg-hero-subtitle', h.subtitle);
      setText('cfg-hero-btn', h.btnText);
      setHref('cfg-hero-btn', h.btnLink);
    }

    // ── CERTIFICATES ──────────────────────────────────
    if (cfg.certificates) {
      cfg.certificates.forEach(function (cert, i) {
        setText('cfg-cert-brand-' + i, cert.brand);
        setText('cfg-cert-name-' + i, cert.name);
        const logoEl = document.getElementById('cfg-cert-logo-' + i);
        if (logoEl && cert.brandLogo) { logoEl.src = cert.brandLogo; logoEl.style.display = ''; }
        const imgEl = document.getElementById('cfg-cert-img-' + i);
        if (imgEl && cert.image) imgEl.src = cert.image;
      });
    }

    // ── SMART SHINE ───────────────────────────────────
    if (cfg.smartShine) {
      const s = cfg.smartShine;
      setText('cfg-shine-label', s.label);
      setText('cfg-shine-heading', s.heading);
      setText('cfg-shine-heading-bold', s.headingBold);
      setText('cfg-shine-sub', s.sub);
      setImgSrc('cfg-shine-img1', s.image1);
      setImgSrc('cfg-shine-img2', s.image2);
    }

    // ── VIDEO SECTION ─────────────────────────────────
    if (cfg.videoSection) {
      const v = cfg.videoSection;
      window._GEM_VIDEO_ID = v.videoId;
      setHtml('cfg-video-text', v.text);
      setImgSrc('cfg-video-bg', v.bgImage);
    }

    // ── APP SECTION ───────────────────────────────────
    if (cfg.appSection) {
      const a = cfg.appSection;
      setText('cfg-app-logo-letter', a.logoLetter);
      setText('cfg-app-eyebrow', a.eyebrow);
      setText('cfg-app-title', a.title);
      setText('cfg-app-title-sub', a.titleSub);
      setText('cfg-app-cursive', a.cursive);
      setText('cfg-app-btn', a.btnText);
      setHref('cfg-app-btn', a.btnLink);
      setImgSrc('cfg-app-mockup', a.mockupImage);
    }

    // ── DEALERSHIP ────────────────────────────────────
    if (cfg.dealership) {
      const d = cfg.dealership;
      setText('cfg-deal-badge', d.badge);
      setText('cfg-deal-title-hl', d.titleHighlight);
      setText('cfg-deal-desc1', d.description);
      setText('cfg-deal-desc2', d.description2);
      setText('cfg-deal-btn', d.btnText);
      setHref('cfg-deal-btn', d.btnLink);
      setImgSrc('cfg-deal-img', d.image);
    }

    // ── CONTACT / FOOTER ──────────────────────────────
    if (cfg.contact) {
      const c = cfg.contact;
      setText('cfg-contact-email', c.email);
      setHref('cfg-contact-email-link', 'mailto:' + c.email);
      setText('cfg-contact-address', c.address);
      setText('cfg-contact-phone', c.phone);
      setHref('cfg-instagram', c.instagramUrl || '#');
      setHref('cfg-facebook', c.facebookUrl || '#');
      setHref('cfg-twitter', c.twitterUrl || '#');
      setHref('cfg-linkedin', c.linkedinUrl || '#');
      setHref('cfg-youtube', c.youtubeUrl || '#');
      // WhatsApp
      if (c.whatsapp) {
        const wpEl = document.getElementById('cfg-whatsapp');
        if (wpEl) { wpEl.href = 'https://wa.me/' + c.whatsapp.replace(/\D/g, ''); wpEl.style.display = ''; }
      }
      // Instagram follow banner
      const igBanner = document.getElementById('cfg-ig-banner');
      if (igBanner && c.instagramUrl) igBanner.href = c.instagramUrl;
    }

    if (cfg.footer) {
      setText('cfg-copyright', cfg.footer.copyright);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyConfig(getConfig());
  });
})();
