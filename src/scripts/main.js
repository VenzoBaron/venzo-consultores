/* Venzo Consultores — coreografía de desplazamiento, navegación y efectos de puntero.
 * Basado en Northlight (MIT).
 *
 * Un único bucle requestAnimationFrame lee window.scrollY y escribe transformaciones.
 * Las medidas se guardan en measure() y se refrescan al redimensionar, al cargar
 * fuentes y al cambiar el tamaño del contenido (p. ej. al desplegar EfectivaMente),
 * de modo que el bucle nunca fuerza la maquetación. Cada efecto depende solo de la
 * posición de desplazamiento (suavizada), así que todo se rebobina al subir.
 */
(() => {
  'use strict';

  const root = document.documentElement;
  const motion = root.classList.contains('motion');
  const canHover = matchMedia('(hover: hover)').matches;
  const fine = canHover && matchMedia('(pointer: fine)').matches;
  const pinQuery = matchMedia('(min-width: 900px) and (min-height: 600px)');

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  // Interpolación independiente de la tasa de fotogramas; f es el factor por fotograma a 60 fps.
  const damp = (cur, target, f, dt) => {
    const v = cur + (target - cur) * (1 - Math.pow(1 - f, dt / 16.667));
    return Math.abs(target - v) < 0.0005 ? target : v;
  };
  // Posición en el documento según la maquetación (ignora transformaciones).
  const docTop = (el) => { let y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; };
  // Escribe una propiedad de estilo solo cuando cambia su valor.
  const set = (el, prop, val) => {
    if (!el || el['_' + prop] === val) return;
    el['_' + prop] = val;
    el.style[prop] = val;
  };
  const unset = (el, prop) => { if (!el) return; el['_' + prop] = undefined; el.style[prop] = ''; };

  /* ───────────── Elementos ───────────── */
  const probe = $('.vh-probe');
  const nav = $('[data-nav]');
  const navBar = $('.nav__bar');
  const main = $('#top');
  const menu = $('#menu');
  const toggle = $('[data-menu-toggle]');
  const megaTrigger = $('[data-mega-trigger]');
  const mega = $('[data-mega]');

  const hero = { el: $('#hero'), copy: $('[data-hero-copy]'), sticky: false };
  const sheet = $('#sheet');

  const svc = {
    el: $('#servicios'),
    stack: $('[data-svc-stack]'),
    cards: $$('[data-card]'),          // tarjetas de la pila animada
    targets: $$('[data-svc-target]'),  // todas las tarjetas de servicio (destinos de los accesos)
    shades: $$('[data-shade]'),
    titles: $$('[data-svc-title]'),
    bar: $('[data-svc-bar]'),
    active: '',
    pinned: root.classList.contains('svc-pin'),
  };
  const stage = { wrap: $('[data-stage-wrap]'), el: $('[data-stage]'), plates: $$('[data-plate]'), hot: false };
  const reveals = $$('[data-reveal]').map((el) => ({
    el,
    // Un retardo escalonado (--d, segundos) se convierte en una línea de inicio más tardía.
    off: (parseFloat(el.style.getPropertyValue('--d')) || 0) * 0.3,
    p: 0,
  }));

  /* ───────────── Medidas ───────────── */
  let VH = innerHeight;
  let docH = root.scrollHeight;
  let heroH = 0;

  function measure() {
    VH = (probe && probe.offsetHeight) || innerHeight;
    docH = root.scrollHeight;
    if (hero.el) {
      heroH = hero.el.offsetHeight;
      // La portada solo se fija si cabe entera en pantalla; si no, se desplaza con normalidad.
      const sticky = motion && heroH <= VH;
      if (sticky !== hero.sticky) {
        hero.sticky = sticky;
        hero.el.classList.toggle('is-sticky', sticky);
        if (!sticky) { unset(hero.copy, 'transform'); unset(hero.copy, 'opacity'); unset(hero.el, 'visibility'); }
      }
    }
    if (svc.stack) { svc.top = docTop(svc.stack); svc.h = svc.stack.offsetHeight; }
    svc.before = svc.targets.filter((t) => !svc.cards.includes(t)).map((t) => ({ id: t.id, top: docTop(t) }));
    if (stage.wrap) { stage.top = docTop(stage.wrap); stage.h = stage.wrap.offsetHeight; stage.scale = stage.el.offsetWidth / 380; }
    reveals.forEach((r) => { r.top = docTop(r.el); });
  }

  let measureRaf = 0;
  const remeasure = () => {
    cancelAnimationFrame(measureRaf);
    measureRaf = requestAnimationFrame(measure);
  };

  /* Servicios: pila fijada en escritorio con movimiento; lista directa en el resto. */
  const svcStep = () => Math.max(1, (svc.h - VH) / Math.max(svc.cards.length - 0.5, 0.5));
  function setPinned(on) {
    if (svc.pinned === on) return;
    svc.pinned = on;
    root.classList.toggle('svc-pin', on);
    if (!on) {
      svc.cards.forEach((c) => { unset(c, 'transform'); unset(c, 'pointerEvents'); });
      svc.shades.forEach((s) => unset(s, 'opacity'));
      unset(svc.bar, 'transform');
      setActive('');
    }
    S.svc = 0;
    measure();
  }
  function setActive(id) {
    if (id === svc.active) return;
    svc.active = id;
    svc.titles.forEach((t) => {
      const on = t.dataset.svcId === id;
      t.classList.toggle('is-active', on);
      if (on) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
    });
  }

  /* ───────────── Revelados (vinculados al desplazamiento, reversibles) ───────────── */
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  function paintReveal(r, p) {
    const e = easeOut(p);
    set(r.el, 'opacity', clamp(p * 1.6).toFixed(3));
    set(r.el, 'transform', p >= 1 ? 'none' : `translate3d(0, ${(32 * (1 - e)).toFixed(1)}px, 0)`);
  }

  /* ───────────── Estado del bucle ───────────── */
  const S = { hero: 0, svc: 0, stage: 0.5, hot: 0, mx: innerWidth / 2, my: innerHeight / 2, tx: innerWidth / 2, ty: innerHeight / 2 };
  let snapSvc = false;
  let last = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) { last = now; return; }
    const dt = last ? Math.min(now - last, 64) : 16.667;
    last = now;
    const y = window.scrollY;

    S.mx = damp(S.mx, S.tx, 0.2, dt);
    S.my = damp(S.my, S.ty, 0.2, dt);
    let nx = S.mx / innerWidth - 0.5;
    let ny = S.my / innerHeight - 0.5;
    if (!fine) { nx = Math.sin(now / 3200) * 0.3; ny = Math.cos(now / 4100) * 0.3; }

    /* Portada — la hoja se desliza por encima (solo si la portada está fijada) */
    if (hero.sticky) {
      const raw = clamp(y / Math.max(heroH, 1));
      const p = S.hero = damp(S.hero, raw, 0.14, dt);
      set(hero.el, 'visibility', p > 0.995 ? 'hidden' : 'visible');
      if (p <= 0.995) {
        set(hero.copy, 'transform', `translate3d(0, ${(-p * heroH * 0.2).toFixed(1)}px, 0)`);
        set(hero.copy, 'opacity', clamp(1 - p * 1.5).toFixed(3));
      }
    }

    /* Servicios — pila de tarjetas fijada (solo escritorio con movimiento) */
    if (svc.pinned && svc.stack && svc.cards.length) {
      const top = svc.top - y;
      const N = svc.cards.length;
      const raw = clamp(-top / svcStep(), 0, N);
      const p = S.svc = snapSvc ? raw : damp(S.svc, raw, 0.16, dt);
      snapSvc = false;
      const act = clamp(Math.round(p), 0, N - 1);
      if (top < VH * 1.5 && top + svc.h > -VH * 0.5) {
        svc.cards.forEach((card, i) => {
          const a = clamp(p - (i - 1));
          const e = 1 - Math.pow(1 - a, 3);
          const d = i < N - 1 ? clamp(p - i, 0, 2) : 0;
          const ty = (1 - e) * VH * 1.1 - d * 20;
          const s = 1 - d * 0.045;
          set(card, 'transform', `translate3d(0, ${ty.toFixed(1)}px, 0) scale(${s.toFixed(4)})`);
          set(card, 'pointerEvents', i === act ? 'auto' : 'none');
          set(svc.shades[i], 'opacity', (Math.min(d, 1) * 0.6 + Math.max(d - 1, 0) * 0.3).toFixed(3));
        });
      }
      // Servicio activo en la navegación lateral: los destacados (antes de la pila) o la tarjeta visible.
      let id = svc.cards[act].id;
      if (top > VH * 0.35) {
        id = svc.before.length ? svc.before[0].id : svc.cards[0].id;
        for (const t of svc.before) if (t.top - y < VH * 0.5) id = t.id;
      }
      setActive(id.replace(/^servicio-/, ''));
      const total = svc.targets.length;
      const idx = svc.targets.findIndex((t) => t.id === id);
      set(svc.bar, 'transform', `scaleY(${clamp(total > 1 ? idx / (total - 1) : 1).toFixed(4)})`);
    }

    /* Qué es Venzo — capas en 3D (una por servicio) */
    if (stage.wrap) {
      const top = stage.top - y;
      if (top < VH * 1.3 && top + stage.h > -VH * 0.3) {
        const raw = clamp((VH - top) / (VH + stage.h));
        const p = S.stage = motion ? damp(S.stage, raw, 0.1, dt) : 0.5;
        const hot = S.hot = motion ? damp(S.hot, stage.hot ? 1 : 0, 0.08, dt) : 0;
        const k = 4 / Math.max(stage.plates.length, 2); // misma altura total con más o menos capas
        const spread = ((motion ? 36 + 110 * Math.sin(p * Math.PI) : 60) + hot * 40) * stage.scale * k;
        const rz = -34 + (motion ? (p - 0.5) * 56 : 0) + (motion ? nx * 10 * hot : 0);
        const rx = 56 - (motion ? ny * 12 * hot : 0);
        const mid = (stage.plates.length - 1) / 2;
        set(stage.el, 'transform', `rotateX(${rx.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg)`);
        stage.plates.forEach((pl, i) => set(pl, 'transform', `translate3d(0, 0, ${((i - mid) * spread).toFixed(1)}px)`));
      }
    }

    /* Revelados: progreso de 0 (el borde superior entra por abajo) a 1 (al 62 % del viewport). */
    if (motion) {
      const atBottom = y + innerHeight >= docH - 4;
      for (const r of reveals) {
        const top = r.top - y;
        if (r.p === 0 && top > VH * 1.2) continue;
        let target = clamp((VH * (1 - r.off) - top) / (VH * 0.38));
        if (atBottom && top < VH) target = 1;
        r.p = damp(r.p, target, 0.12, dt);
        paintReveal(r, r.p);
      }
    }
  }

  /* ───────────── Telón de entrada y portada ───────────── */
  const startHero = () => root.classList.add('hero-in');
  if (root.classList.contains('has-intro')) {
    setTimeout(() => root.classList.add('intro-in'), 60);
    setTimeout(() => root.classList.add('intro-out'), 1300);
    setTimeout(startHero, 1400);
    setTimeout(() => {
      const intro = $('.intro');
      if (intro) intro.remove();
      root.classList.remove('has-intro', 'intro-in', 'intro-out');
      try { sessionStorage.setItem('venzo-intro-vista', '1'); } catch (e) { /* modo privado */ }
    }, 2300);
  } else {
    setTimeout(startHero, 80);
  }

  /* ───────────── Cabecera: fondo, ocultación al bajar, menú de servicios ───────────── */
  let navLastY = window.scrollY;
  let navHidden = false;
  let menuOpen = false;
  let megaOpen = false;
  let megaTimer = 0;

  function syncNav() {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 8);
    nav.classList.toggle('is-glass', y > 8 || menuOpen || megaOpen);
    nav.classList.toggle('is-hidden', navHidden && !menuOpen && !megaOpen && !nav.contains(document.activeElement));
    nav.classList.toggle('is-mega', megaOpen);
  }

  function onScroll() {
    const y = window.scrollY;
    const d = y - navLastY;
    if (y < 160) navHidden = false;
    else if (d > 6) navHidden = true;
    else if (d < -6) navHidden = false;
    if (Math.abs(d) > 6 || y < 160) navLastY = y;
    if (megaOpen && Math.abs(d) > 6) setMega(false);
    syncNav();
  }

  function setMega(open) {
    clearTimeout(megaTimer);
    if (megaOpen === open) return;
    megaOpen = open;
    syncNav();
  }

  if (canHover && megaTrigger && mega) {
    [megaTrigger, mega].forEach((el) => {
      el.addEventListener('mouseenter', () => setMega(true));
      el.addEventListener('mouseleave', () => {
        clearTimeout(megaTimer);
        megaTimer = setTimeout(() => setMega(false), 140);
      });
    });
  }
  nav.addEventListener('focusin', () => { navHidden = false; syncNav(); });

  /* ───────────── Menú móvil ───────────── */
  function setMenu(open) {
    if (menuOpen === open) return;
    menuOpen = open;
    root.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    document.body.style.overflow = open ? 'hidden' : '';
    main.inert = open;
    if (open) {
      navHidden = false;
      menu.focus({ preventScroll: true });
    } else if (menu.contains(document.activeElement)) {
      toggle.focus({ preventScroll: true });
    }
    syncNav();
  }
  toggle.addEventListener('click', () => setMenu(!menuOpen));

  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (menuOpen) setMenu(false);
      if (megaOpen) setMega(false);
      return;
    }
    if (e.key !== 'Tab' || !menuOpen) return;
    const items = [toggle, ...$$('a, button', menu)];
    const i = items.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
    else if (!e.shiftKey && (i === items.length - 1 || i === -1)) { e.preventDefault(); items[0].focus(); }
  });

  /* ───────────── Navegación interna ───────────── */
  // Altura de la cabecera compacta + margen: el encabezado del destino queda siempre a la vista.
  const navOffset = () => (navBar ? Math.min(navBar.offsetHeight, 80) : 72) + 20;
  function scrollToY(top, instant) {
    window.scrollTo({ top: Math.max(0, Math.round(top)), behavior: motion && !instant ? 'smooth' : 'auto' });
  }
  // Posición de desplazamiento que deja a la vista un servicio.
  function serviceY(target) {
    const j = svc.cards.indexOf(target);
    if (svc.pinned && j >= 0) return svc.top + svcStep() * j;
    return docTop(target) - navOffset();
  }

  let jumping = false;
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    const hash = a.getAttribute('href');
    if (hash === '#') { e.preventDefault(); return; }
    const target = hash === '#top' ? main : document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    setMenu(false);
    setMega(false);
    measure();
    const isService = svc.targets.includes(target);
    let top;
    if (isService) top = serviceY(target);
    else if (target === main) top = 0;
    else top = docTop(target) - (target === svc.el ? 0 : navOffset());
    // A un servicio se llega de forma directa (sin recorrer las tarjetas anteriores).
    if (isService) {
      scrollToY(top, true);
      snapSvc = true;
      navHidden = true;
      syncNav();
    } else {
      scrollToY(top);
    }
    // Lleva también el foco del teclado al destino.
    if (!target.matches('a, button, [tabindex]')) target.setAttribute('tabindex', '-1');
    jumping = true;
    target.focus({ preventScroll: true });
    jumping = false;
  });

  // Con teclado, al entrar el foco en una tarjeta de la pila fijada, se desplaza hasta ella.
  svc.cards.forEach((card) => {
    card.addEventListener('focusin', () => {
      if (!svc.pinned || jumping) return;
      const want = serviceY(card);
      if (Math.abs(window.scrollY - want) > 4) { scrollToY(want, true); snapSvc = true; }
    });
  });

  /* ───────────── EfectivaMente: selector interno (Particulares / Empresas y profesionales) ───────────── */
  $$('[data-efm]').forEach((box) => {
    const opts = $$('[data-efm-opt]', box);
    const panels = opts.map((o) => document.getElementById(o.getAttribute('aria-controls')));
    opts.forEach((opt, i) => {
      opt.addEventListener('click', () => {
        const open = opt.getAttribute('aria-expanded') !== 'true';
        opts.forEach((o, k) => {
          const on = open && k === i;
          o.setAttribute('aria-expanded', String(on));
          if (panels[k]) panels[k].classList.toggle('is-open', on);
        });
        remeasure();
      });
    });
  });

  /* ───────────── Efectos de puntero ───────────── */
  if (fine) addEventListener('mousemove', (e) => { S.tx = e.clientX; S.ty = e.clientY; }, { passive: true });

  if (stage.wrap && motion) {
    if (canHover) {
      stage.wrap.addEventListener('mouseenter', () => { stage.hot = true; });
      stage.wrap.addEventListener('mouseleave', () => { stage.hot = false; });
    } else {
      stage.wrap.addEventListener('click', () => { stage.hot = !stage.hot; });
    }
  }

  /* ───────────── Arranque ───────────── */
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => {
    if (menuOpen && innerWidth >= 900) setMenu(false);
    if (motion) setPinned(pinQuery.matches);
    remeasure();
  });
  addEventListener('load', remeasure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
  if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(document.body);

  measure();
  syncNav();
  requestAnimationFrame(frame);
})();
