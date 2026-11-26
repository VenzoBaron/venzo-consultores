/* Venzo Consultores — coreografía de desplazamiento, navegación y efectos de puntero.
 * Basado en Northlight (MIT).
 *
 * Un único bucle requestAnimationFrame lee window.scrollY y escribe transformaciones.
 * Las medidas (posiciones de secciones, anchos) se guardan en measure() y se refrescan
 * al redimensionar, al cargar fuentes y al cambiar el tamaño del contenido, de modo que
 * el bucle nunca fuerza el cálculo de la maquetación. Cada efecto depende solo de la
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

  /* Divide un texto en palabras (span), respetando los envoltorios [data-accent]. */
  function splitWords(el) {
    const out = [];
    if (!el) return out;
    const walk = (node, accent) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement('span');
            w.className = accent ? 'w w--accent' : 'w';
            w.textContent = part;
            frag.appendChild(w);
            out.push(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          walk(child, accent || child.hasAttribute('data-accent'));
        }
      });
    };
    walk(el, false);
    return out;
  }

  /* ───────────── Elementos ───────────── */
  const probe = $('.vh-probe');
  const nav = $('[data-nav]');
  const main = $('#top');
  const menu = $('#menu');
  const toggle = $('[data-menu-toggle]');
  const megaTrigger = $('[data-mega-trigger]');
  const mega = $('[data-mega]');

  const hero = { el: $('#hero'), scroll: $('[data-hero-scroll]'), copy: $('[data-hero-copy]'), hint: $('.hero__hint') };
  const sheet = $('#sheet');
  const valueBlocks = motion ? $$('[data-words]').map((el) => ({ el, words: splitWords(el), lit: -1 })) : [];

  const svc = {
    el: $('#servicios'),
    cards: $$('[data-card]'),
    shades: $$('[data-shade]'),
    titles: $$('[data-svc-title]'),
    bar: $('[data-svc-bar]'),
    act: 0,
    pinned: root.classList.contains('svc-pin'),
  };
  const st = { el: $('#statement'), track: $('[data-st-track]'), orb: $('[data-orb]') };
  st.words = motion ? splitWords(st.track) : [];
  const stage = { wrap: $('[data-stage-wrap]'), el: $('[data-stage]'), plates: $$('[data-plate]'), hot: false };
  const glow = { el: $('[data-glow]'), box: $('#empezar') };
  const reveals = $$('[data-reveal]').map((el) => {
    // Ventana del revelado como fracción del viewport: empieza cuando el borde superior del
    // elemento llega a `start` y termina en `end`. Una sección puede cambiarla con data-reveal-window.
    const win = el.closest('[data-reveal-window]');
    const [start, end] = win ? win.dataset.revealWindow.split(/\s+/).map(Number) : [1, 0.62];
    return {
      el,
      start,
      end,
      kind: el.dataset.reveal || 'up',
      // Un retardo escalonado (--d, segundos) se convierte en una línea de inicio más tardía.
      off: (parseFloat(el.style.getPropertyValue('--d')) || 0) * 0.3,
      p: 0,
      inner: $('.tile__reveal', el),
    };
  });
  const parallax = $$('[data-parallax]').map((el) => ({ el, box: el.closest('.tile'), f: parseFloat(el.dataset.parallax) || 0.07 }));

  /* ───────────── Medidas ───────────── */
  let VW = root.clientWidth;
  let VH = innerHeight;
  let docH = root.scrollHeight;
  let sheetTop = 0;

  function measure() {
    VW = root.clientWidth;
    VH = (probe && probe.offsetHeight) || innerHeight;
    docH = root.scrollHeight;
    sheetTop = sheet ? docTop(sheet) : 0;
    valueBlocks.forEach((b) => { b.top = docTop(b.el); b.h = b.el.offsetHeight; });
    if (svc.el) { svc.top = docTop(svc.el); svc.h = svc.el.offsetHeight; }
    if (st.el) {
      st.top = docTop(st.el); st.h = st.el.offsetHeight;
      st.tw = st.track.offsetWidth;
      st.centers = st.words.map((w) => w.offsetLeft + w.offsetWidth / 2);
    }
    if (stage.wrap) { stage.top = docTop(stage.wrap); stage.h = stage.wrap.offsetHeight; stage.scale = stage.el.offsetWidth / 380; }
    if (glow.box) { glow.top = docTop(glow.box); glow.h = glow.box.offsetHeight; }
    reveals.forEach((r) => { r.top = docTop(r.el); });
    parallax.forEach((p) => { p.top = docTop(p.box); p.h = p.box.offsetHeight; });
  }

  let measureRaf = 0;
  const remeasure = () => {
    cancelAnimationFrame(measureRaf);
    measureRaf = requestAnimationFrame(measure);
  };

  /* Servicios: pila fijada en escritorio con movimiento; lista directa en el resto. */
  const svcStep = () => Math.max(1, (svc.h - VH) / (svc.cards.length - 0.5));
  function setPinned(on) {
    if (svc.pinned === on) return;
    svc.pinned = on;
    root.classList.toggle('svc-pin', on);
    if (!on) {
      svc.cards.forEach((c) => { unset(c, 'transform'); unset(c, 'pointerEvents'); });
      svc.shades.forEach((s) => unset(s, 'opacity'));
      unset(svc.bar, 'transform');
    }
    S.svc = 0;
    svc.act = -1;
    measure();
  }

  /* ───────────── Revelados (vinculados al desplazamiento, reversibles) ───────────── */
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // Pinta un revelado con progreso p (0 = estado inicial oculto, 1 = completamente visible).
  function paintReveal(r, p) {
    const e = easeOut(p);
    const op = clamp(p * 1.6).toFixed(3);
    if (r.kind === 'clip') {
      set(r.el, 'clipPath', `inset(0 0 ${((1 - easeInOut(p)) * 100).toFixed(2)}% 0 round 6px)`);
      set(r.inner, 'transform', p >= 1 ? 'none' : `scale(${(1 + 0.18 * (1 - e)).toFixed(4)})`);
    } else if (r.kind === 'scale') {
      set(r.el, 'opacity', op);
      set(r.el, 'transform', p >= 1 ? 'none' : `scale(${(0.94 + 0.06 * e).toFixed(4)})`);
    } else {
      set(r.el, 'opacity', op);
      set(r.el, 'transform', p >= 1 ? 'none' : `translate3d(0, ${(32 * (1 - e)).toFixed(1)}px, 0)`);
    }
  }

  /* ───────────── Estado del bucle ───────────── */
  const S = { hero: 0, svc: 0, st: 0, stage: 0.5, hot: 0, mx: innerWidth / 2, my: innerHeight / 2, tx: innerWidth / 2, ty: innerHeight / 2 };
  let last = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) { last = now; return; }
    const dt = last ? Math.min(now - last, 64) : 16.667;
    last = now;
    const y = window.scrollY;

    // Puntero (suavizado): mueve el halo de la frase, la inclinación de las capas y el brillo final.
    S.mx = damp(S.mx, S.tx, 0.2, dt);
    S.my = damp(S.my, S.ty, 0.2, dt);
    let nx = S.mx / innerWidth - 0.5;
    let ny = S.my / innerHeight - 0.5;
    if (!fine) { nx = Math.sin(now / 3200) * 0.3; ny = Math.cos(now / 4100) * 0.3; } // deriva suave en táctil

    /* Portada — la hoja se desliza por encima */
    if (hero.el) {
      const raw = clamp(1 - (sheetTop - y) / VH);
      const p = S.hero = motion ? damp(S.hero, raw, 0.14, dt) : raw;
      set(hero.el, 'visibility', p > 0.995 ? 'hidden' : 'visible');
      if (p <= 0.995) {
        if (motion) {
          set(hero.scroll, 'transform', `scale(${(1 + 0.18 * p).toFixed(4)})`);
          set(hero.copy, 'transform', `translate3d(0, ${(-p * VH * 0.25).toFixed(1)}px, 0)`);
        }
        set(hero.scroll, 'opacity', (1 - 0.8 * p).toFixed(3));
        set(hero.copy, 'opacity', clamp(1 - p * 1.7).toFixed(3));
        set(hero.hint, 'opacity', clamp(1 - p * 4).toFixed(2));
      }
    }

    /* Propuesta — las palabras se iluminan en orden de lectura */
    for (const b of valueBlocks) {
      const top = b.top - y;
      const p = clamp((VH * 0.9 - top) / (b.h + VH * 0.35));
      const n = Math.min(b.words.length, Math.ceil(p * b.words.length));
      if (n !== b.lit) {
        b.words.forEach((w, i) => w.classList.toggle('is-lit', i < n));
        b.lit = n;
      }
    }

    /* Servicios — pila de tarjetas fijada (solo escritorio con movimiento) */
    if (svc.pinned && svc.el) {
      const top = svc.top - y;
      if (top < VH * 1.5 && top + svc.h > -VH * 0.5) {
        const N = svc.cards.length;
        const raw = clamp(-top / svcStep(), 0, N);
        const p = S.svc = damp(S.svc, raw, 0.16, dt);
        const act = clamp(Math.round(p), 0, N - 1);
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
        if (act !== svc.act) {
          svc.act = act;
          svc.titles.forEach((t, i) => {
            t.classList.toggle('is-active', i === act);
            if (i === act) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
          });
        }
        set(svc.bar, 'transform', `scaleY(${clamp(N > 1 ? p / (N - 1) : 1).toFixed(4)})`);
      }
    }

    /* Frase de marca — texto horizontal fijado */
    if (motion && st.el) {
      const top = st.top - y;
      if (top < VH * 1.2 && top + st.h > -VH * 0.2) {
        const raw = clamp(-top / Math.max(1, st.h - VH));
        const p = S.st = damp(S.st, raw, 0.12, dt);
        const x = VW * 0.6 - (st.tw - VW * 0.3) * p;
        set(st.track, 'transform', `translate3d(${x.toFixed(1)}px, 0, 0)`);
        const lim = VW * 0.62;
        st.words.forEach((w, i) => {
          const lit = x + st.centers[i] < lim;
          if (lit !== w._lit) { w._lit = lit; w.classList.toggle('is-lit', lit); }
        });
        set(st.orb, 'transform', `translate3d(${(p * 45 + nx * 10).toFixed(2)}vw, ${(p * 10 + ny * 12).toFixed(2)}vh, 0)`);
      }
    }

    /* Venzo — capas en 3D (una por área) */
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

    /* Cómo funciona — paralaje de los paneles */
    if (motion) {
      for (const pr of parallax) {
        const c = pr.top + pr.h / 2 - y;
        if (c < -VH || c > VH * 2) continue;
        set(pr.el, 'transform', `translate3d(0, ${((c - VH / 2) * -pr.f).toFixed(1)}px, 0)`);
      }
    }

    /* Llamada final — el brillo sigue al puntero */
    if (motion && glow.el) {
      const top = glow.top - y;
      if (top < VH && top + glow.h > 0) {
        set(glow.el, 'transform', `translate3d(${(nx * 30).toFixed(1)}vw, ${(ny * 24).toFixed(1)}vh, 0)`);
      }
    }

    /* Revelados: el progreso va de 0 (el borde superior cruza el inicio de su ventana) a 1
       (llega al final), así que al subir se rebobinan en pantalla. */
    if (motion) {
      const atBottom = y + innerHeight >= docH - 4;
      for (const r of reveals) {
        const top = r.top - y;
        if (r.p === 0 && top > VH * 1.2) continue; // todavía muy por debajo
        let target = clamp((VH * (r.start - r.off) - top) / (VH * (r.start - r.end)));
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
    setTimeout(() => root.classList.add('intro-out'), 1500);
    setTimeout(startHero, 1600);
    setTimeout(() => {
      const intro = $('.intro');
      if (intro) intro.remove();
      root.classList.remove('has-intro', 'intro-in', 'intro-out');
      try { sessionStorage.setItem('venzo-intro-vista', '1'); } catch (e) { /* modo privado */ }
    }, 2500);
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
  // Si la cabecera estaba oculta y recibe el foco del teclado, vuelve a mostrarse.
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

  // Mantiene el foco del teclado dentro del menú móvil (y su botón de cierre) mientras está abierto.
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (menuOpen) setMenu(false);
      if (megaOpen) setMega(false);
      return;
    }
    if (e.key !== 'Tab' || !menuOpen) return;
    const items = [toggle, ...$$('a, button', menu)];
    const i = items.indexOf(document.activeElement);
    if (e.shiftKey && (i <= 0)) { e.preventDefault(); items[items.length - 1].focus(); }
    else if (!e.shiftKey && (i === items.length - 1 || i === -1)) { e.preventDefault(); items[0].focus(); }
  });

  /* ───────────── Navegación interna ───────────── */
  const navOffset = () => (nav ? nav.querySelector('.nav__bar').offsetHeight : 0) + 16;
  function scrollToY(top, instant) {
    window.scrollTo({ top: Math.max(0, top), behavior: motion && !instant ? 'smooth' : 'auto' });
  }
  // Posición de desplazamiento que deja a la vista la tarjeta i.
  function cardY(i) {
    if (svc.pinned) return svc.top + svcStep() * i;
    return docTop(svc.cards[i]) - navOffset();
  }

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
    const ci = svc.cards.indexOf(target);
    let top;
    if (ci >= 0) top = cardY(ci);
    else if (target === main || target === svc.el || target === st.el) top = docTop(target);
    else top = docTop(target) - navOffset();
    scrollToY(top);
    // Lleva también el foco del teclado al destino.
    const focusEl = ci >= 0 ? (target.querySelector('a') || target) : target;
    if (!focusEl.matches('a, button')) focusEl.setAttribute('tabindex', '-1');
    jumping = true;
    focusEl.focus({ preventScroll: true });
    jumping = false;
  });

  let jumping = false;
  // Con teclado, al entrar el foco en una tarjeta de la pila fijada, se desplaza hasta ella.
  svc.cards.forEach((card, i) => {
    card.addEventListener('focusin', () => {
      if (!svc.pinned || jumping) return;
      const want = cardY(i);
      if (Math.abs(window.scrollY - want) > 4) scrollToY(want, true);
    });
  });

  /* ───────────── Efectos de puntero (puntero fino y con movimiento) ───────────── */
  if (fine) addEventListener('mousemove', (e) => { S.tx = e.clientX; S.ty = e.clientY; }, { passive: true });

  if (motion && fine) {
    const settle = 'transform .8s cubic-bezier(.2,.7,.1,1), background-color .3s, color .3s, border-color .3s';
    $$('[data-magnetic]').forEach((el) => {
      let ox = 0;
      let oy = 0;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left - ox + r.width / 2);
        const dy = e.clientY - (r.top - oy + r.height / 2);
        ox = dx * 0.16;
        oy = dy * 0.16;
        el.style.transition = 'transform .25s ease-out, background-color .3s, color .3s, border-color .3s';
        el.style.transform = `translate3d(${ox.toFixed(1)}px, ${oy.toFixed(1)}px, 0)`;
      });
      el.addEventListener('mouseleave', () => {
        ox = 0;
        oy = 0;
        el.style.transition = settle;
        el.style.transform = '';
      });
    });

    $$('[data-tilt]').forEach((el) => {
      const layer = $('[data-depth]', el);
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - r.left) / r.width - 0.5;
        const dy = (e.clientY - r.top) / r.height - 0.5;
        el.style.transition = 'transform .2s ease-out';
        el.style.transform = `perspective(1400px) rotateX(${(-dy * 5).toFixed(2)}deg) rotateY(${(dx * 6).toFixed(2)}deg)`;
        layer.style.transition = 'transform .2s ease-out';
        layer.style.transform = `translate3d(${(-dx * 12).toFixed(1)}px, ${(-dy * 12).toFixed(1)}px, 0) scale(1.04)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transition = 'transform 1s cubic-bezier(.2,.7,.1,1)';
        el.style.transform = 'perspective(1400px) rotateX(0deg) rotateY(0deg)';
        layer.style.transition = 'transform 1s cubic-bezier(.2,.7,.1,1)';
        layer.style.transform = 'none';
      });
    });
  }

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
