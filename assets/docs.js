(() => {
  const THEME_KEY = 'xinbox_docs_theme';

  // 1. Theme toggle (Light default + Dark support)
  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('themeToggle');
    if (btn) {
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      const label = btn.querySelector('.theme-label');
      if (label) label.textContent = theme === 'dark' ? 'Light' : 'Dark';
    }
  };

  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  applyTheme(savedTheme);

  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
    });
  }

  // 2. Mobile TOC toggle
  const tocBtn = document.getElementById('mobileTocBtn');
  const tocSidebar = document.getElementById('tocSidebar');
  if (tocBtn && tocSidebar) {
    tocBtn.addEventListener('click', () => {
      const open = tocSidebar.classList.toggle('is-open');
      tocBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    tocSidebar.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        tocSidebar.classList.remove('is-open');
        tocBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 3. Copy Code buttons (with file:// fallback)
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const targetId = btn.getAttribute('data-copy-target');
      let text = '';
      if (targetId) {
        const el = document.getElementById(targetId);
        text = el ? el.innerText : '';
      } else {
        const block = btn.closest('.code-block');
        const codeEl = block ? block.querySelector('pre code, pre') : null;
        text = codeEl ? codeEl.innerText : btn.getAttribute('data-copy-text') || '';
      }
      if (!text) return;

      let ok = false;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
          ok = true;
        }
      } catch (e) {}

      if (!ok) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
          ok = document.execCommand('copy');
        } catch (e) {}
        document.body.removeChild(ta);
      }

      if (ok) {
        const original = btn.innerHTML;
        btn.classList.add('is-copied');
        btn.textContent = 'Đã copy';
        setTimeout(() => {
          btn.classList.remove('is-copied');
          btn.innerHTML = original;
        }, 1500);
      }
    });
  });

  // 4. In-page Search filter
  const searchInput = document.getElementById('docSearch');
  const emptyNotice = document.getElementById('emptySearch');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      const items = document.querySelectorAll('[data-searchable]');
      let visibleCount = 0;

      if (!q) {
        items.forEach((el) => el.classList.remove('is-hidden'));
        if (emptyNotice) emptyNotice.classList.add('is-hidden');
        return;
      }

      items.forEach((el) => {
        const text = (el.textContent || '').toLowerCase();
        const match = text.includes(q);
        el.classList.toggle('is-hidden', !match);
        if (match) visibleCount++;
      });

      if (emptyNotice) {
        emptyNotice.classList.toggle('is-hidden', visibleCount > 0);
      }
    });
  }

  // 5. Generic Category Filter Pills ([data-filter-group])
  document.querySelectorAll('[data-filter-group]').forEach((bar) => {
    const group = bar.getAttribute('data-filter-group');
    const pills = bar.querySelectorAll('[data-filter-val]');
    const targets = document.querySelectorAll(`[data-filter-item="${group}"]`);

    pills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const val = pill.getAttribute('data-filter-val');
        pills.forEach((p) => p.classList.remove('is-active'));
        pill.classList.add('is-active');

        targets.forEach((row) => {
          const cat = row.getAttribute('data-filter-cat') || '';
          const show = val === 'all' || cat.split(',').includes(val);
          row.classList.toggle('is-hidden', !show);
        });
      });
    });
  });

  // 6. Sticky TOC ScrollSpy
  const tocLinks = Array.from(document.querySelectorAll('.toc-link'));
  const sections = tocLinks
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  if (tocLinks.length && sections.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = '#' + entry.target.id;
            tocLinks.forEach((l) => {
              l.classList.toggle('is-active', l.getAttribute('href') === id);
            });
          }
        });
      },
      { rootMargin: '-80px 0px -65% 0px', threshold: 0.05 }
    );
    sections.forEach((sec) => observer.observe(sec));
  }

  // 7. Interactive Responsive Simulator (iframe-embed.html)
  const simBtns = document.querySelectorAll('[data-sim-width]');
  const simFrame = document.getElementById('simFrame');
  const simCols = document.getElementById('simCols');
  const simLabel = document.getElementById('simLabel');
  const simCol1 = document.getElementById('simCol1');
  const simCol2 = document.getElementById('simCol2');
  const simCol3 = document.getElementById('simCol3');

  if (simBtns.length && simFrame && simCols && simLabel) {
    const setSimMode = (widthPx) => {
      simBtns.forEach((b) => b.classList.toggle('is-active', b.getAttribute('data-sim-width') === String(widthPx)));
      if (widthPx < 768) {
        simFrame.style.maxInlineSize = '420px';
        simCols.style.gridTemplateColumns = '1fr';
        simLabel.textContent = `${widthPx}px (< 768px) — Chế độ 1 cột (Compact)`;
        simCol1.classList.add('is-hidden');
        simCol2.classList.remove('is-hidden');
        simCol3.classList.add('is-hidden');
      } else if (widthPx < 1280) {
        simFrame.style.maxInlineSize = '880px';
        simCols.style.gridTemplateColumns = '280px 1fr';
        simLabel.textContent = `${widthPx}px (768px–1279px) — Chế độ 2 cột (Split View)`;
        simCol1.classList.remove('is-hidden');
        simCol2.classList.remove('is-hidden');
        simCol3.classList.add('is-hidden');
      } else {
        simFrame.style.maxInlineSize = '100%';
        simCols.style.gridTemplateColumns = '240px 1fr 240px';
        simLabel.textContent = `${widthPx}px (>= 1280px) — Chế độ 3 cột (Full Desktop)`;
        simCol1.classList.remove('is-hidden');
        simCol2.classList.remove('is-hidden');
        simCol3.classList.remove('is-hidden');
      }
    };
    simBtns.forEach((btn) => {
      btn.addEventListener('click', () => setSimMode(Number(btn.getAttribute('data-sim-width'))));
    });
    setSimMode(960);
  }
})();
