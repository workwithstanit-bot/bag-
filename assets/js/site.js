(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hero film: respect reduced motion
  const hero = document.getElementById('heroFilm');
  if (hero && reduceMotion) { hero.removeAttribute('autoplay'); hero.pause(); }

  // Sticky "Scrape. Catch. Refresh." scene
  const scene = document.querySelector('[data-steps]');
  if (scene) {
    const steps = [...scene.querySelectorAll('.step')];
    const shots = [...scene.querySelectorAll('.steps-media img')];
    const fill = scene.querySelector('.chalk-fill');
    let current = 0;
    const set = (i) => {
      if (i === current) return;
      current = i;
      steps.forEach((s, n) => s.classList.toggle('is-active', n === i));
      shots.forEach((s, n) => s.classList.toggle('is-active', n === i));
    };
    const onScroll = () => {
      if (window.innerWidth <= 860) return;
      const r = scene.getBoundingClientRect();
      const total = scene.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / total));
      if (fill) fill.style.setProperty('--p', (p * 100).toFixed(1) + '%');
      set(Math.min(steps.length - 1, Math.floor(p * steps.length * 0.999)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  // Hotspots on the product photo
  const stage = document.querySelector('[data-hotspots]');
  if (stage) {
    const card = document.createElement('div');
    card.className = 'hotspot-card';
    card.hidden = true;
    card.setAttribute('role', 'status');
    stage.appendChild(card);
    const dots = [...stage.querySelectorAll('.hotspot')];
    const close = () => { card.hidden = true; dots.forEach(d => d.setAttribute('aria-expanded', 'false')); };
    dots.forEach(dot => {
      dot.setAttribute('aria-label', dot.dataset.title);
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = dot.getAttribute('aria-expanded') === 'true';
        close();
        if (open) return;
        dot.setAttribute('aria-expanded', 'true');
        card.innerHTML = '';
        const h = document.createElement('h4'); h.textContent = dot.dataset.title;
        const p = document.createElement('p'); p.textContent = dot.dataset.body;
        card.append(h, p);
        card.hidden = false;
        const x = parseFloat(dot.style.left), y = parseFloat(dot.style.top);
        card.style.left = x > 55 ? '' : `calc(${x}% + 28px)`;
        card.style.right = x > 55 ? `calc(${100 - x}% + 28px)` : '';
        card.style.top = y > 60 ? '' : `calc(${y}% - 10px)`;
        card.style.bottom = y > 60 ? `calc(${100 - y}% - 10px)` : '';
      });
    });
    document.addEventListener('click', (e) => { if (!stage.contains(e.target)) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    // Show the scraper fins by default so people know the dots are tappable
    const fins = dots[1];
    if (fins) fins.click();
  }

  // Film dialog
  const dialog = document.getElementById('filmDialog');
  const player = document.getElementById('filmPlayer');
  document.querySelectorAll('[data-open-film]').forEach(b => b.addEventListener('click', () => {
    if (!dialog) return;
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
    player && player.play().catch(() => {});
  }));
  const closeFilm = () => { player && player.pause(); dialog && dialog.close ? dialog.close() : dialog.removeAttribute('open'); };
  document.querySelectorAll('[data-close-film]').forEach(b => b.addEventListener('click', closeFilm));
  dialog && dialog.addEventListener('click', (e) => { if (e.target === dialog) closeFilm(); });
  dialog && dialog.addEventListener('close', () => player && player.pause());
})();
