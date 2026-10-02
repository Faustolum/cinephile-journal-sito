/* The Cinephile Journal — animazioni (GSAP + ScrollTrigger + SplitText)
   Regola: le animazioni accompagnano lo scorrimento, non lo comandano mai.
   Niente sezioni bloccate, niente scorrimento orizzontale forzato, scroll nativo del browser. */
(() => {
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mouse = matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- grana pellicola ---------- */
  (() => {
    const c = document.createElement("canvas"); c.width = c.height = 180;
    const x = c.getContext("2d"), d = x.createImageData(180, 180);
    for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0); root.style.setProperty("--noise", `url(${c.toDataURL()})`);
  })();

  /* ---------- menu: si apre a cerchio dal pulsante, si chiude toccando una voce o con Esc ---------- */
  const burger = document.querySelector(".burger"), menu = document.getElementById("menu");
  const setMenu = open => {
    if (open && burger) { const r = burger.getBoundingClientRect(); menu.style.setProperty("--mx", r.left + r.width / 2 + "px"); menu.style.setProperty("--my", r.top + r.height / 2 + "px"); }
    root.classList.toggle("menu-open", open);
    burger && burger.setAttribute("aria-expanded", open);
    burger && burger.setAttribute("aria-label", open ? "Chiudi il menu" : "Apri il menu");
  };
  if (burger && menu) {
    burger.addEventListener("click", () => setMenu(!root.classList.contains("menu-open")));
    menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setMenu(false)));
    addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });
    addEventListener("pageshow", () => setMenu(false));   // tornando indietro il menu è sempre chiuso
  }

  /* ---------- navigazione: vetro, si nasconde scendendo e ricompare salendo ---------- */
  const nav = document.querySelector(".nav");
  if (nav) {
    let last = 0;
    addEventListener("scroll", () => {
      const y = scrollY;
      nav.classList.toggle("scrolled", y > 40);
      nav.classList.toggle("hide", y > last && y > 400 && !root.classList.contains("menu-open"));
      last = y;
    }, { passive: true });
  }

  const hasGsap = window.gsap && window.ScrollTrigger && window.SplitText;
  if (reduced || !hasGsap) { root.classList.add("reduced"); return; }

  gsap.registerPlugin(ScrollTrigger, SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });
  const ease = "expo.out";

  document.fonts.ready.then(() => ScrollTrigger.refresh());
  (() => {

    /* titolo d'apertura: lettere che ruotano in 3D e si mettono a fuoco */
    document.querySelectorAll("[data-chars]").forEach(el => {
      SplitText.create(el, { type: "chars,words", autoSplit: true, onSplit(self) {
        el.style.visibility = "visible";
        return gsap.from(self.chars, { yPercent: 60, rotateX: -90, opacity: 0, transformOrigin: "50% 100% -30px",
          duration: 0.8, ease, stagger: { each: 0.018, from: "start" } });
      } });
    });

    /* titoli di sezione: righe che salgono da una maschera */
    document.querySelectorAll("[data-split]").forEach(el => {
      const inHero = el.closest(".hero, .a-hero");
      let played = false;
      SplitText.create(el, { type: "words,lines", mask: "lines", linesClass: "line", autoSplit: true,
        onSplit(self) {
          el.style.visibility = "visible";
          if (played) return;
          return gsap.from(self.lines, {
            yPercent: 110, duration: 1, ease, stagger: 0.07, delay: inHero ? 0.1 : 0,
            onComplete: () => { played = true; },
            scrollTrigger: inHero ? null : { trigger: el, start: "top 95%" }
          });
        }
      });
    });

    /* elementi che compaiono: salgono, si raddrizzano e si mettono a fuoco */
    ScrollTrigger.batch("[data-reveal]", {
      start: "top 97%",
      onEnter: els => gsap.to(els.filter(e => !e.closest(".hero, .a-hero")), { opacity: 1, y: 0, duration: 0.8, ease, stagger: 0.06, overwrite: true })
    });
    document.querySelectorAll(".hero [data-reveal], .a-hero [data-reveal]").forEach(el =>
      gsap.to(el, { opacity: 1, y: 0, duration: 0.6, ease, delay: 0.05 + (+el.dataset.reveal || 0) * 0.6 }));

    /* hero: zoom d'ingresso, parallasse leggera e (col mouse) profondità */
    document.querySelectorAll(".hero-media").forEach(m => {
      const img = m.querySelector("img"), sec = m.parentElement;
      gsap.fromTo(img, { scale: 1.12 }, { scale: 1.02, duration: 2.2, ease });
      gsap.to(m, { yPercent: 12, ease: "none", scrollTrigger: { trigger: sec, start: "top top", end: "bottom top", scrub: true } });
      if (mouse) {
        const xTo = gsap.quickTo(img, "x", { duration: 1.2, ease: "power3" }), yTo = gsap.quickTo(img, "y", { duration: 1.2, ease: "power3" });
        sec.addEventListener("mousemove", e => { xTo((e.clientX / innerWidth - 0.5) * -24); yTo((e.clientY / innerHeight - 0.5) * -16); });
      }
    });

    /* locandine "al cinema": arrivano come un mazzo di biglietti che si apre */
    document.querySelectorAll(".showing-grid").forEach(g => {
      const items = [...g.children], mid = (items.length - 1) / 2;
      gsap.from(items, { y: 120, x: (i) => (mid - i) * 40, rotate: (i) => (i - mid) * 5, opacity: 0, scale: 0.9, duration: 1.2, ease, stagger: 0.06,
        scrollTrigger: { trigger: g, start: "top 90%" } });
    });

    /* immagini negli articoli: apertura morbida */
    gsap.utils.toArray("[data-clip]").forEach(f => {
      const img = f.querySelector("img"), st = { trigger: f, start: "top 95%" };
      gsap.fromTo(f, { clipPath: "inset(6% 4% 6% 4% round 22px)" }, { clipPath: "inset(0% 0% 0% 0% round 22px)", ease: "power3.out", duration: 1.1, scrollTrigger: st });
      if (img) gsap.fromTo(img, { scale: 1.1 }, { scale: 1, ease: "power3.out", duration: 1.3, scrollTrigger: st });
    });

    /* citazione: parole una alla volta */
    document.querySelectorAll(".pull").forEach(el => {
      SplitText.create(el, { type: "words", mask: "words", autoSplit: true, onSplit: self =>
        gsap.from(self.words, { yPercent: 100, duration: 0.9, ease, stagger: 0.04, scrollTrigger: { trigger: el, start: "top 90%" } }) });
    });

    /* numeri che contano */
    document.querySelectorAll("[data-count]").forEach(el => {
      const n = { v: 0 }, end = +el.dataset.count;
      gsap.to(n, { v: end, duration: 2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" },
        onUpdate: () => el.textContent = Math.round(n.v).toLocaleString("it-IT") });
    });

    /* barra di lettura */
    const bar = document.querySelector(".progress");
    if (bar) gsap.to(bar, { scaleX: 1, ease: "none", scrollTrigger: { trigger: "article", start: "top top", end: "bottom bottom", scrub: true } });

    /* merch: leggero parallasse */
    document.querySelectorAll(".mt-art .mock, .product-art .mock").forEach(m => gsap.fromTo(m, { y: 24 }, { y: -24, ease: "none", scrollTrigger: { trigger: m, scrub: true } }));

    ScrollTrigger.refresh();
  })();

  if (mouse) {
    /* schede: inclinazione 3D e riflesso di luce sotto il mouse */
    document.querySelectorAll(".rcard-media, .ticket-media").forEach(m => {
      const card = m.closest("a");
      const rx = gsap.quickTo(m, "rotationX", { duration: 0.6, ease: "power3" }), ry = gsap.quickTo(m, "rotationY", { duration: 0.6, ease: "power3" });
      gsap.set(m, { transformPerspective: 900 });
      card.addEventListener("mousemove", e => {
        const r = m.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        rx((0.5 - py) * 8); ry((px - 0.5) * 10);
        m.style.setProperty("--gx", px * 100 + "%"); m.style.setProperty("--gy", py * 100 + "%");
      });
      card.addEventListener("mouseleave", () => { rx(0); ry(0); });
    });
    /* pulsanti magnetici */
    document.querySelectorAll("[data-magnetic]").forEach(b => {
      const xTo = gsap.quickTo(b, "x", { duration: 0.6, ease: "power3" }), yTo = gsap.quickTo(b, "y", { duration: 0.6, ease: "power3" });
      b.addEventListener("mousemove", e => { const r = b.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * 0.2); yTo((e.clientY - r.top - r.height / 2) * 0.3); });
      b.addEventListener("mouseleave", () => { xTo(0); yTo(0); });
    });
  }
})();

/* ---------- ricerca istantanea (l'indice si scarica solo alla prima apertura) ---------- */
(() => {
  const root = document.documentElement, box = document.getElementById("search"), btn = document.querySelector(".search-btn");
  if (!box || !btn) return;
  const input = box.querySelector("input"), out = box.querySelector(".search-results");
  let data = null, sel = -1;
  const plain = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const load = () => data ? Promise.resolve(data) : fetch("cerca.json").then(r => r.json()).then(d => (data = d));
  const open = (q) => { root.classList.add("search-open"); load().then(() => { if (q != null) input.value = q; run(); }); setTimeout(() => input.focus(), 60); };
  const close = () => { root.classList.remove("search-open"); btn.focus(); };
  const mark = (t, words) => { let h = esc(t); words.forEach(w => { if (w.length < 2) return; const i = plain(h).indexOf(w); if (i >= 0) h = h.slice(0, i) + "<mark>" + h.slice(i, i + w.length) + "</mark>" + h.slice(i + w.length); }); return h; };
  function run() {
    const q = plain(input.value.trim()); sel = -1;
    if (!data) return;
    if (!q) { out.innerHTML = data.slice(0, 6).map(d => row(d)).join(""); return; }
    const words = q.split(/\s+/);
    const hits = data.map(d => { const t = plain(d.t); let s = 0;
        for (const w of words) { if (!d.x.includes(w)) return null; s += t.startsWith(w) ? 5 : t.includes(w) ? 3 : 1; } return [s, d]; })
      .filter(Boolean).sort((a, b) => b[0] - a[0]).slice(0, 12).map(x => x[1]);
    out.innerHTML = hits.length ? hits.map(d => row(d, words)).join("") : `<p class="search-empty">Nessun articolo trovato per “${esc(input.value)}”. Prova con il titolo originale o con il nome del regista.</p>`;
  }
  const row = (d, w) => `<a href="${d.u}"><img src="${d.i}" alt="" loading="lazy"><div><div class="r-t">${w ? mark(d.t, w) : esc(d.t)}</div><div class="r-m">${esc(d.k)} · ${esc(d.dt)}</div></div></a>`;
  btn.addEventListener("click", () => open());
  box.querySelector(".search-close").addEventListener("click", close);
  box.addEventListener("click", e => { if (e.target === box || e.target.classList.contains("wrap")) close(); });
  input.addEventListener("input", run);
  addEventListener("keydown", e => {
    if (e.key === "/" && !root.classList.contains("search-open") && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); open(); }
    if (!root.classList.contains("search-open")) return;
    const links = [...out.querySelectorAll("a")];
    if (e.key === "Escape") close();
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(0, Math.min(links.length - 1, sel + (e.key === "ArrowDown" ? 1 : -1))); links.forEach((l, i) => l.classList.toggle("sel", i === sel)); links[sel] && links[sel].scrollIntoView({ block: "nearest" }); }
    if (e.key === "Enter" && links.length) { e.preventDefault(); location.href = (links[sel] || links[0]).href; }
  });
  const q = new URLSearchParams(location.search).get("cerca");   // link dai motori di ricerca: /?cerca=…
  if (q) open(q);
})();

/* ---------- sezioni lunghe: 24 articoli alla volta ---------- */
document.querySelectorAll(".s-grid[data-more]").forEach(g => {
  const cards = [...g.children], step = 24; let shown = step;
  cards.forEach((c, i) => c.classList.toggle("is-hidden", i >= shown));
  const wrap = document.createElement("div"); wrap.className = "more-btn";
  wrap.innerHTML = `<button class="btn ghost" type="button">Mostra altri articoli</button>`;
  g.after(wrap);
  const b = wrap.querySelector("button");
  b.addEventListener("click", () => { shown += step; cards.forEach((c, i) => { if (i < shown && c.classList.contains("is-hidden")) { c.classList.remove("is-hidden"); c.style.opacity = 1; c.style.transform = "none"; } }); if (shown >= cards.length) wrap.remove(); });
});
