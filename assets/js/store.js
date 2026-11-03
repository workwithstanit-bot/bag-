(() => {
  const PRICES = { standard: 34.99, team: 27, refill: 7.99, subscribe: 6.99 };
  const TAX = 0.0825;
  const KEY = 'mudvault-bag';
  const money = (n) => '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const save = (items) => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {} };
  let bag = load();

  const form = document.getElementById('config');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Gallery
  const main = document.getElementById('galleryMain');
  $$('.gallery-thumbs button').forEach(btn => btn.addEventListener('click', () => {
    $$('.gallery-thumbs button').forEach(b => b.classList.toggle('is-active', b === btn));
    main.src = btn.dataset.src; main.alt = btn.dataset.alt;
    syncTag();
  }));

  // Edition from URL (?edition=team)
  const params = new URLSearchParams(location.search);
  if (params.get('edition') === 'team') form.edition.value = 'team';

  let qty = 1;
  const qtyOut = form.querySelector('output[name="qty"]');
  $$('.stepper button').forEach(b => b.addEventListener('click', () => {
    qty = Math.min(10, Math.max(1, qty + Number(b.dataset.step)));
    qtyOut.textContent = qty;
    render();
  }));

  const idTag = document.getElementById('idTag');
  function syncTag() {
    const name = form.idname.value.trim();
    const onFront = main.src.includes('/hero');
    idTag.hidden = !(name && form.edition.value === 'standard' && onFront);
    idTag.textContent = name;
  }

  function current() {
    const edition = form.edition.value;
    const pods = form.pods.value;
    const isTeam = edition === 'team';
    const count = isTeam ? Math.floor(Number(form.teamqty.value) || 0) : qty;
    const unit = isTeam ? PRICES.team : PRICES.standard;
    const podsPrice = pods === 'refill' ? PRICES.refill : 0;
    return {
      edition, pods, isTeam, count, unit, podsPrice,
      size: 'Adult',
      idname: isTeam ? '' : form.idname.value.trim(),
      club: isTeam ? form.club.value.trim() : '',
      thread: isTeam ? form.thread.value : '',
      total: unit * count + podsPrice,
    };
  }

  function render() {
    const c = current();
    $$('[data-for]').forEach(fs => { fs.hidden = fs.dataset.for !== c.edition; });
    $('#sumLabel').textContent = `${c.isTeam ? 'Team edition' : 'MudVault'} x ${c.count || 0}`;
    $('#sumBags').textContent = money(c.unit * (c.count || 0));
    const podsRow = $('#sumPodsRow');
    podsRow.hidden = c.pods === 'none';
    if (c.pods === 'refill') { $('#sumPodsLabel').textContent = 'Refill 2-pack'; $('#sumPods').textContent = money(PRICES.refill); }
    if (c.pods === 'subscribe') { $('#sumPodsLabel').textContent = 'Refill subscription, first charge in 3 months'; $('#sumPods').textContent = '$0.00 today'; }
    $('#sumTotal').textContent = money(c.total);
    $('#teamError').hidden = true;
    syncTag();
  }

  form.addEventListener('change', render);
  form.addEventListener('input', render);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const c = current();
    const err = $('#teamError');
    if (c.isTeam) {
      if (!c.club) { err.textContent = 'Add your club name so we know whose crest goes on the bags.'; err.hidden = false; form.club.focus(); return; }
      if (c.count < 12) { err.textContent = 'Team orders start at 12 bags. Raise the number of bags to 12 or more.'; err.hidden = false; form.teamqty.focus(); return; }
      if (c.count > 500) { err.textContent = 'For more than 500 bags, split it into two orders.'; err.hidden = false; form.teamqty.focus(); return; }
    }
    bag.push({ id: Date.now().toString(36), ...c });
    save(bag);
    drawBag();
    openBag();
  });

  // Bag drawer
  const drawer = document.getElementById('bag');
  const scrim = $('.scrim');
  let lastFocus = null;
  function openBag() {
    lastFocus = document.activeElement;
    drawer.classList.add('is-open'); drawer.removeAttribute('inert'); drawer.setAttribute('aria-hidden', 'false');
    scrim.hidden = false;
    $('[data-close-bag]', drawer).focus();
  }
  function closeBag() {
    drawer.classList.remove('is-open'); drawer.setAttribute('inert', ''); drawer.setAttribute('aria-hidden', 'true');
    scrim.hidden = true;
    lastFocus && lastFocus.focus && lastFocus.focus();
  }
  $$('[data-open-bag]').forEach(b => b.addEventListener('click', openBag));
  $$('[data-close-bag]').forEach(b => b.addEventListener('click', closeBag));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeBag(); });

  function describe(item) {
    const lines = [];
    if (item.isTeam) lines.push(`${item.club} crest, ${item.thread.toLowerCase()} thread`);
    else lines.push(item.idname ? `Name window: ${item.idname}` : 'No name');
    lines.push(`${item.size}, qty ${item.count}`);
    if (item.pods === 'refill') lines.push('Plus a refill 2-pack');
    if (item.pods === 'subscribe') lines.push('Refill subscription, $6.99 every 3 months');
    return lines;
  }

  function itemNode(item, removable) {
    const li = document.createElement('li');
    const img = document.createElement('img');
    img.src = '/assets/img/hero-960.webp'; img.alt = '';
    const meta = document.createElement('div'); meta.className = 'meta';
    const title = document.createElement('b'); title.textContent = item.isTeam ? 'MudVault Team edition' : 'MudVault';
    meta.append(title);
    describe(item).forEach(t => { const s = document.createElement('span'); s.textContent = t; meta.append(s); });
    const price = document.createElement('div'); price.className = 'price';
    const p = document.createElement('span'); p.textContent = money(item.total);
    price.append(p);
    if (removable) {
      const rm = document.createElement('button'); rm.type = 'button'; rm.className = 'link-btn'; rm.textContent = 'Remove';
      rm.setAttribute('aria-label', `Remove ${title.textContent} from bag`);
      rm.addEventListener('click', () => { bag = bag.filter(b => b.id !== item.id); save(bag); drawBag(); });
      price.append(rm);
    }
    li.append(img, meta, price);
    return li;
  }

  const subtotal = () => bag.reduce((s, i) => s + i.total, 0);

  function drawBag() {
    const list = $('[data-bag-items]');
    list.replaceChildren(...bag.map(i => itemNode(i, true)));
    $('[data-bag-empty]').hidden = bag.length > 0;
    $('[data-bag-foot]').hidden = bag.length === 0;
    $('[data-bag-subtotal]').textContent = money(subtotal());
    $$('[data-bag-count]').forEach(n => { n.textContent = bag.reduce((s, i) => s + i.count, 0); });
  }

  // Checkout (demo only)
  const dialog = document.getElementById('checkout');
  $('[data-checkout]').addEventListener('click', () => {
    if (!bag.length) return;
    const sub = subtotal(), tax = sub * TAX;
    $('[data-review-items]').replaceChildren(...bag.map(i => itemNode(i, false)));
    $('[data-review-subtotal]').textContent = money(sub);
    $('[data-review-tax]').textContent = money(tax);
    $('[data-review-total]').textContent = money(sub + tax);
    $('[data-review]').hidden = false; $('[data-done]').hidden = true;
    closeBag();
    dialog.showModal ? dialog.showModal() : dialog.setAttribute('open', '');
  });
  $('[data-place]').addEventListener('click', () => {
    const n = 'MV-' + Math.floor(10000 + Math.random() * 89999);
    $('[data-order-number]').textContent = n;
    $('[data-review]').hidden = true; $('[data-done]').hidden = false;
    bag = []; save(bag); drawBag();
  });
  $$('[data-close-checkout]').forEach(b => b.addEventListener('click', () => {
    dialog.close ? dialog.close() : dialog.removeAttribute('open');
    if (!$('[data-done]').hidden) return;
    openBag();
  }));

  render();
  drawBag();
})();
