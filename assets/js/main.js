/* Banca Martins · interações e animações */
(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  // ---------- Datas ----------
  const todayISO = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  const parseSessions = (str = '') => str.split(';').filter(Boolean).map((s) => { const [start, end, place] = s.split('|'); return { start, end: end || start, place: place || '' }; });
  const nextSession = (sessions) => sessions.find((s) => s.end >= todayISO) || null;
  const daysUntil = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return Math.round((new Date(y, m - 1, d) - t) / 86400000);
  };

  // ---------- Toast ----------
  const toastEl = $('[data-toast]');
  let toastTimer;
  const toast = (msg) => {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2600);
  };
  const copyText = async (text) => {
    try { await navigator.clipboard.writeText(text); return true; }
    catch {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy'); ta.remove(); return ok;
    }
  };

  // ---------- Texto dividido em palavras ----------
  $$('[data-split]').forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map((w, i) => `<span class="w" aria-hidden="true"><span style="--wi:${i}">${w}</span></span>`).join(' ');
  });

  // ---------- Carregamento ----------
  const onLoaded = () => {
    requestAnimationFrame(() => {
      root.classList.add('is-loaded');
      $$('[data-split]').forEach((el) => { if (!el.closest('[data-slide]')) el.classList.add('is-in'); });
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onLoaded); else onLoaded();
  window.addEventListener('pageshow', (e) => { if (e.persisted) root.classList.remove('is-leaving'); });

  // Transição suave entre páginas
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a || reduceMotion || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return;
    if (url.pathname === location.pathname && url.hash) return;
    e.preventDefault();
    root.classList.add('is-leaving');
    setTimeout(() => { location.href = url.href; }, 220);
  });

  // ---------- Header ----------
  const header = $('[data-header]');
  const toTop = $('[data-to-top]');
  let lastY = window.scrollY;
  let ticking = false;
  const heroInner = $('.hero-inner');
  const onScroll = () => {
    const y = window.scrollY;
    if (header) {
      header.classList.toggle('is-scrolled', y > 20);
      if (!document.body.classList.contains('menu-open')) header.classList.toggle('is-hidden', y > 480 && y > lastY + 2);
      if (y < lastY - 2) header.classList.remove('is-hidden');
    }
    toTop?.classList.toggle('is-visible', y > 700);
    if (heroInner && !reduceMotion && y < window.innerHeight) {
      heroInner.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
      heroInner.style.opacity = String(Math.max(0, 1 - y / (window.innerHeight * 0.85)));
    }
    lastY = y;
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();
  toTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  // ---------- Menu mobile ----------
  const menuBtn = $('[data-menu-toggle]');
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    menuBtn?.setAttribute('aria-expanded', String(open));
    menuBtn?.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  };
  menuBtn?.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $$('[data-mobile-menu] a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  window.addEventListener('resize', () => { if (window.innerWidth > 1020) setMenu(false); });

  // ---------- Revelar ao rolar ----------
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('is-in');
      revealIO.unobserve(el);
      const delay = (parseFloat(getComputedStyle(el).getPropertyValue('--i')) || 0) * 90;
      setTimeout(() => el.removeAttribute('data-reveal'), 1100 + delay);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('[data-reveal]').forEach((el) => revealIO.observe(el));

  // ---------- Contadores ----------
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      countIO.unobserve(el);
      const target = Number(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      if (reduceMotion) { el.textContent = target + suffix; return; }
      const dur = 1600;
      const t0 = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => countIO.observe(el));

  // ---------- Luzes (bokeh) ----------
  $$('[data-bokeh]').forEach((canvas) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // No tema claro as luzes ficam em cores mais fortes e sem o efeito de "somar luz" (que some no branco)
    const light = root.dataset.theme === 'light';
    const colors = light ? ['255,190,20', '255,150,40', '60,100,230', '235,80,160'] : ['255,201,40', '255,160,60', '90,130,255', '255,100,180', '255,255,255'];
    let w = 0, h = 0, dpr = 1, particles = [], running = false, raf;
    const resize = () => {
      // No celular a barra de endereço muda a altura ao rolar: só recria as partículas se a largura mudar
      const sameWidth = canvas.clientWidth === w && particles.length;
      dpr = Math.min(window.devicePixelRatio || 1, canvas.clientWidth < 760 ? 1.5 : 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (sameWidth) return;
      // menos partículas no celular para economizar bateria
      const count = Math.round(Math.min(w < 760 ? 14 : 46, (w * h) / 26000));
      particles = Array.from({ length: count }, () => spawn(true));
    };
    const spawn = (anywhere) => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 40,
      r: 2 + Math.random() * 16,
      vy: 0.12 + Math.random() * 0.45,
      vx: (Math.random() - 0.5) * 0.2,
      a: 0.05 + Math.random() * 0.28,
      c: colors[Math.floor(Math.random() * colors.length)],
      tw: Math.random() * Math.PI * 2,
    });
    // Um "sprite" desfocado por cor, desenhado uma única vez
    const sprites = Object.fromEntries(colors.map((c) => {
      const s = document.createElement('canvas');
      s.width = s.height = 64;
      const sc = s.getContext('2d');
      const g = sc.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, `rgba(${c},1)`);
      g.addColorStop(1, `rgba(${c},0)`);
      sc.fillStyle = g; sc.fillRect(0, 0, 64, 64);
      return [c, s];
    }));
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = light ? 'source-over' : 'lighter';
      particles.forEach((p, i) => {
        p.y -= p.vy; p.x += p.vx; p.tw += 0.02;
        if (p.y < -40) particles[i] = spawn(false);
        ctx.globalAlpha = p.a * (0.7 + Math.sin(p.tw) * 0.3) * (light ? 0.55 : 1);
        ctx.drawImage(sprites[p.c], p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      });
      ctx.globalAlpha = 1;
      if (running) raf = requestAnimationFrame(draw);
    };
    resize();
    window.addEventListener('resize', resize);
    if (reduceMotion) { draw(); return; }
    new IntersectionObserver(([e]) => {
      running = e.isIntersecting && !document.hidden;
      cancelAnimationFrame(raf);
      if (running) draw();
    }).observe(canvas);
    document.addEventListener('visibilitychange', () => {
      running = !document.hidden;
      cancelAnimationFrame(raf);
      if (running) draw();
    });
  });

  // ---------- Inclinação 3D ----------
  if (finePointer && !reduceMotion) {
    $$('[data-tilt]').forEach((el) => {
      const area = el.closest('.hero-visuals, .eh-visual') || el;
      area.addEventListener('pointermove', (e) => {
        const r = area.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 12}deg)`;
      });
      area.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  // ---------- Eventos: datas, eventos passados ----------
  // Atualiza a data exibida para a próxima sessão (caso o site não tenha sido gerado de novo)
  $$('[data-event], [data-next-date]').forEach((el) => {
    const sessions = parseSessions(el.dataset.sessions);
    if (!sessions.length) return;
    const ns = nextSession(sessions);
    if (!ns) { if (el.hasAttribute('data-event')) el.classList.add('is-past'); return; }
    const [y, m, d] = ns.start.split('-');
    const day = $('[data-day]', el), month = $('[data-month]', el), weekday = $('[data-weekday]', el), count = $('[data-countdown]', el);
    if (day) day.textContent = d;
    if (month) month.textContent = MONTHS[Number(m) - 1] + (month.hasAttribute('data-with-year') ? ` ${y}` : '');
    if (weekday) weekday.textContent = WEEKDAYS[new Date(+y, +m - 1, +d).getDay()] + (ns.place ? ` · ${ns.place}` : '');
    if (count) count.dataset.countdown = ns.start;
  });

  // Contagem regressiva
  $$('[data-countdown]').forEach((el) => {
    const n = daysUntil(el.dataset.countdown);
    const long = el.hasAttribute('data-countdown-long');
    if (n > 1) el.innerHTML = `<b>${n}</b> dias ${long ? 'para o evento' : '<small>para o evento</small>'}`;
    else if (n === 1) el.innerHTML = `<b>Amanhã!</b>${long ? '' : ' <small>não fique de fora</small>'}`;
    else if (n === 0) el.innerHTML = `<b>É hoje!</b>${long ? '' : ' <small>corre que ainda dá tempo</small>'}`;
    else el.innerHTML = '<b>Em andamento</b>';
  });

  // Página de evento
  const evPage = $('[data-event-page]');
  if (evPage) {
    const sessions = parseSessions(evPage.dataset.sessions);
    if (sessions.length && !nextSession(sessions)) $('[data-past-banner]')?.removeAttribute('hidden');
    let marked = false;
    $$('[data-session-end]').forEach((li) => {
      const status = $('[data-session-status]', li);
      if (li.dataset.sessionEnd < todayISO) { li.classList.add('is-past'); if (status) status.textContent = 'Realizado'; }
      else if (!marked) { marked = true; li.classList.add('is-next'); if (status) status.textContent = 'Próxima data'; }
    });
    const mainCta = $('[data-main-cta]');
    const sticky = $('[data-sticky-cta]');
    if (mainCta && sticky) {
      new IntersectionObserver(([e]) => sticky.classList.toggle('is-visible', !e.isIntersecting && e.boundingClientRect.top < 0)).observe(mainCta);
    }
  }

  // ---------- Hero slider ----------
  const hero = $('[data-hero]');
  if (hero) {
    const slides = $$('[data-slide]', hero);
    const visuals = $$('[data-visual]', hero);
    const dots = $$('[data-dot]', hero);
    const DURATION = 7000;
    hero.style.setProperty('--slide-ms', DURATION + 'ms');
    let index = 0, timer = null, paused = false;
    const go = (i) => {
      const next = (i + slides.length) % slides.length;
      if (next === index) return;
      const prev = slides[index];
      prev.classList.add('is-leaving');
      setTimeout(() => prev.classList.remove('is-active', 'is-leaving'), 380);
      prev.setAttribute('aria-hidden', 'true');
      visuals[index]?.classList.remove('is-active');
      dots[index]?.classList.remove('is-active');
      index = next;
      setTimeout(() => {
        slides[index].classList.add('is-active');
        slides[index].removeAttribute('aria-hidden');
      }, 300);
      visuals[index]?.classList.add('is-active');
      // reinicia a barra de progresso
      const dot = dots[index];
      if (dot) { dot.classList.remove('is-active'); void dot.offsetWidth; dot.classList.add('is-active'); }
      schedule();
    };
    const schedule = () => {
      clearTimeout(timer);
      if (paused) return;
      timer = setTimeout(() => go(index + 1), DURATION);
    };
    const setPaused = (p) => { paused = p; hero.classList.toggle('is-paused', p); if (p) clearTimeout(timer); else schedule(); };
    $('[data-next]', hero)?.addEventListener('click', () => go(index + 1));
    $('[data-prev]', hero)?.addEventListener('click', () => go(index - 1));
    dots.forEach((d, i) => d.addEventListener('click', () => go(i)));
    // Loop contínuo: só pausa quando a aba não está visível
    document.addEventListener('visibilitychange', () => setPaused(document.hidden));
    let sx = null;
    hero.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', (e) => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
      sx = null;
    });
    schedule();
  }

  // ---------- Carrossel ----------
  $$('[data-carousel]').forEach((c) => {
    const track = $('[data-track]', c);
    const prev = $('[data-c-prev]', c), next = $('[data-c-next]', c);
    const update = () => {
      const max = track.scrollWidth - track.clientWidth - 2;
      c.classList.toggle('no-scroll', max <= 0);
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max;
    };
    const step = () => { const card = track.querySelector('.event-card:not(.is-past)'); return card ? card.offsetWidth + 22 : track.clientWidth; };
    prev?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    next?.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  // ---------- Filtro e busca de eventos ----------
  const grid = $('[data-event-grid]');
  if (grid) {
    const cards = $$('[data-event]', grid).filter((c) => !c.classList.contains('is-past'));
    const input = $('[data-event-search]');
    const chips = $$('[data-filter]');
    const results = $('[data-results]');
    const empty = $('[data-empty]');
    const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    let filter = 'all';
    const params = new URLSearchParams(location.search);
    if (params.get('q') && input) input.value = params.get('q');
    if (params.get('categoria')) filter = params.get('categoria');

    // contagem por categoria (sem eventos passados)
    chips.forEach((chip) => {
      const f = chip.dataset.filter;
      const n = cards.filter((c) => f === 'all' || c.dataset.category === f).length;
      const span = $('span', chip);
      if (span) span.textContent = n;
      if (n === 0 && f !== 'all') chip.hidden = true;
    });

    const apply = (animate) => {
      const q = norm(input?.value || '');
      let k = 0;
      cards.forEach((card) => {
        const ok = (filter === 'all' || card.dataset.category === filter) && (!q || norm(card.dataset.search).includes(q));
        card.classList.toggle('is-filtered', !ok);
        if (ok && animate && !reduceMotion) {
          card.classList.remove('anim-in');
          card.style.setProperty('--k', k++);
          void card.offsetWidth;
          card.classList.add('anim-in');
        }
      });
      const visible = cards.filter((c) => !c.classList.contains('is-filtered')).length;
      if (results) results.textContent = visible === 1 ? '1 item encontrado' : `${visible} itens encontrados`;
      if (empty) empty.hidden = visible > 0;
      chips.forEach((c) => c.classList.toggle('is-active', c.dataset.filter === filter));
    };
    chips.forEach((chip) => chip.addEventListener('click', () => { filter = chip.dataset.filter; apply(true); }));
    let t;
    input?.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => apply(true), 120); });
    apply(false);
  }

  // ---------- Galeria de fotos do evento + tela de ampliação ----------
  const gallery = $('[data-gallery]');
  const lightbox = $('[data-lightbox]');
  if (gallery) {
    const slides = $$('[data-g-slide]', gallery);
    const thumbs = $$('[data-g-thumb]', gallery);
    const current = $('[data-g-current]', gallery);
    const lbImgs = lightbox ? $$('[data-lb-img]', lightbox) : [];
    const lbCaption = lightbox && $('[data-lb-caption]', lightbox);
    const labels = thumbs.length ? thumbs.map((t) => t.getAttribute('aria-label')) : lbImgs.map((i) => i.alt);
    let index = 0;
    const show = (i) => {
      index = (i + slides.length) % slides.length;
      slides.forEach((s, k) => {
        const on = k === index;
        s.classList.toggle('is-active', on);
        s.toggleAttribute('aria-hidden', !on);
        const btn = $('[data-g-open]', s);
        if (btn) btn.tabIndex = on ? 0 : -1;
      });
      thumbs.forEach((t, k) => { t.classList.toggle('is-active', k === index); t.setAttribute('aria-selected', String(k === index)); });
      lbImgs.forEach((img, k) => img.classList.toggle('is-active', k === index));
      if (current) current.textContent = index + 1;
      if (lbCaption) lbCaption.textContent = labels[index] || '';
    };
    const step = (d) => { gallery.classList.add('was-used'); show(index + d); };
    $('[data-g-prev]', gallery)?.addEventListener('click', () => step(-1));
    $('[data-g-next]', gallery)?.addEventListener('click', () => step(1));
    thumbs.forEach((t, k) => t.addEventListener('click', () => { gallery.classList.add('was-used'); show(k); }));

    // Deslizar o dedo para trocar a foto
    const addSwipe = (el) => {
      let sx = null;
      el.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
      el.addEventListener('touchend', (e) => {
        if (sx === null || slides.length < 2) return;
        const dx = e.changedTouches[0].clientX - sx;
        if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
        sx = null;
      });
    };
    addSwipe($('.g-stage', gallery));

    if (lightbox && typeof lightbox.showModal === 'function') {
      const open = (i) => {
        show(i);
        lightbox.showModal();
        document.body.classList.add('lb-open');
      };
      const close = () => lightbox.close();
      lightbox.addEventListener('close', () => document.body.classList.remove('lb-open'));
      $$('[data-g-open]', gallery).forEach((b) => b.addEventListener('click', () => open(Number(b.dataset.gOpen))));
      $('[data-lb-close]', lightbox)?.addEventListener('click', close);
      $('[data-lb-prev]', lightbox)?.addEventListener('click', () => step(-1));
      $('[data-lb-next]', lightbox)?.addEventListener('click', () => step(1));
      // clicar fora da imagem fecha
      lightbox.addEventListener('click', (e) => { if (e.target === lightbox || e.target.classList.contains('lb-stage')) close(); });
      lightbox.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') step(1);
        if (e.key === 'ArrowLeft') step(-1);
      });
      addSwipe(lightbox);
    }
    gallery.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    });
  }

  // ---------- Copiar, compartilhar, agenda ----------
  $$('[data-copy]').forEach((btn) => btn.addEventListener('click', async () => {
    if (await copyText(btn.dataset.copy)) toast('Endereço copiado!');
  }));

  $$('[data-share]').forEach((btn) => btn.addEventListener('click', async () => {
    const data = { title: btn.dataset.title || document.title, url: location.href };
    if (navigator.share) { try { await navigator.share(data); } catch { /* cancelado */ } return; }
    if (await copyText(location.href)) toast('Link copiado! Agora é só colar e enviar.');
  }));

  $$('[data-ics]').forEach((btn) => btn.addEventListener('click', () => {
    const info = JSON.parse(btn.dataset.ics);
    const fmt = (iso) => iso.replace(/-/g, '');
    const plusOne = (iso) => { const [y, m, d] = iso.split('-').map(Number); const dt = new Date(y, m - 1, d + 1); return `${dt.getFullYear()}${String(dt.getMonth() + 1).padStart(2, '0')}${String(dt.getDate()).padStart(2, '0')}`; };
    const escIcs = (s) => String(s).replace(/[\\;,]/g, (c) => '\\' + c).replace(/\n/g, '\\n');
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const events = info.sessions.filter((s) => s.end >= todayISO);
    const list = events.length ? events : info.sessions;
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Banca Martins//Eventos//PT-BR', 'CALSCALE:GREGORIAN'];
    list.forEach((s, i) => {
      lines.push('BEGIN:VEVENT', `UID:${fmt(s.start)}-${i}-${location.pathname.replace(/\W/g, '')}@bancamartinsguaxupe.com.br`, `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${fmt(s.start)}`, `DTEND;VALUE=DATE:${plusOne(s.end)}`,
        `SUMMARY:${escIcs(info.title + (s.place ? ' - ' + s.place : ''))}`, `LOCATION:${escIcs(s.place || info.location)}`,
        `DESCRIPTION:${escIcs('Ingressos na Banca Martins: ' + info.url)}`, `URL:${info.url}`, 'END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${info.title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-')}.ics`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Evento pronto para adicionar à sua agenda');
  }));

  // ---------- Formulários → WhatsApp ----------
  const openWa = (number, text) => window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');

  const askForm = $('[data-ask-form]');
  askForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const items = $$('input[name="interesse"]:checked', askForm).map((i) => i.value);
    const title = askForm.titulo.value.trim();
    const hint = $('[data-ask-hint]', askForm);
    if (!items.length && !title) { hint?.classList.add('is-error'); return; }
    hint?.classList.remove('is-error');
    let msg = 'Olá, Banca Martins! Vim pelo site e quero saber mais sobre';
    msg += items.length ? `: ${items.join(', ')}.` : ' um título.';
    if (title) msg += ` Procuro: ${title}.`;
    openWa(askForm.dataset.wa, msg);
  });

  // ---------- Mapa sob demanda ----------
  $$('[data-map]').forEach((box) => {
    $('[data-map-load]', box)?.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = box.dataset.src;
      iframe.title = 'Mapa: localização da Banca Martins';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      box.appendChild(iframe);
      $('.map-placeholder', box)?.remove();
    });
  });

  // ---------- Aberto agora? ----------
  const status = $$('[data-open-status]');
  if (status.length) {
    let now;
    try {
      const p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
      const get = (t) => p.find((x) => x.type === t)?.value;
      now = { day: get('weekday'), min: (Number(get('hour')) % 24) * 60 + Number(get('minute')) };
    } catch { const d = new Date(); now = { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()], min: d.getHours() * 60 + d.getMinutes() }; }
    const close = now.day === 'Sun' ? 13 * 60 : 22 * 60;
    const open = now.min >= 8 * 60 && now.min < close;
    status.forEach((el) => {
      el.textContent = open ? `Aberto agora · fecha às ${close / 60}h` : 'Fechado agora · abre às 8h';
      el.classList.add(open ? 'is-open' : 'is-closed');
    });
  }
})();
