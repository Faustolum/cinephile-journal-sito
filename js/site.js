/* The Cinephile Journal — animazioni (GSAP + ScrollTrigger + SplitText + Lenis) */
(() => {
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- grana pellicola: piccola texture generata una volta ---------- */
  (() => {
    const c = document.createElement("canvas"); c.width = c.height = 180;
    const x = c.getContext("2d"), d = x.createImageData(180, 180);
    for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0); root.style.setProperty("--noise", `url(${c.toDataURL()})`);
  })();

  /* ---------- menu telefono ---------- */
  const burger = document.querySelector(".burger");
  if (burger) burger.addEventListener("click", () => {
    const open = root.classList.toggle("menu-open");
    burger.setAttribute("aria-expanded", open);
    if (window.__lenis) open ? __lenis.stop() : __lenis.start();
  });

  /* ---------- scorrimento orizzontale col trascinamento (biglietti) ---------- */
  document.querySelectorAll("[data-drag]").forEach(el => {
    let down = false, sx = 0, sl = 0, moved = false;
    el.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") return; down = true; moved = false; sx = e.clientX; sl = el.scrollLeft; });
    addEventListener("pointermove", e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 5) { moved = true; el.classList.add("dragging"); } el.scrollLeft = sl - dx; });
    addEventListener("pointerup", () => { down = false; setTimeout(() => el.classList.remove("dragging"), 0); });
    el.addEventListener("click", e => { if (moved) e.preventDefault(); }, true);
  });

  const hasGsap = window.gsap && window.ScrollTrigger && window.SplitText;
  if (reduced || !hasGsap) { root.classList.add("reduced"); root.classList.remove("intro"); initNav(null); return; }

  gsap.registerPlugin(ScrollTrigger, SplitText);
  gsap.config({ force3D: true });
  ScrollTrigger.config({ ignoreMobileResize: true });
  const ease = "expo.out";

  /* ---------- scorrimento morbido (mouse/trackpad; il touch resta nativo) ---------- */
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false });
  window.__lenis = lenis;
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
    const t = document.querySelector(a.getAttribute("href")); if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -70, duration: 1.4 }); }
  }));
  initNav(lenis);

  /* ---------- conto alla rovescia da proiettore (prima pagina della sessione) ---------- */
  const introDone = new Promise(resolve => {
    if (!root.classList.contains("intro")) return resolve();
    try { sessionStorage.setItem("tcj-intro", "1"); } catch (e) {}
    lenis.stop();
    const L = document.createElement("div"); L.className = "leader";
    L.innerHTML = `<div class="ring"><div class="sweep"></div><div class="cross"></div><div class="num">3</div></div><div class="label">The Cinephile Journal presenta</div><button class="skip">Salta</button>`;
    document.body.appendChild(L);
    const num = L.querySelector(".num"), sweep = L.querySelector(".sweep"), st = { a: 0 };
    const tl = gsap.timeline({ onComplete: end });
    [3, 2, 1].forEach((n, i) => {
      tl.call(() => { num.textContent = n; }, null, i * 0.55)
        .fromTo(st, { a: 0 }, { a: 360, duration: 0.55, ease: "none", onUpdate: () => sweep.style.setProperty("--a", st.a + "deg") }, i * 0.55)
        .fromTo(num, { scale: 1.15, opacity: 0.4 }, { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" }, i * 0.55);
    });
    tl.to(L, { opacity: 0, duration: 0.45, ease: "power2.inOut" }, "+=0.05");
    L.querySelector(".skip").addEventListener("click", () => tl.progress(1));
    function end() { L.remove(); root.classList.remove("intro"); lenis.start(); resolve(); }
  });

  /* ---------- pellicola laterale che si srotola con lo scroll ---------- */
  if (matchMedia("(min-width: 1200px)").matches && document.body.dataset.strip) {
    const frames = document.body.dataset.strip.split(",").filter(Boolean);
    if (frames.length) {
      const fs = document.createElement("div"); fs.className = "filmstrip"; fs.setAttribute("aria-hidden", "true");
      const reel = document.createElement("div"); reel.className = "reel";
      const all = []; while (all.length < 60) all.push(...frames);
      reel.innerHTML = all.map(s => `<div class="frame"><img src="${s.replace(/\.jpg$/, "-m.jpg")}" alt="" loading="lazy" decoding="async"></div>`).join("");
      fs.appendChild(reel); document.body.appendChild(fs); document.body.classList.add("has-strip");
      introDone.then(() => gsap.from(fs, { yPercent: -100, duration: 1.6, ease: "expo.inOut" }));
      gsap.to(reel, { y: () => -(reel.scrollHeight - innerHeight), ease: "none",
        scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.6, invalidateOnRefresh: true } });
    }
  }

  document.fonts.ready.then(() => introDone).then(() => {

    /* barre cinemascope che si aprono */
    document.querySelectorAll(".bars").forEach(b => gsap.to(b.children, { scaleY: 0, duration: 1.4, ease: "expo.inOut", delay: 0.05, transformOrigin: i => i ? "bottom" : "top" }));

    /* titoli: righe che salgono da una maschera */
    document.querySelectorAll("[data-split]").forEach(el => {
      const inHero = el.closest(".hero, .a-hero");
      let played = false;
      SplitText.create(el, { type: "words,lines", mask: "lines", linesClass: "line", autoSplit: true,
        onSplit(self) {
          el.style.visibility = "visible";
          if (played) return;
          return gsap.from(self.lines, {
            yPercent: 115, duration: 1.3, ease, stagger: 0.08, delay: inHero ? 0.35 : 0,
            onComplete: () => { played = true; },
            scrollTrigger: inHero ? null : { trigger: el, start: "top 88%" }
          });
        }
      });
    });

    /* elementi che compaiono salendo (raggruppati per fluidità) */
    ScrollTrigger.batch("[data-reveal]", {
      start: "top 90%",
      onEnter: els => gsap.to(els.filter(e => !e.closest(".hero, .a-hero")), { opacity: 1, y: 0, duration: 1.1, ease, stagger: 0.08, overwrite: true })
    });
    document.querySelectorAll(".hero [data-reveal], .a-hero [data-reveal]").forEach(el =>
      gsap.to(el, { opacity: 1, y: 0, duration: 1.2, ease, delay: 0.7 + (+el.dataset.reveal || 0) }));

    /* hero: zoom d'ingresso + parallasse */
    document.querySelectorAll(".hero-media").forEach(m => {
      const img = m.querySelector("img"), sec = m.parentElement;
      gsap.fromTo(img, { scale: 1.16 }, { scale: 1, duration: 2.4, ease: "expo.out" });
      gsap.to(m, { yPercent: 16, ease: "none", scrollTrigger: { trigger: sec, start: "top top", end: "bottom top", scrub: 0.4 } });
      const c = sec.querySelector(".hero-content");
      if (c) gsap.to(c, { yPercent: -24, opacity: 0, ease: "none", scrollTrigger: { trigger: sec, start: "25% top", end: "80% top", scrub: 0.4 } });
    });

    /* manifesto: parole che si illuminano */
    document.querySelectorAll("[data-words]").forEach(el => {
      SplitText.create(el, { type: "words", autoSplit: true, onSplit: self => gsap.fromTo(self.words, { opacity: 0.14 }, {
        opacity: 1, stagger: 0.1, ease: "none",
        scrollTrigger: { trigger: el, start: "top 78%", end: "bottom 50%", scrub: 0.5 } }) });
    });

    /* in primo piano: l'immagine si espande a tutto schermo */
    document.querySelectorAll(".feature").forEach(sec => {
      const media = sec.querySelector(".feature-media"), img = media.querySelector("img"), copy = sec.querySelector(".feature-copy");
      gsap.matchMedia().add({ desk: "(min-width: 961px)", mob: "(max-width: 960px)" }, ctx => {
        const from = ctx.conditions.desk ? "inset(14% 18% 14% 18% round 28px)" : "inset(12% 6% 12% 6% round 20px)";
        const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: "top top", end: "+=120%", pin: true, scrub: 0.8, anticipatePin: 1 } });
        tl.fromTo(media, { clipPath: from }, { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "power2.inOut", duration: 1 }, 0)
          .fromTo(img, { scale: 1.15 }, { scale: 1, ease: "power2.inOut", duration: 1 }, 0)
          .to(copy, { opacity: 1, duration: 0.3 }, 0.72)
          .from(copy.children, { y: 36, stagger: 0.05, duration: 0.3 }, 0.72);
      });
    });

    /* binario orizzontale (desktop, solo se gli articoli superano lo schermo) */
    document.querySelectorAll(".rail").forEach(sec => {
      const track = sec.querySelector(".rail-track");
      gsap.matchMedia().add("(min-width: 961px)", () => {
        const dist = () => Math.max(0, track.scrollWidth - innerWidth);
        if (dist() < 40) return;
        gsap.to(track, { x: () => -dist(), ease: "none",
          scrollTrigger: { trigger: sec, start: "top top", end: () => "+=" + dist(), pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 } });
      });
      gsap.from(track.children, { y: 70, opacity: 0, duration: 1.1, ease, stagger: 0.07, scrollTrigger: { trigger: sec, start: "top 75%" } });
    });

    /* biglietti che entrano a cascata */
    document.querySelectorAll(".showing-track").forEach(t =>
      gsap.from(t.children, { x: 120, opacity: 0, duration: 1.2, ease, stagger: 0.06, scrollTrigger: { trigger: t, start: "top 85%" } }));

    /* immagini con apertura a sipario */
    gsap.utils.toArray("[data-clip]").forEach(f => {
      const img = f.querySelector("img"), st = { trigger: f, start: "top 88%" };
      gsap.fromTo(f, { clipPath: "inset(10% 6% 10% 6% round 22px)" }, { clipPath: "inset(0% 0% 0% 0% round 22px)", ease: "power3.out", duration: 1.4, scrollTrigger: st });
      if (img) gsap.fromTo(img, { scale: 1.15 }, { scale: 1, ease: "power3.out", duration: 1.6, scrollTrigger: st });
    });

    /* citazione: parole una alla volta */
    document.querySelectorAll(".pull").forEach(el => {
      SplitText.create(el, { type: "words", mask: "words", autoSplit: true, onSplit: self =>
        gsap.from(self.words, { yPercent: 100, duration: 1, ease, stagger: 0.05, scrollTrigger: { trigger: el, start: "top 82%" } }) });
    });

    /* numeri che contano */
    document.querySelectorAll("[data-count]").forEach(el => {
      const n = { v: 0 }, end = +el.dataset.count;
      gsap.to(n, { v: end, duration: 2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" },
        onUpdate: () => el.textContent = Math.round(n.v).toLocaleString("it-IT") });
    });

    /* barra di lettura */
    const bar = document.querySelector(".progress");
    if (bar) gsap.to(bar, { scaleX: 1, ease: "none", scrollTrigger: { trigger: "article", start: "top top", end: "bottom bottom", scrub: 0.3 } });

    /* prossimo articolo e merch: leggero parallasse */
    document.querySelectorAll(".next img").forEach(img => gsap.fromTo(img, { yPercent: -10 }, { yPercent: 10, ease: "none", scrollTrigger: { trigger: img.parentElement, scrub: 0.5 } }));
    document.querySelectorAll(".mt-art .mock, .product-art .mock").forEach(m => gsap.fromTo(m, { y: 30 }, { y: -30, ease: "none", scrollTrigger: { trigger: m, scrub: 0.6 } }));

    ScrollTrigger.refresh();
  });

  /* ---------- pulsanti magnetici e immagine che segue il cursore ---------- */
  if (matchMedia("(hover: hover)").matches) {
    document.querySelectorAll("[data-magnetic]").forEach(b => {
      const xTo = gsap.quickTo(b, "x", { duration: 0.6, ease: "power3" }), yTo = gsap.quickTo(b, "y", { duration: 0.6, ease: "power3" });
      b.addEventListener("mousemove", e => { const r = b.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * 0.25); yTo((e.clientY - r.top - r.height / 2) * 0.35); });
      b.addEventListener("mouseleave", () => { xTo(0); yTo(0); });
    });
    const list = document.querySelector(".index-list"), ci = document.querySelector(".cursor-img");
    if (list && ci) {
      const xTo = gsap.quickTo(ci, "x", { duration: 0.7, ease: "power3" }), yTo = gsap.quickTo(ci, "y", { duration: 0.7, ease: "power3" });
      const imgs = [...ci.querySelectorAll("img")];
      list.addEventListener("mousemove", e => { xTo(e.clientX); yTo(e.clientY); });
      list.querySelectorAll(".index-row").forEach((row, i) => row.addEventListener("mouseenter", () => imgs.forEach((im, k) => im.classList.toggle("on", k === i))));
      list.addEventListener("mouseenter", () => gsap.to(ci, { opacity: 1, scale: 1, duration: 0.5, ease: "power3" }));
      list.addEventListener("mouseleave", () => gsap.to(ci, { opacity: 0, scale: 0.8, duration: 0.4, ease: "power3" }));
    }
  }

  /* ---------- navigazione: vetro, si nasconde scendendo ---------- */
  function initNav(lenis) {
    const nav = document.querySelector(".nav"); if (!nav) return;
    let last = 0;
    const onScroll = y => { nav.classList.toggle("scrolled", y > 40); nav.classList.toggle("hide", y > last && y > 300 && !root.classList.contains("menu-open")); last = y; };
    if (lenis) lenis.on("scroll", e => onScroll(e.scroll)); else addEventListener("scroll", () => onScroll(scrollY), { passive: true });
  }
})();
